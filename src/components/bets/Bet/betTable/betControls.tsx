import { Box, Button } from '@mui/material';
import { useState } from 'react';
import { BData } from '../../../../../types';
import { ObjectId } from 'mongodb';
import DebugImages from '../BetCell/betImages/debugImages';
import DeleteOverlay from '../BetCell/delete/deleteOverlay';
import BetCalculator from '../BetCell/missingBetCalculator/betCalculator';
import DeleteIcon from '@mui/icons-material/Delete';
import CalculateOutlinedIcon from '@mui/icons-material/CalculateOutlined';
import TextSnippetIcon from '@mui/icons-material/TextSnippet';
import PanoramaIcon from '@mui/icons-material/Panorama';
import { useAppContext } from '../../../../renderer/useAppContext';
import { red } from '@mui/material/colors';
// import LogOverlay from '../BetCell/logs_reader/logOverlay';
// import { useLogs } from '../BetCell/logs_reader/useLogs';
// import Logs from '../BetCell/logs_reader/logs';
import { createPortal } from 'react-dom';
import { useLogs } from '../../../logs_reader/useLogs';
import Logs from '../../../logs_reader/logs';
type BetControlsProps = {
  bet: BData;
  deleteBet: (_id: ObjectId) => void;
};

const BetControls = ({ bet, deleteBet }: BetControlsProps) => {
  const [showBetCalc, setShowBetCalc] = useState(false);
  const [deleteOverlay, setDeleteOverlay] = useState(false);
  const [logOverlay, setLogOverlay] = useState(false);
  const [imageOverlay, setImageOverlay] = useState(false);
  const { errored } = useLogs({
    bet,
  });
  const isRecentBet = Date.now() / 1000 - bet.bet_info.bet_unix_time < 300;
  const { devMachine } = useAppContext();
  return (
    <>
      {isRecentBet && (
        <Button
          disabled
          variant="contained"
          sx={{
            background:
              'linear-gradient(200.96deg,#fedc2a -29.09%,#dd5789 51.77%,#7a2c9e 129.35%)',
            color: 'white !important',
            border: 'solid 1px black',
            marginLeft: '10px',
          }}
        >
          new bet
        </Button>
      )}
      <Box
        sx={{
          marginLeft: 'auto',
          display: 'flex',
        }}
      >
        <IconWrapper
          icon={
            <CalculateOutlinedIcon
              sx={{ padding: '5px' }}
              className="icon"
              color="success"
            />
          }
          overlayBool={showBetCalc}
          setOverlayBool={setShowBetCalc}
          overlayComponent={
            <BetCalculator setShowBetCalc={setShowBetCalc} data={bet} />
          }
          justify="center"
        />
        <IconWrapper
          icon={
            <DeleteIcon
              sx={{ padding: '5px' }}
              className="icon"
              color="error"
            />
          }
          overlayBool={deleteOverlay}
          setOverlayBool={setDeleteOverlay}
          overlayComponent={
            <DeleteOverlay
              bet={bet}
              setOverlay={setDeleteOverlay}
              deleteBet={deleteBet}
            />
          }
          justify="center"
        />
        {devMachine && (
          <>
            <Logs bet={bet} />
            <IconWrapper
              icon={
                <PanoramaIcon
                  sx={{ padding: '5px', color: '#96cbfe' }}
                  className="icon"
                />
              }
              overlayBool={imageOverlay}
              setOverlayBool={setImageOverlay}
              overlayComponent={
                <DebugImages
                  data={bet}
                  setOverlay={setImageOverlay}
                  overlay={imageOverlay}
                />
              }
              justify="center"
            />
          </>
        )}
      </Box>
    </>
  );
};

type IconWrapperProps = {
  icon: React.ReactNode;
  overlayBool: boolean;
  setOverlayBool: React.Dispatch<React.SetStateAction<boolean>>;
  overlayComponent: React.ReactNode;
  justify: string;
};

export const IconWrapper = ({
  icon,
  overlayBool,
  setOverlayBool,
  overlayComponent,
  justify,
}: IconWrapperProps) => {
  return (
    <>
      <div
        onClick={() => {
          document.body.setAttribute('class', 'modal-open');
          setOverlayBool((prev) => !prev);
        }}
        style={{
          width: 'fit-content',
          height: 'fit-content',
          cursor: 'pointer',
        }}
      >
        {icon}
      </div>
      {overlayBool &&
        createPortal(
          <div
            style={{ justifyContent: justify }}
            className="wrapper"
            onMouseDown={(e) => {
              document.body.removeAttribute('class');
              e.target === e.currentTarget && setOverlayBool(false);
            }}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setOverlayBool(false);
            }}
          >
            {overlayComponent}
          </div>,
          document.body,
        )}
    </>
  );
};

export default BetControls;
