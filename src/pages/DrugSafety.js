import React, { useState, useEffect } from 'react';
import { usePatientContext } from '../context/PatientContext';
import TagInput from '../components/shared/TagInput';
import PrimaryActionButton from '../components/shared/PrimaryActionButton';
import ResultCard from '../components/shared/ResultCard';
import EmptyState from '../components/shared/EmptyState';
import './DrugSafety.css';
import GlobalPatientSelector from '../components/GlobalPatientSelector/GlobalPatientSelector';
import referencesIconLight from '../assets/images/references-icon-light.svg';
import referencesIconDark from '../assets/images/references-icon-dark.svg';
import { useTheme } from '../context/ThemeContext';
import { apiClient } from '../services/apiClient';

/**
 * @param {object} props
 * @param {boolean} props.isSidebarOpen
 * @param {function} props.handleToggleSidebar
 * @param {boolean} props.isAuthenticated
 * @param {object | null} props.user
 * @param {function} props.onLogout
 * @param {function} props.openPatientSelectionModal
 * @param {boolean} props.isPatientSelectionModalOpen
 */
const DrugSafety = ({ isSidebarOpen, handleToggleSidebar, isAuthenticated, user, onLogout, openPatientSelectionModal, isPatientSelectionModalOpen }) => {
  const { selectedPatient } = usePatientContext();
  const { theme } = useTheme();

  const [medications, setMedications] = useState([]);
  const [patientConditions, setPatientConditions] = useState([]);
  const [allergies, setAllergies] = useState([]);
  const [interactionResults, setInteractionResults] = useState([]);
  const [references, setReferences] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [autoFilledFields] = useState({});

  const [aiResponse, setAiResponse] = useState('');

  useEffect(() => {
    if (selectedPatient) {
      setPatientConditions(selectedPatient.chronicConditions ? selectedPatient.chronicConditions.map(condition => condition.name) : []);
      setMedications(selectedPatient.longTermMedications ? selectedPatient.longTermMedications.map(m => m.name) : []);
      setAllergies(selectedPatient.allergies ? selectedPatient.allergies.map(allergy => allergy.substance) : []);
    } else {
      setPatientConditions([]);
      setAllergies([]);
    }
  }, [selectedPatient]);

  const handleAddTag = (tag, setter) => {
    setter((prevTags) => [...prevTags, tag]);
  };

  const handleRemoveTag = (tag, setter) => {
    setter((prevTags) => prevTags.filter((t) => t !== tag));
  };

  const handleCheckDrugSafety = async () => {
    if (medications.length === 0) {
      alert('Please add at least one medication to check.');
      return;
    }

    setLoading(true);
    setError(null);
    setInteractionResults([]);

    try {
      const data = await apiClient.checkDrugInteractions(medications, selectedPatient);
      if (data.ok) {
        setInteractionResults(data.structured?.summary || []);
        // data.content already contains formatted HTML from apiClient
        setAiResponse(data.content);
        setReferences(data.references || []);
      } else {
        setError(data.content || 'An unexpected error occurred.');
      }
    } catch (err) {
      console.error('Error checking drug safety:', err);
      setError('System encountered an issue. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="workspaces-container">
      <div className="page-header">
        <h1>Drug Safety / Interaction Checker</h1>
        <p>Check for potential drug-drug and drug-condition interactions</p>
      </div>

      <div className="form-container">
        <div className="form-section">
          <GlobalPatientSelector />
        </div>
        <div className="form-section">
          <h2>Medications</h2>
          <TagInput
            id="medications-input"
            label="Medications"
            placeholder="(e.g., Aspirin, Insulin, Metformin) (Type and press enter)"
            tags={medications}
            onAddTag={(tag) => handleAddTag(tag, setMedications)}
            onRemoveTag={(tag) => handleRemoveTag(tag, setMedications)}
            className={autoFilledFields.medications ? 'auto-filled' : ''}
          />
        </div>
        <div className="form-section">
          <h2>Patient Conditions (Optional)</h2>
          <TagInput
            id="conditions-input"
            label="Conditions"
            placeholder="(e.g., Renal Impairment, Asthma) (Type and press enter)"
            tags={patientConditions}
            onAddTag={(tag) => handleAddTag(tag, setPatientConditions)}
            onRemoveTag={(tag) => handleRemoveTag(tag, setPatientConditions)}
          />
        </div>
        <div className="form-section">
          <h2>Allergies (Optional)</h2>
          <TagInput
            id="allergies-input"
            label="Allergies"
            placeholder="(e.g., Penicillin, Aspirin) (Type and press enter)"
            tags={allergies}
            onAddTag={(tag) => handleAddTag(tag, setAllergies)}
            onRemoveTag={(tag) => handleRemoveTag(tag, setAllergies)}
          />
        </div>
        <PrimaryActionButton
          label={loading ? 'Checking...' : 'Check Drug Safety'}
          onClick={handleCheckDrugSafety}
          disabled={loading || medications.length === 0}
        />
      </div>

      {error && (
        <div className="error-message-container">
          <p className="error-message">{error}</p>
          <button className="retry-button" onClick={handleCheckDrugSafety}>Retry</button>
        </div>
      )}

      <div className="interaction-results-section">
        <h2>Interaction Results</h2>
        {loading && <p>Checking for interactions...</p>}
        {!loading && interactionResults.length === 0 && medications.length > 0 && !aiResponse && (
          <EmptyState message="No significant interactions found for the provided medications." />
        )}
        {!loading && interactionResults.length === 0 && medications.length === 0 && (
          <EmptyState message="Add medications to check for interactions." />
        )}
        
        {!loading && aiResponse && (
          <div className="ai-response-markdown">
            <ResultCard 
              title="Clinical Summary"
              content={<div className="markdown-content" dangerouslySetInnerHTML={{ __html: aiResponse }} />}
            />
          </div>
        )}

        {!loading && interactionResults.map((result, index) => (
          <ResultCard
            key={index}
            title={result.name}
            severity={result.severity}
            content={
              <>
                <p><strong>Severity:</strong> {result.severity}</p>
                <p><strong>Explanation:</strong> {result.explanation}</p>
              </>
            }
          />
        ))}

        {references && references.length > 0 && (
          <div className="citations-section" style={{ marginTop: '2rem' }}>
            <h4 className="citations-title">
              <img src={theme === 'light' ? referencesIconLight : referencesIconDark} alt="References" />
              References
            </h4>
            <div className="citations-list">
              {references.map((citation) => (
                <div className="citation-card" key={citation.id}>
                  <div className="citation-header">
                    <span className="citation-number">{citation.id}.</span>
                    <a href={citation.url} target="_blank" rel="noopener noreferrer" className="citation-title">
                      {citation.title}
                    </a>
                  </div>
                  <div className="citation-meta">
                    {citation.authors}
                  </div>
                  <div className="citation-journal-year">
                    {citation.journal} • {citation.year}
                  </div>
                  {citation.tags && citation.tags.length > 0 && (
                    <div className="citation-tags">
                      {citation.tags.map(tag => <span className="citation-tag" key={tag}>{tag}</span>)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DrugSafety;