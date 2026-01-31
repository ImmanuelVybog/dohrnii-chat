import React, { useState, useEffect } from 'react';
import './PatientSelectionModal.css';
import { getAllPatients, setActivePatient, addPatient } from '../../services/patientService';
import { Patient, Sex } from '../../types/patient';
import { usePatientContext } from '../../context/PatientContext';

interface PatientSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  openConfirmationModal: (patientId: string, isNewPatient: boolean) => void;
  activatePatientContextInSession: () => void;
}

const PatientSelectionModal: React.FC<PatientSelectionModalProps> = ({ isOpen, onClose, openConfirmationModal, activatePatientContextInSession }) => {
  const { onUpdatePatient } = usePatientContext();
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreatePatientFormOpen, setIsCreatePatientFormOpen] = useState(false);
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientAge, setNewPatientAge] = useState<number | ''>('');
  const [newPatientSex, setNewPatientSex] = useState<Sex | ''>('');

  useEffect(() => {
    if (isOpen) {
      loadPatients();
    }
  }, [isOpen]);

  const loadPatients = () => {
    const patients = getAllPatients();
    setAllPatients(patients);
  };

  const handleSelectPatient = (patientId: string) => {
    setActivePatient(patientId);
    const newlyActivePatient = getAllPatients().find(p => p.id === patientId);
    if (newlyActivePatient) {
      onUpdatePatient(newlyActivePatient);
      activatePatientContextInSession();
    }
    onClose();
  };

  const handleCreatePatient = () => {
    if (newPatientName && newPatientAge && newPatientSex) {
      const patient = addPatient({
        fullName: newPatientName,
        age: newPatientAge as number,
        sex: newPatientSex as Sex,
        chronicConditions: [],
        longTermMedications: [],
        allergies: [],
        keyPastClinicalEvents: [],
        uploadedFiles: [],
        manualTextContext: '',
      });
      onUpdatePatient(patient);
      openConfirmationModal(patient.id, true);
      activatePatientContextInSession();
      loadPatients();
      handleCloseCreatePatientForm();
      onClose();
    } else {
      alert('Please fill in all patient details.');
    }
  };

  const handleOpenCreatePatientForm = () => {
    setIsCreatePatientFormOpen(true);
  };

  const handleCloseCreatePatientForm = () => {
    setIsCreatePatientFormOpen(false);
    setNewPatientName('');
    setNewPatientAge('');
    setNewPatientSex('');
  };

  const filteredPatients = allPatients.filter(patient =>
    patient.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="patient-selection-modal-overlay">
      <div className="patient-selection-modal">
        <div className="modal-header">
          <h2>Select Patient Context</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-content">
          <input
            type="text"
            placeholder="Search patients..."
            className="patient-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="patient-list-container">
            {filteredPatients.length > 0 ? (
              filteredPatients.map((patient) => (
                <div
                  key={patient.id}
                  className="patient-item"
                  onClick={() => handleSelectPatient(patient.id)}
                >
                  {patient.fullName} · {patient.age}{patient.sex?.charAt(0) || ''}
                </div>
              ))
            ) : (
              <div className="patient-item no-patients">No patients found.</div>
            )}
          </div>
          <button className="create-patient-btn" onClick={handleOpenCreatePatientForm}>
            + Create New Patient
          </button>

          {isCreatePatientFormOpen && (
            <div className="create-patient-form">
              <h3>Create New Patient</h3>
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
              <select value={newPatientSex} onChange={(e) => setNewPatientSex(e.target.value as Sex)}>
                <option value="">Select Sex</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              <div className="form-actions">
                <button onClick={handleCreatePatient}>Create</button>
                <button onClick={handleCloseCreatePatientForm}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientSelectionModal;
