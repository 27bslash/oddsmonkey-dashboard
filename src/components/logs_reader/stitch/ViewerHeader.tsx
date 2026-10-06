import {
  Box,
  Typography,
  Button,
  IconButton,
  alpha,
  FormControl,
  Select,
  MenuItem,
} from '@mui/material';
import { Terminal as TerminalIcon } from '@mui/icons-material';
import { TerminalHeader } from './styled';
import { LOG_PATHS } from './types';
import LogSearch from '../log_search/search';
import { BetSection } from '../core/types';

type ViewerHeaderProps = {
  logBasePath: string;
  setLogBasePath: (path: string) => void;
  logFilePath: string;
  setLogFilePath: (path: string) => void;
  compatibleLogFiles: { name: string; path: string }[];
  data: BetSection[][];
  searchStr: string;
  setSearchStr: (s: string) => void;
  hideIncomplete: boolean;
  setHideIncomplete: (fn: (prev: boolean) => boolean) => void;
  hideNoise: boolean;
  setHideNoise: (fn: (prev: boolean) => boolean) => void;
  expandAllLines: boolean;
  setExpandAllLines: (fn: (prev: boolean) => boolean) => void;
};

type ToggleChipProps = {
  label: string;
  active?: boolean;
  onClick: () => void;
};

function ToggleChip({
  label,
  active = false,
  onClick,
}: Readonly<ToggleChipProps>) {
  return (
    <IconButton
      size="small"
      onClick={onClick}
      sx={{
        color: active ? '#3bbffa' : alpha('#dee5ff', 0.3),
        border: `1px solid ${active ? alpha('#3bbffa', 0.4) : alpha('#1e293b', 0.8)}`,
        borderRadius: '6px',
        fontSize: '10px',
        padding: '4px 8px',
        whiteSpace: 'nowrap',
        '&:hover': {
          bgcolor: alpha('#3bbffa', 0.1),
        },
      }}
    >
      <Typography sx={{ fontSize: '10px', fontWeight: 700 }}>
        {label}
      </Typography>
    </IconButton>
  );
}

export default function ViewerHeader({
  logBasePath,
  setLogBasePath,
  logFilePath,
  setLogFilePath,
  compatibleLogFiles,
  data,
  searchStr,
  setSearchStr,
  hideIncomplete,
  setHideIncomplete,
  hideNoise,
  setHideNoise,
  expandAllLines,
  setExpandAllLines,
}: Readonly<ViewerHeaderProps>) {
  return (
    <TerminalHeader>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TerminalIcon sx={{ color: '#3bbffa' }} />
          <Typography
            variant="h6"
            sx={{ fontWeight: 900, letterSpacing: '-0.05em', fontSize: '16px' }}
          >
            LOG VIEWER
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'flex',
            bgcolor: '#0a1529',
            p: 0.5,
            borderRadius: '8px',
            border: `1px solid ${alpha('#1e293b', 0.8)}`,
          }}
        >
          {Object.entries(LOG_PATHS).map(([label, path]) => (
            <Button
              key={label}
              size="small"
              onClick={() => setLogBasePath(path)}
              sx={{
                minWidth: '64px',
                fontSize: '11px',
                fontWeight: 700,
                color: logBasePath === path ? 'white' : alpha('#dee5ff', 0.3),
                bgcolor: logBasePath === path ? '#3bbffa' : 'transparent',
                '&:hover': {
                  bgcolor:
                    logBasePath === path ? '#3bbffa' : alpha('#3bbffa', 0.1),
                },
              }}
            >
              {label}
            </Button>
          ))}
        </Box>

        <FormControl size="small" sx={{ minWidth: 260 }}>
          <Select
            value={logFilePath}
            displayEmpty
            onChange={(e) => setLogFilePath(String(e.target.value))}
            sx={{
              height: '34px',
              fontSize: '11px',
              fontWeight: 700,
              color: '#dee5ff',
              bgcolor: alpha('#0a1529', 0.5),
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: alpha('#1e293b', 0.8),
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: '#3bbffa',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#3bbffa',
              },
            }}
          >
            {!compatibleLogFiles.length && (
              <MenuItem value="" disabled>
                No compatible logs found
              </MenuItem>
            )}
            {compatibleLogFiles.map((file) => (
              <MenuItem key={file.path} value={file.path}>
                {file.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          flex: 1,
          minWidth: 0,
          mx: 4,
        }}
      >
        <LogSearch
          data={data}
          searchStr={searchStr}
          setSearchStr={setSearchStr}
        />
        <ToggleChip
          label={expandAllLines ? 'COLLAPSE ALL' : 'EXPAND ALL'}
          active={expandAllLines}
          onClick={() => setExpandAllLines((prev) => !prev)}
        />
        <ToggleChip
          label={hideNoise ? 'HIDE PREP/UNCL' : 'SHOW PREP/UNCL'}
          active={hideNoise}
          onClick={() => setHideNoise((prev) => !prev)}
        />
        <ToggleChip
          label={hideIncomplete ? 'HIDE INC' : 'SHOW ALL'}
          active={hideIncomplete}
          onClick={() => setHideIncomplete((prev) => !prev)}
        />
      </Box>
    </TerminalHeader>
  );
}
