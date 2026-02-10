import React, { useState, useEffect } from 'react';
import { usePatientContext } from '../context/PatientContext';
import TagInput from '../components/shared/TagInput';
import PrimaryActionButton from '../components/shared/PrimaryActionButton';
import ResultCard from '../components/shared/ResultCard';
import EmptyState from '../components/shared/EmptyState';
import './DrugSafety.css';
import GlobalPatientSelector from '../components/GlobalPatientSelector/GlobalPatientSelector';

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

  const [medications, setMedications] = useState([]);
  const [patientConditions, setPatientConditions] = useState([]);
  const [allergies, setAllergies] = useState([]);
  const [interactionResults, setInteractionResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedPatient) {
      setPatientConditions(selectedPatient.chronicConditions ? selectedPatient.chronicConditions.map(condition => condition.name) : []);
      setAllergies(selectedPatient.allergies ? selectedPatient.allergies.map(allergy => allergy.name) : []);
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

  const handleCheckDrugSafety = () => {
    setLoading(true);
    setInteractionResults([]); // Clear previous results

    // Simulate API call for drug interaction check
    setTimeout(() => {
      const mockResults = [];

      if (medications.includes('Warfarin') && medications.includes('Aspirin')) {
        mockResults.push({
          medications: 'Warfarin + Aspirin',
          severity: 'high',
          description: 'Increased risk of bleeding.',
          recommendation: 'Avoid concomitant use or monitor INR closely.',
        });
      }

      if (medications.includes('Metformin') && patientConditions.includes('Renal Impairment')) {
        mockResults.push({
          medications: 'Metformin + Renal Impairment',
          severity: 'medium',
          description: 'Increased risk of lactic acidosis.',
          recommendation: 'Adjust Metformin dose or consider alternative in severe cases.',
        });
      }

      if (medications.includes('Penicillin') && allergies.includes('Penicillin')) {
        mockResults.push({
          medications: 'Penicillin + Penicillin Allergy',
          severity: 'high',
          description: 'Severe allergic reaction (anaphylaxis) possible.',
          recommendation: 'Absolutely contraindicated. Use alternative antibiotic.',
        });
      }

      if (mockResults.length === 0 && medications.length > 0) {
        mockResults.push({
          medications: 'No significant interactions found',
          severity: 'low',
          description: 'Based on the provided inputs, no significant drug-drug or drug-condition interactions were identified.',
          recommendation: 'Continue to monitor patient and review full medication history.',
        });
      }

      setInteractionResults(mockResults);
      setLoading(false);
    }, 2000);
  };


  return (
    <div className="drug-safety-container">
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
            label="Medications"
            placeholder="Add a medication (e.g., Warfarin, Metformin)"
            tags={medications}
            onAddTag={(tag) => handleAddTag(tag, setMedications)}
            onRemoveTag={(tag) => handleRemoveTag(tag, setMedications)}
          />
        </div>
        <div className="form-section">
          <h2>Patient Conditions (Optional)</h2>
          <TagInput
            label="Conditions"
            placeholder="Add a patient condition (e.g., Renal Impairment)"
            tags={patientConditions}
            onAddTag={(tag) => handleAddTag(tag, setPatientConditions)}
            onRemoveTag={(tag) => handleRemoveTag(tag, setPatientConditions)}
          />
        </div>
        <div className="form-section">
          <h2>Allergies (Optional)</h2>
          <TagInput
            label="Allergies"
            placeholder="Add an allergy (e.g., Penicillin)"
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

      <div className="interaction-results-section">
        <h2>Interaction Results</h2>
        {loading && <p>Checking for interactions...</p>}
        {!loading && interactionResults.length === 0 && medications.length > 0 && (
          <EmptyState message="No significant interactions found for the provided medications." />
        )}
        {!loading && interactionResults.length === 0 && medications.length === 0 && (
          <EmptyState message="Add medications to check for interactions." />
        )}
        {!loading && interactionResults.map((result, index) => (
          <ResultCard
            key={index}
            title={result.medications}
            severity={result.severity}
            content={
              <>
                <p><strong>Severity:</strong> {result.severity.charAt(0).toUpperCase() + result.severity.slice(1)}</p>
                <p><strong>Description:</strong> {result.description}</p>
                <p><strong>Recommendation:</strong> {result.recommendation}</p>
              </>
            }
          />
        ))}
      </div>
    </div>
  );
};

export default DrugSafety;