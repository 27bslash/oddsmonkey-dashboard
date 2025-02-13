import './App.css';
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import AppContextProvider from './useAppContext';
import { BData, BetType } from '../../types';
import Bets from '../components/bets/bets';
import TableSearch from '../components/search/tableSearch';

type Balance = {
  smarkets: number;
  betfair: number;
};

export default function App() {
  const [allBets, setAllBets] = useState<BData[]>();
  const [k, setK] = useState<keyof BData>('bet_info');
  const [orderBy, setOrderBy] = useState<keyof BetType>('bet_unix_time');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [balance, setBalance] = useState({ smarkets: 0, betfair: 0 });
  const [flags, setFlags] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const handleDataFetched = (fetchedData: BData[]) => {
      if (allBets) {
        // console.log(fetchedData, allBets);
        const fetchSrt = fetchedData.sort(
          (a, b) =>
            b['bet_info']['bet_unix_time'] - a['bet_info']['bet_unix_time'],
        );
        const allbetsSrt = allBets.sort(
          (a, b) =>
            b['bet_info']['bet_unix_time'] - a['bet_info']['bet_unix_time'],
        );
        if (
          allbetsSrt[0]['bet_info']['bet_unix_time'] ===
          fetchSrt[0]['bet_info']['bet_unix_time']
        ) {
          console.log('same data');
          return;
        }
      }

      setAllBets(fetchedData);

      //   const filteredData = fetchedData.filter((x) => {
      //     return x.bet_info.unix_time > new Date().getTime() / 1000;
      //   });
      //   setFilteredBets(filteredData);
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
          setFlags(flags[0]);
        }
      });
    }, 10000);
  }, []);
  const value = {
    allBets,
    k,
    orderBy,
    setK,
    setOrderBy,
    balance,
    sortDirection,
    setSortDirection,
    setAllBets,
  };
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
                  <Bets flags={flags} setFlags={setFlags}></Bets>
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
