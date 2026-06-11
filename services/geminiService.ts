
import { GoogleGenAI, Type } from "@google/genai";
import { Lead, Reminder, Appointment, EmailFollowUp } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const analyzeLead = async (lead: Lead): Promise<{ score: number, insight: string, sentiment: string }> => {
  const ai = getAI();
  const prompt = `Analyze this CRM lead and provide a score (0-100), a short insight about their potential, and their general sentiment based on their status and notes.
  
  Lead Data:
  Name: ${lead.name}
  Company: ${lead.company}
  Status: ${lead.status}
  Notes: ${lead.notes.join(' | ')}
  Source: ${lead.source}
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER },
          insight: { type: Type.STRING },
          sentiment: { type: Type.STRING, description: "Positive, Neutral, or Negative" }
        },
        required: ["score", "insight", "sentiment"]
      }
    }
  });

  try {
    return JSON.parse(response.text || '{}');
  } catch (e) {
    return { score: 50, insight: "Unable to analyze at this time.", sentiment: "Neutral" };
  }
};

export const draftFollowUp = async (lead: Lead): Promise<string> => {
  const ai = getAI();
  const prompt = `Draft a professional follow-up email for a lead named ${lead.name} from ${lead.company}. 
  The current status is ${lead.status}. 
  Lead context: ${lead.aiInsight || 'Interested in our services'}. 
  Keep it concise, friendly, and persuasive.`;

  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: prompt
  });

  return response.text || "Hello, I wanted to follow up on our previous conversation...";
};

export interface ChatActionResponse {
  text: string;
  action?: {
    type: 'create_reminder' | 'create_appointment' | 'create_followup' | 'status_update' | 'none';
    reminder?: {
      text: string;
      dueDate: string;
      leadName?: string;
    };
    appointment?: {
      title: string;
      date: string;
      time: string;
      description?: string;
      leadName?: string;
    };
    followup?: {
      leadName: string;
      subject: string;
      body: string;
      status: 'Draft' | 'Scheduled';
      scheduledDate?: string;
    };
    statusUpdate?: {
      leadId: string;
      status: Lead['status'];
    };
  };
}

export const chatWithCRM = async (
  query: string,
  leads: Lead[],
  reminders: Reminder[] = [],
  appointments: Appointment[] = [],
  emails: EmailFollowUp[] = []
): Promise<ChatActionResponse> => {
  const ai = getAI();
  
  const currentDate = new Date().toISOString().split('T')[0];
  const currentTime = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
  const currentDayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  const contextData = {
    currentDate,
    currentTime,
    currentDayOfWeek,
    leads: leads.map(l => ({ id: l.id, name: l.name, company: l.company, status: l.status, value: l.value, email: l.email })),
    reminders: reminders.map(r => ({ text: r.text, dueDate: r.dueDate, completed: r.completed, leadName: r.leadName })),
    appointments: appointments.map(a => ({ title: a.title, date: a.date, time: a.time, leadName: a.leadName })),
    emails: emails.map(e => ({ subject: e.subject, leadName: e.leadName, status: e.status, scheduledDate: e.scheduledDate }))
  };

  const systemInstruction = `You are Nexus AI, the intelligent, built-in CRM Copilot. Your goal is to help managing lead databases, tracking pipeline information, scheduling agendas, reminders, and drafting email correspondence.

Given the current CRM records below, analyze the user's conversational requests:
1. If the user asks to schedule/add a reminder (e.g. "remind me to call Jane tomorrow" or "set reminder for John: discuss agreement by end of week"):
   - Identify the date (e.g. if today is ${currentDate} (${currentDayOfWeek}), relative terms like "tomorrow" is the day after, "next Tuesday", etc. should be exact YYYY-MM-DD strings).
   - Set action.type = "create_reminder"
   - Match leadName if they referenced a known lead name.
2. If the user asks to set an appointment/meeting (e.g. "schedule a demo with Sarah for Friday at 2:30pm" or "book a call with John Doe for June 15th at 10 AM"):
   - Extract title, YYYY-MM-DD date, and time.
   - Set action.type = "create_appointment"
   - Match leadName if applicable.
3. If the user asks to write/draft/schedule a follow-up email (e.g. "draft email to Sarah Connor" or "schedule follow-up email to John Doe next Monday"):
   - Generate a captivating, professional, and friendly subject line and body context.
   - Set action.type = "create_followup"
   - Populate status as 'Draft' (default) or 'Scheduled' (if they said 'schedule it for next Tuesday...'), and set the YYYY-MM-DD scheduledDate.
4. If the user asks to update a lead's status directly (e.g., "mark Sarah Connor as Qualified" or "demote John Doe to Lost"):
   - Set action.type = "status_update"
   - Match leadId using the closest user ID, and set status strictly to one of: 'New', 'Qualified', 'Negotiation', 'Closed', 'Lost'.
5. If the request is a simple question or chat (e.g., "how many leads do we have?" or "what's our total value?"):
   - Perform the calculations on the context database.
   - Set action.type = "none"

Provide a warm, polite explanation in the "text" property describing your response or summarizing the action you took. Be specific (e.g. say "I've scheduled an appointment with Sarah Connor for Friday at 2:30 PM" rather than just a generic completion).`;

  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: [
      { text: `Context Records:\n${JSON.stringify(contextData, null, 2)}` },
      { text: `User request: ${query}` }
    ],
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          text: { 
            type: Type.STRING, 
            description: "A friendly, conversational explanation of the database response, calculations, or confirming the action taken."
          },
          action: {
            type: Type.OBJECT,
            description: "Optional action structure if a database updates, appointment, reminder, or email draft creation is requested.",
            properties: {
              type: { 
                type: Type.STRING, 
                description: "The action category: 'create_reminder', 'create_appointment', 'create_followup', 'status_update', or 'none'"
              },
              reminder: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING, description: "Reminder details. Max 100 characters." },
                  dueDate: { type: Type.STRING, description: "Formatted YYYY-MM-DD date." },
                  leadName: { type: Type.STRING, description: "Optional name of corresponding lead." }
                },
                required: ["text", "dueDate"]
              },
              appointment: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "Brief matching title for appointment." },
                  date: { type: Type.STRING, description: "Formatted YYYY-MM-DD." },
                  time: { type: Type.STRING, description: "Time of day (e.g., '14:30' or '10:00 AM')" },
                  description: { type: Type.STRING, description: "General description of the purpose." },
                  leadName: { type: Type.STRING, description: "Optional name of corresponding lead." }
                },
                required: ["title", "date", "time"]
              },
              followup: {
                type: Type.OBJECT,
                properties: {
                  leadName: { type: Type.STRING, description: "Name of recipient lead." },
                  subject: { type: Type.STRING, description: "Email subject line." },
                  body: { type: Type.STRING, description: "Full HTML or text email body block." },
                  status: { type: Type.STRING, description: "'Draft' or 'Scheduled'" },
                  scheduledDate: { type: Type.STRING, description: "Formatted YYYY-MM-DD if status is Scheduled." }
                },
                required: ["leadName", "subject", "body", "status"]
              },
              statusUpdate: {
                type: Type.OBJECT,
                properties: {
                  leadId: { type: Type.STRING, description: "The ID or exact matching Name of the lead." },
                  status: { type: Type.STRING, description: "Target status value" }
                },
                required: ["leadId", "status"]
              }
            },
            required: ["type"]
          }
        },
        required: ["text"]
      }
    }
  });

  try {
    const result = JSON.parse(response.text || '{}');
    return result as ChatActionResponse;
  } catch (e) {
    return {
      text: "I completed your query, but could not parse the CRM action block. " + (response.text || ""),
      action: { type: "none" }
    };
  }
};

export interface AudioSummaryResponse {
  transcription: string;
  summary: string;
  suggestedLeadId?: string;
  suggestedLeadName?: string;
  suggestedAction?: string;
}

export const transcribeAndSummarizeAudio = async (
  audioBase64: string,
  mimeType: string,
  allLeads: Lead[]
): Promise<AudioSummaryResponse> => {
  const ai = getAI();
  const leadsContext = allLeads.map(l => ({ id: l.id, name: l.name, company: l.company }));
  
  const prompt = `You are a professional audio transcriber and CRM automation system. 
  
  Instructions:
  1. Carefully transcribe the spoken words in the provided audio file exactly as spoken into the "transcription" field. If there are no spoken words, transcribe it as "[No voice detected/silence]".
  2. Create a clean, bulleted, professional summary of the audio memo in the "summary" field. Keep it suitable as a CRM professional note. Be specific, listing names, numbers, prices, or requests mentioned.
  3. Based on the transcription and the list of active leads below, identify if the audio is talking about any specific lead. If so, return their exact matching lead ID in "suggestedLeadId" and their lead name in "suggestedLeadName".
  4. Suggest any next actions mentioned (e.g., 'Update status to Qualified', 'Schedule meeting', or leave empty).
  
  Active Leads List:
  ${JSON.stringify(leadsContext, null, 2)}
  `;

  const audioPart = {
    inlineData: {
      mimeType,
      data: audioBase64
    }
  };

  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: [audioPart, { text: prompt }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          transcription: { type: Type.STRING },
          summary: { type: Type.STRING, description: "A structured executive bulleted summary of notes." },
          suggestedLeadId: { type: Type.STRING, description: "The matching lead ID if applicable, else empty string." },
          suggestedLeadName: { type: Type.STRING, description: "The matching lead name if applicable, else empty string." },
          suggestedAction: { type: Type.STRING, description: "Suggested next action." }
        },
        required: ["transcription", "summary"]
      }
    }
  });

  try {
    return JSON.parse(response.text || '{}');
  } catch (e) {
    console.error("Failed to parse transcription JSON response", e);
    return {
      transcription: "Could not transcribe audio.",
      summary: response.text || "Detailed audio log analyzed by AI."
    };
  }
};


