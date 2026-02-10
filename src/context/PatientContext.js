import React, { createContext, useState, useContext, useEffect } from 'react';

const PatientContext = createContext();

export const usePatientContext = () => {
  return useContext(PatientContext);
};

export const PatientProvider = ({ children }) => {
  const [selectedPatient, setSelectedPatient] = useState(() => {
    const storedPatient = localStorage.getItem('selectedPatient');
    return storedPatient ? JSON.parse(storedPatient) : null;
  });

  const [isPatientContextActiveInSession, setIsPatientContextActiveInSession] = useState(() => {
    const storedActivePatientId = localStorage.getItem('activePatientId');
    return !!storedActivePatientId; // True if an active patient ID is stored
  });

  const [activePatientId, setActivePatientId] = useState(() => {
    return localStorage.getItem('activePatientId') || null;
  });

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

  const handleUpdatePatient = (updatedPatient) => {
    console.log('Updating selected patient in context:', updatedPatient);
    setSelectedPatient(updatedPatient);
  };

  const activatePatientContextInSession = (patientId) => {
    setActivePatientId(patientId);
  };

  const deactivatePatientContextInSession = () => {
    setActivePatientId(null);
  };

  return (
    <PatientContext.Provider
      value={{
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
