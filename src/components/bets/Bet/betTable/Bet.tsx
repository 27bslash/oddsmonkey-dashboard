import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Typography,
} from '@mui/material';
import { grey, red } from '@mui/material/colors';
import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en.json';
import { useState, useEffect } from 'react';
import { BData } from '../../../../../types';
import BetProvider from '../../betContext';
import BetTableHead from './BetHeader/betTableHead';
import BetTableRow from './betRow';
import { ObjectId } from 'mongodb';
import BetControls from './betControls';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import updateMatched from '../../../../utils/updateMatched';
import AddMatchedBetDialog from '../BetCell/matched/addMatchedBetDialog';

TimeAgo.addDefaultLocale(en);

function Bet({
  bet,
  updateSort,
  deleteBet,
}: {
  bet: BData;
  updateSort: any;
  deleteBet: (_id: ObjectId) => void;
}) {
  const theme = useTheme();
  const [show, setShow] = useState(false);
  const [betData, setBetData] = useState<BData>(bet);
  const [showAddBetDialog, setShowAddBetDialog] = useState(false);
  useEffect(() => {
    setBetData(bet);
  }, [bet]);
  let value;
  if (betData) value = { betData, updateSort, setBetData };
  const borderColor = bet.anomaly ? red['900'] : grey['800'];
  updateMatched(betData.bet_profit.back_matched, betData.bet_profit.exchange_matched);
  return (
    value && (
      <BetProvider value={value}>
        <Box
          border={2}
          marginBottom={1}
          borderColor={borderColor}
          borderRadius={2}
          p={2}
          sx={{
            backgroundColor: theme.palette.table.background,
          }}
        >
          <Box>
            <div className="flex" style={{ alignItems: 'center' }}>
              <Typography variant="h6" color="white">
                {betData.bet_info['event_name']}
              </Typography>
              <BetControls bet={bet} deleteBet={deleteBet}></BetControls>
            </div>
            <Typography color={grey['400']} variant="caption">
              {bet.bet_info['market_type']}
            </Typography>
          </Box>

          <Typography>{bet.bet_info['bet']}</Typography>
          <Table sx={{ position: 'relative' }}>
            <BetTableHead updateSort={updateSort} />
            <TableBody>
              {(
                betData.bet_profit['back_matched'] ||
                betData.bet_profit['exchange_matched']
              ).map((x, i) => {
                // console.log(i, x);
                if (i === 0 || show) {
                  return (
                    <>
                      <BetTableRow
                        data={betData}
                        setBet={setBetData}
                        index={i}
                        lay={false}
                        show={show}
                      />
                      <BetTableRow
                        data={betData}
                        setBet={setBetData}
                        index={i}
                        lay={true}
                        show={show}
                      />
                    </>
                  );
                }
              })}
              {show && (
                <TableRow>
                  <TableCell colSpan={9} sx={{ borderBottom: 'none' }}>
                    <Box display="flex" justifyContent="flex-end">
                      <Button
                        variant="contained"
                        onClick={() => setShowAddBetDialog(true)}
                      >
                        Add bet
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            {betData.bet_profit['back_matched'].length > 1 && (
              <Button
                variant="contained"
                disableElevation
                sx={{
                  position: 'absolute',
                  top: '50%',
                  right: '0',
                  opacity: '1',
                  backgroundColor: theme.palette.table,
                  '&:hover': {
                    background: theme.palette.table.secondary,
                  },
                }}
                onClick={() => setShow((prev) => !prev)}
              >
                <Typography>
                  {betData.bet_profit['back_matched'].length - 1}
                </Typography>
                {!show ? <KeyboardArrowDown /> : <KeyboardArrowUp />}
              </Button>
            )}
          </Table>
          <AddMatchedBetDialog
            open={showAddBetDialog}
            onClose={() => setShowAddBetDialog(false)}
            bet={betData}
            setBet={setBetData}
          />
        </Box>
      </BetProvider>
    )
  );
}

export default Bet;
