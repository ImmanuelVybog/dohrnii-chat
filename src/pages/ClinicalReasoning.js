import React, { useState, useEffect } from 'react';
import TagInput from '../components/shared/TagInput';
import CollapsibleSection from '../components/shared/CollapsibleSection';
import PrimaryActionButton from '../components/shared/PrimaryActionButton';
import ResultCard from '../components/shared/ResultCard';
import './ClinicalReasoning.css';
import CustomSelect from '../components/shared/CustomSelect';
import { usePatientContext } from '../context/PatientContext';
import GlobalPatientSelector from '../components/GlobalPatientSelector/GlobalPatientSelector';

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

const ClinicalReasoning = ({ openConfirmationModal, isPatientContextActiveInSession, isConfirmationModalOpen, patientToConfirmId, isConfirmingNewPatient, closeConfirmationModal, activatePatientContextInSession, deactivatePatientContextInSession, handleToggleSidebar, }) => {
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
  const [isLoading, setIsLoading] = useState(false);
  const [autoFilledFields, setAutoFilledFields] = useState({});
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [usePatientContextToggle, setUsePatientContextToggle] = useState(true);

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

  // Function to construct patient context string
  const buildPatientContext = (patient) => {
    if (!patient) return '';

    let context = `Patient Information:\n`;
    context += `Full Name: ${patient.fullName}\n`;
    context += `Age: ${patient.age}\n`;
    context += `Sex: ${patient.sex}\n`;
    if (patient.chronicConditions && patient.chronicConditions.length > 0) {
      context += `Chronic Conditions: ${patient.chronicConditions.map(c => c.name).join(', ')}\n`;
    }
    if (patient.longTermMedications && patient.longTermMedications.length > 0) {
      context += `Long-Term Medications: ${patient.longTermMedications.map(m => `${m.name} (${m.dose})`).join(', ')}\n`;
    }
    if (patient.allergies && patient.allergies.length > 0) {
      context += `Allergies: ${patient.allergies.map(a => a.substance).join(', ')}\n`;
    }
    if (patient.manualTextContext) {
      context += `Manual Text Context: ${patient.manualTextContext}\n`;
    }
    if (patient.uploadedFiles && patient.uploadedFiles.length > 0) {
      context += `Uploaded File Context:\n`;
      patient.uploadedFiles.forEach(file => {
        context += `  - File: ${file.name} (${file.type})\n`;
        if (file.extractedText) {
          context += `    Extracted Text: ${file.extractedText.substring(0, 200)}...\n`; // Limit text for prompt
        }
      });
    }
    context += `\n`;
    return context;
  };

  const handleGenerateAssessment = () => {
    setIsLoading(true);

    let prompt = '';
    if (selectedPatient) {
      prompt += buildPatientContext(selectedPatient);
    }

    prompt += `Clinical Scenario:\n`;
    if (age) prompt += `Age: ${age}\n`;
    if (sex) prompt += `Sex: ${sex}\n`;
    if (chiefComplaint) prompt += `Chief Complaint: ${chiefComplaint}\n`;
    if (medicalConditions.length > 0) prompt += `Medical Conditions: ${medicalConditions.join(', ')}\n`;
    if (medications.length > 0) prompt += `Medications: ${medications.join(', ')}\n`;
    if (allergies.length > 0) prompt += `Allergies: ${allergies.join(', ')}\n`;
    if (vitals) prompt += `Vitals: ${vitals}\n`;
    if (labs) prompt += `Labs: ${labs}\n`;
    if (scores) prompt += `Scores: ${scores}\n`;
    if (clinicalQuestion) prompt += `Clinical Question: ${clinicalQuestion}\n`;

    console.log("AI Prompt:", prompt);

    // Simulate API call
    setTimeout(() => {
      setAiResponse({
        assessment: `Based on the provided clinical context, the patient presents with a chief complaint of ${chiefComplaint}.
        Considering these details, and given the age (${age} years) and chief complaint, a preliminary assessment suggests a broad differential, including cardiac, pulmonary, and gastrointestinal etiologies.
        Relevant medical history includes: ${medicalConditions.join(', ')}.
        Current medications: ${medications.join(', ')}.
        Known allergies: ${allergies.join(', ')}.
        The clinical question posed was: "${clinicalQuestion}".
        Further investigation is warranted to narrow down the diagnosis.`,
        diagnosis: {
          main: 'Atypical Chest Pain, likely Cardiac Ischemia',
          differential: [
            'Gastroesophageal Reflux Disease (GERD)',
            'Musculoskeletal Chest Pain',
            'Anxiety/Panic Disorder',
            'Pneumonia'
          ],
          severity: 'high',
          redFlag: true
        },
        plan: `<strong>1. Immediate Investigations:</strong>
           - Electrocardiogram (ECG) to assess for acute ischemic changes.
           - Cardiac biomarkers (Troponin I/T) to rule out myocardial injury.
           - Chest X-ray to evaluate for pulmonary pathology (e.g., pneumonia, pneumothorax).
           - Basic metabolic panel (BMP) and complete blood count (CBC).
           <br/>
        <strong>2. Management:</strong>
           - Oxygen supplementation if SpO₂ < 94%.
           - Intravenous access and cardiac monitoring.
           - Pain control with nitrates (if no contraindications) or analgesics.
           <br/>
        <strong>3. Consultations:</strong>
           - Cardiology consult for further evaluation and management of suspected cardiac ischemia.
           - Gastroenterology consult if GERD is highly suspected after cardiac workup.
           <br/>
        <strong>4. Follow-up:</strong>
           - Close monitoring of vital signs and symptoms.
           - Re-evaluation of clinical status after initial interventions.`,
        treatment: `Initial treatment focuses on stabilizing the patient and ruling out life-threatening conditions.
        If cardiac ischemia is confirmed, management will include antiplatelet therapy (e.g., Aspirin), anticoagulation, beta-blockers, and statins, as per guideline recommendations.
        For GERD, proton pump inhibitors (PPIs) would be initiated.
        Musculoskeletal pain would be managed with NSAIDs and physical therapy.`,
        evidenceSummary: `Evidence suggests that atypical presentations of cardiac events are common in older adults and women. Early and comprehensive cardiac workup is crucial to prevent adverse outcomes. Differential diagnoses should always be considered, and a systematic approach to investigation and management is recommended.`,
        icd10Codes: ['I20.9', 'R07.4', 'K21.9'],
      });
      setIsLoading(false);
    }, 2000);
  };

  return (
    <div className="clinical-reasoning-container">
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
          isPatientContextActiveInSession={isPatientContextActiveInSession}
          activatePatientContextInSession={activatePatientContextInSession}
          deactivatePatientContextInSession={deactivatePatientContextInSession}
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
              <label htmlFor="sex">Sex</label>
              <CustomSelect
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
            placeholder="Add a medical condition"
            tags={medicalConditions}
            onAddTag={(tag) => handleAddTag(tag, setMedicalConditions)}
            onRemoveTag={(tag) => handleRemoveTag(tag, setMedicalConditions)}
            className={autoFilledFields.medicalConditions ? 'auto-filled' : ''}
          />
          <TagInput
            label="Medications"
            placeholder="Add a medication"
            tags={medications}
            onAddTag={(tag) => handleAddTag(tag, setMedications)}
            onRemoveTag={(tag) => handleRemoveTag(tag, setMedications)}
            className={autoFilledFields.medications ? 'auto-filled' : ''}
          />
          <TagInput
            label="Allergies"
            placeholder="Add an allergy"
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
                  <h3>Vitals</h3>
                  <p className="helper-text">Recent vital signs influencing clinical risk assessment</p>
                </div>
                <input
                  type="text"
                  placeholder="e.g., BP 148/92 mmHg, HR 92 bpm, SpO₂ 97%"
                  value={vitals}
                  onChange={(e) => setVitals(e.target.value)}
                  className={autoFilledFields.vitals ? 'auto-filled' : ''}
                />
              </div>

              <div className="tag-input-container">
                <div className="advanced-section-title form-group" style={{ marginBottom: '0px' }}>
                  <h3>Labs</h3>
                  <p className="helper-text">Key laboratory values relevant to the current presentation</p>
                </div>
                <input
                  type="text"
                  placeholder="e.g., Troponin I 0.02 ng/mL, Creatinine 1.1 mg/dL"
                  value={labs}
                  onChange={(e) => setLabs(e.target.value)}
                  className={autoFilledFields.labs ? 'auto-filled' : ''}
                />
              </div>


              <div className="tag-input-container">
                <div className="advanced-section-title form-group" style={{ marginBottom: '0px' }}>
                  <h3>Scores</h3>
                  <p className="helper-text">Clinical risk scores used in diagnostic or treatment decisions</p>
                </div>
                <input
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
          <h2>Clinical Question</h2>
          <div className="form-group">
            <textarea
              id="clinical-question"
              value={clinicalQuestion}
              onChange={(e) => setClinicalQuestion(e.target.value)}
              placeholder="e.g., What is the most likely diagnosis given these symptoms?"
              rows={4}
              className={autoFilledFields.clinicalQuestion ? 'auto-filled' : ''}
            ></textarea>
          </div>
          <div className="clinical-reasoning-actions">
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
            <ResultCard title="Assessment" content={<p>{aiResponse.assessment}</p>} />
            <ResultCard
              title="Diagnosis"
              severity={aiResponse.diagnosis.severity}
              redFlag={aiResponse.diagnosis.redFlag}
              content={
                <>
                  <p><strong>Main Diagnosis:</strong> {aiResponse.diagnosis.main}</p>
                  {aiResponse.diagnosis.differential && aiResponse.diagnosis.differential.length > 0 && (
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
            <ResultCard title="ICD-10 Codes" content={<p>{aiResponse.icd10Codes.join(', ')}</p>} />
            <PrimaryActionButton label="Regenerate Assessment" onClick={handleGenerateAssessment} disabled={isLoading} />
          </div>
        </div>
      )}
    </div>
  );
};


export default ClinicalReasoning;