const CustomTooltip = ({ x, y, content, visible }: CustomTooltipProps) => {
  if (!visible) return null;

  return (
    <div
      id="custom-tooltip"
      style={{
        position: 'absolute',
        top: y+10,
        left: x,
        transform: 'translate(-50%, -100%)',
        background: '#23272f',
        color: '#fff',
        padding: '16px 20px',
        minWidth: 200,
        borderRadius: 8,
        border: '2px solid black',
        fontSize: '15px',
        pointerEvents: 'auto',
        zIndex: 9999,
        boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
      }}
    >
      {content}
    </div>
  );
};
export default CustomTooltip;
