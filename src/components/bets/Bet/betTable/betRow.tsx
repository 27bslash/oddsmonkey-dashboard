import { TableRow, Tooltip, Typography, TableCell } from '@mui/material';
import TimeAgo from 'javascript-time-ago';
import { Link } from 'react-router-dom';
import { BData } from '../../../../../types';
import smarkets from '../../../../icons/smarkets.png';
import betfair from '../../../../icons/betfair.png';
import BetTableCell from '../BetCell/betCell';
import MatchedCell from '../BetCell/matched/matchedCell';
import { green, blue, grey } from '@mui/material/colors';
import React, { SetStateAction } from 'react';
import { theme } from '../../../../renderer/App';

function formatDateFromTimestamp(time: number) {
  return new Date(time * 1000).toLocaleString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
}

type BetTableBodyProps = {
  data: BData;
  lay: boolean;
  index: number;
  show: boolean;
  setBet: React.Dispatch<SetStateAction<BData>>;
};

function BetTableRow({ data, lay, index, show, setBet }: BetTableBodyProps) {
  const stake_img =
    data.bet_info['exchange'] !== 'betfair' ? betfair : smarkets;
  const lay_img = stake_img !== smarkets ? smarkets : betfair;
  const calcStakes = (liability: boolean) => {
    if (show) return data.bet_profit[!lay ? 'back_stake' : 'lay_stake'];
    let matchArr = data.bet_profit.back_matched;
    if (lay) matchArr = data.bet_profit.exchange_matched;
    try {
      return matchArr.reduce((acc, curr, i) => {
        return (acc += curr.staked.reduce((a, c, j) => {
          if (liability) {
            return a + c * (matchArr[i].odds[j] - 1);
          }
          return a + c;
        }, 0));
      }, 0);
    } catch (error) {
      return data.bet_profit[!lay ? 'back_stake' : 'lay_stake'];
    }
  };
  const stake = calcStakes(false);
  const timeAgo = new TimeAgo('en-GB');
  const currentTime = Date.now();
  const eventTimeDelta = currentTime - data.bet_info.unix_time * 1000;
  let matchTime = data.bet_info.bet_unix_time;

  if (data.bet_profit.back_matched[index].bet_matched_time) {
    if (!show) {
      const bet_matched_times = data.bet_profit.back_matched.map(
        (m) => m.bet_matched_time!,
      );
      matchTime = Math.max(...bet_matched_times);
    } else {
      matchTime = data.bet_profit.back_matched[index].bet_matched_time;
    }
  }
  const betTimeDelta = currentTime - matchTime * 1000;
  const betTimeTooltipText = formatDateFromTimestamp(
    data.bet_profit.back_matched[index].bet_matched_time ||
      data.bet_info.bet_unix_time,
  );
  const borderBottom =
    index === data.bet_profit.back_matched.length - 1 && lay
      ? 'none'
      : '1px solid black';
  return (
    <TableRow
      sx={{
        borderBottom: borderBottom,
      }}
    >
      <BetTableCell>
        <Tooltip title={formatDateFromTimestamp(data.bet_info.unix_time)}>
          <Typography
            className="help-hover"
            onClick={() => {
              const devMachine = process.env.NODE_ENV === 'development';
              if (devMachine) {
                navigator.clipboard.writeText(JSON.stringify(data, null, 2));
                console.log(data);
              }
            }}
          >
            {timeAgo.format(Date.now() - eventTimeDelta)}
          </Typography>
        </Tooltip>
      </BetTableCell>
      <BetTableCell>
        <Tooltip title={formatDateFromTimestamp(matchTime)}>
          <Typography className="help-hover">
            {timeAgo.format(Date.now() - betTimeDelta)}
          </Typography>
        </Tooltip>
      </BetTableCell>

      <TableCell sx={{ borderBottom: 'none !important' }} className="bet-link">
        <Link
          to={data.bet_info[!lay ? 'bookie_link' : 'exchange_link']}
          target="_blank"
        >
          <img src={!lay ? stake_img : lay_img} height={30}></img>
        </Link>
      </TableCell>

      {lay ? (
        <BetTableCell color={blue['400']}>SELL</BetTableCell>
      ) : (
        <BetTableCell color={green['400']}>BUY</BetTableCell>
      )}
      <BetTableCell>
        <Typography>£{stake ? stake.toFixed(2) : '0'}</Typography>
        {lay && (
          <Typography fontSize={13} color={grey['500']}>
            £{calcStakes(true)?.toFixed(2)}
          </Typography>
        )}
      </BetTableCell>
      {data.bet_profit['back_matched'][0] &&
      data.bet_profit['exchange_matched'][0] &&
      data.bet_profit['exchange_matched'][0]['odds'] &&
      data.bet_profit['back_matched'][0]['odds'] ? (
        <MatchedCell
          lay={lay}
          index={index}
          stake={stake}
          show={show}
          bet={data}
          setBet={setBet}
        />
      ) : (
        <>
          <BetTableCell>{data.bet_odds.back_odds}</BetTableCell>
          <BetTableCell>{stake}</BetTableCell>
          <BetTableCell color={green['400']}>
            {!lay
              ? data.bet_profit['back_win_profit']
              : data.bet_profit['lay_win_profit']}
          </BetTableCell>
        </>
      )}
    </TableRow>
  );
}
export default BetTableRow;
