/* eslint-disable */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BData } from '../../../../types';
import {
  BetSection,
  ErrorContextWindow,
  JsonLogEntry,
  parseJsonLine,
} from './types';
import { lineMatches } from './jsonSearch';

const EVENT = {
  NEW_BET_FOUND: 'bet_discovery.new_bet_found',
  RESTART_PLACING_BET: 'restarting_bet_placement',
  LOGGED_EVENT: 'bet_logged_to_database',
  NO_BET_PREPARATION_RESULTS: 'no_bet_preperation_results',
  CONNECTED_TO_DB: 'database_connection_successful',
  TRADEOUT_STARTED: 'tradeout_execution_initiated',
  TRADEOUT_COMPLETED: 'tradeout_execution_completed',
} as const;

/** Lines of context kept around ERROR/WARNING/CRITICAL lines when lower
 *  levels are filtered out. */
const CONTEXT_LINES = 5;

const isErrorLevel = (entry: JsonLogEntry) =>
  entry.levelname === 'ERROR' || entry.levelname === 'CRITICAL';

const isNewBetSection = (entry: JsonLogEntry) =>
  entry.event === EVENT.NEW_BET_FOUND;

const isRestartSection = (entry: JsonLogEntry) =>
  Boolean(entry.result?.includes(EVENT.RESTART_PLACING_BET));

const isTradeoutStart = (entry: JsonLogEntry) =>
  entry.result.includes(EVENT.TRADEOUT_STARTED);

const isTradeoutComplete = (entry: JsonLogEntry) =>
  entry.result.includes(EVENT.TRADEOUT_COMPLETED);

const startsNewSection = (entry: JsonLogEntry | undefined): boolean =>
  Boolean(
    entry &&
      (isNewBetSection(entry) ||
        isRestartSection(entry) ||
        isTradeoutStart(entry)),
  );

const isLoggedEventEnd = (entry: JsonLogEntry) =>
  entry.result.includes(EVENT.LOGGED_EVENT);

const isNoBetPreparationResult = (entry: JsonLogEntry) =>
  Boolean(entry.result?.includes(EVENT.NO_BET_PREPARATION_RESULTS));

const isConnectedToDb = (entry: JsonLogEntry | undefined) =>
  Boolean(entry?.result.includes(EVENT.CONNECTED_TO_DB));

const makeSectionId = (eventName: string, betName?: string): string => {
  const base = eventName.replace(/\s+/g, '_').toLowerCase();
  return betName
    ? `${base}_${betName.replace(/\s/g, '_').toLowerCase()}`
    : base;
};

type SectionIdentity = {
  id: string;
  eventName: string;
  betName: string;
  marketType: string;
};

const EMPTY_IDENTITY: SectionIdentity = {
  id: '',
  eventName: '',
  betName: '',
  marketType: '',
};

function createSectionAccumulator() {
  const sections: BetSection[] = [];
  let current: BetSection = { data: [], _id: '', errors: [] };
  let recording = false;
  let sectionCount = 1;

  let identity: SectionIdentity = { ...EMPTY_IDENTITY };
  let lastClosed: SectionIdentity = { ...EMPTY_IDENTITY };

  let tradeoutStarted = false;
  let tradeoutCompleted = false;

  const recordError = (entry: JsonLogEntry) => {
    if (entry.levelname === 'WARNING') {
      current.errors.push({
        lineNum: current.data.length - 1,
        errorType: 'warning',
      });
    } else if (isErrorLevel(entry)) {
      current.errors.push({
        lineNum: current.data.length - 1,
        errorType: 'error',
      });
    }
  };

  /** Append a line to the section currently being recorded. */
  const appendLine = (line: string, entry: JsonLogEntry) => {
    if (entry.market_type) {
      identity.marketType = entry.market_type;
    }
    if (isTradeoutStart(entry)) tradeoutStarted = true;
    if (tradeoutStarted && isTradeoutComplete(entry)) tradeoutCompleted = true;

    current.data.push(line);
    recordError(entry);
  };

  return {
    get isRecording() {
      return recording;
    },

    /** A line that arrives before any section has opened (setup noise). */
    pushUnclassified(line: string, entry: JsonLogEntry) {
      sections.push({
        data: [line],
        _id: 'setup',
        errors: isErrorLevel(entry) ? [{ lineNum: 0, errorType: 'error' }] : [],
      });
    },

    /** Begin a new section triggered by this line. */
    open(entry: JsonLogEntry, line: string) {
      recording = true;
      tradeoutStarted = false;
      tradeoutCompleted = false;

      if (isTradeoutStart(entry) || isRestartSection(entry)) {
        // A tradeout/restart continues the identity of whatever section just
        // closed instead of fabricating one from the (absent) bet metadata.
        const strippedId =
          lastClosed.id
            .replace(/__\d+$/, '')
            .replace(/_incomplete$/, '')
            .replace(/_tradeout$/, '') ||
          (isTradeoutStart(entry) ? 'tradeout' : 'restart');
        identity = { ...lastClosed, id: strippedId };
      } else {
        const eventName = entry.event_name ?? '';
        const betName = entry.bet ?? '';
        identity = {
          id: makeSectionId(eventName, betName),
          eventName,
          betName,
          marketType: '',
        };
      }

      current.data.push(`--- BET SECTION ${identity.id} ---`);
      appendLine(line, entry);
    },

    appendLine,

    /** Close the section currently being recorded. */
    close({
      incomplete = false,
      includeEndMarker = false,
    }: {
      incomplete?: boolean;
      includeEndMarker?: boolean;
    }) {
      if (includeEndMarker) {
        current.data.push(
          `--- END BET SECTION ${identity.id} --- ${sectionCount}`,
        );
      }

      current._id = tradeoutCompleted
        ? `${identity.id}_tradeout`
        : incomplete
          ? `${identity.id}_incomplete`
          : identity.id;
      current.eventName = identity.eventName;
      current.betName = identity.betName;
      current.marketType = identity.marketType || undefined;

      lastClosed = { ...identity };
      sectionCount += 1;
      sections.push(current);

      current = { data: [], _id: '', errors: [] };
      recording = false;
      tradeoutStarted = false;
      tradeoutCompleted = false;
    },

    /** Flush whatever's left in progress at EOF and return every section seen. */
    finish(): BetSection[] {
      if (current.data.length > 0) {
        current._id = tradeoutCompleted
          ? `${identity.id}_tradeout`
          : recording
            ? `${identity.id}_incomplete`
            : current._id || 'unclassified';
        current.eventName = identity.eventName;
        current.betName = identity.betName;
        current.marketType = identity.marketType || undefined;
        sections.push(current);
      }
      return sections;
    },
  };
}

function mergeAdjacentSameId(sections: BetSection[]): BetSection[][] {
  const groups: BetSection[][] = [];
  let current: BetSection[] = [];

  for (const section of sections) {
    if (section._id === 'setup') {
      if (current.length === 0 || current[0]._id !== 'setup') {
        if (current.length > 0) groups.push(current);
        section.miniSection = true;
        current = [section];
      } else {
        current.push(section);
      }
      continue;
    }
    if (current.length > 0 && current[0]._id === section._id) {
      section.miniSection = true;
      current.push(section);
    } else {
      if (current.length > 0) groups.push(current);
      section.miniSection = true;
      current = [section];
    }
  }
  if (current.length > 0) groups.push(current);
  return groups;
}

/** Give repeated base ids (e.g. two unrelated "tradeout" groups) unique suffixes. */
function assignUniqueGroupIds(groups: BetSection[][]) {
  const idCounts: Record<string, number> = {};
  for (const group of groups) {
    const baseId = group[0]._id;
    const count = idCounts[baseId] ?? 0;
    idCounts[baseId] = count + 1;
    if (count > 0) {
      const uniqueId = `${baseId}__${count}`;
      for (const section of group) section._id = uniqueId;
    }
  }
}

export function findAllJsonSections(logs: string, activeBet?: BData) {
  const lines = logs.split('\n');
  const acc = createSectionAccumulator();

  for (const [i, line] of lines.entries()) {
    if (!line.trim()) continue;
    const entry = parseJsonLine(line);
    if (!entry) continue;

    if (!acc.isRecording) {
      if (startsNewSection(entry)) {
        acc.open(entry, line);
      } else {
        acc.pushUnclassified(line, entry);
      }
      continue;
    }

    const nextEntry = parseJsonLine(lines[i + 1]);

    if (isLoggedEventEnd(entry)) {
      acc.appendLine(line, entry);
      acc.close({ includeEndMarker: true });
    } else if (isNoBetPreparationResult(entry)) {
      acc.appendLine(line, entry);
      acc.close({ incomplete: true });
    } else if (startsNewSection(nextEntry) || isConnectedToDb(nextEntry)) {
      // The *next* line starts a new section or the bot has restarted, so this section is done. Mark it incomplete because
      // recording never reached a proper end marker.
      acc.appendLine(line, entry);
      acc.close({ incomplete: true });
    } else {
      acc.appendLine(line, entry);
    }
  }

  const merged = mergeAdjacentSameId(acc.finish());
  assignUniqueGroupIds(merged);

  if (!activeBet) return merged;

  const targetEventName = activeBet.bet_info.event_name;
  return merged.filter((group) => group[0].eventName === targetEventName);
}

type LogsProps = {
  bet?: BData;
  logBasePath?: string;
  logFilePath?: string;
  subscribe?: boolean;
};

export const useJsonLogs = ({
  bet,
  logBasePath,
  logFilePath,
  subscribe = true,
}: LogsProps) => {
  const [rawLogString, setRawLogStr] = useState<BetSection[][]>([]);
  const [logSections, setLogSections] = useState<BetSection[][]>([]);
  const [tail, setTail] = useState(false);
  const [filter, setFilter] = useState<{ [key: string]: number }>({ INFO: 0 });
  const [errored, setErrored] = useState(false);
  const [searchStr, setSearchStr] = useState('');
  const hasInitializedErrorBaseline = useRef(false);
  const acknowledgedErrorCountRef = useRef(0);
  const previousDataRef = useRef<string>('');

  useEffect(() => {
    if (!subscribe) return;

    let pending = false;

    const getData = async () => {
      if (bet) {
        let data = await window.electron.ipcRenderer.readLog(
          bet,
          logBasePath,
          logFilePath,
        );
        if (data) {
          setRawLogStr(findAllJsonSections(data, bet));
        }
        let fullLog = await window.electron.ipcRenderer.tailLog(
          undefined,
          logBasePath,
          logFilePath,
        );
        if (fullLog) {
          setLogSections(findAllJsonSections(fullLog));
        }
        return;
      }
      let tailstr = await window.electron.ipcRenderer.tailLog(
        undefined,
        logBasePath,
        logFilePath,
      );
      const sections = findAllJsonSections(tailstr);
      setLogSections(sections);
      setRawLogStr(sections);
    };

    getData();

    const interval = setInterval(async () => {
      if (pending || bet) return; // see note below re: per-bet polling
      pending = true;
      try {
        let tailUpdate = await window.electron.ipcRenderer.tailLog(
          undefined,
          logBasePath,
          logFilePath,
        );
        const sections = findAllJsonSections(tailUpdate);
        const dataStr = JSON.stringify(sections);
        if (dataStr !== previousDataRef.current) {
          previousDataRef.current = dataStr;
          setLogSections(sections);
          setRawLogStr(sections);
        }
      } finally {
        pending = false;
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [logBasePath, logFilePath, bet, subscribe]);

  const LOG_LEVELS = ['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'];

  const filteredLogString = useMemo(() => {
    const activeLevel = Object.keys(filter)[0];
    const levelIdx = LOG_LEVELS.indexOf(activeLevel);
    const allowedLevels =
      levelIdx >= 0 ? LOG_LEVELS.slice(levelIdx) : LOG_LEVELS;

    return rawLogString
      .map((largeSection) =>
        largeSection.map((section) => {
          const lines = section.data;
          const passesLevel: boolean[] = [];
          const errorAnchors: number[] = [];
          let lastLineLevel: string | null = null;

          for (const [i, line] of lines.entries()) {
            const parsed = parseJsonLine(line);
            const level: string | null | undefined =
              parsed?.levelname || lastLineLevel;
            passesLevel.push(!level || allowedLevels.includes(level));
            if (
              parsed &&
              (parsed.levelname === 'ERROR' ||
                parsed.levelname === 'WARNING' ||
                parsed.levelname === 'CRITICAL')
            ) {
              errorAnchors.push(i);
            }
            if (level) lastLineLevel = level;
          }

          // When filtering at WARNING level or above, drop sections that don't
          // contain any error/warning entry entirely.
          if (
            levelIdx >= LOG_LEVELS.indexOf('WARNING') &&
            errorAnchors.length === 0
          ) {
            return { ...section, data: [], errorContext: [] };
          }

          // Context window around every error-level entry.
          const inContext = new Set<number>();
          for (const anchor of errorAnchors) {
            const from = Math.max(0, anchor - CONTEXT_LINES);
            const to = Math.min(lines.length - 1, anchor + CONTEXT_LINES);
            for (let i = from; i <= to; i++) inContext.add(i);
          }

          const hasSearch = searchStr.trim().length > 0;

          const filteredData: string[] = [];
          const oldToNew = new Map<number, number>();
          for (let i = 0; i < lines.length; i++) {
            const included = passesLevel[i] || inContext.has(i);
            if (!included) continue;
            const line = lines[i];
            if (hasSearch && !lineMatches(line, searchStr)) {
              continue;
            }
            oldToNew.set(i, filteredData.length);
            filteredData.push(line);
          }

          // Record, for each error-level entry, its hidden context lines so an
          // inline toggle on the line can reveal them.
          const errorContext: ErrorContextWindow[] = [];
          for (const anchor of errorAnchors) {
            const anchorIdx = oldToNew.get(anchor);
            if (anchorIdx === undefined) continue;
            const contextIdxs: number[] = [];
            const from = Math.max(0, anchor - CONTEXT_LINES);
            const to = Math.min(lines.length - 1, anchor + CONTEXT_LINES);
            for (let i = from; i <= to; i++) {
              if (passesLevel[i]) continue;
              const mapped = oldToNew.get(i);
              if (mapped === undefined || mapped === anchorIdx) continue;
              contextIdxs.push(mapped);
            }
            if (contextIdxs.length > 0) {
              errorContext.push({ anchorIdx, contextIdxs });
            }
          }

          return { ...section, data: filteredData, errorContext };
        }),
      )
      .filter((largeSection) =>
        largeSection.some((section) => section.data.length > 0),
      );
  }, [rawLogString, filter, searchStr]);

  const totalErrorCount = useMemo(
    () =>
      rawLogString.reduce(
        (sum, largeSection) =>
          sum +
          largeSection.reduce(
            (inner, section) =>
              inner +
              section.errors.filter(
                (err) =>
                  err.errorType === 'error' || err.errorType === 'critical',
              ).length,
            0,
          ),
        0,
      ),
    [rawLogString],
  );

  useEffect(() => {
    if (!hasInitializedErrorBaseline.current) {
      acknowledgedErrorCountRef.current = totalErrorCount;
      hasInitializedErrorBaseline.current = true;
      setErrored(false);
      return;
    }
    setErrored(totalErrorCount > acknowledgedErrorCountRef.current);
  }, [totalErrorCount]);

  const acknowledgeErrors = useCallback(() => {
    acknowledgedErrorCountRef.current = totalErrorCount;
    setErrored(false);
  }, [totalErrorCount]);
  return {
    tail,
    filter,
    setTail,
    setFilter,
    searchStr,
    setSearchStr,
    errored,
    acknowledgeErrors,
    rawLogString: filteredLogString,
    rawSections: logSections,
  };
};
