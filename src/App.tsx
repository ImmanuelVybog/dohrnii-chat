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
import { ThemeProvider } from './context/ThemeContext';

import Layout from './components/Layout';
import { PatientProvider } from './context/PatientContext';
import './App.css';



interface PageProps {
  isSidebarOpen: boolean;
  handleToggleSidebar: () => void;
  isAuthenticated: boolean;
  user: any | null;
  onLogout: () => void;
  openPatientSelectionModal: () => void;
  isPatientSelectionModalOpen: boolean;
}

function App() {

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPatientSelectionModalOpen, setIsPatientSelectionModalOpen] = useState(false);
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

  const openPatientSelectionModal = () => {
    setIsPatientSelectionModalOpen(true);
  };

  const closePatientSelectionModal = () => {
    setIsPatientSelectionModalOpen(false);
  };



  return (
    <ThemeProvider>
      <PatientProvider>
      {isAuthenticated ? (
        <Layout
          isSidebarOpen={isSidebarOpen}
          handleToggleSidebar={handleToggleSidebar}
          isAuthenticated={isAuthenticated}
          user={user}
          onLogout={handleLogout}
          openPatientSelectionModal={openPatientSelectionModal}
          isPatientSelectionModalOpen={isPatientSelectionModalOpen}
        >
          <Routes>
            <Route path="/home" element={<Home isSidebarOpen={isSidebarOpen} handleToggleSidebar={handleToggleSidebar} isAuthenticated={isAuthenticated} user={user} onLogout={handleLogout} openPatientSelectionModal={openPatientSelectionModal} isPatientSelectionModalOpen={isPatientSelectionModalOpen} />} />
            <Route path="/" element={<Home isSidebarOpen={isSidebarOpen} handleToggleSidebar={handleToggleSidebar} isAuthenticated={isAuthenticated} user={user} onLogout={handleLogout} openPatientSelectionModal={openPatientSelectionModal} isPatientSelectionModalOpen={isPatientSelectionModalOpen} />} /> {/* Default route */}
            
            <Route path="/clinical-reasoning" element={<ClinicalReasoning isSidebarOpen={isSidebarOpen} handleToggleSidebar={handleToggleSidebar} isAuthenticated={isAuthenticated} user={user} onLogout={handleLogout} openPatientSelectionModal={openPatientSelectionModal} isPatientSelectionModalOpen={isPatientSelectionModalOpen} />} />
            <Route path="/visit-notes" element={<VisitNotes isSidebarOpen={isSidebarOpen} handleToggleSidebar={handleToggleSidebar} isAuthenticated={isAuthenticated} user={user} onLogout={handleLogout} openPatientSelectionModal={openPatientSelectionModal} isPatientSelectionModalOpen={isPatientSelectionModalOpen} />} />
            <Route path="/drug-safety" element={<DrugSafety isSidebarOpen={isSidebarOpen} handleToggleSidebar={handleToggleSidebar} isAuthenticated={isAuthenticated} user={user as any} onLogout={handleLogout} openPatientSelectionModal={openPatientSelectionModal} isPatientSelectionModalOpen={isPatientSelectionModalOpen} />} />
            <Route path="/guidelines" element={<Guidelines isSidebarOpen={isSidebarOpen} handleToggleSidebar={handleToggleSidebar} isAuthenticated={isAuthenticated} user={user as any} onLogout={handleLogout} openPatientSelectionModal={openPatientSelectionModal} isPatientSelectionModalOpen={isPatientSelectionModalOpen} />} />
            <Route path="/calculators" element={<Calculators isSidebarOpen={isSidebarOpen} handleToggleSidebar={handleToggleSidebar} isAuthenticated={isAuthenticated} user={user as any} onLogout={handleLogout} openPatientSelectionModal={openPatientSelectionModal} isPatientSelectionModalOpen={isPatientSelectionModalOpen} />} />
            <Route path="/differential-diagnosis" element={<DifferentialDiagnosis isSidebarOpen={isSidebarOpen} handleToggleSidebar={handleToggleSidebar} isAuthenticated={isAuthenticated} user={user} onLogout={handleLogout} openPatientSelectionModal={openPatientSelectionModal} isPatientSelectionModalOpen={isPatientSelectionModalOpen} />} />
          </Routes>
        </Layout>
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </PatientProvider>
    </ThemeProvider>
  );
}

export default App;
