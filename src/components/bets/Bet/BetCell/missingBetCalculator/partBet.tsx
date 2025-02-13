import { Box } from '@mui/material';
import { useState, useEffect } from 'react';
import CalculatorTextField from './calculatorTextField';
import { capitalize } from './calculatorSection';

const CalculatorGroup = ({
  type,
  valueObj,
  bg,
  setValue,
}: {
  type: string;
  bg: { [key: string | number]: string };
  valueObj: {
    avgBackOdds: number;
    avgLayOdds: number;
    currentBackOdds: number;
    currentLayOdds: number;
    backStake: number;
    layStake: number;
    commission: number;
  };
  setValue: any;
}) => {
  return (
    <Box display={'flex'} justifyContent={'space-between'}>
      <CalculatorTextField
        bg={bg['100']}
        k={`${type}Stake`}
        valueObj={valueObj}
        setValue={setValue}
        label="total matched"
      ></CalculatorTextField>
      <CalculatorTextField
        bg={bg['100']}
        k={`avg${capitalize(type)}Odds`}
        valueObj={valueObj}
        setValue={setValue}
        label="average odds"
      ></CalculatorTextField>
    </Box>
  );
};
export default CalculatorGroup;
