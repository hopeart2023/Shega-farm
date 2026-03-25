
export enum UserRole {
  FARMER = 'Farmer',
  BUYER = 'Buyer',
  EXTENSION_WORKER = 'Extension Worker',
  ADMIN = 'Admin'
}

export interface FarmerProfile {
  id: string;
  name: string;
  region: string;
  crops_grown: string[];
  verification_status: boolean;
  trust_score: number;
}

export interface Diagnosis {
  id: string;
  crop_type: string;
  photo_url: string;
  disease_detected: string;
  pest_detected: string;
  severity_level: 'Low' | 'Medium' | 'High';
  treatment_recommendation: string;
  timestamp: string;
}

export interface MarketPrice {
  id: string;
  market_name: string;
  crop_type: string;
  price: number;
  broker_margin: number;
  timestamp: string;
}

export interface Question {
  id: string;
  farmer_id: string;
  question_text: string;
  timestamp: string;
  answers: Answer[];
}

export interface Answer {
  id: string;
  responder_id: string;
  answer_text: string;
  verified: boolean;
  timestamp: string;
}

export interface Alert {
  id: string;
  region: string;
  alert_type: string;
  severity: 'Info' | 'Warning' | 'Critical';
  message: string;
  timestamp: string;
}
