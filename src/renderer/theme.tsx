import { createTheme } from '@mui/material';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#161922',
      paper: '#1a1d27',
    },
    table: {
      background: '#10131a',
      secondary: '#181e29',
    },
    primary: {
      main: '#25406a',
      light: '#3b5c8c',
      dark: '#182a45',
      contrastText: '#fff',
    },
    divider: '#e0e0e0',
  },
  typography: {
    fontFamily: 'Inter, Roboto, Arial, sans-serif',
    fontSize: 15,
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    button: {
      textTransform: 'capitalize',
      fontWeight: 600,
      textShadow:
        '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
    },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          background: '#23272f',
          color: '#fff',
        },
        input: {
          '&::placeholder': {
            color: '#b0b0b0',
            opacity: 1,
          },
        },
      },
    },
  },
});
