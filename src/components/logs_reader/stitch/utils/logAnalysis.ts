import type React from 'react';
import { BetSection } from '../../core/useLogs';
import { ERROR_SOURCE_REGEX, RecurringError } from '../types';

type ErrorPatternMap = Map<string, { count: number; sectionIds: Set<string> }>;

const buildErrorPattern = (line: string) => {
  const match = line.match(ERROR_SOURCE_REGEX);
  if (!match || match[4].toLowerCase().includes('taking screenshot')) {
    return null;
  }
  return `${match[1]}:${match[2]} ${match[4].slice(0, 80)}`;
};

function processErrorLine(
  line: string,
  sectionId: string,
  patternMap: ErrorPatternMap,
): void {
  const pattern = buildErrorPattern(line);
  if (!pattern) return;

  const existing = patternMap.get(pattern);
  if (existing) {
    existing.count++;
    existing.sectionIds.add(sectionId);
  } else {
    patternMap.set(pattern, {
      count: 1,
      sectionIds: new Set([sectionId]),
    });
  }
}

export function getRepeatedErrors(rawLogString: BetSection[][]): RecurringError[] {
  const patternMap: ErrorPatternMap = new Map();

  for (const largeSection of rawLogString) {
    const sectionId = largeSection[0]?._id || 'unknown';
    for (const sub of largeSection) {
      for (const line of sub.data) {
        processErrorLine(line, sectionId, patternMap);
      }
    }
  }

  return Array.from(patternMap.entries())
    .map(([pattern, v]) => ({
      pattern,
      count: v.count,
      sectionIds: Array.from(v.sectionIds),
    }))
    .sort((a, b) => b.count - a.count);
}

export function getNewErrors(rawLogString: BetSection[][]): RecurringError[] {
  const latestSection = rawLogString.at(-1);
  if (!latestSection?.length) return [];

  const sectionId = latestSection[0]._id;
  const patternMap = new Map<string, number>();

  for (const sub of latestSection) {
    for (const line of sub.data) {
      const pattern = buildErrorPattern(line);
      if (!pattern) continue;
      patternMap.set(pattern, (patternMap.get(pattern) ?? 0) + 1);
    }
  }

  return Array.from(patternMap.entries())
    .map(([pattern, count]) => ({
      pattern,
      count,
      sectionIds: [sectionId],
    }))
    .sort((a, b) => b.count - a.count);
}

export function calculateSectionErrorStats(rawLogString: BetSection[][]) {
  return rawLogString.map((largeSection) => {
    let errors = 0;
    let warnings = 0;
    largeSection.forEach((section) => {
      errors += section.errors.filter((x) => x.errorType === 'error').length;
      warnings += section.errors.filter((x) => x.errorType === 'warning').length;
    });
    return { errors, warnings };
  });
}

export function findErrorTarget(
  rawLogString: BetSection[][],
  error: RecurringError,
  navStateRef: React.MutableRefObject<{
    navKey: string;
    errorIdx: number;
  }>,
  setShowSection: React.Dispatch<React.SetStateAction<string[]>>,
) {
  const matches: { sectionId: string; lineIdx: string }[] = [];
  const scopedSections = [...error.sectionIds].sort().join('|');
  const navKey = `pattern::${error.pattern}::sections::${scopedSections}`;
  const allowedSectionIds = new Set(error.sectionIds);

  rawLogString.forEach((sectionGroup) => {
    const sectionId = sectionGroup[0]?._id;
    if (!sectionId || !allowedSectionIds.has(sectionId)) return;

    sectionGroup.forEach((sub, subIdx) => {
      sub.data.forEach((line, dataIdx) => {
        const linePattern = buildErrorPattern(line);
        if (linePattern !== error.pattern) return;
        matches.push({ sectionId, lineIdx: `${subIdx}-${dataIdx}` });
      });
    });
  });

  if (navStateRef.current.navKey === navKey) {
    navStateRef.current.errorIdx =
      (navStateRef.current.errorIdx + 1) % Math.max(matches.length, 1);
  } else {
    navStateRef.current = { navKey, errorIdx: 0 };
  }

  const target = matches[navStateRef.current.errorIdx];
  if (!target) return undefined;

  const targetSection = rawLogString.find((ls) => ls[0]?._id === target.sectionId);
  const idsToOpen = targetSection ? targetSection.map((s) => s._id) : [target.sectionId];
  setShowSection([target.sectionId, ...idsToOpen]);

  return target;
}
