import React, { useState, useEffect } from 'react';
import PrimaryActionButton from '../components/shared/PrimaryActionButton';
import ResultCard from '../components/shared/ResultCard';
import './VisitNotes.css';
import { usePatientContext } from '../context/PatientContext';
import GlobalPatientSelector from '../components/GlobalPatientSelector/GlobalPatientSelector';
import { apiClient } from '../services/apiClient';

const VisitNotes = ({ handleToggleSidebar }) => {
  const { selectedPatient, onUpdatePatient } = usePatientContext();
  const [noteType, setNoteType] = useState('SOAP Note');
  const [visitConversation, setVisitConversation] = useState('');
  const [icd10Codes, setIcd10Codes] = useState('');
  const [generatedNote, setGeneratedNote] = useState(null);
  const [formattedNote, setFormattedNote] = useState(null);
  const [structuredData, setStructuredData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (selectedPatient) {
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
  }, [selectedPatient]);


  const handleGenerateNote = async () => {
    setLoading(true);
    setError(null);
    setGeneratedNote(null);
    setStructuredData(null);

    const payload = {
      userInput: visitConversation,
      patientContext: apiClient.formatPatientContext(selectedPatient),
      noteType,
      icd10Codes
    };

    try {
      const data = await apiClient.generateVisitNote(payload);
      if (data.ok) {
        setGeneratedNote(data.rawContent || data.content);
        setFormattedNote(data.content);
        setStructuredData(data.structured);
      } else {
        setError(data.content || 'An unexpected error occurred.');
      }
    } catch (err) {
      console.error('Error generating visit note:', err);
      setError('System encountered an issue. Please try again.');
    } finally {
      setLoading(false);
    }
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
      structured: structuredData,
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
    <div className="workspaces-container">
      <div className="page-header">
        <h1>Visit Notes / Documentation</h1>
        <p>Create and manage visit notes for patient documentation</p>
      </div>

      <div className='form-container'>
        <div className="form-section">
          <GlobalPatientSelector />
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
          ></textarea>
          <button className="microphone-button" disabled>
            Start Recording
          </button>
        </div>
        <div className="form-section">
          <div className="form-group">
            <h2>ICD-10 Codes (Optional)</h2>
            <input
              type="text"
              value={icd10Codes}
              onChange={(e) => setIcd10Codes(e.target.value)}
              placeholder="Enter ICD-10 codes (e.g., I10, E11.9)"
              className="icd10-input"
            />
          </div>
        </div>
        <div className="visit-notes-actions">
          <PrimaryActionButton
            label={loading ? 'Generating...' : 'Generate Note'}
            onClick={handleGenerateNote}
            disabled={loading || !visitConversation.trim()}
          />
        </div>
      </div>

      {error && (
        <div className="error-message-container">
          <p className="error-message">{error}</p>
          <button className="retry-button" onClick={handleGenerateNote}>Retry</button>
        </div>
      )}

      {structuredData && (
        <div className="generated-note-section">
          <div className="result-card-container">
            <h2>Generated {noteType}</h2>

            {formattedNote && (
              <div className="formatted-note-preview" style={{ marginTop: '2rem' }}>
                <ResultCard 
                  content={<div className="markdown-content" dangerouslySetInnerHTML={{ __html: formattedNote }} />}
                />
              </div>
            )}

            <div className="note-actions" style={{ display: 'flex', gap: '1rem' }}>
              <PrimaryActionButton label="Copy to Clipboard" onClick={() => copyToClipboard(generatedNote)} />
              <PrimaryActionButton label="Save Note" onClick={handleSaveNote} disabled={!selectedPatient || !generatedNote} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisitNotes;