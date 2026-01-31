import React, { useState, useEffect } from 'react';
import { usePatientContext } from '../context/PatientContext';
import TagInput from '../components/shared/TagInput';
import PrimaryActionButton from '../components/shared/PrimaryActionButton';
import ResultCard from '../components/shared/ResultCard';
import EmptyState from '../components/shared/EmptyState';
import CustomSelect from '../components/shared/CustomSelect';
import './DifferentialDiagnosis.css';
import GlobalPatientSelector from '../components/GlobalPatientSelector/GlobalPatientSelector';

const sexOptions = [
  { value: '', label: 'Select' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

const DifferentialDiagnosis = ({ openConfirmationModal, isPatientContextActiveInSession, isConfirmationModalOpen, patientToConfirmId, isConfirmingNewPatient, closeConfirmationModal, activatePatientContextInSession, deactivatePatientContextInSession, handleToggleSidebar, }) => {
  const { selectedPatient } = usePatientContext();

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
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleAddTag = (tag, setter) => {
    setter((prevTags) => [...prevTags, tag]);
  };

  const handleRemoveTag = (tag, setter) => {
    setter((prevTags) => prevTags.filter((t) => t !== tag));
  };

  const handleGenerateDiagnosis = () => {
    setLoading(true);
    setSearched(true);
    setDiagnosisResults([]); // Clear previous results

    // Simulate API call for differential diagnosis
    setTimeout(() => {
      console.log('Symptoms:', symptoms);
      console.log('Age:', age);
      console.log('Sex:', sex);
      console.log('Temperature:', temperature);
      console.log('Heart Rate:', heartRate);
      console.log('Blood Pressure:', bloodPressure);
      console.log('Respiratory Rate:', respiratoryRate);
      console.log('Oxygen Saturation:', oxygenSaturation);
      console.log('Physical Exam:', physicalExam);
      console.log('Labs:', labs);
      console.log('Imaging:', imaging);
      console.log('Medical History:', medicalHistory);

      const mockResults = [];

      if (symptoms.includes('chest pain') && symptoms.includes('shortness of breath')) {
        mockResults.push({
          condition: 'Myocardial Infarction',
          probability: 'High',
          description: 'Acute chest pain radiating to the left arm, often accompanied by shortness of breath.',
          management: 'Immediate medical attention, ECG, cardiac enzymes, aspirin, nitrates.',
        });
        mockResults.push({
          condition: 'Pulmonary Embolism',
          probability: 'Medium',
          description: 'Sudden onset of shortness of breath and pleuritic chest pain, often with risk factors for DVT.',
          management: 'Anticoagulation, oxygen, thrombolysis in severe cases.',
        });
      } else if (symptoms.includes('fever') && symptoms.includes('cough')) {
        mockResults.push({
          condition: 'Pneumonia',
          probability: 'High',
          description: 'Fever, cough with sputum, and difficulty breathing. Often associated with lung crackles.',
          management: 'Antibiotics, supportive care, oxygen if needed.',
        });
        mockResults.push({
          condition: 'Bronchitis',
          probability: 'Medium',
          description: 'Persistent cough, often with sputum, and sometimes fever. Usually viral.',
          management: 'Symptomatic treatment, rest, fluids.',
        });
      } else if (symptoms.length > 0) {
        mockResults.push({
          condition: 'General Illness',
          probability: 'Low',
          description: 'Non-specific symptoms, further investigation may be required.',
          management: 'Symptomatic relief, monitor for worsening symptoms.',
        });
      }

      setDiagnosisResults(mockResults);
      setLoading(false);
    }, 2000);
  };

  return (
    <div className="differential-diagnosis-container">
      <div className="page-header">
        <h1>Differential Diagnosis Assistant</h1>
        <p>Get a list of possible conditions based on your symptoms and patient context</p>
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
        <div className="form-section">
          <h2>Symptoms</h2>
          <TagInput
            label="Symptoms"
            placeholder="Add a symptom (e.g., fever, cough, chest pain)"
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
            placeholder="Add a physical exam finding (e.g., crackles, murmur, rash)"
            tags={physicalExam}
            onAddTag={(tag) => handleAddTag(tag, setPhysicalExam)}
            onRemoveTag={(tag) => handleRemoveTag(tag, setPhysicalExam)}
          />
        </div>
        <div className="form-section">
          <h2>Lab Results (Optional)</h2>
          <TagInput
            label="Lab Results"
            placeholder="Add a lab result (e.g., elevated WBC, low hemoglobin)"
            tags={labs}
            onAddTag={(tag) => handleAddTag(tag, setLabs)}
            onRemoveTag={(tag) => handleRemoveTag(tag, setLabs)}
          />
        </div>
        <div className="form-section">
          <h2>Medical History (Optional)</h2>
          <TagInput
            label="Medical History"
            placeholder="Add relevant medical history (e.g., hypertension, diabetes)"
            tags={medicalHistory}
            onAddTag={(tag) => handleAddTag(tag, setMedicalHistory)}
            onRemoveTag={(tag) => handleRemoveTag(tag, setMedicalHistory)}
          />
        </div>
        <div className="form-section">
          <h2>Imaging Findings (Optional)</h2>
          <TagInput
            label="Imaging Findings"
            placeholder="Add an imaging finding (e.g., CXR consolidation, CT mass)"
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

      <div className="diagnosis-results-section">
        <h2>Differential Diagnosis Results</h2>
        {loading && <p>Generating diagnoses...</p>}
        {!loading && searched && diagnosisResults.length === 0 && (
          <EmptyState message="No differential diagnoses found for the provided information." />
        )}
        {!loading && !searched && (
          <EmptyState message="Add symptoms to generate a differential diagnosis." />
        )}
        {!loading && diagnosisResults.length > 0 && (
          <div className="diagnosis-list">
            {diagnosisResults.map((result, index) => (
              <ResultCard
                key={index}
                title={result.condition}
                severity={result.probability === 'High' ? 'high' : result.probability === 'Medium' ? 'medium' : 'low'}
                content={
                  <>
                    <p><strong>Probability:</strong> {result.probability}</p>
                    <p><strong>Description:</strong> {result.description}</p>
                    <p><strong>Management:</strong> {result.management}</p>
                  </>
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DifferentialDiagnosis;