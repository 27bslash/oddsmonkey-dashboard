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
import { useEffect, useState } from 'react';

import LineChart from './LineChart';
import { Button, Switch, FormControlLabel } from '@mui/material';
import { useAppContext } from '../../renderer/useAppContext';
import { BData } from '../../../types';
import {
  filterTimestampsByDay,
  filterTimestampsByWeek,
  filterTimestampsByMonth,
  filterTimestampsByYear,
} from '../bets/bets';
import zoomPlugin from 'chartjs-plugin-zoom';
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
export type TrueBalance = {
  balance: BalanceEntry[];
};
type GraphProps = {
  filter: 'active' | 'day' | 'week' | 'month' | 'year' | 'all time';
};
export function filterBets(betDates: number[], timeFilter: string) {
  const yearFilter = filterTimestampsByYear();
  const f = betDates.filter((x) => {
    const balanceTime = new Date(x).getTime();
    if (timeFilter === 'active') {
      return x;
    } else if (timeFilter === 'day') {
      return x;
    } else if (timeFilter === 'week') {
      return balanceTime >= filterTimestampsByWeek();
    } else if (timeFilter === 'month') {
      return balanceTime >= filterTimestampsByMonth();
    } else if (timeFilter === 'year') {
      return balanceTime >= yearFilter;
    }
    return x;
  });
  console.log('fdiltere', f);
  return f.map((x) => {
    return new Date(x * 1000).toISOString().split('T')[0];
  });
}
const Graph = ({ filter }: GraphProps) => {
  const [labels, setLabels] = useState<string[]>([]);
  const [dataPoints, setDataPoints] = useState<{
    total: number[];
    smarkets: number[];
    betfair: number[];
  }>({
    total: [],
    smarkets: [],
    betfair: [],
  });
  const [overrides, setOverrides] = useState<Record<string, number>>({});
  const [smarketsBalByDate, setSmarketsBalByDate] = useState<number[]>([]);
  const [betfairBalByDate, setBetfairBalByDate] = useState<number[]>([]);
  const [dates, setDates] = useState<Set<string>>(new Set());
  const [showOverrides, setShowOverrides] = useState(true);
  useEffect(() => {
    const fetchBalance = async () => {
      const trueBalance: TrueBalance[] =
        await window.electron.ipcRenderer.fetchItems('true_balance');
      const balanceOverride = await window.electron.ipcRenderer.fetchItems(
        'true_balance_override',
      );
      const newDates = new Set<string>(
        trueBalance[0].balance.map((doc) => doc.time),
      );
      const filteredDates = filterBets(
        Array.from(newDates).map((date) => new Date(date).getTime() / 1000),
        filter,
      );
      console.log('filtere', filteredDates);
      setDates(new Set(filteredDates));
      if (showOverrides) {
        console.log('balanceOverride', balanceOverride);
        setOverrides(balanceOverride[0].overrides || {});
      } else {
        setOverrides({});
      }
      const smarketsBalByDate = getBetsByDate(
        newDates,
        trueBalance,
        'smarkets_balance',
      );
      const betfairBalByDate = getBetsByDate(
        newDates,
        trueBalance,
        'betfair_balance',
      );
      setSmarketsBalByDate(smarketsBalByDate);
      setBetfairBalByDate(betfairBalByDate);
    };
    fetchBalance();
  }, [showOverrides]);

  useEffect(() => {
    if (Object.keys(overrides).length === 0) {
      setDataPoints({
        smarkets: smarketsBalByDate,
        betfair: betfairBalByDate,
        total: smarketsBalByDate.map((x, i) => x + betfairBalByDate[i]),
      });
      setLabels(Array.from(dates));
      return;
    }
    console.log('overrides', overrides);
    for (const date of Object.keys(overrides)) {
      if (date === '0') {
        console.log('dfa;lfj');
        continue;
      }

      const dateTime = new Date(date).getTime();
      for (const [i, _] of smarketsBalByDate.entries()) {
        if (dateTime >= new Date([...dates][i]).getTime()) {
          smarketsBalByDate[i] += overrides[date];
        }
      }
      //   const mapped = smarketsBalByDate.map((x, i) => {
      //     if (dateObj.getTime() >= new Date([...dates][i + 1]).getTime()) {
      //       return (x += overrides[date]);
      //     } else {
      //       return x;
      //     }
      //   });
      const total = smarketsBalByDate.map((x, i) => x + betfairBalByDate[i]);
      setDataPoints({
        smarkets: smarketsBalByDate,
        betfair: betfairBalByDate,
        total: total,
      });
    }
    setLabels(Array.from(dates));
  }, [overrides, smarketsBalByDate, betfairBalByDate, dates]);
  return (
    <div className="relative">
      <FormControlLabel
        control={
          <Switch
            checked={showOverrides}
            onChange={() => setShowOverrides((prev) => !prev)}
            color="success"
          />
        }
        label="Overrides"
        style={{
          position: 'absolute',
          top: 16,
          right: 100,
          zIndex: 10,
        }}
      />
      {labels && (
        <LineChart
          labels={[...labels]}
          dataPoints={dataPoints}
          overrides={overrides}
          setOverrides={setOverrides}
        />
      )}
    </div>
  );
};
export default Graph;
function getBetsByDate(
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
