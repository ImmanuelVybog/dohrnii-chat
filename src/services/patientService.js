// src/services/patientService.ts
import { Patient } from '../types/patient';

const ALL_PATIENTS_STORAGE_KEY = 'allPatients';
const ACTIVE_PATIENT_STORAGE_KEY = 'activePatientId';

// Utility to generate a unique ID (can be replaced with a more robust solution if needed)
const generateUniqueId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// Load all patients from localStorage
const loadAllPatients = (): Patient[] => {
  try {
    const serializedPatients = localStorage.getItem(ALL_PATIENTS_STORAGE_KEY);
    return serializedPatients ? JSON.parse(serializedPatients) : [];
  } catch (error) {
    console.error('Error loading all patients from localStorage:', error);
    return [];
  }
};

// Save all patients to localStorage
const saveAllPatients = (patients: Patient[]): void => {
  try {
    const serializedPatients = JSON.stringify(patients);
    localStorage.setItem(ALL_PATIENTS_STORAGE_KEY, serializedPatients);
  } catch (error) {
    console.error('Error saving all patients to localStorage:', error);
  }
};

// Load active patient ID from localStorage
const loadActivePatientId = (): string | null => {
  try {
    return localStorage.getItem(ACTIVE_PATIENT_STORAGE_KEY);
  } catch (error) {
    console.error('Error loading active patient ID from localStorage:', error);
    return null;
  }
};

// Save active patient ID to localStorage
const saveActivePatientId = (patientId: string): void => {
  try {
    localStorage.setItem(ACTIVE_PATIENT_STORAGE_KEY, patientId);
  } catch (error) {
    console.error('Error saving active patient ID to localStorage:', error);
  }
};

// Get all patients
export const getAllPatients = (): Patient[] => {
  return loadAllPatients();
};

// Get a patient by ID
export const getPatientById = (id: string): Patient | undefined => {
  const patients = loadAllPatients();
  return patients.find(p => p.id === id);
};

// Add a new patient
export const addPatient = (newPatient: Omit<Patient, 'id' | 'createdAt' | 'lastUpdated' | 'clinicalReasoningOutputs' | 'visitNotes'>): Patient => {
  const patients = loadAllPatients();
  const patient: Patient = {
    id: generateUniqueId(),
    ...newPatient,
    chronicConditions: newPatient.chronicConditions || [],
    longTermMedications: newPatient.longTermMedications || [],
    allergies: newPatient.allergies || [],
    keyPastClinicalEvents: newPatient.keyPastClinicalEvents || [],
    uploadedFiles: newPatient.uploadedFiles || [],
    manualTextContext: newPatient.manualTextContext || '',
    clinicalReasoningOutputs: [],
    visitNotes: [],
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
  };
  patients.push(patient);
  saveAllPatients(patients);
  return patient;
};

// Update an existing patient
export const updatePatient = (updatedPatient: Patient): void => {
  let patients = loadAllPatients();
  const index = patients.findIndex(p => p.id === updatedPatient.id);
  if (index !== -1) {
    patients[index] = { ...updatedPatient, lastUpdated: new Date().toISOString() };
    saveAllPatients(patients);
  } else {
    console.warn(`Patient with ID ${updatedPatient.id} not found for update.`);
  }
};

// Delete a patient
export const deletePatient = (id: string): void => {
  let patients = loadAllPatients();
  patients = patients.filter(p => p.id !== id);
  saveAllPatients(patients);
  // If the deleted patient was the active one, clear active patient
  if (loadActivePatientId() === id) {
    clearActivePatient();
  }
};

// Get the active patient
export const getActivePatient = (): Patient | null => {
  const activeId = loadActivePatientId();
  if (activeId) {
    return getPatientById(activeId) || null;
  }
  return null;
};

// Set the active patient
export const setActivePatient = (patientId: string): void => {
  const patientExists = getPatientById(patientId);
  if (patientExists) {
    saveActivePatientId(patientId);
  } else {
    console.warn(`Attempted to set non-existent patient ID ${patientId} as active.`);
  }
};

// Clear the active patient
export const clearActivePatient = (): void => {
  localStorage.removeItem(ACTIVE_PATIENT_STORAGE_KEY);
};

// Initialize with a default patient if none exist
const initializePatients = () => {
  const patients = loadAllPatients();
  if (patients.length === 0) {
    // No default patient creation or selection on app load
  }
};

initializePatients();
