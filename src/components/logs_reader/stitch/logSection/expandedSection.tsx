import { useState } from 'react';
import { Box, Divider } from '@mui/material';
import { alpha } from '@mui/material/styles';
import JsonLogLine from '../../jsonLogLine/JsonLogLine';
import { parseJsonLine } from '../../core/types';
import { BetSection } from '../../core/useLogs';

type ExpandedLogSectionProps = {
  largeSection: BetSection[];
  setFilter: React.Dispatch<React.SetStateAction<{ [key: string]: number }>>;
  setSearchStr: (s: string) => void;
  logBasePath: string;
  highlightedTarget?: { sectionId: string; lineIdx: string };
};

type SectionLinesProps = {
  section: BetSection;
  sectionIdx: number;
  setFilter: React.Dispatch<React.SetStateAction<{ [key: string]: number }>>;
  setSearchStr: (s: string) => void;
  logBasePath: string;
  highlightedTarget?: { sectionId: string; lineIdx: string };
};

function SectionLines({
  section,
  sectionIdx,
  setFilter,
  setSearchStr,
  logBasePath,
  highlightedTarget,
}: SectionLinesProps) {
  const { errorContext = [] } = section;
  const windows = errorContext.filter((w) => w.contextIdxs.length > 0);
  const anchorSet = new Set(windows.map((w) => w.anchorIdx));

  const contextToAnchors = new Map<number, number[]>();
  for (const w of windows) {
    for (const ctxIdx of w.contextIdxs) {
      const owners = contextToAnchors.get(ctxIdx) ?? [];
      owners.push(w.anchorIdx);
      contextToAnchors.set(ctxIdx, owners);
    }
  }

  const [expandedAnchors, setExpandedAnchors] = useState<Set<number>>(
    new Set(),
  );

  const toggleContext = (anchorIdx: number) =>
    setExpandedAnchors((prev) => {
      const next = new Set(prev);
      if (next.has(anchorIdx)) {
        next.delete(anchorIdx);
      } else {
        next.add(anchorIdx);
      }
      return next;
    });

  return (
    <>
      {section.data
        .map((line, lineIdx) => ({ entry: parseJsonLine(line), lineIdx }))
        .filter(({ entry }) => entry !== undefined)
        .map(({ entry, lineIdx }) => {
          const isAnchor = anchorSet.has(lineIdx);
          const isContextLine = contextToAnchors.has(lineIdx);
          const contextOwners = contextToAnchors.get(lineIdx) ?? [];
          const visible =
            !isContextLine || contextOwners.some((a) => expandedAnchors.has(a));

          return (
            <JsonLogLine
              key={lineIdx}
              entry={entry!}
              lineIdx={`${sectionIdx}-${lineIdx}`}
              highlighted={
                highlightedTarget?.sectionId === section._id &&
                highlightedTarget?.lineIdx === `${sectionIdx}-${lineIdx}`
              }
              setFilter={setFilter}
              setSearchStr={setSearchStr}
              sectionId={section._id}
              logBasePath={logBasePath}
              isContextLine={isContextLine}
              visible={visible}
              hasContext={isAnchor}
              contextExpanded={expandedAnchors.has(lineIdx)}
              onToggleContext={
                isAnchor ? () => toggleContext(lineIdx) : undefined
              }
            />
          );
        })}
    </>
  );
}

function ExpandedLogSection({
  largeSection,
  logBasePath,
  highlightedTarget,
  setFilter,
  setSearchStr,
}: ExpandedLogSectionProps) {
  const hasContent = (section: BetSection) =>
    section.data.some((line) => parseJsonLine(line) !== undefined);

  return (
    <>
      {largeSection.map((section, idx) => {
        if (!hasContent(section)) return null;
        const nextHasContent =
          idx < largeSection.length - 1 && hasContent(largeSection[idx + 1]);
        return (
          <Box
            key={idx}
            sx={{
              pl: 2,
              borderLeft: `1px solid ${alpha('#1e293b', 0.3)}`,
              ml: 2,
            }}
          >
            <SectionLines
              section={section}
              sectionIdx={idx}
              setFilter={setFilter}
              setSearchStr={setSearchStr}
              logBasePath={logBasePath}
              highlightedTarget={highlightedTarget}
            />

            {/* if the large section is made up of many small sections divide them unless it's the last section */}
            {section.miniSection &&
              largeSection.length > 1 &&
              nextHasContent && (
                <Divider
                  aria-hidden
                  sx={{
                    color: '#FFD700',
                    marginBottom: '10px',
                    marginTop: '10px',
                    fontSize: '17px',
                    '&::before, &::after': {
                      borderTopWidth: '2px',
                      borderTopColor: '#FFD700',
                    },
                  }}
                >
                  End Sub Section {idx + 1}
                </Divider>
              )}
          </Box>
        );
      })}
    </>
  );
}

export default ExpandedLogSection;
