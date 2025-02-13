import { Update } from '@mui/icons-material';
import { Box, Button, ButtonGroup, Typography } from '@mui/material';
import { blue, green } from '@mui/material/colors';
import { SetStateAction, Dispatch } from 'react';
import UpdateFlags from '../updateFlags';
type FilterButtonProps = {
  filter: 'active' | 'day' | 'week' | 'all time';
  setFilter: Dispatch<SetStateAction<FilterButtonProps['filter']>>;
};
function FilterButtons({ filter, setFilter }: FilterButtonProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'start',
        alignItems: 'center',
      }}
    >
      <Typography
        variant="h5"
        textTransform={'capitalize'}
        // marginBottom={'60px'}
      >
        filter by Bet Placed Time
      </Typography>
      <ButtonGroup
        variant="contained"
        // disableElevation
        sx={{
          height: '45px',
          textWrap: 'nowrap',
        }}
      >
        <FilterButton currentFilter={filter} setFilter={setFilter}>
          active
        </FilterButton>
        <FilterButton currentFilter={filter} setFilter={setFilter}>
          day
        </FilterButton>
        <FilterButton currentFilter={filter} setFilter={setFilter}>
          week
        </FilterButton>
        <FilterButton currentFilter={filter} setFilter={setFilter}>
          all time
        </FilterButton>
      </ButtonGroup>
    </Box>
  );
}
export function FilterButton({ currentFilter, setFilter, children }: any) {
  return (
    <Button
      sx={{
        backgroundColor: currentFilter === children ? blue['800'] : blue['600'],
      }}
      onClick={() => setFilter(children)}
    >
      <Typography>{children}</Typography>
    </Button>
  );
}
export default FilterButtons;
