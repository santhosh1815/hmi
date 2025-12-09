import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  TelemetryData, 
  SystemState, 
  DiagnosticsReport,
  SystemStatus 
} from './types';
import { 
  MAX_HISTORY_LENGTH, 
  UPDATE_INTERVAL_MS, 
  MOCK_INITIAL_DATA, 
  NOMINAL_VOLTAGE, 
  NOMINAL_FREQUENCY,
  THRESHOLDS
} from './constants';
import { generateDiagnostics } from './services/geminiService';
import Gauge from './components/Gauge';
import TrendChart from './components/TrendChart';
import DiagnosticsPanel from './components/DiagnosticsPanel';
import { Power, Settings, Zap, Thermometer, Activity, Play, Square } from 'lucide-react';

const App: React.FC = () => {
  // --- State ---
  const [systemState, setSystemState] = useState<SystemState>({
    isConnected: true,
    simulationActive: true,
    targetLoad: 40, // Initial load %
    data: MOCK_INITIAL_DATA,
    history: Array(MAX_HISTORY_LENGTH).fill(MOCK_INITIAL_DATA)
  });

  const [aiReport, setAiReport] = useState<DiagnosticsReport | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // --- Simulation Logic ---
  const simulateStep = useCallback((currentData: TelemetryData, targetLoad: number): TelemetryData => {
    // Random fluctuation base
    const noise = (Math.random() - 0.5); 
    
    // Simulate Voltage Drop under load (V = V_nominal - I * R_internal)
    // Basic model: Voltage drops slightly as load increases
    const loadFactor = targetLoad / 100;
    const voltageBase = NOMINAL_VOLTAGE - (loadFactor * 5) + (noise * 1.5); // +/- fluctuations
    
    // Current depends on load
    const maxCurrent = 30; // 30 Amps max capability
    const currentBase = (maxCurrent * loadFactor) + (noise * 0.2);

    // Power P = V * I
    const power = voltageBase * currentBase;

    // Temp rises with power (lagged effect simulated simply here)
    // Ideally temp moves slowly towards target temp based on load
    const targetTemp = 25 + (loadFactor * 60); // 25C base + up to 60C rise
    const tempChange = (targetTemp - currentData.temperature) * 0.05; // 5% approach rate per tick
    const temp = currentData.temperature + tempChange + (noise * 0.1);

    // Efficiency drops slightly at very low or very high loads
    let eff = 95 - (Math.abs(loadFactor - 0.5) * 10) + (noise * 0.5);
    if (eff > 100) eff = 100;

    // Determine Status
    let status: SystemStatus = SystemStatus.NOMINAL;
    if (power > THRESHOLDS.power.critical || temp > THRESHOLDS.temperature.critical) {
      status = SystemStatus.CRITICAL;
    } else if (power > THRESHOLDS.power.warning || temp > THRESHOLDS.temperature.warning) {
      status = SystemStatus.WARNING;
    }

    return {
      timestamp: Date.now(),
      voltage: Math.max(0, voltageBase),
      current: Math.max(0, currentBase),
      power: Math.max(0, power),
      temperature: temp,
      frequency: NOMINAL_FREQUENCY + (noise * 0.1),
      efficiency: eff,
      status
    };
  }, []);

  // --- Effects ---
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (systemState.simulationActive && systemState.isConnected) {
      interval = setInterval(() => {
        setSystemState(prev => {
          const newData = simulateStep(prev.data, prev.targetLoad);
          const newHistory = [...prev.history.slice(1), newData];
          return { ...prev, data: newData, history: newHistory };
        });
      }, UPDATE_INTERVAL_MS);
    }

    return () => clearInterval(interval);
  }, [systemState.simulationActive, systemState.isConnected, systemState.targetLoad, simulateStep]);

  // --- Handlers ---
  const handleDiagnostics = async () => {
    setAiLoading(true);
    const report = await generateDiagnostics(systemState.data);
    setAiReport(report);
    setAiLoading(false);
  };

  const togglePower = () => {
    setSystemState(prev => ({ 
      ...prev, 
      simulationActive: !prev.simulationActive,
      // If turning off, reset instant values to near zero eventually, 
      // but for simple toggle just pause sim.
    }));
  };

  const handleLoadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSystemState(prev => ({ ...prev, targetLoad: parseInt(e.target.value) }));
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 p-4 md:p-6 lg:p-8 flex flex-col gap-6">
      
      {/* --- Header --- */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-800/80 p-6 rounded-xl border-b-4 border-cyan-500 shadow-2xl backdrop-blur-md">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-white flex items-center gap-3">
            <Zap className="w-8 h-8 text-cyan-400 fill-cyan-400" />
            ELECTRO<span className="text-cyan-400">HMI</span>
          </h1>
          <p className="text-slate-400 text-sm font-mono mt-1 tracking-widest uppercase">
            Unit 01 • Power Distribution • <span className={systemState.simulationActive ? "text-emerald-400" : "text-amber-500"}>
              {systemState.simulationActive ? "ONLINE" : "STANDBY"}
            </span>
          </p>
        </div>
        
        <div className="flex items-center gap-6 mt-4 md:mt-0 font-mono text-sm">
           <div className="flex flex-col items-end">
             <span className="text-slate-500 text-xs uppercase">System Time</span>
             <span className="text-xl text-white font-bold">{new Date().toLocaleTimeString()}</span>
           </div>
           <div className="flex flex-col items-end">
             <span className="text-slate-500 text-xs uppercase">Uptime</span>
             <span className="text-cyan-400">04:22:19</span>
           </div>
        </div>
      </header>

      {/* --- Main Grid --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-grow">
        
        {/* Left Column: Visuals (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Key Metrics Gauges */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Gauge 
              value={systemState.data.voltage} 
              min={200} 
              max={280} 
              label="Line Voltage" 
              unit="Volts AC" 
              color={systemState.data.voltage > THRESHOLDS.voltage.max || systemState.data.voltage < THRESHOLDS.voltage.min ? "#fbbf24" : "#22d3ee"}
            />
            <Gauge 
              value={systemState.data.current} 
              min={0} 
              max={40} 
              label="Load Current" 
              unit="Amps" 
              color={systemState.data.current > THRESHOLDS.current.warning ? "#f43f5e" : "#34d399"}
            />
            <Gauge 
              value={systemState.data.temperature} 
              min={0} 
              max={100} 
              label="Core Temp" 
              unit="Celsius" 
              color={systemState.data.temperature > THRESHOLDS.temperature.warning ? "#f43f5e" : "#fbbf24"}
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow">
            <TrendChart 
              data={systemState.history} 
              dataKey="power" 
              title="Power Output (W)" 
              color="#818cf8" 
            />
            <TrendChart 
              data={systemState.history} 
              dataKey="temperature" 
              title="Thermal Trend (°C)" 
              color="#fb7185" 
            />
          </div>

          {/* Detailed Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-800/50 p-4 rounded-lg border border-slate-700">
            <div className="flex flex-col">
               <span className="text-xs text-slate-500 uppercase font-bold">Frequency</span>
               <span className="text-xl font-mono text-white">{systemState.data.frequency.toFixed(2)} <span className="text-xs text-slate-400">Hz</span></span>
            </div>
            <div className="flex flex-col">
               <span className="text-xs text-slate-500 uppercase font-bold">Efficiency</span>
               <span className="text-xl font-mono text-white">{systemState.data.efficiency.toFixed(1)} <span className="text-xs text-slate-400">%</span></span>
            </div>
            <div className="flex flex-col">
               <span className="text-xs text-slate-500 uppercase font-bold">Power Factor</span>
               <span className="text-xl font-mono text-white">0.98</span>
            </div>
             <div className="flex flex-col">
               <span className="text-xs text-slate-500 uppercase font-bold">Peak Load</span>
               <span className="text-xl font-mono text-white">{(systemState.data.power / 1000).toFixed(2)} <span className="text-xs text-slate-400">kW</span></span>
            </div>
          </div>
        </div>

        {/* Right Column: Controls & AI (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Manual Controls */}
          <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 shadow-lg">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Settings className="w-4 h-4" /> Manual Override
            </h2>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-slate-900 p-4 rounded border border-slate-700">
                <span className="font-bold text-white">System Power</span>
                <button 
                  onClick={togglePower}
                  className={`flex items-center gap-2 px-4 py-2 rounded font-bold uppercase text-xs transition-all ${
                    systemState.simulationActive 
                    ? 'bg-emerald-500 text-emerald-950 hover:bg-emerald-400' 
                    : 'bg-rose-500 text-rose-950 hover:bg-rose-400'
                  }`}
                >
                  {systemState.simulationActive ? <Square className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
                  {systemState.simulationActive ? 'STOP' : 'START'}
                </button>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-xs font-bold uppercase text-cyan-400">Target Load Regulation</label>
                  <span className="font-mono text-white">{systemState.targetLoad}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="120" 
                  value={systemState.targetLoad} 
                  onChange={handleLoadChange}
                  className="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
                <div className="flex justify-between mt-1 text-[10px] text-slate-500 font-mono">
                  <span>IDLE</span>
                  <span>NOMINAL</span>
                  <span>OVERLOAD</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button className="bg-slate-700 hover:bg-slate-600 text-slate-300 py-3 rounded text-xs font-bold uppercase border border-slate-600 transition-colors">
                  Reset Trip
                </button>
                <button className="bg-slate-700 hover:bg-slate-600 text-slate-300 py-3 rounded text-xs font-bold uppercase border border-slate-600 transition-colors">
                  Clear Logs
                </button>
              </div>
            </div>
          </div>

          {/* AI Diagnostics Panel - Takes remaining height */}
          <div className="flex-grow">
            <DiagnosticsPanel 
              report={aiReport} 
              loading={aiLoading} 
              onRunDiagnostics={handleDiagnostics} 
            />
          </div>

        </div>
      </div>
    </div>
  );
};

export default App;