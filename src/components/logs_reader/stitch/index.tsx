import { useState, useEffect, useRef, useCallback } from 'react';
import { Box } from '@mui/material';
import { useLogs } from '../useLogs';
import { BData } from '../../../../types';
import { LOG_PATHS, ERROR_SOURCE_REGEX, RecurringError } from './types';
import ViewerHeader from './ViewerHeader';
import RecurringErrorsPanel from './RecurringErrorsPanel';
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
  const [errorsExpanded, setErrorsExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const navStateRef = useRef<{ sectionId: string; errorIdx: number }>({
    sectionId: '',
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
    logFilePath,
  });

  const activeLevel = Object.keys(filter)[0];

  const handleNavigate = useCallback(
    (sectionId: string) => {
      const targetLineIdx = findErrorLineIdx(
        rawLogString,
        sectionId,
        navStateRef,
        setShowSection,
      );

      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          const container = scrollRef.current;
          if (!container) return;
          if (targetLineIdx !== undefined) {
            const lineEl = container.querySelector(
              `[data-section-id="${sectionId}"] [data-line-idx="${targetLineIdx}"]`,
            );
            if (lineEl) {
              lineEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
              return;
            }
          }
          const sectionEl = container.querySelector(
            `[data-section-id="${sectionId}"]`,
          );
          if (sectionEl)
            sectionEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }),
      );
    },
    [rawLogString],
  );

  const repeatedErrors: RecurringError[] = getRepeatedErrors(rawLogString);

  const sectionStats = calculateSectionStats(rawLogString);
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
          filteredSections={filteredSections}
          sectionStats={sectionStats}
          rawLogString={rawLogString}
          showSection={showSection}
          setShowSection={setShowSection}
          setFilter={setFilter}
          logBasePath={logBasePath}
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

function calculateSectionStats(
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
function findErrorLineIdx(
  rawLogString: {
    data: string[];
    _id: string;
    eventName?: string;
    betName?: string;
    marketType?: string;
    errors: { lineNum: number; errorType: 'critical' | 'error' | 'warning' }[];
  }[][],
  sectionId: string,
  navStateRef: React.MutableRefObject<{
    sectionId: string;
    errorIdx: number;
  }>,
  setShowSection: React.Dispatch<React.SetStateAction<string[]>>,
) {
  const errorLines: string[] = [];
  const section = rawLogString.find((ls) => ls[0]?._id === sectionId);
  if (section) {
    section.forEach((sub, subIdx) => {
      sub.data.forEach((line, dataIdx) => {
        if (line.includes('ERROR') || line.includes('CRITICAL')) {
          errorLines.push(`${subIdx}-${dataIdx}`);
        }
      });
    });
  }

  if (navStateRef.current.sectionId === sectionId) {
    navStateRef.current.errorIdx =
      (navStateRef.current.errorIdx + 1) % Math.max(errorLines.length, 1);
  } else {
    navStateRef.current = { sectionId, errorIdx: 0 };
  }

  const idsToOpen = section ? section.map((s) => s._id) : [sectionId];
  setShowSection([sectionId, ...idsToOpen]);

  const targetLineIdx = errorLines[navStateRef.current.errorIdx];
  return targetLineIdx;
}
