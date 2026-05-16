/**
 * Pure calculation utilities for bet math
 * Safe to use in both main and renderer processes
 */

export const calculateLayLiability = (stake: number, odds: number): number =>
  stake * (odds - 1);

export const rawLayWin = (stake: number, commission: number): number =>
  stake * (1 - commission);

export const exchangeNetProfit = (
  layStake: number,
  commission: number,
  liability: number,
): number => rawLayWin(layStake, commission) - liability;

export const rawBackWin = (
  stake: number,
  odds: number,
  commission: number,
): number => stake * (odds - 1) * (1 - commission);

export const bookmakerNetProfit = (
  backStake: number,
  backOdds: number,
  backCommission: number,
  liability: number,
): number => rawBackWin(backStake, backOdds, backCommission) - liability;
export interface BetProfitCalculation {
  backTotalWin: number;
  backLiability: number;
  layTotalWin: number;
  layLiability: number;
}

export const calculateBetProfits = (
  backMatched: Array<{ matched: number[]; odds: number[] }>,
  exchangeMatched: Array<{ matched: number[] }>,
  backCommission: number,
  layCommission: number,
): BetProfitCalculation => {
  const backTotalWin = backMatched.reduce(
    (sum, m) => sum + rawBackWin(m.matched[0], m.odds[0], backCommission),
    0,
  );

  const backLiability = exchangeMatched.reduce(
    (sum, m) => sum + m.matched[0],
    0,
  );

  const layTotalWin = exchangeMatched.reduce(
    (sum, m) => sum + rawLayWin(m.matched[0], layCommission),
    0,
  );

  const layLiability = backMatched.reduce(
    (sum, m) => sum + calculateLayLiability(m.matched[0], m.odds[0]),
    0,
  );

  return { backTotalWin, backLiability, layTotalWin, layLiability };
};
