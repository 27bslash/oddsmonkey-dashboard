import { TableCell, TableSortLabel } from '@mui/material';
import { useState } from 'react';

export const OrderableCell = (props: any) => {
  const [sortDirection, setSortDirection] = useState(props.sortDirection);
  return (
    <TableCell size="small" sx={{ borderBottom: 'none' }}>
      <TableSortLabel
        direction={props.orderBy === props.sort ? props.order : 'asc'}
        onClick={() => {
          const sortStr = sortDirection === 'asc' ? 'desc' : 'asc';
          console.log(props.sort, sortStr, props.k);
          props.onRequestSort(props.sort, sortStr, props.k);
          return setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        }}
      >
        {props.children}
      </TableSortLabel>
    </TableCell>
  );
};
