import { Box, Typography } from '@mui/material';
import Button from '@mui/material/Button';
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import { Check, Close } from '@mui/icons-material';
import { red } from '@mui/material/colors';
const ShutDown = () => {
  const [stopping, setStopping] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [shutdownConfirmWindow, setShutdownConfirmWindow] = useState(false);
  useEffect(() => {
    const getFileNames = async () => {
      const images = await window.electron.ipcRenderer.getAllImages(
        'D:\\projects\\python\\odds_monkey_bot\\dist\\logs\\screenshots',
      );
      setShowButton(!!images);
    };
    getFileNames();
  }, []);
  const handleClick = async () => {
    // setStopping(true);
    const updateObj = {
      collectionName: 'config',
      query: {},
      update: { $set: { FORCE_STOP: true } },
    };

    await window.electron.ipcRenderer.updateItem(updateObj);
    setInterval(() => {
      const heartBeat = window.electron.ipcRenderer
        .fetchItems('heartbeat')
        .then((data) => {
          const stopped = data[0].stopped;
          if (stopped) {
            console.log('shutdown');
            window.electron.ipcRenderer.ShutDown();
          }
        });
    }, 1000);
  };

  return (
    <Box>
      <Button
        variant="contained"
        color="error"
        onClick={() => setShutdownConfirmWindow(true)}
      >
        <Typography textAlign={'center'} sx={{ textShadow: 'none' }}>
          Shutdown
        </Typography>
      </Button>
      <Dialog
        open={shutdownConfirmWindow}
        onClose={() => setShutdownConfirmWindow(false)}
        PaperProps={{ style: { padding: '10px' } }}
      >
        <DialogTitle>
          <Typography
            variant="h5"
            textAlign={'center'}
            sx={{ textShadow: 'none' }}
          >
            Shutdown?
          </Typography>
        </DialogTitle>
        <DialogActions>
          <Box display={'flex'} justifyContent={'space-around'} width={'100%'}>
            <Button
              variant="contained"
              startIcon={<Check />}
              color="success"
              onClick={handleClick}
            >
              Confirm
            </Button>
            <Button
              variant="contained"
              startIcon={<Close />}
              color="error"
              onClick={() => setShutdownConfirmWindow(false)}
            >
              Cancel
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
export default ShutDown;
