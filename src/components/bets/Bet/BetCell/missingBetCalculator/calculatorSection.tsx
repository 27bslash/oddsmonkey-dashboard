import { Box } from '@mui/material';
import { blue, green, red } from '@mui/material/colors';
import Typography from '@mui/material/Typography';
import CalculatorGroup from './partBet';
import CalculatorTextField from './calculatorTextField';
import {
  ChangeEvent,
  MouseEvent,
  SetStateAction,
  useEffect,
  useState,
} from 'react';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import { BData, Matched } from '../../../../../../types';
import smarkets from '../../../../../icons/smarkets.png';
import betfair from '../../../../../icons/betfair.png';
import { ArrowDownward } from '@mui/icons-material';
import { OpenBet } from './OpenBet';

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
  missingBet?: { missingBackBet: number; missingLayBet: number } | undefined;
  setMissingBet: React.Dispatch<
    SetStateAction<
      { missingBackBet: number; missingLayBet: number } | undefined
    >
  >;
};
const CalculatorSection = ({
  data,
  total,
  liability,
  type,
  link,
  missingBet,
  setMissingBet,
  valueObj,
  updateValue,
  update,
  setUpdate,
}: CalculatorSectionProps) => {
  const baseColor = type === 'lay' ? blue : green;

  const [missingBetByType, setMissingBetByType] = useState<number>();
  useEffect(() => {
    const n = missingBet
      ? type === 'lay'
        ? missingBet.missingLayBet
        : missingBet.missingBackBet
      : undefined;
    setMissingBetByType(n);
  }, [missingBet]);
  const openLink = () => {
    window.open(link, '_blank');
    copyText();
    setUpdate((prev) => !prev);
  };
  const copyText = () => {
    navigator.clipboard.writeText(missingBetByType!.toFixed(2));
    setUpdate((prev) => !prev);
  };
  const updateDb = () => {
    const currentOdds =
      `current${capitalize(type)}Odds` as keyof CalculatorSectionProps['valueObj'];
    const updateQuery = `bet_profit.${type === 'lay' ? 'exchange_matched' : 'back_matched'}`;
    let arr =
      data.bet_profit[
        `${type === 'lay' ? 'exchange_matched' : 'back_matched'}`
      ];
    console.log(valueObj, missingBetByType);
    const currentStake = (
      valueObj[`${type}Stake`] +
      missingBetByType! / arr.length
    ).toFixed(2);
    arr.push({
      matched: [+currentStake],
      odds: [+valueObj[currentOdds]],
      staked: [+currentStake],
    });
    arr = combineBets(arr);
    console.log(valueObj, updateQuery, arr);
    window.electron.ipcRenderer.updateItem({
      collectionName: 'pending_bets',
      query: { _id: data._id },
      update: { $set: { [updateQuery]: arr } },
    });
  };
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const missingBetByType =
      type === 'lay' ? 'missingLayBet' : 'missingBackBet';
    missingBet![missingBetByType] = +e.target.value;
    setUpdate(true);
    setMissingBetByType(+e.target.value);
    setMissingBet({ ...missingBet! });
  };
  return (
    <>
      <Box
        id={`${type}-container`}
        className="calculator-section"
        sx={{
          background: baseColor['200'],
        }}
        padding={2}
        color={'black'}
      >
        <CalculatorGroup
          type={type}
          valueObj={valueObj}
          setValue={updateValue}
          bg={baseColor}
        />
        <Box display={'flex'}>
          <ArrowDownward
            className="icon"
            onClick={() => {
              updateValue((prev) => {
                return {
                  ...prev,
                  [`current${capitalize(type)}Odds`]:
                    prev[`avg${capitalize(type)}Odds`],
                };
              });
            }}
            sx={{
              marginLeft: 'auto',
              marginRight: '100px',
              marginTop: '-10px',
            }}
          />
        </Box>
        <Box display={'flex'} justifyContent={'space-between'}>
          {type === 'lay' && (
            <CalculatorTextField
              bg={baseColor['100']}
              k={'commission'}
              valueObj={valueObj}
              setValue={updateValue}
              label="current commission"
            ></CalculatorTextField>
          )}
          <CalculatorTextField
            bg={baseColor['100']}
            valueObj={valueObj}
            k={`current${capitalize(type)}Odds`}
            setValue={updateValue}
            label="current odds"
          ></CalculatorTextField>
        </Box>
      </Box>
      <>
        {!!missingBetByType && (
          <Box
            bgcolor={baseColor['900']}
            padding={0.5}
            display={'flex'}
            borderLeft={'solid 3px black'}
            borderRight={'solid 3px black'}
            alignItems={'center'}
          >
            <Box
              display={'flex'}
              justifyContent={'center'}
              alignItems={'center'}
            >
              <Typography
                className="missing-bet-text"
                fontWeight={'bold'}
                textTransform={'capitalize'}
                // padding={0.5}
                paddingLeft={2}
                sx={{
                  flex: 1,
                  // backgroundColor: bgColor,
                }}
              >{`missing ${type} bet:`}</Typography>
              <input
                className="config-number-input"
                type="number"
                // onKeyDown={(e) => handleKeyDown(e)}
                value={missingBetByType}
                onChange={handleChange}
                min="0.01"
                max="1000"
                style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  padding: '5px',
                  color: red['700'],
                  width: '65px',
                  textShadow:
                    '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
                }}
                step={0.01}
              />
            </Box>
            <Box
              className="icon-group"
              display={'flex'}
              marginLeft={'auto'}
              paddingRight={'16px'}
            >
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
                onClick={() => openLink()}
              />
            </Box>
          </Box>
        )}
        {!!missingBetByType && update && (
          <Box
            bgcolor={baseColor['900']}
            borderLeft={'solid 3px black'}
            borderRight={'solid 3px black'}
            paddingLeft={'4px'}
          >
            <OpenBet
              type={type}
              updateDb={updateDb}
              baseColor={baseColor}
              liability={liability}
              total={total}
            />
          </Box>
        )}
      </>
    </>
  );
};

export const capitalize = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};
const combineBets = (bets: Matched[]): Matched[] => {
  const totalMatched = bets.reduce(
    (sum, b) => sum + b.matched.reduce((a, c) => a + c, 0),
    0,
  );
  const betLength = bets.length - 1;
  const weightedOddsSum = bets.reduce((sum, b) => {
    const staked = b.matched.reduce((a, c) => a + c, 0);
    const odd = b.odds[0] || 0;
    return sum + odd * staked;
  }, 0);

  const weightedAvgOdds = totalMatched > 0 ? weightedOddsSum / totalMatched : 0;
  const ret = Array.from({ length: betLength }, () => ({
    matched: [totalMatched / betLength],
    staked: [totalMatched / betLength],
    odds: [parseFloat(weightedAvgOdds.toFixed(3))],
  }));
  return ret;
};
export default CalculatorSection;
