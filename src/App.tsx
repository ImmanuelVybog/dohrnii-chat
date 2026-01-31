import { Routes, Route, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getActivePatient } from './services/patientService';
import Home from './pages/Home';
import ClinicalReasoning from './pages/ClinicalReasoning';
import VisitNotes from './pages/VisitNotes';
import DrugSafety from './pages/DrugSafety';
import Guidelines from './pages/Guidelines';
import Calculators from './pages/Calculators';
import DifferentialDiagnosis from './pages/DifferentialDiagnosis';
import Login from './components/Login';

import Layout from './components/Layout';
import { PatientProvider } from './context/PatientContext';
import './App.css';

type OpenConfirmationModalType = (patientId: string, isNewPatient: boolean) => void;

interface PageProps {
  openConfirmationModal: OpenConfirmationModalType;
  isPatientContextActiveInSession: boolean;
  isConfirmationModalOpen: boolean;
  patientToConfirmId: string | null;
  isConfirmingNewPatient: boolean;
  closeConfirmationModal: () => void;
  activatePatientContextInSession: () => void;
  deactivatePatientContextInSession: () => void;
  isSidebarOpen: boolean;
  handleToggleSidebar: () => void;
  isAuthenticated: boolean; // Added
  user: any; // Added
  onLogout: () => void; // Added
}

const TypedHome = Home as React.FC<PageProps>;
const TypedClinicalReasoning = ClinicalReasoning as React.FC<PageProps>;
const TypedVisitNotes = VisitNotes as React.FC<PageProps>;
const TypedDrugSafety = DrugSafety as React.FC<PageProps>;
const TypedGuidelines = Guidelines as React.FC<PageProps>;
const TypedCalculators = Calculators as React.FC<PageProps>;
const TypedDifferentialDiagnosis = DifferentialDiagnosis as React.FC<PageProps>;

function App() {
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [patientToConfirmId, setPatientToConfirmId] = useState<string | null>(null);
  const [isConfirmingNewPatient, setIsConfirmingNewPatient] = useState(false);
  const [isPatientContextActiveInSession, setIsPatientContextActiveInSession] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();

  // Authentication states
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('medicalAiUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (userData: any) => {
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('medicalAiUser', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('medicalAiUser');
    navigate('/'); // Navigate to the home page after logout
  };

  const handleToggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const openConfirmationModal = (patientId: string | null, isNewPatient: boolean) => {
    const idToConfirm = patientId === null ? getActivePatient()?.id : patientId;
    if (idToConfirm) {
      setPatientToConfirmId(idToConfirm);
      setIsConfirmingNewPatient(isNewPatient);
      setIsConfirmationModalOpen(true);
    } else {
      console.log("No patient to confirm, modal not opened.");
    }
  };

  const closeConfirmationModal = () => {
    setIsConfirmationModalOpen(false);
    setPatientToConfirmId(null);
    setIsConfirmingNewPatient(false);
  };

  const activatePatientContextInSession = () => {
    setIsPatientContextActiveInSession(true);
  };

  const deactivatePatientContextInSession = () => {
    setIsPatientContextActiveInSession(false);
  };

  return (
    <PatientProvider>
      {isAuthenticated ? (
        <Layout
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
          isAuthenticated={isAuthenticated} // Pass auth state
          user={user} // Pass user data
          onLogout={handleLogout} // Pass logout handler
        >
          <Routes>
            <Route path="/home" element={<TypedHome openConfirmationModal={openConfirmationModal} isPatientContextActiveInSession={isPatientContextActiveInSession} isConfirmationModalOpen={isConfirmationModalOpen} patientToConfirmId={patientToConfirmId} isConfirmingNewPatient={isConfirmingNewPatient} closeConfirmationModal={closeConfirmationModal} activatePatientContextInSession={activatePatientContextInSession} deactivatePatientContextInSession={deactivatePatientContextInSession} isSidebarOpen={isSidebarOpen} handleToggleSidebar={handleToggleSidebar} isAuthenticated={isAuthenticated} user={user} onLogout={handleLogout} />} />
            <Route path="/" element={<TypedHome openConfirmationModal={openConfirmationModal} isPatientContextActiveInSession={isPatientContextActiveInSession} isConfirmationModalOpen={isConfirmationModalOpen} patientToConfirmId={patientToConfirmId} isConfirmingNewPatient={isConfirmingNewPatient} closeConfirmationModal={closeConfirmationModal} activatePatientContextInSession={activatePatientContextInSession} deactivatePatientContextInSession={deactivatePatientContextInSession} isSidebarOpen={isSidebarOpen} handleToggleSidebar={handleToggleSidebar} isAuthenticated={isAuthenticated} user={user} onLogout={handleLogout} />} /> {/* Default route */}
            
            <Route path="/clinical-reasoning" element={<TypedClinicalReasoning openConfirmationModal={openConfirmationModal} isPatientContextActiveInSession={isPatientContextActiveInSession} isConfirmationModalOpen={isConfirmationModalOpen} patientToConfirmId={patientToConfirmId} isConfirmingNewPatient={isConfirmingNewPatient} closeConfirmationModal={closeConfirmationModal} activatePatientContextInSession={activatePatientContextInSession} deactivatePatientContextInSession={deactivatePatientContextInSession} isSidebarOpen={isSidebarOpen} handleToggleSidebar={handleToggleSidebar} isAuthenticated={isAuthenticated} user={user} onLogout={handleLogout} />} />
            <Route path="/visit-notes" element={<TypedVisitNotes openConfirmationModal={openConfirmationModal} isPatientContextActiveInSession={isPatientContextActiveInSession} isConfirmationModalOpen={isConfirmationModalOpen} patientToConfirmId={patientToConfirmId} isConfirmingNewPatient={isConfirmingNewPatient} closeConfirmationModal={closeConfirmationModal} activatePatientContextInSession={activatePatientContextInSession} deactivatePatientContextInSession={deactivatePatientContextInSession} isSidebarOpen={isSidebarOpen} handleToggleSidebar={handleToggleSidebar} isAuthenticated={isAuthenticated} user={user} onLogout={handleLogout} />} />
            <Route path="/drug-safety" element={<TypedDrugSafety openConfirmationModal={openConfirmationModal} isPatientContextActiveInSession={isPatientContextActiveInSession} isConfirmationModalOpen={isConfirmationModalOpen} patientToConfirmId={patientToConfirmId} isConfirmingNewPatient={isConfirmingNewPatient} closeConfirmationModal={closeConfirmationModal} activatePatientContextInSession={activatePatientContextInSession} deactivatePatientContextInSession={deactivatePatientContextInSession} isSidebarOpen={isSidebarOpen} handleToggleSidebar={handleToggleSidebar} isAuthenticated={isAuthenticated} user={user} onLogout={handleLogout} />} />
            <Route path="/guidelines" element={<TypedGuidelines openConfirmationModal={openConfirmationModal} isPatientContextActiveInSession={isPatientContextActiveInSession} isConfirmationModalOpen={isConfirmationModalOpen} patientToConfirmId={patientToConfirmId} isConfirmingNewPatient={isConfirmingNewPatient} closeConfirmationModal={closeConfirmationModal} activatePatientContextInSession={activatePatientContextInSession} deactivatePatientContextInSession={deactivatePatientContextInSession} isSidebarOpen={isSidebarOpen} handleToggleSidebar={handleToggleSidebar} isAuthenticated={isAuthenticated} user={user} onLogout={handleLogout} />} />
            <Route path="/calculators" element={<TypedCalculators openConfirmationModal={openConfirmationModal} isPatientContextActiveInSession={isPatientContextActiveInSession} isConfirmationModalOpen={isConfirmationModalOpen} patientToConfirmId={patientToConfirmId} isConfirmingNewPatient={isConfirmingNewPatient} closeConfirmationModal={closeConfirmationModal} activatePatientContextInSession={activatePatientContextInSession} deactivatePatientContextInSession={deactivatePatientContextInSession} isSidebarOpen={isSidebarOpen} handleToggleSidebar={handleToggleSidebar} isAuthenticated={isAuthenticated} user={user} onLogout={handleLogout} />} />
            <Route path="/differential-diagnosis" element={<TypedDifferentialDiagnosis openConfirmationModal={openConfirmationModal} isPatientContextActiveInSession={isPatientContextActiveInSession} isConfirmationModalOpen={isConfirmationModalOpen} patientToConfirmId={patientToConfirmId} isConfirmingNewPatient={isConfirmingNewPatient} closeConfirmationModal={closeConfirmationModal} activatePatientContextInSession={activatePatientContextInSession} deactivatePatientContextInSession={deactivatePatientContextInSession} isSidebarOpen={isSidebarOpen} handleToggleSidebar={handleToggleSidebar} isAuthenticated={isAuthenticated} user={user} onLogout={handleLogout} />} />
          </Routes>
        </Layout>
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </PatientProvider>
  );
}

export default App;
