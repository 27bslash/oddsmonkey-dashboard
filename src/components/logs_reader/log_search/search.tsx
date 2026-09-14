import { Typography, TextField, alpha } from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { BetSection } from '../core/types';
import useLogSearch from './useLogSearch';

type LogSearchProps = {
  data: BetSection[][];
  searchStr: string;
  setSearchStr: (s: string) => void;
};

export default function LogSearch({
  data,
  searchStr,
  setSearchStr,
}: Readonly<LogSearchProps>) {
  const matchingLogLines = useLogSearch({ data, searchString: searchStr });

  return (
    <TextField
      fullWidth
      placeholder="SEARCH LOGS..."
      variant="outlined"
      size="small"
      value={searchStr}
      onChange={(e) => setSearchStr(e.target.value)}
      slotProps={{
        input: {
          startAdornment: (
            <SearchIcon
              sx={{ color: alpha('#dee5ff', 0.3), mr: 1, fontSize: 18 }}
            />
          ),
          endAdornment: (
            <Typography
              component="span"
              sx={{
                ml: 1,
                px: 0.75,
                borderRadius: '4px',
                fontSize: '10px',
                fontFamily: 'monospace',
                fontWeight: 700,
                color: alpha('#dee5ff', 0.5),
                bgcolor: alpha('#3bbffa', 0.12),
              }}
            >
              {matchingLogLines.length}
            </Typography>
          ),
          sx: {
            height: '36px',
            bgcolor: alpha('#0a1529', 0.5),
            fontSize: '11px',
            fontFamily: 'monospace',
            color: '#dee5ff',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: alpha('#1e293b', 0.8),
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#3bbffa',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#3bbffa',
            },
          },
        },
      }}
    />
  );
}
