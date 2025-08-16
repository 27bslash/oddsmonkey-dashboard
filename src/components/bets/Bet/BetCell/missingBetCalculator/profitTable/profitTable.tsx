import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  Typography,
  TableBody,
} from '@mui/material';
import { BData } from '../../../../../../../types';
import ProfitTableRow from './profitTableRow';
import { blue, green, red } from '@mui/material/colors';
type ProfitTableProps = {
  data: BData;
  backTotal: number;
  layTotal: number;
  backLiability: number;
  layLiability: number;
};
const ProfitTable = ({
  data,
  backTotal,
  layTotal,
  backLiability,
  layLiability,
}: ProfitTableProps) => {
  return (
    <Table
      className="bet-calculator-profit-table"
      sx={{
        backgroundColor: 'black',
        overflow: 'hidden',
        borderRadius: '0 0 20px 20px',
        border: 'solid 3px black',
      }}
    >
      <TableHead>
        <TableRow sx={{ backgroundColor: '#191e41' }}>
          <TableCell
            sx={{ color: 'white', padding: '10px 20px', fontWeight: 'bold' }}
          >
            <Typography textTransform="capitalize"></Typography>
          </TableCell>
          <TableCell
            sx={{ color: 'white', padding: '10px 20px', fontWeight: 'bold' }}
          >
            <Typography textTransform="capitalize">
              {data.bet_info.bookmaker}
            </Typography>
          </TableCell>
          <TableCell
            sx={{ color: 'white', padding: '10px 20px', fontWeight: 'bold' }}
          >
            <Typography textTransform="capitalize">
              {data.bet_info.exchange}
            </Typography>
          </TableCell>
          <TableCell
            sx={{ color: 'white', padding: '10px 20px', fontWeight: 'bold' }}
          >
            <Typography textTransform="capitalize">Total</Typography>
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        <ProfitTableRow
          total={backTotal}
          type="back"
          liability={layLiability}
        ></ProfitTableRow>
        <ProfitTableRow
          total={layTotal}
          type="lay"
          liability={backLiability}
        ></ProfitTableRow>
      </TableBody>
    </Table>
  );
};
export default ProfitTable;
