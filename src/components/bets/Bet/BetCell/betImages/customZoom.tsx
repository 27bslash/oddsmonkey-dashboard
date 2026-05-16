import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

type CustomZoomProps = {
  imageSrc: string;
  onError?: () => void;
};
const CustomZoom = ({ imageSrc, onError }: CustomZoomProps) => {
  const [bigPicture, setBigPicture] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [transformOrigin, setTransformOrigin] = useState('center center');

  const handleZoom = () => {
    setZoom((prev) => (prev < 5 ? prev + 0.5 : 1));
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    const percentX = (offsetX / rect.width) * 100;
    const percentY = (offsetY / rect.height) * 100;
    setTransformOrigin(`${percentX}% ${percentY}%`);
  };

  const handleWheel = (e: React.WheelEvent) => {
    // e.preventDefault();
    if (e.deltaY < 0) {
      setZoom((prev) => Math.min(5, prev + 0.5)); // Zoom in, clamp to a maximum of 5
    } else {
      setZoom((prev) => Math.max(1, prev - 0.5)); // Zoom out, clamp to a minimum of 1
    }
  };
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [bigPicture]);
  return !bigPicture ? (
    <img
      height="150px"
      src={`media:///${imageSrc}`}
      onClick={() => setBigPicture(true)}
      onError={onError}
      alt="Thumbnail"
      className="thumbnail"
    />
  ) : (
    createPortal(
      <div
        className="zoom-wrapper"
        style={{
          width: '110vw',
          height: '103vh',
          position: 'absolute',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'white',
          top: -10,
          left: -110,
        }}
        onClick={() => setBigPicture(false)}
      >
        <div
          className="image-overlay"
          style={{
            width: '90vw',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
          onClick={() => setBigPicture(false)}
          onKeyDown={(e) => e.key === 'Escape' && setBigPicture(false)}
          tabIndex={0}
        >
          <img
            style={{
              transform: `scale(${zoom})`,
              transition: 'transform 0.3s ease',
              transformOrigin: transformOrigin,
              maxWidth: '100%',
            }}
            src={`media:///${imageSrc}`}
            onError={onError}
            onClick={(e) => {
              e.stopPropagation();
              handleZoom();
            }}
            onWheel={handleWheel}
            onMouseMove={handleMouseMove}
            alt="Zoomed"
          />
        </div>
      </div>,
      document.querySelector('.wrapper')!,
    )
  );
};

export default CustomZoom;
