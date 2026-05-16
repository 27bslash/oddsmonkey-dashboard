import { RefObject } from 'react';
import { Box, alpha } from '@mui/material';
import { BetSection } from '../useLogs';
import LogLine from '../LogLine';
import SectionHeader from './SectionHeader';

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
}: Readonly<LogSectionListProps>) {
  return (
    <Box
      ref={scrollRef}
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

              {isExpanded &&
                largeSection.map((section, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      pl: 2,
                      borderLeft: `1px solid ${alpha('#1e293b', 0.3)}`,
                      ml: 2,
                    }}
                  >
                    {section.data.map(
                      (line: string, lineIdx: number) =>
                        !line.includes('BET SECTION') && (
                          <LogLine
                            key={lineIdx}
                            line={line}
                            lineIdx={`${idx}-${lineIdx}`}
                            setFilter={setFilter}
                            sectionId={section._id}
                            logBasePath={logBasePath}
                          />
                        ),
                    )}
                  </Box>
                ))}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
