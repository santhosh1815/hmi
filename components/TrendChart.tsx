import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TelemetryData } from '../types';

interface TrendChartProps {
  data: TelemetryData[];
  dataKey: keyof TelemetryData;
  color: string;
  title: string;
}

const TrendChart: React.FC<TrendChartProps> = ({ data, dataKey, color, title }) => {
  return (
    <div className="flex flex-col h-64 bg-slate-800/50 rounded-lg border border-slate-700 p-4 shadow-inner backdrop-blur-sm">
      <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></span>
        {title} History
      </h3>
      <div className="flex-grow w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis 
              dataKey="timestamp" 
              hide={true} 
            />
            <YAxis 
              stroke="#64748b" 
              fontSize={10} 
              tickFormatter={(val) => val.toFixed(0)}
              width={30}
              domain={['auto', 'auto']}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9' }}
              itemStyle={{ color: color }}
              labelStyle={{ display: 'none' }}
              formatter={(value: number) => [value.toFixed(2), title]}
            />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TrendChart;