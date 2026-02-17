import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode } from 'react';
import { getAllPatients } from '../services/patientService';
import { Patient } from '../types/patient';

interface PatientContextType {
  allPatients: Patient[];
  refreshPatients: () => void;
  selectedPatient: Patient | null;
  onUpdatePatient: (updatedPatient: Patient | null) => void;
  isPatientContextActiveInSession: boolean;
  activatePatientContextInSession: (patientId: string) => void;
  deactivatePatientContextInSession: () => void;
  activePatientId: string | null;
}

const PatientContext = createContext<PatientContextType | undefined>(undefined);

export const usePatientContext = () => {
  const context = useContext(PatientContext);
  if (context === undefined) {
    throw new Error('usePatientContext must be used within a PatientProvider');
  }
  return context;
};

interface PatientProviderProps {
  children: ReactNode;
}

export const PatientProvider: React.FC<PatientProviderProps> = ({ children }) => {
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(() => {
    const storedPatient = localStorage.getItem('selectedPatient');
    return storedPatient ? JSON.parse(storedPatient) : null;
  });

  const [isPatientContextActiveInSession, setIsPatientContextActiveInSession] = useState<boolean>(() => {
    const storedActivePatientId = localStorage.getItem('activePatientId');
    return !!storedActivePatientId; // True if an active patient ID is stored
  });

  const [activePatientId, setActivePatientId] = useState<string | null>(() => {
    return localStorage.getItem('activePatientId') || null;
  });

  const refreshPatients = useCallback(() => {
    const patients = getAllPatients();
    setAllPatients(patients);
  }, []);

  useEffect(() => {
    refreshPatients();
  }, [refreshPatients]);

  useEffect(() => {
    if (selectedPatient) {
      localStorage.setItem('selectedPatient', JSON.stringify(selectedPatient));
    } else {
      localStorage.removeItem('selectedPatient');
    }
  }, [selectedPatient]);

  useEffect(() => {
    if (activePatientId) {
      localStorage.setItem('activePatientId', activePatientId);
      setIsPatientContextActiveInSession(true);
    } else {
      localStorage.removeItem('activePatientId');
      setIsPatientContextActiveInSession(false);
    }
  }, [activePatientId]);

  const handleUpdatePatient = (updatedPatient: Patient | null) => {
    console.log('Updating selected patient in context:', updatedPatient);
    setSelectedPatient(updatedPatient);
  };

  const activatePatientContextInSession = (patientId: string) => {
    setActivePatientId(patientId);
  };

  const deactivatePatientContextInSession = () => {
    setActivePatientId(null);
  };

  return (
    <PatientContext.Provider
      value={{
        allPatients,
        refreshPatients,
        selectedPatient,
        onUpdatePatient: handleUpdatePatient,
        isPatientContextActiveInSession,
        activatePatientContextInSession,
        deactivatePatientContextInSession,
        activePatientId, // Expose activePatientId as well for potential use
      }}
    >
      {children}
    </PatientContext.Provider>
  );
};
