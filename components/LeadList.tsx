
import React, { useState } from 'react';
import { Mail, Phone, MoreHorizontal, RefreshCw, TrendingUp, TrendingDown, Minus, Download, FileDown, Calendar, MessageSquare, Plus, Clock, List, LayoutGrid, Trash2, CheckSquare, Square, AlertTriangle, X, Sparkles, User, Info, CheckCircle, HelpCircle } from 'lucide-react';
import { Lead, Appointment, EmailFollowUp } from '../types';
import { draftFollowUp } from '../services/geminiService';
import { AnimatePresence, motion } from 'motion/react';

interface LeadListProps {
  leads: Lead[];
  appointments?: Appointment[];
  emails?: EmailFollowUp[];
  onUpdateStatus: (id: string, status: Lead['status']) => void;
  onUpdatePriority?: (id: string, priority: Lead['priority']) => void;
  onReAnalyze: (id: string) => void;
  isAnalyzing: boolean;
  onSelectLead?: (id: string) => void;
  onAddAppointment?: (appointment: { leadId: string; leadName: string; title: string; description: string; date: string; time: string }) => void;
  onAddEmail?: (email: { leadId: string; leadName: string; recipientEmail: string; subject: string; body: string; status: 'Draft' | 'Sent' }) => void;
  onAddLeadNote?: (id: string, note: string) => void;
  onDeleteLeads?: (ids: string[]) => void;
  onBulkUpdateStatus?: (ids: string[], status: Lead['status']) => void;
  onBulkUpdatePriority?: (ids: string[], priority: Lead['priority']) => void;
}

const LeadList: React.FC<LeadListProps> = ({ 
  leads, 
  appointments = [],
  emails = [],
  onUpdateStatus, 
  onUpdatePriority,
  onReAnalyze, 
  isAnalyzing, 
  onSelectLead,
  onAddAppointment,
  onAddEmail,
  onAddLeadNote,
  onDeleteLeads,
  onBulkUpdateStatus,
  onBulkUpdatePriority
}) => {
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [draftingId, setDraftingId] = useState<string | null>(null);
  const [activeDraft, setActiveDraft] = useState<string | null>(null);
  const [expandedNotesId, setExpandedNotesId] = useState<string | null>(null);
  const [selectedDetailLeadId, setSelectedDetailLeadId] = useState<string | null>(null);

  // Modals state for one-click actions
  const [schedulingLead, setSchedulingLead] = useState<Lead | null>(null);
  const [emailingLead, setEmailingLead] = useState<Lead | null>(null);
  const [notingLead, setNotingLead] = useState<Lead | null>(null);

  // Form states for dialog modals
  const [callDate, setCallDate] = useState('');
  const [callTime, setCallTime] = useState('10:00 AM');
  const [callTitle, setCallTitle] = useState('');
  const [callDesc, setCallDesc] = useState('');

  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');

  const [newNoteText, setNewNoteText] = useState('');

  // Drag-and-drop visual tracking states
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [dragOverCell, setDragOverCell] = useState<{ status: Lead['status']; priority: Lead['priority'] } | null>(null);

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('text/plain', leadId);
    e.dataTransfer.effectAllowed = 'move';
    setActiveDragId(leadId);
  };

  const handleDragEnd = () => {
    setActiveDragId(null);
    setDragOverCell(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDragEnter = (e: React.DragEvent, status: Lead['status'], priority: Lead['priority']) => {
    e.preventDefault();
    setDragOverCell({ status, priority });
  };

  const handleDrop = (e: React.DragEvent, status: Lead['status'], priority: Lead['priority']) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('text/plain') || activeDragId;
    if (leadId) {
      onUpdateStatus(leadId, status);
      if (onUpdatePriority) {
        onUpdatePriority(leadId, priority);
      }
    }
    setActiveDragId(null);
    setDragOverCell(null);
  };

  const handleDraft = async (lead: Lead) => {
    setDraftingId(lead.id);
    const draft = await draftFollowUp(lead);
    setActiveDraft(draft);
    setDraftingId(null);
  };

  const handleLeadClick = (leadId: string) => {
    setSelectedDetailLeadId(leadId);
    if (onSelectLead) {
      onSelectLead(leadId);
    }
  };

  const triggerScheduleModal = (e: React.MouseEvent, lead: Lead) => {
    e.stopPropagation();
    setSchedulingLead(lead);
    setCallDate(new Date(Date.now() + 24 * 3600 * 1000).toISOString().split('T')[0]); // Tomorrow
    setCallTitle(`Introduce Nexus CRM to ${lead.name}`);
    setCallDesc(`Consultation call with ${lead.name} from ${lead.company} to walk through integration specifications.`);
  };

  const triggerEmailModal = (e: React.MouseEvent, lead: Lead) => {
    e.stopPropagation();
    setEmailingLead(lead);
    setEmailSubject(`Nexus CRM Workspace Follow-Up - For ${lead.company}`);
    setEmailBody(`Hello ${lead.name},\n\nI hope you are doing well! I was reviewing your company profile at ${lead.company} and would love to follow up on your interest.\n\nLet me know if you are free for a brief sync of 10-15 minutes next week.\n\nWarmly,\nNexus CRM Team`);
  };

  const triggerNoteModal = (e: React.MouseEvent, lead: Lead) => {
    e.stopPropagation();
    setNotingLead(lead);
    setNewNoteText('');
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Name', 'Email', 'Company', 'Status', 'Source', 'Value', 'Last Contacted', 'AI Score', 'Sentiment', 'AI Insight'];
    
    const csvContent = [
      headers.join(','),
      ...leads.map(lead => {
        const row = [
          lead.id,
          lead.name,
          lead.email,
          lead.company,
          lead.status,
          lead.source,
          lead.value,
          lead.lastContacted,
          lead.aiScore || '',
          lead.sentiment || '',
          lead.aiInsight || ''
        ];
        return row.map(value => {
          const str = String(value ?? '').replace(/"/g, '""');
          return str.includes(',') || str.includes('\n') || str.includes('"') ? `"${str}"` : str;
        }).join(',');
      })
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `nexus_crm_leads_backup_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToJSON = () => {
    const blob = new Blob([JSON.stringify(leads, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `nexus_crm_leads_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors duration-300">
      
      {/* Table Export Header control bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 border-b border-slate-150 dark:border-slate-800 gap-4 bg-slate-50/50 dark:bg-slate-900/40">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-150">CRM Leads Registry</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium font-sans">
            Manage customer accounts, view score metrics, and export data backups for reporting.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {/* Segmented Board/Table switcher */}
          <div className="flex bg-slate-150/70 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/20 dark:border-slate-750">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold transition-all cursor-pointer rounded-lg ${
                viewMode === 'kanban'
                  ? 'bg-white dark:bg-slate-705 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <LayoutGrid size={13} />
              <span>Kanban Board</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold transition-all cursor-pointer rounded-lg ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-705 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <List size={13} />
              <span>Table List</span>
            </button>
          </div>

          <span className="hidden sm:inline-block h-6 w-px bg-slate-200 dark:bg-slate-800"></span>

          <button
            onClick={exportToCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 font-black uppercase text-[10px] tracking-widest rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <Download size={13} className="text-indigo-600 dark:text-indigo-400" /> Export CSV
          </button>
          <button
            onClick={exportToJSON}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 font-black uppercase text-[10px] tracking-widest rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <FileDown size={13} className="text-emerald-500 dark:text-emerald-400" /> Export JSON
          </button>
        </div>
      </div>

      {viewMode === 'table' ? (
        <div className="overflow-x-auto">
        <table className="w-full text-left font-sans">
          <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="pl-6 pr-2 py-4 w-12 text-center">
                <input 
                  type="checkbox" 
                  checked={leads.length > 0 && selectedLeadIds.length === leads.length}
                  ref={el => {
                    if (el) {
                      el.indeterminate = selectedLeadIds.length > 0 && selectedLeadIds.length < leads.length;
                    }
                  }}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedLeadIds(leads.map(l => l.id));
                    } else {
                      setSelectedLeadIds([]);
                    }
                  }}
                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-indigo-605 focus:ring-indigo-500 cursor-pointer accent-indigo-605"
                />
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Contact</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Company</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">AI Score</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Value</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {leads.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-10 text-center text-sm text-slate-400 dark:text-slate-550">
                  No active leads found in the registry. Try creating one!
                </td>
              </tr>
            ) : (
              leads.map((lead) => (
                <React.Fragment key={lead.id}>
                  <tr 
                    onClick={() => handleLeadClick(lead.id)} 
                    className={`hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group cursor-pointer ${selectedLeadIds.includes(lead.id) ? 'bg-indigo-50/10 dark:bg-indigo-950/10' : ''}`}
                  >
                    <td className="pl-6 pr-2 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        checked={selectedLeadIds.includes(lead.id)}
                        onChange={(e) => {
                          const id = lead.id;
                          if (e.target.checked) {
                            setSelectedLeadIds(prev => [...prev, id]);
                          } else {
                            setSelectedLeadIds(prev => prev.filter(x => x !== id));
                          }
                        }}
                        className="w-4 h-4 rounded border-slate-350 dark:border-slate-700 text-indigo-605 focus:ring-indigo-550 cursor-pointer accent-indigo-605"
                      />
                    </td>
                    <td className="px-6 py-4 animate-in fade-in duration-300">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-950/55 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                          {lead.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{lead.name}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">{lead.email}</div>
                          {lead.notes && lead.notes.length > 0 ? (
                            <button 
                              onClick={() => setExpandedNotesId(expandedNotesId === lead.id ? null : lead.id)}
                              className="mt-1 flex items-center gap-1 text-[10px] bg-indigo-50 dark:bg-indigo-950/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-bold px-2 py-0.5 rounded-full transition-all border border-indigo-100/50 dark:border-indigo-900/50"
                            >
                              <span>📝 {lead.notes.length} Notes</span>
                              <span className="opacity-60 text-[8px]">{expandedNotesId === lead.id ? '▲' : '▼'}</span>
                            </button>
                          ) : (
                            <button 
                              onClick={() => setExpandedNotesId(expandedNotesId === lead.id ? null : lead.id)}
                              className="mt-1 text-[10px] text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors font-medium hover:underline"
                            >
                              + Add notes context
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-700 dark:text-slate-300 font-medium">{lead.company}</div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-tighter">{lead.source}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`text-sm font-bold ${
                          (lead.aiScore || 0) > 75 ? 'text-green-600 dark:text-green-400' : (lead.aiScore || 0) > 40 ? 'text-orange-600 dark:text-orange-400' : 'text-red-600 dark:text-red-400'
                        }`}>
                          {lead.aiScore || '--'}
                        </div>
                        {lead.sentiment === 'Positive' && <TrendingUp size={14} className="text-green-500 dark:text-green-400" />}
                        {lead.sentiment === 'Negative' && <TrendingDown size={14} className="text-red-500 dark:text-red-400" />}
                        {lead.sentiment === 'Neutral' && <Minus size={14} className="text-slate-300 dark:text-slate-500" />}
                        <button 
                          onClick={() => onReAnalyze(lead.id)}
                          className={`text-slate-300 dark:text-slate-600 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors ${isAnalyzing ? 'animate-spin' : ''}`}
                        >
                          <RefreshCw size={12} />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select 
                        value={lead.status}
                        onChange={(e) => onUpdateStatus(lead.id, e.target.value as any)}
                        className="text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-none rounded-full px-3 py-1 outline-none cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      >
                        <option>New</option>
                        <option>Qualified</option>
                        <option>Negotiation</option>
                        <option>Closed</option>
                        <option>Lost</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-slate-900 dark:text-slate-150">${lead.value.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        {/* 1. Schedule Call Action */}
                        <button 
                          onClick={(e) => triggerScheduleModal(e, lead)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-100/50 dark:border-indigo-900/40 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-[11px] font-bold transition-all hover:scale-[1.02] cursor-pointer"
                          title="Schedule Call"
                        >
                          <Phone size={11} className="text-indigo-605 dark:text-indigo-400" />
                          <span>Call</span>
                        </button>

                        {/* 2. Send Email Action */}
                        <button 
                          onClick={(e) => triggerEmailModal(e, lead)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-100/50 dark:border-sky-900/40 rounded-xl hover:bg-sky-100 dark:hover:bg-sky-900/40 text-[11px] font-bold transition-all hover:scale-[1.02] cursor-pointer"
                          title="Send Email"
                        >
                          <Mail size={11} className="text-sky-600 dark:text-sky-400" />
                          <span>Email</span>
                        </button>

                        {/* 3. Add Note Action */}
                        <button 
                          onClick={(e) => triggerNoteModal(e, lead)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-100/50 dark:border-emerald-900/40 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-[11px] font-bold transition-all hover:scale-[1.02] cursor-pointer"
                          title="Add Note"
                        >
                          <MessageSquare size={11} className="text-emerald-600 dark:text-emerald-400" />
                          <span>Note</span>
                        </button>

                        {/* Existing AI Draft helper */}
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDraft(lead); }}
                          disabled={draftingId === lead.id}
                          className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-purple-650 dark:hover:text-purple-455 hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded-lg transition-all hover:scale-105"
                          title="AI Draft Copilot Suggestion"
                        >
                          {draftingId === lead.id ? <RefreshCw className="animate-spin" size={12} /> : <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">🤖 AI Draft</span>}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedNotesId === lead.id && (
                    <tr className="bg-slate-50/40 dark:bg-slate-950/20">
                      <td colSpan={7} className="px-8 py-4 border-t border-b border-slate-100 dark:border-slate-800/80">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest font-mono">CRM Internal Notes History</span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-550 font-sans">Updated continuously via Gemini Transcription Autopilot</span>
                        </div>
                        {lead.notes && lead.notes.length > 0 ? (
                          <div className="space-y-2.5">
                            {lead.notes.map((note, index) => (
                              <div key={index} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative text-xs leading-relaxed text-slate-600 dark:text-slate-300 font-sans">
                                <span className="font-mono text-[9px] bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded absolute right-3 top-3">Index {index + 1}</span>
                                <p className="whitespace-pre-wrap pr-16">{note}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs text-slate-400 dark:text-slate-500 italic py-2">
                            No notes captured for this lead. Turn on "Microphone memo" in the AI Assistant tab to dictate and automatically attach notes!
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
      ) : (
        /* Dynamic Horizontally aligned Priority Swimlanes with Vertical Status Columns Kanban Matrix  */
        <div className="p-6 overflow-x-auto bg-slate-50/20 dark:bg-slate-950/5">
          {/* Header row for vertical columns */}
          <div className="grid grid-cols-[150px_1fr_1fr_1fr_1fr_1fr] gap-4 min-w-[1050px] mb-4 border-b border-slate-150 dark:border-slate-800/80 pb-3">
            <div className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-505 tracking-wider flex items-center pr-2">
              Swimlanes (Priority)
            </div>
            {(['New', 'Qualified', 'Negotiation', 'Closed', 'Lost'] as Lead['status'][]).map(st => {
              const count = leads.filter(l => l.status === st).length;
              const statusEmoji = {
                New: '🟢',
                Qualified: '💎',
                Negotiation: '🤝',
                Closed: '✅',
                Lost: '❌'
              }[st];
              return (
                <div key={st} className="flex items-center justify-between px-1">
                  <span className="text-xs font-black text-slate-705 dark:text-slate-300 uppercase tracking-wide flex items-center gap-1">
                    <span>{statusEmoji}</span>
                    <span>{st}</span>
                  </span>
                  <span className="text-[10px] bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono font-bold px-2 py-0.5 rounded-full">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Swimlane rows filtered by priority */}
          <div className="space-y-6 min-w-[1050px]">
            {(['High', 'Medium', 'Low'] as Lead['priority'][]).map(pr => {
              const prLeads = leads.filter(l => (l.priority || 'Medium') === pr);
              const laneValue = prLeads.reduce((sum, l) => sum + (l.value || 0), 0);

              const priorityStyles = {
                High: 'bg-rose-50 dark:bg-rose-955/40 text-rose-600 dark:text-rose-455 border-rose-150 dark:border-rose-900/35',
                Medium: 'bg-amber-50 dark:bg-amber-955/40 text-amber-600 dark:text-amber-400 border-amber-150 dark:border-amber-900/35',
                Low: 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-150 dark:border-slate-700/50'
              }[pr];

              const laneEmoji = {
                High: '🔥',
                Medium: '⚡',
                Low: '💤'
              }[pr];

              return (
                <div 
                  key={pr} 
                  className="border border-slate-200 dark:border-slate-850 rounded-2xl bg-white dark:bg-slate-900 overflow-hidden shadow-xs hover:shadow-md transition-all duration-300"
                >
                  {/* Swimlane Row Header */}
                  <div className="flex items-center justify-between px-5 py-3.5 bg-slate-55/40 dark:bg-slate-950/30 border-b border-slate-250 dark:border-slate-800/50">
                    <div className="flex items-center gap-2.5">
                      <span className={`inline-flex items-center gap-1.5 text-[11px] font-black uppercase border px-3 py-1 rounded-full ${priorityStyles}`}>
                        <span>{laneEmoji}</span>
                        <span>{pr} Priority Swimlane</span>
                      </span>
                      <span className="text-xs text-slate-450 dark:text-slate-500 font-medium">
                        ({prLeads.length} {prLeads.length === 1 ? 'lead' : 'leads'})
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-bold mr-1.5 font-sans">Maturity pipeline value:</span>
                      <strong className="text-sm font-black text-slate-850 dark:text-indigo-400 font-sans">
                        ${laneValue.toLocaleString()}
                      </strong>
                    </div>
                  </div>

                  {/* Swimlane Columns Content row */}
                  <div className="grid grid-cols-[150px_1fr_1fr_1fr_1fr_1fr] gap-4 p-4 min-h-[160px] bg-slate-50/20 dark:bg-slate-950/10">
                    
                    {/* Leftmost Priority Identifier Label column */}
                    <div className="flex flex-col justify-center border-r border-dashed border-slate-200 dark:border-slate-850 pr-3.5 select-none font-sans">
                      <span className="text-xs font-black text-slate-800 dark:text-slate-255 uppercase tracking-wide">
                        {pr} Priority
                      </span>
                      <span className="text-[10px] text-slate-400 leading-tight mt-1 font-medium">
                        Filtered priority lanes
                      </span>
                    </div>

                    {/* Dynamic statuses column grids inside swimlanes */}
                    {(['New', 'Qualified', 'Negotiation', 'Closed', 'Lost'] as Lead['status'][]).map(st => {
                      const cellLeads = prLeads.filter(l => l.status === st);
                      const isDragOverThisCell = dragOverCell?.status === st && dragOverCell?.priority === pr;
                      
                      return (
                        <div 
                          key={st} 
                          onDragOver={handleDragOver}
                          onDragEnter={(e) => handleDragEnter(e, st, pr)}
                          onDrop={(e) => handleDrop(e, st, pr)}
                          className={`flex flex-col gap-3 p-2 rounded-xl border transition-all duration-300 min-h-[140px] ${
                            isDragOverThisCell
                              ? 'border-indigo-400 dark:border-indigo-500 bg-indigo-50/15 dark:bg-indigo-950/35 ring-2 ring-indigo-550/20 shadow-inner scale-[1.01]'
                              : 'bg-slate-100/30 dark:bg-slate-950/20 border-dashed border-slate-200/50 dark:border-slate-800'
                          }`}
                        >
                          {cellLeads.length === 0 ? (
                            <div className="flex-1 flex items-center justify-center p-3 text-center opacity-40">
                              <span className="text-[10px] text-slate-355 italic select-none font-sans">No leads here</span>
                            </div>
                          ) : (
                            cellLeads.map(lead => {
                              const isThisCardDragged = activeDragId === lead.id;
                              return (
                                <div 
                                  key={lead.id}
                                  draggable={true}
                                  onDragStart={(e) => handleDragStart(e, lead.id)}
                                  onDragEnd={handleDragEnd}
                                  className={`group relative bg-white dark:bg-slate-850 p-3 rounded-xl border transition-all duration-300 text-left cursor-pointer font-sans select-none ${
                                    isThisCardDragged
                                      ? 'opacity-40 border-dashed border-indigo-400 dark:border-indigo-500 scale-95 shadow-xs bg-slate-50/40 dark:bg-slate-900/40'
                                      : selectedLeadIds.includes(lead.id)
                                      ? 'border-indigo-505 ring-1 ring-indigo-500 bg-indigo-50/5 dark:bg-indigo-950/20'
                                      : 'border-slate-200 dark:border-slate-800 hover:border-indigo-505/65 dark:hover:border-indigo-400/60 shadow-xs hover:shadow-lg'
                                  }`}
                                  onClick={() => handleLeadClick(lead.id)}
                                >
                                  {/* Absolute positioning of small checkbox inside card */}
                                  <div className="absolute top-3.5 left-3" onClick={(e) => e.stopPropagation()}>
                                    <input 
                                      type="checkbox" 
                                      checked={selectedLeadIds.includes(lead.id)}
                                      onChange={(e) => {
                                        const id = lead.id;
                                        if (e.target.checked) {
                                          setSelectedLeadIds(prev => [...prev, id]);
                                        } else {
                                          setSelectedLeadIds(prev => prev.filter(x => x !== id));
                                        }
                                      }}
                                      className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-650 focus:ring-indigo-500 cursor-pointer accent-indigo-650"
                                    />
                                  </div>

                                  {/* Active label / name header - shifted by pl-6 to clear space */}
                                  <div className="space-y-1 mb-2.5 pl-6">
                                    <div className="flex items-start justify-between gap-1">
                                      <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                        {lead.name}
                                      </h4>
                                      <div className="w-4 h-4 rounded-full bg-slate-100 dark:bg-slate-700/60 flex items-center justify-center font-bold text-[8px] uppercase select-none shrink-0" title={`Lead source: ${lead.source}`}>
                                        {lead.name[0]}
                                      </div>
                                    </div>
                                    <p className="text-[10px] text-slate-450 dark:text-slate-500 truncate font-medium">
                                      {lead.company}
                                    </p>
                                  </div>

                                  {/* Pipeline contract value */}
                                  <div className="flex items-center justify-between border-t border-slate-50 dark:border-slate-800/80 pt-2 mb-2 pb-1 text-[11px]">
                                    <span className="font-bold text-slate-850 dark:text-slate-200 font-mono">
                                      ${lead.value.toLocaleString()}
                                    </span>
                                    {lead.aiScore && (
                                      <span className={`font-black text-[9px] px-1.5 py-0.5 rounded ${
                                        lead.aiScore > 75 
                                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' 
                                          : lead.aiScore > 40 
                                          ? 'bg-amber-50 text-amber-600 dark:bg-amber-955/40 dark:text-amber-400' 
                                          : 'bg-rose-50 text-rose-600 dark:bg-rose-955/20'
                                      }`}>
                                        ⭐ {lead.aiScore}
                                      </span>
                                    )}
                                  </div>

                                  {/* Drag-free shift status or priority selector inline right inside card */}
                                  <div className="space-y-1 pt-1.5 border-t border-slate-50/70 dark:border-slate-800">
                                    <div className="flex items-center justify-between gap-1 text-[9px]" onClick={(e) => e.stopPropagation()}>
                                      <span className="text-slate-400 font-bold uppercase tracking-tight scale-90 origin-left">Status</span>
                                      <select
                                        value={lead.status}
                                        onChange={(e) => onUpdateStatus(lead.id, e.target.value as any)}
                                        className="bg-slate-105 dark:bg-slate-900 border-none rounded px-1 py-0.5 text-[9px] text-slate-755 dark:text-slate-300 font-bold cursor-pointer outline-none"
                                      >
                                        <option value="New">New</option>
                                        <option value="Qualified">Qualified</option>
                                        <option value="Negotiation">Negotiation</option>
                                        <option value="Closed">Closed</option>
                                        <option value="Lost">Lost</option>
                                      </select>
                                    </div>

                                    <div className="flex items-center justify-between gap-1 text-[9px]" onClick={(e) => e.stopPropagation()}>
                                      <span className="text-slate-400 font-bold uppercase tracking-tight scale-90 origin-left">Priority</span>
                                      <select
                                        value={lead.priority || 'Medium'}
                                        onChange={(e) => onUpdatePriority?.(lead.id, e.target.value as any)}
                                        className="bg-slate-105 dark:bg-slate-900 border-none rounded px-1 py-0.5 text-[9px] text-slate-755 dark:text-slate-300 font-bold cursor-pointer outline-none"
                                      >
                                        <option value="High">High</option>
                                        <option value="Medium">Medium</option>
                                        <option value="Low">Low</option>
                                      </select>
                                    </div>
                                  </div>

                                  {/* Quick-Action buttons on hover */}
                                  <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                                    <button
                                      onClick={(e) => triggerScheduleModal(e, lead)}
                                      className="p-1 rounded bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 text-indigo-705 dark:text-indigo-400 transition-colors cursor-pointer"
                                      title="Schedule Call Meeting"
                                    >
                                      <Calendar size={10} />
                                    </button>
                                    <button
                                      onClick={(e) => triggerEmailModal(e, lead)}
                                      className="p-1 rounded bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/40 text-sky-755 dark:text-sky-455 transition-colors cursor-pointer"
                                      title="Send Customer Email"
                                    >
                                      <Mail size={10} />
                                    </button>
                                    <button
                                      onClick={(e) => triggerNoteModal(e, lead)}
                                      className="p-1 rounded bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-705 dark:text-emerald-455 transition-colors cursor-pointer"
                                      title="Attach CRM Notes"
                                    >
                                      <MessageSquare size={10} />
                                    </button>
                                    <button
                                      onClick={() => handleDraft(lead)}
                                      disabled={draftingId === lead.id}
                                      className="px-1.5 py-0.5 text-[8.5px] font-black bg-slate-105 text-slate-755 dark:bg-slate-700 dark:text-slate-300 rounded hover:bg-slate-205 transition-all cursor-pointer"
                                      title="Custom Email Campaign Generator via Gemini"
                                    >
                                      {draftingId === lead.id ? '...' : '🤖 AI'}
                                    </button>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AI Draft Display Modal */}
      {activeDraft && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg p-8 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-950/60 rounded-xl flex items-center justify-center">
                <Mail className="text-indigo-600 dark:text-indigo-400" size={20} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">AI Generated Draft</h3>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950/50 p-6 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap mb-6">
              {activeDraft}
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setActiveDraft(null)}
                className="flex-1 py-3 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Close
              </button>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(activeDraft);
                  setActiveDraft(null);
                }}
                className="flex-1 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-md"
              >
                Copy to Clipboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. Schedule Call Modal */}
      {schedulingLead && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md p-8 border border-slate-150 dark:border-slate-800 animate-in zoom-in-95 duration-200 text-left">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-950/60 rounded-xl flex items-center justify-center">
                <Calendar className="text-indigo-600 dark:text-indigo-400" size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Schedule Call</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500">Log a meeting with {schedulingLead.name}</p>
              </div>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              onAddAppointment?.({
                leadId: schedulingLead.id,
                leadName: schedulingLead.name,
                title: callTitle,
                description: callDesc,
                date: callDate,
                time: callTime
              });
              setSchedulingLead(null);
            }} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Meeting Title</label>
                <input 
                  type="text" 
                  required 
                  value={callTitle}
                  onChange={(e) => setCallTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Date</label>
                  <input 
                    type="date" 
                    required 
                    value={callDate}
                    onChange={(e) => setCallDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Time Slot</label>
                  <div className="relative">
                    <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text" 
                      required 
                      value={callTime}
                      onChange={(e) => setCallTime(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none"
                      placeholder="e.g. 10:00 AM"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Meeting Directives / Focus</label>
                <textarea 
                  rows={3}
                  value={callDesc}
                  onChange={(e) => setCallDesc(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setSchedulingLead(null)}
                  className="flex-1 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-indigo-605 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/10 cursor-pointer"
                >
                  Schedule Meet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Send Email Modal */}
      {emailingLead && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-lg p-8 border border-slate-150 dark:border-slate-800 animate-in zoom-in-95 duration-200 text-left">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-sky-100 dark:bg-sky-950/60 rounded-xl flex items-center justify-center">
                <Mail className="text-sky-600 dark:text-sky-400" size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Send Customer Email</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-sans">Draft or send email follow-up dispatch for {emailingLead.name}</p>
              </div>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              onAddEmail?.({
                leadId: emailingLead.id,
                leadName: emailingLead.name,
                recipientEmail: emailingLead.email,
                subject: emailSubject,
                body: emailBody,
                status: 'Sent'
              });
              setEmailingLead(null);
            }} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">To</label>
                <input 
                  type="text" 
                  disabled 
                  value={`${emailingLead.name} (${emailingLead.email})`}
                  className="w-full px-3 py-2 text-sm border border-slate-150 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 rounded-lg outline-none cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Subject</label>
                <input 
                  type="text" 
                  required 
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-705 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Message Body</label>
                <textarea 
                  rows={6}
                  required
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-705 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none font-sans"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setEmailingLead(null)}
                  className="flex-1 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    onAddEmail?.({
                      leadId: emailingLead.id,
                      leadName: emailingLead.name,
                      recipientEmail: emailingLead.email,
                      subject: emailSubject,
                      body: emailBody,
                      status: 'Draft'
                    });
                    setEmailingLead(null);
                  }}
                  className="flex-1 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-205 font-bold text-xs cursor-pointer"
                >
                  Save Draft
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2.5 rounded-lg bg-indigo-605 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/10 cursor-pointer"
                >
                  Send Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Add Note Modal */}
      {notingLead && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm p-8 border border-slate-150 dark:border-slate-800 animate-in zoom-in-95 duration-200 text-left">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-950/60 rounded-xl flex items-center justify-center">
                <MessageSquare className="text-emerald-600 dark:text-emerald-400" size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Attach CRM Note</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-sans font-medium">Log context memo for {notingLead.name}</p>
              </div>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              if (newNoteText.trim()) {
                onAddLeadNote?.(notingLead.id, newNoteText);
                setNewNoteText('');
                setNotingLead(null);
              }
            }} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Note Content</label>
                <textarea 
                  rows={4}
                  required
                  placeholder="e.g., Client requested Q3 timeline mapping..."
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-705 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setNotingLead(null)}
                  className="flex-1 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/10 cursor-pointer"
                >
                  Log Note Memo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sticky Bulk Action Toolbar */}
      <AnimatePresence>
        {selectedLeadIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="fixed bottom-6 inset-x-0 flex justify-center z-50 px-4"
          >
            <div className="bg-slate-900/95 dark:bg-slate-950/98 backdrop-blur-md border border-slate-800 shadow-2xl rounded-2xl px-6 py-4 flex flex-wrap items-center justify-between gap-6 w-full max-w-4xl text-white">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center bg-indigo-600 text-white font-mono font-bold text-xs w-6 h-6 rounded-full">
                  {selectedLeadIds.length}
                </span>
                <span className="text-sm font-bold text-slate-200">
                  {selectedLeadIds.length === 1 ? 'Lead selected' : 'Leads selected'}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedLeadIds([])}
                  className="text-xs text-slate-400 hover:text-white underline transition-colors cursor-pointer ml-1 bg-transparent border-none"
                >
                  Deselect all
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* 1. Change Status Dropdown */}
                <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Status</span>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        onBulkUpdateStatus?.(selectedLeadIds, e.target.value as any);
                        setSelectedLeadIds([]);
                      }
                    }}
                    defaultValue=""
                    className="bg-transparent border-none text-xs text-slate-100 font-bold outline-none cursor-pointer pr-1"
                  >
                    <option value="" disabled className="text-slate-500 bg-slate-900">Update status...</option>
                    <option value="New" className="bg-slate-900 text-white">🔴 New</option>
                    <option value="Qualified" className="bg-slate-900 text-white">💎 Qualified</option>
                    <option value="Negotiation" className="bg-slate-900 text-white">🤝 Negotiation</option>
                    <option value="Closed" className="bg-slate-900 text-white">✅ Closed</option>
                    <option value="Lost" className="bg-slate-900 text-white">❌ Lost</option>
                  </select>
                </div>

                {/* 2. Change Priority Dropdown */}
                {onBulkUpdatePriority && (
                  <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Priority</span>
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          onBulkUpdatePriority?.(selectedLeadIds, e.target.value as any);
                          setSelectedLeadIds([]);
                        }
                      }}
                      defaultValue=""
                      className="bg-transparent border-none text-xs text-slate-100 font-bold outline-none cursor-pointer pr-1"
                    >
                      <option value="" disabled className="text-slate-500 bg-slate-900">Update priority...</option>
                      <option value="High" className="bg-slate-900 text-white">🔥 High</option>
                      <option value="Medium" className="bg-slate-900 text-white">⚡ Medium</option>
                      <option value="Low" className="bg-slate-900 text-white">💤 Low</option>
                    </select>
                  </div>
                )}

                {/* Separator */}
                <span className="h-6 w-px bg-slate-800"></span>

                {/* 3. Bulk Delete Action */}
                {onDeleteLeads && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to delete ${selectedLeadIds.length} selected lead(s)?`)) {
                        onDeleteLeads(selectedLeadIds);
                        setSelectedLeadIds([]);
                      }
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer border border-rose-500/30"
                  >
                    <Trash2 size={13} />
                    <span>Delete Selected</span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lead Detail & Visual Activity Timeline Slide-Over Panel */}
      <AnimatePresence>
        {selectedDetailLeadId && (
          (() => {
            const detailLead = leads.find(l => l.id === selectedDetailLeadId);
            if (!detailLead) return null;

            // Gather all activities
            const timelineMeetings = appointments
              .filter(app => app.leadId === detailLead.id || (app.leadName && app.leadName.toLowerCase() === detailLead.name.toLowerCase()))
              .map(app => ({
                id: app.id,
                type: 'Meeting',
                title: app.title,
                description: app.description || 'No description provided.',
                date: app.date,
                time: app.time,
                timestamp: app.timestamp || `${app.date}T${app.time || '12:00'}:00Z`,
                icon: Calendar,
                colorText: 'text-emerald-600 dark:text-emerald-400',
                colorBg: 'bg-emerald-50 dark:bg-emerald-950/40',
                colorBorder: 'border-emerald-100 dark:border-emerald-900/30'
              }));

            const timelineEmails = emails
              .filter(email => email.leadId === detailLead.id || (email.leadName && email.leadName.toLowerCase() === detailLead.name.toLowerCase()))
              .map(email => ({
                id: email.id,
                type: 'Email',
                title: email.subject,
                description: email.body,
                date: email.timestamp ? email.timestamp.split('T')[0] : '',
                time: email.timestamp ? email.timestamp.split('T')[1]?.slice(0, 5) || '' : '',
                timestamp: email.timestamp,
                icon: Mail,
                meta: email.status, // Draft, Scheduled, Sent
                colorText: 'text-indigo-600 dark:text-indigo-400',
                colorBg: 'bg-indigo-50 dark:bg-indigo-950/40',
                colorBorder: 'border-indigo-100 dark:border-indigo-900/30'
              }));

            const timelineNotes = detailLead.notes.map((note, index) => {
              return {
                id: `note-${index}`,
                type: 'Note',
                title: 'CRM Client Note Update',
                description: note,
                date: detailLead.lastContacted || '',
                time: '',
                timestamp: detailLead.lastContacted ? `${detailLead.lastContacted}T23:59:00Z` : '',
                icon: MessageSquare,
                colorText: 'text-amber-600 dark:text-amber-400',
                colorBg: 'bg-amber-50 dark:bg-amber-950/40',
                colorBorder: 'border-amber-100 dark:border-amber-900/30'
              };
            });

            const creationEvent = {
              id: 'sys-creation',
              type: 'System',
              title: 'Lead Profile Established',
              description: `Lead profile initialized in Nexus CRM from source: "${detailLead.source}". Standard starting contract potential value tracked at $${detailLead.value.toLocaleString()}.`,
              date: detailLead.lastContacted ? new Date(new Date(detailLead.lastContacted).getTime() - 86400000 * 7).toISOString().split('T')[0] : '2026-01-01',
              time: '',
              timestamp: '2020-01-01T00:00:00Z',
              icon: Clock,
              colorText: 'text-slate-500 dark:text-slate-400',
              colorBg: 'bg-slate-55 dark:bg-slate-900',
              colorBorder: 'border-slate-150 dark:border-slate-800'
            };

            const allEvents = [...timelineMeetings, ...timelineEmails, ...timelineNotes, creationEvent].sort((a, b) => {
              if (a.id === 'sys-creation') return 1; // always bottom
              if (b.id === 'sys-creation') return -1;
              return new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime();
            });

            return (
              <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
                {/* Backdrop glass */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setSelectedDetailLeadId(null)}
                  className="absolute inset-0 bg-slate-900/40 dark:bg-black/55 backdrop-blur-sm"
                />

                {/* Slider layout */}
                <motion.div 
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                  className="relative w-full max-w-xl md:max-w-2xl h-full bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-150 dark:border-slate-800 flex flex-col focus:outline-none"
                >
                  {/* Slider Header */}
                  <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 backdrop-blur-md sticky top-0 z-10 flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-850 text-slate-500 dark:text-slate-400">
                          Lead Profile Detail
                        </span>
                        
                        {/* Status Badge */}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          detailLead.status === 'New' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400' :
                          detailLead.status === 'Qualified' ? 'bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400' :
                          detailLead.status === 'Negotiation' ? 'bg-amber-50 text-amber-600 dark:bg-amber-955/40 dark:text-amber-400' :
                          detailLead.status === 'Closed' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' :
                          'bg-rose-50 text-rose-600 dark:bg-rose-955/20'
                        }`}>
                          {detailLead.status}
                        </span>

                        {/* Priority Badge */}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          detailLead.priority === 'High' ? 'bg-rose-50 text-rose-600 dark:bg-rose-955/20' :
                          detailLead.priority === 'Medium' ? 'bg-amber-50 text-amber-600 dark:bg-amber-955/40' :
                          'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-455'
                        }`}>
                          {detailLead.priority === 'High' ? '🔥 High' : detailLead.priority === 'Medium' ? '⚡ Medium' : 'Low'}
                        </span>
                      </div>
                      <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-1.5 pt-0.5">
                        {detailLead.name}
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {detailLead.company || 'Private Client'}
                      </p>
                    </div>

                    <button 
                      onClick={() => setSelectedDetailLeadId(null)}
                      className="p-1 px-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-500 dark:text-slate-400 transition-colors"
                      title="Close Panel"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* Slider Scrollable Body */}
                  <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
                    {/* Primary Grid Specs */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50/70 dark:bg-slate-950/30 p-4 rounded-xl border border-slate-150 dark:border-slate-800/80">
                      <div>
                        <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider">Email Address</span>
                        <a href={`mailto:${detailLead.email}`} className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline truncate block">
                          {detailLead.email}
                        </a>
                      </div>
                      <div>
                        <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider">Deal Value</span>
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100 font-mono">
                          ${detailLead.value.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider">Acquisition Source</span>
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {detailLead.source}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider">Last Sync Call</span>
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {detailLead.lastContacted}
                        </span>
                      </div>
                    </div>

                    {/* AI Scoring Hub Banner */}
                    <div className="p-5 rounded-2xl border border-indigo-100/80 dark:border-indigo-950/50 space-y-3 shadow-xs relative overflow-hidden bg-indigo-50/5 dark:bg-indigo-950/10">
                      {/* Decorative elements */}
                      <div className="absolute right-3 top-3 opacity-20 text-indigo-500">
                        <Sparkles size={32} />
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="px-2 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-705 dark:text-indigo-300 font-mono font-black text-xs">
                          ⭐ {detailLead.aiScore || 40} AI SCORE
                        </div>
                        {detailLead.sentiment && (
                          <div className={`px-2 py-1 rounded-lg font-bold text-[10px] ${
                            detailLead.sentiment === 'Positive' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400' :
                            detailLead.sentiment === 'Neutral' ? 'bg-slate-100 text-slate-755 dark:bg-slate-800 dark:text-slate-300' :
                            'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-400'
                          }`}>
                            {detailLead.sentiment === 'Positive' ? '😊 Positive Sentiment' : detailLead.sentiment === 'Neutral' ? '😐 Neutral Sentiment' : '☹️ Negative Sentiment'}
                          </div>
                        )}
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Gemini Strategic Evaluation Insight</h4>
                        <p className="text-xs text-slate-550 dark:text-slate-455 leading-relaxed font-sans font-medium italic">
                          "{detailLead.aiInsight || 'No tactical advice generated yet. Engage on-demand simulation to refresh scorecard.'}"
                        </p>
                      </div>

                      <div className="pt-1.55">
                        <button
                          onClick={() => onReAnalyze(detailLead.id)}
                          disabled={isAnalyzing}
                          className="px-3 py-1 bg-white hover:bg-slate-100 text-indigo-705 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-950/80 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-2xs hover:shadow-xs cursor-pointer"
                        >
                          <RefreshCw size={10} className={isAnalyzing ? 'animate-spin' : ''} />
                          <span>{isAnalyzing ? 'Analyzing CRM Data...' : 'Recalculate Scorecard'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Timeline Container Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                          Visual Activity Timeline ({allEvents.length})
                        </h3>

                        {/* Drop / inline actions */}
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => { e.stopPropagation(); setNotingLead(detailLead); }}
                            className="text-[10px] font-bold px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-350 cursor-pointer transition-colors"
                            title="Add Note to Client History"
                          >
                            + Note
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setSchedulingLead(detailLead); }}
                            className="text-[10px] font-bold px-2 py-1 rounded bg-slate-150 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-350 cursor-pointer transition-colors"
                            title="Schedule Meeting"
                          >
                            + Meeting
                          </button>
                          <button
                            onClick={() => handleDraft(detailLead)}
                            disabled={draftingId === detailLead.id}
                            className="text-[10px] font-extrabold px-2 py-1 rounded bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-950 text-indigo-700 dark:text-indigo-400 cursor-pointer transition-colors flex items-center gap-0.5"
                            title="Generate Draft Content via Gemini"
                          >
                            <span>🤖 {draftingId === detailLead.id ? 'Drafting...' : 'Add AI Email'}</span>
                          </button>
                        </div>
                      </div>

                      {allEvents.length === 0 ? (
                        <div className="p-10 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center">
                          <HelpCircle className="mx-auto text-slate-300 dark:text-slate-700 mb-2" size={24} />
                          <p className="text-xs text-slate-400">No activity history tracked for this profile.</p>
                        </div>
                      ) : (
                        <div className="relative pl-6 border-l-2 border-slate-150 dark:border-slate-800/80 ml-3.5 space-y-6 pt-2 pb-2">
                          {allEvents.map((act) => {
                            const ActIcon = act.icon;
                            return (
                              <div key={act.id} className="relative group/item text-left">
                                {/* Bullet indicator absolute placement */}
                                <div className={`absolute -left-[32px] top-1.5 w-5 h-5 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center shadow-2xs transition-transform duration-300 group-hover/item:scale-110 ${act.colorBg} ${act.colorText}`}>
                                  <ActIcon size={10} />
                                </div>

                                <div className="space-y-1 bg-white dark:bg-slate-950 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/85 hover:border-slate-200 dark:hover:border-slate-700 transition duration-150">
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                        {act.type}
                                      </span>
                                      {act.meta && (
                                        <span className={`text-[8px] font-black uppercase px-1 py-0.5 rounded leading-none ${
                                          act.meta === 'Sent' ? 'bg-emerald-55 text-emerald-600 dark:bg-emerald-950/20' :
                                          act.meta === 'Scheduled' ? 'bg-amber-100 text-amber-800 dark:bg-amber-955/30' :
                                          'bg-slate-100 text-slate-600 dark:bg-slate-800 text-slate-400'
                                        }`}>
                                          {act.meta}
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[9px] font-semibold text-slate-400 dark:text-slate-555 font-mono flex items-center gap-1">
                                      <Clock size={8} />
                                      {act.date} {act.time ? `@ ${act.time}` : ''}
                                    </div>
                                  </div>

                                  <h5 className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200">
                                    {act.title}
                                  </h5>

                                  <p className="text-xs text-slate-600 dark:text-slate-400 whitespace-pre-wrap leading-relaxed font-sans font-medium">
                                    {act.description}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Slider Footer Options */}
                  <div className="p-6 border-t border-slate-150 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 select-none">
                      <User size={13} />
                      <span>Contact ID:</span>
                      <code className="bg-slate-200 dark:bg-slate-800 p-0.5 px-1 rounded font-mono text-[9px]">
                        {detailLead.id}
                      </code>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to delete this lead (${detailLead.name})?`)) {
                            onDeleteLeads?.([detailLead.id]);
                            setSelectedDetailLeadId(null);
                          }
                        }}
                        className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg text-xs font-bold transition cursor-pointer"
                        title="Delete Profile Completely"
                      >
                        <Trash2 size={14} className="inline mr-1" />
                        <span>Delete Profile</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            );
          })()
        )}
      </AnimatePresence>
    </div>
  );
};

export default LeadList;

