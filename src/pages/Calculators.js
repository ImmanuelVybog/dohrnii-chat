import React, { useState, useMemo, useEffect } from 'react';
import { usePatientContext } from '../context/PatientContext';
import PrimaryActionButton from '../components/shared/PrimaryActionButton';
import ResultCard from '../components/shared/ResultCard';
import CollapsibleSection from '../components/shared/CollapsibleSection';
import CustomSelect from '../components/shared/CustomSelect';
import './Calculators.css';
import GlobalPatientSelector from '../components/GlobalPatientSelector/GlobalPatientSelector';
import referencesIconLight from '../assets/images/references-icon-light.svg';
import referencesIconDark from '../assets/images/references-icon-dark.svg';
import { useTheme } from '../context/ThemeContext';
import { apiClient } from '../services/apiClient';

const calculators = [
  // Emergency / Cardiology
  {
    id: 'heart_score',
    name: 'HEART Score',
    description: 'Chest pain risk stratification',
    category: 'Emergency / Cardiology',
    inputs: [
      { id: 'history', label: 'History', type: 'select', options: [{ value: '0', label: 'Slightly suspicious (0)' }, { value: '1', label: 'Moderately suspicious (1)' }, { value: '2', label: 'Highly suspicious (2)' }] },
      { id: 'ecg', label: 'ECG', type: 'select', options: [{ value: '0', label: 'Normal (0)' }, { value: '1', label: 'Non-specific repolarization disturbance (1)' }, { value: '2', label: 'Significant ST-depression (2)' }] },
      { id: 'age', label: 'Age', type: 'select', options: [{ value: '0', label: '< 45 years (0)' }, { value: '1', label: '45-64 years (1)' }, { value: '2', label: '>= 65 years (2)' }] },
      { id: 'risk_factors', label: 'Risk Factors', type: 'select', options: [{ value: '0', label: 'No known risk factors (0)' }, { value: '1', label: '1-2 risk factors (1)' }, { value: '2', label: '>= 3 risk factors (2)' }] },
      { id: 'troponin', label: 'Initial Troponin', type: 'select', options: [{ value: '0', label: '<= Normal limit (0)' }, { value: '1', label: '1-3x normal limit (1)' }, { value: '2', label: '> 3x normal limit (2)' }] },
    ]
  },
  {
    id: 'timi_score',
    name: 'TIMI Score',
    description: 'ACS risk stratification',
    category: 'Emergency / Cardiology',
    inputs: [
      { id: 'age65', label: 'Age >= 65', type: 'select', options: [{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }] },
      { id: 'riskFactors3', label: '>= 3 Risk Factors for CAD', type: 'select', options: [{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }] },
      { id: 'knownCAD', label: 'Known CAD (stenosis >= 50%)', type: 'select', options: [{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }] },
      { id: 'asaUse', label: 'ASA use in past 7 days', type: 'select', options: [{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }] },
      { id: 'severeAngina', label: 'Severe angina (>= 2 episodes in 24h)', type: 'select', options: [{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }] },
      { id: 'stChanges', label: 'ST changes >= 0.5mm', type: 'select', options: [{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }] },
      { id: 'elevatedMarkers', label: 'Elevated cardiac markers', type: 'select', options: [{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }] },
    ]
  },
  {
    id: 'wells_pe',
    name: 'Wells Score',
    description: 'PE/DVT probability',
    category: 'Emergency / Cardiology',
    inputs: [
      { id: 'dvt_signs', label: 'Clinical signs of DVT', type: 'select', options: [{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }] },
      { id: 'alt_dx', label: 'PE is #1 dx or equally likely', type: 'select', options: [{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }] },
      { id: 'tachycardia', label: 'Heart rate > 100', type: 'select', options: [{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }] },
      { id: 'immobility', label: 'Immobilization/surgery in past 4 weeks', type: 'select', options: [{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }] },
      { id: 'prior_pe_dvt', label: 'Prior PE or DVT', type: 'select', options: [{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }] },
      { id: 'hemoptysis', label: 'Hemoptysis', type: 'select', options: [{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }] },
      { id: 'malignancy', label: 'Malignancy', type: 'select', options: [{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }] },
    ]
  },
  {
    id: 'chads_vasc',
    name: 'CHA₂DS₂-VASc',
    description: 'Stroke risk in AFib',
    category: 'Emergency / Cardiology',
    inputs: [
      { id: 'age', label: 'Age', type: 'number', min: 0 },
      { id: 'sex', label: 'Sex', type: 'select', options: [{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }] },
      { id: 'chf', label: 'CHF history', type: 'select', options: [{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }] },
      { id: 'htn', label: 'Hypertension history', type: 'select', options: [{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }] },
      { id: 'dm', label: 'Diabetes history', type: 'select', options: [{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }] },
      { id: 'stroke', label: 'Stroke/TIA/Thromboembolism history', type: 'select', options: [{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }] },
      { id: 'vascular', label: 'Vascular disease history', type: 'select', options: [{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }] },
    ]
  },
  {
    id: 'has_bled',
    name: 'HAS-BLED',
    description: 'Bleeding risk in AFib',
    category: 'Emergency / Cardiology',
    inputs: [
      { id: 'htn', label: 'Hypertension (SBP > 160)', type: 'select', options: [{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }] },
      { id: 'renal', label: 'Abnormal renal function', type: 'select', options: [{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }] },
      { id: 'liver', label: 'Abnormal liver function', type: 'select', options: [{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }] },
      { id: 'stroke', label: 'Stroke history', type: 'select', options: [{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }] },
      { id: 'bleeding', label: 'Prior major bleeding', type: 'select', options: [{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }] },
      { id: 'labile_inr', label: 'Labile INR', type: 'select', options: [{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }] },
      { id: 'age', label: 'Age > 65', type: 'number', min: 0 },
      { id: 'drugs', label: 'Antiplatelet/NSAID use', type: 'select', options: [{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }] },
      { id: 'alcohol', label: 'Alcohol use (>= 8 drinks/week)', type: 'select', options: [{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }] },
    ]
  },

  // General / Inpatient
  {
    id: 'qsofa',
    name: 'qSOFA',
    description: 'Sepsis bedside screening',
    category: 'General / Inpatient',
    inputs: [
      { id: 'rr', label: 'Respiratory Rate', type: 'number', min: 0 },
      { id: 'mentations', label: 'Altered Mentation', type: 'select', options: [{ value: 'normal', label: 'Normal' }, { value: 'altered', label: 'Altered' }] },
      { id: 'sbp', label: 'Systolic BP', type: 'number', min: 0 },
    ]
  },
  {
    id: 'sofa',
    name: 'SOFA',
    description: 'Organ failure assessment',
    category: 'General / Inpatient',
    inputs: [
      { id: 'respiratory', label: 'Respiratory (PaO2/FiO2)', type: 'select', options: [{ value: '0', label: '>= 400 (0)' }, { value: '1', label: '< 400 (1)' }, { value: '2', label: '< 300 (2)' }, { value: '3', label: '< 200 (3)' }, { value: '4', label: '< 100 (4)' }] },
      { id: 'coagulation', label: 'Coagulation (Platelets)', type: 'select', options: [{ value: '0', label: '>= 150 (0)' }, { value: '1', label: '< 150 (1)' }, { value: '2', label: '< 100 (2)' }, { value: '3', label: '< 50 (3)' }, { value: '4', label: '< 20 (4)' }] },
      { id: 'liver', label: 'Liver (Bilirubin)', type: 'select', options: [{ value: '0', label: '< 1.2 (0)' }, { value: '1', label: '1.2-1.9 (1)' }, { value: '2', label: '2.0-5.9 (2)' }, { value: '3', label: '6.0-11.9 (3)' }, { value: '4', label: '> 12.0 (4)' }] },
      { id: 'cardiovascular', label: 'Cardiovascular (MAP/Vasopressors)', type: 'select', options: [{ value: '0', label: 'MAP >= 70 (0)' }, { value: '1', label: 'MAP < 70 (1)' }, { value: '2', label: 'Dopamine <= 5 or any dobutamine (2)' }, { value: '3', label: 'Dopamine > 5 or epi/norepi <= 0.1 (3)' }, { value: '4', label: 'Dopamine > 15 or epi/norepi > 0.1 (4)' }] },
      { id: 'cns', label: 'CNS (GCS)', type: 'select', options: [{ value: '0', label: '15 (0)' }, { value: '1', label: '13-14 (1)' }, { value: '2', label: '10-12 (2)' }, { value: '3', label: '6-9 (3)' }, { value: '4', label: '< 6 (4)' }] },
      { id: 'renal', label: 'Renal (Creatinine/Urine output)', type: 'select', options: [{ value: '0', label: '< 1.2 (0)' }, { value: '1', label: '1.2-1.9 (1)' }, { value: '2', label: '2.0-3.4 (2)' }, { value: '3', label: '3.5-4.9 (3)' }, { value: '4', label: '> 5.0 (4)' }] },
    ]
  },
  {
    id: 'curb_65',
    name: 'CURB-65',
    description: 'Pneumonia severity',
    category: 'General / Inpatient',
    inputs: [
      { id: 'confusion', label: 'Confusion', type: 'select', options: [{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }] },
      { id: 'bun', label: 'BUN (mg/dL)', type: 'number', min: 0 },
      { id: 'rr', label: 'Respiratory Rate', type: 'number', min: 0 },
      { id: 'sbp', label: 'Systolic BP', type: 'number', min: 0 },
      { id: 'dbp', label: 'Diastolic BP', type: 'number', min: 0 },
      { id: 'age', label: 'Age', type: 'number', min: 0 },
    ]
  },
  {
    id: 'gcs',
    name: 'Glasgow Coma Scale',
    description: 'Level of consciousness',
    category: 'General / Inpatient',
    inputs: [
      { id: 'eye', label: 'Eye Opening', type: 'select', options: [{ value: '4', label: 'Spontaneous (4)' }, { value: '3', label: 'To speech (3)' }, { value: '2', label: 'To pain (2)' }, { value: '1', label: 'None (1)' }] },
      { id: 'verbal', label: 'Verbal Response', type: 'select', options: [{ value: '5', label: 'Oriented (5)' }, { value: '4', label: 'Confused (4)' }, { value: '3', label: 'Inappropriate words (3)' }, { value: '2', label: 'Incomprehensible sounds (2)' }, { value: '1', label: 'None (1)' }] },
      { id: 'motor', label: 'Motor Response', type: 'select', options: [{ value: '6', label: 'Obeys commands (6)' }, { value: '5', label: 'Localizes pain (5)' }, { value: '4', label: 'Withdraws from pain (4)' }, { value: '3', label: 'Abnormal flexion (3)' }, { value: '2', label: 'Abnormal extension (2)' }, { value: '1', label: 'None (1)' }] },
    ]
  },
  {
    id: 'news2',
    name: 'NEWS2',
    description: 'Clinical deterioration screening',
    category: 'General / Inpatient',
    inputs: [
      { id: 'rr_score', label: 'Resp Rate Score', type: 'select', options: [{ value: '0', label: '12-20 (0)' }, { value: '1', label: '9-11 (1)' }, { value: '2', label: '21-24 (2)' }, { value: '3', label: '<=8 or >=25 (3)' }] },
      { id: 'spo2_score', label: 'SpO2 Score', type: 'select', options: [{ value: '0', label: '>= 96 (0)' }, { value: '1', label: '94-95 (1)' }, { value: '2', label: '92-93 (2)' }, { value: '3', label: '<= 91 (3)' }] },
      { id: 'air_o2_score', label: 'Air or Oxygen', type: 'select', options: [{ value: '0', label: 'Air (0)' }, { value: '2', label: 'Oxygen (2)' }] },
      { id: 'sbp_score', label: 'Systolic BP Score', type: 'select', options: [{ value: '0', label: '111-219 (0)' }, { value: '1', label: '101-110 (1)' }, { value: '2', label: '91-100 (2)' }, { value: '3', label: '<=90 or >=220 (3)' }] },
      { id: 'hr_score', label: 'Heart Rate Score', type: 'select', options: [{ value: '0', label: '51-90 (0)' }, { value: '1', label: '41-50 or 91-110 (1)' }, { value: '2', label: '111-130 (2)' }, { value: '3', label: '<=40 or >=131 (3)' }] },
      { id: 'consciousness_score', label: 'Consciousness Score', type: 'select', options: [{ value: '0', label: 'Alert (0)' }, { value: '3', label: 'CVPU (3)' }] },
      { id: 'temp_score', label: 'Temp Score', type: 'select', options: [{ value: '0', label: '36.1-38.0 (0)' }, { value: '1', label: '35.1-36.0 or 38.1-39.0 (1)' }, { value: '2', label: '>= 39.1 (2)' }, { value: '3', label: '<= 35.0 (3)' }] },
      { id: 'any_3', label: 'Score of 3 in any single parameter?', type: 'select', options: [{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }] },
    ]
  },

  // Renal / Metabolic
  {
    id: 'egfr_ckd_epi',
    name: 'eGFR (CKD-EPI 2021)',
    description: 'Modern eGFR without race',
    category: 'Renal / Metabolic',
    inputs: [
      { id: 'creatinine', label: 'Creatinine', type: 'number', unit: 'mg/dL', min: 0.1 },
      { id: 'age', label: 'Age', type: 'number', min: 18 },
      { id: 'sex', label: 'Sex', type: 'select', options: [{ value: 'female', label: 'Female' }, { value: 'male', label: 'Male' }] },
    ]
  },
  {
    id: 'gfr',
    name: 'eGFR (MDRD)',
    description: 'Traditional kidney function',
    category: 'Renal / Metabolic',
    inputs: [
      { id: 'creatinine', label: 'Creatinine', type: 'number', unit: 'mg/dL', min: 0.1 },
      { id: 'age', label: 'Age', type: 'number', min: 18 },
      { id: 'sex', label: 'Sex', type: 'select', options: [{ value: 'female', label: 'Female' }, { value: 'male', label: 'Male' }] },
      { id: 'race', label: 'Race', type: 'select', options: [{ value: 'non-black', label: 'Non-Black' }, { value: 'black', label: 'Black' }] },
    ]
  },
  {
    id: 'cr_cl_cg',
    name: 'Creatinine Clearance',
    description: 'Cockcroft-Gault formula',
    category: 'Renal / Metabolic',
    inputs: [
      { id: 'creatinine', label: 'Creatinine', type: 'number', unit: 'mg/dL', min: 0.1 },
      { id: 'age', label: 'Age', type: 'number', min: 0 },
      { id: 'weight', label: 'Weight (kg)', type: 'number', min: 0 },
      { id: 'sex', label: 'Sex', type: 'select', options: [{ value: 'female', label: 'Female' }, { value: 'male', label: 'Male' }] },
    ]
  },
  {
    id: 'anion_gap',
    name: 'Anion Gap',
    description: 'Metabolic acidosis analysis',
    category: 'Renal / Metabolic',
    inputs: [
      { id: 'na', label: 'Sodium (Na)', type: 'number', min: 0 },
      { id: 'cl', label: 'Chloride (Cl)', type: 'number', min: 0 },
      { id: 'hco3', label: 'Bicarbonate (HCO3)', type: 'number', min: 0 },
    ]
  },

  // Preventive / Risk
  {
    id: 'ascvd_risk',
    name: 'ASCVD 10-year risk',
    description: 'AHA/ACC risk estimator',
    category: 'Preventive / Risk',
    inputs: [
      { id: 'age', label: 'Age', type: 'number', min: 20, max: 79 },
      { id: 'sex', label: 'Sex', type: 'select', options: [{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }] },
      { id: 'smoker', label: 'Current Smoker', type: 'select', options: [{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }] },
      { id: 'diabetes', label: 'Diabetes', type: 'select', options: [{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }] },
      { id: 'sbp', label: 'Systolic BP', type: 'number', min: 90, max: 200 },
    ]
  },
  {
    id: 'framingham',
    name: 'Framingham Risk Score',
    description: '10-year CV risk',
    category: 'Preventive / Risk',
    inputs: [
      { id: 'age', label: 'Age', type: 'number', min: 30, max: 79 },
      { id: 'sex', label: 'Sex', type: 'select', options: [{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }] },
      { id: 'smoker', label: 'Current Smoker', type: 'select', options: [{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }] },
    ]
  },
  {
    id: 'hba1c_eag',
    name: 'HbA1c to eAG',
    description: 'Average glucose converter',
    category: 'Preventive / Risk',
    inputs: [
      { id: 'hba1c', label: 'HbA1c (%)', type: 'number', min: 4, max: 20 },
    ]
  },
  {
    id: 'bmi',
    name: 'BMI',
    description: 'Body Mass Index',
    category: 'Preventive / Risk',
    inputs: [
      { id: 'weight', label: 'Weight (kg)', type: 'number', min: 1, max: 300 },
      { id: 'height', label: 'Height (cm)', type: 'number', min: 50, max: 250 },
    ]
  },
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
const Calculators = ({ isSidebarOpen, handleToggleSidebar, isAuthenticated, user, onLogout, openPatientSelectionModal, isPatientSelectionModalOpen }) => {
  const { selectedPatient } = usePatientContext();
  const { theme } = useTheme();
  const [selectedCalculatorId, setSelectedCalculatorId] = useState(null);
  const [inputValues, setInputValues] = useState({});
  const [calculationResults, setCalculationResults] = useState(null);
  const [references, setReferences] = useState([]);
  const [clinicalPearls, setClinicalPearls] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const selectedCalculator = useMemo(
    () => calculators.find((calc) => calc.id === selectedCalculatorId),
    [selectedCalculatorId]
  );

  const categories = useMemo(() => {
    const cats = {};
    calculators.forEach(calc => {
      if (!cats[calc.category]) cats[calc.category] = [];
      cats[calc.category].push(calc);
    });
    return cats;
  }, []);

  // Reset input values and pre-fill with patient context when calculator or selectedPatient changes
  useEffect(() => {
    if (selectedCalculator) {
      const initialValues = {};
      selectedCalculator.inputs.forEach((input) => {
        if (input.type === 'number') {
          initialValues[input.id] = '';
        } else if (input.type === 'select' && input.options && input.options.length > 0) {
          initialValues[input.id] = input.options[0].value;
        }
      });

      // Pre-fill from selectedPatient if available
      if (selectedPatient) {
        const ageInput = selectedCalculator.inputs.find(input => input.id === 'age');
        if (ageInput && selectedPatient.age) {
          initialValues.age = String(selectedPatient.age);
        }
        const sexInput = selectedCalculator.inputs.find(input => input.id === 'sex');
        if (sexInput && selectedPatient.sex) {
          initialValues.sex = selectedPatient.sex.toLowerCase();
        }
        const weightInput = selectedCalculator.inputs.find(input => input.id === 'weight');
        if (weightInput && selectedPatient.weight) {
          initialValues.weight = String(selectedPatient.weight);
        }
        const heightInput = selectedCalculator.inputs.find(input => input.id === 'height');
        if (heightInput && selectedPatient.height) {
          initialValues.height = String(selectedPatient.height);
        }
      }
      setInputValues(initialValues);
      setCalculationResults(null);
    }
  }, [selectedCalculator, selectedPatient]);

  const handleInputChange = (id, value) => {
    setInputValues((prev) => ({ ...prev, [id]: value }));
  };

  const handleOpenCalculator = (calcId) => {
    setSelectedCalculatorId(calcId);
    setIsModalOpen(true);
    setCalculationResults(null);
    setError(null);
  };

  const handleCalculate = async () => {
    if (!selectedCalculator) return;

    setLoading(true);
    setError(null);
    setCalculationResults(null);

    try {
      const data = await apiClient.calculate(selectedCalculatorId, inputValues, selectedPatient);
      if (data.ok) {
        setCalculationResults(data.structured?.results || data.structured || []);
        setClinicalPearls(data.structured?.clinicalPearls || '');
        setReferences(data.references || []);
      } else {
        setError(data.content || 'Unable to fetch results right now. Please try again.');
      }
    } catch (err) {
      console.error('Error calculating:', err);
      setError('System encountered an issue. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isCalculateDisabled = useMemo(() => {
    if (!selectedCalculator) return true;
    return selectedCalculator.inputs.some((input) => {
      if (input.type === 'number' && input.required !== false) {
        const value = parseFloat(inputValues[input.id]);
        return isNaN(value);
      }
      return false;
    });
  }, [selectedCalculator, inputValues]);


  return (
    <div className="workspaces-container">
      <div className="page-header">
        <h1>Clinical Calculators Hub</h1>
        <p>Evidence-based tools for real-world clinical practice</p>
      </div>

      <div className="form-section">
        <GlobalPatientSelector />
      </div>

      <div className="calculators-grid-container">
        {Object.entries(categories).map(([category, calcs]) => (
          <div key={category} className="calculator-category-section">
            <h2 className="category-title">{category}</h2>
            <div className="calculators-grid">
              {calcs.map(calc => (
                <div 
                  key={calc.id} 
                  className="calculator-card"
                  onClick={() => handleOpenCalculator(calc.id)}
                >
                  <div className="card-content">
                    <h3>{calc.name}</h3>
                    <p className="calculator-description">{calc.description}</p>
                  </div>
                  <div className="card-footer">
                    <span className="open-link">Open Calculator</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && selectedCalculator && (
        <div className="calculator-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="calculator-modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-content">
                <h2>{selectedCalculator.name}</h2>
                <p className="modal-subtext">{selectedCalculator.description}</p>
              </div>
              <button className="close-button" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            
            <div className="calculator-inputs">
              {selectedCalculator.inputs.map((input) => (
                <div className="form-group" key={input.id}>
                  <label htmlFor={input.id}>
                    {input.label} {input.unit && `(${input.unit})`}
                  </label>
                  {input.type === 'number' && (
                    <input
                      type="number"
                      id={input.id}
                      value={inputValues[input.id]}
                      onChange={(e) => handleInputChange(input.id, e.target.value)}
                      min={input.min}
                      max={input.max}
                      step="any"
                      placeholder={`Enter ${input.label.toLowerCase()}`}
                    />
                  )}
                  {input.type === 'select' && (
                    <CustomSelect
                      options={input.options}
                      value={inputValues[input.id]}
                      onChange={(value) => handleInputChange(input.id, value)}
                      placeholder={`Select ${input.label.toLowerCase()}`}
                    />
                  )}
                </div>
              ))}
              
              <div className="modal-actions">
                <PrimaryActionButton
                  label={loading ? 'Calculating...' : 'Calculate Result'}
                  onClick={handleCalculate}
                  disabled={loading || isCalculateDisabled}
                />
              </div>
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            {calculationResults && (
              <div className="calculation-results-section">
                <h3>Results</h3>
                <div className="results-list">
                  {calculationResults.map((result, index) => (
                    <ResultCard
                      key={index}
                      title={result.title}
                      content={
                        <>
                          <div className="result-value-row">
                            <span className="result-label">Value:</span>
                            <span className="result-value">{result.value} {result.unit}</span>
                          </div>
                          {result.interpretation && (
                            <div className="result-interpretation-row">
                              <span className="result-label">Interpretation:</span>
                              <span className="result-value">{result.interpretation}</span>
                            </div>
                          )}
                        </>
                      }
                    />
                  ))}
                </div>

                {clinicalPearls && (
                  <div className="clinical-pearls-section">
                    <h4>Clinical Pearls</h4>
                    <p>{clinicalPearls}</p>
                  </div>
                )}

                {references && references.length > 0 && (
                  <div className="citations-section">
                    <h4 className="citations-title">
                      <img src={theme === 'light' ? referencesIconLight : referencesIconDark} alt="References" />
                      Evidence & References
                    </h4>
                    <div className="citations-list">
                      {references.map((citation) => (
                        <div className="citation-card" key={citation.id}>
                          <a href={citation.url} target="_blank" rel="noopener noreferrer" className="citation-link">
                            {citation.title} - {citation.journal} ({citation.year})
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Calculators;