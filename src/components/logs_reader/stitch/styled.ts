import { Box, styled, alpha } from '@mui/material';

// --- Styled Components ---

export const TerminalHeader = styled(Box)(() => ({
  height: '56px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 24px',
  backgroundColor: alpha('#0a1529', 0.8),
  backdropFilter: 'blur(12px)',
  borderBottom: `1px solid ${alpha('#1e293b', 0.5)}`,
  position: 'sticky',
  top: 0,
  zIndex: 10,
}));

export const ErrorCard = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  padding: '12px',
  backgroundColor: alpha('#ef4444', 0.05),
  border: `1px solid ${alpha('#ef4444', 0.2)}`,
  borderRadius: '6px',
  transition: 'all 0.2s',
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: alpha('#ef4444', 0.1),
  },
}));

export const SectionRow = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '8px 16px',
  borderBottom: `1px solid ${alpha('#1e293b', 0.3)}`,
  cursor: 'pointer',
  transition: 'all 0.15s',
  '&:hover': {
    backgroundColor: alpha('#1e293b', 0.4),
  },
}));
