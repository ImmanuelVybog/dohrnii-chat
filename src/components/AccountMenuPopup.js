import './AccountMenuPopup.css';
import settingsIconLight from '../assets/images/settings-icon-light.svg';
import settingsIconDark from '../assets/images/settings-icon-dark.svg';
import logoutIconLight from '../assets/images/logout-icon-light.svg';
import logoutIconDark from '../assets/images/logout-icon-dark.svg';
import { useTheme } from '../context/ThemeContext';



const AccountMenuPopup = ({ isOpen, onClose, onOpenAccountPopup, user, onLogout }) => {
  const { isDarkMode } = useTheme();
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
            <img src={isDarkMode ? settingsIconDark : settingsIconLight} alt="Settings" className="account-icon" />
            <span>Settings</span>
          </button>
          <button className="menu-item account-btn" onClick={onLogout}>
            <img src={isDarkMode ? logoutIconDark : logoutIconLight} alt="Log out" className="account-icon" />
            <span>Log out</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccountMenuPopup;