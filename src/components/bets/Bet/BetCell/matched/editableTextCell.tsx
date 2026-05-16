import { Box, Typography } from '@mui/material';
import { useState, useEffect, KeyboardEvent, SetStateAction } from 'react';
import { BData, Matched } from '../../../../../../types';
import { useBet } from '../../../betContext';
import { useAppContext } from '../../../../../renderer/useAppContext';

type EditableCellProps = {
  matchVal: { [key: number]: number };
  val: number;
  lay: boolean;
  type: 'matched' | 'odds';
  show: boolean;
  index: number;
  bet: BData;
  setBet: React.Dispatch<SetStateAction<BData>>;
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
  bet,
  setBet,
}: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState('');
  const [color, setColor] = useState('');

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
  }, [isEditing, bet, val]);
  const { allBets, setAllBets } = useAppContext();
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      console.log('enter', value, index);
      let updateQuery = `bet_profit.${lay ? 'exchange_matched' : 'back_matched'}`;
      let updateVal: number[] | Matched[] = [];
      if (!show) {
        const arr = bet!.bet_profit[lay ? 'exchange_matched' : 'back_matched'];

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
        const matchingBet = allBets!.find((match) => match._id === bet._id);
        // Create updated bet object
        const updatedBet = {
          ...bet,
          bet_profit: {
            ...bet.bet_profit,
            [lay ? 'exchange_matched' : 'back_matched']: arr,
          },
        };
        // Update local bet prop
        setBet(updatedBet);
        // Update global allBets
        setAllBets(allBets!.map((b) => (b._id === bet._id ? updatedBet : b)));
        console.log(matchingBet?.bet_info.event_name);
        console.log(bet.bet_info.event_name);
      } else {
        updateQuery = `${updateQuery}[${index}].${type}`;
        console.log(updateQuery);
        updateVal = [+value];
        setBet((prev) => ({
          ...prev,
          bet_profit: {
            ...prev.bet_profit,
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
        query: { 'bet_info.bet_unix_time': bet.bet_info.bet_unix_time },
        update: { $set: { [updateQuery]: updateVal } },
      });
      window.electron.ipcRenderer.fetchItems('pending_bets');
      console.log({
        collectionName: 'pending_bets',
        query: { 'bet_info.bet_unix_time': bet.bet_info.bet_unix_time },
        update: { $set: { [updateQuery]: updateVal } },
      });
      // Reset editing state after update
      setIsEditing(false);
    } else if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  const calcColor = () => {
    const sum = Object.values(matchVal).reduce((prev, curr) => {
      return prev + curr;
    }, 0);
    const stk = !stake
      ? bet.bet_profit[!lay ? 'back_stake' : 'lay_stake']
      : stake;
    // console.log(stk, sum);
    return sum.toFixed(2) === stk.toFixed(2) ? 'white' : 'red';
  };
  useEffect(() => {
    setColor(calcColor());
  }, [bet, value]);
  //   console.log(data.bet_info.event_name, matchVal, color);
  return (
    <Box
      className="editable-text-cell"
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
  );
}
export default EditableCell;
