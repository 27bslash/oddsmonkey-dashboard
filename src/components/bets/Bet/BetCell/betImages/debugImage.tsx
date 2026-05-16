import { Box, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import CustomZoom from './customZoom';
import BrokenImageIcon from '@mui/icons-material/BrokenImage';

type ImageProps = {
  betName: string;
  site: string;
  screenshotBasePaths: string[];
  betTimestamp?: number;
};

const ImageGroup = ({ betName, site, screenshotBasePaths, betTimestamp }: ImageProps) => {
  const [images, setImages] = useState<{ pre_submit: string[]; matched: string[] }>({
    pre_submit: [],
    matched: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const load = async () => {
      const allPreSubmit: string[] = [];
      const allMatched: string[] = [];
      await Promise.all(
        screenshotBasePaths.map(async (base) => {
          const [pre, mat] = await Promise.all([
            window.electron.ipcRenderer.findImagesByName(`${base}/pre_submit`, betName, betTimestamp),
            window.electron.ipcRenderer.findImagesByName(`${base}/matched`, betName, betTimestamp),
          ]);
          allPreSubmit.push(...pre);
          allMatched.push(...mat);
        }),
      );
      const siteLower = site.toLowerCase();
      setImages({
        pre_submit: allPreSubmit.filter((p) => p.toLowerCase().includes(`/${siteLower}/`)),
        matched: allMatched.filter((p) => p.toLowerCase().includes(`/${siteLower}/`)),
      });
      setLoading(false);
    };
    load();
  }, [betName, site, screenshotBasePaths]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
        <Box
          sx={{
            width: 14,
            height: 14,
            border: '2px solid rgba(255,255,255,0.15)',
            borderTopColor: 'rgba(255,255,255,0.5)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            '@keyframes spin': { to: { transform: 'rotate(360deg)' } },
          }}
        />
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}>
          Searching...
        </Typography>
      </Box>
    );
  }

  const hasAny = images.pre_submit.length > 0 || images.matched.length > 0;
  if (!hasAny) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1, opacity: 0.4 }}>
        <BrokenImageIcon sx={{ fontSize: 16 }} />
        <Typography variant="caption" sx={{ fontSize: '11px', fontStyle: 'italic' }}>
          No screenshots found
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {(['pre_submit', 'matched'] as const).map((imageType) => {
        const paths = images[imageType];
        if (paths.length === 0) return null;
        return (
          <Box key={imageType}>
            <Box display="flex" alignItems="center" gap={1} mb={0.5}>
              <Typography
                variant="caption"
                sx={{
                  color: 'rgba(255,255,255,0.5)',
                  fontWeight: 600,
                  fontSize: '10px',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                }}
              >
                {imageType.replaceAll('_', ' ')}
              </Typography>
              <Box
                sx={{
                  flex: 1,
                  height: '1px',
                  background: 'linear-gradient(90deg, rgba(255,255,255,0.08) 0%, transparent 100%)',
                }}
              />
              <Typography
                variant="caption"
                sx={{
                  color: 'rgba(255,255,255,0.25)',
                  fontSize: '10px',
                  fontFamily: 'monospace',
                }}
              >
                {paths.length}
              </Typography>
            </Box>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              {paths.map((p) => (
                <IndividualImage key={p} path={p} />
              ))}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};

export const IndividualImage = ({ path }: { path: string }) => {
  const [showImage, setShowImage] = useState(true);
  const [imgPath, setImgPath] = useState(path);
  const [triedAlt, setTriedAlt] = useState(false);

  const handleError = () => {
    if (triedAlt) {
      setShowImage(false);
      return;
    }
    setTriedAlt(true);
    const normalized = imgPath.replace(/\\/g, '/');
    const distBase = 'D:/projects/python/odds_monkey_bot/dist';
    const devBase = 'D:/projects/python/odds_monkey_bot';
    if (normalized.includes(distBase)) {
      setImgPath(normalized.replace(distBase, devBase));
    } else if (!normalized.includes('/dist/') && normalized.includes(devBase)) {
      setImgPath(normalized.replace(devBase, distBase));
    } else {
      setShowImage(false);
    }
  };

  if (!showImage) {
    return null;
  }

  return (
    <Box
      sx={{
        borderRadius: '6px',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.08)',
        transition: 'all 0.2s ease',
        '&:hover': {
          border: '1px solid rgba(255,255,255,0.2)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          transform: 'translateY(-1px)',
        },
      }}
    >
      <CustomZoom imageSrc={imgPath} onError={handleError} />
    </Box>
  );
};

export default ImageGroup;
