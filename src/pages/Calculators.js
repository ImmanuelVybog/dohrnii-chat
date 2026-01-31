import React, { useState, useMemo, useEffect } from 'react';
import { usePatientContext } from '../context/PatientContext';
import PrimaryActionButton from '../components/shared/PrimaryActionButton';
import ResultCard from '../components/shared/ResultCard';
import CollapsibleSection from '../components/shared/CollapsibleSection';
import CustomSelect from '../components/shared/CustomSelect';
import './Calculators.css';
import GlobalPatientSelector from '../components/GlobalPatientSelector/GlobalPatientSelector';



const calculators = [
  {
    id: 'bmi',
    name: 'Body Mass Index (BMI)',
    inputs: [
      { id: 'weight', label: 'Weight', type: 'number', unit: 'kg', min: 1, max: 300 },
      { id: 'height', label: 'Height', type: 'number', unit: 'cm', min: 50, max: 250 },
    ],
    calculate: (values) => {
      const weight = parseFloat(values.weight);
      const heightCm = parseFloat(values.height);
      if (isNaN(weight) || isNaN(heightCm) || heightCm === 0) {
        return [{ title: 'Error', value: 'Invalid input' }];
      }
      const heightM = heightCm / 100;
      const bmi = weight / (heightM * heightM);
      let interpretation = '';
      if (bmi < 18.5) interpretation = 'Underweight';
      else if (bmi >= 18.5 && bmi < 24.9) interpretation = 'Normal weight';
      else if (bmi >= 25 && bmi < 29.9) interpretation = 'Overweight';
      else interpretation = 'Obesity';

      return [{ title: 'BMI', value: bmi.toFixed(2), unit: 'kg/m²', interpretation }];
    },
  },
  {
    id: 'gfr',
    name: 'eGFR (MDRD)',
    inputs: [
      { id: 'creatinine', label: 'Serum Creatinine', type: 'number', unit: 'mg/dL', min: 0.1 },
      {
        id: 'age',
        label: 'Age',
        type: 'number',
        unit: 'years',
        min: 18,
        max: 120,
      },
      {
        id: 'sex',
        label: 'Sex',
        type: 'select',
        options: [
          { value: 'female', label: 'Female' },
          { value: 'male', label: 'Male' },
        ],
      },
      {
        id: 'race',
        label: 'Race',
        type: 'select',
        options: [
          { value: 'non-black', label: 'Non-Black' },
          { value: 'black', label: 'Black' },
        ],
      },
    ],
    calculate: (values) => {
      const scr = parseFloat(values.creatinine);
      const age = parseFloat(values.age);
      const sex = values.sex;
      const race = values.race;

      if (isNaN(scr) || isNaN(age) || scr <= 0) {
        return [{ title: 'Error', value: 'Invalid input' }];
      }

      let gfr = 175 * Math.pow(scr, -1.154) * Math.pow(age, -0.203);
      if (sex === 'female') {
        gfr *= 0.742;
      }
      if (race === 'black') {
        gfr *= 1.212;
      }

      let interpretation = '';
      if (gfr >= 90) interpretation = 'Normal kidney function';
      else if (gfr >= 60 && gfr < 89) interpretation = 'Mildly decreased kidney function';
      else if (gfr >= 45 && gfr < 59) interpretation = 'Mild to moderate decreased kidney function';
      else if (gfr >= 30 && gfr < 44) interpretation = 'Moderately to severely decreased kidney function';
      else if (gfr >= 15 && gfr < 29) interpretation = 'Severely decreased kidney function';
      else interpretation = 'Kidney failure';

      return [{ title: 'eGFR', value: gfr.toFixed(0), unit: 'mL/min/1.73m²', interpretation }];
    },
  },
  // Add more calculators here
];

const Calculators = ({ openConfirmationModal, isPatientContextActiveInSession, isConfirmationModalOpen, patientToConfirmId, isConfirmingNewPatient, closeConfirmationModal, activatePatientContextInSession, deactivatePatientContextInSession, handleToggleSidebar, }) => {
  const { selectedPatient } = usePatientContext();
  const [selectedCalculatorId, setSelectedCalculatorId] = useState(calculators[0].id);
  const [inputValues, setInputValues] = useState({});
  const [calculationResults, setCalculationResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const selectedCalculator = useMemo(
    () => calculators.find((calc) => calc.id === selectedCalculatorId),
    [selectedCalculatorId]
  );

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

      // Pre-fill age and sex from selectedPatient if available
      if (selectedPatient) {
        if (selectedCalculator.id === 'gfr') { // Apply to eGFR calculator
          const ageInput = selectedCalculator.inputs.find(input => input.id === 'age');
          if (ageInput && selectedPatient.age) {
            initialValues.age = String(selectedPatient.age);
          }
          const sexInput = selectedCalculator.inputs.find(input => input.id === 'sex');
          if (sexInput && selectedPatient.sex) {
            const patientSex = selectedPatient.sex.toLowerCase();
            initialValues.sex = patientSex;
            console.log('Calculators - selectedPatient.sex:', selectedPatient.sex, 'initialValues.sex:', patientSex);
          }
        }
      }
      setInputValues(initialValues);
      setCalculationResults(null);
    }
  }, [selectedCalculator, selectedPatient]);

  const handleInputChange = (id, value) => {
    setInputValues((prev) => ({ ...prev, [id]: value }));
  };

  const handleCalculate = () => {
    if (!selectedCalculator) return;

    setLoading(true);
    setCalculationResults(null);

    setTimeout(() => {
      const results = selectedCalculator.calculate(inputValues);
      setCalculationResults(results);
      setLoading(false);
    }, 1000);
  };

  const isCalculateDisabled = useMemo(() => {
    if (!selectedCalculator) return true;
    return selectedCalculator.inputs.some((input) => {
      if (input.type === 'number') {
        const value = parseFloat(inputValues[input.id]);
        return isNaN(value) || value < (input.min || 0);
      }
      return false;
    });
  }, [selectedCalculator, inputValues]);

  const handleUsePatientContext = () => {
    if (isPatientContextActiveInSession) {
      openConfirmationModal(null, false);
    } else {
      handleToggleSidebar();
    }
  };

  return (
    <div className="calculators-container">
      <div className="page-header">
        <h1>Clinical Calculators Hub</h1>
        <p>Calculate essential metrics and values for patient care</p>
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
          <h2>Select a Calculator</h2>
          <div className="form-group">
            <CustomSelect
              options={calculators.map((calc) => ({ value: calc.id, label: calc.name }))}
              value={selectedCalculatorId}
              onChange={setSelectedCalculatorId}
              placeholder="Select a calculator"
            />
          </div>
        </div>
        {selectedCalculator && (
          <CollapsibleSection title={selectedCalculator.name} initiallyOpen={true}>
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
              <PrimaryActionButton
                label={loading ? 'Calculating...' : 'Calculate'}
                onClick={handleCalculate}
                disabled={loading || isCalculateDisabled}
              />
            </div>
          </CollapsibleSection>
        )}
      </div>

      {calculationResults && (
        <div className="calculation-results-section">
          <h2>Results</h2>
          {calculationResults.map((result, index) => (
            <ResultCard
              key={index}
              title={result.title}
              content={
                <>
                  <p>
                    <strong>Value:</strong> {result.value} {result.unit}
                  </p>
                  {result.interpretation && <p><strong>Interpretation:</strong> {result.interpretation}</p>}
                </>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Calculators;