import React from 'react';
import { Patient } from '../../types/patient';
import './PatientDetailModal.css';

interface PatientDetailModalProps {
  patient: Patient;
  onClose: () => void;
  onEdit: (patientId: string) => void; // Assuming edit will navigate or open another modal
}

const PatientDetailModal: React.FC<PatientDetailModalProps> = ({ patient, onClose, onEdit }) => {
  if (!patient) {
    return null;
  }

  return (
    <div className="patient-detail-modal-overlay">
      <div className="patient-detail-modal">
        <h2>Patient Details: {patient.fullName}</h2>
        <div className="modal-content">
          <h3>Demographics</h3>
          <p><strong>Age:</strong> {patient.age}</p>
          <p><strong>Sex:</strong> {patient.sex}</p>

          <h3>Snapshot</h3>
          {patient.chronicConditions && patient.chronicConditions.length > 0 && (
            <p><strong>Chronic Conditions:</strong> {patient.chronicConditions.map(c => c.name).join(', ')}</p>
          )}
          {patient.longTermMedications && patient.longTermMedications.length > 0 && (
            <p><strong>Long-Term Medications:</strong> {patient.longTermMedications.map(m => m.name).join(', ')}</p>
          )}
          {patient.allergies && patient.allergies.length > 0 && (
            <p><strong>Allergies:</strong> {patient.allergies.map(a => a.substance).join(', ')}</p>
          )}
          {patient.keyPastClinicalEvents && patient.keyPastClinicalEvents.length > 0 && (
            <p><strong>Key Past Clinical Events:</strong> {patient.keyPastClinicalEvents.map(e => e.description).join(', ')}</p>
          )}

          <h3>Uploaded Context</h3>
          {patient.uploadedFiles && patient.uploadedFiles.length > 0 ? (
            <ul>
              {patient.uploadedFiles.map(file => (
                <li key={file.id}>{file.name} ({file.type})</li>
              ))}
            </ul>
          ) : (
            <p>No uploaded files.</p>
          )}
          {patient.manualTextContext && (
            <>
              <h3>Manual Text Context</h3>
              <p>{patient.manualTextContext}</p>
            </>
          )}
        </div>
        <div className="modal-actions">
          <button onClick={() => onEdit(patient.id)}>Edit</button>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default PatientDetailModal;
