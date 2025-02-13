import { TextField } from '@mui/material';
type CalculatorTextFieldProps = {
  bg: string;
  valueObj: {
    avgBackOdds: number;
    avgLayOdds: number;
    currentBackOdds: number;
    currentLayOdds: number;
    backStake: number;
    layStake: number;
    commission: number;
  };
  setValue: React.Dispatch<
    React.SetStateAction<{
      avgBackOdds: number;
      avgLayOdds: number;
      currentBackOdds: number;
      currentLayOdds: number;
      backStake: number;
      layStake: number;
      commission: number;
    }>
  >;
  label: string;
  k: string;
};
const CalculatorTextField = ({
  bg,
  valueObj,
  k,
  setValue,
  label,
}: CalculatorTextFieldProps) => {
  return (
    <TextField
      onChange={(e) => {
        const inputValue = +e.target.value.replace(/^0(?!\.)/, '');
        const rounded = inputValue.toFixed(2);
        // console.log(inputValue, rounded, +rounded, k);
        setValue((prevValues) => ({
          ...prevValues!,
          [k]: +e.target.value,
        }));
      }}
      variant="filled"
      value={valueObj[k]}
      inputMode="numeric"
      type="number"
      sx={{
        background: bg,
        width: '49%',
        marginBottom: '10px',
        borderRadius: '5px',
        borderBottom: 'none',
      }}
      label={label}
      inputProps={{ step: 0.01, min: 0 }}
      InputLabelProps={{
        style: {
          color: 'black',
          fontSize: '1.2rem',
          fontWeight: 'bold',
          textTransform: 'capitalize',
          borderBottom: 'none',
        },
      }}
    ></TextField>
    // <TextField
    //   onChange={(e) => {
    //     const inputValue = e.target.value;
    //     // Allow empty string for clearing the field
    //     setValue(inputValue === '' ? '' : +inputValue);
    //   }}
    //   value={value === 0 ? '' : value} // Show an empty string instead of 0 when field is cleared
    //   inputMode="numeric"
    //   type="number"
    //   sx={{ background: bg['100'] }}
    //   label={label}
    //   inputProps={{ step: 0.1 }}
    // />
  );
};
export default CalculatorTextField;
