import React, { useState } from 'react';
import { Zap, GitBranch, Play, Trash2, Plus, PhoneCall, Mail, Layers, Activity, CheckCircle, Check, HelpCircle, FileText } from 'lucide-react';
import { Lead } from '../types';

export interface WorkflowRule {
  id: string;
  name: string;
  trigger: string;
  action: string;
  isActive: boolean;
  description: string;
}

interface WorkflowBuilderProps {
  leads: Lead[];
  rules: WorkflowRule[];
  onAddRule: (rule: Omit<WorkflowRule, 'id'>) => void;
  onToggleRule: (id: string) => void;
  onDeleteRule: (id: string) => void;
  onSimulateRule: (ruleId: string, leadId: string) => void;
}

const TRIGGER_OPTIONS = [
  { value: 'missed_appointment', label: 'Lead misses an appointment' },
  { value: 'status_qualified', label: 'Lead status changes to "Qualified"' },
  { value: 'high_value', label: 'Lead value exceeds $5,000' },
  { value: 'decay_detected', label: 'Lead decay exceeds 7 days silent' },
  { value: 'new_lead_added', label: 'New lead added to system' }
];

const ACTION_OPTIONS = [
  { value: 'trigger_sms', label: 'Trigger automated SMS notification' },
  { value: 'create_followup', label: 'Draft automated follow-up email' },
  { value: 'create_reminder', label: 'Create high-priority dashboard reminder' },
  { value: 'slack_ping', label: 'Post secure alert to Slack sales channel' }
];

const WorkflowBuilder: React.FC<WorkflowBuilderProps> = ({
  leads,
  rules,
  onAddRule,
  onToggleRule,
  onDeleteRule,
  onSimulateRule
}) => {
  const [name, setName] = useState('');
  const [trigger, setTrigger] = useState(TRIGGER_OPTIONS[0].value);
  const [action, setAction] = useState(ACTION_OPTIONS[0].value);
  const [simulationLeadId, setSimulationLeadId] = useState(leads[0]?.id || '');
  const [activeTab, setActiveTab] = useState<'rules' | 'history'>('rules');
  const [simLogs, setSimLogs] = useState<{ id: string; time: string; text: string; details: string }[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const selectedTrigger = TRIGGER_OPTIONS.find(t => t.value === trigger)?.label || trigger;
    const selectedAction = ACTION_OPTIONS.find(a => a.value === action)?.label || action;

    onAddRule({
      name: name.trim(),
      trigger,
      action,
      isActive: true,
      description: `${selectedTrigger} ➔ ${selectedAction}`
    });

    setName('');
    // Push a log
    const logId = Math.random().toString(36).substr(2, 5);
    setSimLogs(prev => [
      {
        id: logId,
        time: new Date().toLocaleTimeString(),
        text: `Rule Created: "${name.trim()}"`,
        details: `Configured to execute '${selectedAction}' automatically when '${selectedTrigger}' occurs.`
      },
      ...prev
    ]);
  };

  const handleSimulate = (ruleId: string) => {
    if (!simulationLeadId) return;
    const rule = rules.find(r => r.id === ruleId);
    const lead = leads.find(l => l.id === simulationLeadId);
    if (!rule || !lead) return;

    onSimulateRule(rule.id, lead.id);

    // Create a local timeline log
    const selectedTrigger = TRIGGER_OPTIONS.find(t => t.value === rule.trigger)?.label || rule.trigger;
    const selectedAction = ACTION_OPTIONS.find(a => a.value === rule.action)?.label || rule.action;

    const logId = Math.random().toString(36).substr(2, 5);
    let outDetails = `Simulated trigger for ${lead.name} (${lead.company}). \nAction dispatched: `;
    if (rule.action === 'trigger_sms') {
      outDetails += `SMS ping sent to +1-555-0199: "[Nexus Autopilot] Alert: ${lead.name} requires follow up."`;
    } else if (rule.action === 'create_followup') {
      outDetails += `Draft email created in CRM Emails for ${lead.name} regarding workflow trigger.`;
    } else if (rule.action === 'create_reminder') {
      outDetails += `Reminders engine appended a new priority checkbox callback to the dashboard.`;
    } else if (rule.action === 'slack_ping') {
      outDetails += `Secure webhook payload requested to sales Slack channel feed.`;
    }

    setSimLogs(prev => [
      {
        id: logId,
        time: new Date().toLocaleTimeString(),
        text: `⚡ Workflow Rule Fired: "${rule.name}"`,
        details: outDetails
      },
      ...prev
    ]);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans">
      {/* Informational banner and logic rules representation */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2 text-indigo-400">
            <Zap className="text-indigo-400 animate-pulse fill-indigo-400" size={20} />
            <h2 className="text-xs font-black uppercase tracking-widest font-mono">Real-Time Autopilot Automation</h2>
          </div>
          <h3 className="text-xl font-extrabold text-slate-100 leading-snug">
            Intelligent Trigger-Action Workflow Builder
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed font-medium">
            Define custom automated sequences targeting lead behaviors. Nexus watches the engagement logs, scores, and calendars, firing instant webhook signals, SMS notifications, and system entries the second criteria matches.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-3 border border-white/15 text-xs flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold border border-indigo-500/20">
            <GitBranch size={16} />
          </div>
          <div>
            <div className="font-bold text-slate-100">Workflow Node</div>
            <div className="text-[10px] text-indigo-300 font-mono">rules_matched_today: 14</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Rule Creation form */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-6">
              <Plus className="text-slate-800" size={20} />
              <h4 className="text-base font-bold text-slate-800">Create Automation Rule</h4>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-widest mb-1.5 font-mono">
                  Rule Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Appointment No-Show Recovery"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 outline-none text-xs text-slate-700 font-medium placeholder-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-widest mb-1.5 font-mono">
                  Trigger Condition (When)
                </label>
                <select
                  value={trigger}
                  onChange={(e) => setTrigger(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs text-slate-705 font-bold cursor-pointer hover:bg-slate-100"
                >
                  {TRIGGER_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-widest mb-1.5 font-mono">
                  Automated Action (Then)
                </label>
                <select
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs text-slate-705 font-bold cursor-pointer hover:bg-slate-100"
                >
                  {ACTION_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-indigo-600/10 flex items-center justify-center gap-2"
              >
                <Layers size={14} /> Add Active Rule
              </button>
            </form>
          </div>

          {/* SIMULATION BENCH PANEL */}
          <div className="bg-slate-950 text-slate-200 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-rose-400">
              <Activity size={18} />
              <h4 className="text-xs font-black uppercase tracking-widest font-mono">Rule Simulator Workbench</h4>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
              Want to see your triggers in action? Choose a test lead contact from the database, then click "Simulate Firing Trigger" on any configured rule to execute its corresponding sequence instantly.
            </p>

            <div className="space-y-3 pt-2">
              <label className="block text-[9px] uppercase font-bold text-slate-500 tracking-wider">
                Select Test Lead Subject
              </label>
              <select
                value={simulationLeadId}
                onChange={(e) => setSimulationLeadId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-xs font-bold text-slate-200 rounded-xl px-3.5 py-2.5 outline-none cursor-pointer focus:border-red-500/20"
              >
                {leads.map(lead => (
                  <option key={lead.id} value={lead.id}>{lead.name} ({lead.company})</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Active rules list & simulated trace logs */}
        <div className="lg:col-span-7 flex flex-col h-full space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col flex-1">
            
            {/* Header Tabs */}
            <div className="flex border-b border-slate-100 bg-slate-50">
              <button
                onClick={() => setActiveTab('rules')}
                className={`flex-1 py-4 text-center text-xs font-extrabold border-b-2 transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'rules' 
                    ? 'border-indigo-600 text-indigo-600 bg-white' 
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Layers size={14} /> Active Automated Rules ({rules.length})
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex-1 py-4 text-center text-xs font-extrabold border-b-2 transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'history' 
                    ? 'border-indigo-600 text-indigo-600 bg-white' 
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileText size={14} /> Automation Trace Logs ({simLogs.length})
              </button>
            </div>

            {/* TAB CONTENTS */}
            <div className="p-6 flex-1 overflow-y-auto max-h-[420px]">
              {activeTab === 'rules' ? (
                <div className="space-y-4">
                  {rules.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 italic text-xs font-medium">
                      No automated logic rules programmed. Use the form to the left to add one!
                    </div>
                  ) : (
                    rules.map((rule) => {
                      const isTriggerOption = TRIGGER_OPTIONS.find(t => t.value === rule.trigger);
                      const isActionOption = ACTION_OPTIONS.find(a => a.value === rule.action);
                      return (
                        <div key={rule.id} className="p-4 rounded-xl border border-slate-150 shadow-sm hover:border-slate-300 transition-all flex items-center justify-between gap-4">
                          <div className="space-y-1 my-0.5 min-w-0">
                            <div className="flex items-center gap-2">
                              <h5 className="font-bold text-slate-850 text-xs truncate max-w-sm">{rule.name}</h5>
                              <span className={`text-[8.5px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${
                                rule.isActive 
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                  : 'bg-slate-100 text-slate-500 border border-slate-200'
                              }`}>
                                {rule.isActive ? 'Active' : 'Disabled'}
                              </span>
                            </div>
                            <p className="text-[10.5px] text-slate-500 leading-normal font-sans font-medium">
                              <span className="font-bold text-indigo-600 uppercase font-mono text-[9px]">WHEN</span>{' '}
                              {isTriggerOption ? isTriggerOption.label : rule.trigger} <br className="md:hidden" />
                              <span className="font-bold text-emerald-600 uppercase font-mono text-[9px] ml-0 md:ml-2">THEN</span>{' '}
                              {isActionOption ? isActionOption.label : rule.action}
                            </p>
                          </div>

                          <div className="flex items-center gap-2.5">
                            <button
                              onClick={() => handleSimulate(rule.id)}
                              disabled={!rule.isActive}
                              className="p-2 bg-slate-950 text-emerald-400 hover:bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-center transition-all disabled:opacity-45"
                              title="Force simulated rule execution"
                            >
                              <Play size={12} className="fill-emerald-400" />
                            </button>

                            <button
                              onClick={() => onToggleRule(rule.id)}
                              className={`p-2 rounded-lg border transition-all ${
                                rule.isActive 
                                  ? 'border-emerald-200 text-emerald-600 hover:bg-emerald-50' 
                                  : 'border-slate-200 text-slate-400 hover:bg-slate-50'
                              }`}
                              title={rule.isActive ? "Deactivate logic" : "Activate logic"}
                            >
                              <CheckCircle size={13} className={rule.isActive ? 'fill-emerald-600 text-white' : ''} />
                            </button>

                            <button
                              onClick={() => onDeleteRule(rule.id)}
                              className="p-2 border border-slate-200 hover:border-red-100 text-slate-400 hover:text-red-500 hover:bg-red-50/20 rounded-lg transition-all"
                              title="Delete Rule"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              ) : (
                /* trace history logs */
                <div className="space-y-4">
                  {simLogs.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 italic text-xs font-medium">
                      Automation Trace Logs are clear. Toggle some rules or press "Play" to simulate!
                    </div>
                  ) : (
                    simLogs.map((log) => (
                      <div key={log.id} className="p-4 rounded-xl bg-slate-950 text-slate-200 border border-slate-900 shadow-md flex gap-3 animate-in slide-in-from-top-1.5 duration-300">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse mt-1.5 flex-shrink-0" />
                        <div className="space-y-1.5 min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-4">
                            <h5 className="text-[11px] font-black tracking-wide text-indigo-400 uppercase font-mono">{log.text}</h5>
                            <span className="text-[9px] text-slate-500 font-mono">{log.time}</span>
                          </div>
                          <p className="text-[10px] text-slate-350 leading-relaxed font-sans font-medium whitespace-pre-wrap">
                            {log.details}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
              <span>Security Node: Isolated local instance</span>
              <span className="font-mono text-emerald-600 font-semibold uppercase">Execution Log: Enabled</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default WorkflowBuilder;
