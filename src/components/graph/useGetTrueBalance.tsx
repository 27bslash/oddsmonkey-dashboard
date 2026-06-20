import { useEffect, useState } from 'react';
import { filterBets, TrueBalance } from './graph';
import { getBetsByDate } from './graphWrapper';

const useGetTrueBalance = (
  filter: 'active' | 'day' | 'week' | 'month' | 'year' | 'all time',
) => {
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
    let active = true;
    const fetchBalance = async () => {
      const trueBalance: TrueBalance[] =
        await window.electron.ipcRenderer.fetchItems('true_balance');
      const balanceOverride = await window.electron.ipcRenderer.fetchItems(
        'true_balance_override',
      );
      if (!active || !trueBalance[0]) return;
      const newDates = new Set<string>(
        trueBalance[0].balance.map((doc) => doc.time),
      );
      const filteredDates = filterBets(
        Array.from(newDates).map((date) => new Date(date).getTime() / 1000),
        filter,
      );
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
    const interval = setInterval(fetchBalance, 10000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [filter, showOverrides]);
  return {
    smarketsBalByDate,
    betfairBalByDate,
    overrides,
    setOverrides,
    dates,
    showOverrides,
    setShowOverrides,
  };
};
export default useGetTrueBalance;
