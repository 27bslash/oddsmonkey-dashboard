import { Box, Typography, Chip, alpha } from '@mui/material';
import { OpenInNew as ExternalLinkIcon } from '@mui/icons-material';
import { RecurringError } from '../types';
import { ErrorCard } from '../styled';

const RecurringErrorCard = ({
  error,
  onNavigate,
}: {
  error: RecurringError;
  onNavigate?: (error: RecurringError) => void;
}) => (
  <ErrorCard onClick={() => onNavigate?.(error)}>
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography
        variant="body2"
        sx={{
          fontFamily: 'monospace',
          color: alpha('#ef4444', 0.85),
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
          backgroundColor: alpha('#ef4444', 0.2),
          color: '#ef4444',
          border: `1px solid ${alpha('#ef4444', 0.3)}`,
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

export default RecurringErrorCard;
