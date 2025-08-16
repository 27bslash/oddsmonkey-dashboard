import { Box, Typography } from '@mui/material';
import Button from '@mui/material/Button';
import { useState } from 'react';
import { Dialog, DialogActions, DialogTitle } from '@mui/material';
import { Check, Close } from '@mui/icons-material';
import { useAppContext } from '../../renderer/useAppContext';

const ShutDown = () => {
  const [shutdownConfirmWindow, setShutdownConfirmWindow] = useState(false);
  const { devMachine } = useAppContext();
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
          console.log('heartbeat', data[0]);
          const last_active = data[0].last_active;
          if (stopped || last_active < Date.now() - 10000) {
            console.log('shutdown');
            const updateObj = {
              collectionName: 'config',
              query: {},
              update: { $set: { FORCE_STOP: false } },
            };
            window.electron.ipcRenderer.updateItem(updateObj);
            window.electron.ipcRenderer.ShutDown();
          }
        });
    }, 1000);
  };

  return (
    devMachine && (
      <Box marginRight={'8px'}>
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
            <Box
              display={'flex'}
              justifyContent={'space-around'}
              width={'100%'}
            >
              <Button
                variant="contained"
                startIcon={<Check />}
                color="success"
                onClick={handleClick}
                sx={{ color: 'white' }}
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
    )
  );
};
export default ShutDown;
