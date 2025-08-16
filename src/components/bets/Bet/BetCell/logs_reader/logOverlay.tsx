import { Box } from '@mui/material';
import LogButtons from './logs_buttons';
import { BData } from '../../../../../../types';
import { useLogs } from './useLogs';
type LogsProps = {
  bet?: BData;
  //   setOverlay: React.Dispatch<React.SetStateAction<boolean>>;
  //   overlay: boolean;
};
const LogOverlay = ({ bet }: LogsProps) => {
  //   const [rawLogString, setRawLogStr] = useState('');
  //   const [tailLogString, setTailLogStr] = useState('');
  //   const [filteredStr, setFilteredStr] = useState('');
  //   const [highlightedContent, setHighlightedContent] = useState('');
  //   const [tail, setTail] = useState(true);
  //   const [filter, setFilter] = useState({ '': 0 });
  const { Logs, highlightedContent, tail, filter, setTail, setFilter } =
    useLogs({
      bet,
    });
  const escapeHTML = (str: string) => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  return (
    <Box
      display={'flex'}
      flexDirection={'column'}
      alignItems={'center'}
      zIndex={999}
    >
      <LogButtons
        setTail={setTail}
        tail={tail}
        filter={filter}
        setFilter={setFilter}
      ></LogButtons>
      <Box
        sx={{
          zIndex: 999,
          width: '1600px',
          // flexDirection: 'column',
          // alignItems: 'center',
          // justifyContent: 'center',
          position: 'sticky',
          top: '50px',
          height: '600px',
          padding: '5px',
          backgroundColor: 'black',
          border: 'solid 3px black',
          borderRadius: '8px',
          boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {/* <code
          style={{
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
            letterSpacing: '0.5px',
            overflowY: 'auto',
            maxHeight: '100%',
            display: 'block',
          }}
          dangerouslySetInnerHTML={{ __html: highlightedContent }}
        /> */}
        {Logs.map((log, index) => (
          <>{log}</>
        ))}
      </Box>
    </Box>
  );
};
export default LogOverlay;
