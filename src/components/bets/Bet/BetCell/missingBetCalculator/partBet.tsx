import { Box } from '@mui/material';
import CalculatorTextField from './calculatorTextField';
import { BetCalcParams, capitalize } from './calculatorSection';

const CalculatorGroup = ({
  type,
  valueObj,
  bg,
  setValue,
}: {
  type: 'lay' | 'back';
  bg: { [key: string | number]: string };
  valueObj: BetCalcParams;
  setValue: any;
}) => {
  return (
    <Box display={'flex'} justifyContent={'space-between'}>
      <CalculatorTextField
        bg={bg['100']}
        k={`${type}Stake` as keyof BetCalcParams}
        valueObj={valueObj}
        setValue={setValue}
        label="total matched"
      ></CalculatorTextField>
      <CalculatorTextField
        bg={bg['100']}
        k={`avg${capitalize(type)}Odds` as keyof BetCalcParams}
        valueObj={valueObj}
        setValue={setValue}
        label="average odds"
      ></CalculatorTextField>
    </Box>
  );
};
export default CalculatorGroup;
