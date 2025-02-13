import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useState, useEffect } from 'react';
import { BData } from '../../../../../../types';
import CalculatorSection from './calculatorSection';
import { blue, green, red } from '@mui/material/colors';
import ProfitTable from './profitTable/profitTable';
import { weightedAverage } from '../matched/matchedCell';

export type MatchObj = {
  back: { stake: number; odds: number };
  lay: { stake: number; odds: number };
};

const BetCalculator = ({
  data,
  setShowBetCalc,
}: {
  data: BData;
  setShowBetCalc: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const testData = { matched: [10, 10], odds: [1.2, 2.3] };
  const [backTotal, setBackTotal] = useState(0);
  const [layTotal, setLayTotal] = useState(0);
  const { back_matched, exchange_matched } = data.bet_profit;

  const [layLiability, setLayLiability] = useState(0);
  const [backLiability, setBackLiability] = useState(0);
  const [missingBet, setMissingBet] = useState<{
    missingBackBet: number;
    missingLayBet: number;
  }>();
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
  function layCalc(
    bet: {
      back_odds: number;
      lay_stake: number;
      lay_odds: number;
      commission: number;
    },
    stake: number,
  ): number {
    let bookmakerBetResult = stake * bet.back_odds - stake;
    let closestPair = 9999;
    let bestBet = 0;

    for (let i = 0; i < 10000; i++) {
      let testBet = Math.round((bet.lay_stake + i / 100) * 100) / 100;
      let liability = Math.round(testBet * (bet.lay_odds - 1) * 100) / 100;

      let exchangeWinProfit =
        Math.round(testBet * (1 - bet.commission) - stake * 100) / 100;
      let bookmakerWinProfit =
        Math.round(bookmakerBetResult - liability * 100) / 100;

      let difference = Math.abs(bookmakerWinProfit - exchangeWinProfit);

      if (exchangeWinProfit < 0 || bookmakerWinProfit < 0) {
        break;
      }
      if (difference < closestPair) {
        bestBet = testBet;
        closestPair = difference;
      }
      if (exchangeWinProfit > bookmakerWinProfit) {
        return bestBet;
      }
    }
    return bestBet;
  }

  const initialiseValues = (type: 'lay' | 'back') => {
    const vals = combineMatchedArrays(type);
    const matchArr = vals.map((matchObj) => matchObj.stake);
    const oddsArr = vals.map((matchObj) => matchObj.odds);
    const avgOdds = weightedAverage(matchArr, oddsArr);
    const stake = vals.reduce((acc, curr) => acc + curr.stake, 0);
    return { stake, odds: avgOdds };
  };
  const [obj, setObj] = useState<MatchObj>();
  const [backOddsValue, setBackOddsValue] = useState<number>(0);
  const [layOddsValue, setLayOddsValue] = useState<number>(0);
  const [currentCommission, setCurrentCommission] = useState<number>(0);

  const [betCalculationParams, setValueObj] = useState({
    avgBackOdds: 0,
    avgLayOdds: 0,
    backStake: 0,
    layStake: 0,
    currentBackOdds: 0,
    currentLayOdds: 0,
    commission: data.bet_odds.commission,
  });

  const [updatedTotals, setUpdatedTotals] = useState({});
  const [update, setUpdate] = useState(false);
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
      commission: +betCalculationParams.commission.toFixed(2),
    });
    setBackOddsValue(
      back_matched[back_matched.length - 1].odds[
        back_matched[back_matched.length - 1].odds.length - 1
      ],
    );
  }, []);

  const updateValues = (stake: number, odds: number, type: 'back' | 'lay') => {
    if (!obj) return;
    console.log(obj, stake, odds, type);
    let newStakes = obj[type];
    newStakes = { stake, odds };
    setObj((prevValues) => ({
      ...prevValues!,
      [type]: newStakes,
    }));
  };
  const updateValue = (value: number, type: 'lay' | 'back') => {
    if (type === 'lay') {
      setLayOddsValue(value);
    } else {
      setBackOddsValue(value);
    }
  };
  useEffect(() => {
    // Recalculate the total whenever backStakes changes
    if (!betCalculationParams) return;
    const bTotal = betCalculationParams.backStake * (betCalculationParams.avgBackOdds - 1);
    setBackTotal(bTotal);
    setBackLiability(betCalculationParams.backStake);
    const lTotal = betCalculationParams.layStake * (betCalculationParams.avgLayOdds - 1);
    const layWins = betCalculationParams.layStake * (1 - data.bet_odds.commission);
    setLayTotal(layWins);
    setLayLiability(lTotal);
    // Lay Stake = Back odds x Back Stake / (Lay Odds - Commission)
    const totalLayStake = bTotal / (layOddsValue - data.bet_odds.commission);
    const missingLayLiability = totalLayStake * (layOddsValue - 1) - lTotal;
    const t = missingLayLiability / (layOddsValue - 1);
    // console.log(
    //   'missingLay:',
    //   missingLayLiability,
    //   'totallaystake:',
    //   totalLayStake,
    //   'partLay:',
    //   lTotal,
    // );
    // console.log('result:', t);
    setMissingBet(betCalculatorMaths());
  }, [obj, backOddsValue, layOddsValue, update, betCalculationParams]);

  const betCalculatorMaths = () => {
    // const { commission } = data.bet_odds;
    if (
      !back_matched[0]['matched'] ||
      !exchange_matched[0]['matched'] ||
      !betCalculationParams.layStake ||
      !betCalculationParams.backStake
    ) {
      console.log(back_matched, exchange_matched);
      return;
    }
    try {
      const calcMissingBet = (
        totalStake: number,
        avgOdds: number,
        combinedPartStake: number,
        oppositeAvgOdds: number,
        type: 'lay' | undefined,
      ) => {
        const commission = betCalculationParams.commission;
        // bet_amount = (total_back_stake * 1.02 * back_odds -( matched_bet * 1.02)) / lay_odds
        // console.log(
        //   'total',
        //   totalStake,
        //   'average odds',
        //   avgOdds,
        //   'matched',
        //   combinedPartStake,
        //   'opp odds',
        //   oppositeAvgOdds,
        // );
        const combinedTotal = totalStake * avgOdds;
        if (commission && type === 'lay') {
          //   combinedPartStake = matchedBet / commission;
        }
        // console.log(
        //   combinedTotal,
        //   combinedPartStake,
        //   (combinedTotal - combinedPartStake) / oppositeAvgOdds,
        // );
        return (combinedTotal - combinedPartStake) / oppositeAvgOdds;
      };
      //     ((Back_Stake*Back_Odds)-(Part_Lay_stake*Lays_Odds/Lay_Commission))/Part_Lay_odds
      // ((18.71 x 4.7) - ( 10 x 5 / 1.02))/4.6

      const sumBackStake = betCalculationParams.backStake;
      const sumLayStake = betCalculationParams.layStake;
      const layAvgOdds = betCalculationParams.avgLayOdds;
      const backAvgOdds = betCalculationParams.avgBackOdds;
      // const backAvgOdds = weightedAvg(back_matched.odds, back_matched.staked);
      //   const totalLayStake =
      //     (sumBackStake * backOddsValue!) / (layOddsValue! - commission);
      //   const totalBackStake =
      //     (sumLayStake * (layOddsValue! - commission)) / backOddsValue!;

      // console.log(totalBackStake, totalLayStake);
      const missingBackBet = calcMissingBet(
        sumLayStake,
        layAvgOdds,
        betCalculationParams.backStake * betCalculationParams.avgBackOdds,
        betCalculationParams.currentBackOdds,
        undefined,
      );
      //   console.log(1 - valueObj.commission / 2);
      const missingLayBet = calcMissingBet(
        sumBackStake,
        backAvgOdds,
        betCalculationParams.layStake * betCalculationParams.avgLayOdds,
        betCalculationParams.currentLayOdds,
        'lay',
      );
      const calcMissingLayBet = () => {
        let bestLayBet = betCalculationParams.layStake;
        let bestLayDiff = 9999;
        for (let i = 0; i < 10000; i++) {
          // 10000 penny strat op
          const testBet = betCalculationParams.layStake + i / 100;
          const newAvgOdds = wAvg(
            [betCalculationParams.avgLayOdds, betCalculationParams.currentLayOdds],
            [betCalculationParams.layStake, i / 100],
          );
          const liability = testBet * (newAvgOdds - 1);

          const exchangeWinProfit =
            betCalculationParams.layStake * (1 - betCalculationParams.commission) +
            (i / 100) * (1 - betCalculationParams.commission) -
            sumBackStake;

          const bookmakerWinProfit =
            sumBackStake * (betCalculationParams.avgBackOdds - 1) - liability;

          const difference = Math.abs(bookmakerWinProfit - exchangeWinProfit);

          if (difference < bestLayDiff) {
            bestLayBet = testBet;
            bestLayDiff = difference;
            console.log(bookmakerWinProfit, exchangeWinProfit);
          }
        }
        return +(bestLayBet - betCalculationParams.layStake).toFixed(2);
      };
      const missingdLayBet = calcMissingLayBet();
      const calcMissingBackBet = () => {
        let bestBet = betCalculationParams.backStake;
        let bestDifference = 9999;
        const liability = betCalculationParams.layStake * (betCalculationParams.avgLayOdds - 1);
        for (let i = 0; i < 10000; i++) {
          // 10000 penny strat op
          const testBet = betCalculationParams.backStake + i / 100;
          const newAvgOdds = wAvg(
            [betCalculationParams.avgBackOdds, betCalculationParams.currentBackOdds],
            [betCalculationParams.backStake, i / 100],
          );
          const bookmakerWinProfit =
            (i / 100) * (newAvgOdds - 1) +
            betCalculationParams.backStake * (betCalculationParams.avgBackOdds - 1) -
            liability;

          const exchangeWinProfit =
            betCalculationParams.layStake * (1 - data.bet_odds.commission) - testBet;

          const difference = Math.abs(bookmakerWinProfit - exchangeWinProfit);
          //   console.log('back diff', bookmakerWinProfit, exchangeWinProfit);
          if (difference < bestDifference) {
            bestBet = testBet;
            bestDifference = difference;
          }
        }
        return +(bestBet - betCalculationParams.backStake).toFixed(2);
      };
      const missingdBackBet = calcMissingBackBet();
      console.log('back', missingdBackBet, 'lay', missingdLayBet);
      // console.log(
      //   'totalbackstake',
      //   totalBackStake,
      //   sumLayStake,
      //   value.lay,
      //   totalLayStake,
      //   layAvgOdds,
      //   calcPartBet(value.lay),
      //   backAvgOdds,
      // );
      if (missingdBackBet > 0 && update) {
        console.log(backTotal, backLiability, missingdBackBet);
        setBackTotal((prev) => {
          return prev + missingdBackBet * (betCalculationParams.currentBackOdds - 1);
        });
        setBackLiability((prev) => prev + missingdBackBet);
      }
      if (missingdLayBet > 0 && update) {
        console.log('lay', layLiability, layTotal, missingdLayBet);
        setLayTotal(
          (prev) => prev + missingdLayBet * (1 - betCalculationParams.commission),
        );
        setLayLiability((prev) => {
          const previousLiability = prev * (betCalculationParams.avgLayOdds - 1);
          const currentLiability =
            missingdLayBet * (betCalculationParams.currentLayOdds - 1);
          return prev + currentLiability;
        });
      }
      return { missingBackBet: missingdBackBet, missingLayBet: missingdLayBet };
    } catch (error) {
      console.log(error);
      return undefined;
    }
  };
  return (
    obj && (
      <Box
        className="bet-calculator"
        display={'flex'}
        flexDirection={'column'}
        width={'500px'}
        // sx={{ background: green['200'] }}
      >
        {/* <Button
          onClick={() => setShowBetCalc(false)}
          elevated={false}
          variant="text"
          sx={{ marginLeft: 'auto', background: 'none', boxShadow: 'none' }}
        >
          X
        </Button> */}
        <CalculatorSection
          total={backTotal}
          liability={backLiability}
          type="back"
          valueObj={betCalculationParams}
          data={data}
          link={data.bet_info.bookie_link}
          updateValue={setValueObj}
          setUpdate={setUpdate}
          update={update}
          missingBet={missingBet?.missingBackBet}
        ></CalculatorSection>
        <CalculatorSection
          total={layTotal}
          liability={layLiability}
          type="lay"
          data={data}
          link={data.bet_info.exchange_link}
          valueObj={betCalculationParams}
          updateValue={setValueObj}
          setUpdate={setUpdate}
          update={update}
          missingBet={missingBet?.missingLayBet}
        ></CalculatorSection>
        {/* <MissingBetSlider
          obj={obj.back}
          updateValues={updateValues}
          initialiseValues={initialiseValues}
        /> */}
        <ProfitTable
          data={data}
          backLiability={backLiability}
          backTotal={backTotal}
          layLiability={layLiability}
          layTotal={layTotal}
        ></ProfitTable>
        {/* <Box className="profit-display">
          <Typography></Typography>
          <Typography>
            Back Profit:
            <span
              style={{
                color: backTotal < layLiability ? red['700'] : green['300'],
              }}
            >
              £{(backTotal - layLiability).toFixed(2)}
            </span>
          </Typography>
          <Typography>
            Lay Profit:
            <span
              style={{
                color: layTotal < backLiability ? red['700'] : green['300'],
              }}
            >
              £{(layTotal - backLiability).toFixed(2)}
            </span>
          </Typography>
        </Box> */}
      </Box>
    )
  );
};
function wAvg(odds: number[], stakes: number[]) {
  return (
    [...odds].reduce((sum, _, i) => sum + odds[i] * stakes[i], 0) /
    [...stakes].reduce((sum, stake) => sum + stake, 0)
  );
}
export default BetCalculator;
