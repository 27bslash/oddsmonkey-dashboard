import { Box, Typography } from '@mui/material';
import { useState } from 'react';
import Zoom from 'react-medium-image-zoom';
import 'react-medium-image-zoom/dist/styles.css';
import CustomZoom from './customZoom';
type ImageProps = {
  dates: number[];
  betName: string;
  site: 'smarkets' | 'betfair' | 'betconnect';
};
const ImageGroup = ({ dates, betName, site }: ImageProps) => {
  const basePath =
    'D:\\projects\\python\\odds_monkey_bot\\dist\\logs\\screenshots';
  const [open, setOpen] = useState(true);
  return (
    <>
      {/* <Typography>{type}</Typography> */}
      {/* <Typography onClick={() => setOpen((prev) => !prev)}>{type}</Typography> */}

      {['pre_submit', 'matched'].map((imageType) => {
        return (
          <Box>
            <Typography textTransform={'capitalize'}>
              {imageType.replace('_', ' ')}
            </Typography>
            <Box display={'flex'} flexDirection={'row'}>
              {dates.map((targetDate) => {
                const betMonth = new Date(targetDate * 1000).toLocaleDateString(
                  'en-uk',
                  {
                    month: 'short',
                  },
                );
                const targetImage = `${site}\\${betMonth}\\${betName}_${targetDate}.png`;
                const path =
                  `${basePath}\\${imageType}\\${targetImage}`.replace(
                    /\\/g,
                    '/',
                  );
                return <IndividualImage path={path}></IndividualImage>;
              })}
            </Box>
          </Box>
        );
      })}
    </>
  );
};
export const IndividualImage = ({ path }: { path: string }) => {
  const [showImage, setShowImage] = useState(true);
  const [zoomed, setZoomed] = useState(false);
  return <CustomZoom imageSrc={path} />;
  //   return showImage ? (
  //     <Box>
  //       {/* <div
  //         className="image-container"
  //         style={{
  //         //   width: '25%',
  //         //   height: '25%',
  //           overflow: 'hidden',
  //           position: 'relative',
  //         }}
  //       > */}
  //       {zoomed ? (
  //         <img
  //           onClick={() => setZoomed((prev) => !prev)}
  //           src={`media:///${path}`}
  //           width={'800px'}
  //           style={{
  //             //   maxWidth: '400px',
  //             //   maxHeight: '600px',
  //             //   position: 'absolute',
  //             top: 0,
  //             //   left: '-75%' /* Move to the top-right corner */,
  //             //   transformOrigin: 'top right',
  //             transform: 'scale(3)',
  //             overflow: 'hidden',
  //           }}
  //           // onError={() => setShowImage(false)}
  //           // onMouseOver={(e) => (e.target.style.transform = 'scale(2.5)')}
  //           // onMouseOut={(e) => (e.target.style.transform = 'scale(1)')}
  //         />
  //       ) : (
  //         <img
  //           onClick={() => setZoomed((prev) => !prev)}
  //           src={`media:///${path}`}
  //           width={'200px'}
  //           height={'200px'}
  //           style={{
  //             //   maxWidth: '400px',
  //             //   maxHeight: '600px',
  //             //   position: 'absolute',
  //             top: 0,
  //             //   left: '-75%' /* Move to the top-right corner */,
  //             //   transformOrigin: 'top right',
  //             // transform: 'scale()',
  //             // overflow: 'hidden',
  //           }}
  //           // onError={() => setShowImage(false)}
  //           // onMouseOver={(e) => (e.target.style.transform = 'scale(2.5)')}
  //           // onMouseOut={(e) => (e.target.style.transform = 'scale(1)')}
  //         />
  //       )}
  //       {/* </div> */}
  //     </Box>
  //   ) : (
  //     <></>
  //   );
};
export default ImageGroup;
