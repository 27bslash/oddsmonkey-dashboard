import {
  TableBody,
  TableRow,
  TableCell,
  Typography,
  Tooltip,
  Box,
  Grid2,
} from '@mui/material';
import { blue, green, red } from '@mui/material/colors';
import { TotalProps } from '../statTable';

type StatTableBodyProps = {
  totals: TotalProps;
  balance: { smarkets: number; betfair: number };
};
function StatTableBody({ totals, balance }: StatTableBodyProps) {
  return (
    <TableBody>
      <TableRow>
        <TableCell>
          <Typography color={'gold'} style={{ display: 'grid' }}>
            £{balance.smarkets.toFixed(2)}
            <span style={{ color: red['600'] }}>-£{totals.smarketsLoss}</span>
          </Typography>
        </TableCell>
        <TableCell>
          <Typography color={'gold'} style={{ display: 'grid' }}>
            £{balance.betfair}
            <span style={{ color: red['600'] }}>-£{totals.betfairLoss}</span>
          </Typography>
        </TableCell>
        <TableCell width={'100px'}>
          <Grid2 container spacing={1} columns={{ sm: 8, md: 8, lg: 8 }}>
            <Grid2 size={4}>
              <Typography
                textTransform="capitalize"
                color="white"
                marginRight="10px"
              >
                min:
              </Typography>
            </Grid2>
            <Grid2 size={4} textAlign={'end'}>
              <Typography color={green['400']}>
                £{totals.minProfit.toFixed(2)}
              </Typography>
            </Grid2>
            <Grid2 size={4} style={{ display: 'flex' }}>
              <Typography
                textTransform="capitalize"
                color="white"
                marginRight="10px"
              >
                avg:
              </Typography>
            </Grid2>
            <Grid2 size={4} textAlign={'end'}>
              <Typography color={green['400']}>
                £{totals.totalProfit.toFixed(2)}
              </Typography>
            </Grid2>
            <Grid2 size={4} style={{ display: 'flex' }}>
              <Typography
                textTransform="capitalize"
                color="white"
                marginRight="10px"
              >
                max:
              </Typography>
            </Grid2>
            <Grid2 size={4} textAlign={'end'}>
              <Typography color={green['400']}>
                £{totals.maxProfit.toFixed(2)}
              </Typography>
            </Grid2>
          </Grid2>
        </TableCell>
        <TableCell>
          <Tooltip
            title={
              <>
                <Typography>Smarkets: £{totals.smarketsLoss}</Typography>
                <Typography>Betfair: £{totals.betfairLoss}</Typography>
              </>
            }
          >
            <Typography id="total-liability" color={blue['400']}>
              £{totals.totalLiability}
            </Typography>
          </Tooltip>
        </TableCell>
      </TableRow>
    </TableBody>
  );
}
export default StatTableBody;
