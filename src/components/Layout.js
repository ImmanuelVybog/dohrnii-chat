import React, { useState } from 'react';
import Sidebar from './Sidebar';
import AccountPopup from './AccountPopup';
import { ThemeProvider } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { usePatientContext } from '../context/PatientContext';
import './Layout.css';

const Layout = ({ children, isSidebarOpen, handleToggleSidebar, isAuthenticated, user, onLogout, openPatientSelectionModal, isPatientSelectionModalOpen }) => {
  const [isAccountPopupOpen, setIsAccountPopupOpen] = useState(false);

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
    console.log('New chat initiated');
    // Implement new chat logic here
  };

  // Mock questions for sidebar history
  const mockQuestions = [
    { id: '1', title: 'What are the latest guidelines for hypertension management?' },
    { id: '2', title: 'Differential diagnosis for chest pain.' },
    { id: '3', title: 'Drug interactions of Warfarin.' },
  ];

  const handleQuestionSelect = (id) => {
    console.log('Selected question:', id);
    // Implement logic to load chat history for selected question
  };

  return (
    <ThemeProvider>
        <div className="App">
          <Sidebar
              questions={mockQuestions}
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
    </ThemeProvider>
  );
};

export default Layout;