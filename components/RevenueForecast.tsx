import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, DollarSign, Target, Calendar, ArrowUpRight, HelpCircle } from 'lucide-react';
import { Lead } from '../types';

interface RevenueForecastProps {
  leads: Lead[];
}

const RevenueForecast: React.FC<RevenueForecastProps> = ({ leads }) => {
  // Define win probability per status based on industry standards
  const PROBABILITIES: Record<Lead['status'], number> = {
    New: 0.15,
    Qualified: 0.45,
    Negotiation: 0.75,
    Closed: 1.0,
    Lost: 0.0
  };

  // Math equations for dynamic modeling
  const stats = useMemo(() => {
    let rawPipeline = 0;
    let weightedValue = 0;
    let closedRevenue = 0;
    let countActive = 0;

    leads.forEach(lead => {
      const val = lead.value || 0;
      const prob = PROBABILITIES[lead.status] || 0;
      
      rawPipeline += val;
      weightedValue += val * prob;

      if (lead.status === 'Closed') {
        closedRevenue += val;
      } else if (lead.status !== 'Lost') {
        countActive += 1;
      }
    });

    // Close patterns: calculate historic conversion rate
    const totalConcluded = leads.filter(l => l.status === 'Closed' || l.status === 'Lost').length;
    const closedCount = leads.filter(l => l.status === 'Closed').length;
    const fallbackRate = 0.35; // standard conversion fallback
    const historicClosePatternRate = totalConcluded > 0 ? (closedCount / totalConcluded) : fallbackRate;

    // Monthly Projection: Closed + 80% of Negotiations + 30% of Qualified + 10% of New
    const projectedMonthly = leads.reduce((sum, lead) => {
      if (lead.status === 'Closed') return sum + lead.value;
      if (lead.status === 'Negotiation') return sum + (lead.value * 0.70);
      if (lead.status === 'Qualified') return sum + (lead.value * 0.30);
      if (lead.status === 'New') return sum + (lead.value * 0.10);
      return sum;
    }, 0);

    // Quarterly Projection: Closed + 95% of Negotiations + 70% of Qualified + 40% of New
    const projectedQuarterly = leads.reduce((sum, lead) => {
      if (lead.status === 'Closed') return sum + lead.value;
      if (lead.status === 'Negotiation') return sum + (lead.value * 0.90);
      if (lead.status === 'Qualified') return sum + (lead.value * 0.65);
      if (lead.status === 'New') return sum + (lead.value * 0.35);
      return sum;
    }, 0);

    return {
      rawPipeline,
      weightedValue,
      closedRevenue,
      historicCloseRate: Math.round(historicClosePatternRate * 100),
      projectedMonthly,
      projectedQuarterly,
      countActive
    };
  }, [leads]);

  // Generate dynamic chart steps mimicking growth targets for 3 months
  const chartData = useMemo(() => {
    const baseClosed = stats.closedRevenue;
    const monthlyWeightedExpected = stats.projectedMonthly;
    const quarterlyWeightedExpected = stats.projectedQuarterly;

    // Conservative = 80% of expected, Ambitious = 130% of expected
    return [
      {
        name: 'Current',
        Conservative: baseClosed,
        Expected: baseClosed,
        Optimistic: baseClosed
      },
      {
        name: 'Month 1 (30d)',
        Conservative: Math.round(baseClosed + (monthlyWeightedExpected - baseClosed) * 0.8),
        Expected: Math.round(monthlyWeightedExpected),
        Optimistic: Math.round(monthlyWeightedExpected * 1.25)
      },
      {
        name: 'Month 2 (60d)',
        Conservative: Math.round(baseClosed + (quarterlyWeightedExpected - baseClosed) * 0.5),
        Expected: Math.round((monthlyWeightedExpected + quarterlyWeightedExpected) / 2),
        Optimistic: Math.round(((monthlyWeightedExpected + quarterlyWeightedExpected) / 2) * 1.3)
      },
      {
        name: 'Quarterly (90d)',
        Conservative: Math.round(baseClosed + (quarterlyWeightedExpected - baseClosed) * 0.85),
        Expected: Math.round(quarterlyWeightedExpected),
        Optimistic: Math.round(quarterlyWeightedExpected * 1.35)
      }
    ];
  }, [stats]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden font-sans">
      
      {/* Header and subtitle */}
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50/50">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-emerald-600" />
            <h4 className="text-base font-bold text-slate-800 font-sans">Revenue Forecasting & Pipeline Modeling</h4>
          </div>
          <p className="text-xs text-slate-400 font-medium font-sans">
            Status-weighted probability forecast charting Month-over-Month projected sales closures.
          </p>
        </div>

        {/* Closing rate badge */}
        <div className="bg-emerald-500/10 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-emerald-500/20">
          🎯 close pattern rate: {stats.historicCloseRate}%
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* LEFT COMPONENT: Key indicators bento block */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Weighted active monthly forecast card */}
          <div className="bg-slate-900 text-white rounded-xl p-4 border border-slate-800 flex items-center justify-between shadow">
            <div>
              <span className="text-[9px] uppercase font-black tracking-widest text-indigo-400 block font-mono">Projected Monthly</span>
              <span className="text-xl font-black mt-1 block font-mono">
                ${stats.projectedMonthly.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5 block font-sans">Weighted 30-day closings</span>
            </div>
            <div className="w-10 h-10 bg-indigo-650/30 text-indigo-400 rounded-lg flex items-center justify-center border border-indigo-500/15">
              <Calendar size={18} />
            </div>
          </div>

          {/* Weighted active quarterly forecast card */}
          <div className="bg-slate-950 text-white rounded-xl p-4 border border-slate-800 flex items-center justify-between shadow">
            <div>
              <span className="text-[9px] uppercase font-black tracking-widest text-emerald-400 block font-mono">Projected Quarterly</span>
              <span className="text-xl font-black mt-1 block font-mono">
                ${stats.projectedQuarterly.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5 block font-sans">Weighted 90-day pipeline</span>
            </div>
            <div className="w-10 h-10 bg-emerald-650/30 text-emerald-400 rounded-lg flex items-center justify-center border border-emerald-500/15 animate-pulse">
              <TrendingUp size={18} />
            </div>
          </div>

          {/* Probability indicators checklist info */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-150 text-[10px] leading-relaxed space-y-2 text-slate-600 font-medium">
            <span className="font-extrabold uppercase text-slate-800 block text-[9px] tracking-wider mb-1">Status Projections (Weights)</span>
            <div className="flex justify-between items-center bg-white px-2 py-1 rounded border border-slate-100">
              <span>Negotiation deals (75% prob)</span>
              <span className="font-bold text-slate-800">Closed in Monthly</span>
            </div>
            <div className="flex justify-between items-center bg-white px-2 py-1 rounded border border-slate-100">
              <span>Qualified deals (45% prob)</span>
              <span className="font-bold text-slate-850">Quarterly Inflow</span>
            </div>
            <div className="flex justify-between items-center bg-white px-2 py-1 rounded border border-slate-100">
              <span>Open raw pipeline</span>
              <span className="font-bold text-slate-800">${stats.rawPipeline.toLocaleString()}</span>
            </div>
          </div>

        </div>

        {/* RIGHT COMPONENT: 3-phase Area chart from Recharts */}
        <div className="lg:col-span-8 space-y-2">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 pb-1.5 px-1 font-sans">
            <span>GROWTH PROJECTION TRAJECTORIES</span>
            <div className="flex gap-4">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Optimistic</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-indigo-600" /> Expected</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-400" /> Conservative</span>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorOpt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.12}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.12}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="Optimistic" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorOpt)" />
                <Area type="monotone" dataKey="Expected" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorExp)" />
                <Area type="monotone" dataKey="Conservative" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="4 4" fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

export default RevenueForecast;
