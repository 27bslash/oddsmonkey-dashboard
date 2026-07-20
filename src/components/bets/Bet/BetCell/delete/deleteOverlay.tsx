import {
  TextField,
  IconButton,
  Typography,
  Box,
  InputAdornment,
} from '@mui/material';
import { useState } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { BData } from '../../../../../../types';
import { ObjectId } from 'mongodb';

type DeleteOverlayProps = {
  bet: BData;
  setOverlay: React.Dispatch<React.SetStateAction<boolean>>;
  deleteBet: (_id: ObjectId) => void;
};

const DeleteOverlay = ({
  bet: data,
  setOverlay,
  deleteBet,
}: DeleteOverlayProps) => {
  const [value, setValue] = useState<string | number | undefined>();
  const [error, setError] = useState(false);
  const handleDelete = () => {
    console.log(value);
    if (!value) {
      setError(true);
      return;
    }
    const pushObj = {
      time: data.bet_info.bet_unix_time,
      profit: +value,
    };
    window.electron.ipcRenderer.deleteEntryUpdateProfit(data._id, pushObj);
    setOverlay(false);
    deleteBet(data._id);
  };

  const handleKeypress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleDelete();
  };

  return (
    <Box
      sx={{
        zIndex: 99,
        width: '300px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'sticky',
        top: '350px',
        padding: '25px',
        backgroundColor: '#f44336',
        border: 'solid 3px black',
        borderRadius: '8px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          marginBottom: '10px',
        }}
      >
        <Typography
          variant="h6"
          //   marginLeft={'30px'}
          sx={{
            color: 'white',
            fontWeight: 'bold',
            textTransform: 'uppercase',
          }}
        >
          Delete Bet
        </Typography>
        <IconButton
          onClick={() => setOverlay(false)}
          sx={{ color: 'white', fontSize: '1.2rem' }}
        >
          <CloseIcon />
        </IconButton>
      </Box>
      <TextField
        onChange={(e) => {
          const inputValue = e.target.value;
          if (/^-?\d*\.?\d*$/.test(inputValue)) {
            setValue(inputValue);
            setError(false);
          }
        }}
        onBlur={() => {
          setValue((prev) => {
            return prev === '' || prev === '-' ? 0 : +prev;
          });
        }}
        onKeyDown={handleKeypress}
        value={value}
        inputMode="numeric"
        type="number"
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
        label="Enter Profit/Loss"
        inputProps={{ step: 0.01 }}
        slotProps={{
          input: {
            startAdornment: <InputAdornment position="start">£</InputAdornment>,
            style: {
              color: '#333',
              fontSize: '1rem',
              fontWeight: 'bold',
            },
            // shrink: true,
          },
        }}
        error={error}
        helperText={error ? 'incorrect entry' : ''}
        variant="filled"
      />
      {value && (
        <IconButton
          onClick={handleDelete}
          sx={{
            backgroundColor: 'white',
            padding: '10px',
            '&:hover': {
              backgroundColor: '#ff7961',
            },
          }}
        >
          <DeleteForeverIcon sx={{ color: '#f44336', fontSize: '2rem' }} />
        </IconButton>
      )}
    </Box>
  );
};

export default DeleteOverlay;
