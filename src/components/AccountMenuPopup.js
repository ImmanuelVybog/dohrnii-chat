import React, { useState, useEffect } from 'react';
import './AccountMenuPopup.css';
import settingsIconLight from '../assets/images/settings-icon-light.svg';
import settingsIconDark from '../assets/images/settings-icon-dark.svg';
import settingsIconHover from '../assets/images/settings-icon-hover.svg';
import logoutIconLight from '../assets/images/logout-icon-light.svg';
import logoutIconDark from '../assets/images/logout-icon-dark.svg';
import logoutIconHover from '../assets/images/logout-icon-hover.svg';
import { useTheme } from '../context/ThemeContext';



const AccountMenuPopup = ({ isOpen, onClose, onOpenAccountPopup, user, onLogout, buttonRect }) => {
  const { isDarkMode } = useTheme();
  const [settingsIconSrc, setSettingsIconSrc] = useState(isDarkMode ? settingsIconDark : settingsIconLight);
  const [logoutIconSrc, setLogoutIconSrc] = useState(isDarkMode ? logoutIconDark : logoutIconLight);

  useEffect(() => {
    setSettingsIconSrc(isDarkMode ? settingsIconDark : settingsIconLight);
    setLogoutIconSrc(isDarkMode ? logoutIconDark : logoutIconLight);
  }, [isDarkMode]);
  if (!isOpen) return null;



  return (
    <div className="account-menu-overlay" onClick={onClose}>
      <div className="account-menu-popup" onClick={(e) => e.stopPropagation()}>
        <div className="account-info">
          <div className="account-avatar">{user?.name?.charAt(0) || ''}</div>
          <div className="account-details">
            <div className="account-name">{user?.name || 'Guest'}</div>
            <div className="account-handle">@{user?.username || 'guest'}</div>
          </div>
        </div>
        <div className="account-menu-section">
          <button className="settings-btn" onMouseEnter={() => setSettingsIconSrc(settingsIconHover)} onMouseLeave={() => setSettingsIconSrc(isDarkMode ? settingsIconDark : settingsIconLight)} onClick={() => { setSettingsIconSrc(isDarkMode ? settingsIconDark : settingsIconLight); onOpenAccountPopup(); }}>
            <img src={settingsIconSrc} alt="Settings" className="settings-icon" />
            <span>Settings</span>
          </button>
          <button className="logout-btn" onMouseEnter={() => setLogoutIconSrc(logoutIconHover)} onMouseLeave={() => setLogoutIconSrc(isDarkMode ? logoutIconDark : logoutIconLight)} onClick={() => { setLogoutIconSrc(isDarkMode ? logoutIconDark : logoutIconLight); onLogout(); }}>
            <img src={logoutIconSrc} alt="Log out" className="logout-icon" />
            <span>Log out</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccountMenuPopup;