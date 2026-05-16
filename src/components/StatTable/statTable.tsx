import { Box, Table } from '@mui/material';
import { useState, useEffect } from 'react';
import { BData, Matched } from '../../../types';
import StatTableBody from './balanceTable/balanceTable';
import TableHeader from './balanceTable/BalanceTableHeader';
import { useAppContext } from '../../renderer/useAppContext';
import { Config } from '../config/config';
import { weightedAverage } from '../bets/Bet/BetCell/matched/matchedCell';
import { filterTimestampsByDay, filterTimestampsByWeek } from '../bets/bets';
import UpdateFlags from '../updateFlags';

type StatTableProps = {
  filter: 'active' | 'day' | 'week' | 'month' | 'year' | 'all time';
  setFilter: React.SetStateAction<any>;
  filteredBets: BData[];
  totalBets: BData[];
  flags: { [key: string]: string };
  setFlag: (flag: string) => void;
};
export type TotalProps = {
  totalProfit: number;
  minProfit: number;
  maxProfit: number;
  smarketsLoss: number;
  betfairLoss: number;
  totalLiability: number;
  accurateBalance: { [key: string]: any };
};

function StatTable({
  filter,
  setFilter,
  filteredBets,
  totalBets,
  flags,
  setFlag,
}: StatTableProps) {
  const [totals, setTotals] = useState<TotalProps>();
  const [profitOverride, setProfitOverride] = useState(0);

  const getBetOutcomeProfits = (bet: BData) => {
    let backWins = 0;
    let layLiability = 0;
    let backLiability = 0;
    let layWins = 0;
    const backMatchedBets = Array.isArray(bet.bet_profit?.back_matched)
      ? bet.bet_profit.back_matched
      : [];
    const exchangeMatchedBets = Array.isArray(bet.bet_profit?.exchange_matched)
      ? bet.bet_profit.exchange_matched
      : [];

    backMatchedBets.forEach((matchedBet) => {
      (matchedBet.odds ?? []).forEach((odd, i) => {
        const matched = Array.isArray(matchedBet.matched)
          ? (matchedBet.matched[i] ?? 0)
          : 0;
        backWins +=
          (odd - 1) * matched * (1 - (bet.bet_odds.back_commission ?? 0.02));
        backLiability += matched;
      });
    });

    exchangeMatchedBets.forEach((matchedBet) => {
      (matchedBet.odds ?? []).forEach((odd, i) => {
        const matched = Array.isArray(matchedBet.matched)
          ? (matchedBet.matched[i] ?? 0)
          : 0;
        layWins += matched * (1 - bet.bet_odds.commission);
        layLiability += (odd - 1) * matched;
      });
    });

    return {
      backWinProfit: backWins - layLiability,
      layWinProfit: layWins - backLiability,
    };
  };

  const manualProfitOverride = async () => {
    const data = await window.electron.ipcRenderer.fetchItems(
      'manual_profit_override',
    );
    let filtered: { time: number; profit: number }[] =
      data[0]['profit_tracker'];
    if (filter === 'active') {
      filtered = data[0]['profit_tracker'].filter(
        (x: { [key: string]: number }) =>
          x.time >= new Date().getTime() / 1000 - 5400,
      );
    } else if (filter === 'day') {
      const { startHour, endHour } = filterTimestampsByDay();
      filtered = data[0]['profit_tracker'].filter(
        (x: { [key: string]: number }) =>
          x.time >= startHour && x.time <= endHour,
      );
    } else if (filter === 'week') {
      const startOfWeek = filterTimestampsByWeek() + 6000;
      console.log(startOfWeek);
      filtered = data[0]['profit_tracker'].filter(
        (x: { [key: string]: number }) => x.time >= startOfWeek,
      );
    }
    const reduced = filtered.reduce((acc, curr) => acc + curr.profit, 0);
    console.log(reduced);
    setProfitOverride(reduced);
  };
  useEffect(() => {
    manualProfitOverride();
  }, [filter]);
  const { allBets, balance } = useAppContext();
  const updateProfit = (matchData: Matched[], key: string) => {
    const backLay: any = { back: {}, lay: {} };
    for (let doc of matchData) {
      doc.odds.forEach((odd, i) => {
        backLay[key][odd] = (backLay[key][odd] || 0) + doc.matched[i];
      });
    }
    if (!Object.keys(backLay[key]).length) {
      backLay[key] = { 0: 0 };
    }
    return backLay;
  };
  useEffect(() => {
    if (!filteredBets) return;

    const betProfits = filteredBets.map((bet) => getBetOutcomeProfits(bet));
    if (!betProfits) return;

    let avgProfit = +filteredBets
      .reduce(
        (sum, _, i) =>
          sum + (betProfits[i].backWinProfit + betProfits[i].layWinProfit) / 2,
        0,
      )
      .toFixed(2);
    let minProfit = +filteredBets
      .reduce(
        (sum, _, i) =>
          sum +
          Math.min(betProfits[i].backWinProfit, betProfits[i].layWinProfit),
        0,
      )
      .toFixed(2);
    let maxProfit = +filteredBets
      .reduce(
        (sum, _, i) =>
          sum +
          Math.max(betProfits[i].backWinProfit, betProfits[i].layWinProfit),
        0,
      )
      .toFixed(2);
    // filter bets by event time + 90 minutes to account for game time
    const timeFilteredBets = filteredBets.filter(
      (x) => x.bet_info.unix_time > new Date().getTime() / 1000 - 5400,
    );
    // [...filteredBets].sort((a, b) => b.bet_profit.back_matched.reduce((curr,sum) => sum matched - a))
    const smarketsLoss = currentLoss(filteredBets, 'smarkets');
    const betfairLoss = currentLoss(filteredBets, 'betfair');

    const totalLiability =
      currentLoss(filteredBets, 'smarkets') +
      currentLoss(filteredBets, 'betfair');

    const fetchAccurateBalance = async () => {
      const trueBalance =
        await window.electron.ipcRenderer.fetchItems('true_balance');
      //   console.log(trueBalance[0].balance);
      const convertedTodayTime = new Date().toISOString().split('T')[0];
      const arr = ['smarkets_balance', 'betfair_balance'];
      let TrueBalanceTotal = 0;

      const o: { [key: string]: any } = {};
      [
        trueBalance[0].balance[trueBalance[0].balance.length - 1],
        trueBalance[0].balance[trueBalance[0].balance.length - 2],
      ].forEach((x) => {
        if (x['smarkets_balance']) {
          o['smarkets'] = x;
        } else if (x['betfair_balance']) {
          o['betfair'] = x;
        }
      });

      console.log(TrueBalanceTotal);
      setTotals((prev) => ({ ...prev!, accurateBalance: o }));
      return TrueBalanceTotal;
    };
    const accurateBalance = fetchAccurateBalance();
    //   const loss =
    //     curr.bet_info.exchange === 'betfair'
    //       ? curr.bet_profit.lay_liability
    //       : curr.bet_profit.back_liability;
    //   return sum + loss;

    minProfit += profitOverride;
    avgProfit += profitOverride;
    maxProfit += profitOverride;
    setTotals((prev) => ({
      ...prev!,
      totalProfit: avgProfit,
      minProfit: minProfit,
      maxProfit: maxProfit,
      smarketsLoss: +smarketsLoss.toFixed(2),
      betfairLoss: +betfairLoss.toFixed(2),
      totalLiability: +totalLiability.toFixed(2),
      //   accurateBalance: accurateBalance,
    }));
  }, [allBets, filteredBets, profitOverride]);
  return (
    <Box
      display={'flex'}
      justifyContent={'space-between'}
      width={'100%'}
      marginBottom={'50px'}
    >
      <UpdateFlags flags={flags} setFlag={setFlag} />
      {totals && totals.accurateBalance && (
        <Table style={{ width: '600px', height: '150px' }}>
          <TableHeader filter={filter} />
          <StatTableBody totals={totals} filter={filter} balance={balance} />
        </Table>
      )}
      <Config></Config>
    </Box>
  );

  function currentLoss(
    timeFilteredBets: BData[],
    type: 'smarkets' | 'betfair',
  ) {
    const seenEvents: BData[] = [];
    console.log(timeFilteredBets);
    return timeFilteredBets.reduce((totalLoss, bet) => {
      const isExchange = bet.bet_info.exchange === type;
      const matchedBets = isExchange
        ? bet.bet_profit.exchange_matched
        : bet.bet_profit.back_matched;
      //   console.log(bet.bet_info.event_name, type, isExchange);
      const matchArr = matchedBets.map((matchObj) => matchObj.matched).flat();
      const oddsArr = matchedBets.map((matchObj) => matchObj.odds).flat();

      const avgOdds = weightedAverage(matchArr, oddsArr);

      const totalLiability = matchedBets.reduce((liabilitySum, matchedBet) => {
        if (matchedBet.matched) {
          const matchedSum = matchedBet.matched.reduce(
            (sum, value) => sum + value,
            0,
          );
          return liabilitySum + matchedSum;
        }
        return (
          liabilitySum +
          (isExchange
            ? bet.bet_profit.lay_liability
            : bet.bet_profit.back_liability)
        );
      }, 0);

      let loss = totalLiability;
      if (avgOdds)
        loss = isExchange ? totalLiability * (avgOdds - 1) : totalLiability;
      const oldEvent = seenEvents.find(
        (doc) =>
          doc.bet_info.event_name === bet.bet_info.event_name &&
          doc.bet_info.event_time === bet.bet_info.event_time &&
          doc.bet_info.bet === bet.bet_info.bet &&
          doc.bet_info.exchange !== bet.bet_info.exchange,
      );
      const foundBet = timeFilteredBets.find(
        (match) =>
          match.bet_info.bet === bet.bet_info.bet &&
          match.bet_info.event_name === bet.bet_info.event_name &&
          match.bet_info.exchange !== bet.bet_info.exchange,
      );
      if (oldEvent) {
        // console.log(
        //   foundBet.bet_info.exchange,
        //   bet.bet_info.event_name,
        //   totalLoss,
        //   bet.bet_info.exchange,
        //   loss,
        // );
        return totalLoss - loss;
      }
      seenEvents.push(bet);
      return totalLoss + loss;
    }, 0);
  }
}
export default StatTable;
