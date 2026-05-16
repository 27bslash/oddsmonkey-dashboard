import { Dialog } from '@mui/material';
import Graph from './graph';
import { GraphDialogProps } from './graphWrapper';

function GraphDialog(props: GraphDialogProps) {
  const { setOpen, open, filter } = props;

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <Dialog
      onClose={handleClose}
      open={open}
      fullWidth={true}
      PaperProps={{
        style: { width: 1300, maxWidth: '90vw' },
        onWheel: (e: any) => e.stopPropagation(), // ← add this
      }}
    >
      <Graph filter={filter} />
    </Dialog>
  );
}
export default GraphDialog;
