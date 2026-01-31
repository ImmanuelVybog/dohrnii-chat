import React from 'react';
import './AccountMenuPopup.css';
import settingsIcon from '../assets/images/settings-icon.svg';
import logoutIcon from '../assets/images/logout-icon.svg';



const AccountMenuPopup = ({ isOpen, onClose, onOpenAccountPopup, user, onLogout }) => {
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
        <div className="menu-section">
          <button className="menu-item account-btn" onClick={onOpenAccountPopup}>
            <img src={settingsIcon} alt="Settings" className="account-icon" />
            <span>Settings</span>
          </button>
          <button className="menu-item account-btn" onClick={onLogout}>
            <img src={logoutIcon} alt="Log out" className="account-icon" />
            <span>Log out</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccountMenuPopup;