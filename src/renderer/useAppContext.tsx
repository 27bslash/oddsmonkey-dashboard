import {
  ReactNode,
  createContext,
  useContext,
  Dispatch,
  SetStateAction,
} from 'react';
import { BData, BetType } from '../../types';
import { Theme } from '@mui/material';

type AppContextType = {
  devMachine: boolean;
  allBets: BData[] | undefined;
  k: Exclude<keyof BData, 'anomaly'>;
  orderBy: keyof BetType;
  setK: Dispatch<SetStateAction<Exclude<keyof BData, 'anomaly'>>>;
  setSortDirection: any;
  sortDirection: 'desc' | 'asc';
  setOrderBy: any;
  setAllBets: Dispatch<SetStateAction<BData[]>>;
  balance: { smarkets: number; betfair: number };
  theme: Theme;
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
