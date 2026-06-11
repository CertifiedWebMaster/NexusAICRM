
import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingUp, Users, DollarSign, Target, Calendar, Bell, Mail, CheckCircle, Circle, Trash2, Send, Clock, Sparkles, MessageSquare, AlertCircle, ArrowUpRight, Zap } from 'lucide-react';
import { Lead, Reminder, Appointment, EmailFollowUp } from '../types';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6'];
import RepPerformanceChart from './RepPerformanceChart';
import RevenueForecast from './RevenueForecast';

interface DashboardProps {
  leads: Lead[];
  reminders: Reminder[];
  appointments: Appointment[];
  emails: EmailFollowUp[];
  onToggleReminder: (id: string) => void;
  onDeleteReminder: (id: string) => void;
  onDeleteAppointment: (id: string) => void;
  onSendEmail: (id: string) => void;
  onDeleteEmail: (id: string) => void;
  onRescheduleReminder: (id: string, newDate: string) => void;
  onRescheduleAppointment: (id: string, newDate: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  leads, 
  reminders, 
  appointments, 
  emails,
  onToggleReminder,
  onDeleteReminder,
  onDeleteAppointment,
  onSendEmail,
  onDeleteEmail,
  onRescheduleReminder,
  onRescheduleAppointment
}) => {
  const totalValue = leads.reduce((sum, lead) => sum + lead.value, 0);
  const avgScore = Math.round(leads.reduce((sum, lead) => sum + (lead.aiScore || 0), 0) / (leads.length || 1));
  const qualifiedLeads = leads.filter(l => l.status === 'Qualified').length;

  const data = [
    { name: 'Mon', value: 400 },
    { name: 'Tue', value: 300 },
    { name: 'Wed', value: 600 },
    { name: 'Thu', value: 800 },
    { name: 'Fri', value: 500 },
    { name: 'Sat', value: 900 },
    { name: 'Sun', value: 700 },
  ];

  const statusData = [
    { name: 'New', count: leads.filter(l => l.status === 'New').length },
    { name: 'Qualified', count: leads.filter(l => l.status === 'Qualified').length },
    { name: 'Negotiation', count: leads.filter(l => l.status === 'Negotiation').length },
    { name: 'Closed', count: leads.filter(l => l.status === 'Closed').length },
  ];

  // Group emails
  const drafts = emails.filter(e => e.status === 'Draft');
  const scheduled = emails.filter(e => e.status === 'Scheduled');
  const sentCount = emails.filter(e => e.status === 'Sent').length;

  // Find leads that haven't been contacted in 15 days and are not closed/lost
  const decayThresholdDays = 15;
  const today = new Date();
  const decayingLeads = leads.filter(lead => {
    if (lead.status === 'Closed' || lead.status === 'Lost') return false;
    const lastContact = new Date(lead.lastContacted);
    const diffTime = Math.abs(today.getTime() - lastContact.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= decayThresholdDays;
  });

  // Native HTML5 Drag and Drop Handlers for Rescheduling
  const handleDragStart = (e: React.DragEvent, id: string, type: 'appointment' | 'reminder') => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ id, type }));
  };

  const handleDrop = (e: React.DragEvent, targetDate: string) => {
    e.preventDefault();
    try {
      const payload = JSON.parse(e.dataTransfer.getData('text/plain'));
      if (payload.type === 'reminder') {
        onRescheduleReminder(payload.id, targetDate);
      } else if (payload.type === 'appointment') {
        onRescheduleAppointment(payload.id, targetDate);
      }
    } catch (err) {
      // ignore JSON parse failures or bad drops
    }
  };

  // Generate a rolling 14-day view around today
  const calendarDays = useMemo(() => {
    const daysList = [];
    const base = new Date();
    // Start 2 days in the past to show complete local calendar context
    base.setDate(base.getDate() - 2);
    for (let i = 0; i < 14; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const dateString = d.toISOString().split('T')[0];
      daysList.push({
        dateString,
         dayName: d.toLocaleDateString(undefined, { weekday: 'short' }),
        dayNum: d.getDate(),
        monthName: d.toLocaleDateString(undefined, { month: 'short' }),
        isToday: d.toDateString() === new Date().toDateString(),
      });
    }
    return daysList;
  }, []);

  // Dynamic Source Distribution Data Model for Recharts PieChart
  const sourceData = useMemo(() => {
    const defaultSources = ['Website Form', 'API Integration', 'Manual Entry'];
    const counts: Record<string, { count: number; value: number }> = {};
    
    // Initialize default categories with 0 to ensure beautiful complete chart view even if no values exist yet
    defaultSources.forEach(src => {
      counts[src] = { count: 0, value: 0 };
    });

    leads.forEach(lead => {
      const src = lead.source || 'Website Form';
      if (!counts[src]) {
        counts[src] = { count: 0, value: 0 };
      }
      counts[src].count += 1;
      counts[src].value += lead.value || 0;
    });

    return Object.entries(counts)
      .map(([name, data]) => ({
        name,
        value: data.count,
        valueAmount: data.value,
      }))
      .filter(item => item.value > 0 || defaultSources.includes(item.name)); // keep standard sources even if 0
  }, [leads]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans">
      {decayingLeads.length > 0 && (
        <div id="decay-warning-banner" className="bg-amber-50 border border-amber-200 p-5 rounded-2xl flex items-start gap-3.5 text-xs text-amber-850 animate-in slide-in-from-top-4 duration-300 shadow-sm">
          <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5 animate-pulse" size={18} />
          <div>
            <span className="font-extrabold uppercase text-amber-850 tracking-wider text-[10px] block mb-0.5">⚠️ LIVE LEAD DECAY WARNING</span>
            <p className="font-semibold text-slate-750 leading-relaxed font-sans">
              <strong className="text-amber-900 font-bold">{decayingLeads.length} active leads</strong> ({decayingLeads.map(l => l.name).join(', ')}) haven't been contacted for more than {decayThresholdDays} days and show signs of cooling off. The monitoring engine has automatically triggered re-engagement advisory tasks on your dashboard below.
            </p>
          </div>
        </div>
      )}

      {/* Concept Explainer: Non-replacement Enhancer mask */}
      <div className="bg-gradient-to-r from-indigo-50 via-blue-50/50 to-indigo-50 border border-indigo-100 p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
        <div className="space-y-2 max-w-3xl">
          <div className="flex items-center gap-2 text-indigo-800">
            <Sparkles className="text-indigo-600 animate-pulse" size={20} />
            <h2 className="text-sm font-extrabold uppercase tracking-wider">The Intelligent CRM Enhancer Mask</h2>
          </div>
          <h3 className="text-xl font-extrabold text-slate-800 leading-snug">
            Supercharging Your Existing Workflow with Zero Migration Overhead
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Nexus CRM doesn't ask you to migrate. It acts as an active <strong className="text-slate-800 font-semibold">AI operations layer mask</strong> over your current or future CRM system. It instantly enhances static records with predictive scoring and sentiment tags, models inflow trends, schedules follow-up alerts, and activates the conversational <strong className="text-slate-800 font-semibold">AI Copilot Smart Bot</strong> to execute CRM database updates automatically.
          </p>
        </div>

        <div className="flex flex-col gap-2.5 w-full md:w-auto flex-shrink-0 bg-white/80 backdrop-blur p-4 rounded-xl border border-indigo-100/50 shadow-sm text-xs">
          <div className="font-extrabold text-slate-800 border-b border-slate-100 pb-1 flex items-center justify-between gap-6">
            <span>UNIFYING OVERLAYS:</span>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-700 px-1.5 py-0.5 rounded-full font-bold">100% Active</span>
          </div>
          <div className="space-y-2.5 mt-1 font-medium text-slate-650">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
              <span>Enhanced AI Scoring & Sentiment</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
              <span>Predictive Inflow Charting & Trends</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
              <span>Automated Email Client & Agenda Sync</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
              <span>Text-to-Action Copilot Updates</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={<Users className="text-blue-600" size={24} />}
          label="Total Leads"
          value={leads.length.toString()}
          trend="+12% from last week"
        />
        <StatCard 
          icon={<DollarSign className="text-green-600" size={24} />}
          label="Pipeline Value"
          value={`$${totalValue.toLocaleString()}`}
          trend="+8% from last month"
        />
        <StatCard 
          icon={<Target className="text-indigo-600" size={24} />}
          label="Avg. AI Score"
          value={avgScore.toString()}
          trend="Real-time predictive analysis"
        />
        <StatCard 
          icon={<TrendingUp className="text-orange-600" size={24} />}
          label="Qualified Rate"
          value={`${Math.round((qualifiedLeads / leads.length) * 100 || 0)}%`}
          trend="Converting steadily"
        />
      </div>

      {/* Main charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-semibold text-slate-800">Lead Inflow Trend</h3>
            <select className="bg-slate-50 border-none text-sm text-slate-500 rounded-lg outline-none cursor-pointer p-1">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} 
                />
                <Area type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-8">Status Breakdown</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} width={80} />
                <Tooltip cursor={{fill: 'transparent'}} />
                <Bar dataKey="count" fill="#4f46e5" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Channels & Lead Sources Distribution Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Pie Chart Card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors duration-300 flex flex-col h-[380px]">
          <div className="space-y-1 mb-4">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-650"></span>
              Lead Source Distribution
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Distribution of incoming channel sources</p>
          </div>
          
          <div className="flex-1 min-h-[220px] relative flex items-center justify-center">
            {leads.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500 italic">No lead data to display</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sourceData}
                    cx="50%"
                    cy="45%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {sourceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                      border: 'none', 
                      borderRadius: '12px', 
                      color: '#fff',
                      fontSize: '11px',
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                    }} 
                    formatter={(value, name) => [`${value} leads`, name]}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: '10px' }}
                    formatter={(value) => (
                      <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 font-sans">
                        {value}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Channels Effectiveness Index Board */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors duration-300 flex flex-col h-[380px] justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/85 pb-3">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Target size={18} className="text-emerald-500" />
                Channel Effectiveness & Pipeline Value
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium font-sans">
                Real-time tracking of deal volume and average qualification rating across acquisition streams.
              </p>
            </div>
            <span className="hidden sm:inline-block text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold px-2 py-0.5 rounded-full font-mono uppercase">
              ACTIVE MATRIX
            </span>
          </div>

          <div className="flex-1 overflow-y-auto py-4 space-y-3">
            {sourceData.map((data, index) => {
              const matchedLeads = leads.filter(l => (l.source || 'Website Form') === data.name);
              const totalValueAmount = matchedLeads.reduce((sum, l) => sum + (l.value || 0), 0);
              const avgAIScore = matchedLeads.length > 0 
                ? Math.round(matchedLeads.reduce((sum, l) => sum + (l.aiScore || 0), 0) / matchedLeads.length)
                : 0;
              const color = COLORS[index % COLORS.length];

              return (
                <div key={data.name} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: color }}></div>
                    <div>
                      <h4 className="text-xs font-black text-slate-800 dark:text-slate-100">{data.name}</h4>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                        {data.value} {data.value === 1 ? 'active lead' : 'active leads'} registered
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 sm:gap-10">
                    <div className="text-right">
                      <span className="block text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Pipeline Vol</span>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-100">${totalValueAmount.toLocaleString()}</span>
                    </div>

                    <div className="text-right">
                      <span className="block text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Avg AI Score</span>
                      <span className={`text-xs font-black ${avgAIScore > 70 ? 'text-green-500' : avgAIScore > 40 ? 'text-orange-500' : 'text-red-500'}`}>
                        {avgAIScore}%
                      </span>
                    </div>

                    <div className="hidden sm:block text-right">
                      <span className="block text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Channel Status</span>
                      <span className="inline-flex items-center gap-1 text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded font-extrabold uppercase animate-pulse">
                        High Yield
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 font-medium">
            <span>Aggregated across {leads.length} leads in current CRM ledger.</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1 cursor-pointer hover:underline">
              View reports <ArrowUpRight size={12} />
            </span>
          </div>
        </div>
      </div>

      {/* Dynamic Revenue Projections Modeling */}
      <RevenueForecast leads={leads} />

      {/* Multi-Representative Performance metrics */}
      <RepPerformanceChart />

      {/* Bento CRM Operations Center: 3 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Reminders Column */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col h-[380px]">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Bell className="text-indigo-600" size={18} />
              <h3 className="font-bold text-slate-800">Active Reminders</h3>
            </div>
            <span className="text-xs bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded-full">
              {reminders.filter(r => !r.completed).length} active
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {reminders.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs py-8">
                <CheckCircle size={32} className="text-slate-300 mb-2" />
                No pending reminders.
              </div>
            ) : (
              reminders.map(reminder => (
                <div 
                  key={reminder.id} 
                  className={`p-3 rounded-xl border transition-all flex gap-3 ${
                    reminder.completed 
                      ? 'border-slate-100 bg-slate-50/50 opacity-60' 
                      : 'border-slate-100 bg-slate-50 hover:border-indigo-100'
                  }`}
                >
                  <button 
                    onClick={() => onToggleReminder(reminder.id)}
                    className="mt-0.5 text-slate-400 hover:text-indigo-600 transition-colors flex-shrink-0"
                  >
                    {reminder.completed ? (
                      <CheckCircle size={18} className="text-green-600 fill-green-50 animate-in zoom-in duration-200" />
                    ) : (
                      <Circle size={18} />
                    )}
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium text-slate-700 leading-normal ${reminder.completed ? 'line-through text-slate-400' : ''}`}>
                      {reminder.text}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400 font-semibold">
                      <Clock size={10} />
                      <span className={new Date(reminder.dueDate) < new Date() && !reminder.completed ? 'text-red-500' : ''}>
                        {reminder.dueDate}
                      </span>
                      {reminder.leadName && (
                        <>
                          <span>•</span>
                          <span className="text-indigo-600 truncate max-w-[100px]">{reminder.leadName}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <button 
                    onClick={() => onDeleteReminder(reminder.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 self-center"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Appointments Column */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col h-[380px]">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Calendar className="text-indigo-600" size={18} />
              <h3 className="font-bold text-slate-800">Meetings Calendar</h3>
            </div>
            <span className="text-xs bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full z-10">
              {appointments.length} upcoming
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {appointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs py-8">
                <Calendar size={32} className="text-slate-300 mb-2" />
                No scheduled meetings.
              </div>
            ) : (
              appointments.map(appointment => (
                <div 
                  key={appointment.id} 
                  className="p-3 bg-indigo-50/40 rounded-xl border border-indigo-50 hover:border-indigo-100 transition-all flex items-start gap-3 relative group"
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-600/10 text-indigo-700 font-bold text-xs uppercase flex flex-col items-center justify-center leading-none flex-shrink-0">
                    <span className="text-[10px]">{new Date(appointment.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                    <span className="text-sm font-extrabold">{new Date(appointment.date).getDate() || '--'}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-800 truncate">{appointment.title}</h4>
                    {appointment.description && (
                      <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1 leading-relaxed">
                        {appointment.description}
                      </p>
                    )}
                    <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-indigo-600 font-bold">
                      <Clock size={10} />
                      <span>{appointment.time}</span>
                      {appointment.leadName && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-600 font-medium truncate max-w-[90px]">{appointment.leadName}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <button 
                    onClick={() => onDeleteAppointment(appointment.id)}
                    className="p-1 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 self-center"
                    title="Cancel Meeting"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Email Follow-ups Column */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col h-[380px]">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Mail className="text-indigo-600" size={18} />
              <h3 className="font-bold text-slate-800">Email Follow-ups</h3>
            </div>
            <span className="text-xs bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-full">
              {drafts.length + scheduled.length} templates
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {emails.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs py-8">
                <Mail size={32} className="text-slate-300 mb-2" />
                No follow-ups recorded yet.
              </div>
            ) : (
              emails.map(email => (
                <div 
                  key={email.id} 
                  className={`p-3 rounded-xl border transition-all flex flex-col relative group ${
                    email.status === 'Sent' 
                      ? 'bg-slate-50 border-slate-100 opacity-60' 
                      : email.status === 'Scheduled'
                      ? 'bg-amber-50/30 border-amber-100 hover:border-amber-200'
                      : 'bg-indigo-50/20 border-indigo-100 hover:border-indigo-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-indigo-700 truncate max-w-[120px]">
                      To: {email.leadName}
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                      email.status === 'Sent' 
                        ? 'bg-green-100 text-green-800' 
                        : email.status === 'Scheduled'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-indigo-100 text-indigo-800'
                    }`}>
                      {email.status}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-800 truncate mb-1">{email.subject}</h4>
                  <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed whitespace-pre-wrap mb-2">
                    {email.body}
                  </p>

                  <div className="flex items-center justify-between mt-1 pt-1.5 border-t border-slate-100/50">
                    <span className="text-[9px] text-slate-400">
                      {email.status === 'Scheduled' && email.scheduledDate ? `Send date: ${email.scheduledDate}` : 'Ready for delivery'}
                    </span>
                    
                    <div className="flex gap-1">
                      {email.status !== 'Sent' && (
                        <button 
                          onClick={() => onSendEmail(email.id)}
                          className="flex items-center gap-1 text-[9px] font-extrabold bg-indigo-600 text-white px-2 py-0.5 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                          title="Send Email"
                        >
                          <Send size={8} /> Save/Send
                        </button>
                      )}
                      <button 
                        onClick={() => onDeleteEmail(email.id)}
                        className="p-0.5 text-slate-400 hover:text-red-500 rounded hover:bg-slate-100"
                        title="Delete draft"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Global Drag-and-Drop Calendar Scheduler */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
              <Calendar size={18} />
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100">Interactive Rescheduling Workspace</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-450 font-medium">
              Global unified pipeline calendar. Drag and drop any reminder (🔔) or appointment (📅) log node directly into other target daily calendars to reschedule instantly.
            </p>
          </div>
          <div className="flex items-center gap-2 text-[10px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 font-bold px-2.5 py-1 rounded-full border border-indigo-100/50 dark:border-indigo-900/40">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse"></span>
            Drag & Drop Workspace Enabled
          </div>
        </div>

        {/* Calendar Grid of 14 Days */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {calendarDays.map((calDay) => {
            const dayReminders = reminders.filter(r => r.dueDate === calDay.dateString);
            const dayAppointments = appointments.filter(a => a.date === calDay.dateString);
            const totalItemsCount = dayReminders.length + dayAppointments.length;

            return (
              <div
                key={calDay.dateString}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, calDay.dateString)}
                className={`min-h-[140px] rounded-2xl border p-3 flex flex-col justify-between transition-all group/cell ${
                  calDay.isToday
                    ? 'bg-indigo-50/30 dark:bg-indigo-950/20 border-indigo-500 dark:border-indigo-805/60 ring-2 ring-indigo-500/10'
                    : 'bg-slate-50/50 dark:bg-slate-950/10 border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700'
                }`}
              >
                {/* Cell Header */}
                <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-100 dark:border-slate-800">
                  <span className={`text-[10px] font-black uppercase ${calDay.isToday ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-400 dark:text-slate-505'}`}>
                    {calDay.dayName}
                  </span>
                  <div className="flex items-center gap-1">
                    {calDay.isToday && (
                      <span className="text-[8px] bg-indigo-600 text-white font-extrabold px-1 rounded uppercase tracking-wider scale-90">LIVE</span>
                    )}
                    <span className={`text-xs font-black font-mono ${calDay.isToday ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-300'}`}>
                      {calDay.dayNum}
                    </span>
                  </div>
                </div>

                {/* Items container */}
                <div className="flex-1 space-y-1.5 overflow-y-auto max-h-[110px] pr-0.5">
                  {totalItemsCount === 0 ? (
                    <div className="h-full flex items-center justify-center text-[9px] text-slate-350 dark:text-slate-650 italic font-medium py-4 text-center">
                      Empty
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {/* Render Appointments */}
                      {dayAppointments.map(app => (
                        <div
                          key={app.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, app.id, 'appointment')}
                          className="p-1.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/40 rounded-lg text-[9.5px]/tight font-bold text-amber-800 dark:text-amber-300 cursor-grab hover:bg-amber-100 dark:hover:bg-amber-900/40 active:cursor-grabbing hover:scale-[1.01] active:opacity-50 transition-all flex items-start gap-1"
                          title={`Meeting: ${app.title} (${app.time})`}
                        >
                          <span className="mt-0.5 flex-shrink-0">📅</span>
                          <span className="truncate">{app.title}</span>
                        </div>
                      ))}

                      {/* Render Reminders */}
                      {dayReminders.map(rem => (
                        <div
                          key={rem.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, rem.id, 'reminder')}
                          className={`p-1.5 border rounded-lg text-[9.5px]/tight font-bold cursor-grab active:cursor-grabbing hover:scale-[1.01] active:opacity-50 transition-all flex items-start gap-1 ${
                            rem.completed
                              ? 'bg-slate-100 dark:bg-slate-800/40 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-800 line-through'
                              : 'bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300 border-indigo-100/50 dark:border-indigo-900/40 hover:bg-indigo-100/50 dark:hover:bg-indigo-950/40'
                          }`}
                          title={`Action Alert: ${rem.text}`}
                        >
                          <span className="mt-0.5 flex-shrink-0">🔔</span>
                          <span className="truncate">{rem.text}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Micro Tag count */}
                <div className="mt-2 text-[8px] text-slate-400 dark:text-slate-500 font-mono font-bold flex justify-between">
                  <span>{calDay.monthName}</span>
                  {totalItemsCount > 0 && <span>{totalItemsCount} logs</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};

const StatCard: React.FC<{ icon: React.ReactNode, label: string, value: string, trend: string }> = ({ icon, label, value, trend }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 group hover:border-indigo-200 transition-colors">
    <div className="flex items-center gap-4 mb-4">
      <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <h4 className="text-2xl font-bold text-slate-900">{value}</h4>
      </div>
    </div>
    <p className="text-xs text-slate-400 font-medium">{trend}</p>
  </div>
);

export default Dashboard;

