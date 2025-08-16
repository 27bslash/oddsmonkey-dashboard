import { useEffect, useState } from 'react';
import { BData } from '../../../../../../types';
import ImageGroup from './debugImage';
import { Box } from '@mui/material';

type DebugImagesProps = {
  data: BData;
  setOverlay: React.Dispatch<React.SetStateAction<boolean>>;
  overlay: boolean;
};

const DebugImages = ({ data, overlay }: DebugImagesProps) => {
  const [dates, setDates] = useState<{ back: number[]; lay: number[] }>({
    back: [],
    lay: [],
  });

  useEffect(() => {
    const backDates: number[] = [];
    const layDates: number[] = [];
    data.bet_profit.back_matched.forEach((matchObj) => {
      backDates.push(matchObj.bet_matched_time ?? data.bet_info.bet_unix_time);
    });
    data.bet_profit.exchange_matched.forEach((matchObj) => {
      layDates.push(matchObj.bet_matched_time ?? data.bet_info.bet_unix_time);
    });
    setDates({ back: backDates, lay: layDates });
  }, [data]);

  return (
    <>
      {overlay && (
        <Box
          display="flex"
          flexDirection="column"
          padding={2}
          alignItems="start"
          position="sticky"
          marginTop="100px"
          alignContent="start"
        >
          <Box display="flex" flexDirection="column" className="image-group" />
          <ImageGroup
            dates={dates.back}
            betName={data.bet_info.bet}
            site={data.bet_info.bookmaker}
          />
          <ImageGroup
            dates={dates.lay}
            betName={data.bet_info.bet}
            site={data.bet_info.exchange}
          />
        </Box>
      )}
    </>
  );
};

export default DebugImages;
