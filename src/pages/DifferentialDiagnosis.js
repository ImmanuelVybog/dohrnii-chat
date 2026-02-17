import React, { useState, useEffect } from 'react';
import { usePatientContext } from '../context/PatientContext';
import TagInput from '../components/shared/TagInput';
import PrimaryActionButton from '../components/shared/PrimaryActionButton';
import ResultCard from '../components/shared/ResultCard';
import EmptyState from '../components/shared/EmptyState';
import CustomSelect from '../components/shared/CustomSelect';
import './DifferentialDiagnosis.css';
import GlobalPatientSelector from '../components/GlobalPatientSelector/GlobalPatientSelector';
import referencesIconLight from '../assets/images/references-icon-light.svg';
import referencesIconDark from '../assets/images/references-icon-dark.svg';
import { useTheme } from '../context/ThemeContext';
import { apiClient } from '../services/apiClient';

const sexOptions = [
  { value: '', label: 'Select' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

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
const DifferentialDiagnosis = ({ isSidebarOpen, handleToggleSidebar, isAuthenticated, user, onLogout, openPatientSelectionModal, isPatientSelectionModalOpen }) => {
  const { selectedPatient } = usePatientContext();
  const { theme } = useTheme();

  const [symptoms, setSymptoms] = useState([]);
  const [age, setAge] = useState('');
  const [sex, setSex] = useState('');

  useEffect(() => {
    if (selectedPatient) {
      setAge(selectedPatient.age ? String(selectedPatient.age) : '');
      const patientSex = selectedPatient.sex ? selectedPatient.sex.toLowerCase() : '';
      setSex(patientSex);
      console.log('DifferentialDiagnosis - selectedPatient.sex:', selectedPatient.sex, 'local sex state:', patientSex);
    } else {
      setAge('');
      setSex('');
      console.log('DifferentialDiagnosis - No selected patient.');
    }
  }, [selectedPatient]);
  const [temperature, setTemperature] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [bloodPressure, setBloodPressure] = useState('');
  const [respiratoryRate, setRespiratoryRate] = useState('');
  const [oxygenSaturation, setOxygenSaturation] = useState('');
  const [physicalExam, setPhysicalExam] = useState([]);
  const [labs, setLabs] = useState([]);
  const [imaging, setImaging] = useState([]);
  const [medicalHistory, setMedicalHistory] = useState([]);
  const [diagnosisResults, setDiagnosisResults] = useState([]);
  const [references, setReferences] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState(null);
  const [aiResponse, setAiResponse] = useState('');

  const handleAddTag = (tag, setter) => {
    setter((prevTags) => [...prevTags, tag]);
  };

  const handleRemoveTag = (tag, setter) => {
    setter((prevTags) => prevTags.filter((t) => t !== tag));
  };

  const handleGenerateDiagnosis = async () => {
    if (symptoms.length === 0) {
      alert('Please add at least one symptom.');
      return;
    }

    setLoading(true);
    setSearched(true);
    setError(null);
    setDiagnosisResults([]);

    const userInput = `Symptoms: ${symptoms.join(', ')}. Age: ${age}. Sex: ${sex}. Vitals: T:${temperature}, HR:${heartRate}, BP:${bloodPressure}, RR:${respiratoryRate}, SpO2:${oxygenSaturation}. Physical Exam: ${physicalExam.join(', ')}. Labs: ${labs.join(', ')}. Imaging: ${imaging.join(', ')}. Medical History: ${medicalHistory.join(', ')}.`;

    try {
      const data = await apiClient.draftDDx(userInput, selectedPatient);
      if (data.ok) {
        setDiagnosisResults(data.structured?.differentials || []);
        setAiResponse(data.content);
        setReferences(data.references || []);
      } else {
        setError(data.content || 'An unexpected error occurred.');
      }
    } catch (err) {
      console.error('Error generating diagnosis:', err);
      setError('System encountered an issue. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="workspaces-container">
      <div className="page-header">
        <h1>Differential Diagnosis Assistant</h1>
        <p>Get a list of possible conditions based on your symptoms and patient context</p>
      </div>

      <div className="form-container">
        <div className="form-section">
          <GlobalPatientSelector />
        </div>
        <div className="form-section">
          <h2>Symptoms</h2>
          <TagInput
            label="Symptoms"
            placeholder="(e.g., fever, cough, chest pain) (Type and press enter)"
            tags={symptoms}
            onAddTag={(tag) => handleAddTag(tag, setSymptoms)}
            onRemoveTag={(tag) => handleRemoveTag(tag, setSymptoms)}
          />
        </div>
        <div className="form-section">
          <h2>Patient Demographics (Optional)</h2>
          <div className="form-group">
            <label htmlFor="age">Age</label>
            <input
              type="number"
              id="age"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="e.g., 45"
              min="0"
            />
          </div>
          <div className="form-group">
            <label htmlFor="sex">Sex</label>
            <CustomSelect
              options={sexOptions}
              value={sex}
              onChange={setSex}
              placeholder="Select"
            />
          </div>
        </div>
        <div className="form-section">
          <h2>Vitals (Optional)</h2>
          <div className="form-group">
            <label htmlFor="temperature">Temperature (°C)</label>
            <input
              type="number"
              id="temperature"
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
              placeholder="e.g., 37.0"
              step="0.1"
            />
          </div>
          <div className="form-group">
            <label htmlFor="heartRate">Heart Rate (bpm)</label>
            <input
              type="number"
              id="heartRate"
              value={heartRate}
              onChange={(e) => setHeartRate(e.target.value)}
              placeholder="e.g., 75"
              min="0"
            />
          </div>
          <div className="form-group">
            <label htmlFor="bloodPressure">Blood Pressure (mmHg)</label>
            <input
              type="text"
              id="bloodPressure"
              value={bloodPressure}
              onChange={(e) => setBloodPressure(e.target.value)}
              placeholder="e.g., 120/80"
            />
          </div>
          <div className="form-group">
            <label htmlFor="respiratoryRate">Respiratory Rate (breaths/min)</label>
            <input
              type="number"
              id="respiratoryRate"
              value={respiratoryRate}
              onChange={(e) => setRespiratoryRate(e.target.value)}
              placeholder="e.g., 16"
              min="0"
            />
          </div>
          <div className="form-group">
            <label htmlFor="oxygenSaturation">Oxygen Saturation (%)</label>
            <input
              type="number"
              id="oxygenSaturation"
              value={oxygenSaturation}
              onChange={(e) => setOxygenSaturation(e.target.value)}
              placeholder="e.g., 98"
              min="0"
              max="100"
            />
          </div>
        </div>
        <div className="form-section">
          <h2>Physical Exam Findings (Optional)</h2>
          <TagInput
            label="Physical Exam Findings"
            placeholder="Add a physical exam finding (e.g., crackles, murmur, rash) (Type and press enter)"
            tags={physicalExam}
            onAddTag={(tag) => handleAddTag(tag, setPhysicalExam)}
            onRemoveTag={(tag) => handleRemoveTag(tag, setPhysicalExam)}
          />
        </div>
        <div className="form-section">
          <h2>Lab Results (Optional)</h2>
          <TagInput
            label="Lab Results"
            placeholder="(e.g., elevated WBC, low hemoglobin) (Type and press enter)"
            tags={labs}
            onAddTag={(tag) => handleAddTag(tag, setLabs)}
            onRemoveTag={(tag) => handleRemoveTag(tag, setLabs)}
          />
        </div>
        <div className="form-section">
          <h2>Medical History (Optional)</h2>
          <TagInput
            label="Medical History"
            placeholder="(e.g., hypertension, diabetes) (Type and press enter)"
            tags={medicalHistory}
            onAddTag={(tag) => handleAddTag(tag, setMedicalHistory)}
            onRemoveTag={(tag) => handleRemoveTag(tag, setMedicalHistory)}
          />
        </div>
        <div className="form-section">
          <h2>Imaging Findings (Optional)</h2>
          <TagInput
            label="Imaging Findings"
            placeholder="(e.g., CXR consolidation, CT mass)"
            tags={imaging}
            onAddTag={(tag) => handleAddTag(tag, setImaging)}
            onRemoveTag={(tag) => handleRemoveTag(tag, setImaging)}
          />
        </div>
        <PrimaryActionButton
          label={loading ? 'Generating...' : 'Generate Differential Diagnosis'}
          onClick={handleGenerateDiagnosis}
          disabled={loading || symptoms.length === 0}
        />
      </div>

      {error && (
        <div className="error-message-container">
          <p className="error-message">{error}</p>
        </div>
      )}

      <div className="diagnosis-results-section">
        <h2>Differential Diagnosis Results</h2>
        {loading && <p>Generating diagnoses...</p>}
        {!loading && searched && diagnosisResults.length === 0 && !aiResponse && (
          <EmptyState message="No differential diagnoses found for the provided information." />
        )}
        {!loading && !searched && (
          <EmptyState message="Add symptoms to generate a differential diagnosis." />
        )}
        
        {!loading && aiResponse && (
          <div className="ai-response-markdown">
            <ResultCard 
              title="Clinical Reasoning Summary"
              content={<div className="markdown-content" dangerouslySetInnerHTML={{ __html: aiResponse }} />}
            />
          </div>
        )}

        {!loading && diagnosisResults.length > 0 && (
          <div className="diagnosis-list">
            {diagnosisResults.map((result, index) => (
              <ResultCard
                key={index}
                title={result.condition}
                severity={result.probability === 'High' ? 'high' : result.probability === 'Moderate' ? 'medium' : 'low'}
                content={
                  <>
                    <p><strong>Probability:</strong> {result.probability}</p>
                    <p><strong>Rationale:</strong> {result.rationale}</p>
                    <p><strong>Recommended Workup:</strong> {result.workup}</p>
                  </>
                }
              />
            ))}
          </div>
        )}

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

export default DifferentialDiagnosis;