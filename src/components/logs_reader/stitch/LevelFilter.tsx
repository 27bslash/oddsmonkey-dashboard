import { Box, Button, alpha } from '@mui/material';
import { LOG_LEVELS } from './types';

const LEVEL_COLORS: Record<string, string> = {
  DEBUG: '#e6db74',
  INFO: '#adff2f',
  WARNING: '#f59e0b',
  ERROR: '#ef4444',
  CRITICAL: '#ef4444',
};

type LevelFilterProps = {
  activeLevel: string;
  setFilter: React.Dispatch<React.SetStateAction<{ [key: string]: number }>>;
};

export default function LevelFilter({ activeLevel, setFilter }: Readonly<LevelFilterProps>) {
  const activeLevelIdx = LOG_LEVELS.indexOf(activeLevel);

  return (
    <Box
      sx={{
        px: 3,
        py: 1,
        bgcolor: alpha('#0a1529', 0.4),
        borderTop: `1px solid ${alpha('#1e293b', 0.5)}`,
        borderBottom: `1px solid ${alpha('#1e293b', 0.5)}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <Box sx={{ display: 'flex', gap: 0.5 }}>
        {LOG_LEVELS.map((level) => {
          const isSelected = activeLevel === level;
          const thisLevelIdx = LOG_LEVELS.indexOf(level);
          const isIncluded = thisLevelIdx >= activeLevelIdx;
          const color = LEVEL_COLORS[level];

          return (
            <Button
              key={level}
              onClick={() => setFilter({ [level]: 1 })}
              sx={{
                width: '80px',
                minWidth: '80px',
                p: '4px 8px',
                fontSize: '10px',
                fontWeight: 700,
                borderRadius: '4px',
                color: isIncluded ? color : alpha('#dee5ff', 0.2),
                bgcolor: isSelected
                  ? alpha(color, 0.15)
                  : isIncluded
                    ? alpha(color, 0.05)
                    : 'transparent',
                border: `1px solid ${isSelected ? alpha(color, 0.4) : 'transparent'}`,
                '&:hover': { bgcolor: alpha(color, 0.12), color },
              }}
            >
              {level}
            </Button>
          );
        })}
      </Box>
    </Box>
  );
}
