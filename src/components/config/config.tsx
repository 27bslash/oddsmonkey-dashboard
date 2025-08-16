import { Box, Button, Typography } from '@mui/material';
import { ChangeEvent, useEffect, useState } from 'react';
import ShutDown from './shutdown';
import Sleep from './sleep';
import { useAppContext } from '../../renderer/useAppContext';
import discord from '../../icons/discord.png';
type configObj = {
  SINGLE_BET_MAX: number;
  USE_MONEY: boolean;
  MIN_BALANCE: number;
  MAX_LIABILITY: number;
};
export function Config() {
  const [config, setConfig] = useState<configObj>();
  const [running, setRunning] = useState(false);
  const [query, setQuery] = useState({});
  const [update, setUpdate] = useState({});
  const [status, setStatus] = useState('');
  const [flashed, setFlashed] = useState(false);
  const [exeRunning, setExeRunning] = useState(false);
  const { devMachine } = useAppContext();
  const handleUpdate = async (
    updateType: 'updateRunningState' | 'updateConfig',
  ) => {
    try {
      let updateObj = {
        collectionName: 'config',
        query: {},
        update: { $set: update },
      };
      if (updateType === 'updateRunningState') {
        updateObj = {
          collectionName: 'config',
          query: {},
          update: { $set: { FORCE_STOP: running } },
        };
        setRunning(!running);
      }
      const modifiedCount =
        await window.electron.ipcRenderer.updateItem(updateObj);

      setStatus(`Modified ${modifiedCount} documents.`);
      console.log(query, update, status);
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }
  };
  useEffect(() => {
    const handleConfigFetched = (fetchedData: any) => {
      setConfig(fetchedData[0]);
    };
    const handleHeartbeat = (fetchedData: any) => {
      const last_active =
        new Date().getTime() / 1000 - fetchedData[0].last_active < 300;
      if (running !== last_active) {
        window.electron.ipcRenderer.resetIconEvent('app-down');
      }
      setRunning(last_active);
      if (!last_active && !flashed) {
        console.log('running', last_active, flashed);
        window.electron.ipcRenderer.flashIcon('app-down');
        setFlashed(true);
      }
    };
    window.electron.ipcRenderer.onConfigFetched(handleConfigFetched);
    window.electron.ipcRenderer.onHeartbeatFetched(handleHeartbeat);
    const interval = setInterval(() => {
      const t = async () => {
        if (!devMachine) return;
        await window.electron.ipcRenderer
          .isExeRunning('discord_bot.exe')
          .then((isRunning) => {
            console.log('isExeRunning', isRunning);
            setExeRunning(isRunning);
          });
      };
      t();
    }, 1000);
    return () => {
      window.electron.ipcRenderer.onConfigFetched(() => {});
      window.electron.ipcRenderer.onHeartbeatFetched(() => {});
      clearInterval(interval);
    };
  }, []);
  return (
    <>
      {config && (
        <Box
          padding={2}
          //   border={'solid 1px black'}
          //   borderRadius={'3px'}
          bgcolor={'inherit'}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {Object.entries(config).map(([key, value]) => {
              let currency = true;
              if (typeof value === 'number') {
                if (key === 'TIMES_PLACED_THRESHOLD') {
                  currency = false;
                }
                return (
                  <NumberInput
                    value={value}
                    label={key.replace(/_/g, ' ').toLocaleLowerCase()}
                    setUpdate={setUpdate}
                    currency={currency}
                  />
                );
              }
            })}
          </div>

          <div style={{ display: 'flex' }}>
            <Button
              onClick={() => handleUpdate('updateConfig')}
              variant="contained"
              style={{
                marginRight: '10px',
                marginBottom: '10px',
                textWrap: 'nowrap',
              }}
            >
              Update Config
            </Button>
            <Button
              onClick={() => handleUpdate('updateRunningState')}
              variant="contained"
              style={{
                marginRight: '10px',
                marginBottom: '10px',
                color: 'white',
              }}
              color={!running ? 'success' : 'error'}
            >
              {running ? 'Stop' : 'Start'}
            </Button>
          </div>
          <Box display={'flex'}>
            {!exeRunning && devMachine && (
              <Button
                variant="contained"
                onClick={() => {
                  return window.electron.ipcRenderer.startDiscordBot();
                }}
                sx={{
                  marginRight: '10px',
                }}
              >
                <img src={discord} height={'25px'}></img>
              </Button>
            )}
            <ShutDown />
            <Sleep />
          </Box>
        </Box>
      )}
    </>
  );
}

export function NumberInput({
  value,
  label,
  setUpdate,
  currency,
}: {
  value: number;
  label: string;
  setUpdate: React.Dispatch<React.SetStateAction<any>>;
  currency: boolean;
}) {
  const placeholder = value;
  const [inputValue, setinputValue] = useState(String(placeholder));
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setinputValue(e.target.value);
    const labelText = e.target.nextSibling?.textContent
      ?.toUpperCase()
      .replace(/\s/g, '_');
    if (!labelText) {
      return;
    }
    setUpdate((prev: any) => ({ ...prev, [labelText]: +e.target.value }));
  };
  return (
    <div
      style={{
        display: 'flex',
        position: 'relative',
        marginLeft: '10px',
        // fontSize: '20px',
      }}
    >
      {currency && <span className="config-currency-sign">£</span>}
      <input
        className="config-number-input"
        type="number"
        placeholder={String(placeholder)}
        value={inputValue}
        onChange={handleChange}
        min="1"
        max="1000"
        style={{ fontSize: '20px', padding: '5px' }}
        step={1}
      ></input>
      <label>
        <Typography padding={0.3} textTransform={'capitalize'}>
          {label}
        </Typography>
      </label>
    </div>
  );
}
