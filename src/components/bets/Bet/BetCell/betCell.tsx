import { TableCell, Typography } from '@mui/material';
import { ReactNode } from 'react';

type BetTableCellProps = {
  color?: string;
  children: ReactNode;
};

function BetTableCell({ color, children }: BetTableCellProps) {
  if (!color) color = 'white';
  return (
    <TableCell sx={{ borderBottom: 'none' }}>
      <Typography width={'120px'} color={color}>
        {children}
      </Typography>
    </TableCell>
  );
}
export default BetTableCell;
