// src/types/patient-snapshot.d.ts

export type Sex = 'Male' | 'Female' | 'Other';

export interface ChronicCondition {
  id: string;
  name: string;
}

export interface Medication {
  id: string;
  name: string;
  dose?: string; // Optional dose
}

export interface Allergy {
  id: string;
  substance: string;
  reaction?: string; // Optional reaction
}

export interface ClinicalEvent {
  id: string;
  description: string; // Free-text
}

export interface PatientSnapshot {
  lastUpdated: string; // ISO date string
  demographics: {
    age?: number;
    sex?: Sex;
  };
  chronicConditions: ChronicCondition[];
  longTermMedications: Medication[];
  allergies: Allergy[];
  keyPastClinicalEvents: ClinicalEvent[];
}
