import { useEffect, useState } from 'react';
import { red } from '@mui/material/colors';
import TextSnippetIcon from '@mui/icons-material/TextSnippet';
import { BData } from '../../../types';
import { IconWrapper } from '../bets/Bet/betTable/betControls';
import { Button } from '@mui/material';
import { useLogs } from './core/useLogs';
import SimplifiedLogViewer from './stitch';
import { LOG_PATHS } from './stitch/types';

type LogsProps = {
  bet?: BData;
};
const Logs = ({ bet }: LogsProps) => {
  const [logErrored, setLogErrored] = useState(false);
  const [logOverlay, setLogOverlay] = useState(false);
  const [logBasePath, setLogBasePath] = useState(LOG_PATHS.DIST);
  const [logFilePath, setLogFilePath] = useState('');

  const {
    errored,
    acknowledgeErrors,
    filter,
    setFilter,
    setSearchStr,
    searchStr,
    rawLogString,

  } = useLogs({
    bet,
    logBasePath,
    logFilePath: bet ? undefined : logFilePath,
  });

  useEffect(() => {
    setLogErrored(errored);
  }, [errored]);

  useEffect(() => {
    if (logOverlay) {
      acknowledgeErrors();
      setLogErrored(false);
    }
  }, [logOverlay, acknowledgeErrors]);
  console.log('rendering Logs, errored:', errored);
  return bet ? (
    <IconWrapper
      icon={
        <TextSnippetIcon
          sx={{ padding: '5px', color: logErrored ? red['800'] : 'orange' }}
          className="icon"
          id="log-icon"
        />
      }
      overlayBool={logOverlay}
      setOverlayBool={setLogOverlay}
      overlayComponent={
        <SimplifiedLogViewer
          bet={bet}
          filter={filter}
          setFilter={setFilter}
          setSearchStr={setSearchStr}
          searchStr={searchStr}
          rawLogString={rawLogString}
          logBasePath={logBasePath}
          setLogBasePath={setLogBasePath}
          logFilePath={logFilePath}
          setLogFilePath={setLogFilePath}
        />
      }
      justify="center"
    />
  ) : (
    <IconWrapper
      icon={
        <Button
          variant="contained"
          onClick={() => {
            setLogErrored(false);
          }}
          color={logErrored ? 'error' : 'primary'}
        >
          logs
          <TextSnippetIcon
            sx={{
              padding: '5px',
              color: 'white',
              height: '40px',
            }}
            className="icon"
            id="log-icon"
          />
        </Button>
      }
      overlayBool={logOverlay}
      setOverlayBool={setLogOverlay}
      overlayComponent={
        <SimplifiedLogViewer
          bet={bet}
          filter={filter}
          setFilter={setFilter}
          setSearchStr={setSearchStr}
          searchStr={searchStr}
          rawLogString={rawLogString}
          logBasePath={logBasePath}
          setLogBasePath={setLogBasePath}
          logFilePath={logFilePath}
          setLogFilePath={setLogFilePath}
        />
      }
      justify="center"
    />
  );
};
export default Logs;
