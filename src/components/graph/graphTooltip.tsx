import { ReactNode } from 'react';

type CustomTooltipProps = {
  x: number;
  y: number;
  content: ReactNode;
  visible: boolean;
};
const CustomTooltip = ({ x, y, content, visible }: CustomTooltipProps) => {
  if (!visible) return null;

  return (
    <div
      id="custom-tooltip"
      style={{
        position: 'absolute',
        top: y,
        left: x,
        transform: 'translate(-50%, -100%)',
        background: '#111',
        color: '#fff',
        padding: '8px 12px',
        width: '200px',
        borderRadius: '6px',
        border: 'solid 4px white',
        fontSize: '14px',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    >
      {content}
    </div>
  );
};
export default CustomTooltip;
