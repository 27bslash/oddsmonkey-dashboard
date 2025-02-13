import Button from '@mui/material/Button';
import { useEffect, useState } from 'react';
import { BData } from '../../../../../../types';
import smarkets from '../../../../../icons/smarkets.png';
import betfair from '../../../../../icons/betfair.png';
import 'react-medium-image-zoom/dist/styles.css';
import ImageGroup from './debugImage';
import { Box, Typography } from '@mui/material';
type DebugImagesProps = {
  data: BData;
  setOverlay: React.Dispatch<React.SetStateAction<boolean>>;
  overlay: boolean;
};
const DebugImages = ({ data, overlay, setOverlay }: DebugImagesProps) => {
  const [bookmakerOpen, setBookmakerOpen] = useState(true);
  const [exchangeOpen, setExchangeOpen] = useState(true);

  const [showButton, setShowButton] = useState(false);
  const [dates, setDates] = useState<{ [key: string]: number[] }>({
    back: [],
    lay: [],
  });
  //   const handleClick = () => {
  //     console.log('clik');
  //     const basePath =
  //       'D:\\projects\\python\\odds_monkey_bot\\dist\\logs\\screenshots';
  //     const preSubmitPath = `${basePath}\\pre_submit`;
  //     const submitted = `${basePath}\\submitted`;
  //     const matched = `${basePath}\\matched`;
  //     const obj: any = {};
  //     const GetBetScreenshots = async () => {
  //       const mapped = await Promise.all(
  //         ['smarkets', 'betfair']
  //           .map(async (x) => {
  //             const preSubmittedImages =
  //               await window.electron.ipcRenderer.getAllImages(
  //                 `${preSubmitPath}\\${x}`,
  //               );
  //             const SubmittedImages =
  //               await window.electron.ipcRenderer.getAllImages(
  //                 `${submitted}\\${x}`,
  //               );
  //             const matchedImages =
  //               await window.electron.ipcRenderer.getAllImages(
  //                 `${matched}\\${x}`,
  //               );
  //             obj[x] = { preSubmittedImages, SubmittedImages, matchedImages };
  //             return {
  //               [x]: { preSubmittedImages, SubmittedImages, matchedImages },
  //             };
  //           })
  //           .flat(),
  //       );
  //       console.log(mapped);
  //       mapped.filter((x) =>
  //         x.smarkets.matchedImages.filter((s: string) => {
  //           return s;
  //         }),
  //       );
  //     };
  //     GetBetScreenshots();
  //   };
  useEffect(() => {
    const getFileNames = async () => {
      const images = await window.electron.ipcRenderer.getAllImages(
        'D:\\projects\\python\\odds_monkey_bot\\dist\\logs\\screenshots',
      );
      setShowButton(!!images);
    };
    getFileNames();
  }, [data]);
  useEffect(() => {
    const backDates: number[] = [];
    const layDates: number[] = [];
    data.bet_profit.back_matched.forEach((matchObj) => {
      const targetDate = matchObj.bet_matched_time
        ? matchObj.bet_matched_time
        : data.bet_info.bet_unix_time;
      backDates.push(targetDate);
    });
    data.bet_profit.exchange_matched.forEach((matchObj) => {
      const targetDate = matchObj.bet_matched_time
        ? matchObj.bet_matched_time
        : data.bet_info.bet_unix_time;

      layDates.push(targetDate);
    });
    setDates({ back: backDates, lay: layDates });
  }, []);
  return (
    <>
      {/* {showButton && (
        <Button onClick={() => setOverlay((prev) => !prev)} variant="contained">
          Show Images
        </Button>
      )} */}
      {overlay && (
        <Box
          display={'flex'}
          flexDirection={'column'}
          padding={2}
          alignItems={'start'}
          position={'sticky'}
          marginTop={'100px'}
          //   height={'300px'}
          //   width={'500px'}
          //   justifyContent={'space-around'}
          alignContent={'start'}
        >
          <Box
            display={'flex'}
            flexDirection={'column'}
            className="image-group"
          >
            {/* <img
              className="icon"
              onClick={() => {
                setExchangeOpen(false);
                return setBookmakerOpen((prev) => !prev);
              }}
              height={'40px'}
              src={data.bet_info.bookmaker === 'smarkets' ? smarkets : betfair}
              style={{ marginBottom: '20px' }}
            />
            <img
              className="icon"
              onClick={() => {
                setBookmakerOpen(false);
                return setExchangeOpen((prev) => !prev);
              }}
              height={'40px'}
              src={data.bet_info.bookmaker !== 'smarkets' ? smarkets : betfair}
            /> */}
          </Box>
          {bookmakerOpen && (
            <ImageGroup
              dates={dates.back}
              betName={data.bet_info.bet}
              site={data.bet_info.bookmaker}
            />
          )}
          {exchangeOpen && (
            <ImageGroup
              dates={dates.lay}
              betName={data.bet_info.bet}
              site={data.bet_info.exchange}
            />
          )}
        </Box>
      )}
    </>
  );
};
// const ImageGroup = () => {};
export default DebugImages;
