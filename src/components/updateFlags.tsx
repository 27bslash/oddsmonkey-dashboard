import { Box, Button, ButtonGroup, Typography } from '@mui/material';
import { green } from '@mui/material/colors';
import Logs from './logs_reader/logs';
type UpdateFlagsProps = {
  flags: { [key: string]: string };
  setFlag: (flag: string) => void;
};

const UpdateFlags = ({ flags, setFlag }: UpdateFlagsProps) => {
  return (
    <Box display={'flex'} justifyContent={'center'} alignItems={'center'}>
      <ButtonGroup
        variant="contained"
        style={{
          // marginRight: '10px',
          marginBottom: '10px',
          maxWidth: '340px',
          //   height: '45px',
        }}
        sx={{
          '&.Mui-disabled': {
            color: 'white !important',
            backgroundColor: `${green['600']} !important`,
          },
        }}
      >
        <Button
          onClick={() => setFlag('update_balance')}
          disabled={flags['update_balance'] === 'updating'}
        >
          <Typography>
            {flags['update_balance'] === 'updating'
              ? 'updating'
              : 'update balance'}
          </Typography>
        </Button>
        <Button
          onClick={() => setFlag('update_commission')}
          disabled={flags['update_balance'] === 'updating'}
        >
          <Typography>
            {flags['update_commission'] === 'updating'
              ? 'updating'
              : 'update commission'}
          </Typography>
        </Button>
        <Logs />
      </ButtonGroup>
    </Box>
  );
};
export default UpdateFlags;
