import { TableRow, TableCell, Typography } from '@mui/material';
import { blue, green, red } from '@mui/material/colors';
type profitTableRowProps = {
  total: number;
  liability: number;
  type: 'back' | 'lay';
};
const ProfitTableRow = ({ total, liability, type }: profitTableRowProps) => {
  const isBack = type === 'back';
  const roundedTotal = +total ? +total.toFixed(2) : 0;
  const roundedLiability = +liability ? +liability.toFixed(2) : 0;
  return (
    <TableRow
      sx={{
        '&:nth-of-type(odd)': { backgroundColor: '#2e2e42' },
        '&:nth-of-type(even)': { backgroundColor: '#1c1c2b' },
        '&:hover': { backgroundColor: '#3b3b5b' },
        color: 'white',
      }}
    >
      <TableCell
        sx={{ background: isBack ? green[300] : blue[300], color: 'black' }}
      >
        <Typography
          sx={{
            textShadow: 'none',
          }}
          fontWeight={'bold'}
        >
          {isBack ? 'Back Wins' : 'Lay Wins'}
        </Typography>
      </TableCell>
      <TableCell sx={{ color: isBack ? green[700] : red[700] }}>
        <Typography>
          {isBack ? `+ £${roundedTotal}` : `- £${roundedLiability}`}
        </Typography>
      </TableCell>
      <TableCell sx={{ color: isBack ? red[700] : green[700] }}>
        <Typography>
          {isBack ? `- £${roundedLiability}` : `+ £${roundedTotal}`}
        </Typography>
      </TableCell>
      <TableCell
        sx={{ color: roundedTotal > roundedLiability ? green[700] : red[700] }}
      >
        <Typography>
          {roundedTotal > roundedLiability ? '+' : '-'} £
          {Math.abs(roundedTotal - roundedLiability).toFixed(2)}
        </Typography>
      </TableCell>
    </TableRow>
  );
};
export default ProfitTableRow;
