import { Box, Typography, Chip, IconButton, alpha } from '@mui/material';
import { ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon } from '@mui/icons-material';
import { RecurringError } from './types';
import RecurringErrorCard from './RecurringErrorCard';

type RecurringErrorsPanelProps = {
  repeatedErrors: RecurringError[];
  totalErrors: number;
  totalWarnings: number;
  expanded: boolean;
  setExpanded: (fn: (prev: boolean) => boolean) => void;
  onNavigate: (sectionId: string) => void;
};

export default function RecurringErrorsPanel({
  repeatedErrors,
  totalErrors,
  totalWarnings,
  expanded,
  setExpanded,
  onNavigate,
}: Readonly <RecurringErrorsPanelProps>) {
//   if (repeatedErrors.length === 0) return null;

  return (
    <Box
      sx={{
        p: 2,
        px: 3,
        background: `linear-gradient(to bottom, ${alpha('#0a1529', 1)}, transparent)`,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: expanded ? 2 : 0,
          cursor: 'pointer',
        }}
        onClick={() => setExpanded((prev) => !prev)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography
            sx={{
              fontSize: '10px',
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
              color: alpha('#dee5ff', 0.3),
            }}
          >
            Recurring Errors
          </Typography>
          <Chip
            label={`${totalErrors} ERROR${totalErrors !== 1 ? 'S' : ''}`}
            size="small"
            sx={{
              height: 20,
              fontSize: '10px',
              fontWeight: 700,
              bgcolor: alpha('#ef4444', 0.15),
              color: '#ef4444',
              border: `1px solid ${alpha('#ef4444', 0.3)}`,
              borderRadius: '4px',
            }}
          />
          {totalWarnings > 0 && (
            <Chip
              label={`${totalWarnings} WARN`}
              size="small"
              sx={{
                height: 20,
                fontSize: '10px',
                fontWeight: 700,
                bgcolor: alpha('#f59e0b', 0.15),
                color: '#f59e0b',
                border: `1px solid ${alpha('#f59e0b', 0.3)}`,
                borderRadius: '4px',
              }}
            />
          )}
        </Box>
        <IconButton size="small" sx={{ color: alpha('#dee5ff', 0.3) }}>
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>

      {expanded && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
            gap: 1.5,
            maxHeight: '200px',
            overflowY: 'auto',
          }}
        >
          {repeatedErrors.map((error, idx) => (
            <RecurringErrorCard key={idx} error={error} onNavigate={onNavigate} />
          ))}
        </Box>
      )}
    </Box>
  );
}
