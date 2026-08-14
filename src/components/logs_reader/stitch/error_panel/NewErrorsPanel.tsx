import { Box, Typography, IconButton, alpha } from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { RecurringError } from '../types';
import RecurringErrorCard from './RecurringErrorCard';

type NewErrorsPanelProps = {
  newErrors: RecurringError[];
  expanded: boolean;
  setExpanded: (fn: (prev: boolean) => boolean) => void;
  onNavigate: (error: RecurringError) => void;
};

export default function NewErrorsPanel({
  newErrors,
  expanded,
  setExpanded,
  onNavigate,
}: Readonly<NewErrorsPanelProps>) {
  return (
    <Box
      sx={{
        p: 2,
        px: 3,
        background: `linear-gradient(to bottom, ${alpha('#0a1529', 0.95)}, transparent)`,
        borderBottom: `1px solid ${alpha('#1e293b', 0.4)}`,
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
        <Typography
          sx={{
            fontSize: '10px',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            color: alpha('#fca5a5', 0.8),
          }}
        >
          New Errors ({newErrors.length})
        </Typography>
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
          {newErrors.map((error, idx) => (
            <RecurringErrorCard
              key={`${error.pattern}-${idx}`}
              error={error}
              onNavigate={onNavigate}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}
