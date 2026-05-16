import { Box, MenuItem, Select, TextField } from '@mui/material';
import LogButtons from './logs_buttons';
import { BData } from '../../../types';
import { useLogs } from './useLogs';
import { useCallback, useEffect, useRef, useState } from 'react';
import LogErrors from './logErrors';
import LogSection from './LogSection';

type LogsProps = {
  bet?: BData;
};

const LOG_PATHS = {
  dist: 'D:/projects/python/odds_monkey_bot/dist/logs',
  dev: 'D:/projects/python/odds_monkey_bot/logs',
} as const;

const LogOverlay = ({ bet }: LogsProps) => {
  const [logBasePath, setLogBasePath] = useState<string>(LOG_PATHS.dist);

  useEffect(() => {
    window.electron.ipcRenderer.detectActiveLogPath().then((path) => {
      setLogBasePath(path);
    });
  }, []);
  const {
    tail,
    filter,
    setTail,
    setFilter,
    setSearchStr,
    searchStr,
    rawLogString,
  } = useLogs({
    bet,
    logBasePath,
  });
  const [showSection, setShowSection] = useState<string[]>([]);
  const [hideIncomplete, setHideIncomplete] = useState(false);
  const logBoxRef = useRef<HTMLDivElement>(null);
  const navStateRef = useRef<{ sectionId: string; errorIdx: number }>({
    sectionId: '',
    errorIdx: -1,
  });

  const handleNavigate = useCallback(
    (sectionId: string) => {
      // Collect data-line-idx values (subIdx-lineIdx) for error lines
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

      // Advance to next error, or reset if different section
      if (navStateRef.current.sectionId === sectionId) {
        navStateRef.current.errorIdx =
          (navStateRef.current.errorIdx + 1) % Math.max(errorLines.length, 1);
      } else {
        navStateRef.current = { sectionId, errorIdx: 0 };
      }

      // Close all other sections, open this one + its subsections
      const idsToOpen = section ? section.map((s) => s._id) : [sectionId];
      setShowSection([sectionId, ...idsToOpen]);

      const targetLineIdx = errorLines[navStateRef.current.errorIdx];

      // Double rAF to ensure DOM has rendered after state update
      requestAnimationFrame(() => requestAnimationFrame(() => {
        const container = logBoxRef.current;
        if (!container) return;

        // Try to scroll to the specific error line
        if (targetLineIdx !== undefined) {
          const lineEl = container.querySelector(
            `[data-section-id="${sectionId}"] [data-line-idx="${targetLineIdx}"]`,
          );
          if (lineEl) {
            lineEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
          }
        }

        // Fallback: scroll to section header
        const sectionEl = container.querySelector(
          `[data-section-id="${sectionId}"]`,
        );
        if (sectionEl) {
          sectionEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }));
    },
    [rawLogString],
  );

  useEffect(() => {
    if (tail && logBoxRef.current) {
      logBoxRef.current.scrollTop = logBoxRef.current.scrollHeight;
    }
  }, [tail, rawLogString]);

  return (
    <Box
      display={'flex'}
      flexDirection={'column'}
      alignItems={'center'}
      zIndex={999}
      color={'white'}
    >
      <LogErrors logString={rawLogString} onNavigate={handleNavigate} />
      <Box display={'flex'}>
        <LogButtons
          setTail={setTail}
          tail={tail}
          filter={filter}
          setFilter={setFilter}
        ></LogButtons>
        <TextField
          placeholder="search logs"
          value={searchStr}
          onChange={(e) => setSearchStr(e.target.value)}
          sx={{ marginLeft: '10px' }}
        />
        <Select
          value={logBasePath}
          onChange={(e) => setLogBasePath(e.target.value)}
          size="small"
          sx={{
            marginLeft: '10px',
            color: 'white',
            minWidth: 120,
            '.MuiOutlinedInput-notchedOutline': { borderColor: 'grey' },
            '.MuiSvgIcon-root': { color: 'white' },
          }}
        >
          <MenuItem value={LOG_PATHS.dist}>Prod</MenuItem>
          <MenuItem value={LOG_PATHS.dev}>Local Dev</MenuItem>
        </Select>
        <span
          onClick={() => setHideIncomplete((prev) => !prev)}
          style={{
            marginLeft: '10px',
            padding: '4px 10px',
            cursor: 'pointer',
            fontSize: '12px',
            borderRadius: '4px',
            alignSelf: 'center',
            backgroundColor: hideIncomplete ? 'rgba(255,255,255,0.15)' : 'transparent',
            color: hideIncomplete ? 'white' : 'grey',
            border: '1px solid grey',
            userSelect: 'none',
          }}
        >
          {hideIncomplete ? 'Incomplete hidden' : 'Hide incomplete'}
        </span>
      </Box>
      <Box
        ref={logBoxRef}
        className="log-overlay-box"
        sx={{
          zIndex: 999,
          width: '1600px',
          position: 'sticky',
          top: '50px',
          height: '600px',
          padding: '5px',
          backgroundColor: 'black',
          border: 'solid 3px black',
          borderRadius: '8px',
          boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {rawLogString &&
          rawLogString
          .filter((largeSection) =>
            !hideIncomplete || !largeSection[0]?._id.replace(/__\d+$/, '').endsWith('_incomplete'),
          )
          .map((largeSection, index: number) => {
            let errors = 0;
            let warnings = 0;
            largeSection.forEach((section) => {
              errors += section.errors.filter(
                (x) => x.errorType === 'error',
              ).length;
              warnings += section.errors.filter(
                (x) => x.errorType === 'warning',
              ).length;
            });
            return (
              <LogSection
                key={index}
                largeSection={largeSection}
                setFilter={setFilter}
                setShowSection={setShowSection}
                errors={errors}
                warnings={warnings}
                showSection={showSection}
                logBasePath={logBasePath}
              />
            );
          })}
      </Box>
    </Box>
  );
};

export default LogOverlay;
