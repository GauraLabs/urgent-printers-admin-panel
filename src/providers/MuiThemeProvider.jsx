/**
 * MUI Theme Provider
 * Provides Material-UI theming with dark mode support for Material React Table
 */

import { useMemo } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { useSelector } from 'react-redux';
import { selectTheme } from '@/store/slices/uiSlice';

const MuiThemeProvider = ({ children }) => {
  const theme = useSelector(selectTheme);
  const isDark = theme === 'dark';

  const muiTheme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: isDark ? 'dark' : 'light',
          primary: {
            main: isDark ? '#e0e7ff' : '#312e81',
            contrastText: isDark ? '#1e1b4b' : '#f5f3ff',
          },
          background: {
            default: isDark ? '#0f172a' : '#ffffff',
            paper: isDark ? '#1e293b' : '#ffffff',
          },
          text: {
            primary: isDark ? '#f1f5f9' : '#0f172a',
            secondary: isDark ? '#94a3b8' : '#64748b',
          },
          divider: isDark ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0',
        },
        typography: {
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        },
        components: {
          MuiPaper: {
            styleOverrides: {
              root: {
                backgroundImage: 'none',
              },
            },
          },
          MuiTableCell: {
            styleOverrides: {
              root: {
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0',
              },
              head: {
                backgroundColor: isDark ? '#334155' : '#f8fafc',
                color: isDark ? '#f1f5f9' : '#0f172a',
                fontWeight: 600,
              },
            },
          },
          MuiTableRow: {
            styleOverrides: {
              root: {
                '&:hover': {
                  backgroundColor: isDark ? 'rgba(51, 65, 85, 0.5)' : 'rgba(248, 250, 252, 0.5)',
                },
              },
            },
          },
          MuiIconButton: {
            styleOverrides: {
              root: {
                color: isDark ? '#94a3b8' : '#64748b',
                '&:hover': {
                  backgroundColor: isDark ? '#334155' : '#f8fafc',
                },
              },
            },
          },
          MuiButton: {
            styleOverrides: {
              root: {
                textTransform: 'none',
              },
            },
          },
          MuiTooltip: {
            styleOverrides: {
              tooltip: {
                backgroundColor: isDark ? '#334155' : '#1e293b',
                color: '#f1f5f9',
              },
            },
          },
        },
      }),
    [isDark]
  );

  return <ThemeProvider theme={muiTheme}>{children}</ThemeProvider>;
};

export default MuiThemeProvider;
