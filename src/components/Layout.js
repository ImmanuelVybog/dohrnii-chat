import React, { useState } from 'react';
import Sidebar from './Sidebar';
import AccountPopup from './AccountPopup';
import { ThemeProvider } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { usePatientContext } from '../context/PatientContext';
import './Layout.css';

const Layout = ({ children, isConfirmationModalOpen, patientToConfirmId, isConfirmingNewPatient, openConfirmationModal, closeConfirmationModal, isPatientContextActiveInSession, activatePatientContextInSession, deactivatePatientContextInSession, isSidebarOpen, handleToggleSidebar }) => {
  const [isAccountPopupOpen, setIsAccountPopupOpen] = useState(false);
  const user = { name: 'Dr. John Doe', username: 'dr.johndoe' }; // Mock user
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

  const handleLogout = () => {
    console.log('User logged out');
    // Implement actual logout logic here
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
              isOpen={isSidebarOpen}
              onToggleSidebar={handleToggleSidebar}
              onOpenAccountPopup={handleOpenAccountPopup}
              onGoHome={handleGoHome}
              user={user}
              onLogout={handleLogout}
              onNewChat={handleNewChat}
              isConfirmationModalOpen={isConfirmationModalOpen}
              patientToConfirmId={patientToConfirmId}
              isConfirmingNewPatient={isConfirmingNewPatient}
              openConfirmationModal={openConfirmationModal}
              closeConfirmationModal={closeConfirmationModal}
              isPatientContextActiveInSession={isPatientContextActiveInSession}
              activatePatientContextInSession={activatePatientContextInSession}
              deactivatePatientContextInSession={deactivatePatientContextInSession}
              isSidebarOpen={isSidebarOpen}
              handleToggleSidebar={handleToggleSidebar}
            />
          {isSidebarOpen && <div className="sidebar-backdrop" onClick={handleToggleSidebar}></div>}
          <div className={`main-content ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
            {children}
          </div>
          <AccountPopup
            isOpen={isAccountPopupOpen}
            onClose={handleCloseAccountPopup}
            user={user}
            onLogout={handleLogout}
          />
        </div>
    </ThemeProvider>
  );
};

export default Layout;