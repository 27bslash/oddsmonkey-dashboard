import { Box, Button, ButtonGroup, Typography } from '@mui/material';
import { SetStateAction, Dispatch } from 'react';

export function FilterButton({ currentFilter, setFilter, children }: any) {
  return (
    <Button
      sx={{
        backgroundColor:
          currentFilter === children ? 'primary.dark' : 'primary',
      }}
      onClick={() => setFilter(children)}
    >
      <Typography>{children}</Typography>
    </Button>
  );
}

type FilterButtonProps = {
  filter: 'active' | 'day' | 'week' | 'month' | 'year' | 'all time';
  setFilter: Dispatch<SetStateAction<FilterButtonProps['filter']>>;
};
function FilterButtons({ filter, setFilter }: FilterButtonProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'end',
        alignItems: 'end',
        marginBottom: '1.1em',
      }}
    >
      <Typography
        variant="h5"
        textTransform="capitalize"
        // marginBottom={'60px'}
      >
        {/* filter by Bet Placed Time */}
      </Typography>
      <ButtonGroup
        variant="contained"
        // disableElevation
        color="primary"
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
          month
        </FilterButton>
        <FilterButton currentFilter={filter} setFilter={setFilter}>
          year
        </FilterButton>
        <FilterButton currentFilter={filter} setFilter={setFilter}>
          all time
        </FilterButton>
      </ButtonGroup>
    </Box>
  );
}

export default FilterButtons;
