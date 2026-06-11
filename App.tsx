
import React, { useState, useEffect, useCallback } from 'react';
import { LayoutGrid, Users, Link, MessageSquare, Plus, Search, Filter, TrendingUp, Mail, Phone, ChevronRight, Zap, Sparkles, Compass, Settings, Sun, Moon } from 'lucide-react';
import { Lead, Activity, DashboardStats, Reminder, Appointment, EmailFollowUp } from './types';
import Dashboard from './components/Dashboard';
import LeadList from './components/LeadList';
import IntegrationCode from './components/IntegrationCode';
import AIChat from './components/AIChat';
import PredictiveHub from './components/PredictiveHub';
import RoofingSuite from './components/RoofingSuite';
import SettingsMenu from './components/SettingsMenu';
import { analyzeLead } from './services/geminiService';
import WorkflowBuilder, { WorkflowRule } from './components/WorkflowBuilder';

const INITIAL_LEADS: Lead[] = [
  {
    id: '1',
    name: 'Sarah Connor',
    email: 'sarah@cyberdyne.com',
    company: 'Resistance Co',
    status: 'Qualified',
    priority: 'High',
    source: 'Website Form',
    value: 5000,
    lastContacted: '2024-03-20',
    notes: ['Interested in long-term security systems', 'High priority'],
    aiScore: 85,
    aiInsight: 'Highly likely to convert within 30 days.',
    sentiment: 'Positive'
  },
  {
    id: '2',
    name: 'John Doe',
    email: 'john@startup.io',
    company: 'QuickStart Inc',
    status: 'New',
    priority: 'Medium',
    source: 'API Integration',
    value: 1200,
    lastContacted: '2024-03-24',
    notes: ['Inquired via landing page widget'],
    aiScore: 45,
    aiInsight: 'Early stage interest, needs nurturing.',
    sentiment: 'Neutral'
  }
];

const INITIAL_REMINDERS: Reminder[] = [
  {
    id: 'rem-1',
    leadId: '1',
    leadName: 'Sarah Connor',
    text: 'Follow up with Sarah Connor on long-term security integration systems proposal',
    dueDate: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString().split('T')[0], // 2 days from now
    completed: false,
    timestamp: '2026-06-10T04:00:00Z'
  },
  {
    id: 'rem-2',
    leadId: '2',
    leadName: 'John Doe',
    text: 'Prepare technical setup widget code guidelines',
    dueDate: new Date(Date.now() + 4 * 24 * 3600 * 1000).toISOString().split('T')[0], // 4 days from now
    completed: true,
    timestamp: '2026-06-08T10:00:00Z'
  }
];

const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: 'app-1',
    leadId: '1',
    leadName: 'Sarah Connor',
    title: 'Security Architecture Consultation',
    description: 'Detailed security system audit and initial timeline planning.',
    date: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString().split('T')[0], // 5 days from now
    time: '14:30',
    timestamp: '2026-06-10T11:00:00Z'
  },
  {
    id: 'app-2',
    leadId: '2',
    leadName: 'John Doe',
    title: 'CRM Widget Setup & Demo',
    description: 'Walkthrough of live API dashboard and landing widgets integration.',
    date: new Date(Date.now() + 8 * 24 * 3600 * 1000).toISOString().split('T')[0], // 8 days from now
    time: '10:00 AM',
    timestamp: '2026-06-10T12:30:00Z'
  }
];

const INITIAL_EMAILS: EmailFollowUp[] = [
  {
    id: 'em-1',
    leadId: '1',
    leadName: 'Sarah Connor',
    recipientEmail: 'sarah@cyberdyne.com',
    subject: 'Proposing dates for our Security Consult - Nexus CRM',
    body: 'Hi Sarah,\n\nI hope you are doing well! Based on your interest in our premium security integration, I would love to schedule a consult call to discuss your long-term requirements. Let me know if tomorrow at 2 PM works.\n\nBest regards,\nNexus Team',
    status: 'Sent',
    timestamp: '2026-06-10T14:00:00Z'
  },
  {
    id: 'em-2',
    leadId: '2',
    leadName: 'John Doe',
    recipientEmail: 'john@startup.io',
    subject: 'Setup Guide: Landing Page Widgets for Nexus CRM',
    body: 'Hello John,\n\nThanks for reaching out! To get started with the Nexus CRM landing page widget, you will just need to drop the integration script into your HTML. Let\'s schedule some time tomorrow to walk through it together.\n\nWarmly,\nNexus Support',
    status: 'Draft',
    timestamp: '2026-06-10T15:30:00Z'
  }
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'leads' | 'integration' | 'chat' | 'predictive' | 'roofing' | 'settings' | 'workflows'>('dashboard');
  const [maskedCRM, setMaskedCRM] = useState<'Salesforce' | 'HubSpot' | 'Pipedrive' | 'Legacy Custom'>('Salesforce');
  const [leads, setLeads] = useState<Lead[]>(INITIAL_LEADS);
  const [reminders, setReminders] = useState<Reminder[]>(INITIAL_REMINDERS);
  const [appointments, setAppointments] = useState<Appointment[]>(INITIAL_APPOINTMENTS);
  const [emails, setEmails] = useState<EmailFollowUp[]>(INITIAL_EMAILS);
  const [isAddingLead, setIsAddingLead] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('theme') === 'dark';
  });
  const [isQuickNoteOpen, setIsQuickNoteOpen] = useState(false);
  const [lastActiveLeadId, setLastActiveLeadId] = useState<string | null>(() => {
    return INITIAL_LEADS.length > 0 ? INITIAL_LEADS[0].id : null;
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setIsQuickNoteOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const [workflowRules, setWorkflowRules] = useState<WorkflowRule[]>([
    {
      id: 'rule-1',
      name: 'Appointment No-Show Recovery',
      trigger: 'missed_appointment',
      action: 'create_followup',
      isActive: true,
      description: 'Lead misses an appointment ➔ Draft automated follow-up email'
    },
    {
      id: 'rule-2',
      name: 'High Value Lead Push',
      trigger: 'high_value',
      action: 'create_reminder',
      isActive: true,
      description: 'Lead value exceeds $5,000 ➔ Create high-priority dashboard reminder'
    },
    {
      id: 'rule-3',
      name: 'Silent Client Warm-up',
      trigger: 'decay_detected',
      action: 'create_followup',
      isActive: true,
      description: 'Lead decay exceeds 7 days silent ➔ Draft automated follow-up email'
    }
  ]);

  const handleAddLead = (newLead: Partial<Lead>) => {
    const lead: Lead = {
      id: Math.random().toString(36).substr(2, 9),
      name: newLead.name || 'Unknown',
      email: newLead.email || '',
      company: newLead.company || 'Unknown',
      status: 'New',
      priority: newLead.priority || 'Medium',
      source: 'Manual Entry',
      value: newLead.value || 0,
      lastContacted: new Date().toISOString().split('T')[0],
      notes: [],
      ...newLead
    } as Lead;
    
    setLeads(prev => [lead, ...prev]);
    setIsAddingLead(false);
    triggerAIAnalysis(lead.id);
  };

  const handleSelectLead = useCallback((id: string) => {
    setLastActiveLeadId(id);
  }, []);

  const triggerAIAnalysis = async (id: string) => {
    setIsAnalyzing(true);
    setLastActiveLeadId(id);
    const lead = leads.find(l => l.id === id);
    if (lead) {
      const result = await analyzeLead(lead);
      setLeads(prev => prev.map(l => l.id === id ? { ...l, aiScore: result.score, aiInsight: result.insight, sentiment: result.sentiment as any } : l));
    }
    setIsAnalyzing(false);
  };

  const updateLeadStatus = useCallback((id: string, status: Lead['status']) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
    setLastActiveLeadId(id);
  }, []);

  const updateLeadPriority = useCallback((id: string, priority: Lead['priority']) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, priority } : l));
    setLastActiveLeadId(id);
  }, []);

  const handleDeleteLeads = useCallback((ids: string[]) => {
    setLeads(prev => {
      const remaining = prev.filter(l => !ids.includes(l.id));
      setLastActiveLeadId(activeId => {
        if (activeId && ids.includes(activeId)) {
          return remaining.length > 0 ? remaining[0].id : null;
        }
        return activeId;
      });
      return remaining;
    });
  }, []);

  const handleBulkUpdateStatus = useCallback((ids: string[], status: Lead['status']) => {
    setLeads(prev => prev.map(l => ids.includes(l.id) ? { ...l, status } : l));
  }, []);

  const handleBulkUpdatePriority = useCallback((ids: string[], priority: Lead['priority']) => {
    setLeads(prev => prev.map(l => ids.includes(l.id) ? { ...l, priority } : l));
  }, []);

  const updateLeadStatusByName = useCallback((name: string, status: Lead['status']) => {
    setLeads(prev => {
      const matched = prev.find(l => l.name.toLowerCase().includes(name.toLowerCase()));
      if (matched) {
        setLastActiveLeadId(matched.id);
      }
      return prev.map(l => l.name.toLowerCase().includes(name.toLowerCase()) ? { ...l, status } : l);
    });
  }, []);

  const handleAddLeadNote = useCallback((id: string, note: string) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, notes: [...l.notes, note], lastContacted: new Date().toISOString().split('T')[0] } : l));
    setLastActiveLeadId(id);
  }, []);

  const handleAddReminder = useCallback((reminder: Omit<Reminder, 'id' | 'timestamp'>) => {
    const newReminder: Reminder = {
      ...reminder,
      id: `rem-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    };
    setReminders(prev => [newReminder, ...prev]);
  }, []);

  const handleToggleReminder = useCallback((id: string) => {
    setReminders(prev => prev.map(r => r.id === id ? { ...r, completed: !r.completed } : r));
  }, []);

  const handleDeleteReminder = useCallback((id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id));
  }, []);

  const handleAddAppointment = useCallback((appointment: Omit<Appointment, 'id' | 'timestamp'>) => {
    const newAppointment: Appointment = {
      ...appointment,
      id: `app-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    };
    setAppointments(prev => [newAppointment, ...prev]);
  }, []);

  const handleDeleteAppointment = useCallback((id: string) => {
    setAppointments(prev => prev.filter(a => a.id !== id));
  }, []);

  const handleAddEmail = useCallback((email: Omit<EmailFollowUp, 'id' | 'timestamp'>) => {
    const newEmail: EmailFollowUp = {
      ...email,
      id: `em-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    };
    setEmails(prev => [newEmail, ...prev]);
  }, []);

  const handleSendEmail = useCallback((id: string) => {
    setEmails(prev => prev.map(e => e.id === id ? { ...e, status: 'Sent' } : e));
  }, []);

  const handleDeleteEmail = useCallback((id: string) => {
    setEmails(prev => prev.filter(e => e.id !== id));
  }, []);

  const handleRescheduleReminder = useCallback((id: string, newDate: string) => {
    setReminders(prev => prev.map(r => r.id === id ? { ...r, dueDate: newDate } : r));
  }, []);

  const handleRescheduleAppointment = useCallback((id: string, newDate: string) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, date: newDate } : a));
  }, []);

  const handleAddRule = useCallback((rule: Omit<WorkflowRule, 'id'>) => {
    const newRule: WorkflowRule = {
      ...rule,
      id: `rule-${Math.random().toString(36).substr(2, 9)}`
    };
    setWorkflowRules(prev => [...prev, newRule]);
  }, []);

  const handleToggleRule = useCallback((id: string) => {
    setWorkflowRules(prev => prev.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r));
  }, []);

  const handleDeleteRule = useCallback((id: string) => {
    setWorkflowRules(prev => prev.filter(r => r.id !== id));
  }, []);

  const handleSimulateRule = useCallback((ruleId: string, leadId: string) => {
    const rule = workflowRules.find(r => r.id === ruleId);
    const lead = leads.find(l => l.id === leadId);
    if (!rule || !lead) return;

    if (rule.action === 'create_followup') {
      const subject = `[Nexus Autopilot Recovery] Follow-up for ${lead.company}`;
      const body = `Hi ${lead.name},\n\nWe noticed some silence regarding our communication with ${lead.company}. Let's jump on a quick sync next week to review requirements!\n\nBest regards,\nAutomated Success Team`;
      
      const newEmail: EmailFollowUp = {
        id: `em-wf-${Math.random().toString(36).substr(2, 9)}`,
        leadId: lead.id,
        leadName: lead.name,
        recipientEmail: lead.email,
        subject,
        body,
        status: 'Draft',
        timestamp: new Date().toISOString()
      };
      setEmails(prev => [newEmail, ...prev]);
    } else if (rule.action === 'create_reminder') {
      const newReminder: Reminder = {
        id: `rem-wf-${Math.random().toString(36).substr(2, 9)}`,
        leadId: lead.id,
        leadName: lead.name,
        text: `⚡ [High-Priority] Workflow "${rule.name}" triggered: Follow up on ${lead.name} (${lead.company}) immediately!`,
        dueDate: new Date().toISOString().split('T')[0],
        completed: false,
        timestamp: new Date().toISOString()
      };
      setReminders(prev => [newReminder, ...prev]);
    }
  }, [workflowRules, leads]);

  // Lead Decay Detection Engine
  useEffect(() => {
    const decayThresholdDays = 15;
    const today = new Date();

    setReminders(prevReminders => {
      const newDecayReminders: Reminder[] = [];
      
      leads.forEach(lead => {
        if (lead.status === 'Closed' || lead.status === 'Lost') return;

        const lastContact = new Date(lead.lastContacted);
        const diffTime = Math.abs(today.getTime() - lastContact.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays >= decayThresholdDays) {
          const hasDecayReminder = prevReminders.some(
            r => r.leadId === lead.id && r.text.includes('[Cold Lead Decay Alert]')
          );

          if (!hasDecayReminder) {
            newDecayReminders.push({
              id: `rem-decay-${lead.id}`,
              leadId: lead.id,
              leadName: lead.name,
              text: `⚠️ [Cold Lead Decay Alert]: No interaction with ${lead.name} (${lead.company}) for ${diffDays} days! Send email follow-up.`,
              dueDate: today.toISOString().split('T')[0],
              completed: false,
              timestamp: today.toISOString()
            });
          }
        }
      });

      if (newDecayReminders.length > 0) {
        return [...newDecayReminders, ...prevReminders];
      }
      return prevReminders;
    });
  }, [leads]);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col transition-all duration-300">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Zap className="text-white fill-white" size={24} />
          </div>
          <span className="text-xl font-bold tracking-tight">Nexus CRM</span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          <NavItem 
            icon={<LayoutGrid size={20} />} 
            label="Dashboard" 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
          />
          <NavItem 
            icon={<TrendingUp size={20} />} 
            label="Predictive AI" 
            active={activeTab === 'predictive'} 
            onClick={() => setActiveTab('predictive')} 
          />
          <NavItem 
            icon={<Compass size={20} />} 
            label="Roofing Suite" 
            active={activeTab === 'roofing'} 
            onClick={() => setActiveTab('roofing')} 
          />
          <NavItem 
            icon={<Users size={20} />} 
            label="Leads" 
            active={activeTab === 'leads'} 
            onClick={() => setActiveTab('leads')} 
          />
          <NavItem 
            icon={<Link size={20} />} 
            label="API & Analytics" 
            active={activeTab === 'integration'} 
            onClick={() => setActiveTab('integration')} 
          />
          <NavItem 
            icon={<MessageSquare size={20} />} 
            label="AI Assistant" 
            active={activeTab === 'chat'} 
            onClick={() => setActiveTab('chat')} 
          />
          <NavItem 
            icon={<Zap size={20} />} 
            label="Workflow Builder" 
            active={activeTab === 'workflows'} 
            onClick={() => setActiveTab('workflows')} 
          />
          <NavItem 
            icon={<Settings size={20} />} 
            label="Settings" 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')} 
          />
        </nav>

        <div className="p-4 bg-slate-800/50 rounded-lg m-4 border border-slate-700/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-xs font-medium text-slate-400">API Gateway Status: Live</span>
          </div>
          <div className="text-[10px] text-slate-500 font-mono break-all opacity-50">
            key_active: prd_8x99...
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 z-10 transition-colors duration-300">
          <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100 capitalize">{activeTab === 'integration' ? 'API & Analytics Suite' : activeTab}</h1>
          
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
              <input 
                type="text" 
                placeholder="Search leads, companies..." 
                className="pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-transparent dark:border-slate-700 rounded-full text-sm w-64 focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-indigo-500/40 transition-all outline-none placeholder-slate-400 dark:placeholder-slate-500"
              />
            </div>
            
            {/* Elegant Global Dark/Light Theme Toggle */}
            <button 
              onClick={() => setIsDarkMode(prev => !prev)}
              aria-label="Toggle theme color"
              className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full hover:bg-slate-250 dark:hover:bg-slate-700 transition-all outline-none border border-transparent dark:border-slate-700"
              title={isDarkMode ? 'Activate Light Mode' : 'Activate Dark Mode'}
            >
              {isDarkMode ? <Sun size={18} className="text-yellow-400 fill-yellow-400" /> : <Moon size={18} className="text-slate-700 dark:text-indigo-400" />}
            </button>

            <button 
              onClick={() => setIsQuickNoteOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-transparent dark:border-slate-700 rounded-lg text-sm font-medium transition-all hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
              title="Add Quick Note (Cmd/Ctrl + N)"
            >
              <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[9px] font-mono font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded shadow-xs text-slate-500">⌘N</kbd>
              <span>Quick Note</span>
            </button>

            <button 
              onClick={() => setIsAddingLead(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              <Plus size={18} />
              Add Lead
            </button>
          </div>
        </header>

        {/* Nexus CRM Smart Overlay Mask HUD */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white border-b border-indigo-500/15 px-8 py-3 flex flex-wrap items-center justify-between gap-4 shadow-sm z-10 transition-all duration-300">
          <div className="flex items-center gap-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <div className="flex flex-col md:flex-row md:items-center gap-1.5 md:gap-3">
              <span className="text-[11px] font-black tracking-wider text-indigo-400 uppercase">AI Overlay Active</span>
              <span className="hidden md:inline text-slate-600">|</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-300 font-medium font-sans">Underlying CRM Node:</span>
                <select 
                  value={maskedCRM} 
                  onChange={(e) => setMaskedCRM(e.target.value as any)}
                  className="bg-indigo-950/80 border border-indigo-500/35 text-[11px] font-semibold text-emerald-400 rounded-lg px-2.5 py-1 outline-none cursor-pointer hover:bg-indigo-950 transition-colors shadow-sm focus:ring-1 focus:ring-emerald-400/50"
                >
                  <option value="Salesforce">Salesforce Core Sync</option>
                  <option value="HubSpot">HubSpot Enterprise</option>
                  <option value="Pipedrive">Pipedrive Pipeline</option>
                  <option value="Legacy Custom">Legacy Custom DB</option>
                </select>
              </div>
            </div>
          </div>

          {/* Quick Stats of the Mask Enhancement Layer */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
            <div className="flex items-center gap-1.5" title="Gemini-3.5 Auto Scoring & Sentiment Analyser">
              <span className="text-[10px] uppercase font-bold text-slate-400">AI Logic:</span>
              <span className="text-[10px] bg-slate-800 text-slate-200 px-2 py-0.5 rounded-full font-semibold border border-slate-700/50">Gemini 3.5 Engine</span>
            </div>
            
            <div className="flex items-center gap-1.5" title="Reminders, Meetings & Scheduled follow-ups synchronizing smoothly">
              <span className="text-[10px] uppercase font-bold text-slate-400">Analytics:</span>
              <span className="text-[10px] bg-emerald-950/40 text-emerald-300 px-2 py-0.5 rounded-full font-semibold border border-emerald-500/20">Auto Trends Active</span>
            </div>

            <div className="flex items-center gap-1.5" title="CRM smart assistant ready to execute records creation, reminders, and mailer drafts">
              <span className="text-[10px] uppercase font-bold text-slate-400">Automation:</span>
              <span className="text-[10px] bg-indigo-950/40 text-indigo-300 px-2 py-0.5 rounded-full font-semibold border border-indigo-500/20">Copilot Bot Active</span>
            </div>

            <div className="hidden lg:flex items-center gap-1 text-[10px] font-mono text-slate-500">
              <span>Latency:</span>
              <span className="text-emerald-400 font-bold">12ms</span>
              <span>• SECURE MASK LAYER</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          {activeTab === 'dashboard' && (
            <Dashboard 
              leads={leads} 
              reminders={reminders}
              appointments={appointments}
              emails={emails}
              onToggleReminder={handleToggleReminder}
              onDeleteReminder={handleDeleteReminder}
              onDeleteAppointment={handleDeleteAppointment}
              onSendEmail={handleSendEmail}
              onDeleteEmail={handleDeleteEmail}
              onRescheduleReminder={handleRescheduleReminder}
              onRescheduleAppointment={handleRescheduleAppointment}
            />
          )}
          {activeTab === 'predictive' && (
            <PredictiveHub 
              leads={leads}
              onAddReminder={handleAddReminder}
              onAddEmail={handleAddEmail}
            />
          )}
          {activeTab === 'roofing' && (
            <RoofingSuite 
              leads={leads}
              onAddReminder={handleAddReminder}
              onAddEmail={handleAddEmail}
            />
          )}
          {activeTab === 'leads' && (
            <LeadList 
              leads={leads} 
              appointments={appointments}
              emails={emails}
              onUpdateStatus={updateLeadStatus} 
              onUpdatePriority={updateLeadPriority}
              onReAnalyze={triggerAIAnalysis}
              isAnalyzing={isAnalyzing}
              onSelectLead={handleSelectLead}
              onAddAppointment={handleAddAppointment}
              onAddEmail={handleAddEmail}
              onAddLeadNote={handleAddLeadNote}
              onDeleteLeads={handleDeleteLeads}
              onBulkUpdateStatus={handleBulkUpdateStatus}
              onBulkUpdatePriority={handleBulkUpdatePriority}
            />
          )}
          {activeTab === 'integration' && <IntegrationCode />}
          {activeTab === 'settings' && (
            <SettingsMenu />
          )}
          {activeTab === 'chat' && (
            <AIChat 
              leads={leads} 
              reminders={reminders}
              appointments={appointments}
              emails={emails}
              onAddReminder={handleAddReminder}
              onAddAppointment={handleAddAppointment}
              onAddEmail={handleAddEmail}
              onUpdateLeadStatus={updateLeadStatus}
              onUpdateLeadStatusByName={updateLeadStatusByName}
              onAddLeadNote={handleAddLeadNote}
            />
          )}
          {activeTab === 'workflows' && (
            <WorkflowBuilder 
              leads={leads}
              rules={workflowRules}
              onAddRule={handleAddRule}
              onToggleRule={handleToggleRule}
              onDeleteRule={handleDeleteRule}
              onSimulateRule={handleSimulateRule}
            />
          )}
        </div>


        {/* Add Lead Modal */}
        {isAddingLead && (
          <div className="fixed inset-0 bg-black/45 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md p-8 border border-transparent dark:border-slate-800 transition-all duration-300">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6 font-sans">Create New Lead</h2>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleAddLead({
                  name: formData.get('name') as string,
                  email: formData.get('email') as string,
                  company: formData.get('company') as string,
                  value: Number(formData.get('value')),
                  priority: formData.get('priority') as 'High' | 'Medium' | 'Low',
                });
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-350 mb-1 font-sans">Full Name</label>
                  <input name="name" required className="w-full px-4 py-2 border border-slate-200 dark:border-slate-705 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none" placeholder="e.g. Jane Smith" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-350 mb-1 font-sans">Email Address</label>
                  <input name="email" type="email" required className="w-full px-4 py-2 border border-slate-200 dark:border-slate-705 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none" placeholder="jane@company.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-350 mb-1 font-sans">Company</label>
                  <input name="company" required className="w-full px-4 py-2 border border-slate-200 dark:border-slate-705 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none" placeholder="Acme Inc" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-350 mb-1 font-sans">Estimated Value ($)</label>
                  <input name="value" type="number" required className="w-full px-4 py-2 border border-slate-200 dark:border-slate-705 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none" placeholder="1000" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-350 mb-1 font-sans">Lead Priority</label>
                  <select name="priority" className="w-full px-4 py-2 border border-slate-200 dark:border-slate-705 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none cursor-pointer">
                    <option value="High">🔥 High Priority</option>
                    <option value="Medium" selected>⚡ Medium Priority</option>
                    <option value="Low">💤 Low Priority</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setIsAddingLead(false)}
                    className="flex-1 py-2 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-md"
                  >
                    Create Lead
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Global Quick-Add Note Modal */}
        {isQuickNoteOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg p-6 border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200 transition-all">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                  <Sparkles size={20} className="animate-pulse" />
                  <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 font-sans">Quick-Add Lead Note</h2>
                </div>
                <button 
                  onClick={() => setIsQuickNoteOpen(false)}
                  className="p-1 px-1.5 text-xs font-mono text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-150 dark:border-slate-700"
                  title="Close (Esc)"
                >
                  ESC
                </button>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const leadId = formData.get('leadId') as string;
                const noteContent = formData.get('noteContent') as string;
                if (leadId && noteContent.trim()) {
                  handleAddLeadNote(leadId, noteContent.trim());
                  setIsQuickNoteOpen(false);
                }
              }} className="space-y-4">
                
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Target Lead</label>
                  {leads.length === 0 ? (
                    <p className="text-xs text-rose-500 font-semibold font-sans">No leads available to append a note.</p>
                  ) : (
                    <select
                      name="leadId"
                      value={lastActiveLeadId || leads[0]?.id}
                      onChange={(e) => setLastActiveLeadId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-805 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-semibold"
                    >
                      {leads.map((lead) => (
                        <option key={lead.id} value={lead.id}>
                          {lead.name} {lead.company ? `(${lead.company})` : ''} {lead.id === lastActiveLeadId ? '🕒 [Recently Active]' : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Note Content</label>
                    <span className="text-[10px] text-slate-400 font-mono">Press <kbd className="bg-slate-100 dark:bg-slate-805 px-1 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-[9px]">⌘+Enter</kbd> to quick-save</span>
                  </div>
                  <textarea
                    name="noteContent"
                    required
                    placeholder="Type client phone call update, deal objection details, or pipeline status context..."
                    className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-slate-250 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-sans whitespace-pre-wrap"
                    rows={6}
                    autoFocus
                    onKeyDown={(e) => {
                      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                        e.preventDefault();
                        const form = e.currentTarget.form;
                        if (form) {
                          const submitEvent = new Event('submit', { cancelable: true, bubbles: true });
                          form.dispatchEvent(submitEvent);
                        }
                      }
                    }}
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-0.5 rounded-full">
                    Shortcut: Cmd/Ctrl + N
                  </span>
                  
                  <div className="flex gap-3">
                    <button 
                      type="button" 
                      onClick={() => setIsQuickNoteOpen(false)}
                      className="px-4 py-2 text-slate-600 dark:text-slate-400 font-bold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-xs border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={leads.length === 0}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold rounded-lg text-xs tracking-wider transition-all shadow-md uppercase cursor-pointer"
                    >
                      Append Note
                    </button>
                  </div>
                </div>

              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const NavItem: React.FC<{ icon: React.ReactNode, label: string, active?: boolean, onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
      active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'
    }`}
  >
    {icon}
    {label}
  </button>
);

export default App;
