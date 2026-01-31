// src/types/chat.d.ts

import { Patient } from './patient'; // Assuming patient.d.ts is in the same directory or accessible

export interface TemporaryPatientContext {
  fullName?: string;
  age?: number;
  sex?: 'Male' | 'Female' | 'Other';
  chiefComplaint?: string;
  chronicConditions?: { id: string; name: string }[];
  longTermMedications?: { id: string; name: string; dose: string }[];
  allergies?: { id: string; substance: string; reaction: string }[];
  keyPastClinicalEvents?: { id: string; description: string }[];
  uploadedFiles?: { id: string; name: string; url: string; type: string }[];
  freeTextContext?: string;
}

export type ChatContextState =
  | { type: 'GENERAL_CHAT' }
  | { type: 'SAVED_PATIENT_CHAT'; patient: Patient }
  | { type: 'TEMPORARY_PATIENT_CHAT'; temporaryContext: TemporaryPatientContext };
