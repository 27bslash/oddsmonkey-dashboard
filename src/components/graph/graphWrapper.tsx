import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LineController,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import useGetTrueBalance from './useGetTrueBalance';
import GraphDialog from './graphDialog';
import zoomPlugin from 'chartjs-plugin-zoom';
import 'hammerjs';
import { Box, Tooltip as MuiTooltip, Typography } from '@mui/material';

export interface GraphDialogProps {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  filter: 'active' | 'day' | 'week' | 'month' | 'year' | 'all time';
}

ChartJS.register(
  LineElement,
  PointElement,
  LineController,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  zoomPlugin,
);

type BalanceEntry = {
  smarkets_balance?: number;
  time: string;
  betfair_balance?: number;
};

type TrueBalance = {
  balance: BalanceEntry[];
};

type GraphProps = {
  filter: 'active' | 'day' | 'week' | 'month' | 'year' | 'all time';
};

const GraphWrapper = ({ filter }: GraphProps) => {
  const [open, setOpen] = useState(false);
  const [negative, setNegative] = useState(false);
  const { smarketsBalByDate, betfairBalByDate } = useGetTrueBalance(filter);
  const prevTrueBalance =
    smarketsBalByDate.length >= 2 && betfairBalByDate.length >= 2
      ? smarketsBalByDate.at(-2)! + betfairBalByDate.at(-2)!
      : 0;
  const currTrueBalance =
    smarketsBalByDate.length >= 1 && betfairBalByDate.length >= 1
      ? smarketsBalByDate.at(-1)! + betfairBalByDate.at(-1)!
      : 0;
  const difference = currTrueBalance - prevTrueBalance;

  useEffect(() => {
    setNegative(currTrueBalance < prevTrueBalance);
  }, [currTrueBalance, prevTrueBalance]);

  return (
    <>
      <MuiTooltip
        title={
          <Box display="flex">
            <Typography>Difference from previous day</Typography>
            <Typography
              color={negative ? 'error' : 'success'}
              sx={{ fontWeight: 'bold', marginLeft: '5px' }}
            >
              £{difference.toFixed(2)}
            </Typography>
          </Box>
        }
      >
        <TrendingUpIcon
          onClick={() => setOpen((prev) => !prev)}
          color={negative ? 'error' : 'success'}
          className="icon"
          sx={{ transform: negative ? 'rotate(60deg)' : 'none' }}
        />
      </MuiTooltip>
      {open && <GraphDialog filter={filter} open={open} setOpen={setOpen} />}
    </>
  );
};

export function getBetsByDate(
  dates: Set<unknown>,
  trueBalance: TrueBalance[],
  type: 'smarkets_balance' | 'betfair_balance',
) {
  const balance_by_date = [];
  for (const date of dates) {
    const balance = trueBalance[0].balance.find(
      (doc) => doc[type] && doc.time === date,
    );
    if (balance) balance_by_date.push(balance[type]!);
  }
  return balance_by_date;
}

export default GraphWrapper;
