import {
  ReactNode,
  createContext,
  useContext,
  Dispatch,
  SetStateAction,
} from 'react';
import { BData } from '../../../types';
import { SortKeys } from './bets';

type BetContextType = {
  betData: BData;
  setBetData: React.Dispatch<React.SetStateAction<BData>>;
  updateSort: (
    property: SortKeys,
    sortDirection: string,
    betKey: keyof BData,
  ) => void;
};
const Bet = createContext<BetContextType | null>(null);
type BetProviderProps = {
  children: ReactNode;
  value: BetContextType;
};
function BetProvider({ children, value }: BetProviderProps) {
  return <Bet.Provider value={value}>{children}</Bet.Provider>;
}
export const useBet = () => {
  const context = useContext(Bet);
  if (!context) {
    throw new Error('useBet must be used within a BetProvider');
  }
  return context;
};
export default BetProvider;
