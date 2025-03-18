import {
  ReactNode,
  createContext,
  useContext,
  Dispatch,
  SetStateAction,
} from 'react';
import { BData, BetType } from '../../types';

type AppContextType = {
  devMachine: boolean;
  allBets: BData[] | undefined;
  k: keyof BData;
  orderBy: keyof BetType;
  setK: Dispatch<SetStateAction<keyof BData>>;
  setSortDirection: any;
  sortDirection: 'desc' | 'asc';
  setOrderBy: any;
  setAllBets: Dispatch<SetStateAction<BData[]>>;
  balance: { smarkets: number; betfair: number };
};
const AppContext = createContext<AppContextType | null>(null);
type AppContextProviderProps = {
  children: ReactNode;
  value: AppContextType;
};
const AppContextProvider = ({ children, value }: AppContextProviderProps) => {
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within a AppContextProvider');
  }
  return context;
};
export default AppContextProvider;
