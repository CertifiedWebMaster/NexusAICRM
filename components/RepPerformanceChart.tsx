import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, PhoneCall, CalendarCheck, Percent, Award, Zap, ArrowUpRight } from 'lucide-react';

interface RepData {
  name: string;
  calls: number;
  reached: number;
  booked: number;
  closedValue: number;
}

const REP_PERFORMANCE_PRESETS: Record<'today' | 'week' | 'month', RepData[]> = {
  today: [
    { name: 'Alex Mercer', calls: 32, reached: 18, booked: 2, closedValue: 1200 },
    { name: 'Jordan Belfort', calls: 54, reached: 38, booked: 5, closedValue: 8500 },
    { name: 'Elena Vance', calls: 25, reached: 15, booked: 1, closedValue: 0 },
    { name: 'Marcus Fenix', calls: 40, reached: 22, booked: 3, closedValue: 5000 }
  ],
  week: [
    { name: 'Alex Mercer', calls: 145, reached: 92, booked: 12, closedValue: 12500 },
    { name: 'Jordan Belfort', calls: 248, reached: 172, booked: 24, closedValue: 46000 },
    { name: 'Elena Vance', calls: 124, reached: 78, booked: 8, closedValue: 8000 },
    { name: 'Marcus Fenix', calls: 195, reached: 110, booked: 15, closedValue: 24000 }
  ],
  month: [
    { name: 'Alex Mercer', calls: 580, reached: 370, booked: 42, closedValue: 48000 },
    { name: 'Jordan Belfort', calls: 890, reached: 610, booked: 85, closedValue: 165000 },
    { name: 'Elena Vance', calls: 490, reached: 310, booked: 31, closedValue: 32000 },
    { name: 'Marcus Fenix', calls: 760, reached: 450, booked: 58, closedValue: 95000 }
  ]
};

const RepPerformanceChart: React.FC = () => {
  const [range, setRange] = useState<'today' | 'week' | 'month'>('week');
  const activeData = REP_PERFORMANCE_PRESETS[range];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
      
      {/* Chart controls & Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-indigo-600" />
            <h4 className="text-base font-bold text-slate-800">Sales Representative Performance</h4>
          </div>
          <p className="text-xs text-slate-400 font-medium">
            Active monitoring of daily calls, lead touches, and booked consultations.
          </p>
        </div>

        {/* Segmented controls */}
        <div className="bg-slate-100 p-1.5 rounded-xl flex border border-slate-200/40">
          {(['today', 'week', 'month'] as const).map(preset => (
            <button
              key={preset}
              onClick={() => setRange(preset)}
              className={`px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-widest rounded-lg transition-all ${
                range === preset 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* Main Chart Rendering Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-center">
        
        {/* Recharts grouped columns */}
        <div className="xl:col-span-2 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={activeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Legend 
                verticalAlign="top" 
                align="right" 
                iconType="circle"
                wrapperStyle={{ fontSize: 10, fontWeight: 700, paddingBottom: 20 }}
              />
              <Bar name="Calls Placed" dataKey="calls" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={14} />
              <Bar name="Reached" dataKey="reached" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={14} />
              <Bar name="Booked Appts" dataKey="booked" fill="#10b981" radius={[4, 4, 0, 0]} barSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Rep Leaderboard Metrics Panel */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-[10px] uppercase font-black text-slate-500 tracking-wider">Representative Leaderboard</span>
            <Award size={14} className="text-indigo-600" />
          </div>

          <div className="space-y-2.5">
            {activeData
              .slice()
              .sort((a,b) => b.closedValue - a.closedValue)
              .map((rep, idx) => {
                const reachRate = Math.round((rep.reached / rep.calls) * 100) || 0;
                return (
                  <div key={rep.name} className="flex items-center justify-between bg-slate-50/50 p-2.5 rounded-xl border border-slate-200/40 hover:bg-slate-50 hover:border-slate-200 transition-colors">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-[10px] font-black text-indigo-700">
                        #{idx + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-800 truncate">{rep.name}</div>
                        <div className="text-[9px] text-slate-400 font-semibold">{rep.calls} dials • {reachRate}% reach rate</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-800">${rep.closedValue.toLocaleString()}</div>
                      <div className="text-[9px] text-emerald-600 font-extrabold uppercase flex items-center justify-end gap-0.5">
                        <ArrowUpRight size={10} /> {rep.booked} booked
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

      </div>
    </div>
  );
};

export default RepPerformanceChart;
