/* eslint-disable no-underscore-dangle */
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react';
import { BData, Matched } from '../../../../../../types';
import updateMatched from '../../../../../utils/updateMatched';
import { useAppContext } from '../../../../../renderer/useAppContext';

type AddMatchedBetDialogProps = {
  open: boolean;
  onClose: () => void;
  bet: BData;
  setBet: Dispatch<SetStateAction<BData>>;
};

type MatchedSide = 'back' | 'lay';

const createDefaultEntry = (bet: BData, side: MatchedSide) => {
  const isBack = side === 'back';

  return {
    odds: String(
      isBack
        ? (bet.bet_odds.back_odds[0] ?? 1)
        : (bet.bet_odds.lay_odds[0] ?? 1),
    ),
    stake: String(
      isBack
        ? (bet.bet_profit.back_stake ?? 0)
        : (bet.bet_profit.lay_stake ?? 0),
    ),
    commission: String(
      isBack
        ? (bet.bet_odds.back_commission ?? 0.02)
        : (bet.bet_odds.commission ?? 0),
    ),
  };
};

function AddMatchedBetDialog({
  open,
  onClose,
  bet,
  setBet,
}: AddMatchedBetDialogProps) {
  const { allBets, setAllBets } = useAppContext();
  const [side, setSide] = useState<MatchedSide>('back');
  const [odds, setOdds] = useState('');
  const [stake, setStake] = useState('');
  const [commission, setCommission] = useState('');
  const [error, setError] = useState('');
  const wasOpen = useRef(false);

  useEffect(() => {
    if (!open || wasOpen.current) {
      wasOpen.current = open;
      return;
    }

    const initialSide: MatchedSide =
      bet.bet_profit.back_matched.length <=
      bet.bet_profit.exchange_matched.length
        ? 'back'
        : 'lay';
    const nextDefaults = createDefaultEntry(bet, initialSide);

    setSide(initialSide);
    setOdds(nextDefaults.odds);
    setStake(nextDefaults.stake);
    setCommission(nextDefaults.commission);
    setError('');
    wasOpen.current = true;
  }, [open, bet]);

  const handleSideChange = (value: MatchedSide) => {
    setSide(value);
    const nextDefaults = createDefaultEntry(bet, value);

    setOdds(nextDefaults.odds);
    setStake(nextDefaults.stake);
    setCommission(nextDefaults.commission);
    setError('');
  };

  const handleSubmit = async () => {
    const parsedOdds = Number(odds);
    const parsedStake = Number(stake);
    const parsedCommission = Number(commission);

    if (parsedOdds <= 1) {
      setError('Odds must be greater than 1');
      return;
    }

    if (parsedStake <= 0) {
      setError('Stake must be greater than 0');
      return;
    }

    if (parsedCommission < 0 || parsedCommission > 1) {
      setError('Commission must be between 0 and 1');
      return;
    }

    const entry: Matched = {
      odds: [parsedOdds],
      staked: [parsedStake],
      matched: [parsedStake],
      bet_commission: parsedCommission,
      bet_matched_time: Math.floor(Date.now() / 1000),
      type: 'standard',
    };

    const nextBackMatched = [...bet.bet_profit.back_matched];
    const nextExchangeMatched = [...bet.bet_profit.exchange_matched];

    if (side === 'back') {
      nextBackMatched.push(entry);
    } else {
      nextExchangeMatched.push(entry);
    }

    updateMatched(nextBackMatched, nextExchangeMatched);

    const updatedBet: BData = {
      ...bet,
      bet_profit: {
        ...bet.bet_profit,
        back_matched: nextBackMatched,
        exchange_matched: nextExchangeMatched,
      },
    };

    setBet(updatedBet);
    if (allBets) {
      setAllBets((prev: BData[]) =>
        prev.map((item: BData) => (item._id === bet._id ? updatedBet : item)),
      );
    }

    await window.electron.ipcRenderer.updateItem({
      collectionName: 'pending_bets',
      query: { 'bet_info.bet_unix_time': bet.bet_info.bet_unix_time },
      update: {
        $push: {
          [`bet_profit.${side === 'back' ? 'back_matched' : 'exchange_matched'}`]:
            entry,
        },
      },
    });

    await window.electron.ipcRenderer.fetchItems(
      'pending_bets',
      'add matched bet',
    );
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add matched bet</DialogTitle>
      <DialogContent>
        <Box display="flex" flexDirection="column" gap={2} pt={1}>
          <Typography variant="body2" color="text.secondary">
            Add a single matched entry to the selected side of this bet.
          </Typography>
          <TextField
            select
            label="Side"
            value={side}
            onChange={(e) => handleSideChange(e.target.value as MatchedSide)}
            fullWidth
          >
            <MenuItem value="back">Back</MenuItem>
            <MenuItem value="lay">Lay</MenuItem>
          </TextField>
          <TextField
            label="Odds"
            type="number"
            value={odds}
            onChange={(e) => setOdds(e.target.value)}
            inputProps={{ min: 1, step: 0.001 }}
            fullWidth
          />
          <TextField
            label="Stake"
            type="number"
            value={stake}
            onChange={(e) => setStake(e.target.value)}
            inputProps={{ min: 0.01, step: 0.01 }}
            fullWidth
          />
          <TextField
            label="Commission"
            type="number"
            value={commission}
            onChange={(e) => setCommission(e.target.value)}
            inputProps={{ min: 0, max: 1, step: 0.01 }}
            fullWidth
          />
          {error && <Typography color="error">{error}</Typography>}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained">
          Add bet
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default AddMatchedBetDialog;
