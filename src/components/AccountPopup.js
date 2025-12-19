import { useState } from 'react';
import './AccountPopup.css';
import generalIcon from '../assets/images/general-icon.svg';
import notificationsIcon from '../assets/images/notifications-icon.svg';
import accountIcon from '../assets/images/account-icon.svg';
import generalIconDark from '../assets/images/general-icon-dark.svg';
import notificationsIconDark from '../assets/images/notifications-icon-dark.svg';
import accountIconDark from '../assets/images/account-icon-dark.svg';
import ThemeSwitcher from './ThemeSwitcher';
import { useTheme } from '../context/ThemeContext';




const AccountPopup = ({ isOpen, onClose, user }) => {
  const [activeTab, setActiveTab] = useState('General'); // Default to 'General' tab
  const { theme } = useTheme();

  if (!isOpen) return null;

  const renderContent = () => {
    switch (activeTab) {
      case 'General':
        return (
          <div className="general-section">
  {/* Appearance Section */}
  <div className="setting-title">
    <span>Appearance</span>
  </div>
  <div className="setting-item">
    <span>Theme</span>
    <ThemeSwitcher />
  </div>
  <div className="setting-item">
    <span>Interface density</span>
    <select className="setting-selector">
      <option value="comfortable">Comfortable</option>
      <option value="compact">Compact</option>
    </select>
  </div>
  <div className="setting-item">
    <span>Font size</span>
    <select className="setting-selector">
      <option value="default">Default</option>
      <option value="large">Large</option>
    </select>
  </div>
</div>
        );
      case 'Notifications':
        return (
          <div className="notifications-section">
            <div className="setting-item">
              <span>Email notifications</span>
              <div className="setting-toggle">
                <input type="checkbox" id="email-notifications" />
                <label htmlFor="email-notifications"></label>
              </div>
            </div>
            <div className="setting-item">
              <span>In-app notifications</span>
              <div className="setting-toggle">
                <input type="checkbox" id="in-app-notifications" />
                <label htmlFor="in-app-notifications"></label>
              </div>
            </div>
          </div>
                  );
      case 'Account':
        return (
          <div className="account-section">
            {/* Profile Section */}
              <div className="user-profile">
              <div className="user-avatar">{user?.name ? user.name.charAt(0) : ''}</div>
              <div className="user-info">
                <div className="user-name">{user?.name}</div>
                <div className="user-email">{user?.email}</div>
              </div>
              <button className="setting-selector">Manage</button>
            </div>
            <div className="setting-item">
              <span>Edit personal information</span>
              <button className="setting-selector">Edit</button>
            </div>
            <div className="setting-item">
              <span>Change profile picture</span>
              <button className="setting-selector">Change</button>
            </div>

            {/* Security Section */}
            <div className="setting-title">
              <span>Security</span>
            </div>
            <div className="setting-item">
              <span>Change password</span>
              <button className="setting-selector">Change</button>
            </div>
            <div className="setting-item">
              <span>Two-factor authentication</span>
              <div className="setting-toggle">
                <input type="checkbox" id="two-factor-auth" />
                <label htmlFor="two-factor-auth"></label>
              </div>
            </div>

            {/* Privacy & Compliance Section */}
            <div className="setting-title">
              <span>Privacy & Compliance</span>
            </div>
            <div className="setting-item">
              <span>Data privacy settings</span>
              <button className="setting-selector">Manage</button>
            </div>
            <div className="setting-item">
              <span>Terms of Service</span>
              <button className="setting-selector">View</button>
            </div>
            <div className="setting-item">
              <span>Privacy Policy</span>
              <button className="setting-selector">View</button>
            </div>
          </div>
                  );
                default:
                  return null;
  }
};

  return (
    <div className="account-popup-overlay">
      <div className="account-popup-container">
        <div className="account-popup-header">
          <h2>Settings</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <div className="account-popup-content">
          <div className="account-popup-sidebar">
            <button className={`sidebar-item ${activeTab === 'General' ? 'active' : ''}`} onClick={() => setActiveTab('General')}>
                      {theme === 'dark' ? <img src={generalIconDark} alt="General" className="sidebar-icon"/> : <img src={generalIcon} alt="General" className="sidebar-icon"/>}
                      <div className="sidebar-text">General</div>
                    </button>
            <button className={`sidebar-item ${activeTab === 'Notifications' ? 'active' : ''}`} onClick={() => setActiveTab('Notifications')}>
                      {theme === 'dark' ? <img src={notificationsIconDark} alt="Notifications" className="sidebar-icon"/> : <img src={notificationsIcon} alt="Notifications" className="sidebar-icon"/>}
                      <div className="sidebar-text">Notifications</div>
                    </button>
            <button className={`sidebar-item ${activeTab === 'Account' ? 'active' : ''}`} onClick={() => setActiveTab('Account')}>
                      {theme === 'dark' ? <img src={accountIconDark} alt="Account" className="sidebar-icon"/> : <img src={accountIcon} alt="Account" className="sidebar-icon"/>}
                      <div className="sidebar-text">Account</div>
                    </button>
          </div>
          <div className="account-popup-main-content">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountPopup;