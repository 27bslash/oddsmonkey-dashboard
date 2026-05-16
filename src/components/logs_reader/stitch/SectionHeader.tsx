import { Box, Typography, Chip, alpha } from '@mui/material';
import { ChevronRight as ChevronRightIcon } from '@mui/icons-material';
import { BetSection } from '../useLogs';
import { SectionRow } from './styled';

const SectionHeader = ({
  largeSection,
  errors,
  warnings,
  isExpanded,
  onToggle,
}: {
  largeSection: BetSection[];
  errors: number;
  warnings: number;
  isExpanded: boolean;
  onToggle: () => void;
}) => {
  const first = largeSection[0];
  const isIncomplete = first._id.replace(/__\d+$/, '').endsWith('_incomplete');
  const lineCount = largeSection.reduce((sum, s) => sum + s.data.length, 0);

  const getBorderColor = () => {
    if (errors > 0) {
      return alpha('#ef4444', 0.4);
    }
    if (warnings > 0) {
      return alpha('#f59e0b', 0.4);
    }
    return alpha('#1e293b', 0.5);
  };

  const borderColor = getBorderColor();

  return (
    <SectionRow
      onClick={onToggle}
      sx={{
        borderLeft: `3px solid ${borderColor}`,
        backgroundColor: isExpanded ? alpha('#1e293b', 0.3) : 'transparent',
      }}
    >
      <ChevronRightIcon
        sx={{
          fontSize: 16,
          color: alpha('#dee5ff', 0.3),
          transform: isExpanded ? 'rotate(90deg)' : 'none',
          transition: 'transform 0.2s',
        }}
      />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {first.eventName ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography
              component="span"
              sx={{
                color: '#3bbffa',
                fontWeight: 700,
                fontFamily: 'monospace',
                fontSize: '12px',
              }}
            >
              {first.eventName}
            </Typography>
            <Typography
              component="span"
              sx={{ color: alpha('#dee5ff', 0.2), fontSize: '12px' }}
            >
              /
            </Typography>
            <Typography
              component="span"
              sx={{
                color: '#f59e0b',
                fontFamily: 'monospace',
                fontSize: '12px',
              }}
            >
              {first.betName}
            </Typography>
            {first.marketType && (
              <Chip
                label={first.marketType}
                size="small"
                sx={{
                  height: 16,
                  fontSize: '9px',
                  fontWeight: 600,
                  backgroundColor: alpha('#3bbffa', 0.1),
                  color: alpha('#3bbffa', 0.7),
                  borderRadius: '3px',
                }}
              />
            )}
            {isIncomplete && (
              <Chip
                label="INCOMPLETE"
                size="small"
                sx={{
                  height: 16,
                  fontSize: '9px',
                  fontWeight: 700,
                  backgroundColor: alpha('#f59e0b', 0.15),
                  color: alpha('#f59e0b', 0.7),
                  borderRadius: '3px',
                }}
              />
            )}
          </Box>
        ) : (
          <Typography
            sx={{
              color: alpha('#dee5ff', 0.6),
              fontFamily: 'monospace',
              fontSize: '12px',
              textTransform: 'capitalize',
            }}
          >
            {first._id.replaceAll(/__\d+/g, '').replaceAll('_', ' ')}
          </Typography>
        )}
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {errors > 0 && (
          <Chip
            label={`${errors}E`}
            size="small"
            sx={{
              height: 20,
              fontSize: '10px',
              fontWeight: 700,
              backgroundColor: alpha('#ef4444', 0.2),
              color: '#ef4444',
              borderRadius: '4px',
            }}
          />
        )}
        {warnings > 0 && (
          <Chip
            label={`${warnings}W`}
            size="small"
            sx={{
              height: 20,
              fontSize: '10px',
              fontWeight: 700,
              backgroundColor: alpha('#f59e0b', 0.2),
              color: '#f59e0b',
              borderRadius: '4px',
            }}
          />
        )}
        <Typography
          sx={{
            color: alpha('#dee5ff', 0.2),
            fontSize: '10px',
            fontFamily: 'monospace',
          }}
        >
          {lineCount}
        </Typography>
      </Box>
    </SectionRow>
  );
};

export default SectionHeader;
