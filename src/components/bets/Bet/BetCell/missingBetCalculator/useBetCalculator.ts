import { useState, useEffect } from 'react';
import { BData, Matched } from '../../../../../../types';
import { weightedAverage } from '../matched/matchedCell';
import {
  bookmakerNetProfit,
  rawLayWin,
  rawBackWin,
  calculateLayLiability,
} from '../../../../../utils/betCalculations';

export type MatchObj = {
  back: { stake: number; odds: number };
  lay: { stake: number; odds: number };
};

export type BetCalcParams = {
  avgBackOdds: number;
  avgLayOdds: number;
  backStake: number;
  layStake: number;
  currentBackOdds: number;
  currentLayOdds: number;
  commission: number;
  backCommission: number;
};

export type MissingBet = {
  missingBackBet: number;
  missingLayBet: number;
};

interface UseBetCalculatorReturn {
  obj: MatchObj | undefined;
  betCalculationParams: BetCalcParams;
  missingBet: MissingBet | undefined;
  backTotal: number;
  layTotal: number;
  backLiabilityTotal: number;
  layLiabilityTotal: number;
  backOddsValue: number;
  layOddsValue: number;
  update: boolean;
  setValueObj: React.Dispatch<React.SetStateAction<BetCalcParams>>;
  setUpdate: React.Dispatch<React.SetStateAction<boolean>>;
  setMissingBet: React.Dispatch<React.SetStateAction<MissingBet | undefined>>;
  setBackOddsValue: React.Dispatch<React.SetStateAction<number>>;
  setLayOddsValue: React.Dispatch<React.SetStateAction<number>>;
  updateValue: (value: number, type: 'lay' | 'back') => void;
}

export const useBetCalculator = (data: BData): UseBetCalculatorReturn => {
  const { back_matched, exchange_matched } = data.bet_profit;

  const [backTotal, setBackTotal] = useState(0);
  const [layTotal, setLayTotal] = useState(0);
  const [layLiabilityTotal, setLayLiabilityTotal] = useState(0);
  const [backLiabilityTotal, setBackLiabilityTotal] = useState(0);
  const [missingBet, setMissingBet] = useState<MissingBet | undefined>();
  const [obj, setObj] = useState<MatchObj>();
  const [backOddsValue, setBackOddsValue] = useState<number>(0);
  const [layOddsValue, setLayOddsValue] = useState<number>(0);
  const [update, setUpdate] = useState(false);

  const [betCalculationParams, setValueObj] = useState<BetCalcParams>({
    avgBackOdds: 0,
    avgLayOdds: 0,
    backStake: 0,
    layStake: 0,
    currentBackOdds: 0,
    currentLayOdds: 0,
    commission: data.bet_odds.commission,
    backCommission: data.bet_odds.back_commission ?? 0.02,
  });

  const combineMatchedArrays = (type: string) => {
    const dataArr = type === 'lay' ? exchange_matched : back_matched;
    return dataArr
      .map((matchObj) =>
        matchObj.matched.map((stake, i) => ({
          stake: stake,
          odds: matchObj.odds[i],
        })),
      )
      .flat();
  };

  const initialiseValues = (type: 'lay' | 'back') => {
    const vals = combineMatchedArrays(type);
    const matchArr = vals.map((matchObj) => matchObj.stake);
    const oddsArr = vals.map((matchObj) => matchObj.odds);
    const avgOdds =
      weightedAverage(matchArr, oddsArr) || (type === 'back' ? 1 : 15);
    const stake = vals.reduce((acc, curr) => acc + curr.stake, 0) || 0;
    return { stake, odds: avgOdds };
  };

  // Initialize on mount
  useEffect(() => {
    const backVals = initialiseValues('back');
    const layVals = initialiseValues('lay');
    setObj({
      back: backVals,
      lay: layVals,
    });
    setLayOddsValue(
      exchange_matched[exchange_matched.length - 1].odds[
        exchange_matched[exchange_matched.length - 1].odds.length - 1
      ],
    );
    setValueObj({
      avgBackOdds: +backVals.odds.toFixed(3),
      avgLayOdds: +layVals.odds.toFixed(3),
      backStake: +backVals.stake.toFixed(2),
      layStake: +layVals.stake.toFixed(2),
      currentBackOdds: +backVals.odds.toFixed(3),
      currentLayOdds: +layVals.odds.toFixed(3),
      commission: +data.bet_odds.commission.toFixed(2),
      backCommission: +data.bet_odds.back_commission.toFixed(2),
    });
    setBackOddsValue(
      back_matched[back_matched.length - 1].odds[
        back_matched[back_matched.length - 1].odds.length - 1
      ],
    );
  }, []);

  const updateValue = (value: number, type: 'lay' | 'back') => {
    if (type === 'lay') {
      setLayOddsValue(value);
    } else {
      setBackOddsValue(value);
    }
  };

  const betCalculatorMaths = (): MissingBet | undefined => {
    if (!back_matched[0]['matched'] || !exchange_matched[0]['matched']) {
      return;
    }
    try {
      const sumBackStake = betCalculationParams.backStake;

      const calcMissingLayBet = () => {
        let bestLayBet = betCalculationParams.layStake;
        let bestLayDiff = 9999;

        for (let i = 0; i < 100000; i++) {
          const testBet = betCalculationParams.layStake + i / 100;
          const newAvgOdds = weightedAverage(
            [betCalculationParams.layStake, i / 100],
            [
              betCalculationParams.avgLayOdds,
              betCalculationParams.currentLayOdds,
            ],
          );
          const liability = calculateLayLiability(testBet, newAvgOdds);

          const exWinProfit =
            rawLayWin(betCalculationParams.layStake, data.bet_odds.commission) +
            rawLayWin(i / 100, betCalculationParams.commission) -
            sumBackStake;

          const bkWinProfit = bookmakerNetProfit(
            sumBackStake,
            betCalculationParams.avgBackOdds,
            data.bet_odds.back_commission,
            liability,
          );

          const difference = Math.abs(bkWinProfit - exWinProfit);

          if (difference < bestLayDiff) {
            bestLayBet = testBet;
            bestLayDiff = difference;
          }
          if (bkWinProfit < exWinProfit) {
            break;
          }
        }
        return +(bestLayBet - betCalculationParams.layStake).toFixed(2);
      };

      const missingdLayBet = calcMissingLayBet();

      const calcMissingBackBet = () => {
        let bestBet = betCalculationParams.backStake;
        let bestDifference = 9999;

        const liability = calculateLayLiability(
          betCalculationParams.layStake,
          betCalculationParams.avgLayOdds,
        );
        const historicalBackWin = rawBackWin(
          betCalculationParams.backStake,
          betCalculationParams.avgBackOdds,
          data.bet_odds.back_commission,
        );

        for (let i = 0; i < 100000; i++) {
          const testBet = betCalculationParams.backStake + i / 100;
          const missingBetWin = rawBackWin(
            i / 100,
            betCalculationParams.currentBackOdds,
            betCalculationParams.backCommission,
          );

          const bkWinProfit = missingBetWin + historicalBackWin - liability;
          const exWinProfit =
            rawLayWin(betCalculationParams.layStake, data.bet_odds.commission) -
            testBet;

          const difference = Math.abs(bkWinProfit - exWinProfit);

          if (difference < bestDifference) {
            bestBet = testBet;
            bestDifference = difference;
          }
          if (bkWinProfit > exWinProfit) {
            break;
          }
        }
        return +(bestBet - betCalculationParams.backStake).toFixed(2);
      };

      const missingdBackBet = calcMissingBackBet();

      return { missingBackBet: missingdBackBet, missingLayBet: missingdLayBet };
    } catch (error) {
      console.log(error);
      return undefined;
    }
  };

  // Recalculate missing bets when params change
  useEffect(() => {
    if (!betCalculationParams) return;
    const newMissingBet = betCalculatorMaths();
    setMissingBet(newMissingBet);
  }, [obj, backOddsValue, layOddsValue, betCalculationParams]);

  // Calculate totals and liabilities
  useEffect(() => {
    if (!missingBet) {
      return;
    }
    if (missingBet.missingBackBet > 0 && update) {
      setBackTotal(
        rawBackWin(
          betCalculationParams.backStake,
          betCalculationParams.avgBackOdds,
          data.bet_odds.back_commission,
        ) +
          rawBackWin(
            missingBet.missingBackBet,
            betCalculationParams.currentBackOdds,
            betCalculationParams.backCommission,
          ),
      );
      setBackLiabilityTotal(
        betCalculationParams.backStake + missingBet.missingBackBet,
      );
    }
    if (missingBet.missingLayBet > 0 && update) {
      setLayTotal(
        rawLayWin(betCalculationParams.layStake, data.bet_odds.commission) +
          rawLayWin(missingBet.missingLayBet, betCalculationParams.commission),
      );
      setLayLiabilityTotal(
        calculateLayLiability(
          betCalculationParams.layStake,
          betCalculationParams.avgLayOdds,
        ) +
          calculateLayLiability(
            missingBet.missingLayBet,
            betCalculationParams.currentLayOdds,
          ),
      );
    }
    if (!update) {
      setBackLiabilityTotal(betCalculationParams.backStake);
      setBackTotal(
        rawBackWin(
          betCalculationParams.backStake,
          betCalculationParams.avgBackOdds,
          data.bet_odds.back_commission,
        ),
      );
      setLayLiabilityTotal(
        calculateLayLiability(
          betCalculationParams.layStake,
          betCalculationParams.avgLayOdds,
        ),
      );
      setLayTotal(
        rawLayWin(betCalculationParams.layStake, data.bet_odds.commission),
      );
    }
  }, [missingBet, update]);

  return {
    obj,
    betCalculationParams,
    missingBet,
    backTotal,
    layTotal,
    backLiabilityTotal,
    layLiabilityTotal,
    backOddsValue,
    layOddsValue,
    update,
    setValueObj,
    setUpdate,
    setMissingBet,
    setBackOddsValue,
    setLayOddsValue,
    updateValue,
  };
};
