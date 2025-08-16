import { Box, Button, Typography } from '@mui/material';
import { green, red } from '@mui/material/colors';
import mongodbIcon from '../../../../../icons/mongodb.svg';

type NestedTextProps = {
  firstStr: string;
  secondStr: string | React.ReactElement;
  bgColor: string;
  color: string;
  clickHandle?: any;
};
export const OpenBet = ({
  baseColor,
  liability,
  total,
  updateDb,
  type,
}: any) => {
  return (
    <Box display={'flex'} paddingRight={2} alignItems={'center'}>
      <Box>
        <NestedText
          bgColor={baseColor['900']}
          color={green['300']}
          firstStr="Total Staked"
          secondStr={`£${type === 'lay' ? +total.toFixed(2) : liability.toFixed(2)}`}
        />
        <NestedText
          bgColor={baseColor['900']}
          color={red['700']}
          firstStr="Liability:"
          secondStr={`-£${liability.toFixed(2)}`}
        />
        <NestedText
          bgColor={baseColor['900']}
          color={green['300']}
          firstStr={`${type} Winnings`}
          secondStr={`+£${total.toFixed(2)}`}
        />
      </Box>
      <Button
        onClick={() => updateDb()}
        color={'success'}
        startIcon={<img height={'25px'} src={mongodbIcon}></img>}
        variant="contained"
        sx={{
          width: '35%',
          height: '40px',
          marginLeft: 'auto',
          marginRight: '5px',
          color: 'white',
        }}
      >
        update DB
      </Button>
    </Box>
  );
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
