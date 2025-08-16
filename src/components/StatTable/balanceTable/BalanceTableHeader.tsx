import { TableRow, TableCell, Typography } from '@mui/material';

function TableHeader({ filter }: { filter: string }) {
  let dateFilterStr = filter === 'all time' ? 'Total' : 'Current';
  if (filter === 'week') {
    dateFilterStr = 'weekly';
  } else if (filter === 'day') {
    dateFilterStr = 'daily';
  } else if (filter === 'month') {
    dateFilterStr = 'monthly';
  } else if (filter === 'year') {
    dateFilterStr = 'yearly';
  }
  return (
    <TableRow>
      <TableCell>
        <Typography color="white">Total Balance</Typography>
      </TableCell>
      <TableCell>
        <Typography color="white">Smarkets Balance</Typography>
      </TableCell>
      <TableCell>
        <Typography color="white">Betfair Balance</Typography>
      </TableCell>
      <TableCell>
        <Typography
          textTransform={'capitalize'}
          color="white"
        >{`${dateFilterStr} profit`}</Typography>
      </TableCell>
      <TableCell>
        <Typography
          textTransform={'capitalize'}
          color="white"
        >{`${dateFilterStr} liability`}</Typography>
      </TableCell>
    </TableRow>
  );
}
export default TableHeader;
