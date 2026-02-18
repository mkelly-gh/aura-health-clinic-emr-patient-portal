export interface ApiResponse<T = unknown> { success: boolean; data?: T; error?: string; }
export interface WeatherResult {
  location: string;
  temperature: number;
  condition: string;
  humidity: number;
}
export interface MCPResult {
  content: string;
}
export interface ErrorResult {
  error: string;
}
export interface Diagnosis {
  code: string;
  description: string;
  date: string;
}
export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  status: 'Active' | 'Discontinued';
}
export interface Vitals {
  height: string;
  weight: string;
  bmi: string;
  bp: string;
  hr: string;
  temp: string;
}
export interface Patient {
  id: string;
  mrn: string;
  ssn: string;
  firstName: string;
  lastName: string;
  dob: string;
  gender: 'Male' | 'Female' | 'Other';
  bloodType: string;
  email: string;
  phone: string;
  address: string;
  diagnoses: Diagnosis[];
  medications: Medication[];
  vitals: Vitals;
  history: string;
}
export interface PatientContext {
  summary: string;
  activeMedications: string[];
  recentDiagnoses: string[];
}
export interface Message {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: number;
  id: string;
  toolCalls?: ToolCall[];
  tool_call_id?: string;
}
export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  result?: unknown;
}
export interface ChatState {
  messages: Message[];
  sessionId: string;
  isProcessing: boolean;
  model: string;
  streamingMessage?: string;
  patientContext?: PatientContext;
}
export interface SessionInfo {
  id: string;
  title: string;
  createdAt: number;
  lastActive: number;
}
export interface DbStatus {
  engine: string;
  binding: string;
  connected: boolean;
  pingMs: number;
  patientCount: number;
  sessionCount: number;
  status: 'HEALTHY' | 'DEGRADED';
  schemaVersion: string;
}
export interface Tool {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, unknown>;
    required: string[];
  };
}