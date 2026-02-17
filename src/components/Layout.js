import React, { useState } from 'react';
import Sidebar from './Sidebar';
import AccountPopup from './AccountPopup';
import { useChatContext } from '../context/ChatContext';
import { useNavigate } from 'react-router-dom';
import './Layout.css';

const Layout = ({ children, isSidebarOpen, handleToggleSidebar, isAuthenticated, user, onLogout, openPatientSelectionModal, isPatientSelectionModalOpen }) => {
  const [isAccountPopupOpen, setIsAccountPopupOpen] = useState(false);
  const { conversations, currentConversationId, selectConversation, startNewChat } = useChatContext();

  const navigate = useNavigate();

  const handleOpenAccountPopup = () => {
    setIsAccountPopupOpen(true);
  };

  const handleCloseAccountPopup = () => {
    setIsAccountPopupOpen(false);
  };

  const handleGoHome = () => {
    navigate('/');
  };



  const handleNewChat = () => {
    startNewChat();
    navigate('/');
  };

  const handleQuestionSelect = (id) => {
    selectConversation(id);
    navigate('/');
  };

  return (
      <div className="App">
        <Sidebar
            questions={conversations}
            activeConversationId={currentConversationId}
            onQuestionSelect={handleQuestionSelect}
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={handleToggleSidebar}
            onOpenAccountPopup={handleOpenAccountPopup}
            onGoHome={handleGoHome}
            user={user}
            onLogout={onLogout}
            onNewChat={handleNewChat}
            onOpenPatientSelectionModal={openPatientSelectionModal}
          />

        <div className={`main-content ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
          {children}
        </div>
        <AccountPopup
          isOpen={isAccountPopupOpen}
          onClose={handleCloseAccountPopup}
          user={user}
          onLogout={onLogout}
        />
      </div>
  );
};

export default Layout;