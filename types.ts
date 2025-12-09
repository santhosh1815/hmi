export interface TelemetryData {
  timestamp: number;
  voltage: number; // Volts
  current: number; // Amps
  power: number;   // Watts
  temperature: number; // Celsius
  frequency: number; // Hz
  efficiency: number; // Percentage
  status: 'NOMINAL' | 'WARNING' | 'CRITICAL';
}

export interface SystemState {
  isConnected: boolean;
  simulationActive: boolean;
  targetLoad: number; // 0 to 100%
  data: TelemetryData;
  history: TelemetryData[];
}

export enum SystemStatus {
  NOMINAL = 'NOMINAL',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL'
}

export interface DiagnosticsReport {
  status: SystemStatus;
  analysis: string;
  recommendation: string;
  estimatedTimeUntilFailure?: string;
}

export interface GeminiResponseSchema {
  status: string;
  analysis: string;
  recommendation: string;
  estimatedTimeUntilFailure: string;
}