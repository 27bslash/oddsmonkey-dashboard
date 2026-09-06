import { useEffect, useState } from 'react';
import { red } from '@mui/material/colors';
import TextSnippetIcon from '@mui/icons-material/TextSnippet';
import { BData } from '../../../types';
import { Button } from '@mui/material';
import { useJsonLogs } from './core/useJsonLogs';
import SimplifiedLogViewer from './stitch';
import { LOG_PATHS } from './stitch/types';
import { createPortal } from 'react-dom';

type LogsProps = {
  bet?: BData;
};
const Logs = ({ bet }: LogsProps) => {
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
  } = useJsonLogs({
    bet,
    logBasePath,
    logFilePath: bet ? undefined : logFilePath,
  });

  useEffect(() => {
    if (logOverlay) {
      acknowledgeErrors();
    }
  }, [logOverlay]);
  console.log('rendering Logs, errored:', errored);
  const overlayComponent = (
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
  );

  if (!bet) {
    return (
      <>
        <Button
          variant="contained"
          color={errored ? 'error' : 'primary'}
          onClick={() => {
            document.body.setAttribute('class', 'modal-open');
            setLogOverlay((p) => !p);
          }}
        >
          logs
          <TextSnippetIcon
            sx={{ padding: '5px', color: 'white', height: '40px' }}
            className="icon"
            id="log-icon"
          />
        </Button>
        {logOverlay &&
          createPortal(
            <div
              style={{ justifyContent: 'center' }}
              className="wrapper"
              onMouseDown={(e) => {
                document.body.removeAttribute('class');
                e.target === e.currentTarget && setLogOverlay(false);
              }}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setLogOverlay(false);
              }}
            >
              {overlayComponent}
            </div>,
            document.body,
          )}
      </>
    );
  }

  return (
    <>
      <div
        onClick={() => {
          document.body.setAttribute('class', 'modal-open');
          setLogOverlay((p) => !p);
        }}
        style={{
          width: 'fit-content',
          height: 'fit-content',
          cursor: 'pointer',
        }}
      >
        <TextSnippetIcon
          sx={{ padding: '5px', color: errored ? red['800'] : 'orange' }}
          className="icon"
          id="log-icon"
        />
      </div>
      {logOverlay &&
        createPortal(
          <div
            style={{ justifyContent: 'center' }}
            className="wrapper"
            onMouseDown={(e) => {
              document.body.removeAttribute('class');
              e.target === e.currentTarget && setLogOverlay(false);
            }}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setLogOverlay(false);
            }}
          >
            {overlayComponent}
          </div>,
          document.body,
        )}
    </>
  );
};
export default Logs;
