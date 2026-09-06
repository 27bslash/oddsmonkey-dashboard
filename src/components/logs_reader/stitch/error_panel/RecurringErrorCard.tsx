import { Box, Typography, Chip, alpha } from '@mui/material';
import { OpenInNew as ExternalLinkIcon } from '@mui/icons-material';
import { RecurringError } from '../types';
import { ErrorCard } from '../styled';

const LEVEL_COLORS: Record<RecurringError['level'], string> = {
  warning: '#f59e0b',
  error: '#f92672',
  critical: '#f92672',
};

const RecurringErrorCard = ({
  error,
  onNavigate,
}: {
  error: RecurringError;
  onNavigate?: (error: RecurringError) => void;
}) => {
  const color = LEVEL_COLORS[error.level];

  return (
    <ErrorCard onClick={() => onNavigate?.(error)}>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="body2"
          sx={{
            fontFamily: 'monospace',
            color: alpha(color, 0.85),
            fontWeight: 700,
            fontSize: '12px',
          }}
        >
          {error.pattern}
        </Typography>
      </Box>
      <Box
        sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}
      >
        <Chip
          label={`x${error.count}`}
          size="small"
          sx={{
            height: 20,
            fontSize: '10px',
            fontWeight: 700,
            backgroundColor: alpha(color, 0.2),
            color,
            border: `1px solid ${alpha(color, 0.3)}`,
            borderRadius: '4px',
          }}
        />
        <Typography
          variant="caption"
          sx={{
            color: alpha('#dee5ff', 0.4),
            fontFamily: 'monospace',
            fontSize: '10px',
          }}
        >
          in {error.sectionIds.length} section
          {error.sectionIds.length !== 1 ? 's' : ''}
        </Typography>
        <ExternalLinkIcon sx={{ fontSize: 14, color: alpha('#dee5ff', 0.2) }} />
      </Box>
    </ErrorCard>
  );
};

export default RecurringErrorCard;
