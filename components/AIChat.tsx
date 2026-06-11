import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, Bot, User, Sparkles, Loader2, Bell, Calendar, Mail, FileText, 
  Mic, Square, Trash2, Check, Zap, Play, Volume2, History, RotateCcw,
  ArrowRight, CheckSquare, Sparkle, AlertCircle
} from 'lucide-react';
import { Lead, Reminder, Appointment, EmailFollowUp } from '../types';
import { chatWithCRM, ChatActionResponse, transcribeAndSummarizeAudio, AudioSummaryResponse } from '../services/geminiService';

interface AIChatProps {
  leads: Lead[];
  reminders: Reminder[];
  appointments: Appointment[];
  emails: EmailFollowUp[];
  onAddReminder: (reminder: Omit<Reminder, 'id' | 'timestamp'>) => void;
  onAddAppointment: (appointment: Omit<Appointment, 'id' | 'timestamp'>) => void;
  onAddEmail: (email: Omit<EmailFollowUp, 'id' | 'timestamp'>) => void;
  onUpdateLeadStatus: (id: string, status: Lead['status']) => void;
  onUpdateLeadStatusByName?: (name: string, status: Lead['status']) => void;
  onAddLeadNote?: (id: string, note: string) => void;
}

interface ChatMessage {
  role: 'ai' | 'user';
  text: string;
  actionExecuted?: {
    type: 'reminder' | 'appointment' | 'followup' | 'status';
    title: string;
    description: string;
  };
}

interface SavedSessionMemo {
  id: string;
  timestamp: string;
  transcription: string;
  summary: string;
  leadId: string;
  leadName: string;
  duration: number;
}

const AIChat: React.FC<AIChatProps> = ({ 
  leads, 
  reminders, 
  appointments, 
  emails,
  onAddReminder,
  onAddAppointment,
  onAddEmail,
  onUpdateLeadStatus,
  onUpdateLeadStatusByName,
  onAddLeadNote
}) => {
  // Conventional Chat States
  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
      role: 'ai', 
      text: "Hello! I'm your Nexus intelligent CRM Copilot. I understand reminders, meeting schedules, lead tags, and email follow-ups.\n\nTry saying: 'Remind me to call John Doe tomorrow' or 'Schedule a demo call with Sarah Connor for Friday at 3:00 PM'." 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Audio Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionResult, setTranscriptionResult] = useState<AudioSummaryResponse | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');
  const [savedMemos, setSavedMemos] = useState<SavedSessionMemo[]>([]);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<any>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Auto-scroll chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Audio timer ticker
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  // Self-hiding feedback prompt helper
  const triggerFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => {
      setFeedbackMsg(null);
    }, 4000);
  };

  // Convert Recorded Audio Blob to Base64 (needed for Gemini Multimodal input)
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          const base64String = reader.result.split(',')[1];
          resolve(base64String);
        } else {
          reject("Failed to format recorded blob representation.");
        }
      };
      reader.onerror = () => reject("Reader read action encountered failure.");
      reader.readAsDataURL(blob);
    });
  };

  // Start Audio Capturing
  const startRecording = async () => {
    chunksRef.current = [];
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingDuration(0);
    setTranscriptionResult(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("This browser does not support media recording APIs.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      let options = {};
      if (MediaRecorder.isTypeSupported('audio/webm')) {
        options = { mimeType: 'audio/webm' };
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        options = { mimeType: 'audio/mp4' };
      }

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        
        // Disable tracks to immediately release mic lights/indicators
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      triggerFeedback("Active Recording Stream Started", "success");
    } catch (err: any) {
      console.error("Mic access block error", err);
      triggerFeedback(err.message || "Failed to engage microphone. Check system permissions.", "error");
    }
  };

  // Stop Recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      triggerFeedback("Analyzing recorded voice memo segments...", "success");
    }
  };

  // Run Gemini Audio Transcription & Analysis
  const handleTranscribeAndParse = async () => {
    if (!audioBlob) return;
    setIsTranscribing(true);
    try {
      const b64 = await blobToBase64(audioBlob);
      const mime = audioBlob.type || 'audio/webm';
      const result = await transcribeAndSummarizeAudio(b64, mime, leads);
      setTranscriptionResult(result);
      
      if (result.suggestedLeadId) {
        setSelectedLeadId(result.suggestedLeadId);
      } else if (leads.length > 0) {
        setSelectedLeadId(leads[0].id);
      }
      triggerFeedback("Audio transcribed & structured successfully!", "success");
    } catch (e) {
      console.error("Gemini audio error", e);
      triggerFeedback("Gemini Autopilot fell behind. Check audio contents or retry model connection.", "error");
    } finally {
      setIsTranscribing(false);
    }
  };

  // Save the Gemini summary directly to the active CRM notes
  const handleSyncToCRM = () => {
    if (!transcriptionResult || !selectedLeadId) return;
    if (!onAddLeadNote) {
      triggerFeedback("Lead notes database function was not configured.", "error");
      return;
    }

    const matchedLead = leads.find(l => l.id === selectedLeadId);
    if (!matchedLead) return;

    const notesSummary = `🎙️ DICTATED VOICE INSIGHT (${new Date().toLocaleDateString()})\n\nSUMMARY NOTES:\n${transcriptionResult.summary}\n\nTRANSCRIPTION:\n"${transcriptionResult.transcription}"`;
    
    // Call the callback to store it globally
    onAddLeadNote(selectedLeadId, notesSummary);

    // Save history
    const sessionMemoObj: SavedSessionMemo = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      transcription: transcriptionResult.transcription,
      summary: transcriptionResult.summary,
      leadId: selectedLeadId,
      leadName: matchedLead.name,
      duration: recordingDuration
    };

    setSavedMemos(prev => [sessionMemoObj, ...prev]);
    triggerFeedback(`Note synced to Lead "${matchedLead.name}" in real-time CRM memory!`, "success");

    // Clear recorder panel
    setAudioBlob(null);
    setAudioUrl(null);
    setTranscriptionResult(null);
  };

  // Push transcribed spoken words into Copilot input to trigger verbal CRM command execution quickly
  const handlePushToInput = () => {
    if (!transcriptionResult) return;
    setInput(transcriptionResult.transcription);
    triggerFeedback("Spoken instructions projected to Chat Input field!", "success");
  };

  // Conventional Chat Send Command Handler
  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const response: ChatActionResponse = await chatWithCRM(
        userMsg, 
        leads, 
        reminders, 
        appointments, 
        emails
      );

      let actionPayload: ChatMessage['actionExecuted'] = undefined;

      if (response.action && response.action.type !== 'none') {
        const { type, reminder, appointment, followup, statusUpdate } = response.action;

        if (type === 'create_reminder' && reminder) {
          onAddReminder({
            text: reminder.text,
            dueDate: reminder.dueDate,
            completed: false,
            leadName: reminder.leadName
          });
          actionPayload = {
            type: 'reminder',
            title: 'Reminder Programmed',
            description: `"${reminder.text}" programmed for ${reminder.dueDate}`
          };
        } 
        else if (type === 'create_appointment' && appointment) {
          onAddAppointment({
            title: appointment.title,
            date: appointment.date,
            time: appointment.time,
            description: appointment.description || 'Scheduled via CRM AI copilot'
          });
          actionPayload = {
            type: 'appointment',
            title: 'Meeting Scheduled',
            description: `Scheduled "${appointment.title}" on ${appointment.date} at ${appointment.time}`
          };
        } 
        else if (type === 'create_followup' && followup) {
          onAddEmail({
            leadName: followup.leadName,
            recipientEmail: '',
            subject: followup.subject,
            body: followup.body,
            status: followup.status,
            scheduledDate: followup.scheduledDate
          });
          actionPayload = {
            type: 'followup',
            title: 'Correspondence Drafted',
            description: `Email drafted for ${followup.leadName} (${followup.status})`
          };
        } 
        else if (type === 'status_update' && statusUpdate) {
          const matchedLead = leads.find(l => 
            l.id === statusUpdate.leadId || 
            l.name.toLowerCase().includes(statusUpdate.leadId.toLowerCase())
          );

          if (matchedLead) {
            onUpdateLeadStatus(matchedLead.id, statusUpdate.status);
            actionPayload = {
              type: 'status',
              title: 'Lead CRM Tag Updated',
              description: `Status tag of "${matchedLead.name}" set to "${statusUpdate.status}"`
            };
          } else if (onUpdateLeadStatusByName) {
            onUpdateLeadStatusByName(statusUpdate.leadId, statusUpdate.status);
            actionPayload = {
              type: 'status',
              title: 'Lead CRM Tag Updated',
              description: `Status tag for "${statusUpdate.leadId}" set to "${statusUpdate.status}"`
            };
          }
        }
      }

      setMessages(prev => [
        ...prev, 
        { 
          role: 'ai', 
          text: response.text, 
          actionExecuted: actionPayload 
        }
      ]);
    } catch (e) {
      setMessages(prev => [
        ...prev, 
        { 
          role: 'ai', 
          text: "Sorry, I had trouble updating the CRM data or connecting to the brain. Please try that again." 
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-17rem)] min-h-[580px] animate-in fade-in duration-500 font-sans">
      
      {/* Toast Alert Feedback Overlay */}
      {feedbackMsg && (
        <div id="crm-feedback-alert" className={`fixed bottom-6 right-6 z-50 p-4 rounded-2xl shadow-xl border flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-300 font-sans ${
          feedbackMsg.type === 'success' 
            ? 'bg-emerald-950/95 border-emerald-500/30 text-emerald-200' 
            : 'bg-rose-950/95 border-rose-500/30 text-rose-200'
        }`}>
          <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${feedbackMsg.type === 'success' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
          <p className="text-xs font-semibold tracking-wide">{feedbackMsg.text}</p>
        </div>
      )}

      {/* LEFT COLUMN: Deep Conversational Copilot */}
      <div id="crm-chat-copilot" className="lg:col-span-7 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden h-full">
        {/* Chat Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-600/10">
              <Sparkles className="text-white" size={16} />
            </div>
            <div>
              <span className="font-bold text-slate-800 text-sm block">Nexus CRM Copilot</span>
              <span className="text-[10px] text-slate-400 font-mono">Channel: Client Interface</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
            <span className="text-[9px] font-black tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full uppercase">AUTOPILOT CONNECTED</span>
          </div>
        </div>

        {/* Chat Scrolling Segment */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/20">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in duration-300`}>
              <div className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center text-xs font-bold ${
                  m.role === 'user' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-200 text-slate-600'
                }`}>
                  {m.role === 'user' ? <User size={15} /> : <Bot size={15} />}
                </div>
                <div className="flex flex-col">
                  <div className={`p-4 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap font-medium inline-block shadow-sm ${
                    m.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-tr-none' 
                      : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                  }`}>
                    {m.text}
                  </div>

                  {/* Inline Synced Asset Badge */}
                  {m.actionExecuted && (
                    <div className="mt-2 p-3 bg-indigo-50/60 border border-indigo-100/50 rounded-xl flex items-start gap-2.5 max-w-sm animate-in slide-in-from-top-1.5 duration-300">
                      <div className="p-1.5 bg-indigo-500 text-white rounded-lg flex-shrink-0 shadow-sm">
                        {m.actionExecuted.type === 'reminder' && <Bell size={12} />}
                        {m.actionExecuted.type === 'appointment' && <Calendar size={12} />}
                        {m.actionExecuted.type === 'followup' && <Mail size={12} />}
                        {m.actionExecuted.type === 'status' && <FileText size={12} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h5 className="text-[10px] font-black text-indigo-950 uppercase tracking-tighter leading-none">{m.actionExecuted.title}</h5>
                          <span className="text-[7.5px] bg-green-500/10 text-green-700 font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider">CRM Synced</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1 italic font-medium">
                          {m.actionExecuted.description}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-xl bg-slate-200 flex items-center justify-center">
                  <Loader2 className="text-slate-500 animate-spin" size={16} />
                </div>
                <div className="p-4 bg-white rounded-2xl rounded-tl-none shadow-sm border border-slate-100 italic text-slate-400 text-xs font-semibold">
                  Analyzing operations and compiling database charts...
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Chat input box */}
        <div className="p-4 bg-white border-t border-slate-200">
          <div className="relative">
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask Copilot (e.g. 'schedule follow up with Sarah tomorrow' or 'what negotiations has high value?')"
              className="w-full pl-5 pr-14 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 shadow-inner outline-none text-xs text-slate-700 placeholder-slate-400 font-medium"
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-indigo-600 text-white rounded-lg flex items-center justify-center hover:bg-indigo-700 transition-all shadow disabled:opacity-40"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: AI Voice Dictation & Synced Autopilot */}
      <div id="crm-voice-recorder" className="lg:col-span-5 flex flex-col bg-slate-950 text-slate-100 rounded-2xl shadow-xl border border-slate-800 overflow-hidden h-full">
        {/* Voice Header */}
        <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-600/10 border border-red-500/35 rounded-xl flex items-center justify-center shadow">
              <Mic className="text-red-400" size={15} />
            </div>
            <div>
              <span className="font-bold text-slate-200 text-sm block">Voice Dictation Pilot</span>
              <span className="text-[10px] text-slate-500 font-mono">Modality: Real-time Multimodal</span>
            </div>
          </div>
          <span className="text-[8px] tracking-widest font-black text-rose-400 bg-rose-500/10 px-2 py-1 rounded border border-rose-500/20 uppercase">
            Microphone Node
          </span>
        </div>

        {/* Recorder Center Core */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          
          {/* Visual Recording Status Module */}
          <div className="bg-slate-900/40 rounded-xl p-6 border border-slate-900 flex flex-col items-center justify-center text-center">
            
            {isRecording ? (
              <div className="space-y-4 w-full">
                {/* Glowing red ring animation */}
                <div className="relative flex items-center justify-center h-20">
                  <div className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-red-500/20 animate-ping" />
                  <div className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-red-500/30 animate-pulse" />
                  <button 
                    onClick={stopRecording}
                    className="relative w-10 h-10 bg-red-600 rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:bg-red-700 transition-all border border-red-400/40"
                  >
                    <Square className="text-white fill-white" size={14} />
                  </button>
                </div>
                
                {/* Live timer */}
                <div className="space-y-1">
                  <p className="text-lg font-black font-mono text-red-400 tracking-wider">
                    {formatTimer(recordingDuration)}
                  </p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest">Recording live... Speak now</p>
                </div>

                {/* Styled CSS Waveform simulation */}
                <div className="flex items-end justify-center gap-1.5 h-12 pt-3">
                  <div className="w-1 bg-red-500 rounded-full animate-bounce h-5" style={{ animationDelay: '0.1s', animationDuration: '0.7s' }}></div>
                  <div className="w-1 bg-red-500 rounded-full animate-bounce h-10" style={{ animationDelay: '0.3s', animationDuration: '0.5s' }}></div>
                  <div className="w-1 bg-red-500 rounded-full animate-bounce h-7" style={{ animationDelay: '0s', animationDuration: '0.8s' }}></div>
                  <div className="w-1 bg-red-400 rounded-full animate-bounce h-12" style={{ animationDelay: '0.4s', animationDuration: '0.6s' }}></div>
                  <div className="w-1 bg-red-500 rounded-full animate-bounce h-6" style={{ animationDelay: '0.2s', animationDuration: '0.9s' }}></div>
                  <div className="w-1 bg-red-500 rounded-full animate-bounce h-3" style={{ animationDelay: '0.05s', animationDuration: '0.75s' }}></div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {audioUrl ? (
                  <div className="space-y-3 w-full">
                    {/* Audio Player and Review Panel */}
                    <div className="w-12 h-12 bg-indigo-505/20 border border-indigo-500/30 text-indigo-400 rounded-full flex items-center justify-center mx-auto shadow shadow-indigo-500/10">
                      <Volume2 size={20} />
                    </div>
                    <p className="text-xs font-semibold text-slate-300">Recording captured successfully</p>
                    
                    {/* Native player wrapper */}
                    <audio src={audioUrl} controls className="w-full h-9 rounded-lg max-w-[280px] mx-auto opacity-85" />

                    <div className="flex items-center gap-2.5 justify-center pt-2">
                      <button
                        onClick={startRecording}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] uppercase font-bold rounded-lg transition-colors flex items-center gap-1.5 border border-slate-700/50"
                      >
                        <RotateCcw size={11} /> Re-record
                      </button>

                      <button
                        onClick={handleTranscribeAndParse}
                        disabled={isTranscribing}
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-[10px] uppercase font-black rounded-lg transition-all shadow-md shadow-indigo-650/15 flex items-center gap-1.5"
                      >
                        {isTranscribing ? (
                          <>
                            <Loader2 className="animate-spin" size={11} /> Parsing...
                          </>
                        ) : (
                          <>
                            <Sparkle size={11} className="fill-white" /> AI Transcribe & Summarize
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="py-2 space-y-3">
                    <button 
                      onClick={startRecording}
                      className="w-14 h-14 bg-rose-600 hover:bg-rose-700 text-white rounded-full flex items-center justify-center mx-auto shadow-lg shadow-rose-600/10 border border-rose-500/40 cursor-pointer transition-all hover:scale-105 active:scale-95"
                    >
                      <Mic size={22} className="fill-white" />
                    </button>
                    <div>
                      <p className="text-xs font-bold text-slate-200">Start CRM Audio Memo</p>
                      <p className="text-[10px] text-slate-500 max-w-xs mt-1 leading-normal font-medium leading-relaxed">
                        Tap record to dictate lead interactions. Gemini will summarize key actionable points and sync notes instantly.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Gemini Transcription Results Section */}
          {transcriptionResult && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4.5 space-y-4 animate-in slide-in-from-bottom-3 duration-400">
              <div className="flex items-center gap-1.5 text-xs font-black uppercase text-indigo-400 tracking-wider">
                <Sparkles size={13} className="fill-indigo-400" />
                <span>Gemini Analysis Result</span>
              </div>

              {/* Transcription */}
              <div className="space-y-1">
                <span className="text-[9px] uppercase font-black tracking-widest text-slate-500 font-mono">Verbatim Transcript</span>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-900 text-[11px] text-slate-300 select-all leading-normal">
                  "{transcriptionResult.transcription}"
                </div>
              </div>

              {/* AI Summary bullet points */}
              <div className="space-y-1">
                <span className="text-[9px] uppercase font-black tracking-widest text-slate-500 font-mono">Suggested CRM Notes</span>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-900 text-[11px] text-emerald-400 leading-relaxed font-sans whitespace-pre-wrap">
                  {transcriptionResult.summary}
                </div>
              </div>

              {/* Target CRM Lead Dropdown selection */}
              <div className="space-y-2 pt-1 border-t border-slate-900">
                <div className="flex items-center justify-between">
                  <label className="text-[9.5px] uppercase font-black tracking-wider text-slate-400">Sync with CRM Contact</label>
                  {transcriptionResult.suggestedLeadName && (
                    <span className="text-[8px] font-black bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20">
                      🎯 Matches: {transcriptionResult.suggestedLeadName}
                    </span>
                  )}
                </div>
                <select
                  value={selectedLeadId}
                  onChange={(e) => setSelectedLeadId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-xs font-bold text-slate-200 rounded-lg px-3 py-2 outline-none cursor-pointer focus:border-indigo-500/30"
                >
                  <option value="" disabled>-- Select Target Contact --</option>
                  {leads.map(l => (
                    <option key={l.id} value={l.id}>{l.name} ({l.company})</option>
                  ))}
                </select>
              </div>

              {/* CRM Commits Trigger */}
              <div className="grid grid-cols-2 gap-2.5 pt-1.5">
                <button
                  onClick={handlePushToInput}
                  className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] uppercase font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <ArrowRight size={12} /> Project to Chat
                </button>

                <button
                  onClick={handleSyncToCRM}
                  disabled={!selectedLeadId}
                  className="py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-[10px] uppercase font-black rounded-lg transition-all shadow shadow-emerald-700/10 flex items-center justify-center gap-1.5"
                >
                  <CheckSquare size={12} /> Sync to Database notes
                </button>
              </div>
            </div>
          )}

          {/* Past Voice Memos History inside active session */}
          <div className="space-y-2.5 pt-3 border-t border-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Voice Dictation Logs</span>
              <span className="text-[8px] font-mono text-slate-500">{savedMemos.length} logged this session</span>
            </div>
            
            {savedMemos.length > 0 ? (
              <div className="space-y-2">
                {savedMemos.map((memo) => (
                  <div key={memo.id} className="bg-slate-900/60 p-3 rounded-xl border border-slate-900/80 text-[11px] leading-relaxed relative text-slate-300 font-sans">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[9.5px] font-bold text-slate-200">Lead: {memo.leadName}</span>
                      <span className="text-[8px] text-slate-500 font-mono">{memo.timestamp} • {memo.duration}s</span>
                    </div>
                    <p className="whitespace-pre-wrap italic font-medium text-[10.5px] bg-slate-950/40 p-2 rounded text-slate-400">
                      "{memo.transcription.substring(0, 80)}{memo.transcription.length > 80 ? '...' : ''}"
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-900/20 text-center py-6 text-[10.5px] text-slate-500 italic rounded-xl border border-slate-900/30">
                Voice logs are clear. Record a voice memo to start.
              </div>
            )}
          </div>

        </div>
      </div>

    </div>
  );
};

export default AIChat;
