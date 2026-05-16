import { SetStateAction, useEffect, useState } from 'react';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import Graph, { filterBets } from './graph';
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
export interface GraphDialogProps {
  open: boolean;
  setOpen: React.Dispatch<SetStateAction<boolean>>;
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
  useEffect(() => {
    const prevTrueBalance =
      smarketsBalByDate[smarketsBalByDate.length - 2] +
      betfairBalByDate[betfairBalByDate.length - 2];
    const currTrueBalance =
      smarketsBalByDate[smarketsBalByDate.length - 1] +
      betfairBalByDate[betfairBalByDate.length - 1];
    console.log(currTrueBalance, prevTrueBalance);
    if (currTrueBalance < prevTrueBalance) {
      setNegative(true);
    }
  }, [smarketsBalByDate, betfairBalByDate]);
  return (
    <>
      <TrendingUpIcon
        onClick={() => setOpen((prev) => !prev)}
        color={negative ? 'error' : 'success'}
        className="icon"
        sx={{ transform: negative ? 'rotate(60deg)' : 'none' }}
      />
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
