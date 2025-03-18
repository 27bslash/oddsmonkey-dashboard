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

ChartJS.register(
  LineElement,
  PointElement,
  LineController,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
);

type BalanceEntry = {
  smarkets_balance?: number;
  time: string;
  betfair_balance?: number;
};
type TrueBalance = {
  balance: BalanceEntry[];
};
const Graph = () => {
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
  useEffect(() => {
    const fetchBalance = async () => {
      const trueBalance: TrueBalance[] =
        await window.electron.ipcRenderer.fetchItems('true_balance');
      const dates = new Set<string>(
        trueBalance[0].balance.map((doc) => doc.time),
      );

      const smarkets_bal_by_date = getBetsByDate(
        dates,
        trueBalance,
        'smarkets_balance',
      );
      const betfair_bal_by_date = getBetsByDate(
        dates,
        trueBalance,
        'betfair_balance',
      );
      const total = smarkets_bal_by_date.map(
        (x, i) => x + betfair_bal_by_date[i],
      );
      setDataPoints({
        smarkets: smarkets_bal_by_date,
        betfair: betfair_bal_by_date,
        total: total,
      });
      setLabels(Array.from(dates));
    };
    fetchBalance();
  }, []);
  return (
    <div className="w-full max-w-xl mx-auto">
      {labels && <LineChart labels={[...labels]} dataPoints={dataPoints} />}
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
