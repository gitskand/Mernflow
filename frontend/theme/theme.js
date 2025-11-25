import { createTheme } from '@mui/material/styles';

export const getTheme = (mode = 'light') => {
  const isLight = mode === 'light';

  const palette = isLight
    ? {
        mode: 'light',
        primary: { main: '#1976d2' },
        background: { default: '#f6f8fb', paper: '#ffffff', input: '#ffffff' },
        text: { primary: '#0f1724', secondary: '#374151' },
      }
    : {
     
        mode: 'dark',
        primary: { main: '#90caf9' },
        background: {
        
          default: '#0b1220', 
          paper: '#07121a',   
          input: '#08131b'    
        },
        text: { primary: '#e6eef8', secondary: '#9fb4d6' },
      };

  return createTheme({
    palette,
    typography: {
      fontFamily: ['Inter', 'Roboto', 'Arial', 'sans-serif'].join(','),
      button: { textTransform: 'none' },
    },

    components: {
      
      MuiOutlinedInput: {
        styleOverrides: {
          root: ({ theme }) => ({
           
            backgroundColor: isLight ? theme.palette.background.input : palette.background.input,
            borderRadius: 10,
           
            '& fieldset': {
              borderColor: isLight ? undefined : '#1b2a3a',
            },
            '&:hover fieldset': {
              borderColor: isLight ? undefined : '#2a4a6a',
            },
            '&.Mui-focused fieldset': {
              borderColor: isLight ? undefined : '#4fa3ff',
              boxShadow: isLight ? undefined : '0 0 0 4px rgba(79,163,255,0.06)',
            },
          }),
          input: {
            color: isLight ? '#0f1724' : palette.text.primary,
            '&::placeholder': {
              color: isLight ? '#6b7280' : '#7fa0c6',
              opacity: 1,
            },
          },
        },
      },

      // Filled inputs
      MuiFilledInput: {
        styleOverrides: {
          root: {
            backgroundColor: isLight ? '#f7f9fc' : '#07131b',
            borderRadius: 10,
          },
          input: {
            color: isLight ? '#0f1724' : palette.text.primary,
            '&::placeholder': {
              color: isLight ? '#6b7280' : '#7fa0c6',
            },
          },
        },
      },

      // Labels
      MuiInputLabel: {
        styleOverrides: {
          root: ({ theme }) => ({
            color: isLight ? '#374151' : '#cfe7ff',
           
            '&.MuiInputLabel-shrink': {
              color: isLight ? '#374151' : '#a9c9ef',
            },
          }),
        },
      },

      MuiFormHelperText: {
        styleOverrides: {
          root: {
            color: isLight ? '#6b7280' : '#93a7c8',
          },
        },
      },

      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundColor: isLight ? undefined : palette.background.paper,
          },
        },
      },

      MuiCard: {
        styleOverrides: {
          root: {
            backgroundColor: isLight ? undefined : palette.background.paper,
          },
        },
      },

      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
          },
        },
      },
    },
  });
};