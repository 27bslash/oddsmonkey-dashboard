import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box } from '@mui/material';
import { BData } from '../../../../types';
import { RecurringError } from './types';
import ViewerHeader from './ViewerHeader';
import RecurringErrorsPanel from './error_panel/RecurringErrorsPanel';
import NewErrorsPanel from './error_panel/NewErrorsPanel';
import LevelFilter from './LevelFilter';
import LogSectionList from './logSection/LogSectionList';
import { BetSection } from '../core/types';
import { useLogPathSelection } from './hooks/useLogPathSelection';
import {
  calculateSectionErrorStats,
  findErrorTarget,
  getNewErrors,
  getRepeatedErrors,
} from './utils/logAnalysis';

/** A bet section is incomplete when it never reached placement/tradeout. The
 *  lifecycle lives in `stage`, so no id-suffix parsing is required. */
const isIncomplete = (section?: BetSection) =>
  Boolean(
    section?.eventName &&
      (section.stage === 'setup' || section.stage === 'prep'),
  );

const isNoiseSection = (section?: BetSection) =>
  Boolean(
    section && (section.stage === 'prep' || section.stage === 'unclassified'),
  );

type StitchProps = {
  bet?: BData;
  filter: { [key: string]: number };
  setFilter: React.Dispatch<React.SetStateAction<{ [key: string]: number }>>;
  setSearchStr: (str: string) => void;
  searchStr: string;
  rawLogString: BetSection[][];
  rawSections: BetSection[][];

  logBasePath: string;
  setLogBasePath: React.Dispatch<React.SetStateAction<string>>;
  logFilePath: string;
  setLogFilePath: React.Dispatch<React.SetStateAction<string>>;
};

export default function StitchLogViewer({
  bet,
  filter,
  setFilter,
  setSearchStr,
  searchStr,
  rawLogString,
  rawSections,
  logBasePath,
  setLogBasePath,
  logFilePath,
  setLogFilePath,
}: Readonly<StitchProps>) {
  const { compatibleLogFiles } = useLogPathSelection({
    bet,
    logBasePath,
    setLogBasePath,
    setLogFilePath,
  });
  const [isFollowing] = useState(true);
  const [showSection, setShowSection] = useState<string[]>([]); // array of section ids that are expanded
  const [hideIncomplete, setHideIncomplete] = useState(false);
  const [hideNoise, setHideNoise] = useState(false);
  const [expandAllLines, setExpandAllLines] = useState(false);
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

  const activeLevel = Object.keys(filter)[0];

  const handleNavigate = useCallback(
    (error: RecurringError) => {
      const target = findErrorTarget(
        rawLogString,
        error,
        navStateRef,
        setShowSection,
      );
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
    (largeSection) => !hideIncomplete || !isIncomplete(largeSection[0]),
  );
  const sectionsToRender = (() => {
    if (!bet) return filteredSections;

    // For a single bet, always surface its incomplete attempts even when the
    // global "hide incomplete" filter is on. Match on the bet's identity so we
    // don't pull in a different selection on the same event.
    const identityOf = (section?: BetSection) =>
      `${section?.eventName ?? ''}::${section?.betName ?? ''}`;
    const visibleIdentities = new Set(
      filteredSections.map((section) => identityOf(section[0])),
    );

    const withIncomplete = [...filteredSections];
    const seen = new Set(withIncomplete.map((s) => s[0]?._id));

    for (const section of rawLogString) {
      const first = section[0];
      if (!first || seen.has(first._id) || !isIncomplete(first)) continue;
      if (!visibleIdentities.has(identityOf(first))) continue;
      withIncomplete.push(section);
      seen.add(first._id);
    }

    return withIncomplete;
  })();

  const visibleSections = hideNoise
    ? sectionsToRender.filter(
        (largeSection) => !isNoiseSection(largeSection[0]),
      )
    : sectionsToRender;

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
        data={rawSections}
        searchStr={searchStr}
        setSearchStr={setSearchStr}
        hideIncomplete={hideIncomplete}
        setHideIncomplete={setHideIncomplete}
        hideNoise={hideNoise}
        setHideNoise={setHideNoise}
        expandAllLines={expandAllLines}
        setExpandAllLines={setExpandAllLines}
      />

      <Box
        sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
      >
        {newErrors.length > 0 && (
          <NewErrorsPanel
            newErrors={newErrors}
            expanded={newErrorsExpanded}
            setExpanded={setNewErrorsExpanded}
            onNavigate={handleNavigate}
          />
        )}

        {repeatedErrors.length > 0 && (
          <RecurringErrorsPanel
            repeatedErrors={repeatedErrors}
            totalErrors={sectionStats.reduce((sum, s) => sum + s.errors, 0)}
            totalWarnings={sectionStats.reduce((sum, s) => sum + s.warnings, 0)}
            expanded={errorsExpanded}
            setExpanded={setErrorsExpanded}
            onNavigate={handleNavigate}
          />
        )}

        <LevelFilter activeLevel={activeLevel} setFilter={setFilter} />

        <LogSectionList
          scrollRef={scrollRef}
          filteredSections={visibleSections}
          sectionStats={sectionStats}
          rawLogString={rawLogString}
          showSection={showSection}
          setShowSection={setShowSection}
          setFilter={setFilter}
          setSearchStr={setSearchStr}
          logBasePath={logBasePath}
          highlightedTarget={highlightedTarget}
          expandAllLines={expandAllLines}
          onUserInteract={() => setHighlightedTarget(undefined)}
        />
      </Box>
    </Box>
  );
}
