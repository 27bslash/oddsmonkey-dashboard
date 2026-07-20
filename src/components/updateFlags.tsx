import { Box, Button, ButtonGroup, Tooltip, Typography } from '@mui/material';
import { green, red } from '@mui/material/colors';
import Logs from './logs_reader/logs';
import { useEffect, useState } from 'react';
type UpdateFlagsProps = {
  flags: { [key: string]: string };
  setFlag: (flag: string) => void;
};
//   'updated': time.time(),
//                         'commission_perc': perc,
//                         'expiration_date': (
//                             expiration_date.group() if expiration_date else None
//                         ),
const UpdateFlags = ({ flags, setFlag }: UpdateFlagsProps) => {
  const [smarketsCommission, setSmarketsCommission] = useState();
  useEffect(() => {
    const g = async () => {
      const commission =
        await window.electron.ipcRenderer.fetchItems('commission');
      console.log('fetched commission', commission);
      setSmarketsCommission(commission);
    };
    g();
  }, []);

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
        <Tooltip
          title={
            <CommissionTooltip
              smarketsCommission={smarketsCommission!}
              verbose={true}
            />
          }
        >
          <Button
            onClick={() => setFlag('update_commission')}
            disabled={flags['update_balance'] === 'updating'}
          >
            <Typography>
              {flags['update_commission'] === 'updating' ? (
                'updating'
              ) : (
                <CommissionTooltip
                  smarketsCommission={smarketsCommission!}
                  verbose={false}
                />
              )}
            </Typography>
          </Button>
        </Tooltip>
        <Logs />
      </ButtonGroup>
    </Box>
  );
};
type CommissionTooltipProps = {
  smarketsCommission: {
    commission_perc: number;
    expiration_date: string;
    updated: number;
  }[];
  verbose: boolean;
};
const CommissionTooltip = ({
  smarketsCommission,
  verbose,
}: CommissionTooltipProps) => {
  if (!smarketsCommission) {
    return (
      <Box>
        <Typography>Loading commission data...</Typography>
      </Box>
    );
  }
  const commissionPerc = smarketsCommission[0].commission_perc;
  const expirationDate = smarketsCommission[0].expiration_date;
  const updated = smarketsCommission[0].updated;
  const updatedDate = new Date(updated * 1000).toLocaleDateString();
  const currentDate = new Date().toLocaleDateString();

  return (
    <Box>
      {verbose ? (
        <>
          <Box display={'flex'}>
            <Typography>
              Smarkets Commission:
              <span
                style={{
                  marginLeft: '5px',
                  color: commissionPerc === 0 ? green['600'] : red['600'],
                }}
              >
                {commissionPerc * 100}%
              </span>
            </Typography>
          </Box>
          <Typography>
            Last Updated:
            <span
              style={{
                marginLeft: '5px',
                color: updatedDate !== currentDate ? red['600'] : green['600'],
              }}
            >
              {updatedDate}
            </span>
            {expirationDate ? `Expires: ${expirationDate}` : ''}
          </Typography>
        </>
      ) : (
        <Typography>
          Commission
          <Typography
            sx={{ color: commissionPerc === 0 ? green['600'] : red['600'] }}
          >
            {commissionPerc * 100}%
          </Typography>
          {expirationDate && verbose ? `Expires: ${expirationDate}` : ''}
        </Typography>
      )}
    </Box>
  );
};
export default UpdateFlags;
