import React, { useState, useEffect } from 'react';
import TagInput from '../components/shared/TagInput';
import CollapsibleSection from '../components/shared/CollapsibleSection';
import PrimaryActionButton from '../components/shared/PrimaryActionButton';
import ResultCard from '../components/shared/ResultCard';
import '../App.css';
import './ClinicalReasoning.css';
import CustomSelect from '../components/shared/CustomSelect';
import { usePatientContext } from '../context/PatientContext';
import GlobalPatientSelector from '../components/GlobalPatientSelector/GlobalPatientSelector';
import { apiClient } from '../services/apiClient';
import referencesIconLight from '../assets/images/references-icon-light.svg';
import referencesIconDark from '../assets/images/references-icon-dark.svg';
import { useTheme } from '../context/ThemeContext';

const clinicalScenarios = [
  {
    id: 'chest-pain-ischemic',
    label: 'Chest Pain – Ischemic Risk Assessment',
    chiefComplaint: 'Central chest pain radiating to left arm',
    medicalConditions: ['Hypertension'],
    medications: [],
    allergies: [],
    vitals: 'BP 148/92 mmHg, HR 96 bpm, SpO₂ 97%',
    labs: 'Troponin I 0.04 ng/mL',
    scores: 'HEART score 4 (moderate risk)',
    clinicalQuestion: 'What is the most likely diagnosis and immediate management strategy?',
  },
  {
    id: 'atrial-arrhythmia',
    label: 'Atrial Arrhythmia – Stroke Prevention Planning',
    chiefComplaint: 'Palpitations with irregular heartbeat',
    medicalConditions: ['Atrial fibrillation'],
    medications: ['Metoprolol'],
    allergies: [],
    vitals: 'HR 112 bpm (irregular), BP 138/84 mmHg',
    labs: 'Creatinine 1.2 mg/dL',
    scores: 'CHA₂DS₂-VASc score 3',
    clinicalQuestion: 'Is anticoagulation indicated and which option is safest for this patient?',
  },
  {
    id: 'worsening-heart-failure',
    label: 'Worsening Heart Failure Symptoms',
    chiefComplaint: 'Increasing shortness of breath and leg swelling',
    medicalConditions: ['Chronic heart failure'],
    medications: ['Furosemide'],
    allergies: [],
    vitals: 'BP 102/68 mmHg, HR 98 bpm, SpO₂ 92%',
    labs: 'BNP 780 pg/mL, Creatinine 1.6 mg/dL',
    scores: 'Not applicable for this scenario',
    clinicalQuestion: 'What is the optimal acute and long-term management plan?',
  },
  {
    id: 'acute-respiratory-exacerbation',
    label: 'Acute Respiratory Exacerbation',
    chiefComplaint: 'Worsening breathlessness with cough',
    medicalConditions: ['Chronic lung disease'],
    medications: [],
    allergies: [],
    vitals: 'RR 26/min, HR 104 bpm, SpO₂ 88% on room air',
    labs: 'ABG pH 7.31, PaCO₂ 55 mmHg',
    scores: 'Not applicable for this scenario',
    clinicalQuestion: 'What is the likely cause and appropriate escalation of care?',
  },
  {
    id: 'lower-respiratory-infection',
    label: 'Lower Respiratory Infection Assessment',
    chiefComplaint: 'Fever with productive cough',
    medicalConditions: ['Not applicable for this scenario'],
    medications: [],
    allergies: [],
    vitals: 'Temp 38.4°C, RR 24/min, SpO₂ 91%',
    labs: 'CRP 68 mg/L, WBC 13,200 /µL',
    scores: 'CURB-65 score 2',
    clinicalQuestion: 'Is inpatient treatment required and which antibiotics are appropriate?',
  },
  {
    id: 'new-onset-hyperglycemia',
    label: 'New-Onset Hyperglycemia',
    chiefComplaint: 'Fatigue, increased thirst and urination',
    medicalConditions: ['Newly diagnosed diabetes mellitus'],
    medications: [],
    allergies: [],
    vitals: 'BP 132/86 mmHg',
    labs: 'HbA1c 9.6%, Fasting glucose 210 mg/dL',
    scores: 'ASCVD risk 12%',
    clinicalQuestion: 'How should initial therapy be started and titrated?',
  },
  {
    id: 'suspected-infection-older-adult',
    label: 'Suspected Infection in Older Adult',
    chiefComplaint: 'Confusion and fever',
    medicalConditions: ['Hypertension', 'chronic kidney disease'],
    medications: [],
    allergies: [],
    vitals: 'Temp 38.6°C, BP 96/60 mmHg, HR 110 bpm',
    labs: 'WBC 14,500 /µL, Creatinine 2.0 mg/dL',
    scores: 'Not applicable for this scenario',
    clinicalQuestion: 'What is the likely source of infection and safest treatment approach?',
  },
  {
    id: 'polypharmacy-safety-review',
    label: 'Polypharmacy Safety Review',
    chiefComplaint: 'Dizziness and frequent falls',
    medicalConditions: ['Diabetes', 'hypertension'],
    medications: ['Metformin', 'insulin', 'amlodipine', 'clonazepam'],
    allergies: [],
    vitals: 'BP 110/70 mmHg, HR 72 bpm',
    labs: 'Sodium 130 mmol/L, Creatinine 1.5 mg/dL',
    scores: 'Not applicable for this scenario',
    clinicalQuestion: 'Are current medications contributing to risk and what adjustments are needed?',
  },
];

const ClinicalReasoning = ({ openConfirmationModal, isConfirmationModalOpen, patientToConfirmId, isConfirmingNewPatient, closeConfirmationModal, handleToggleSidebar, }) => {
  const { selectedPatient } = usePatientContext();

  const [age, setAge] = useState('');
  const [sex, setSex] = useState('');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [medicalConditions, setMedicalConditions] = useState([]);
  const [medications, setMedications] = useState([]);
  const [allergies, setAllergies] = useState([]);
  const [vitals, setVitals] = useState('');
  const [labs, setLabs] = useState('');
  const [scores, setScores] = useState('');
  const [clinicalQuestion, setClinicalQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState(null);
  const [references, setReferences] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { theme } = useTheme();
  const [error, setError] = useState(null);
  const [autoFilledFields, setAutoFilledFields] = useState({});
  const [selectedScenario, setSelectedScenario] = useState(null);

  useEffect(() => {
    if (selectedPatient) {
      setAge(selectedPatient.age || '');
      const patientSex = selectedPatient.sex ? selectedPatient.sex.toLowerCase() : '';
      setSex(patientSex);
      console.log('ClinicalReasoning - selectedPatient.sex:', selectedPatient.sex, 'local sex state:', patientSex);
      setMedicalConditions(selectedPatient.chronicConditions ? selectedPatient.chronicConditions.map(c => c.name) : []);
      setMedications(selectedPatient.longTermMedications ? selectedPatient.longTermMedications.map(m => m.name) : []);
      setAllergies(selectedPatient.allergies ? selectedPatient.allergies.map(a => a.substance) : []);
    }
  }, [selectedPatient]);


  const sexOptions = [
  { value: '', label: 'Select' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  ];


  const handleAddTag = (tag, setter) => {
    setter((prevTags) => [...prevTags, tag]);
  };

  const handleRemoveTag = (tag, setter) => {
    setter((prevTags) => prevTags.filter((t) => t !== tag));
  };

  const handleScenarioSelect = (scenario) => {
    setSelectedScenario(scenario.id);
    setChiefComplaint(scenario.chiefComplaint);
    setMedicalConditions(scenario.medicalConditions.filter(mc => mc !== 'Not applicable for this scenario'));
    setMedications(scenario.medications);
    setClinicalQuestion(scenario.clinicalQuestion);
    setVitals(scenario.vitals === 'Not applicable for this scenario' ? '' : scenario.vitals);
    setLabs(scenario.labs === 'Not applicable for this scenario' ? '' : scenario.labs);
    setScores(scenario.scores === 'Not applicable for this scenario' ? '' : scenario.scores);

    setAutoFilledFields({
      chiefComplaint: !!scenario.chiefComplaint,
      medicalConditions: scenario.medicalConditions.length > 0 && scenario.medicalConditions[0] !== 'Not applicable for this scenario',
      medications: scenario.medications.length > 0,
      allergies: scenario.allergies.length > 0,
      clinicalQuestion: !!scenario.clinicalQuestion,
      vitals: scenario.vitals !== 'Not applicable for this scenario',
      labs: scenario.labs !== 'Not applicable for this scenario',
      scores: scenario.scores !== 'Not applicable for this scenario',
    });
  };

  const handleResetTemplate = () => {
    setSelectedScenario(null);
    setChiefComplaint('');
    setMedicalConditions([]);
    setMedications([]);
    setAllergies([]);
    setVitals('');
    setLabs('');
    setScores('');
    setClinicalQuestion('');
    setAutoFilledFields({});
  };

  const handleGenerateAssessment = async () => {
    setIsLoading(true);
    setError(null);

    const payload = {
      userInput: clinicalQuestion,
      patientContext: apiClient.formatPatientContext(selectedPatient),
      clinicalData: {
        age,
        sex,
        chiefComplaint,
        medicalConditions,
        medications,
        allergies,
        vitals,
        labs,
        scores
      }
    };

    try {
      const data = await apiClient.generateClinicalReasoning(payload);
      if (data.ok) {
        setAiResponse(data.content);
        setReferences(data.references || []);
      } else {
        setError(data.content || 'An unexpected error occurred.');
      }
    } catch (err) {
      console.error('Error generating assessment:', err);
      setError('System encountered an issue. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="workspaces-container">
      <div className="page-header">
        <h1>Clinical Reasoning</h1>
        <p>Get structured assessment and treatment plans based on patient context</p>
      </div>


      <div className="form-container">
        <div className="form-section">
          <GlobalPatientSelector
          isConfirmationModalOpen={isConfirmationModalOpen}
          patientToConfirmId={patientToConfirmId}
          isConfirmingNewPatient={isConfirmingNewPatient}
          openConfirmationModal={openConfirmationModal}
          closeConfirmationModal={closeConfirmationModal}
        />
        </div>
        <div className="form-section quick-start-scenarios">
          <h2>Quick Start Clinical Scenarios</h2>
          <p className="scenario-subtitle">
            Choose a clinical scenario to auto-fill common fields and accelerate clinical reasoning.
          </p>
          <div className="scenario-cards">
            {clinicalScenarios.map((scenario) => (
                <div
                  key={scenario.id}
                  className={`scenario-card ${selectedScenario === scenario.id ? 'selected' : ''}`}
                  onClick={() => handleScenarioSelect(scenario)}
                >
                  {scenario.label}
                </div>
              ))}
          </div>
            <button type="button" onClick={handleResetTemplate} className="reset-scenario-button">
              Reset Scenario
            </button>
        </div>

        <div className="form-section">
          <h2>Patient Demographics</h2>
          <div className="two-column">
            <div className="form-group">
              <label htmlFor="age">Age</label>
              <input
                type="number"
                id="age"
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                placeholder="Enter age"
              />
            </div>
            <div className="form-group">
              <span id="sex-label" className="input-label">Sex</span>
              <CustomSelect
                aria-labelledby="sex-label"
                options={sexOptions}
                value={sex}
                onChange={setSex}
                placeholder="Select"
              />
            </div>
          </div>
        </div>
        <div className="form-section">
          <h2>Clinical Context</h2>
          <div className="form-group">
            <label htmlFor="chief-complaint">Chief Complaint</label>
            <input
              type="text"
              id="chief-complaint"
              value={chiefComplaint}
              onChange={(e) => setChiefComplaint(e.target.value)}
              placeholder="e.g., Chest pain, shortness of breath"
              className={autoFilledFields.chiefComplaint ? 'auto-filled' : ''}
            />
          </div>
          <TagInput
            label="Medical Conditions"
            placeholder="(e.g., Hypertension, Diabetes, Asthma) (Type and press enter)"
            tags={medicalConditions}
            onAddTag={(tag) => handleAddTag(tag, setMedicalConditions)}
            onRemoveTag={(tag) => handleRemoveTag(tag, setMedicalConditions)}
            className={autoFilledFields.medicalConditions ? 'auto-filled' : ''}
          />
          <TagInput
            label="Medications"
            placeholder="(e.g., Aspirin, Insulin, Metformin) (Type and press enter)"
            tags={medications}
            onAddTag={(tag) => handleAddTag(tag, setMedications)}
            onRemoveTag={(tag) => handleRemoveTag(tag, setMedications)}
            className={autoFilledFields.medications ? 'auto-filled' : ''}
          />
          <TagInput
            label="Allergies"
            placeholder="(e.g., Shellfish, Eggs, Milk) (Type and press enter)"
            tags={allergies}
            onAddTag={(tag) => handleAddTag(tag, setAllergies)}
            onRemoveTag={(tag) => handleRemoveTag(tag, setAllergies)}
            className={autoFilledFields.allergies ? 'auto-filled' : ''}
          />

        </div>
        <CollapsibleSection title={<span>Advanced Section <span className="collapsible-caption">Optional • Enhances reasoning accuracy</span></span>}>
          <div className="advanced-content">
              <div className="tag-input-container">
                <div className="advanced-section-title form-group" style={{ marginBottom: '0px' }}>
                  <h3 id="vitals-header">Vitals</h3>
                  <p className="helper-text">Recent vital signs influencing clinical risk assessment</p>
                </div>
                <input
                  id="vitals-input"
                  aria-labelledby="vitals-header"
                  type="text"
                  placeholder="e.g., BP 148/92 mmHg, HR 92 bpm, SpO₂ 97%"
                  value={vitals}
                  onChange={(e) => setVitals(e.target.value)}
                  className={autoFilledFields.vitals ? 'auto-filled' : ''}
                />
              </div>

              <div className="tag-input-container">
                <div className="advanced-section-title form-group" style={{ marginBottom: '0px' }}>
                  <h3 id="labs-header">Labs</h3>
                  <p className="helper-text">Key laboratory values relevant to the current presentation</p>
                </div>
                <input
                  id="labs-input"
                  aria-labelledby="labs-header"
                  type="text"
                  placeholder="e.g., Troponin I 0.02 ng/mL, Creatinine 1.1 mg/dL"
                  value={labs}
                  onChange={(e) => setLabs(e.target.value)}
                  className={autoFilledFields.labs ? 'auto-filled' : ''}
                />
              </div>


              <div className="tag-input-container">
                <div className="advanced-section-title form-group" style={{ marginBottom: '0px' }}>
                  <h3 id="scores-header">Scores</h3>
                  <p className="helper-text">Clinical risk scores used in diagnostic or treatment decisions</p>
                </div>
                <input
                  id="scores-input"
                  aria-labelledby="scores-header"
                  type="text"
                  placeholder="e.g., HEART score 4 (moderate risk), ASCVD 18%"
                  value={scores}
                  onChange={(e) => setScores(e.target.value)}
                  className={autoFilledFields.scores ? 'auto-filled' : ''}
                />
              </div>

          </div>
        </CollapsibleSection>
        <div className="form-section">
          <h2 id="clinical-question-header">Clinical Question</h2>
          <div className="form-group">
            <textarea
              aria-labelledby="clinical-question-header"
              id="clinical-question"
              value={clinicalQuestion}
              onChange={(e) => setClinicalQuestion(e.target.value)}
              placeholder="e.g., What is the most likely diagnosis given these symptoms?"
              rows={4}
              className={autoFilledFields.clinicalQuestion ? 'auto-filled' : ''}
            ></textarea>
          </div>
          <div className="clinical-reasoning-actions">
            {error && (
              <div className="error-message-container">
                <p className="error-message">{error}</p>
                <button 
                  className="retry-button" 
                  onClick={handleGenerateAssessment}
                >
                  Retry
                </button>
              </div>
            )}
            <PrimaryActionButton
              onClick={handleGenerateAssessment}
              isLoading={isLoading}
              label="Generate Assessment"
            />
          </div>
        </div>
      </div>

      {aiResponse && (
        <div className="ai-response-section">
          <div className="result-card-container">
            <h2>AI Generated Assessment and Plan</h2>
            
            {typeof aiResponse === 'string' ? (
              <ResultCard 
                content={<div className="markdown-content" dangerouslySetInnerHTML={{ __html: aiResponse }} />} 
              />
            ) : (
              <>
                <ResultCard title="Assessment" content={<p>{aiResponse.assessment}</p>} />
                <ResultCard
                  title="Diagnosis"
                  severity={aiResponse.diagnosis?.severity}
                  redFlag={aiResponse.diagnosis?.redFlag}
                  content={
                    <>
                      <p><strong>Main Diagnosis:</strong> {aiResponse.diagnosis?.main}</p>
                      {aiResponse.diagnosis?.differential && aiResponse.diagnosis.differential.length > 0 && (
                        <>
                          <p><strong>Differential Diagnoses:</strong></p>
                          <ul>
                            {aiResponse.diagnosis.differential.map((item, index) => (
                              <li key={index}>{item}</li>
                            ))}
                          </ul>
                        </>
                      )}
                    </>
                  }
                />
                <ResultCard title="Plan" content={<div dangerouslySetInnerHTML={{ __html: aiResponse.plan }} />} />
                <ResultCard title="Treatment" content={<div dangerouslySetInnerHTML={{ __html: aiResponse.treatment }} />} />
                <ResultCard title="Evidence Summary" content={<p>{aiResponse.evidenceSummary}</p>} />
                <ResultCard title="ICD-10 Codes" content={<p>{aiResponse.icd10Codes?.join(', ')}</p>} />
              </>
            )}
            
            {references && references.length > 0 && (
              <div className="citations-section">
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

            <PrimaryActionButton label="Regenerate Assessment" onClick={handleGenerateAssessment} disabled={isLoading} />
          </div>
        </div>
      )}
    </div>
  );
};


export default ClinicalReasoning;