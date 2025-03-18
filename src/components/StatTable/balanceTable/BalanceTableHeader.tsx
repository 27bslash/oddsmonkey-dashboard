import { TableRow, TableCell, Typography } from '@mui/material';

function TableHeader({ filter }: { filter: string }) {
  let s = filter === 'all time' ? 'Total' : 'Current';
  if (filter === 'week') {
    s = 'weekly';
  } else if (filter === 'day') {
    s = 'daily';
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
        >{`${s} profit`}</Typography>
      </TableCell>
      <TableCell>
        <Typography
          textTransform={'capitalize'}
          color="white"
        >{`${s} liability`}</Typography>
      </TableCell>
    </TableRow>
  );
}
export default TableHeader;
