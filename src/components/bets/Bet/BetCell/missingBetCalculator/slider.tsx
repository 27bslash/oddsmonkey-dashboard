import { Box, Slider, Typography } from '@mui/material';
import { MatchObj } from './betCalculator';
import { useEffect, useState } from 'react';
import { blue } from '@mui/material/colors';
type MissingBetSliderProps = {
  obj: MatchObj['back'];
  updateValues: (stake: number, odds: number, type: 'back' | 'lay') => void;
  initialiseValues: (type: 'lay' | 'back') => {
    stake: number;
    odds: number;
  };
};
const MissingBetSlider = ({
  obj,
  updateValues,
  initialiseValues,
}: MissingBetSliderProps) => {
//   console.log(obj);
  const initialValues = initialiseValues('back');
  const initialStake = initialValues.stake;
  const initialOdds = initialValues.odds;
  const modifier = 1.01;
  const [val, setVal] = useState(initialStake);
  const handleChange = (event: Event, newValue: number | number[]) => {
    if (typeof newValue === 'number') {
      const updatedStake = newValue + obj.stake;
      setVal(newValue);
      //   updateValues(newValue, obj.odds, 'back');
    }
  };
  useEffect(() => {
    updateValues(val, initialOdds, 'back');
  }, [val]);
  const marks = [
    {
      value: initialStake /modifier,
      label: '',
    }, 
    {
      value: initialStake * modifier,
      label: '',
    },
  ];
  return (
    <Box
      display={'flex'}
      flexDirection={'column'}
      justifyContent={'center'}
      alignItems={'center'}
      //   sx={{ width: '80%' }}
    >
      <Slider
        sx={{ width: '60%' }}
        marks={marks}
        size="small"
        defaultValue={obj.stake}
        value={val}
        aria-label="Small"
        step={0.01}
        max={initialStake * modifier}
        min={initialStake / modifier}
        valueLabelDisplay="auto"
        onChange={handleChange}
      />
      <Box
        sx={{ display: 'flex', justifyContent: 'space-between', width: '60%' }}
      >
        <Typography
          variant="body2"
          onClick={() => setVal(initialStake / modifier)}
          padding={0.5}
          sx={{ cursor: 'pointer', background: blue['900'] }}
        >
          £{(initialStake / modifier).toFixed(2)}
        </Typography>
        <Typography
          variant="body2"
          padding={0.5}
          onClick={() => setVal(initialStake * modifier)}
          sx={{ cursor: 'pointer', background: blue['900'] }}
        >
          £{(initialStake * modifier).toFixed(2)}
        </Typography>
      </Box>
      {/* <Slider defaultValue={50} aria-label="Default" valueLabelDisplay="auto" /> */}
    </Box>
  );
};
export default MissingBetSlider;
