import React, { useState, useEffect } from 'react';
import PrimaryActionButton from '../components/shared/PrimaryActionButton';
import './VisitNotes.css';
import { usePatientContext } from '../context/PatientContext';
import GlobalPatientSelector from '../components/GlobalPatientSelector/GlobalPatientSelector';

const VisitNotes = ({ openConfirmationModal, isPatientContextActiveInSession, isConfirmationModalOpen, patientToConfirmId, isConfirmingNewPatient, closeConfirmationModal, activatePatientContextInSession, deactivatePatientContextInSession, handleToggleSidebar, }) => {
  const { selectedPatient, onUpdatePatient } = usePatientContext();
  const [noteType, setNoteType] = useState('SOAP Note');
  const [visitConversation, setVisitConversation] = useState('');
  const [icd10Codes, setIcd10Codes] = useState('');
  const [generatedNote, setGeneratedNote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [usePatientContextToggle, setUsePatientContextToggle] = useState(true);

  useEffect(() => {
    if (selectedPatient && usePatientContextToggle) {
      let patientContext = `Patient: ${selectedPatient.fullName}\n`;
      if (selectedPatient.chronicConditions && selectedPatient.chronicConditions.length > 0) {
        patientContext += `Chronic Conditions: ${selectedPatient.chronicConditions.map(c => c.name).join(', ')}\n`;
      }
      if (selectedPatient.longTermMedications && selectedPatient.longTermMedications.length > 0) {
        patientContext += `Long-Term Medications: ${selectedPatient.longTermMedications.map(m => `${m.name} (${m.dose})`).join(', ')}\n`;
      }
      if (selectedPatient.allergies && selectedPatient.allergies.length > 0) {
        patientContext += `Allergies: ${selectedPatient.allergies.map(a => a.substance).join(', ')}\n`;
      }
      setVisitConversation(patientContext);
    } else {
      setVisitConversation('');
    }
  }, [selectedPatient, usePatientContextToggle]);


  const handleGenerateNote = () => {
    if (!selectedPatient) {
      alert('Please select a patient to generate notes for.');
      return;
    }
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      let noteContent = {};

      switch (noteType) {
        case 'SOAP Note':
          noteContent = {
            subjective: `Patient reports: ${visitConversation.substring(0, 50)}...`,
            objective: 'Vitals stable. Physical exam unremarkable.',
            assessment: 'Patient condition stable. Continue current management.',
            plan: 'Follow up in 2 weeks. Prescriptions refilled.',
          };
          break;
        case 'Progress Note':
          noteContent = {
            progress: `Patient's progress since last visit: ${visitConversation.substring(0, 50)}...`,
            findings: 'No new concerns. Tolerating medications well.',
            plan: 'Continue monitoring. Adjust medication as needed.',
          };
          break;
        case 'Discharge Summary':
          noteContent = {
            admissionDiagnosis: 'Example Admission Diagnosis',
            dischargeDiagnosis: 'Example Discharge Diagnosis',
            hospitalCourse: `Hospital course: ${visitConversation.substring(0, 50)}...`,
            dischargeMedications: 'Medication A, Medication B',
            followUp: 'PCP follow-up in 1 week.',
          };
          break;
        default:
          noteContent = {
            note: `Generated note based on conversation: ${visitConversation}`,
          };
      }
      setGeneratedNote(noteContent);
      setLoading(false);
    }, 2000);
  };

  const handleSaveNote = () => {
    if (!selectedPatient || !generatedNote) {
      alert('No patient selected or no note generated to save.');
      return;
    }

    const newNote = {
      id: Date.now(), // Simple unique ID
      patientId: selectedPatient.id,
      type: noteType,
      content: generatedNote,
      timestamp: new Date().toISOString(),
    };

    const updatedPatient = {
      ...selectedPatient,
      notes: [...(selectedPatient.notes || []), newNote],
    };

    onUpdatePatient(updatedPatient);
    alert('Note saved successfully!');
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Note copied to clipboard!');
  };


  return (
    <div className="visit-notes-container">
      <div className="page-header">
        <h1>Visit Notes / Documentation</h1>
        <p>Create and manage visit notes for patient documentation</p>
      </div>

      <div className='form-container'>
        <div className="form-section">
          <GlobalPatientSelector
          isConfirmationModalOpen={isConfirmationModalOpen}
          patientToConfirmId={patientToConfirmId}
          isConfirmingNewPatient={isConfirmingNewPatient}
          openConfirmationModal={openConfirmationModal}
          closeConfirmationModal={closeConfirmationModal}
          isPatientContextActiveInSession={isPatientContextActiveInSession}
          activatePatientContextInSession={activatePatientContextInSession}
          deactivatePatientContextInSession={deactivatePatientContextInSession}
        />
        </div>

        <div className="note-type-selector">
          <button
            className={`note-type-button ${noteType === 'SOAP Note' ? 'active' : ''}`}
            onClick={() => setNoteType('SOAP Note')}
          >
            SOAP Note
          </button>
          <button
            className={`note-type-button ${noteType === 'Progress Note' ? 'active' : ''}`}
            onClick={() => setNoteType('Progress Note')}
          >
            Progress Note
          </button>
          <button
            className={`note-type-button ${noteType === 'Discharge Summary' ? 'active' : ''}`}
            onClick={() => setNoteType('Discharge Summary')}
          >
            Discharge Summary
          </button>
        </div>
        <div className="form-section">
          <h2>Visit Input Area</h2>
          <textarea
            value={visitConversation}
            onChange={(e) => setVisitConversation(e.target.value)}
            placeholder="Type or paste visit conversation here..."
            rows={10}
            className="visit-input-textarea"
          ></textarea>
          <button className="microphone-button" disabled>
            Start Recording
          </button>
        </div>
        <div className="form-section">
          <h2>ICD-10 Codes (Optional)</h2>
          <input
            type="text"
            value={icd10Codes}
            onChange={(e) => setIcd10Codes(e.target.value)}
            placeholder="Enter ICD-10 codes (e.g., I10, E11.9)"
            className="icd10-input"
          />
        </div>
        <div className="visit-notes-actions">
          {selectedPatient && (
            <label className="patient-context-toggle">
              <input
                type="checkbox"
                checked={usePatientContextToggle}
                onChange={(e) => setUsePatientContextToggle(e.target.checked)}
              />
              Include Patient Context
            </label>
          )}
          <PrimaryActionButton
            label={loading ? 'Generating...' : 'Generate Note'}
            onClick={handleGenerateNote}
            disabled={loading || !visitConversation.trim()}
          />
        </div>
      </div>

      {generatedNote && (
        <div className="generated-note-section">
          <h2>Generated {noteType}</h2>
          {Object.entries(generatedNote).map(([key, value]) => (
            <div key={key} className="note-output-group">
              <h3>{key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}</h3>
              <textarea
                value={value}
                onChange={(e) => setGeneratedNote({ ...generatedNote, [key]: e.target.value })}
                rows={Math.max(3, value.split('\n').length)}
                className="editable-note-output"
              ></textarea>
            </div>
          ))}
          <PrimaryActionButton label="Copy to Clipboard" onClick={() => copyToClipboard(JSON.stringify(generatedNote, null, 2))} />
          <PrimaryActionButton label="Save Note" onClick={handleSaveNote} disabled={!selectedPatient || !generatedNote} />
        </div>
      )}
    </div>
  );
};

export default VisitNotes;