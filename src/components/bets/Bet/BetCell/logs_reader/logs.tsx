import { useEffect, useState } from 'react';
import LogOverlay from './logOverlay';
import { orange, red } from '@mui/material/colors';
import TextSnippetIcon from '@mui/icons-material/TextSnippet';
import { BData } from '../../../../../../types';
import { IconWrapper } from '../../betTable/betControls';
import { Button } from '@mui/material';
import { useLogs } from './useLogs';
import { useAppContext } from '../../../../../renderer/useAppContext';
type LogsProps = {
  bet?: BData;
  //   setOverlay: React.Dispatch<React.SetStateAction<boolean>>;
  //   overlay: boolean;
};
const Logs = ({ bet }: LogsProps) => {
  const [logErrored, setLogErrored] = useState(false);
  const [logOverlay, setLogOverlay] = useState(false);
  const { errored } = useLogs({ bet });
  const { devMachine } = useAppContext();
  if (!devMachine) {
    return null;
  }

  useEffect(() => {
    setLogErrored(errored);
  }, [errored]);
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
      overlayComponent={<LogOverlay bet={bet} />}
      justify="center"
    />
  ) : (
    
    <IconWrapper
      icon={
        <>
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
        </>
      }
      overlayBool={logOverlay}
      setOverlayBool={setLogOverlay}
      overlayComponent={<LogOverlay bet={bet} />}
      justify="center"
    />
  );
};
export default Logs;
