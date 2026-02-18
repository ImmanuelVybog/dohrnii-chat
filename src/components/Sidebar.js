import { useState, useEffect, useRef } from 'react';
import AccountMenuPopup from './AccountMenuPopup';
import './Sidebar.css';
import Tooltip from '../components/shared/Tooltip';
import logo from '../assets/images/Dohrnii Logo.svg';
import logoIcon from '../assets/images/Dohrnii Logo Icon.svg';
import newChatIcon from '../assets/images/lets-icons--chat-plus.svg';
import dropdownIconDown from '../assets/images/down icon.svg';
import dropdownIconUp from '../assets/images/up icon.svg';
import userIconLight from '../assets/images/user-icon-light.svg';
import userIconDark from '../assets/images/user-icon-dark.svg';
import userIconHover from '../assets/images/user-icon-hover.svg';
import sidebarCloseIcon from '../assets/images/lucide_sidebar-close.svg';
import sidebarOpenIcon from '../assets/images/lucide_sidebar-open.svg';

/**Workspaces-icons */
import clinicalReasoningIconLight from '../assets/images/Workspaces-icons/lucide_brain-light.svg';
import clinicalReasoningIconDark from '../assets/images/Workspaces-icons/lucide_brain-dark.svg';
import clinicalReasoningIconActive from '../assets/images/Workspaces-icons/lucide_brain-active.svg';
import visitnoteIconLight from '../assets/images/Workspaces-icons/lucide_clipboard-list-light.svg';
import visitnoteIconDark from '../assets/images/Workspaces-icons/lucide_clipboard-list-dark.svg';
import visitnoteIconActive from '../assets/images/Workspaces-icons/lucide_clipboard-list-active.svg';
import drugsafetyIconLight from '../assets/images/Workspaces-icons/lucide_pill-light.svg';
import drugsafetyIconDark from '../assets/images/Workspaces-icons/lucide_pill-dark.svg';
import drugsafetyIconActive from '../assets/images/Workspaces-icons/lucide_pill-active.svg';
import guidelinesIconLight from '../assets/images/Workspaces-icons/lucide_book-open-light.svg';
import guidelinesIconDark from '../assets/images/Workspaces-icons/lucide_book-open-dark.svg';
import guidelinesIconActive from '../assets/images/Workspaces-icons/lucide_book-open-active.svg';
import calculatorIconLight from '../assets/images/Workspaces-icons/lucide_calculator-light.svg';
import calculatorIconDark from '../assets/images/Workspaces-icons/lucide_calculator-dark.svg';
import calculatorIconActive from '../assets/images/Workspaces-icons/lucide_calculator-active.svg';
import differentialdiagnosisIconLight from '../assets/images/Workspaces-icons/lucide_network-light.svg';
import differentialdiagnosisIconDark from '../assets/images/Workspaces-icons/lucide_network-dark.svg';
import differentialdiagnosisIconActive from '../assets/images/Workspaces-icons/lucide_network-active.svg';


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

  const workspaceLinks = [
    { to: '/clinical-reasoning', label: 'Clinical Reasoning', iconLight: clinicalReasoningIconLight, iconDark: clinicalReasoningIconDark, iconActive: clinicalReasoningIconActive },
    { to: '/visit-notes', label: 'Visit Notes', iconLight: visitnoteIconLight, iconDark: visitnoteIconDark, iconActive: visitnoteIconActive },
    { to: '/drug-safety', label: 'Drug Safety', iconLight: drugsafetyIconLight, iconDark: drugsafetyIconDark, iconActive: drugsafetyIconActive },
    { to: '/guidelines', label: 'Guidelines', iconLight: guidelinesIconLight, iconDark: guidelinesIconDark, iconActive: guidelinesIconActive },
    { to: '/calculators', label: 'Calculators', iconLight: calculatorIconLight, iconDark: calculatorIconDark, iconActive: calculatorIconActive },
    { to: '/differential-diagnosis', label: 'Differential Diagnosis', iconLight: differentialdiagnosisIconLight, iconDark: differentialdiagnosisIconDark, iconActive: differentialdiagnosisIconActive },
  ];

  const WorkspaceLinkItem = ({ to, label, iconLight, iconDark, iconActive }) => {
    const [isHovered, setIsHovered] = useState(false);
    
    return (
      <li>
        <NavLink 
          to={to} 
          className={({ isActive }) => (isActive ? 'active-link' : '')}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {({ isActive }) => (
            <>
              <img 
                src={isActive || isHovered ? iconActive : (isDarkMode ? iconDark : iconLight)} 
                alt={`${label} Icon`} 
                className="workspace-icon" 
              />
              {label}
            </>
          )}
        </NavLink>
      </li>
    );
  };


  return (
    <>
      <div 
        className={`sidebar-overlay ${isSidebarOpen ? 'visible' : ''}`} 
        onClick={onToggleSidebar}
      />
      <aside className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-full">
        <div className="sidebar-header">
          <img
            src={logo}
            alt="VY LABS DOHRNII Logo"
            className="app-logo"
            onClick={handleGoHome}
            style={{ cursor: 'pointer' }}
          />
          <img 
            src={sidebarCloseIcon} 
            alt="Close Sidebar" 
            className="sidebar-toggle-button" 
            onClick={onToggleSidebar} 
            style={{ cursor: 'pointer' }} 
          />
        </div>
        <div className="sidebar-content">
          <button className="new-chat-btn" onClick={onNewChat}>
              <img src={newChatIcon} alt="New Chat" className="new-chat-icon" />
              <span className="new-chat-text">New Chat</span>
          </button>

          <div className="workspaces-section">
            <h3 className="sidebar-title">Workspaces</h3>
            <ul className="workspace-list">
              {workspaceLinks.map((link) => (
                <WorkspaceLinkItem key={link.to} {...link} />
              ))}
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
      </div>
      <div className="sidebar-mini">
        <div className="sidebar-closed" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
          <div className="sidebar-toggle-container">
            {isHovered ? (
              <div className="sidebar-toggle-button-container">
                <Tooltip text="Open Sidebar" position="right">
                  <img 
                    src={sidebarOpenIcon} 
                    alt="Open Sidebar" 
                    className="sidebar-toggle-button" 
                    onClick={onToggleSidebar} 
                  />
                </Tooltip>
              </div>
            ) : (
              <img
                src={logoIcon}
                alt="VY LABS DOHRNII Logo"
                className="app-logo"
                onClick={handleGoHome}
              />
            )}
          </div>
          <button className="new-chat-btn" onClick={onNewChat}>
            <Tooltip text="New Chat" position="right">
              <img src={newChatIcon} alt="New Chat" className="new-chat-icon" />
            </Tooltip>
          </button>
        </div>
      </div>
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
    </>
  );
};

export default Sidebar;
