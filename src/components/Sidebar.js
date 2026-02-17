import { useState, useEffect, useRef } from 'react';
import AccountMenuPopup from './AccountMenuPopup';
import './Sidebar.css';
import logo from '../assets/images/Dohrnii Logo.svg';
import logoIcon from '../assets/images/Dohrnii Logo Icon.svg';
import newChatIcon from '../assets/images/lets-icons--chat-plus.svg';
import dropdownIconDown from '../assets/images/down icon.svg';
import dropdownIconUp from '../assets/images/up icon.svg';
import userIconLight from '../assets/images/user-icon-light.svg';
import userIconDark from '../assets/images/user-icon-dark.svg';
import userIconHover from '../assets/images/user-icon-hover.svg';
import { Squash } from 'hamburger-react';
import { useNavigate, NavLink } from 'react-router-dom';
import { usePatientContext } from '../context/PatientContext';
import { setActivePatient, getActivePatient, deletePatient } from '../services/patientService';
import { useTheme } from '../context/ThemeContext';
import GlobalPatientSelector from './GlobalPatientSelector/GlobalPatientSelector';



const Sidebar = ({ questions, activeConversationId, onQuestionSelect, onOpenAccountPopup, onGoHome, user, onLogout, onNewChat, initialExpandQuestionHistory, isSidebarOpen, onToggleSidebar, onOpenPatientSelectionModal,
  isChatMode,
  onExcludeContextChange,
  excludeContext,
  openConfirmationModal,
  isConfirmationModalOpen,
  patientToConfirmId,
  isConfirmingNewPatient,
  closeConfirmationModal,
  handleToggleSidebar,
  isPatientSelectionModalOpen,
  onClosePatientSelectionModal }) => {
    const navigate = useNavigate();
    const [isHovered, setIsHovered] = useState(false);
    const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
    const [accountButtonRect, setAccountButtonRect] = useState(null);
    const { allPatients, refreshPatients, onUpdatePatient, activePatientId, activatePatientContextInSession, deactivatePatientContextInSession } = usePatientContext();
    const { isDarkMode } = useTheme();
    const [openPatientOptionsMenuId, setOpenPatientOptionsMenuId] = useState(null);
    const [userIcon, setUserIcon] = useState(isDarkMode ? userIconDark : userIconLight);
    const accountButtonRef = useRef(null);

    useEffect(() => {
      setUserIcon(isDarkMode ? userIconDark : userIconLight);
    }, [isDarkMode]);


    const [isPatientSectionExpanded, setIsPatientSectionExpanded] = useState(true);

    const handleTogglePatientSection = () => {
      setIsPatientSectionExpanded(!isPatientSectionExpanded);
    };

    const [isQuestionHistoryExpanded, setIsQuestionHistoryExpanded] = useState(true);

    useEffect(() => {
      refreshPatients();
    }, [isSidebarOpen, refreshPatients]);

    const handleSelectPatient = (patientId) => {
      setActivePatient(patientId);
      const newlyActivePatient = getActivePatient();
      if (newlyActivePatient) {
        onUpdatePatient(newlyActivePatient);
        activatePatientContextInSession(patientId);
      }
    };

    const handleToggleQuestionHistory = () => {
      setIsQuestionHistoryExpanded(!isQuestionHistoryExpanded);
    };

  const handleGoHome = () => {
    onGoHome();
    navigate('/');
  };

  const handleTogglePatientOptionsMenu = (patientId, event) => {
    event.stopPropagation(); // Prevent triggering handleSelectPatient
    setOpenPatientOptionsMenuId(openPatientOptionsMenuId === patientId ? null : patientId);
  };

  const handleDeletePatient = (patientId) => {
    deletePatient(patientId);
    if (activePatientId === patientId) {
      onUpdatePatient(null);
      deactivatePatientContextInSession();
    }
    refreshPatients(); // Reload patients after deletion
    setOpenPatientOptionsMenuId(null); // Close the options menu
  };


  return (
    <aside className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
      {isSidebarOpen && (
        <div className="sidebar-header">
          <img
            src={logo}
            alt="VY LABS DOHRNII Logo"
            className="app-logo"
            onClick={handleGoHome}
            style={{ cursor: 'pointer' }}
          />
          <Squash toggled={isSidebarOpen} toggle={onToggleSidebar} color="#16AC9F" className="sidebar-toggle-button" />
        </div>
      )}
      {isSidebarOpen && (
        <div className="sidebar-content">
          <button className="new-chat-btn" onClick={onNewChat}>
              <img src={newChatIcon} alt="New Chat" className="new-chat-icon" />
              <span className="new-chat-text">New Chat</span>
          </button>

          <div className="workspaces-section">
            <h3 className="sidebar-title">Workspaces</h3>
            <ul className="workspace-list">
              <li>
                <NavLink to="/clinical-reasoning" className={({ isActive }) => (isActive ? 'active-link' : '')}>
                  Clinical Reasoning
                </NavLink>
              </li>
              <li>
                <NavLink to="/visit-notes" className={({ isActive }) => (isActive ? 'active-link' : '')}>
                  Visit Notes
                </NavLink>
              </li>
              <li>
                <NavLink to="/drug-safety" className={({ isActive }) => (isActive ? 'active-link' : '')}>
                  Drug Safety
                </NavLink>
              </li>
              <li>
                <NavLink to="/guidelines" className={({ isActive }) => (isActive ? 'active-link' : '')}>
                  Guidelines
                </NavLink>
              </li>
              <li>
                <NavLink to="/calculators" className={({ isActive }) => (isActive ? 'active-link' : '')}>
                  Calculators
                </NavLink>
              </li>
              <li>
                <NavLink to="/differential-diagnosis" className={({ isActive }) => (isActive ? 'active-link' : '')}>
                  Differential Diagnosis
                </NavLink>
              </li>
            </ul>
          </div>

          <div className="patient-section">
            <div className="sidebar-title patient-section-header" onClick={handleTogglePatientSection}>
              <h3 className="sidebar-title">Patients</h3>
              <span className="toggle-icon">{isPatientSectionExpanded ? <img src={dropdownIconUp} alt="Toggle Up" /> : <img src={dropdownIconDown} alt="Toggle Down" />}</span>
            </div>
            {isPatientSectionExpanded && (
              <div className="patient-list">
                {allPatients.length > 0 ? (
                  allPatients.map((patient) => (
                    <div
                      key={patient.id}
                      className={`patient-item ${patient.id === activePatientId ? 'active' : ''}`}
                      onClick={() => handleSelectPatient(patient.id)}
                    >
                      <div className="patient-info">
                        {patient.fullName} · {patient.age}{patient.sex?.charAt(0) || ''}
                      </div>
                      <div className="patient-options">
                        <button
                          className="options-button"
                          onClick={(e) => handleTogglePatientOptionsMenu(patient.id, e)}
                        >
                          &#8226;&#8226;&#8226;
                        </button>
                        {openPatientOptionsMenuId === patient.id && (
                          <div className="options-menu">
                            <button onClick={() => handleDeletePatient(patient.id)}>Delete</button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="patient-item no-patients">No patients found.</div>
                )}
              </div>
            )}
            <GlobalPatientSelector
              isOpen={isPatientSelectionModalOpen}
              onClose={onClosePatientSelectionModal}
              isConfirmationModalOpen={isConfirmationModalOpen}
              patientToConfirmId={patientToConfirmId}
              isConfirmingNewPatient={isConfirmingNewPatient}
              openConfirmationModal={openConfirmationModal}
              closeConfirmationModal={closeConfirmationModal}
              isSidebarButton={true}
            />
          </div>

          <div className="question-history">
            <div className="sidebar-title question-history-header" onClick={handleToggleQuestionHistory}>
              <h3 className="sidebar-title">Question History</h3>
              <span className="toggle-icon">{isQuestionHistoryExpanded ? <img src={dropdownIconUp} alt="Toggle Up" /> : <img src={dropdownIconDown} alt="Toggle Down" />}</span>
            </div>
            {isQuestionHistoryExpanded && (
              <ul className="question-list">
                {questions.map((conv) => (
                  <li key={conv.id} className="question-item">
                    <button 
                      className={conv.id === activeConversationId ? 'active-link' : ''}
                      onClick={() => onQuestionSelect(conv.id)}
                    >
                      {conv.title}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
      {!isSidebarOpen && (
        <div className="sidebar-closed" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
          <div className="sidebar-toggle-container">
            {isHovered ? (
              <Squash toggled={isSidebarOpen} toggle={onToggleSidebar} color="#16AC9F" className="sidebar-toggle-button" />
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
        <button
          className="account-btn"
          ref={accountButtonRef}
          onMouseEnter={() => setUserIcon(userIconHover)}
          onMouseLeave={() => setUserIcon(isDarkMode ? userIconDark : userIconLight)}
          onClick={() => {
            if (accountButtonRef.current) {
              setAccountButtonRect(accountButtonRef.current.getBoundingClientRect());
            }
            setIsAccountMenuOpen(prev => !prev);
          }}
        >
          <img src={userIcon} alt="Account" className="account-icon" />
          {isSidebarOpen && <span className="account-text">Account</span>}
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
        buttonRect={accountButtonRect}
      />
    </aside>
  );
};

export default Sidebar;
