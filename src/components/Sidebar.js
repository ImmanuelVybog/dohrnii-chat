import userIcon from '../assets/images/user-icon.svg'; // Placeholder for user icon
import { useState } from 'react';
import AccountMenuPopup from './AccountMenuPopup';
import './Sidebar.css';
import logo from '../assets/images/Dohrnii Logo.svg';
import logoIcon from '../assets/images/Dohrnii Logo Icon.svg';
import newChatIcon from '../assets/images/lets-icons--chat-plus.svg';
import { Squash } from 'hamburger-react';
import { useNavigate } from 'react-router-dom';



const Sidebar = ({ questions, onQuestionSelect, isOpen, onToggleSidebar, onOpenAccountPopup, onGoHome, user, onLogout, onNewChat }) => {
    const navigate = useNavigate();
    const [isHovered, setIsHovered] = useState(false);
    const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);

  const handleGoHome = () => {
    onGoHome();
    navigate('/');
  };

  return (
    <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      {isOpen && (
        <div className="sidebar-content">
          <div className="sidebar-header">
            <img
              src={logo}
              alt="VY LABS DOHRNII Logo"
              className="app-logo"
              onClick={handleGoHome}
              style={{ cursor: 'pointer' }}
            />
            {/* <button className="new-chat-btn" onClick={() => onQuestionSelect('')}
              style={{ margin: '0 1rem' }}
            >
              <img src={newChatIcon} alt="New Chat" className="new-chat-icon" />
            </button> */}
            <Squash toggled={isOpen} toggle={onToggleSidebar} color="#17C5CF" className="sidebar-toggle-button" />
          </div>
          <button className="new-chat-btn" onClick={onNewChat}>
              <img src={newChatIcon} alt="New Chat" className="new-chat-icon" />
              <span className="new-chat-text">New Chat</span>
          </button>
          <div className="question-history">
            <h3 className="sidebar-title">Question History</h3>
            <ul className="question-list">
              {questions.map((conv) => (
                <li key={conv.id} className="question-item">
                  <button onClick={() => onQuestionSelect(conv.id)}>{conv.title}</button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      {!isOpen && (
        <div className="sidebar-closed" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
          <div className="sidebar-toggle-container">
            {isHovered ? (
              <Squash toggled={isOpen} toggle={onToggleSidebar} color="#17C5CF" className="sidebar-toggle-button" />
            ) : (
              <img
                src={logoIcon}
                alt="VY LABS DOHRNII Logo"
                className="app-logo"
                onClick={handleGoHome}
                style={{ cursor: 'pointer' }}
              />
            )}
          </div>
          <button className="new-chat-btn" onClick={onNewChat}>
            <img src={newChatIcon} alt="New Chat" className="new-chat-icon" />
          </button>
        </div>
      )}
      <div className="sidebar-footer">
        <button className="account-btn" onClick={() => setIsAccountMenuOpen(true)}>
          <img src={userIcon} alt="Account" className="account-icon" />
          {isOpen && <span>Account</span>}
        </button>
      </div>
      <AccountMenuPopup
        isOpen={isAccountMenuOpen}
        onClose={() => setIsAccountMenuOpen(false)}
        onOpenAccountPopup={() => {
          setIsAccountMenuOpen(false);
          onOpenAccountPopup();
        }}
        user={user}
        onLogout={onLogout}
      />
    </aside>
  );
};

export default Sidebar;