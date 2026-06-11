import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  TrendingUp, TrendingDown, RefreshCw, Sparkles, ShieldAlert, AlertTriangle, 
  ThumbsUp, MessageSquare, Target, BarChart2, Award, Zap, Mail, Phone, 
  HelpCircle, ChevronRight, Play, Eye, Settings, Briefcase, UserCheck, 
  Activity, CheckCircle, Clock, Lightbulb, User
} from 'lucide-react';
import { Lead } from '../types';

interface PredictiveHubProps {
  leads: Lead[];
  onAddReminder: (reminder: any) => void;
  onAddEmail: (email: any) => void;
}

// Initial Mock Representative Data
const INITIAL_REPS = [
  { id: 'rep-1', name: 'Marcus Brody', calls: 148, reach: 98, bookings: 24, closeRate: 28, revenue: 142000, rank: 1, avatar: 'MB' },
  { id: 'rep-2', name: 'Elena Rostova', calls: 124, reach: 82, bookings: 19, closeRate: 24, revenue: 98500, rank: 2, avatar: 'ER' },
  { id: 'rep-3', name: 'Jack Shepard', calls: 135, reach: 77, bookings: 16, closeRate: 18, revenue: 64000, rank: 3, avatar: 'JS' },
];

const OBJECTIONS_DATA = [
  {
    category: 'Price Objections',
    trigger: '“Your price is too high compared to template services”',
    analysis: 'Lead is comparing an enterprise automation engine layer with simple static CRMs. They lack understanding of the operational ROI.',
    bestResponse: '“I completely hear you on budget constraints. However, Nexus is an AI overlay. Rather than costing thousands in manual integration and licensing for new tools, it sits directly on top of your existing database, recovering up to 24% in lost ghost leads in the first 30 days. Would you rather pay $300/mo for a tool that holds leads, or invest in an overlay that active closes them?”',
    confidenceScore: 94
  },
  {
    category: 'Trust & Verification',
    trigger: '“We are worried about AI draft safety and sending wrong emails”',
    analysis: 'High risk of friction regarding compliance and brand voice consistency.',
    bestResponse: '“That is precisely why we designed original safety buffers. Our autonomous assistant will NEVER dispatch an email directly without human review unless explicitly switched into Full Autopilot. Every follow-up is safely staged as a "Draft" inside your dashboard, giving you final approve rights with a single touch.”',
    confidenceScore: 97
  },
  {
    category: 'Competitor Mention',
    trigger: '“We are already looking at high-end built-in SalesForce solutions”',
    analysis: 'Lead understands CRM values but is considering expensive, native customization teams.',
    bestResponse: '“Salesforce native customization takes 3-6 months of expensive developer resources. Nexus CRM attaches to your same Salesforce node in 5 minutes via the script integration, instantly providing predictive probability scoring, active sentiment mapping, and conversational automation without code changes.”',
    confidenceScore: 91
  },
  {
    category: 'Timing Delays',
    trigger: '“Contact us after our quarter-end board review”',
    analysis: 'Classic procrastination loop. Often indicates lack of immediate priority.',
    bestResponse: '“I understand quarter-end is chaotic. But because our overlay takes five minutes to configure, we can mount it today in observer-only mode. By the time your board meets, you will have concrete data showing exactly where your team is losing leads today, making you look exceptionally proactive in that meeting. Let’s set a 10-minute sandbox run tomorrow?”',
    confidenceScore: 89
  }
];

export const PredictiveHub: React.FC<PredictiveHubProps> = ({ leads, onAddReminder, onAddEmail }) => {
  const [activeSubTab, setActiveSubTab] = useState<'forecast' | 'matrix' | 'objections' | 'coaching'>('forecast');
  
  // States for Workflow builder
  const [workflows, setWorkflows] = useState([
    { id: 'wf-1', trigger: 'When lead misses an appointment', actions: ['Draft recovery email', 'Create SMS task for owner'], status: 'Active' },
    { id: 'wf-2', trigger: 'When lead sentiment becomes Negative / High-Risk', actions: ['Ping Lead Decay monitor', 'Urgent Slack Notification'], status: 'Active' },
    { id: 'wf-3', trigger: 'When lead remains untouched for 5 days', actions: ['Launch Ghost Recovery campaign'], status: 'Paused' }
  ]);
  const [newTrigger, setNewTrigger] = useState('');
  const [newAction, setNewAction] = useState('');
  const [activeObjectionIndex, setActiveObjectionIndex] = useState(0);

  // Calculated Metrics
  const calculatedPulse = 84; 
  const totalPipeline = leads.reduce((sum, l) => sum + l.value, 0);
  
  // Forecast projections
  const dailyProjection = Math.round(totalPipeline * 0.04);
  const weeklyProjection = Math.round(totalPipeline * 0.22);
  const monthlyProjection = Math.round(totalPipeline * 0.85);
  const quarterlyProjection = Math.round(totalPipeline * 2.6);

  // Derive average sentiment scores history of all interactions over past 30 days
  const sentimentTrackerData = useMemo(() => {
    const data = [];
    const today = new Date();
    
    const posLeads = leads.filter(l => l.sentiment === 'Positive');
    const negLeads = leads.filter(l => l.sentiment === 'Negative');
    const neutralLeads = leads.filter(l => l.sentiment === 'Neutral');
    const totalLeads = posLeads.length + negLeads.length + neutralLeads.length || 1;
    
    // Average baseline score (e.g., Poz=90, Neu=60, Neg=25)
    const baseSentimentScore = Math.round(((posLeads.length * 92) + (neutralLeads.length * 62) + (negLeads.length * 28)) / totalLeads);

    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      
      // Calculate a highly realistic mathematical sine/cosine model centered around our active baseline sentiment
      // This maps an elegant, fluctuating daily progress tracker demonstrating past 30 days of client responses.
      const variance = Math.round(Math.sin((29 - i) * 0.45) * 7 + Math.cos((29 - i) * 0.2) * 5 + (i % 3 === 0 ? 3 : -2));
      const dailyScore = Math.min(100, Math.max(10, baseSentimentScore + variance));
      
      data.push({
        dayLabel: dateStr,
        'Sentiment Index': dailyScore
      });
    }
    return data;
  }, [leads]);

  // Handle Workflow creation
  const handleCreateWorkflow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrigger || !newAction) return;

    setWorkflows(prev => [
      ...prev,
      {
        id: `wf-${Math.random().toString(36).substr(2, 5)}`,
        trigger: newTrigger,
        actions: [newAction],
        status: 'Active'
      }
    ]);
    setNewTrigger('');
    setNewAction('');
  };

  const toggleWorkflow = (id: string) => {
    setWorkflows(prev => prev.map(w => w.id === id ? { ...w, status: w.status === 'Active' ? 'Paused' : 'Active' } : w));
  };

  // Run a quick simulation recovery draft
  const triggerGhostRecovery = (leadName: string, recipient: string) => {
    onAddEmail({
      leadName,
      recipientEmail: recipient,
      subject: `Resurfacing: Custom upgrade opportunity for ${leadName}`,
      body: `Hi ${leadName},\n\nOur intelligent pipeline flagged that your static consultation integration might have stalled last week. I wanted to check in to see if we could set up a 5-minute overlay tour tomorrow?\n\nWarmly,\nNexus AI Pilot`,
      status: 'Draft'
    });
    alert(`Success! Staged a recursive Ghost Recovery draft email for ${leadName} inside your Dashboard follow-ups queue.`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Premium Overview Section Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-8 border border-indigo-500/10 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-1/3 h-full bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none"></div>
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 z-10 relative">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 bg-indigo-500/20 text-indigo-300 font-bold px-3 py-1 rounded-full text-xs">
              <Sparkles size={14} className="animate-spin text-indigo-400" />
              <span>NEXUS PREDICTIVE CRM DECISION WORKPLACE</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight">The CRM Enhanced Shell Layer</h2>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              We don't hold static data. We sit directly over your underlying records, executing continuous scoring algorithms, objection intelligence matrices, and automatic client messaging follow-ups.
            </p>
          </div>

          {/* Large Pulse Metric Box */}
          <div className="flex items-center gap-4 bg-slate-800/60 backdrop-blur border border-slate-700 p-5 rounded-2xl">
            <div className="relative flex items-center justify-center">
              <svg className="w-16 h-16 transform -rotate-90">
                <circle cx="32" cy="32" r="28" className="text-slate-700" strokeWidth="6" fill="transparent" />
                <circle cx="32" cy="32" r="28" className="text-emerald-400" strokeWidth="6" fill="transparent" 
                  strokeDasharray={175} strokeDashoffset={175 - (175 * calculatedPulse) / 100} />
              </svg>
              <span className="absolute text-md font-black text-emerald-400 font-mono">{calculatedPulse}%</span>
            </div>
            <div>
              <div className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Company Pulse Score</div>
              <p className="text-xs text-slate-300 font-medium max-w-[170px] leading-tight mt-1">
                Based on communication speeds, pipeline weight, and lead decay tags.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sub Navigation Tabs */}
      <div className="flex border-b border-slate-200">
        <button 
          onClick={() => setActiveSubTab('forecast')}
          className={`px-5 py-3 font-semibold text-xs uppercase tracking-wider border-b-2 transition-all ${
            activeSubTab === 'forecast' 
              ? 'border-indigo-600 text-indigo-600 font-extrabold' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Forecast & Decays
        </button>
        <button 
          onClick={() => setActiveSubTab('matrix')}
          className={`px-5 py-3 font-semibold text-xs uppercase tracking-wider border-b-2 transition-all ${
            activeSubTab === 'matrix' 
              ? 'border-indigo-600 text-indigo-600 font-extrabold' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Probability Matrix
        </button>
        <button 
          onClick={() => setActiveSubTab('objections')}
          className={`px-5 py-3 font-semibold text-xs uppercase tracking-wider border-b-2 transition-all ${
            activeSubTab === 'objections' 
              ? 'border-indigo-600 text-indigo-600 font-extrabold' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Objection Library
        </button>
        <button 
          onClick={() => setActiveSubTab('coaching')}
          className={`px-5 py-3 font-semibold text-xs uppercase tracking-wider border-b-2 transition-all ${
            activeSubTab === 'coaching' 
              ? 'border-indigo-600 text-indigo-600 font-extrabold' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Rep AI Coaching
        </button>
      </div>

      {/* Main Tab Render Window */}
      {activeSubTab === 'forecast' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Revenue Forecast AI */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <TrendingUp className="text-indigo-600" size={18} />
                  <h3 className="font-bold text-slate-800">Revenue Forecast AI</h3>
                </div>
                <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded font-black uppercase font-mono">Continuous Forecast update</span>
              </div>
              <p className="text-xs text-slate-500 mb-6 font-medium leading-relaxed">
                Calculated on actual client communication frequency, rep velocity, and historically validated probability nodes on current CRM records.
              </p>

              {/* Grid of projection times */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Daily Proj.</div>
                  <div className="text-lg font-black text-slate-800 font-mono mt-1">${dailyProjection.toLocaleString()}</div>
                  <span className="text-[9px] text-green-600 font-bold flex items-center gap-0.5 mt-1">
                    ▲ +4% flow
                  </span>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Weekly Proj.</div>
                  <div className="text-lg font-black text-indigo-600 font-mono mt-1">${weeklyProjection.toLocaleString()}</div>
                  <span className="text-[9px] text-green-600 font-bold flex items-center gap-0.5 mt-1">
                    ▲ +12% weight
                  </span>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Monthly Proj.</div>
                  <div className="text-lg font-black text-slate-800 font-mono mt-1">${monthlyProjection.toLocaleString()}</div>
                  <span className="text-[9px] text-emerald-600 font-bold flex items-center gap-0.5 mt-1">
                    ▲ +18% cycle
                  </span>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Quarterly Proj.</div>
                  <div className="text-lg font-black text-slate-800 font-mono mt-1">${quarterlyProjection.toLocaleString()}</div>
                  <span className="text-[9px] text-indigo-600 font-bold flex items-center gap-0.5 mt-1">
                    ▲ Stable pulse
                  </span>
                </div>
              </div>
            </div>

            {/* Projection visual trend indicator */}
            <div className="p-4 bg-indigo-50/40 rounded-xl border border-indigo-100/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-600/10 text-indigo-700 flex items-center justify-center font-bold text-xs font-mono">AI</div>
                <div>
                  <span className="text-xs font-bold text-slate-800 block">AI Revenue Projection Analysis</span>
                  <span className="text-[10px] text-slate-600 block leading-tight mt-0.5">Underlying data is solid relative to baseline cycle of {leads.length} accounts. No manual spreadsheet uploads required.</span>
                </div>
              </div>
              <button 
                onClick={() => alert("Synchronizing projections to active CRM databases (Salesforce/HubSpot)... Completed.")}
                className="bg-indigo-600 text-white text-[10px] font-black uppercase px-3 py-1.5 rounded-lg hover:bg-indigo-700 shadow-sm transition-colors align-self-end md:align-self-auto"
              >
                Sync to Active CRM Node
              </button>
            </div>
          </div>

          {/* Lead Decay & Ghost Recovery */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="text-rose-500" size={18} />
                  <h3 className="font-bold text-slate-800">Lead Decay Detect</h3>
                </div>
                <span className="text-xs text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full font-bold">2 At Risk</span>
              </div>
              <p className="text-xs text-slate-500 leading-normal mb-5 font-medium">
                Our model identifies silent decays before leads completely disappear.
              </p>

              <div className="space-y-3">
                <div className="p-3 bg-red-50/40 border border-red-50 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">John Doe (Startup.io)</span>
                    <span className="text-[9px] bg-red-100 text-red-800 px-1.5 py-0.5 rounded font-bold uppercase">Decaying fast</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1 space-y-1">
                    <p>• Indicator: No touch for 4 days</p>
                    <p>• Engagement: Reduced down by 72%</p>
                  </div>
                  <button 
                    onClick={() => triggerGhostRecovery('John Doe', 'john@startup.io')}
                    className="w-full mt-3 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1"
                  >
                    <Zap size={10} /> Launch Ghost Campaign
                  </button>
                </div>

                <div className="p-3 bg-amber-50/30 border border-amber-50 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">Sarah Connor (Resistance)</span>
                    <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold uppercase">Mild stall</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1 space-y-1">
                    <p>• Indicator: Delayed scheduling of Consultation</p>
                    <p>• Proposal amount: $5,000 value</p>
                  </div>
                  <button 
                    onClick={() => triggerGhostRecovery('Sarah Connor', 'sarah@cyberdyne.com')}
                    className="w-full mt-3 bg-slate-850 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white text-[10px] font-bold py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1"
                  >
                    <Mail size={10} /> Sync Soft Re-Engage Draft
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Average Sentiment Score 30-Day Trend Chart */}
          <div className="lg:col-span-3 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-450">
                  <MessageSquare size={18} className="text-indigo-600 dark:text-indigo-400" />
                  <h3 className="font-bold text-slate-800 dark:text-slate-150">30-Day Interactions Sentiment Index</h3>
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                  Continuous sentiment tracking over the past 30 days analyzing communication tone and client response velocities.
                </p>
              </div>
              <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950/40 px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Avg. sentiment:</span>
                <span className="text-sm font-black text-indigo-600 dark:text-indigo-450 font-mono">
                  {Math.round(sentimentTrackerData[29]?.["Sentiment Index"] || 75)}/100
                </span>
              </div>
            </div>
            
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sentimentTrackerData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.6} className="dark:hidden" />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" strokeOpacity={0.4} className="hidden dark:block" />
                  <XAxis 
                    dataKey="dayLabel" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 10 }} 
                    dy={10} 
                  />
                  <YAxis 
                    domain={[0, 100]} 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 10 }} 
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      borderRadius: '12px',
                      color: '#f8fafc',
                      border: '1px solid #334155',
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '12px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Sentiment Index" 
                    stroke="#6366f1" 
                    strokeWidth={3} 
                    dot={false}
                    activeDot={{ r: 6, fill: '#6366f1', strokeWidth: 0 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}

      {/* Probability Matrix Tab */}
      {activeSubTab === 'matrix' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Sales Deal Probability Matrix</h3>
              <p className="text-xs text-slate-500 font-medium">Auto-weighting algorithms reflecting prompt reply times, customer replies, sentiment maps, and pipeline depth.</p>
            </div>
            <span className="text-xs bg-indigo-50 text-indigo-700 font-semibold px-2.5 py-1 rounded-lg">Gemini Computed Matrix</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {leads.map((lead) => {
              // Calculate custom math probability parameters based on lead values
              const speedScore = lead.id === '1' ? 95 : 45;
              const sentimentFactor = lead.sentiment === 'Positive' ? 30 : lead.sentiment === 'Negative' ? -20 : 10;
              const probabilityPercent = Math.min(100, Math.max(15, (lead.aiScore || 50) + sentimentFactor));

              return (
                <div key={lead.id} className="p-5 border border-slate-100 rounded-2xl bg-slate-50/50 hover:border-indigo-150 transition-all flex flex-col justify-between gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">{lead.name}</h4>
                      <p className="text-[10px] text-slate-400 font-medium">{lead.company} | ${lead.value.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400 font-medium block">Win Prob.</span>
                      <span className="text-lg font-black text-indigo-600 font-mono">{probabilityPercent}%</span>
                    </div>
                  </div>

                  {/* Horizontal Bar visualization of weights */}
                  <div className="space-y-2">
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-indigo-600 h-full rounded-full transition-all duration-500" style={{ width: `${probabilityPercent}%` }}></div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 pt-1 text-[10px] text-slate-400 font-semibold border-t border-slate-100">
                      <div>
                        <span className="block text-slate-500">Fast Response</span>
                        <span className="text-slate-800 font-mono">{speedScore}/100</span>
                      </div>
                      <div>
                        <span className="block text-slate-500">Sentiment Tag</span>
                        <span className={`font-bold ${lead.sentiment === 'Positive' ? 'text-green-600' : 'text-orange-500'}`}>{lead.sentiment || 'Neutral'}</span>
                      </div>
                      <div>
                        <span className="block text-slate-500">Source Grade</span>
                        <span className="text-slate-800 font-mono">{lead.source === 'Website Form' ? 'Grade A' : 'Grade B'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-100 text-[11px] text-slate-600 leading-normal italic">
                    <span className="font-bold text-indigo-600 not-italic uppercase text-[9px] block mb-0.5">Overlay Recommendation:</span>
                    {lead.aiInsight || "Early stage pipeline analysis. Maintain daily engagement."}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Objection Intelligence Matrix */}
      {activeSubTab === 'objections' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between h-[420px]">
            <div>
              <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100">
                <Lightbulb className="text-indigo-600" size={18} />
                <h3 className="font-bold text-slate-800">Objection Intelligence</h3>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                Select an objection detected from live client communication. Nexus AI suggests strategic scripts for immediate close rates.
              </p>

              <div className="space-y-2 max-h-[240px] overflow-y-auto">
                {OBJECTIONS_DATA.map((obj, idx) => (
                  <button
                    key={obj.category}
                    onClick={() => setActiveObjectionIndex(idx)}
                    className={`w-full text-left p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-between ${
                      activeObjectionIndex === idx 
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' 
                        : 'bg-slate-50 border-slate-100 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>{obj.category}</span>
                    <ChevronRight size={14} className={activeObjectionIndex === idx ? 'text-white' : 'text-slate-400'} />
                  </button>
                ))}
              </div>
            </div>
            
            <div className="text-[10px] text-slate-400 font-mono italic text-center">
              Powered by Nexus Objection Logic Engine v2.1
            </div>
          </div>

          <div className="lg:col-span-2 bg-slate-900 text-white p-8 rounded-2xl shadow-xl flex flex-col justify-between h-[420px] relative overflow-hidden">
            <div className="absolute right-0 top-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-[10px] uppercase font-black tracking-widest text-indigo-400 font-mono">
                  Analysis Matrix: {OBJECTIONS_DATA[activeObjectionIndex].category}
                </span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-500/20 font-mono">
                  Confidence Score: {OBJECTIONS_DATA[activeObjectionIndex].confidenceScore}%
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase font-sans">Detected Objection Pattern</span>
                <p className="text-sm font-extrabold text-slate-100 mt-1 leading-snug">
                  {OBJECTIONS_DATA[activeObjectionIndex].trigger}
                </p>
              </div>

              <div className="p-3 bg-slate-800/60 border border-slate-700/50 rounded-xl">
                <span className="text-[9px] font-bold text-indigo-300 uppercase block font-sans">Psychological analysis</span>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed leading-normal font-sans">
                  {OBJECTIONS_DATA[activeObjectionIndex].analysis}
                </p>
              </div>

              <div className="p-4 bg-indigo-950/40 border border-indigo-500/25 rounded-xl">
                <span className="text-[9px] font-black text-emerald-400 uppercase block font-sans">Active AI Suggested Script Response</span>
                <p className="text-xs text-emerald-200 mt-1 leading-relaxed leading-normal font-mono">
                  {OBJECTIONS_DATA[activeObjectionIndex].bestResponse}
                </p>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(OBJECTIONS_DATA[activeObjectionIndex].bestResponse);
                  alert("Script copied to clipboard! Share it with your sales rep.");
                }}
                className="bg-slate-800 border border-slate-700 text-slate-200 hover:text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all"
              >
                Copy Script to Clipboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rep AI Coaching Tab */}
      {activeSubTab === 'coaching' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Rep Efficiency Scoring */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Award className="text-indigo-600" size={18} />
                  <h3 className="font-bold text-slate-800">Rep Efficiency Leaderboard</h3>
                </div>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-black uppercase">Live Team Metrics</span>
              </div>
              <p className="text-xs text-slate-500 mb-6 font-medium">
                Tracks call efforts, booking ratios, script deviations, and total pipeline converted by agent automatically.
              </p>

              <div className="space-y-4">
                {INITIAL_REPS.map((rep, idx) => (
                  <div key={rep.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-600/10 text-indigo-700 font-extrabold rounded-full flex items-center justify-center text-sm font-mono shadow-inner border border-indigo-600/10">
                        {rep.avatar}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 text-xs">{rep.name}</span>
                          <span className="text-[9px] bg-indigo-150 text-indigo-700 font-extrabold px-1.5 py-0.5 rounded-full uppercase">Rank #{rep.rank}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 font-semibold">
                          Calls Made: <strong className="text-slate-600">{rep.calls}</strong> | Booking Rate: <strong className="text-slate-600">{Math.round((rep.bookings/rep.reach)*100)}%</strong>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 self-end md:self-auto text-right font-mono">
                      <div>
                        <span className="block text-[8px] uppercase text-slate-450 font-bold font-sans">Close Rate</span>
                        <span className="text-xs font-bold text-slate-800">{rep.closeRate}%</span>
                      </div>
                      <div>
                        <span className="block text-[8px] uppercase text-slate-450 font-bold font-sans">Revenue Converted</span>
                        <span className="text-xs font-bold text-emerald-600">${rep.revenue.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Coaching Copilot */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <UserCheck className="text-indigo-600" size={18} />
                  <h3 className="font-bold text-slate-800">Coaching Copilot</h3>
                </div>
                <span className="text-xs bg-indigo-50 text-indigo-600 font-bold px-2 py-0.5 rounded-full">AI Listening</span>
              </div>
              <p className="text-xs text-slate-500 leading-normal mb-4 font-medium">
                Analysis of last communication recordings flags script compliance issues.
              </p>

              <div className="space-y-3 font-sans">
                <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
                  <div className="flex items-center gap-1 text-[10px] font-black uppercase text-indigo-600 font-mono">
                    <AlertTriangle size={12} className="text-indigo-600 animate-pulse" />
                    <span>Script Deviation Flagged</span>
                  </div>
                  <p className="text-[11px] font-bold text-slate-800 leading-snug">
                    Jack Shepard missed the required value-building anchor:
                  </p>
                  <p className="text-[10px] italic text-slate-500 leading-snug">
                    “Agent failed to mention our direct Salesforce script integrations or custom API overlays, going straight to pricing models, causing friction.”
                  </p>
                  <div className="pt-2 border-t border-slate-250/20 text-[10px] text-slate-600 bg-white p-2 rounded border border-indigo-100/50">
                    <strong className="text-indigo-600 block">AI Intervention:</strong>
                    Stage a call review with Jack modeling our Price Objection Objection script listed in panel 2.
                  </div>
                </div>

                <div className="p-3 bg-emerald-50/20 border border-emerald-50 rounded-xl space-y-1">
                  <div className="flex items-center gap-1 text-[10px] font-black uppercase text-emerald-600 font-mono">
                    <CheckCircle size={11} />
                    <span>Positive Peak Interaction</span>
                  </div>
                  <p className="text-[10.5px] font-semibold text-slate-700 leading-normal">
                    Marcus Brody hit a high conversion confidence anchor when handling Connor’s timing objections. No further training needed.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interactive AI Workflow Builder (Section 6) */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-md space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 mb-1">
              <Zap className="fill-indigo-50 text-indigo-600 animate-bounce" size={18} />
              <h3 className="font-extrabold uppercase text-xs tracking-wider">Dynamic CRM Automation Shell</h3>
            </div>
            <h4 className="text-xl font-extrabold text-slate-800">AI Workflow Builder</h4>
            <p className="text-xs text-slate-500 font-medium">Build custom automation workflows dynamically by describing triggers and sequential actions.</p>
          </div>
          <span className="text-xs bg-slate-100 text-slate-700 font-bold px-3 py-1 rounded-xl">3 Live Automation Nodes</span>
        </div>

        {/* Form to submit custom statement */}
        <form onSubmit={handleCreateWorkflow} className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-100">
          <div className="md:col-span-2 space-y-1">
            <label className="block text-[10px] font-black text-slate-500 uppercase">Describe Your Trigger Scenario (Natural Language)</label>
            <input 
              value={newTrigger}
              onChange={(e) => setNewTrigger(e.target.value)}
              placeholder="e.g., When a lead misses appointment or feedback is negative..."
              required
              className="w-full px-4 py-2 border border-slate-200 rounded-lg text-xs outline-none bg-white focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-[10px] font-black text-slate-500 uppercase">Intended AI Actions</label>
            <div className="flex gap-2">
              <input 
                value={newAction}
                onChange={(e) => setNewAction(e.target.value)}
                placeholder="e.g., Send SMS follow-up, ping CRM admin..."
                required
                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-xs outline-none bg-white focus:ring-2 focus:ring-indigo-500/20"
              />
              <button 
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
              >
                Deploy
              </button>
            </div>
          </div>
        </form>

        {/* Existing workflows listing */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {workflows.map(wf => (
            <div key={wf.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">{wf.id}</span>
                  <button 
                    onClick={() => toggleWorkflow(wf.id)}
                    className={`text-[9px] font-black px-2 py-0.5 rounded-full border transition-all ${
                      wf.status === 'Active' 
                        ? 'bg-green-150 text-green-700 border-green-250 bg-green-50' 
                        : 'bg-slate-150 text-slate-700 border-slate-250 bg-slate-50'
                    }`}
                  >
                    {wf.status}
                  </button>
                </div>
                
                <h5 className="text-xs font-extrabold text-slate-800 leading-snug">{wf.trigger}</h5>
                
                <div className="mt-3.5 space-y-1.5 border-t border-slate-200/50 pt-2.5">
                  <span className="text-[9px] font-bold uppercase text-indigo-600 block">System Sequence Action Blocks</span>
                  {wf.actions.map((act, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[10.5px] text-slate-600 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                      <span>{act}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between text-[9px] text-slate-400 font-medium border-t border-slate-100 pt-2.5">
                <span>Created via AI Shell</span>
                <span>Active 100% simulated log</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PredictiveHub;
