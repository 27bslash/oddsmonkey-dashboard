import {
  Box,
  TableFooter,
  TablePagination,
  TableRow,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { BData, BetInfo, BetOdds, BetProfit } from '../../../types';
import { useAppContext } from '../../renderer/useAppContext';
import TablePaginationActions from '@mui/material/TablePagination/TablePaginationActions';
import StatTable from '../StatTable/statTable';
import Bet from './Bet/betTable/Bet';
import { ObjectId } from 'mongodb';
import TableSearch from '../search/tableSearch';
import fuzzysort from 'fuzzysort';
import FilterButtons, { FilterButton } from '../StatTable/FilterButtons';

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
type BetProps = {
  flags: { [key: string]: string };
  setFlags: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
};
function Bets({ flags, setFlags }: BetProps) {
  const [filteredBets, setFilteredBets] = useState<BData[]>();
  const [sortedData, setSortedData] = useState<BData[]>();
  const [timeFilter, setTimeFilter] = useState<
    'active' | 'day' | 'week' | 'all time'
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
  } = useAppContext();
  useEffect(() => {
    setLoading(true); // Trigger loading state immediately

    if (!allBets) {
      setLoading(false); // Stop loading if no bets are available
      return;
    }

    const sorted = sortBets(allBets, k);
    if (!sorted) {
      setLoading(false); // Stop loading if sorting failed
      return;
    }

    // if (allBets[0].bet_info.event_name !== sorted[0].bet_info.event_name) {
    setSortedData([...sorted]);

    setLoading(false); // Stop loading after sorting and any updates
  }, [orderBy, sortDirection, allBets, page]);

  const sortBets = (arr: BData[], key?: keyof BData) => {
    if (!key) key = k;

    const sorted = [...arr]!.sort((a: any, b: any) => {
      return sortDirection === 'asc'
        ? +a[key][orderBy] - +b[key][orderBy]
        : +b[key][orderBy] - +a[key][orderBy];
    });
    return sorted;
  };
  const handleRequestSort = (
    property: SortKeys,
    sortDirection: string,
    betKey: keyof BData,
  ) => {
    const isAsc = sortDirection === 'asc';
    const ern = isAsc ? 'desc' : 'asc';
    console.log('hadnle sort', ern, property);
    setSortDirection(ern);
    setOrderBy(property);
    setK(betKey);
  };

  useEffect(() => {
    if (!sortedData) return;
    filterBetsByTime();
    if (searchFilter) {
      setTimeFilter('all time');
      const sorted = fuzzysort
        .go(searchFilter, sortedData, {
          key: 'bet_info.event_name',
        })
        .filter((result) => result.score >= 0.6);
      const newBets = sorted.map((result) => result.obj);
      const sortedBets = sortBets(newBets, 'bet_info');
      setFilteredBets(sortedBets);
      setCount(sorted.length);
    }
  }, [timeFilter, sortedData, searchFilter]);

  const filterBetsByTime = () => {
    // console.log('filter bets', showAll, allBets);
    const now = new Date();

    const { startHour, endHour } = filterTimestampsByDay();
    console.log(startHour, endHour);
    // console.log('day', currentTime, targetDay);
    const startOfWeekUnix = filterTimestampsByWeek();
    const f = sortedData!.filter((x) => {
      const betDate = new Date(x.bet_info.bet_unix_time);
      if (timeFilter === 'active') {
        return x.bet_info.unix_time > new Date().getTime() / 1000 - 5400;
      } else if (timeFilter === 'day') {
        return (
          x.bet_info.bet_unix_time >= startHour &&
          x.bet_info.bet_unix_time <= endHour
        );
        // return x.bet_info.bet_unix_time > new Date().getTime() / 1000 - 86400;
      } else if (timeFilter === 'week') {
        return x.bet_info.bet_unix_time >= startOfWeekUnix;
      }
      return x;
    });
    setFilteredBets(f);
    setCount(f.length);
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

  return (
    <Box
      // padding={5}
      sx={{ backgroundColor: '#212121', height: 'fit-content', width: '93vw' }}
    >
      {filteredBets && (
        <>
          <Box
            sx={{
              position: 'sticky',
              display: 'flex',
              top: '0px',
              zIndex: 99,
              background: '#212121',
            }}
          >
            <StatTable
              flags={flags}
              setFlag={setFlag}
              filter={timeFilter}
              setFilter={setTimeFilter}
              filteredBets={filteredBets}
              totalBets={allBets!}
            />
          </Box>
          <div
            style={{
              display: 'flex',
              position: 'sticky',
              background: 'inherit',
              top: '200px',
              zIndex: '99',
            }}
          >
            <FilterButtons
              filter={timeFilter}
              setFilter={setTimeFilter}
            ></FilterButtons>
            <TableSearch setSearchFilter={setSearchFilter}></TableSearch>
          </div>
          {filteredBets.slice(page * 10, page * 10 + 10).map((bet, i) => {
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
