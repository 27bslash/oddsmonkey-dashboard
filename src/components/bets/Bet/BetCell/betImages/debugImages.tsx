import { BData } from '../../../../../../types';
import ImageGroup from './debugImage';
import { Box, Chip, Typography } from '@mui/material';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import { blue, green } from '@mui/material/colors';

type DebugImagesProps = {
  data: BData;
  setOverlay: React.Dispatch<React.SetStateAction<boolean>>;
  overlay: boolean;
};

const SCREENSHOT_BASES = [
  'D:/projects/python/odds_monkey_bot/dist/logs/screenshots',
  'D:/projects/python/odds_monkey_bot/logs/screenshots',
];

const SiteSection = ({
  label,
  color,
  children,
}: {
  label: string;
  color: string;
  children: React.ReactNode;
}) => (
  <Box
    sx={{
      background: `linear-gradient(135deg, ${color}08 0%, transparent 60%)`,
      borderLeft: `3px solid ${color}`,
      borderRadius: '0 8px 8px 0',
      padding: '12px 16px',
    }}
  >
    <Box display="flex" alignItems="center" gap={1} mb={1.5}>
      <Box
        sx={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: color,
          boxShadow: `0 0 8px ${color}60`,
        }}
      />
      <Typography
        variant="subtitle2"
        sx={{
          color,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '1.5px',
          fontSize: '11px',
        }}
      >
        {label}
      </Typography>
    </Box>
    {children}
  </Box>
);

const DebugImages = ({ data, overlay }: DebugImagesProps) => {
  return (
    <>
      {overlay && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2.5,
            padding: '24px 28px',
            background:
              'linear-gradient(180deg, rgba(12,12,18,0.97) 0%, rgba(18,18,28,0.97) 100%)',
            borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow:
              '0 24px 80px rgba(0,0,0,0.6), 0 0 1px rgba(255,255,255,0.1), inset 0 1px 0 rgba(255,255,255,0.05)',
            minWidth: '450px',
            maxWidth: '90vw',
            color: 'white',
            backdropFilter: 'blur(20px)',
          }}
        >
          {/* Header */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              pb: 2,
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <PhotoLibraryIcon
              sx={{ color: '#96cbfe', fontSize: 22, opacity: 0.8 }}
            />
            <Box flex={1}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  fontSize: '16px',
                  WebkitBackgroundClip: 'text',
                  letterSpacing: '-0.3px',
                  color: 'white',
                }}
              >
                Run Time Screenshots
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: 'rgba(255, 255, 255, 0.59)',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                }}
              >
                {data.bet_info.event_name}
              </Typography>
            </Box>
          </Box>

          {/* Bookmaker */}
          <SiteSection label={data.bet_info.bookmaker} color={green[400]}>
            <ImageGroup
              betName={data.bet_info.bet}
              site={data.bet_info.bookmaker}
              screenshotBasePaths={SCREENSHOT_BASES}
              betTimestamp={data.bet_info.bet_unix_time}
            />
          </SiteSection>

          {/* Exchange */}
          <SiteSection label={data.bet_info.exchange} color={blue[400]}>
            <ImageGroup
              betName={data.bet_info.bet}
              site={data.bet_info.exchange}
              screenshotBasePaths={SCREENSHOT_BASES}
              betTimestamp={data.bet_info.bet_unix_time}
            />
          </SiteSection>
        </Box>
      )}
    </>
  );
};

export default DebugImages;
