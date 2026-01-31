// src/types/patient.d.ts

export type Sex = 'Male' | 'Female' | 'Other';

export interface ChronicCondition {
  id: string;
  name: string;
}

export interface Medication {
  id: string;
  name: string;
  dose?: string; // Optional dose information
}

export interface Allergy {
  id: string;
  substance: string;
  reaction?: string; // Optional reaction information
}

export interface ClinicalEvent {
  id: string;
  description: string;
  date?: string; // Optional date for the event
}

export interface UploadedFile {
  id: string;
  name: string;
  type: string; // e.g., 'PDF', 'JPG', 'PNG', 'TXT'
  url: string; // URL to access the file
  uploadedAt: string;
  extractedText?: string; // Optional: Stores text extracted via OCR or direct text file reading
}

export interface Patient {
  id: string; // Unique ID for the patient
  // Basic Info
  fullName: string;
  age?: number;
  sex?: Sex;

  // Structured Snapshot
  chronicConditions: ChronicCondition[];
  longTermMedications: Medication[];
  allergies: Allergy[];
  keyPastClinicalEvents: ClinicalEvent[];

  // Unstructured Context
  uploadedFiles: UploadedFile[];
  manualTextContext: string;

  // Generated Content (linked by patient ID - these will be references)
  clinicalReasoningOutputs: string[]; // Array of IDs or references to clinical reasoning outputs
  visitNotes: string[]; // Array of IDs or references to visit notes

  createdAt: string;
  lastUpdated: string;
}
