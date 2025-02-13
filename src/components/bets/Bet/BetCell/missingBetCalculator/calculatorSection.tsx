import { Box, TextField } from '@mui/material';
import { blue, green, red } from '@mui/material/colors';
import Typography from '@mui/material/Typography';
import { MatchObj } from './betCalculator';
import CalculatorGroup from './partBet';
import CalculatorTextField from './calculatorTextField';
import { MouseEvent } from 'react';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import { BData } from '../../../../../../types';
import smarkets from '../../../../../icons/smarkets.png';
import betfair from '../../../../../icons/betfair.png';

type CalculatorSectionProps = {
  data: BData;
  total: number;
  liability: number;
  type: 'back' | 'lay';
  link: string;
  valueObj: {
    avgBackOdds: number;
    avgLayOdds: number;
    currentBackOdds: number;
    currentLayOdds: number;
    backStake: number;
    layStake: number;
    commission: number;
  };
  updateValue: React.Dispatch<
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
  setUpdate: React.Dispatch<React.SetStateAction<boolean>>;
  update?: boolean;
  missingBet?: number;
};
const CalculatorSection = ({
  total,
  liability,
  type,
  link,
  missingBet,
  valueObj,
  updateValue,
  update,
  setUpdate,
}: CalculatorSectionProps) => {
  const baseColor = type === 'lay' ? blue : green;
  const openLink = (e: MouseEvent<HTMLButtonElement, MouseEvent>) => {
    if (!update) window.open(link, '_blank');
    const target = e.target as HTMLElement;
    console.log(e, target.textContent);
    copyText();
    setUpdate((prev) => !prev);
  };
  const copyText = () => {
    navigator.clipboard.writeText(missingBet!.toFixed(2));
    setUpdate((prev) => !prev);
  };
  return (
    <>
      <Box
        id={`${type}-container`}
        className="calculator-section"
        sx={{
          background: baseColor['200'],
          //   borderLeft: 'solid 3px black',
          //   borderRight: 'solid 3px black',
        }}
        padding={2}
        color={'black'}
      >
        <CalculatorGroup
          type={type}
          valueObj={valueObj}
          setValue={updateValue}
          bg={baseColor}
          //   updateValues={(stake, odds) => updateValues(stake, odds, type)}
        />
        <Box display={'flex'} justifyContent={'space-between'}>
          <CalculatorTextField
            bg={baseColor['100']}
            valueObj={valueObj}
            k={`current${capitalize(type)}Odds`}
            setValue={updateValue}
            label="current odds"
          ></CalculatorTextField>
          {type === 'lay' && (
            <CalculatorTextField
              bg={baseColor['100']}
              k={'commission'}
              valueObj={valueObj}
              setValue={updateValue}
              label="current commission"
            ></CalculatorTextField>
          )}
        </Box>
      </Box>
      <>
        {!!missingBet && (
          <Box
            backgroundColor={baseColor['900']}
            padding={0.5}
            display={'flex'}
            borderLeft={'solid 3px black'}
            borderRight={'solid 3px black'}
            alignItems={'center'}
          >
            <NestedText
              bgColor={baseColor['900']}
              color={red['700']}
              firstStr={`missing ${type} bet:`}
              secondStr={
                <>
                  <span>
                    {/* £{+missingBet.toFixed(2) <= 0 ? 0 : missingBet.toFixed(2)} */}
                    £{+missingBet.toFixed(2)}
                  </span>
                </>
              }
              clickHandle={(
                e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
              ) => {
                copyText();
              }}
            />
            <Box className="icon-group" display={'flex'}>
              <FileCopyIcon
                height={'30px'}
                className="icon"
                sx={{
                  height: '30px',
                  marginLeft: '5px',
                  color: 'white',
                  fontSize: '1.5rem',
                  marginRight: '5px',
                }}
                onClick={() => copyText()}
              />
              <img
                className="icon"
                height={'30px'}
                src={
                  link.toLowerCase().includes('smarkets') ? smarkets : betfair
                }
                onClick={openLink}
              />
            </Box>
          </Box>
        )}
        {!!missingBet && (
          <OpenBet
            update={update}
            baseColor={baseColor}
            liability={liability}
            total={total}
          />
        )}
      </>
    </>
  );
};
const OpenBet = ({ update, baseColor, liability, total }: any) => {
  return (
    <>
      {update && (
        <Box
          backgroundColor={baseColor['900']}
          borderLeft={'solid 3px black'}
          borderRight={'solid 3px black'}
          paddingLeft={"4px"}
        >
          <NestedText
            bgColor={baseColor['900']}
            color={red['700']}
            firstStr="Liability:"
            secondStr={`-£${liability.toFixed(2)}`}
          />
          <NestedText
            bgColor={baseColor['900']}
            color={green['300']}
            firstStr="Total:"
            secondStr={`+£${total.toFixed(2)}`}
          />
        </Box>
      )}
    </>
  );
};
type NestedTextProps = {
  firstStr: string;
  secondStr: string | React.ReactElement;
  bgColor: string;
  color: string;
  clickHandle?: any;
};
const NestedText = ({
  firstStr,
  secondStr,
  bgColor,
  color,
  clickHandle,
}: NestedTextProps) => {
  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        // justifyContent: 'space-between',
      }}
    >
      <Typography
        className="missing-bet-text"
        fontWeight={'bold'}
        textTransform={'capitalize'}
        // padding={0.5}
        paddingLeft={2}
        sx={{
          flex: 1,
          backgroundColor: bgColor,
        }}
      >
        {firstStr}
        <span
          onClick={clickHandle}
          style={{
            marginLeft: '4px',
            color: color,
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          {secondStr}
        </span>
      </Typography>
    </div>
  );
};
export const capitalize = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};
export default CalculatorSection;
