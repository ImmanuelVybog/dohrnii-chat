import React, { createContext, useState, useContext, useEffect } from 'react';

const PatientContext = createContext();

export const usePatientContext = () => {
  return useContext(PatientContext);
};

export const PatientProvider = ({ children }) => {
  const [selectedPatient, setSelectedPatient] = useState(null);

  useEffect(() => {
    if (selectedPatient) {
      localStorage.setItem('selectedPatient', JSON.stringify(selectedPatient));
    } else {
      localStorage.removeItem('selectedPatient');
    }
  }, [selectedPatient]);

  const handleUpdatePatient = (updatedPatient) => {
    console.log('Updating selected patient in context:', updatedPatient);
    setSelectedPatient(updatedPatient);
  };

  return (
    <PatientContext.Provider value={{ selectedPatient, onUpdatePatient: handleUpdatePatient }}>
      {children}
    </PatientContext.Provider>
  );
};
