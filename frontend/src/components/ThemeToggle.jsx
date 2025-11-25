import React from 'react';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { useThemeMode } from '../../theme/ThemeProvider';

export default function ThemeToggle({ size = 'medium' }) {
  const { mode, toggle } = useThemeMode();
  return (
    <Tooltip title={mode === 'light' ? 'Switch to dark' : 'Switch to light'}>
      <IconButton onClick={toggle} size={size} color="inherit" sx={{ ml: 1 }}>
        {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
      </IconButton>
    </Tooltip>
  );
}