import { ObjectId } from 'mongodb';

interface ElectronHandler {
  ipcRenderer: {
    sendMessage(channel: string, ...args: unknown[]): void;
    on(channel: string, func: (...args: unknown[]) => void): () => void;
    once(channel: string, func: (...args: unknown[]) => void): void;
    fetchItems(collection_name: string): Promise<any>;
    addItem(item: any, collection_name: string): Promise<any>;
    onDataFetched(callback: (data: any) => void): void;
  };
}

interface Window {
  electron: ElectronHandler;
}
export interface bInfo {
  bet: string;
  event_name: string;
  event_time: string;
  bet_time: string;
  bet_unix_time: number;
  unix_time: number;
  market_type: string;
  rating: string;
  bookmaker: 'smarkets' | 'betfair' | 'betconnect';
  exchange: 'smarkets' | 'betfair' | 'betconnect';
  bookie_link: string;
  exchange_link: string;
}

export interface BOdds {
  back_odds: number[];
  lay_odds: number[];
  max_bet: number;
  back_liquidity: number[];
  total_back_liquidity: number;
  total_lay_liquidity: number;
  exchange_liquidity: number[];
  avg_back_odds: number;
  avg_lay_odds: number;
  all_back_odds: number[];
  all_lay_odds: number[];
  commission: number;
}

export interface BProfit {
  back_stake: number;
  lay_stake: number;
  lay_win: number;
  lay_liability: number;
  lay_win_profit: number;
  back_win: number;
  back_liability: number;
  back_win_profit: number;
  back_matched: Matched[];
  exchange_matched: Matched[];
}
export interface Matched {
  odds: number[];
  staked: number[];
  bet_matched_time?: number;
  matched: number[];
}
export interface BData {
  _id: ObjectId;
  anomaly?: boolean;
  bet_info: bInfo;
  bet_odds: BOdds;
  bet_profit: BProfit;
}
export interface BetInfo {
  bet: string;
  event_name: string;
  event_time: string;
  bet_time: string;
  bet_unix_time: number;
  unix_time: number;
  market_type: string;
  rating: string;
  bookmaker: string;
  exchange: string;
  bookie_link: string;
  exchange_link: string;
}

export interface BetOdds {
  back_odds: number;
  lay_odds: number;
  max_bet: number;
  back_liquidity: number;
  exchange_liquidity: number;
}

export interface BetProfit {
  stake_value: number;
  lay_amount: number;
  lay_win: number;
  lay_liability: number;
  lay_win_profit: number;
  back_win: number;
  back_liability: number;
  back_win_profit: number;
}

export interface TestData {
  bet_info: BetInfo;
  bet_odds: BetOdds;
  bet_profit: BetProfit;
}

export interface BetType {
  event_name: string;
  event_time: string;
  bet_time: string;
  bet_unix_time: number;
  unix_time: number;
  market_type: string;
  rating: string;
  bookmaker: string;
  exchange: string;
  stake_value: number;
  lay_amount: number;
  lay_win: number;
  lay_liability: number;
  lay_win_profit: number;
  back_win: number;
  back_liability: number;
  back_win_profit: number;
  bet: string;
  bookie_link: string;
  exchange_link: string;
  back_odds: number;
  lay_odds: number;
  max_bet: number;
  back_liquidity: number;
  exchange_liquidity: number;
}
