import { Box, Button, ButtonGroup } from '@mui/material';
import { SetStateAction } from 'react';
type LogButtonsProps = {
  filter: { [key: string]: number };
  setFilter: React.Dispatch<SetStateAction<{ [key: string]: number }>>;
  setTail: React.Dispatch<SetStateAction<boolean>>;
  tail: boolean;
};
const LogButtons = ({ filter, setFilter, tail, setTail }: LogButtonsProps) => {
  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    console.log(e.target.textContent);
    if (Object.keys(filter)[0] === e.target.textContent) {
      setFilter({ '': 0 });
    } else {
      setFilter({ [e.target.textContent]: 0 });
    }
  };
  return (
    <Box display={'flex'}>
      {JSON.stringify(filter)}
      <ButtonGroup variant="contained" onClick={handleClick}>
        {['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'].map((level) => (
          <Button
            key={level}
            onClick={handleClick}
            sx={{
              backgroundColor:
                Object.keys(filter)[0] === level ? 'info.dark' : 'primary',
            }}
          >
            {level}
          </Button>
        ))}
      </ButtonGroup>
      <Button
        onClick={() => setTail((prev) => !prev)}
        variant="contained"
        sx={{ backgroundColor: tail ? 'info.dark' : 'primary' }}
      >
        Tail
      </Button>
    </Box>
  );

};
export default LogButtons;
