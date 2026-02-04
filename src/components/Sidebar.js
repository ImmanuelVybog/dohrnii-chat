import userIcon from '../assets/images/user-icon.svg';
import { useState, useEffect } from 'react';
import AccountMenuPopup from './AccountMenuPopup';
import './Sidebar.css';
import logo from '../assets/images/Dohrnii Logo.svg';
import logoIcon from '../assets/images/Dohrnii Logo Icon.svg';
import newChatIcon from '../assets/images/lets-icons--chat-plus.svg';
import dropdownIconDown from '../assets/images/down icon.svg';
import dropdownIconUp from '../assets/images/up icon.svg';
import { Squash } from 'hamburger-react';
import { useNavigate, NavLink } from 'react-router-dom';
import { usePatientContext } from '../context/PatientContext';
import { getAllPatients, setActivePatient, getActivePatient, addPatient } from '../services/patientService';



const Sidebar = ({ questions, onQuestionSelect, onOpenAccountPopup, onGoHome, user, onLogout, onNewChat, initialExpandQuestionHistory, isConfirmationModalOpen, patientToConfirmId, isConfirmingNewPatient, openConfirmationModal, closeConfirmationModal, isPatientContextActiveInSession, activatePatientContextInSession, deactivatePatientContextInSession, isSidebarOpen, handleToggleSidebar }) => {
    const navigate = useNavigate();
    const [isHovered, setIsHovered] = useState(false);
    const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
    const { onUpdatePatient } = usePatientContext();
    const [allPatients, setAllPatients] = useState([]);
    const [activePatientId, setActivePatientId] = useState(null);
    const [isCreatePatientModalOpen, setIsCreatePatientModalOpen] = useState(false);
    const [newPatientName, setNewPatientName] = useState('');
    const [newPatientAge, setNewPatientAge] = useState('');
    const [newPatientSex, setNewPatientSex] = useState('');

    const [isPatientSectionExpanded, setIsPatientSectionExpanded] = useState(false);

    const handleTogglePatientSection = () => {
      setIsPatientSectionExpanded(!isPatientSectionExpanded);
    };

    const [isQuestionHistoryExpanded, setIsQuestionHistoryExpanded] = useState(initialExpandQuestionHistory || false);

    useEffect(() => {
      loadPatients();
    }, [isSidebarOpen]);

    useEffect(() => {
      const currentActive = getActivePatient();
      if (currentActive) {
        setActivePatientId(currentActive.id);
      } else {
        setActivePatientId(null);
      }
    }, [onUpdatePatient]);

    const loadPatients = () => {
      const patients = getAllPatients();
      setAllPatients(patients);
      const currentActive = getActivePatient();
      if (currentActive) {
        setActivePatientId(currentActive.id);
      }
    };

    const handleSelectPatient = (patientId) => {
      setActivePatient(patientId);
      const newlyActivePatient = getActivePatient();
      if (newlyActivePatient) {
        onUpdatePatient(newlyActivePatient);
      activatePatientContextInSession();
      }
      setActivePatientId(patientId);
    };

    // These are now controlled by App.tsx
    // const handleTogglePatientSection = () => {
    //   setIsPatientSectionExpanded(!isPatientSectionExpanded);
    // };

    const handleToggleQuestionHistory = () => {
      setIsQuestionHistoryExpanded(!isQuestionHistoryExpanded);
    };

  const handleGoHome = () => {
    onGoHome();
    navigate('/');
  };

  const handleOpenCreatePatientModal = () => {
    setIsCreatePatientModalOpen(true);
  };


  const handleCloseCreatePatientModal = () => {
    setIsCreatePatientModalOpen(false);
    setNewPatientName('');
    setNewPatientAge('');
    setNewPatientSex('');
  };

  const handleCreatePatientInModal = () => {
    if (newPatientName && newPatientAge && newPatientSex) {
      const patient = addPatient({
        fullName: newPatientName,
        age: newPatientAge,
        sex: newPatientSex,
        chronicConditions: [],
        longTermMedications: [],
        allergies: [],
        keyPastClinicalEvents: [],
        uploadedFiles: [],
        manualTextContext: '',
      });
      onUpdatePatient(patient); // Update the patient context
      openConfirmationModal(patient.id, true);
      activatePatientContextInSession();
      loadPatients(); // Reload the patient list
      handleCloseCreatePatientModal();
    } else {
      alert('Please fill in all patient details.');
    }
  };


  return (
    <aside className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
      {isSidebarOpen && (
        <div className="sidebar-content">
          <div className="sidebar-header">
            <img
              src={logo}
              alt="VY LABS DOHRNII Logo"
              className="app-logo"
              onClick={handleGoHome}
              style={{ cursor: 'pointer' }}
            />
            <Squash toggled={isSidebarOpen} toggle={handleToggleSidebar} color="#16AC9F" className="sidebar-toggle-button" />
          </div>
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
                      {patient.fullName} · {patient.age}{patient.sex?.charAt(0) || ''}
                    </div>
                  ))
                ) : (
                  <div className="patient-item no-patients">No patients found.</div>
                )}
              </div>
            )}
            <button className="create-patient-btn" onClick={handleOpenCreatePatientModal}>
              + Create Patient
            </button>
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
                    <button onClick={() => onQuestionSelect(conv.id)}>{conv.title}</button>
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
              <Squash toggled={isSidebarOpen} toggle={handleToggleSidebar} color="#16AC9F" className="sidebar-toggle-button" />
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
        <button className="account-btn" onClick={() => setIsAccountMenuOpen(prev => !prev)}>
          <img src={userIcon} alt="Account" className="account-icon" />
          {isSidebarOpen && <span>Account</span>}
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

      {isCreatePatientModalOpen && (
        <div className="create-patient-modal-overlay">
          <div className="create-patient-modal">
            <h2>Create New Patient</h2>
            <input
              type="text"
              placeholder="Full Name"
              value={newPatientName}
              onChange={(e) => setNewPatientName(e.target.value)}
            />
            <input
              type="number"
              placeholder="Age"
              value={newPatientAge}
              onChange={(e) => setNewPatientAge(parseInt(e.target.value) || '')}
            />
            <select value={newPatientSex} onChange={(e) => setNewPatientSex(e.target.value)}>
              <option value="">Select Sex</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            <div className="modal-actions">
              <button onClick={handleCreatePatientInModal}>Create</button>
              <button onClick={handleCloseCreatePatientModal}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;