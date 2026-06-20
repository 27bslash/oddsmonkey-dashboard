import './App.css';
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import AppContextProvider from './useAppContext';
import { BData, BetType, Matched } from '../../types';
import Bets from '../components/bets/bets';
import TableSearch from '../components/search/tableSearch';
import isEqual from 'lodash.isequal';

import Graph from '../components/graph/graph';
import { createTheme, ThemeProvider } from '@mui/material';
import { blue, red } from '@mui/material/colors';
import { theme } from './theme';

type Balance = {
  smarkets: number;
  betfair: number;
};
const PENDING_BETS_PAGE_SIZE = 20;

const updateProfit = (matchData: Matched[], key: string) => {
  const backLay: any = { back: {}, lay: {} };
  for (const doc of matchData) {
    doc.odds.forEach((odd, i) => {
      backLay[key][odd] = (backLay[key][odd] || 0) + doc.matched[i];
    });
  }
  if (!Object.keys(backLay[key]).length) {
    backLay[key] = { 0: 0 };
  }
  return backLay;
};

const fixProfits = (newData: BData[]) => {
  for (const bet of newData) {
    let backWins = 0;
    let layLiability = 0;
    let backLiability = 0;
    let layWins = 0;
    if (bet.bet_profit.back_matched) {
      try {
        const backObj = updateProfit(bet.bet_profit.back_matched, 'back');
        const layObj = updateProfit(bet.bet_profit.exchange_matched, 'lay');
        const backLay: {
          [key: string]: { [key: number]: number };
        } = { lay: layObj.lay, back: backObj.back };
        Object.entries(backLay.back).map((x) => {
          backWins += (+x[0] - 1) * x[1];
          backLiability += x[1];
        });
        Object.entries(backLay.lay).map((x) => {
          layWins += +x[1] * (1 - bet.bet_odds.commission);
          layLiability += (+x[0] - 1) * x[1];
        });
        bet.bet_profit.back_win_profit = backWins - layLiability;
        bet.bet_profit.lay_win_profit = layWins - backLiability;
      } catch (err) {
        //   console.log('err', bet.bet_profit, err);
      }
    }
  }
  return newData;
};

const sortBetsDesc = (bets: BData[]) =>
  [...bets].sort((a, b) => b.bet_info.bet_unix_time - a.bet_info.bet_unix_time);

const fetchAllPendingBets = async () => {
  const allBets: BData[] = [];
  let skip = 0;

  while (true) {
    const batch = (await window.electron.ipcRenderer.fetchItems(
      'pending_bets',
      undefined,
      PENDING_BETS_PAGE_SIZE,
      skip,
    )) as BData[];
    if (!batch || batch.length === 0) break;
    allBets.push(...batch);
    if (batch.length < PENDING_BETS_PAGE_SIZE) break;
    skip += PENDING_BETS_PAGE_SIZE;
  }

  return sortBetsDesc(fixProfits(allBets));
};

// TODO
// add calendar component to filter down through dates: med-hard
// fix sleep arrow adjustment: easy
// combine recurring errors and new errors into one in logs: easy
// add indicator for bets that have attempted tradeout: easy
// look into logs performance improvements: med
// add a check for expected profit vs actual profit the day before to the toolitip of the graph: easy-mid

export default function App() {
  const [allBets, setAllBets] = useState<BData[]>();
  const [k, setK] = useState<keyof BData>('bet_info');
  const [orderBy, setOrderBy] = useState<keyof BetType>('bet_unix_time');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [balance, setBalance] = useState({ smarkets: 0, betfair: 0 });
  const [flags, setFlags] = useState<{ [key: string]: string }>({});
  const [devMachine, setDevMachine] = useState(false);
  const [themeName, setThemeName] = useState<'default' | 'darkgreen'>(
    'default',
  );
  const muiTheme = themeName === 'default' ? theme : theme;
  useEffect(() => {
    fetchAllPendingBets().then(setAllBets);

    const interval = setInterval(() => {
      fetchAllPendingBets().then(setAllBets);
    }, 10000);
    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    const handleDataFetched = (fetchedData: BData[]) => {
      setAllBets(sortBetsDesc(fixProfits(fetchedData)));
    };

    window.electron.ipcRenderer.onDataFetched(handleDataFetched);
    // const data = window.electron.ipcRenderer.readLog();
    // console.log(data);
    const handleBalance = (d: Balance[]) => {
      setBalance({ smarkets: d[0].smarkets, betfair: d[0].betfair });
    };
    window.electron.ipcRenderer.onBalanceFetched(handleBalance);

    return () => {
      window.electron.ipcRenderer.onDataFetched(() => {});
    };
  }, []);
  useEffect(() => {
    setInterval(() => {
      window.electron.ipcRenderer.fetchItems('flags').then((flags) => {
        for (const key in flags[0]) {
          if (flags[0][key] === '_id') {
            delete flags[0][key];
          }
        }
        if (!isEqual(flags[0], flags)) {
          setFlags(flags[0]);
        }
      });
      //   window.electron.ipcRenderer.tailLog()
    }, 10000);
  }, []);
  useEffect(() => {
    const getFileNames = async () => {
      const images = await window.electron.ipcRenderer.getAllImages(
        'D:\\projects\\python\\odds_monkey_bot\\dist\\logs\\screenshots',
      );
      setDevMachine(!!images);
    };
    getFileNames();
  }, []);
  const value = useMemo(
    () => ({
      devMachine,
      allBets,
      k,
      orderBy,
      setK,
      setOrderBy,
      balance,
      sortDirection,
      setSortDirection,
      setAllBets,
      theme,
    }),
    [allBets, k, orderBy, balance, sortDirection, devMachine],
  );
  document.body.style.backgroundColor = muiTheme.palette.background.default;

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <AppContextProvider value={value}>
              {allBets && (
                <>
                  {/* <Config /> */}
                  {/* <CustomZoom /> */}
                  <ThemeProvider theme={muiTheme}>
                    <Bets flags={flags} setFlags={setFlags}></Bets>
                  </ThemeProvider>
                  {/* <Logs></Logs> */}
                </>
              )}
            </AppContextProvider>
          }
        />
      </Routes>
    </Router>
  );
}
