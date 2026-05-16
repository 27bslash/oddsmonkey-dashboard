import { Typography } from '@mui/material';
import { green, red } from '@mui/material/colors';
import EditableCell from './editableTextCell';
import { useState, useEffect, SetStateAction } from 'react';
import { BData, Matched } from '../../../../../../types';
import { useBet } from '../../../betContext';
import BetTableCell from '../betCell';

type MatchedCellProps = {
  lay: boolean;
  index: number;
  stake: number;
  show: boolean;
  bet: BData;
  setBet: React.Dispatch<SetStateAction<BData>>;
};
export const weightedAverage = (matchedArr: number[], oddsArr: number[]) => {
  const weightedAvg =
    oddsArr.reduce((acc, odd, index) => acc + odd * matchedArr[index], 0) /
    matchedArr.reduce((acc, stake) => acc + stake, 0);
  return weightedAvg;
};
function MatchedCell({
  lay,
  index,
  stake,
  show,
  bet,
  setBet,
}: MatchedCellProps) {
  const [backWinProfit, setBackWinProfit] = useState(0);
  const [layWinProfit, setLayWinProfit] = useState(0);
  const [backLay, setBackLay] = useState<{
    [key: string]: { [key: number]: number };
  }>({
    back: {},
    lay: {},
  });

  // for (const x of matchedArr) {
  // odds.reduce((acc, odd, i) => acc + odd * stakes[i], 0) /
  //   sumStakes(stakes);
  // }

  const updateObj = (matchData: Matched[], key: string) => {
    if (!matchData.length) return;
    const backLay: any = { back: {}, lay: {} };
    let matched: number[] = [];
    let staked: number[] = [];
    let odds: number[] = [];
    if (index === 0 && matchData.length > 1 && !show) {
      for (let x of matchData) {
        for (let k in x) {
          const keys = k as keyof typeof x;
          if (keys === 'bet_matched_time') continue;

          if (k === 'matched') matched = matched.concat(x[keys]);
          if (k === 'staked') staked = staked.concat(x[keys]);
          if (k === 'odds') odds = odds.concat(x[keys]);
        }
      }
    }
    if (matched.length && staked.length) {
      const weightedAvgOdds = weightedAverage(matched, odds);

      backLay[key][weightedAvgOdds] = matched.reduce(
        (acc, curr) => (acc += curr),
        0,
      );
    }
    if (
      !Object.keys(backLay[key]).length &&
      Object.keys(matchData[index]).length
    ) {
      //   console.log(bet.bet_info.bet, matched, staked);
      //   console.log(index, lay, matchData);
      matchData[index].odds.forEach((odd, i) => {
        backLay[key][odd] =
          (backLay[key][odd] || 0) + matchData[index].matched[i];
      });
      if (!Object.keys(backLay[key]).length) {
        backLay[key] = { 0: 0 };
      }
    }
    //   ret.push(backLay);

    // console.log(ret);

    return backLay;
  };
  useEffect(() => {
    if (!Object.keys(bet).length) return;
    const layObj = updateObj(bet.bet_profit.exchange_matched, 'lay');
    const backObj = updateObj(bet.bet_profit.back_matched, 'back');
    if (layObj && backObj) {
      setBackLay(() => {
        return { lay: layObj['lay'], back: backObj['back'] };
      });
    }
  }, [bet, show]);

  useEffect(() => {
    let backWins = 0;
    let layLiability = 0;
    let backLiability = 0;
    let layWins = 0;
    Object.entries(backLay['back']).forEach((x) => {
      backWins +=
        (+x[0] - 1) * x[1] * (1 - (bet.bet_odds.back_commission ?? 0.02));
      backLiability += x[1];
    });
    Object.entries(backLay['lay']).forEach((x) => {
      layWins += +x[1] * (1 - bet.bet_odds.commission);
      layLiability += (+x[0] - 1) * x[1];
    });

    setBackWinProfit(backWins - layLiability);
    setLayWinProfit(layWins - backLiability);
  }, [backLay, bet]);
  const borderBottom =
    index === bet.bet_profit.back_matched.length - 1 && lay
      ? 'none'
      : '1px solid black';
  if (bet.bet_info.bet == 'Nueva Chicago') {
    console.log(backLay['back']);
  }
  return (
    bet && (
      <>
        <BetTableCell borderBottom={borderBottom}>
          {!lay
            ? Object.keys(backLay['back']).map((x, i) => {
                return (
                  <EditableCell
                    matchVal={backLay['back']}
                    bet={bet}
                    setBet={setBet}
                    lay={false}
                    type={'odds'}
                    index={index}
                    show={show}
                    val={+x}
                  />
                );
              })
            : Object.keys(backLay['lay']).map((x, i) => {
                return (
                  <EditableCell
                    matchVal={backLay['lay']}
                    bet={bet}
                    setBet={setBet}
                    lay={true}
                    val={+x}
                    type={'odds'}
                    index={index}
                    show={show}
                  />
                );
              })}
        </BetTableCell>
        <BetTableCell>
          {!lay ? (
            <>
              {Object.values(backLay['back']).map((x, i) => {
                return (
                  <EditableCell
                    matchVal={backLay['back']}
                    bet={bet}
                    setBet={setBet}
                    lay={false}
                    type={'matched'}
                    stake={stake}
                    index={index}
                    show={show}
                    val={x}
                  />
                );
              })}
            </>
          ) : (
            <>
              {Object.values(backLay['lay']).map((x, i) => {
                return (
                  <EditableCell
                    matchVal={backLay['lay']}
                    bet={bet}
                    setBet={setBet}
                    lay={true}
                    val={x}
                    show={show}
                    index={index}
                    stake={stake}
                    type={'matched'}
                  />
                );
              })}
            </>
          )}
        </BetTableCell>
        <BetTableCell>
          {!lay ? (
            <Typography color={backWinProfit >= 0 ? green['400'] : red['400']}>
              £{backWinProfit.toFixed(2)}
            </Typography>
          ) : (
            <Typography color={layWinProfit >= 0 ? green['400'] : red['400']}>
              £{layWinProfit.toFixed(2)}
            </Typography>
          )}
        </BetTableCell>
        <BetTableCell>
          £
          {(
            Math.min(
              bet.bet_odds.total_back_liquidity,
              bet.bet_odds.total_lay_liquidity,
            ) * 0.8
          ).toFixed(2)}
        </BetTableCell>
      </>
    )
  );
}
export default MatchedCell;
