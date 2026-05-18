import { useState, useEffect, useRef, useCallback } from 'react';
import { Box } from '@mui/material';
import { useLogs } from '../core/useLogs';
import { BData } from '../../../../types';
import { LOG_PATHS, ERROR_SOURCE_REGEX, RecurringError } from './types';
import ViewerHeader from './ViewerHeader';
import RecurringErrorsPanel from './RecurringErrorsPanel';
import NewErrorsPanel from './NewErrorsPanel';
import LevelFilter from './LevelFilter';
import LogSectionList from './LogSectionList';

type StitchProps = {
  bet?: BData;
};

export default function StitchLogViewer({ bet }: Readonly<StitchProps>) {
  const [logBasePath, setLogBasePath] = useState(LOG_PATHS.DIST);
  const [logFilePath, setLogFilePath] = useState('');
  const [compatibleLogFiles, setCompatibleLogFiles] = useState<
    { name: string; path: string }[]
  >([]);
  const [isFollowing] = useState(true);
  const [showSection, setShowSection] = useState<string[]>([]); // array of section ids that are expanded
  const [hideIncomplete, setHideIncomplete] = useState(false);
  const [newErrorsExpanded, setNewErrorsExpanded] = useState(true);
  const [errorsExpanded, setErrorsExpanded] = useState(false);
  const [highlightedTarget, setHighlightedTarget] = useState<
    { sectionId: string; lineIdx: string } | undefined
  >(undefined);
  const [dismissedNewErrorSections, setDismissedNewErrorSections] = useState<
    Set<string>
  >(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);
  const navStateRef = useRef<{ navKey: string; errorIdx: number }>({
    navKey: '',
    errorIdx: -1,
  });

  useEffect(() => {
    window.electron.ipcRenderer.detectActiveLogPath().then((path) => {
      setLogBasePath(path);
    });
  }, []);

  useEffect(() => {
    let mounted = true;
    window.electron.ipcRenderer
      .listCompatibleLogFiles(logBasePath)
      .then((files) => {
        if (!mounted) return;
        handleCompatibleFilesLoaded(files);
      });
    return () => {
      mounted = false;
    };
  }, [logBasePath]);

  const handleCompatibleFilesLoaded = (
    files: { name: string; path: string }[],
  ) => {
    setCompatibleLogFiles(files);
    if (!files.length) {
      setLogFilePath('');
      return;
    }
    setLogFilePath((prev) => {
      if (prev && files.some((f) => f.path === prev)) return prev;
      const defaultFile = files.find((f) => f.name === 'custom_logs.log');
      return defaultFile?.path ?? files[0].path;
    });
  };

  const { filter, setFilter, setSearchStr, searchStr, rawLogString } = useLogs({
    bet,
    logBasePath,
    logFilePath: bet ? undefined : logFilePath,
  });

  const activeLevel = Object.keys(filter)[0];

  const handleNavigate = useCallback(
    (error: RecurringError) => {
      const target = findErrorTarget(rawLogString, error, navStateRef, setShowSection);
      if (target) {
        setHighlightedTarget(target);
      }
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          const container = scrollRef.current;
          if (!container) return;
          if (target?.lineIdx !== undefined) {
            const lineEl = container.querySelector(
              `[data-section-id="${target.sectionId}"] [data-line-idx="${target.lineIdx}"]`,
            );
            if (lineEl) {
              lineEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
              return;
            }
          }
          const sectionEl = target
            ? container.querySelector(`[data-section-id="${target.sectionId}"]`)
            : null;
          if (sectionEl)
            sectionEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }),
      );
    },
    [rawLogString],
  );

  const repeatedErrors: RecurringError[] = getRepeatedErrors(rawLogString);
  const newErrors: RecurringError[] = getNewErrors(rawLogString).filter(
    (error) =>
      !error.sectionIds.some((sectionId) =>
        dismissedNewErrorSections.has(sectionId),
      ),
  );

  useEffect(() => {
    if (!showSection.length) return;
    setDismissedNewErrorSections((prev) => {
      const next = new Set(prev);
      let changed = false;
      showSection.forEach((sectionId) => {
        if (!next.has(sectionId)) {
          next.add(sectionId);
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [showSection]);

  useEffect(() => {
    setDismissedNewErrorSections(new Set());
  }, [logBasePath, logFilePath]);

  const sectionStats = calculateSectionErrorStats(rawLogString);
  const isLastSection = () => {
    const lastSection = rawLogString.at(-1)?.[0]?._id;
    return showSection[0] === lastSection;
  };
  useEffect(() => {
    if (isFollowing && scrollRef.current && isLastSection() && !searchStr) {
      console.log('Auto-scrolling to bottom');
      //   scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [rawLogString, isFollowing]);

  const filteredSections = rawLogString.filter(
    (largeSection) =>
      !hideIncomplete ||
      !largeSection[0]?._id.replace(/__\d+$/, '').endsWith('_incomplete'),
  );
  const sectionsToRender = (() => {
    if (!bet) return filteredSections;

    const byId = new Map(rawLogString.map((section) => [section[0]?._id, section]));
    const withIncomplete = [...filteredSections];
    const seen = new Set(withIncomplete.map((s) => s[0]?._id));

    for (const section of filteredSections) {
      const sectionId = section[0]?._id ?? '';
      const baseId = sectionId
        .replace(/__\d+$/, '')
        .replace(/_incomplete$/, '');
      const incompletePrefix = `${baseId}_incomplete`;

      for (const [id, candidate] of byId.entries()) {
        if (!id || seen.has(id)) continue;
        const normalizedId = id.replace(/__\d+$/, '');
        if (normalizedId.startsWith(incompletePrefix)) {
          withIncomplete.push(candidate);
          seen.add(id);
        }
      }
    }

    return withIncomplete;
  })();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        marginTop: '5vh',
        height: '90vh',
        width: '80%',
        minWidth: 0,
        bgcolor: '#060e20',
        color: '#dee5ff',
        overflow: 'hidden',
      }}
    >
      <ViewerHeader
        logBasePath={logBasePath}
        setLogBasePath={setLogBasePath}
        logFilePath={logFilePath}
        setLogFilePath={setLogFilePath}
        compatibleLogFiles={compatibleLogFiles}
        searchStr={searchStr}
        setSearchStr={setSearchStr}
        hideIncomplete={hideIncomplete}
        setHideIncomplete={setHideIncomplete}
      />

      <Box
        sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
      >
        <NewErrorsPanel
          newErrors={newErrors}
          expanded={newErrorsExpanded}
          setExpanded={setNewErrorsExpanded}
          onNavigate={handleNavigate}
        />

        <RecurringErrorsPanel
          repeatedErrors={repeatedErrors}
          totalErrors={sectionStats.reduce((sum, s) => sum + s.errors, 0)}
          totalWarnings={sectionStats.reduce((sum, s) => sum + s.warnings, 0)}
          expanded={errorsExpanded}
          setExpanded={setErrorsExpanded}
          onNavigate={handleNavigate}
        />

        <LevelFilter activeLevel={activeLevel} setFilter={setFilter} />

        <LogSectionList
          scrollRef={scrollRef}
          filteredSections={sectionsToRender}
          sectionStats={sectionStats}
          rawLogString={rawLogString}
          showSection={showSection}
          setShowSection={setShowSection}
          setFilter={setFilter}
          logBasePath={logBasePath}
          highlightedTarget={highlightedTarget}
          onUserInteract={() => setHighlightedTarget(undefined)}
        />
      </Box>
    </Box>
  );
}
function processErrorLine(
  line: string,
  sectionId: string,
  patternMap: Map<string, { count: number; sectionIds: Set<string> }>,
): void {
  const match = line.match(ERROR_SOURCE_REGEX);
  if (!match || match[4].toLowerCase().includes('taking screenshot')) {
    return;
  }

  const pattern = `${match[1]}:${match[2]} ${match[4].slice(0, 80)}`;
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

function getRepeatedErrors(
  rawLogString: {
    data: string[];
    _id: string;
    eventName?: string;
    betName?: string;
    marketType?: string;
    errors: { lineNum: number; errorType: 'critical' | 'error' | 'warning' }[];
  }[][],
): RecurringError[] {
  const patternMap = new Map<
    string,
    { count: number; sectionIds: Set<string> }
  >();

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

function getNewErrors(
  rawLogString: {
    data: string[];
    _id: string;
    eventName?: string;
    betName?: string;
    marketType?: string;
    errors: { lineNum: number; errorType: 'critical' | 'error' | 'warning' }[];
  }[][],
): RecurringError[] {
  const latestSection = rawLogString.at(-1);
  if (!latestSection?.length) return [];

  const sectionId = latestSection[0]._id;
  const patternMap = new Map<string, number>();

  for (const sub of latestSection) {
    for (const line of sub.data) {
      const match = line.match(ERROR_SOURCE_REGEX);
      if (!match || match[4].toLowerCase().includes('taking screenshot')) {
        continue;
      }
      const pattern = `${match[1]}:${match[2]} ${match[4].slice(0, 80)}`;
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

function calculateSectionErrorStats(
  rawLogString: {
    data: string[];
    _id: string;
    eventName?: string;
    betName?: string;
    marketType?: string;
    errors: { lineNum: number; errorType: 'critical' | 'error' | 'warning' }[];
  }[][],
) {
  let totalErrors = 0;
  let totalWarnings = 0;
  return rawLogString.map((largeSection) => {
    let errors = 0;
    let warnings = 0;
    largeSection.forEach((section) => {
      errors += section.errors.filter((x) => x.errorType === 'error').length;
      warnings += section.errors.filter(
        (x) => x.errorType === 'warning',
      ).length;
    });
    totalErrors += errors;
    totalWarnings += warnings;
    return { errors, warnings };
  });
}
function findErrorTarget(
  rawLogString: {
    data: string[];
    _id: string;
    eventName?: string;
    betName?: string;
    marketType?: string;
    errors: { lineNum: number; errorType: 'critical' | 'error' | 'warning' }[];
  }[][],
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
        const match = line.match(ERROR_SOURCE_REGEX);
        if (!match || match[4].toLowerCase().includes('taking screenshot')) {
          return;
        }
        const linePattern = `${match[1]}:${match[2]} ${match[4].slice(0, 80)}`;
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
