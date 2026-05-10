import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: { main: '#2563EB', light: '#DBEAFE', dark: '#1D4ED8' },
    secondary: { main: '#10B981', light: '#D1FAE5' },
    error: { main: '#EF4444' },
    warning: { main: '#F59E0B' },
    background: { default: '#F1F5F9', paper: '#FFFFFF' },
    text: { primary: '#0F172A', secondary: '#64748B' },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica Neue", sans-serif',
    h1: { fontSize: '1.875rem', fontWeight: 700, lineHeight: 1.2 },
    h2: { fontSize: '1.5rem', fontWeight: 600 },
    h3: { fontSize: '1.25rem', fontWeight: 600 },
    h4: { fontSize: '1.125rem', fontWeight: 600 },
    body1: { fontSize: '0.9375rem' },
    caption: { fontSize: '0.75rem', color: '#64748B' },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
          borderRadius: 12,
          border: '1px solid rgba(0,0,0,0.06)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.875rem',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': { boxShadow: '0 2px 8px rgba(37,99,235,0.3)' },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            backgroundColor: '#FFFFFF',
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 16 },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, fontSize: '0.75rem' },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            fontWeight: 700,
            color: '#64748B',
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            backgroundColor: '#F8FAFC',
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': { backgroundColor: '#F8FAFC' },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          border: '1px solid rgba(0,0,0,0.06)',
        },
      },
    },
  },
});

export default theme;
