
export interface Lead {
  id: string;
  name: string;
  email: string;
  company: string;
  status: 'New' | 'Qualified' | 'Negotiation' | 'Closed' | 'Lost';
  priority: 'High' | 'Medium' | 'Low';
  source: string;
  value: number;
  lastContacted: string;
  notes: string[];
  aiScore?: number;
  aiInsight?: string;
  sentiment?: 'Positive' | 'Neutral' | 'Negative';
}

export interface Activity {
  id: string;
  leadId: string;
  type: 'Email' | 'Call' | 'Meeting' | 'Website Interaction';
  description: string;
  timestamp: string;
}

export interface DashboardStats {
  totalLeads: number;
  totalValue: number;
  conversionRate: number;
  activeNegotiations: number;
}

export interface Reminder {
  id: string;
  leadId?: string;
  leadName?: string;
  text: string;
  dueDate: string;
  completed: boolean;
  timestamp: string;
}

export interface Appointment {
  id: string;
  leadId?: string;
  leadName?: string;
  title: string;
  description?: string;
  date: string;
  time: string;
  timestamp: string;
}

export interface EmailFollowUp {
  id: string;
  leadId?: string;
  leadName: string;
  recipientEmail: string;
  subject: string;
  body: string;
  status: 'Draft' | 'Scheduled' | 'Sent';
  scheduledDate?: string;
  timestamp: string;
}

