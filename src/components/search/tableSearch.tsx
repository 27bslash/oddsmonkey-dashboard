import { Box, TextField } from '@mui/material';
import { SetStateAction, useState } from 'react';
type TableSearchProps = {
  setSearchFilter: React.Dispatch<SetStateAction<string | undefined>>;
};
const TableSearch = ({ setSearchFilter }: TableSearchProps) => {
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);

  return (
    <Box width={'300px'} marginRight={'20px'} >
      <TextField
        onChange={(e) => {
          const inputValue = e.target.value;
          setValue(inputValue);
          setSearchFilter(inputValue);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setValue('');
            setSearchFilter('');
          }
        }}
        value={value}
        sx={{
          backgroundColor: 'white',
          borderRadius: '4px',
          marginBottom: '15px',
          width: '100%',
          '& .MuiInputBase-root': {
            padding: '10px',
          },
          '& input[type=number]::-webkit-inner-spin-button, & input[type=number]::-webkit-outer-spin-button':
            {
              color: 'red',
              height: '40px',
              marginBottom: '5%',
              cursor: 'pointer',
            },
        }}
        label=""
        placeholder="Search For Event Name"
        variant="filled"
      ></TextField>
    </Box>
  );
};
export default TableSearch;
