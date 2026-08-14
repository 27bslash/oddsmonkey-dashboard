import { RefObject } from 'react';
import { Box, Divider, alpha } from '@mui/material';
import { BetSection } from '../../core/useLogs';
import LogLine from '../../core/LogLine';
import SectionHeader from '../section_header/SectionHeader';
import ExpandedLogSection from './expandedSection';

type SectionStats = { errors: number; warnings: number };

type LogSectionListProps = {
  scrollRef: RefObject<HTMLDivElement>;
  filteredSections: BetSection[][];
  sectionStats: SectionStats[];
  rawLogString: BetSection[][];
  showSection: string[];
  setShowSection: React.Dispatch<React.SetStateAction<string[]>>;
  setFilter: React.Dispatch<React.SetStateAction<{ [key: string]: number }>>;
  logBasePath: string;
  highlightedTarget?: { sectionId: string; lineIdx: string };
  onUserInteract?: () => void;
};

export default function LogSectionList({
  scrollRef,
  filteredSections,
  sectionStats,
  rawLogString,
  showSection,
  setShowSection,
  setFilter,
  logBasePath,
  highlightedTarget,
  onUserInteract,
}: Readonly<LogSectionListProps>) {
  return (
    <Box
      ref={scrollRef}
      onWheel={onUserInteract}
      onMouseDown={onUserInteract}
      onTouchStart={onUserInteract}
      onKeyDown={onUserInteract}
      tabIndex={0}
      sx={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        bgcolor: '#040a18',
        position: 'relative',
        minWidth: 0,
      }}
    >
      <Box sx={{ py: 1 }}>
        {filteredSections.map((largeSection, index) => {
          const stats = sectionStats[rawLogString.indexOf(largeSection)] || {
            errors: 0,
            warnings: 0,
          };
          const isExpanded = showSection.includes(largeSection[0]._id);

          return (
            <Box
              key={index}
              data-section-id={largeSection[0]._id}
              sx={{ borderBottom: `1px solid ${alpha('#1e293b', 0.3)}` }}
            >
              <Box
                sx={{
                  position: 'sticky',
                  top: 0,
                  zIndex: 4,
                  backgroundColor: '#040a18',
                }}
              >
                <SectionHeader
                  largeSection={largeSection}
                  errors={stats.errors}
                  warnings={stats.warnings}
                  isExpanded={isExpanded}
                  onToggle={() =>
                    setShowSection((prev) =>
                      prev.includes(largeSection[0]._id)
                        ? []
                        : [largeSection[0]._id],
                    )
                  }
                />
              </Box>
              {isExpanded && (
                <ExpandedLogSection
                  highlightedTarget={highlightedTarget}
                  logBasePath={logBasePath}
                  largeSection={largeSection}
                  setFilter={setFilter}
                />
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
