import React, { useState, useEffect } from 'react';
import './GlobalPatientSelector.css';
import { getActivePatient, setActivePatient, clearActivePatient } from '../../services/patientService.js';
import { Patient } from '../../types/patient';
import { usePatientContext } from '../../context/PatientContext';
import PatientSelectionModal from '../PatientSelectionModal/PatientSelectionModal';
import Tooltip from '../shared/Tooltip';

interface GlobalPatientSelectorProps {}

const GlobalPatientSelector: React.FC<GlobalPatientSelectorProps> = () => {
  const { onUpdatePatient, isPatientContextActiveInSession, activatePatientContextInSession, deactivatePatientContextInSession } = usePatientContext();

  const [currentActivePatient, setCurrentActivePatient] = useState<Patient | null>(null);
  const [isPatientSelectionModalOpen, setIsPatientSelectionModalOpen] = useState(false);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [patientToConfirmId, setPatientToConfirmId] = useState<string | null>(null);
  const [isConfirmingNewPatient, setIsConfirmingNewPatient] = useState(false);

  const openConfirmationModal = (patientId: string, isNewPatient: boolean) => {
    setPatientToConfirmId(patientId);
    setIsConfirmingNewPatient(isNewPatient);
    setIsConfirmationModalOpen(true);
  };

  const closeConfirmationModal = () => {
    setIsConfirmationModalOpen(false);
    setPatientToConfirmId(null);
    setIsConfirmingNewPatient(false);
  };

  useEffect(() => {
    setCurrentActivePatient(getActivePatient());
  }, []);

  const handleConfirmPatientSelection = () => {
    if (patientToConfirmId) {
      setActivePatient(patientToConfirmId);
      const newlyActivePatient = getActivePatient();
      if (newlyActivePatient) {
        onUpdatePatient(newlyActivePatient);
        if (typeof activatePatientContextInSession === 'function' && typeof newlyActivePatient.id === 'string') {
              activatePatientContextInSession(newlyActivePatient.id);
            } else {
              console.error('Invalid call to activatePatientContextInSession: missing function or valid patient ID');
            }
      }
      setCurrentActivePatient(getActivePatient()); // Reload to update active patient
    }
    closeConfirmationModal();
  };

  const handleCancelPatientSelection = () => {
    closeConfirmationModal();
  };

  const handleDetachPatient = () => {
    clearActivePatient();
    onUpdatePatient(null);
    setCurrentActivePatient(null);
    deactivatePatientContextInSession();
  };

  const handleOpenPatientSelectionModal = () => {
    setIsPatientSelectionModalOpen(true);
  };

  const handleClosePatientSelectionModal = () => {
    setIsPatientSelectionModalOpen(false);
    setCurrentActivePatient(getActivePatient()); // Refresh active patient after modal closes
  };

  return (
    <div className="global-patient-selector">
      {currentActivePatient && isPatientContextActiveInSession ? (
        <div className="active-patient-container">
          <button className="active-patient-display">
            <span>
              Patient: {currentActivePatient.fullName} · {currentActivePatient.age}{currentActivePatient.sex?.charAt(0) || ''}
            </span>
          </button>
          <button className="detach-patient-btn" onClick={handleDetachPatient}>
            Detach patient
          </button>
        </div>
      ) : (
        <>
          <Tooltip text="Link a patient profile to get personalized clinical recommendations">
            <button className="use-patient-context-cta" onClick={handleOpenPatientSelectionModal}>
              Use patient context
            </button>
          </Tooltip>
        </>
      )}

      <PatientSelectionModal
        isOpen={isPatientSelectionModalOpen}
        onClose={handleClosePatientSelectionModal}
        openConfirmationModal={openConfirmationModal}
      />

      {isConfirmationModalOpen && patientToConfirmId && (
        <div className="create-patient-modal-overlay">
          <div className="create-patient-modal">
            <h2>Confirm Patient Selection</h2>
            <p>
              {isConfirmingNewPatient
                ? 'Do you want to use this newly created patient as the current context?'
                : 'Are you sure you want to switch to this patient? This will clear the current chat history.'}
            </p>
            <div className="modal-actions">
              <button onClick={handleConfirmPatientSelection}>Confirm</button>
              <button onClick={handleCancelPatientSelection}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalPatientSelector;
