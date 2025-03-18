import {
  bottomNavigationActionClasses,
  Box,
  Button,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableSortLabel,
  Typography,
} from '@mui/material';
import { blue, green, grey, red } from '@mui/material/colors';
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
  const [show, setShow] = useState(false);
  const [betData, setBetData] = useState<BData>(bet);
  useEffect(() => {
    if (betData !== bet) {
      setBetData(bet);
    }
  }, [bet]);
  let value;
  if (betData) value = { betData, updateSort, setBetData };
  return (
    value && (
      <BetProvider value={value}>
        <Box>
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
              {bet.bet_profit['back_matched'].map((x, i) => {
                // console.log(i, x);
                if (i === 0 || show) {
                  return (
                    <>
                      <BetTableRow
                        data={bet}
                        setBet={setBetData}
                        index={i}
                        lay={false}
                        show={show}
                      />
                      <BetTableRow
                        data={bet}
                        setBet={setBetData}
                        index={i}
                        lay={true}
                        show={show}
                      />
                    </>
                  );
                }
              })}
            </TableBody>
            {bet.bet_profit['back_matched'].length > 1 && (
              <Button
                variant="contained"
                disableElevation
                sx={{
                  position: 'absolute',
                  top: '50%',
                  zIndex: 9,
                  right: '0',
                  opacity: '1',
                  backgroundColor: '#212121',
                  '&:hover': {
                    background: '#96cbfe',
                  },
                }}
                onClick={() => setShow((prev) => !prev)}
              >
                <Typography>
                  {bet.bet_profit['back_matched'].length - 1}
                </Typography>
                {!show ? <KeyboardArrowDown /> : <KeyboardArrowUp />}
              </Button>
            )}
          </Table>
        </Box>
      </BetProvider>
    )
  );
}

export default Bet;
