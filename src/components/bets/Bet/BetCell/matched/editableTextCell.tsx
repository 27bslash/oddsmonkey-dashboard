import { Box, Typography } from '@mui/material';
import { useState, useEffect, KeyboardEvent, SetStateAction } from 'react';
import { Matched } from '../../../../../../types';
import { useBet } from '../../../betContext';

type EditableCellProps = {
  matchVal: { [key: number]: number };
  val: number;
  lay: boolean;
  type: 'matched' | 'odds';
  show: boolean;
  index: number;

  stake?: number;
};
function EditableCell({
  matchVal,
  val,
  lay,
  type,
  show,
  index,
  stake,
}: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState('');
  const [color, setColor] = useState('');

  const { betData, setBetData, updateSort } = useBet();
  val = val || 0;
  const handleClick = () => {
    setIsEditing(!isEditing);
  };
  const handleChange = (e: { target: { value: string } }) => {
    setValue(e.target.value);
  };
  useEffect(() => {
    if (!isEditing) {
      setValue(type === 'odds' ? val.toFixed(3) : val.toFixed(2));
    }
  }, [isEditing, val]);
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      console.log('enter', value, index);
      let updateQuery = `bet_profit.${lay ? 'exchange_matched' : 'back_matched'}`;
      let updateVal: number[] | Matched[] = [];
      if (!show) {
        const arr =
          betData!.bet_profit[lay ? 'exchange_matched' : 'back_matched'];
        console.log(arr, betData);
        const summedMatch = arr.reduce(
          (acc, curr) => (acc += curr[type].reduce((a, c) => (a += c), 0)),
          0,
        );
        console.log(summedMatch, matchVal, value);
        const updateBetValue = +value / arr.length;
        for (let x of arr) {
          if (type !== 'odds') {
            x['matched'] = [updateBetValue];
            x['odds'] = [+Object.keys(matchVal)];
            x['staked'] = [updateBetValue];
          } else if (type === 'odds') {
            x['odds'] = [+value];
          }
        }
        console.log(arr);
        updateQuery = `bet_profit.${lay ? 'exchange_matched' : 'back_matched'}`;
        console.log(updateQuery, arr, updateVal);
        updateVal = arr;
        setBetData((prev) => ({
          ...prev, // Spread the previous state
          bet_profit: {
            ...prev.bet_profit, // Spread the previous bet_profit object to avoid mutation
            [lay ? 'exchange_matched' : 'back_matched']: arr, // Dynamically set the property
          },
        }));
      } else {
        updateQuery = `${updateQuery}[${index}].${type}`;
        console.log(updateQuery);
        updateVal = [+value];
        setBetData((prev) => ({
          ...prev, // Spread the previous state
          bet_profit: {
            ...prev.bet_profit, // Spread the previous bet_profit object
            [lay ? 'exchange_matched' : 'back_matched']: prev.bet_profit[
              lay ? 'exchange_matched' : 'back_matched'
            ].map((item, idx) =>
              idx === index ? { ...item, [type]: updateVal } : item,
            ),
          },
        }));
      }
      window.electron.ipcRenderer.updateItem({
        collectionName: 'pending_bets',
        query: { 'bet_info.bet_unix_time': betData.bet_info.bet_unix_time },
        update: { $set: { [updateQuery]: updateVal } },
      });
      console.log({
        collectionName: 'pending_bets',
        query: { 'bet_info.bet_unix_time': betData.bet_info.bet_unix_time },
        update: { $set: { [updateQuery]: updateVal } },
      });
    } else if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };
  const calcColor = () => {
    const sum = Object.values(matchVal).reduce((prev, curr) => {
      return prev + curr;
    }, 0);
    const stk = !stake
      ? betData.bet_profit[!lay ? 'back_stake' : 'lay_stake']
      : stake;
    // console.log(stk, sum);
    return sum.toFixed(2) === stk.toFixed(2) ? 'white' : 'red';
  };
  useEffect(() => {
    setColor(calcColor());
  }, [betData, value]);
  //   console.log(data.bet_info.event_name, matchVal, color);
  return (
    <>
      <Box
        sx={
          {
            //   color: profit >= 0 ? green['400'] : red['400'],
          }
        }
      >
        {!isEditing ? (
          <Typography
            color={type === 'matched' ? color : 'white'}
            onClick={handleClick}
          >
            {type === 'matched' && <span>£</span>}
            {value}
          </Typography>
        ) : (
          <>
            {type === 'matched' && <span>£</span>}
            <input
              className="editable-text-input"
              type="number"
              onKeyDown={(e) => handleKeyDown(e)}
              value={value}
              onChange={handleChange}
              autoFocus
            />
          </>
        )}
      </Box>
    </>
  );
}
export default EditableCell;
