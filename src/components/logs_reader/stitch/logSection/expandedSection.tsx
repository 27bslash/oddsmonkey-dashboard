import { Box, Divider } from '@mui/material';
import { alpha } from '@mui/material/styles';
import LogLine from '../../core/LogLine';
import { BetSection } from '../../core/useLogs';
type ExpandedLogSectionProps = {
  largeSection: BetSection[];
  setFilter: React.Dispatch<React.SetStateAction<{ [key: string]: number }>>;
  logBasePath: string;
  highlightedTarget?: { sectionId: string; lineIdx: string };
};

function ExpandedLogSection({
  largeSection,
  logBasePath,
  highlightedTarget,
  setFilter,
}: ExpandedLogSectionProps) {
  return (
    <>
      {largeSection.map((section, idx) => (
        <Box
          key={idx}
          sx={{
            pl: 2,
            borderLeft: `1px solid ${alpha('#1e293b', 0.3)}`,
            ml: 2,
          }}
        >
          {section.data
            .map((line, lineIdx) => ({
              line,
              lineIdx,
            }))
            .filter(({ line }) => !line.includes('BET SECTION'))
            .map(({ line, lineIdx }) => (
              <LogLine
                key={lineIdx}
                line={line}
                lineIdx={`${idx}-${lineIdx}`}
                highlighted={
                  highlightedTarget?.sectionId === section._id &&
                  highlightedTarget?.lineIdx === `${idx}-${lineIdx}`
                }
                setFilter={setFilter}
                sectionId={section._id}
                logBasePath={logBasePath}
              />
            ))}

          {/* if the large section is made up of many small sections divide them unless it's the last section */}
          {section.miniSection &&
            largeSection.length > 1 &&
            idx !== largeSection.length - 1 && (
              <Divider
                aria-hidden={true}
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
      ))}
    </>
  );
}

export default ExpandedLogSection;
