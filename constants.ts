export const MAX_HISTORY_LENGTH = 60; // Keep last 60 seconds
export const UPDATE_INTERVAL_MS = 1000;

export const NOMINAL_VOLTAGE = 240;
export const NOMINAL_FREQUENCY = 60;

// Thresholds for visual indicators
export const THRESHOLDS = {
  voltage: { min: 220, max: 260 },
  current: { warning: 15, critical: 25 },
  temperature: { warning: 60, critical: 85 },
  power: { warning: 3600, critical: 6000 } // Calculated roughly from V*A
};

export const MOCK_INITIAL_DATA = {
  voltage: NOMINAL_VOLTAGE,
  current: 0,
  power: 0,
  temperature: 25,
  frequency: NOMINAL_FREQUENCY,
  efficiency: 100,
  status: 'NOMINAL' as const,
  timestamp: Date.now()
};