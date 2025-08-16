import {
  Box,
  TableFooter,
  TablePagination,
  TableRow,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { BData, BetInfo, BetOdds, BetProfit, Matched } from '../../../types';
import { useAppContext } from '../../renderer/useAppContext';
import TablePaginationActions from '@mui/material/TablePagination/TablePaginationActions';
import StatTable from '../StatTable/statTable';
import Bet from './Bet/betTable/Bet';
import { ObjectId } from 'mongodb';
import TableSearch from '../search/tableSearch';
import fuzzysort from 'fuzzysort';
import FilterButtons from '../StatTable/FilterButtons';

export type SortKeys = keyof BetInfo | keyof BetOdds | keyof BetProfit;

export function filterTimestampsByWeek() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayOfWeek = today.getDay();
  const diffToMonday = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
  const startOfWeek = new Date(today);

  startOfWeek.setDate(today.getDate() + diffToMonday);
  const startOfWeekUnix = startOfWeek.getTime() / 1000;
  return startOfWeekUnix;
}
export function filterTimestampsByDay() {
  const now = new Date();

  const startHour =
    new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getHours() > 3 ? now.getDate() : now.getDate() - 1,
      9,
    ).getTime() / 1000;
  const endHour =
    new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getHours() > 3 ? now.getDate() + 1 : now.getDate(),
      3,
    ).getTime() / 1000;
  return { startHour, endHour };
}
export function filterTimestampsByMonth() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  return startOfMonth.getTime() / 1000;
}
export function filterTimestampsByYear() {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  return startOfYear.getTime() / 1000;
}
type BetProps = {
  flags: { [key: string]: string };
  setFlags: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
};
function Bets({ flags, setFlags }: BetProps) {
  const [filteredBets, setFilteredBets] = useState<BData[]>();
  const [sortedData, setSortedData] = useState<BData[]>();
  const [timeFilter, setTimeFilter] = useState<
    'active' | 'day' | 'week' | 'month' | 'year' | 'all time'
  >('active');
  const [searchFilter, setSearchFilter] = useState<string>();
  const [page, setPage] = useState(0);
  const [count, setCount] = useState(0);
  useEffect(() => {
    setCount(count);
    if (page * 10 > count) {
      // console.log(page)
      setPage(0);
    }
  }, [count]);
  const handleChangePage = (
    event: React.MouseEvent<HTMLButtonElement> | null,
    newPage: number,
  ) => {
    setPage(newPage);
  };
  const [loading, setLoading] = useState(true); // Track loading state
  const {
    allBets,
    setAllBets,
    orderBy,
    setOrderBy,
    sortDirection,
    setSortDirection,
    k,
    setK,
    theme,
  } = useAppContext();
  useEffect(() => {
    setLoading(true); // Trigger loading state immediately

    if (!allBets) {
      setLoading(false); // Stop loading if no bets are available
      return;
    }

    // const sorted = sortBets(allBets, k);
    // if (!sorted) {
    //   setLoading(false); // Stop loading if sorting failed
    //   return;
    // }

    // if (allBets[0].bet_info.event_name !== sorted[0].bet_info.event_name) {
    // setSortedData([...sorted]);

    setLoading(false); // Stop loading after sorting and any updates
  }, [orderBy, sortDirection, allBets, page]);

  const sortBets = (
    arr: BData[],
    keyOverride?: Exclude<keyof BData, 'anomaly'>,
  ) => {
    const key = keyOverride || k;
    if (!key) return;
    const sorted = [...arr].sort((a, b) => {
      let aVal: number;
      let bVal: number;
      if (orderBy === 'lay_liability') {
        try {
          const aSum = reducer(a);
          const bSum = reducer(b);
          aVal = aSum.BookieSum + aSum.ExchangeSum;
          bVal = bSum.BookieSum + bSum.ExchangeSum;
        } catch (error) {
          console.error(error);
          aVal = +a[key][orderBy as keyof (typeof a)[typeof key]];
          bVal = +b[key][orderBy as keyof (typeof b)[typeof key]];
        }
      }
      if (orderBy === 'back_win_profit') {
        aVal = a.bet_profit.back_win_profit + a.bet_profit.lay_win_profit;
        bVal = b.bet_profit.back_win_profit + b.bet_profit.lay_win_profit;
      } else {
        aVal = +a[key][orderBy as keyof (typeof a)[typeof key]];
        bVal = +b[key][orderBy as keyof (typeof b)[typeof key]];
      }

      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;

      function reducer(bet: BData) {
        const ExchangeSum = bet.bet_profit.exchange_matched.reduce(
          (acc, curr) => {
            return (acc += curr.matched[0] * (curr.odds[0] - 1));
          },
          0,
        );
        const BookieSum = bet.bet_profit.back_matched.reduce((acc, curr) => {
          return (acc += curr.matched[0]);
        }, 0);
        return { ExchangeSum, BookieSum };
      }
    });

    console.log(sorted);
    return anomalyCheck(sorted);
  };
  const anomalyCheck = (bets: BData[]) => {
    const indexs: number[] = [];
    const lowProfit = [];
    const Profitable = [...bets].filter((bet, idx) => {
      const profitZero =
        (bet.bet_profit.back_win_profit < 0 ||
          bet.bet_profit.lay_win_profit < 0) &&
        !(
          bet.bet_profit.back_win_profit <= 0 &&
          bet.bet_profit.lay_win_profit <= 0
        );
      if (
        profitZero &&
        bet.bet_info.unix_time > new Date().getTime() / 1000 - 60 * 90
      ) {
        indexs.push(idx);
        return false;
      }
      return true;
    });
    for (const idx of indexs) {
      const bet = bets[idx];
      bet.anomaly = true;
      lowProfit.unshift(bet);
    }
    console.log('new bets', Profitable);
    return lowProfit
      .sort((a, b) => b.bet_info.unix_time - a.bet_info.unix_time)
      .concat(Profitable);
  };

  const handleRequestSort = (
    property: SortKeys,
    sortDirection: string,
    betKey: Exclude<keyof BData, 'anomaly'>,
  ) => {
    const isAsc = sortDirection === 'asc';
    const ern = isAsc ? 'desc' : 'asc';
    console.log('hadnle sort', ern, property, betKey);
    setSortDirection(ern);
    setOrderBy(property);
    setK(betKey);
  };

  useEffect(() => {
    if (!allBets) return;
    const timeFiltered = filterBetsByTime();
    // fixProfits()
    if (searchFilter) {
      setTimeFilter('all time');
      const sorted = fuzzysort
        .go(searchFilter, allBets, {
          key: 'bet_info.event_name',
        })
        .filter((result) => result.score >= 0.6);
      const newBets = sorted.map((result) => result.obj);
      const sortedBets = sortBets(newBets, 'bet_info');
      setSortedData(sortedBets);
      setCount(sorted.length);
    } else {
      setSortedData(sortBets(timeFiltered, k));
    }
  }, [timeFilter, searchFilter, allBets, sortDirection, orderBy]);

  const filterBetsByTime = () => {
    // console.log('filter bets', showAll, allBets);

    const { startHour, endHour } = filterTimestampsByDay();
    // console.log('day', currentTime, targetDay);
    const startOfWeekUnix = filterTimestampsByWeek();
    const f = allBets!.filter((x) => {
      if (!x.bet_info) {
        console.log(x);
      }
      const betDate = new Date(x.bet_info.bet_unix_time);
      if (timeFilter === 'active') {
        let threshold = 6700;
        if (x.bet_info.market_type === 'Half Time') {
          threshold = 3000;
        }
        return x.bet_info.unix_time > new Date().getTime() / 1000 - threshold;
      } else if (timeFilter === 'day') {
        return (
          x.bet_info.bet_unix_time >= startHour &&
          x.bet_info.bet_unix_time <= endHour
        );
        // return x.bet_info.bet_unix_time > new Date().getTime() / 1000 - 86400;
      } else if (timeFilter === 'week') {
        return x.bet_info.bet_unix_time >= startOfWeekUnix;
      } else if (timeFilter === 'month') {
        return x.bet_info.bet_unix_time >= filterTimestampsByMonth();
      } else if (timeFilter === 'year') {
        return x.bet_info.bet_unix_time >= filterTimestampsByYear();
      }
      return x;
    });
    setCount(f.length);
    return f;
  };

  const deleteBet = (_id: ObjectId) => {
    setAllBets(allBets!.filter((x) => x._id !== _id));
  };
  const setFlag = async (flag: string) => {
    const newStr = flags[flag] === 'updating' ? 'updated' : 'updating';
    console.log(newStr);
    const updateObj = {
      collectionName: 'flags',
      query: {},
      update: { $set: { [flag]: newStr } },
    };
    setFlags({ ...flags, [flag]: 'updating' });
    const modifiedCount =
      await window.electron.ipcRenderer.updateItem(updateObj);
  };
  //   console.log(sortedData);

  return (
    <Box
      // padding={5}
      sx={{
        // backgroundColor: theme.palette.background.default,
        height: 'fit-content',
        width: '93vw',
      }}
    >
      {sortedData && (
        <>
          <Box
            sx={{
              position: 'sticky',
              display: 'flex',
              top: '0px',
              zIndex: 1,
              background: theme.palette.background.default,
            }}
          >
            <StatTable
              flags={flags}
              setFlag={setFlag}
              filter={timeFilter}
              setFilter={setTimeFilter}
              filteredBets={sortedData}
              totalBets={allBets!}
            />
          </Box>
          <div
            style={{
              display: 'flex',
              position: 'sticky',
              background: theme.palette.background.default,
              top: '250px',
              zIndex: 9,
            }}
          >
            <Box
              display={'flex'}
              width={'100%'}
              justifyContent={'space-between'}
            >
              <FilterButtons
                filter={timeFilter}
                setFilter={setTimeFilter}
              ></FilterButtons>
              <TableSearch setSearchFilter={setSearchFilter}></TableSearch>
            </Box>
          </div>
          {sortedData.slice(page * 10, page * 10 + 10).map((bet, i) => {
            return (
              <Bet
                key={i}
                updateSort={handleRequestSort}
                bet={bet}
                deleteBet={deleteBet}
              ></Bet>
            );
          })}
          <TableFooter>
            <TableRow>
              <TablePagination
                sx={{ color: 'white' }}
                rowsPerPageOptions={[10]}
                colSpan={3}
                count={count}
                rowsPerPage={10}
                page={page}
                onPageChange={handleChangePage}
                ActionsComponent={TablePaginationActions}
                showFirstButton
                showLastButton
              />
            </TableRow>
          </TableFooter>
        </>
      )}
    </Box>
  );
}

export default Bets;
