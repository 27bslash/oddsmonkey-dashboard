import {
  Box,
  Typography,
  Button,
  TextField,
  IconButton,
  alpha,
  FormControl,
  Select,
  MenuItem,
} from '@mui/material';
import { Terminal as TerminalIcon, Search as SearchIcon } from '@mui/icons-material';
import { TerminalHeader } from './styled';
import { LOG_PATHS } from './types';

type ViewerHeaderProps = {
  logBasePath: string;
  setLogBasePath: (path: string) => void;
  logFilePath: string;
  setLogFilePath: (path: string) => void;
  compatibleLogFiles: { name: string; path: string }[];
  searchStr: string;
  setSearchStr: (s: string) => void;
  hideIncomplete: boolean;
  setHideIncomplete: (fn: (prev: boolean) => boolean) => void;
};

export default function ViewerHeader({
  logBasePath,
  setLogBasePath,
  logFilePath,
  setLogFilePath,
  compatibleLogFiles,
  searchStr,
  setSearchStr,
  hideIncomplete,
  setHideIncomplete,
}: Readonly<ViewerHeaderProps>) {
  return (
    <TerminalHeader>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TerminalIcon sx={{ color: '#3bbffa' }} />
          <Typography variant="h6" sx={{ fontWeight: 900, letterSpacing: '-0.05em', fontSize: '16px' }}>
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
                  bgcolor: logBasePath === path ? '#3bbffa' : alpha('#3bbffa', 0.1),
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

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, maxWidth: '600px', mx: 4 }}>
        <TextField
          fullWidth
          placeholder="FILTER LOGS..."
          variant="outlined"
          size="small"
          value={searchStr}
          onChange={(e) => setSearchStr(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <SearchIcon sx={{ color: alpha('#dee5ff', 0.3), mr: 1, fontSize: 18 }} />
              ),
              sx: {
                height: '36px',
                bgcolor: alpha('#0a1529', 0.5),
                fontSize: '11px',
                fontFamily: 'monospace',
                color: '#dee5ff',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: alpha('#1e293b', 0.8) },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#3bbffa' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3bbffa' },
              },
            },
          }}
        />
        <IconButton
          size="small"
          onClick={() => setHideIncomplete((prev) => !prev)}
          sx={{
            color: hideIncomplete ? '#3bbffa' : alpha('#dee5ff', 0.3),
            border: `1px solid ${hideIncomplete ? alpha('#3bbffa', 0.4) : alpha('#1e293b', 0.8)}`,
            borderRadius: '6px',
            fontSize: '10px',
            padding: '4px 8px',
          }}
        >
          <Typography sx={{ fontSize: '10px', fontWeight: 700 }}>
            {hideIncomplete ? 'HIDE INC' : 'SHOW ALL'}
          </Typography>
        </IconButton>
      </Box>
    </TerminalHeader>
  );
}
