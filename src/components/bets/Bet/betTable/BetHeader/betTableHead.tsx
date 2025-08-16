import {
  TableHead,
  TableRow,
  Typography,
  TableCell,
} from '@mui/material';
import { grey } from '@mui/material/colors';
import { OrderableCell } from './OrderableCell';

function BetTableHead({ updateSort }: any) {
  return (
    <TableHead>
      <TableRow sx={{ borderBottom: '1px solid black' }}>
        <OrderableCell
          onRequestSort={updateSort}
          sort="unix_time"
          sortDirection="asc"
          k="bet_info"
        >
          <Typography fontSize={'13px'} fontWeight={900} color={grey['500']}>
            EVENT TIME
          </Typography>
        </OrderableCell>
        <OrderableCell
          onRequestSort={updateSort}
          sort="bet_unix_time"
          sortDirection="asc"
          k="bet_info"
        >
          <Typography fontSize={'13px'} fontWeight={900} color={grey['500']}>
            BET PLACED TIME
          </Typography>
        </OrderableCell>
        <TableCell sx={{ borderBottom: 'none' }}>
          <Typography
            fontSize={'13px'}
            fontWeight={900}
            color={grey['500']}
          ></Typography>
        </TableCell>
        <TableCell sx={{ borderBottom: 'none' }}>
          <Typography fontSize={'13px'} fontWeight={900} color={grey['500']}>
            SIDE
          </Typography>
        </TableCell>
        <OrderableCell
          onRequestSort={updateSort}
          sort="lay_liability"
          sortDirection="asc"
          k="bet_profit"
        >
          <Typography fontSize={'13px'} fontWeight={900} color={grey['500']}>
            STAKE
          </Typography>
        </OrderableCell>
        <OrderableCell
          onRequestSort={updateSort}
          sort="avg_back_odds"
          sortDirection="asc"
          k="bet_odds"
        >
          <Typography fontSize={'13px'} fontWeight={900} color={grey['500']}>
            PRICE
          </Typography>
        </OrderableCell>
        <TableCell sx={{ borderBottom: 'none' }}>
          <Typography fontSize={'13px'} fontWeight={900} color={grey['500']}>
            MATCHED
          </Typography>
        </TableCell>
        <OrderableCell
          onRequestSort={updateSort}
          sort="back_win_profit"
          sortDirection="asc"
          k="bet_profit"
        >
          <Typography fontSize={'13px'} fontWeight={900} color={grey['500']}>
            PROFIT
          </Typography>
        </OrderableCell>
        <TableCell sx={{ borderBottom: 'none' }}>
          <Typography fontSize={'13px'} fontWeight={900} color={grey['500']}>
            MAX BET
          </Typography>
        </TableCell>
      </TableRow>
    </TableHead>
  );
}
export default BetTableHead;
