import React, { useState, useEffect } from 'react';
import { 
  Bell, BellOff, Settings, Sparkles, Sliders, Play, CheckCircle, 
  AlertTriangle, UserPlus, Calendar, Mail, HeartCrack, Flame, Check, 
  HelpCircle, Info, Smartphone, Eye, Volume2, ShieldCheck, RefreshCw, X,
  Plus, Trash2, Edit3, Folder
} from 'lucide-react';

interface AlertPreferences {
  browserPushEnabled: boolean;
  missedAppointments: boolean;
  newLeads: boolean;
  leadDecay: boolean;
  sentimentDrop: boolean;
  smsOverride: boolean;
  soundAlerts: boolean;
}

interface SettingsMenuProps {
  onSavePreferences?: (prefs: AlertPreferences) => void;
  initialPrefs?: AlertPreferences;
}

// Simulated Toast style log entry
interface ToastLog {
  id: string;
  title: string;
  message: string;
  type: 'appointment' | 'lead' | 'decay' | 'system';
  timestamp: string;
}

const DEFAULT_PREFERENCES: AlertPreferences = {
  browserPushEnabled: false,
  missedAppointments: true,
  newLeads: true,
  leadDecay: true,
  sentimentDrop: true,
  smsOverride: false,
  soundAlerts: true
};

export interface EmailTemplate {
  id: string;
  name: string;
  category: 'Re-engagement' | 'Onboarding' | 'Follow-up' | 'Objection';
  subject: string;
  body: string;
}

const DEFAULT_TEMPLATES: EmailTemplate[] = [
  {
    id: 'temp-1',
    name: 'Ghost Lead Re-engagement Pilot',
    category: 'Re-engagement',
    subject: 'Stalled flow: Custom sandbox trial review for {{company}}',
    body: 'Hi {{name}},\n\nOur system detected that your team’s custom CRM overlay trial has been quiet for some days. I wanted to touch base to see if we could set up a 10-minute walk-through of the predictive dashboard trends?\n\nWarmly,\n{{agent}}'
  },
  {
    id: 'temp-2',
    name: 'Objection Handle: Price is High',
    category: 'Objection',
    subject: 'Regarding budget constraints & overlay ROI value',
    body: 'Hi {{name}},\n\nI wanted to follow up on our discussion regarding budget constraints. Nexus sits directly on top of your existing database, recovering up to 24% of stalled pipeline leads in the first 30 days without expensive migration. Let me know if you would like to run a free 5-minute overlay simulation.\n\nBest,\n{{agent}}'
  },
  {
    id: 'temp-3',
    name: 'Onboarding Welcome Sequence',
    category: 'Onboarding',
    subject: 'Welcome to Nexus Autopilot: Active CRM Onboarding',
    body: 'Hi {{name}},\n\nWelcome to your new Helix & Nexus CRM overlay! We have successfully mounted the AI intelligence shell. Your leads are now active for continuous scoring, automatic draft follow-ups, and sentiment reviews.\n\nCheers,\n{{agent}}'
  },
  {
    id: 'temp-4',
    name: 'Consultation Session Follow-up',
    category: 'Follow-up',
    subject: 'Summary review of your consultation session',
    body: 'Hi {{name}},\n\nIt was great speaking with you and the {{company}} team today. I have attached the customized roof-replacement proposal summary we discussed. Let me know what time works best next week to finalize details.\n\nSincerely,\n{{agent}}'
  }
];

export const SettingsMenu: React.FC<SettingsMenuProps> = ({ onSavePreferences, initialPrefs }) => {
  const [prefs, setPrefs] = useState<AlertPreferences>(initialPrefs || DEFAULT_PREFERENCES);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [cooldownTiming, setCooldownTiming] = useState<'immediate' | '15mins' | 'hourly' | 'daily'>('immediate');
  const [decayThresholdDays, setDecayThresholdDays] = useState<number>(3);
  const [phNo, setPhNo] = useState<string>('+1 (555) 304-4903');
  const [isSaved, setIsSaved] = useState<boolean>(false);

  // Email Templates Management States
  const [templates, setTemplates] = useState<EmailTemplate[]>(() => {
    const saved = localStorage.getItem('nexus_crm_email_templates');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback to defaults
      }
    }
    return DEFAULT_TEMPLATES;
  });

  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [isCreatingTemplate, setIsCreatingTemplate] = useState<boolean>(false);
  
  // New template form states
  const [tempName, setTempName] = useState('');
  const [tempCategory, setTempCategory] = useState<'Re-engagement' | 'Onboarding' | 'Follow-up' | 'Objection'>('Re-engagement');
  const [tempSubject, setTempSubject] = useState('');
  const [tempBody, setTempBody] = useState('');

  const saveTemplatesToStorage = (updated: EmailTemplate[]) => {
    setTemplates(updated);
    localStorage.setItem('nexus_crm_email_templates', JSON.stringify(updated));
  };

  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempName || !tempSubject || !tempBody) return;
    
    const newTemplate: EmailTemplate = {
      id: editingTemplate ? editingTemplate.id : `temp-${Date.now()}`,
      name: tempName,
      category: tempCategory,
      subject: tempSubject,
      body: tempBody
    };

    let updated;
    if (editingTemplate) {
      updated = templates.map(t => t.id === editingTemplate.id ? newTemplate : t);
    } else {
      updated = [...templates, newTemplate];
    }

    saveTemplatesToStorage(updated);
    
    // Reset state
    setEditingTemplate(null);
    setIsCreatingTemplate(false);
    setTempName('');
    setTempSubject('');
    setTempBody('');
  };

  const handleEditClick = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setTempName(template.name);
    setTempCategory(template.category);
    setTempSubject(template.subject);
    setTempBody(template.body);
    setIsCreatingTemplate(true);
  };

  const handleDeleteTemplate = (id: string) => {
    const updated = templates.filter(t => t.id !== id);
    saveTemplatesToStorage(updated);
  };
  
  // Simulated Toast Tracker State
  const [simulatedToasts, setSimulatedToasts] = useState<ToastLog[]>([]);

  useEffect(() => {
    // Check original browser support for Notification API
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const requestBrowserPermission = async () => {
    if (!('Notification' in window)) {
      triggerSimulatedToast('System Error', 'Web notifications are not supported in this client environment.', 'system');
      return;
    }
    
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === 'granted') {
        setPrefs(prev => ({ ...prev, browserPushEnabled: true }));
        triggerSimulatedToast('Success', 'Browser push notifications successfully authorized!', 'system');
      } else {
        setPrefs(prev => ({ ...prev, browserPushEnabled: false }));
        triggerSimulatedToast('Permission Blocked', 'Authorization declined. Falling back to clean in-dashboard simulated toasts.', 'system');
      }
    } catch (err) {
      console.warn("Iframe notification request restricted:", err);
      triggerSimulatedToast('Iframe Restriction', 'Browser blocked cross-origin sandbox request. Initialized adaptive web socket logging.', 'system');
    }
  };

  const togglePreference = (key: keyof AlertPreferences) => {
    setPrefs(prev => {
      const next = { ...prev, [key]: !prev[key] };
      
      // If turning on browser push, verify permission
      if (key === 'browserPushEnabled' && next.browserPushEnabled) {
        if ('Notification' in window && Notification.permission !== 'granted') {
          // Trigger browser prompt asynchronously
          requestBrowserPermission();
        }
      }
      
      return next;
    });
  };

  // Triggers an impressive real notification of choice or elegant toast fallback
  const triggerSimulatedToast = (title: string, message: string, type: 'appointment' | 'lead' | 'decay' | 'system') => {
    const newLog: ToastLog = {
      id: `toast-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      title,
      message,
      type,
      timestamp: new Date().toLocaleTimeString()
    };
    
    setSimulatedToasts(prev => [newLog, ...prev].slice(0, 5)); // Keep last 5

    // Play default notification sound simulation if active
    if (prefs.soundAlerts) {
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        // Brief pleasant high frequency chime 
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(620, audioCtx.currentTime); // Chime 1
        gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.12);
      } catch (e) {
        // AudioContext browser restrictions ignored
      }
    }

    // Try HTML5 Browser Notification if permitted and configured
    if (prefs.browserPushEnabled && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(`Nexus CRM: ${title}`, {
          body: message,
          tag: 'nexus-alert-matrix'
        });
      } catch (e) {
        console.warn("Browser Notification instantiation bypassed inside sandbox.", e);
      }
    }
  };

  // Test notification actions from the client sandbox
  const handleTestNotification = (testType: 'appointment' | 'lead' | 'decay') => {
    if (testType === 'appointment') {
      if (!prefs.missedAppointments) {
        alert("Action Locked: Alerts for 'Missed Appointments' are currently disabled in your configurations toggle above!");
        return;
      }
      triggerSimulatedToast(
        "⚠️ Missed Appointment Warning",
        "Lead Marcus Brody did not connect for Florida Restoration Review. Automated Re-Engage Autopilot sequence deployed.",
        "appointment"
      );
    } else if (testType === 'lead') {
      if (!prefs.newLeads) {
        alert("Action Locked: Alerts for 'New Lead Assignments' are currently disabled in your configurations toggle!");
        return;
      }
      triggerSimulatedToast(
        "⚡ New Lead Overlay Inflow",
        "Assigned 40 Squares shingle replacement lead 'Sarah Connor' from Orlando storms cell to your pipeline.",
        "lead"
      );
    } else if (testType === 'decay') {
      if (!prefs.leadDecay) {
        alert("Action Locked: Alerts for 'Lead Decay warnings' are disabled.");
        return;
      }
      triggerSimulatedToast(
        "❄️ Critical Lead Decay Flag",
        `John Doe has remained untouched for exceeding ${decayThresholdDays} days. High probability of silent transition code.`,
        "decay"
      );
    }
  };

  const handleSaveChanges = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSavePreferences) {
      onSavePreferences(prefs);
    }
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const clearToastLogs = () => {
    setSimulatedToasts([]);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto">
      
      {/* Settings Top Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-8 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-1/3 h-full bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 z-10 relative">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-indigo-500/20 text-indigo-300 font-bold px-3 py-1 rounded-full text-xs font-mono">
              <Sliders size={14} className="text-indigo-400" />
              <span>NEXUS ALERT SYSTEM MANAGEMENT</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight">AI Assistant Settings</h2>
            <p className="text-slate-400 text-sm max-w-xl leading-relaxed">
              Design and balance your real-time notification environment. Control push parameters, customize decay warning nodes, and execute sandbox validation alerts.
            </p>
          </div>

          <div className="flex items-center gap-2.5 bg-slate-800/80 backdrop-blur border border-slate-700/80 p-4.5 rounded-2xl">
            <Bell className="text-indigo-400 animate-bounce" size={20} />
            <div>
              <span className="text-[10px] uppercase font-black text-slate-400 block tracking-wider">Browser Authorization</span>
              <span className="text-xs text-white font-mono font-extrabold">
                {notificationPermission === 'granted' ? '✅ Push Authorized' : notificationPermission === 'denied' ? '❌ Push Blocked' : 'ℹ️ Prompt Pending'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSaveChanges} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Columns - Toggles and Config inputs */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Section 1: Core Target Push Alerts */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Bell className="text-indigo-600" size={18} />
              <h3 className="font-bold text-slate-800">Target Push Notifications</h3>
            </div>
            
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Enabling push allow the Nexus Overlay client layer to deliver high-importance updates directly to your OS system tray or browser bar.
            </p>

            <div className="space-y-4.5 pt-2">
              
              {/* Push Switch 1 */}
              <div id="settings-push-toggle" className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-800">Global Browser Push-Style Notifications</span>
                    {notificationPermission === 'denied' && (
                      <span className="text-[9px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-black font-mono">Blocked by browser</span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 block leading-tight">Prompt the browser to secure direct OS tray push notification access.</span>
                </div>
                <button
                  type="button"
                  id="btn-toggle-push"
                  onClick={() => togglePreference('browserPushEnabled')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                    prefs.browserPushEnabled ? 'bg-indigo-600' : 'bg-slate-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      prefs.browserPushEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Toggle 2: Missed Appointments */}
              <div id="settings-appointment-toggle" className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="text-indigo-600" size={14} />
                    <span className="text-xs font-bold text-slate-800">Missed Appointment Incidents</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block leading-tight">Alert immediately when an scheduled lead consultation bypasses their call target.</span>
                </div>
                <button
                  type="button"
                  id="btn-toggle-appointments"
                  onClick={() => togglePreference('missedAppointments')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                    prefs.missedAppointments ? 'bg-indigo-600' : 'bg-slate-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      prefs.missedAppointments ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Toggle 3: New Lead Assignments */}
              <div id="settings-deal-toggle" className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <UserPlus className="text-emerald-600" size={14} />
                    <span className="text-xs font-bold text-slate-800">New Lead Assignment & Onboarding</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block leading-tight">Ping immediately when third-party CRM APIs assign fresh lead nodes.</span>
                </div>
                <button
                  type="button"
                  id="btn-toggle-leads"
                  onClick={() => togglePreference('newLeads')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                    prefs.newLeads ? 'bg-indigo-600' : 'bg-slate-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      prefs.newLeads ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Toggle 4: Lead Decay Warnings */}
              <div id="settings-decay-toggle" className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <Flame className="text-rose-600" size={14} />
                    <span className="text-xs font-bold text-slate-800">Lead Decay & Cold-Stall warnings</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block leading-tight">Emit alerts when the inactivity counters exceed threshold specifications.</span>
                </div>
                <button
                  type="button"
                  id="btn-toggle-decay"
                  onClick={() => togglePreference('leadDecay')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                    prefs.leadDecay ? 'bg-indigo-600' : 'bg-slate-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      prefs.leadDecay ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Toggle 5: Tone Chime Sound */}
              <div id="settings-sound-toggle" className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <Volume2 className="text-slate-500" size={14} />
                    <span className="text-xs font-bold text-slate-800">Acoustic Logic Chime (Sound alerts)</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block leading-tight">Play a gentle high-fidelity dynamic sine-wave audio frequency tone on updates.</span>
                </div>
                <button
                  type="button"
                  id="btn-toggle-sound"
                  onClick={() => togglePreference('soundAlerts')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                    prefs.soundAlerts ? 'bg-indigo-600' : 'bg-slate-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      prefs.soundAlerts ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

            </div>
          </div>

          {/* Section 2: Fine-Tuning Advanced Alert Threshold Variables */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Sliders className="text-indigo-600" size={18} />
              <h3 className="font-bold text-slate-800">Interval Threshold Variables</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              
              {/* Cooldown timing selector */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-500 uppercase">Alert aggregation rate</label>
                <select
                  value={cooldownTiming}
                  onChange={(e) => setCooldownTiming(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 rounded-lg p-3 outline-none"
                >
                  <option value="immediate">Continuous Immediate Dispatch</option>
                  <option value="15mins">Every 15 Minutes Buffer</option>
                  <option value="hourly">Hourly Collective Brief</option>
                  <option value="daily">Daily Summary Dashboard report</option>
                </select>
                <span className="text-[10px] text-slate-400 block leading-tight mt-1">
                  Stabilizes frequent alerts. Recommended: Continuous Immediate.
                </span>
              </div>

              {/* Threshold numeric range */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-black text-slate-500 uppercase">Cold Decay threshold period</label>
                  <span className="text-xs font-mono font-extrabold text-indigo-600 pr-1">{decayThresholdDays} Days</span>
                </div>
                <input 
                  type="range"
                  min="1"
                  max="7"
                  value={decayThresholdDays}
                  onChange={(e) => setDecayThresholdDays(Number(e.target.value))}
                  className="w-full h-1 bg-slate-250 cursor-pointer accent-indigo-600 rounded-lg"
                />
                <span className="text-[10px] text-slate-400 block leading-tight">
                  Flag leads as Decaying if untouched for this many days.
                </span>
              </div>

              {/* SMS Alert preferences */}
              <div className="space-y-1.5 md:col-span-2 p-3.5 bg-indigo-50/20 border border-indigo-150/20 rounded-xl">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-1.5">
                    <Smartphone className="text-indigo-600" size={14} />
                    <span className="text-xs font-bold text-slate-800">Critical Priority SMS Overlay Sync</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => togglePreference('smsOverride')}
                    className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none ${
                      prefs.smsOverride ? 'bg-indigo-600' : 'bg-slate-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                        prefs.smsOverride ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 leading-normal mb-2">
                  When enabled, extreme-risk threats (like immediate missed board appointments) trigger SMS alert texts to your handheld.
                </p>
                {prefs.smsOverride && (
                  <input
                    type="text"
                    value={phNo}
                    onChange={(e) => setPhNo(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="px-3 py-1.5 border border-slate-200 font-mono text-xs rounded-lg bg-white outline-none focus:ring-1 focus:ring-indigo-500 w-full md:w-1/2"
                  />
                )}
              </div>

            </div>
          </div>

          {/* Form Actions footer */}
          <div className="flex justify-end gap-3">
            {isSaved && (
              <span className="text-xs text-green-600 bg-green-50 px-3.5 py-2.5 rounded-lg font-bold flex items-center gap-1 animate-pulse border border-green-200">
                <CheckCircle size={14} /> System alert preferences deployed successfully!
              </span>
            )}
            <button
              type="submit"
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-md"
            >
              Deploy Alert Preferences
            </button>
          </div>

        </div>

        {/* Right Sandbox Column - Playground Live Tester */}
        <div className="space-y-6">
          
          <div className="bg-slate-900 border border-slate-800 text-white p-6 rounded-2xl shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="text-white animate-spin" size={16} />
                <h3 className="font-extrabold text-sm text-slate-200 uppercase tracking-wide">Validation Sandbox</h3>
              </div>
              <span className="text-[9px] bg-indigo-500/10 text-indigo-300 font-bold px-2 py-0.5 rounded border border-indigo-500/20">Active Log</span>
            </div>

            <p className="text-xs text-slate-400 font-sans leading-relaxed">
              Test your current browser notification configurations instantly inside the sandboxed environment.
            </p>

            <div className="space-y-2.5 pt-1.5">
              
              <button
                type="button"
                id="btn-test-appointment"
                onClick={() => handleTestNotification('appointment')}
                className="w-full text-left p-3.5 rounded-xl bg-slate-850 hover:bg-slate-800 text-xs font-bold transition-all flex items-center justify-between gap-4 border border-slate-800"
              >
                <div className="flex items-center gap-2">
                  <Calendar className="text-indigo-400" size={14} />
                  <span>Test Missed Appointment Warning</span>
                </div>
                <Play className="text-slate-400" size={12} />
              </button>

              <button
                type="button"
                id="btn-test-lead"
                onClick={() => handleTestNotification('lead')}
                className="w-full text-left p-3.5 rounded-xl bg-slate-850 hover:bg-slate-800 text-xs font-bold transition-all flex items-center justify-between gap-4 border border-slate-800"
              >
                <div className="flex items-center gap-2">
                  <UserPlus className="text-emerald-400" size={14} />
                  <span>Test New Lead Assignment Chime</span>
                </div>
                <Play className="text-slate-400" size={12} />
              </button>

              <button
                type="button"
                id="btn-test-decay"
                onClick={() => handleTestNotification('decay')}
                className="w-full text-left p-3.5 rounded-xl bg-slate-850 hover:bg-slate-800 text-xs font-bold transition-all flex items-center justify-between gap-4 border border-slate-800"
              >
                <div className="flex items-center gap-2">
                  <Flame className="text-rose-450 text-rose-400" size={14} />
                  <span>Test Lead Decay Alert Tag</span>
                </div>
                <Play className="text-slate-400" size={12} />
              </button>

            </div>
          </div>

          {/* Sandbox Simulated Notifications Logs */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <Eye className="text-slate-600" size={16} />
                <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Device Alert Log</h4>
              </div>
              {simulatedToasts.length > 0 && (
                <button 
                  type="button" 
                  onClick={clearToastLogs}
                  className="text-[9px] text-slate-400 hover:text-slate-650 font-bold border-b border-dotted"
                >
                  Clear Logs
                </button>
              )}
            </div>

            {simulatedToasts.length === 0 ? (
              <div className="py-8 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-400 font-medium">
                No active tests initialized. Click alert testing triggers above to generate simulated push chimes.
              </div>
            ) : (
              <div className="space-y-3 max-h-[290px] overflow-y-auto">
                {simulatedToasts.map((toast) => (
                  <div 
                    key={toast.id}
                    className="p-3 bg-slate-900 text-slate-100 rounded-xl text-[11px] leading-normal font-sans border border-slate-800 shadow-sm flex items-start gap-2.5 animate-in slide-in-from-top-2 duration-250 relative group"
                  >
                    <div className="mt-0.5">
                      {toast.type === 'appointment' ? (
                        <div className="w-4 h-4 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">⚠️</div>
                      ) : toast.type === 'lead' ? (
                        <div className="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">⚡</div>
                      ) : toast.type === 'decay' ? (
                        <div className="w-4 h-4 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold">❄️</div>
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold">ℹ️</div>
                      )}
                    </div>
                    
                    <div className="flex-1 space-y-0.5 pr-4">
                      <div className="flex items-center justify-between">
                        <strong className="text-xs text-white block">{toast.title}</strong>
                        <span className="text-[8px] text-slate-500 font-mono font-medium">{toast.timestamp}</span>
                      </div>
                      <p className="text-[10.5px] text-slate-400 leading-normal">{toast.message}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSimulatedToasts(prev => prev.filter(t => t.id !== toast.id))}
                      className="absolute right-2 top-2 p-0.5 rounded text-slate-500 hover:text-white hover:bg-slate-850 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex items-start gap-2 text-[10px] text-slate-500 bg-slate-50 p-3 rounded-lg leading-relaxed">
              <Info size={14} className="text-slate-400 flex-shrink-0 mt-0.5" />
              <span>
                Simulated logs mirror how the system passes notification payloads to operating system background services inside true standalone CRM setups.
              </span>
            </div>

          </div>
        </div>

      </form>

      {/* Email Template Management Section */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-300">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-150 dark:border-slate-800 mb-6">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-1">
              <Mail className="text-indigo-600 dark:text-indigo-400 animate-pulse" size={18} />
              <h3 className="font-extrabold uppercase text-xs tracking-wider">Follow-up Automation Assets</h3>
            </div>
            <h4 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">AI Email Templates Manager</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Create, save, and categorize reusable templates. These templates are dynamically pulled in by the AI follow-up system.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditingTemplate(null);
              setTempName(''); 
              setTempCategory('Re-engagement');
              setTempSubject('');
              setTempBody('');
              setIsCreatingTemplate(prev => !prev);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md self-start md:self-auto cursor-pointer"
          >
            {isCreatingTemplate && !editingTemplate ? <X size={14} /> : <Plus size={14} />}
            {isCreatingTemplate && !editingTemplate ? 'Close Editor' : 'Create Template'}
          </button>
        </div>

        {/* Create/Edit Template panel inside list */}
        {isCreatingTemplate && (
          <div className="mb-8 p-6 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-200/80 dark:border-slate-800 animate-in slide-in-from-top-4 duration-300">
            <h5 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">{editingTemplate ? '📝 Edit Email Template' : '✨ Design New Email Template'}</h5>
            <form onSubmit={handleSaveTemplate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">Template Name</label>
                  <input
                    type="text"
                    required
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    placeholder="e.g. Price Objection - Mid-tier ROI"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 text-slate-900 dark:text-slate-100 rounded-xl px-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-sans"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">Category Group</label>
                  <select
                    value={tempCategory}
                    onChange={(e) => setTempCategory(e.target.value as any)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 text-slate-900 dark:text-slate-100 rounded-xl px-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-semibold"
                  >
                    <option value="Re-engagement">Re-engagement</option>
                    <option value="Onboarding">Onboarding</option>
                    <option value="Follow-up">Follow-up</option>
                    <option value="Objection">Objection</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">Subject Line</label>
                <input
                  type="text"
                  required
                  value={tempSubject}
                  onChange={(e) => setTempSubject(e.target.value)}
                  placeholder="e.g. Strategic expansion upgrade for {{company}}"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 text-slate-900 dark:text-slate-100 rounded-xl px-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-sans"
                />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">Email Body Content</label>
                  <span className="text-[9px] text-slate-400 font-mono">Variables: {'{{name}}'}, {'{{company}}'}, {'{{agent}}'}</span>
                </div>
                <textarea
                  rows={5}
                  required
                  value={tempBody}
                  onChange={(e) => setTempBody(e.target.value)}
                  placeholder="Hi {{name}},&#10;&#10;Our systems show that your roof consultation stalled. Let's touch base soon!&#10;&#10;Best,&#10;{{agent}}"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 text-slate-900 dark:text-slate-100 rounded-xl px-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-sans whitespace-pre-wrap"
                />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingTemplate(false);
                    setEditingTemplate(null);
                  }}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-450 font-medium rounded-xl text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  Deploy Template
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filter Categories Selector */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {['All', 'Re-engagement', 'Onboarding', 'Follow-up', 'Objection'].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeCategory === cat
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Templates grid list */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {templates.filter(t => activeCategory === 'All' || t.category === activeCategory).length === 0 ? (
            <div className="md:col-span-2 py-12 text-center bg-slate-50/50 dark:bg-slate-950/20 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-400 dark:text-slate-500 font-medium">
              No custom templates configured for "{activeCategory}". Click "Create Template" to add one!
            </div>
          ) : (
            templates.filter(t => activeCategory === 'All' || t.category === activeCategory).map((template) => (
              <div
                key={template.id}
                className="bg-slate-50/40 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                      template.category === 'Re-engagement'
                        ? 'bg-blue-50/60 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/40'
                        : template.category === 'Objection'
                        ? 'bg-rose-50/60 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/40'
                        : template.category === 'Onboarding'
                        ? 'bg-green-50/60 dark:bg-green-950/30 text-green-600 dark:text-green-400 border-green-100 dark:border-green-900/40'
                        : 'bg-amber-50/60 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/40'
                    }`}>
                      {template.category}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleEditClick(template)}
                        className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-all cursor-pointer"
                        title="Edit Template"
                      >
                        <Edit3 size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-all cursor-pointer"
                        title="Delete Template"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <h5 className="text-sm font-bold text-slate-800 dark:text-slate-150 leading-snug">{template.name}</h5>
                    <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold truncate">
                      <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 mr-1.5 inline-block">Subject:</span>
                      {template.subject}
                    </p>
                  </div>
                  
                  <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-150 dark:border-slate-800/80 font-sans font-medium line-clamp-4 whitespace-pre-wrap">
                    {template.body}
                  </p>
                </div>
                
                <div className="text-[9px] text-slate-400 dark:text-slate-500 font-mono font-medium border-t border-slate-100 dark:border-slate-800/60 pt-2 flex justify-between">
                  <span>ID: {template.id}</span>
                  <span>CRM Asset</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
};

export default SettingsMenu;
