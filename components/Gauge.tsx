import React from 'react';

interface GaugeProps {
  value: number;
  min: number;
  max: number;
  label: string;
  unit: string;
  color?: string;
  size?: number;
}

const Gauge: React.FC<GaugeProps> = ({ 
  value, 
  min, 
  max, 
  label, 
  unit, 
  color = "#22d3ee", // cyan-400
  size = 160 
}) => {
  const radius = 45; // Internal radius relative to viewBox 0-100
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  
  // Constrain value
  const clampedValue = Math.min(Math.max(value, min), max);
  const percentage = (clampedValue - min) / (max - min);
  
  // Start from 225 degrees (bottom left) to -45 degrees (bottom right) -> 270 degree sweep
  const offset = circumference - (percentage * (circumference * 0.75));
  
  // Calculate needle rotation
  const rotation = -135 + (percentage * 270);

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-slate-800/50 rounded-lg border border-slate-700 shadow-inner backdrop-blur-sm">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full overflow-visible"
        >
          {/* Background Track */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="#1e293b"
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
            strokeDashoffset={0}
            transform="rotate(135 50 50)"
            strokeLinecap="round"
          />
          
          {/* Active Value Track */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(135 50 50)"
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
          />

          {/* Scale Markers */}
          <text x="20" y="80" fill="#64748b" fontSize="8" className="font-mono text-xs">{min}</text>
          <text x="80" y="80" fill="#64748b" fontSize="8" className="font-mono text-xs" textAnchor="end">{max}</text>

          {/* Value Text */}
          <text 
            x="50" 
            y="55" 
            fill="white" 
            fontSize="18" 
            fontWeight="bold" 
            textAnchor="middle" 
            className="font-mono"
          >
            {value.toFixed(1)}
          </text>
          
          {/* Unit Text */}
          <text 
            x="50" 
            y="70" 
            fill="#94a3b8" 
            fontSize="10" 
            textAnchor="middle" 
            className="uppercase tracking-wider font-mono"
          >
            {unit}
          </text>
        </svg>
      </div>
      <div className="mt-2 text-sm font-semibold text-slate-400 uppercase tracking-widest">{label}</div>
    </div>
  );
};

export default Gauge;