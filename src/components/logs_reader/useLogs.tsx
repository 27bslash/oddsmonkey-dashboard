/* eslint-disable */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BData } from '../../../types';

type LogsProps = {
  bet?: BData;
  logBasePath?: string;
  logFilePath?: string;
};

export type BetSection = {
  data: string[];
  _id: string;
  eventName?: string;
  betName?: string;
  marketType?: string;
  errors: LogError[];
};
type LogError = {
  lineNum: number;
  errorType: 'critical' | 'error' | 'warning';
};
export const useLogs = ({ bet, logBasePath, logFilePath }: LogsProps) => {
  const [rawLogString, setRawLogStr] = useState<BetSection[][]>([]);
  const [tail, setTail] = useState(false);
  const [filter, setFilter] = useState<{ [key: string]: number }>({ INFO: 0 });
  const [errored, setErrored] = useState(false); // if any new errors have appeared since user last clicked logs button
  const [searchStr, setSearchStr] = useState('');
  const hasInitializedErrorBaseline = useRef(false);
  const acknowledgedErrorCountRef = useRef(0);

  function findAllBetSections(logs: string) {
    let cs: BetSection = { data: [], _id: '', errors: [] };
    const bs: BetSection[] = [];
    let recording = false;
    let sectionCount = 1;
    let _id = '';
    let _eventName = '';
    let _betName = '';
    let _marketType = '';
    let sectionKey = '';
    const marketTypeRegex = /market type:\s*(.+)/;
    const split = logs.split('\n');
    const betRegex =
      /new bet found Event: ([\w+\:\s+]+) bet name: ([\w+\:\s+]+)/;

    const pushError = (line: string, cs: BetSection) => {
      const idx = cs.data.length - 1;
      if (line.includes('WARNING')) {
        cs.errors.push({ lineNum: idx, errorType: 'warning' });
      } else if (line.includes('ERROR') || line.includes('CRITICAL')) {
        cs.errors.push({ lineNum: idx, errorType: 'error' });
      }
    };

    for (const [i, line] of split.entries()) {
      if (!recording) {
        if (
          line.includes('new bet found Event:') ||
          line.includes('restart_placing_bet()')
        ) {
          recording = true;
          _marketType = '';
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
        } else {
          const unclassified: BetSection = {
            data: [line],
            _id: 'unclassified',
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
          cs.data.push(`--- END BET SECTION ${_id} --- ${sectionCount}`);
          cs._id = _id;
          cs.eventName = _eventName;
          cs.betName = _betName;
          cs.marketType = _marketType || undefined;
          sectionCount += 1;
          bs.push(cs);
          cs = { data: [], _id: '', errors: [] };
          recording = false;
        } else if (line.includes('place_bet()') && line.includes('no bet results found')) {
          // "no bet results found" from place_bet means this bet didn't go through — end section as incomplete
          cs.data.push(line);
          pushError(line, cs);
          recording = false;
          sectionCount += 1;
          cs._id = `${_id}_incomplete`;
          cs.eventName = _eventName;
          cs.betName = _betName;
          cs.marketType = _marketType || undefined;
          bs.push(cs);
          cs = { data: [], _id: '', errors: [] };
        } else if (
          split[i + 1] &&
          (split[i + 1].includes('new bet found Event:') ||
            split[i + 1].includes('restart_placing_bet()') ||
            split[i + 1].includes('Successfully connected to the database'))
        ) {
          cs.data.push(line);
          pushError(line, cs);
          recording = false;
          sectionCount += 1;
          cs._id = `${_id}_incomplete`;
          cs.eventName = _eventName;
          cs.betName = _betName;
          cs.marketType = _marketType || undefined;
          bs.push(cs);
          cs = { data: [], _id: '', errors: [] };
        } else {
          const mtMatch = marketTypeRegex.exec(line);
          if (mtMatch) _marketType = mtMatch[1].trim();
          cs.data.push(line);
          pushError(line, cs);
        }
      }
    }

    // Push any remaining in-progress section at EOF
    if (cs.data.length > 0) {
      cs._id = recording ? `${_id}_incomplete` : (cs._id || 'unclassified');
      cs.eventName = _eventName;
      cs.betName = _betName;
      cs.marketType = _marketType || undefined;
      bs.push(cs);
    }

    const merged = mergeAdjacentSameId(bs);
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
    return merged;
  }
  function mergeAdjacentSameId(sections: BetSection[]): BetSection[][] {
    const m: BetSection[][] = [];
    let current: BetSection[] = [];

    for (const section of sections) {
      if (current.length > 0 && current[0]._id === section._id) {
        current.push(section);
      } else {
        if (current.length > 0) m.push(current);
        current = [section];
      }
    }
    if (current.length > 0) m.push(current);

    return m;
  }

  useEffect(() => {
    let interval: NodeJS.Timeout;
    let pending = false;

    const getData = async () => {
      let data = await window.electron.ipcRenderer.readLog(
        bet,
        logBasePath,
        logFilePath,
      );

      let tailstr = await window.electron.ipcRenderer.tailLog(
        bet,
        logBasePath,
        logFilePath,
      );

      if (data) {
        data = findAllBetSections(data);
        setRawLogStr(data);
      } else {
        tailstr = findAllBetSections(tailstr);
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
          tailUpdate = findAllBetSections(tailUpdate);
          setRawLogStr(tailUpdate);
        }
      } finally {
        pending = false;
      }
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [logBasePath, logFilePath, bet]);

  const LOG_LEVELS = ['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'];

  const filteredLogString = useMemo(() => {
    const activeLevel = Object.keys(filter)[0];
    const levelIdx = LOG_LEVELS.indexOf(activeLevel);

    const allowedLevels = levelIdx >= 0 ? LOG_LEVELS.slice(levelIdx) : LOG_LEVELS;
    const LOG_REGEX = /\b(DEBUG|INFO|WARNING|ERROR|CRITICAL)\b/;

    return rawLogString
      .map((largeSection) =>
        largeSection.map((section) => {
          const filteredData: string[] = [];
          let lastLineLevel: string | null = null;

          for (const line of section.data) {
            // Always keep section markers
            if (line.includes('BET SECTION') || line.includes('END BET SECTION')) {
              filteredData.push(line);
              continue;
            }

            const match = line.match(LOG_REGEX);
            if (match) {
              lastLineLevel = match[1];
            }

            const levelToCheck = match ? match[1] : lastLineLevel;
            const passesLevel = !levelToCheck || allowedLevels.includes(levelToCheck);
            const passesSearch = !searchStr || line.toLowerCase().includes(searchStr.toLowerCase());

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
