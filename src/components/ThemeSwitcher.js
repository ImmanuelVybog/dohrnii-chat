import React from 'react';
import { useTheme } from '../context/ThemeContext';
import './ThemeSwitcher.css';

const ThemeSwitcher = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="theme-switcher">
      <button onClick={toggleTheme}>
        {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
      </button>
    </div>
  );
};

export default ThemeSwitcher;