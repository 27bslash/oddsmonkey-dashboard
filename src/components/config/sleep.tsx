import Button from '@mui/material/Button';
import { ChangeEvent, useEffect, useState } from 'react';
import Box from '@mui/material/Box';

const Sleep = () => {
  const [sleepTime, setSleepTime] = useState<number>(2);
  const [sleeping, setSleeping] = useState(false);
  const [manualSleeping, setManualSleeping] = useState(false);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('00:00'); // ✅ New state for countdown

  const handleClick = () => {
    if (isButtonDisabled) return;
    const query = {};
    const collectionName = 'sleep-time';
    const currentTime = Date.now() / 1000;
    const endSleepTime =
      !sleeping && sleepTime ? currentTime + sleepTime * 60 * 60 : 0;
    const update = { $set: { sleep: endSleepTime } };

    window.electron.ipcRenderer.updateItem({ collectionName, query, update });
    setManualSleeping((prev) => !prev);

    // Disable button for 10 seconds
    setIsButtonDisabled(true);
    setTimeout(() => setIsButtonDisabled(false), 2000);
  };
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const currentTime = Date.now() / 1000;
    const endSleepTime = currentTime + +e.target.value * 60 * 60;
    const update = { $set: { sleep: endSleepTime } };
    const query = {};
    const collectionName = 'sleep-time';
    if (sleeping) {
      window.electron.ipcRenderer.updateItem({ collectionName, query, update });
    }
    setSleepTime(+e.target.value);
  };
  useEffect(() => {
    const interval = setInterval(() => {
      window.electron.ipcRenderer.fetchItems('sleep-time').then((promise) => {
        const currentSleep: number = +promise[0].sleep;
        const currentTime = Date.now() / 1000;

        if (currentTime >= currentSleep) {
          setSleeping(false);
          setTimeRemaining('00:00');
        } else {
          setSleeping(true);
          const remainingSeconds = Math.max(0, currentSleep - currentTime);
          const hours = Math.floor(remainingSeconds / 3600);
          const minutes = Math.floor((remainingSeconds % 3600) / 60);
          const seconds = Math.floor(remainingSeconds % 60);
          setTimeRemaining(
            `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
          );
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [manualSleeping]);

  return (
    <Box display="flex" alignItems={'center'}>
      <Button
        sx={{
        //   height: '60px',
          bgcolor: sleeping ? 'error.main' : 'primary.main',
          opacity: isButtonDisabled ? 0.5 : 1,
          '&:disabled': {
            bgcolor: 'primary.main',
            color: 'white',
            cursor: 'not-allowed',
          },
        }}
        disabled={!sleepTime || isButtonDisabled}
        onClick={handleClick}
        variant="contained"
      >
        {isButtonDisabled
          ? 'Wait...'
          : sleeping
            ? `Sleeping For ${timeRemaining}`
            : 'Sleep'}
      </Button>
      <input
        className="config-number-input"
        type="number"
        value={sleepTime}
        onChange={handleChange}
        min="1"
        max="1000"
        style={{ fontSize: '20px', padding: '5px' }}
        step={1}
      ></input>
    </Box>
  );
};

export default Sleep;
