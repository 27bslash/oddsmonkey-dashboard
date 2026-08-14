/* eslint-disable */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BData } from '../../../../types';

type LogsProps = {
  bet?: BData;
  logBasePath?: string;
  logFilePath?: string;
  subscribe?: boolean;
};

export type BetSection = {
  data: string[];
  _id: string;
  eventName?: string;
  betName?: string;
  marketType?: string;
  errors: LogError[];
  miniSection?: boolean;
};
type LogError = {
  lineNum: number;
  errorType: 'critical' | 'error' | 'warning';
};
export const useLogs = ({
  bet,
  logBasePath,
  logFilePath,
  subscribe = true,
}: LogsProps) => {
  const [rawLogString, setRawLogStr] = useState<BetSection[][]>([]);
  const [tail, setTail] = useState(false);
  const [filter, setFilter] = useState<{ [key: string]: number }>({ INFO: 0 });
  const [errored, setErrored] = useState(false); // if any new errors have appeared since user last clicked logs button
  const [searchStr, setSearchStr] = useState('');
  const hasInitializedErrorBaseline = useRef(false);
  const acknowledgedErrorCountRef = useRef(0);
  const previousDataRef = useRef<string>('');

  useEffect(() => {
    if (!subscribe) return;

    let interval: NodeJS.Timeout;
    let pending = false;

    const getData = async () => {
      if (bet) {
        let data = await window.electron.ipcRenderer.readLog(
          bet,
          logBasePath,
          logFilePath,
        );
        console.log('data', data.length);
        if (data) {
          data = findAllBetSections(data, bet);
          setRawLogStr(data);
        }
      }
      let tailstr = await window.electron.ipcRenderer.tailLog(
        bet,
        logBasePath,
        logFilePath,
      );
      if (!bet) {
        tailstr = findAllBetSections(tailstr, bet);
        setRawLogStr(tailstr);
      }
    };

    getData();

    interval = setInterval(async () => {
      if (pending) return;
      pending = true;
      try {
        let tailUpdate = await window.electron.ipcRenderer.tailLog(
          bet,
          logBasePath,
          logFilePath,
        );
        if (!bet) {
          tailUpdate = findAllBetSections(tailUpdate, bet);
          // Only update state if data actually changed
          const dataStr = JSON.stringify(tailUpdate);
          if (dataStr !== previousDataRef.current) {
            previousDataRef.current = dataStr;
            setRawLogStr(tailUpdate);
          }
        }
      } finally {
        pending = false;
      }
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [logBasePath, logFilePath, bet, subscribe]);

  const LOG_LEVELS = ['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'];

  const filteredLogString = useMemo(() => {
    const activeLevel = Object.keys(filter)[0];
    const levelIdx = LOG_LEVELS.indexOf(activeLevel);

    const allowedLevels =
      levelIdx >= 0 ? LOG_LEVELS.slice(levelIdx) : LOG_LEVELS;
    const LOG_REGEX = /\b(DEBUG|INFO|WARNING|ERROR|CRITICAL)\b/;

    return rawLogString
      .map((largeSection) =>
        largeSection.map((section) => {
          const filteredData: string[] = [];
          let lastLineLevel: string | null = null;

          for (const line of section.data) {
            // Always keep section markers
            if (
              line.includes('BET SECTION') ||
              line.includes('END BET SECTION')
            ) {
              filteredData.push(line);
              continue;
            }

            const match = line.match(LOG_REGEX);
            if (match) {
              lastLineLevel = match[1];
            }

            const levelToCheck = match ? match[1] : lastLineLevel;
            const passesLevel =
              !levelToCheck || allowedLevels.includes(levelToCheck);
            const passesSearch =
              !searchStr ||
              line.toLowerCase().includes(searchStr.toLowerCase());

            if (passesLevel && passesSearch) {
              filteredData.push(line);
            }
          }

          return { ...section, data: filteredData };
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
  };
};
export function findAllBetSections(logs: string, activeBet?: BData) {
  let cs: BetSection = { data: [], _id: '', errors: [] };
  const bs: BetSection[] = [];
  let recording = false;
  let sectionCount = 1;
  let _id = '';
  let _eventName = '';
  let _betName = '';
  let _marketType = '';
  let lastClosedId = '';
  let lastClosedEventName = '';
  let lastClosedBetName = '';
  let lastClosedMarketType = '';
  let hasTradeoutStarted = false;
  let hasTradeoutCompleted = false;
  let sectionKey = '';
  const marketTypeRegex = /market type:\s*(.+)/;
  const split = logs.split('\n');
  const betRegex = /new bet found Event: (.+) bet name: (.+)(?=market type)/;
  const pushError = (line: string, cs: BetSection) => {
    const idx = cs.data.length - 1;
    if (line.includes('WARNING')) {
      cs.errors.push({ lineNum: idx, errorType: 'warning' });
    } else if (line.includes('ERROR') || line.includes('CRITICAL')) {
      cs.errors.push({ lineNum: idx, errorType: 'error' });
    }
  };

  const startsNewSection = (line: string | undefined) =>
    Boolean(
      line &&
        (line.includes('new bet found Event:') ||
          line.includes('restart_placing_bet()')),
    );
  const startsTradeout = (line: string | undefined) =>
    Boolean(line && line.toLowerCase().includes('trading out'));

  const shouldForceCloseAsIncomplete = (nextLine: string | undefined) =>
    Boolean(
      nextLine &&
        (startsNewSection(nextLine) ||
          nextLine.includes('Successfully connected to the database')),
    );

  const closeCurrentSection = ({
    incomplete = false,
    includeEndMarker = false,
  }: {
    incomplete?: boolean;
    includeEndMarker?: boolean;
  }) => {
    if (includeEndMarker) {
      cs.data.push(`--- END BET SECTION ${_id} --- ${sectionCount}`);
    }
    if (hasTradeoutCompleted) {
      cs._id = `${_id}_tradeout`;
    } else {
      cs._id = incomplete ? `${_id}_incomplete` : _id;
    }
    cs.eventName = _eventName;
    cs.betName = _betName;
    cs.marketType = _marketType || undefined;
    lastClosedId = cs._id;
    lastClosedEventName = _eventName;
    lastClosedBetName = _betName;
    lastClosedMarketType = _marketType || '';
    sectionCount += 1;
    bs.push(cs);
    cs = { data: [], _id: '', errors: [] };
    recording = false;
    hasTradeoutStarted = false;
    hasTradeoutCompleted = false;
  };

  for (const [i, line] of split.entries()) {
    if (!recording) {
      if (startsNewSection(line)) {
        recording = true;
        _marketType = '';
        hasTradeoutStarted = false;
        hasTradeoutCompleted = false;
        const match = betRegex.exec(line);
        if (match) {
          _eventName = match[1].trim();
          _betName = match[2].trim();
          _id = `${_eventName.replace(/\s+/g, '_').toLowerCase()}_${_betName.replace(/\s/g, '_').toLowerCase()}`;
        }
        sectionKey = `--- BET SECTION ${_id} ---`;
        cs.data.push(sectionKey);
        cs.data.push(line);
        pushError(line, cs);
      } else if (startsTradeout(line)) {
        recording = true;
        hasTradeoutStarted = true;
        hasTradeoutCompleted = false;
        _id = lastClosedId
          ? lastClosedId
              .replace(/__\d+$/, '')
              .replace(/_incomplete$/, '')
              .replace(/_tradeout$/, '')
          : 'tradeout';
        _eventName = lastClosedEventName;
        _betName = lastClosedBetName;
        _marketType = lastClosedMarketType;
        sectionKey = `--- BET SECTION ${_id} ---`;
        cs.data.push(sectionKey);
        cs.data.push(line);
        pushError(line, cs);
      } else {
        const unclassified: BetSection = {
          data: [line],
          _id: 'setup',
          errors:
            line.includes('ERROR') || line.includes('CRITICAL')
              ? [{ lineNum: 0, errorType: 'error' }]
              : [],
        };
        bs.push(unclassified);
      }
    } else {
      if (line.includes('logged Event:')) {
        cs.data.push(line);
        closeCurrentSection({ includeEndMarker: true });
      } else if (
        line.includes('place_bet()') &&
        line.includes('no bet results found')
      ) {
        // "no bet results found" from place_bet means this bet didn't go through — end section as incomplete
        cs.data.push(line);
        pushError(line, cs);
        closeCurrentSection({ incomplete: true });
      } else if (shouldForceCloseAsIncomplete(split[i + 1])) {
        cs.data.push(line);
        pushError(line, cs);
        closeCurrentSection({ incomplete: true });
      } else {
        const mtMatch = marketTypeRegex.exec(line);
        if (mtMatch) _marketType = mtMatch[1].trim();
        const lower = line.toLowerCase();
        if (lower.includes('trading out')) {
          hasTradeoutStarted = true;
        }
        if (hasTradeoutStarted && lower.includes('tradeout completed')) {
          hasTradeoutCompleted = true;
        }
        cs.data.push(line);
        pushError(line, cs);
      }
    }
  }

  // Push any remaining in-progress section at EOF
  if (cs.data.length > 0) {
    if (recording && hasTradeoutCompleted) {
      cs._id = `${_id}_tradeout`;
    } else {
      cs._id = recording ? `${_id}_incomplete` : cs._id || 'unclassified';
    }
    cs.eventName = _eventName;
    cs.betName = _betName;
    cs.marketType = _marketType || undefined;
    bs.push(cs);
  }
  const merged = mergeAdjacentSameId(bs);
  if (activeBet)
    console.log(
      `found ${merged.length} bet sections for ${activeBet.bet_info.event_name}`,
    );
  // Give each group a unique ID to prevent toggle collisions
  const idCounts: Record<string, number> = {};
  for (const group of merged) {
    const baseId = group[0]._id;
    const count = idCounts[baseId] || 0;
    idCounts[baseId] = count + 1;
    if (count > 0) {
      const uniqueId = `${baseId}__${count}`;
      for (const section of group) {
        section._id = uniqueId;
      }
    }
  }
  if (!activeBet) {
    return merged;
  }

  const targetBaseId = `${activeBet.bet_info.event_name
    .replace(/\s+/g, '_')
    .toLowerCase()}_${activeBet.bet_info.bet.replace(/\s+/g, '_').toLowerCase()}`;

  const normalizeSectionId = (id: string) =>
    id
      .replace(/__\d+$/, '')
      .replace(/_incomplete$/, '')
      .replace(/_tradeout$/, '');

  return merged.filter(
    (group) => normalizeSectionId(group[0]._id) === targetBaseId,
  );
}
function mergeAdjacentSameId(sections: BetSection[]): BetSection[][] {
  const m: BetSection[][] = [];
  let current: BetSection[] = [];

  for (const section of sections) {
    if (section._id === 'setup') {
      current.push(section);
      continue;
    }
    if (current.length > 0 && current[0]._id === section._id) {
      section.miniSection = true;
      current.push(section);
    } else {
      if (current.length > 0) {
        m.push(current);
      }
      section.miniSection = true;
      current = [section];
    }
  }
  if (current.length > 0) m.push(current);
  return m;
}
