import React, { useState, useEffect } from 'react';
import { 
  Copy, 
  Check, 
  Terminal, 
  Globe, 
  Code2, 
  BarChart3, 
  Activity, 
  RefreshCw, 
  Sparkles, 
  Play, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  ArrowRight
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';

interface AnalyticsDataPoint {
  time: string;
  visitors: number;
  conversions: number;
}

interface EventLog {
  id: string;
  event: string;
  tag: string;
  timestamp: string;
  payload: string;
}

const getSeedFromTag = (tag: string): number => {
  if (!tag) return 42;
  return tag.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
};

// Generates persistent pseudo-random metrics baseline given a seed
const generateInitialData = (seed: number): AnalyticsDataPoint[] => {
  const hours = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];
  return hours.map((hour, idx) => {
    // Generate a clean wavy baseline using sine waves
    const factor = Math.abs(Math.sin((seed + idx * 4) * 0.7)) * 240;
    const visitors = Math.round(80 + factor);
    const conversions = Math.round(visitors * (0.03 + Math.abs(Math.cos(seed + idx * 3)) * 0.08));
    return {
      time: hour,
      visitors,
      conversions
    };
  });
};

const IntegrationCode: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'sdk' | 'analytics'>('sdk');
  const [copied, setCopied] = useState<string | null>(null);

  // Google Analytics Tag State - persisted
  const [gaTagId, setGaTagId] = useState<string>(() => {
    return localStorage.getItem('nexus_ga_tag_id') || 'G-LM3D5X0492';
  });

  const [validationMsg, setValidationMsg] = useState<string>('');

  // Graph state representing the dynamic tracking database
  const [analyticsData, setAnalyticsData] = useState<AnalyticsDataPoint[]>(() => {
    const seed = getSeedFromTag(gaTagId);
    return generateInitialData(seed);
  });

  // Event stream list showing real-time tracker logs
  const [eventLogs, setEventLogs] = useState<EventLog[]>([]);

  // Real-time fluctuating visitor interval
  const [activeRate, setActiveRate] = useState<number>(() => {
    return Math.round(15 + (getSeedFromTag(gaTagId) % 35));
  });

  // Track state changes based on changing the tag ID
  useEffect(() => {
    localStorage.setItem('nexus_ga_tag_id', gaTagId);
    const seed = getSeedFromTag(gaTagId);
    setAnalyticsData(generateInitialData(seed));
    setActiveRate(Math.round(15 + (seed % 35)));
    
    // Add validation message feed
    if (gaTagId.trim() === '') {
      setValidationMsg('Configure a Measurement Tag (e.g., G-XXXXXX) to enable tracking streams.');
    } else if (!gaTagId.startsWith('G-')) {
      setValidationMsg('Warning: Standard GA4 tags typically begin with "G-" format.');
    } else {
      setValidationMsg('Google Analytics tracking engine successfully listening to events.');
    }
  }, [gaTagId]);

  // Fluctuating real-time user background simulator
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveRate(prev => {
        const delta = Math.floor(Math.random() * 5) - 2;
        return Math.max(5, prev + delta);
      });
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  // Google Analytics dynamic script block
  const getGtagCode = () => {
    const tag = gaTagId.trim() || 'G-XXXXXXXXXX';
    return `<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${tag}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', '${tag}', {
    'send_page_view': true,
    'custom_map': { 'dimension1': 'lead_source' }
  });
</script>`;
  };

  const widgetCode = `<script>
  window.NEXUS_CRM_CONFIG = {
    apiKey: 'YOUR_PUBLIC_KEY',
    target: 'https://nexus-crm-api.com/v1/leads',
    gaMeasurementId: '${gaTagId || 'G-XXXXXXXXXX'}'
  };
</script>
<script src="https://cdn.nexus-crm.com/widget.js" async></script>`;

  const apiCode = `fetch('https://nexus-crm-api.com/v1/leads', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_SECRET_KEY',
    'Content-Type': 'application/json',
    'X-GA-Measurement-ID': '${gaTagId || 'G-XXXXXXXXXX'}'
  },
  body: JSON.stringify({
    name: 'Jane Doe',
    email: 'jane@example.com',
    company: 'Future Tech',
    source: 'Landing Page',
    ga_client_id: '19827391.392819'
  })
});`;

  // Trigger simulated Tracking Event Hit (creates real visual peaks on charts)
  const triggerSimulation = (type: 'page_view' | 'lead_submission' | 'error_ping') => {
    const tag = gaTagId.trim() || 'G-XXXXXXXXXX';
    const cities = ['New York', 'London', 'San Francisco', 'Chicago', 'Tokyo', 'Berlin', 'Sydney', 'Austin'];
    const chosenCity = cities[Math.floor(Math.random() * cities.length)];
    const ipMock = `192.168.${Math.floor(Math.random() * 20) + 1}.${Math.floor(Math.random() * 240) + 10}`;

    // 1. Log simulation details in telemetry payload standard
    const newLog: EventLog = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      event: type === 'page_view' ? 'gtag("event", "page_view")' : type === 'lead_submission' ? 'gtag("event", "generate_lead")' : 'gtag("event", "exception")',
      tag: tag,
      timestamp: new Date().toLocaleTimeString(),
      payload: JSON.stringify({
        gtag_id: tag,
        client_id: `cid-${Math.floor(Math.random() * 9000000) + 1000000}.${Math.floor(Math.random() * 9000) + 1000}`,
        properties: {
          location: chosenCity,
          ip_address: ipMock,
          user_agent: 'Chrome/120.0 - Webkit',
          page_path: type === 'page_view' ? '/' : '/join-nexus-web-portal',
          value: type === 'lead_submission' ? 500 : 0
        }
      }, null, 2)
    };

    setEventLogs(prev => [newLog, ...prev.slice(0, 19)]); // keep last 20 logs

    // 2. Insert metrics dynamically directly into our chart state
    setAnalyticsData(prev => {
      const updated = [...prev];
      const lastIndex = updated.length - 1;
      if (lastIndex >= 0) {
        if (type === 'page_view') {
          updated[lastIndex] = {
            ...updated[lastIndex],
            visitors: updated[lastIndex].visitors + 12
          };
          // Temporarily bump real-time visitors counter
          setActiveRate(r => r + 8);
        } else if (type === 'lead_submission') {
          updated[lastIndex] = {
            ...updated[lastIndex],
            visitors: updated[lastIndex].visitors + 25,
            conversions: updated[lastIndex].conversions + 1
          };
          setActiveRate(r => r + 15);
        } else {
          setActiveRate(r => Math.max(2, r - 5));
        }
      }
      return updated;
    });
  };

  // Compute calculated metrics summary
  const totalSessions = analyticsData.reduce((acc, curr) => acc + curr.visitors, 0);
  const totalLeadConversions = analyticsData.reduce((acc, curr) => acc + curr.conversions, 0);
  const conversionRate = totalSessions > 0 ? ((totalLeadConversions / totalSessions) * 100).toFixed(1) : '0.0';

  // Static chart split distribution showing dynamic channels
  const sourceDistribution = [
    { name: 'Organic Search', value: Math.round(totalSessions * 0.35), fill: '#3b82f6' },
    { name: 'Direct Traffic', value: Math.round(totalSessions * 0.25), fill: '#6366f1' },
    { name: 'CRM Web Form', value: Math.round(totalSessions * 0.20) + (totalLeadConversions * 3), fill: '#10b981' },
    { name: 'Referrals', value: Math.round(totalSessions * 0.12), fill: '#f59e0b' },
    { name: 'REST API Webhook', value: Math.round(totalSessions * 0.08) + (eventLogs.length * 5), fill: '#a855f7' }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 text-left font-sans">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">API & Analytics Suite</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure Google Analytics (GA4) tag pixels, export CRM form capture schemas, and access robust developer tools.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-slate-100 dark:bg-slate-805 p-1 rounded-xl self-start md:self-center border border-slate-200/40 dark:border-slate-800/60 shadow-sm">
          <button
            onClick={() => setActiveSubTab('sdk')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeSubTab === 'sdk'
                ? 'bg-white dark:bg-slate-750 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Code2 size={14} />
            <span>Form SDKs & API Hooks</span>
          </button>
          <button
            onClick={() => setActiveSubTab('analytics')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeSubTab === 'analytics'
                ? 'bg-white dark:bg-slate-750 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <BarChart3 size={14} />
            <span>GA4 Live Visual Insights</span>
          </button>
        </div>
      </header>

      {/* Global Google Analytics Tag Input Bar */}
      <section className="bg-slate-50 dark:bg-slate-850 p-5 rounded-2xl border border-slate-150 dark:border-slate-800/80 grid md:grid-cols-3 gap-5 items-center">
        <div className="space-y-1">
          <label className="block text-[11px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5">
            <Globe size={11} className="text-indigo-550" />
            <span>Configure GA4 Measurement Key</span>
          </label>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
            Connect your website tracking script to pipe page visit signals directly into analytical graphs and dashboards below.
          </p>
        </div>

        <div>
          <div className="relative">
            <input
              type="text"
              value={gaTagId}
              onChange={(e) => setGaTagId(e.target.value)}
              placeholder="G-XXXXXXXXXX"
              className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-bold font-mono tracking-wider text-slate-900 dark:text-slate-100 pr-10"
            />
            {gaTagId && (
              <div className="absolute right-3.5 top-3.5 leading-none">
                <CheckCircle2 size={15} className="text-green-500" />
              </div>
            )}
          </div>
        </div>

        <div className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs font-semibold ${
          gaTagId ? 'bg-emerald-50/20 dark:bg-emerald-950/20 border-emerald-100/50 dark:border-emerald-900/30 text-emerald-70s dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-550'
        }`}>
          {gaTagId ? (
            <>
              <Activity size={16} className="shrink-0 text-emerald-500 animate-pulse mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold">Active Connection Stream Listening</span>
                <p className="text-[10px] text-slate-500 dark:text-slate-455 font-medium leading-normal">
                  {validationMsg}
                </p>
              </div>
            </>
          ) : (
            <>
              <AlertCircle size={16} className="shrink-0 text-amber-500 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold">No Active Stream Connected</span>
                <p className="text-[10px] text-slate-500 font-medium leading-normal">
                  Configure tracking credentials on the left to activate visual charts.
                </p>
              </div>
            </>
          )}
        </div>
      </section>

      {/* SUB-TAB 1: Form SDKs & API Hooks */}
      {activeSubTab === 'sdk' && (
        <div className="grid gap-8">
          {/* Option 0: Google Analytics Embed Integration Snippet */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex items-start md:items-center justify-between gap-3 flex-col md:flex-row">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl flex items-center justify-center text-indigo-600">
                  <Globe size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-850 dark:text-slate-150">A. Unified Google Tag embed (gtag.js)</h3>
                  <p className="text-xs text-slate-500">Inject this tag into your website's header to bootstrap metrics capture.</p>
                </div>
              </div>
              
              <button 
                onClick={() => handleCopy(getGtagCode(), 'gtag')}
                className="text-xs dark:bg-slate-800 dark:hover:bg-slate-750 dark:border-slate-700 dark:text-slate-300 font-semibold px-4 py-2 border rounded-xl hover:bg-slate-50 transition cursor-pointer flex items-center gap-2 self-end md:self-auto"
              >
                {copied === 'gtag' ? (
                  <>
                    <Check size={14} className="text-green-500" />
                    <span>Copied Code</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Copy Snippet</span>
                  </>
                )}
              </button>
            </div>

            <div className="relative">
              <pre className="bg-slate-900 dark:bg-slate-950 text-emerald-400 dark:text-emerald-300 p-6 rounded-xl overflow-x-auto text-xs font-mono leading-relaxed max-h-[220px] border border-slate-850 shadow-inner">
                <code>{getGtagCode()}</code>
              </pre>
            </div>
          </div>

          {/* Option 1: Widget */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex items-start md:items-center justify-between gap-3 flex-col md:flex-row">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950/60 rounded-xl flex items-center justify-center text-blue-600">
                  <Globe size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-850 dark:text-slate-150">B. Brandable Contact Widget Script</h3>
                  <p className="text-xs text-slate-500">Add an interactive roofing / solar consultation bubble to any host domain.</p>
                </div>
              </div>
              
              <button 
                onClick={() => handleCopy(widgetCode, 'widget')}
                className="text-xs dark:bg-slate-800 dark:hover:bg-slate-750 dark:border-slate-705 dark:text-slate-300 font-semibold px-4 py-2 border rounded-xl hover:bg-slate-50 transition cursor-pointer flex items-center gap-2 self-end md:self-auto"
              >
                {copied === 'widget' ? (
                  <>
                    <Check size={14} className="text-green-500" />
                    <span>Copied Code</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Copy Snippet</span>
                  </>
                )}
              </button>
            </div>

            <div className="relative">
              <pre className="bg-slate-900 dark:bg-slate-950 text-slate-300 p-6 rounded-xl overflow-x-auto text-xs font-mono leading-relaxed border border-slate-850 shadow-inner">
                <code>{widgetCode}</code>
              </pre>
            </div>
          </div>

          {/* Option 2: API */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex items-start md:items-center justify-between gap-3 flex-col md:flex-row">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-50 dark:bg-purple-950/60 rounded-xl flex items-center justify-center text-purple-600">
                  <Terminal size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-855 dark:text-slate-150">C. CRM REST API Lead Hook</h3>
                  <p className="text-xs text-slate-500">Inject raw JSON leads from headless landing pages, Webflow, or backends.</p>
                </div>
              </div>
              
              <button 
                onClick={() => handleCopy(apiCode, 'api')}
                className="text-xs dark:bg-slate-800 dark:hover:bg-slate-750 dark:border-slate-705 dark:text-slate-300 font-semibold px-4 py-2 border rounded-xl hover:bg-slate-50 transition cursor-pointer flex items-center gap-2 self-end md:self-auto"
              >
                {copied === 'api' ? (
                  <>
                    <Check size={14} className="text-green-500" />
                    <span>Copied Code</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Copy Snippet</span>
                  </>
                )}
              </button>
            </div>

            <div className="relative">
              <pre className="bg-slate-900 dark:bg-slate-950 text-indigo-200 p-6 rounded-xl overflow-x-auto text-xs font-mono leading-relaxed border border-slate-850 shadow-inner">
                <code>{apiCode}</code>
              </pre>
            </div>
          </div>

          {/* Integration Steps */}
          <div className="grid md:grid-cols-3 gap-6">
            <StepCard number="01" title="Validate Credentials" desc="Provide client credentials and link your unique G-XXXXXXXXXX GA4 measurement key." />
            <StepCard number="02" title="Paste HTML Headers" desc="Embed the Google Analytics tag and the secure tracking widget onto your target host page." />
            <StepCard number="03" title="Real-Time Logging" desc="As users interact, hits automatically route tracking payloads into your analytical graphs in real-time." />
          </div>
        </div>
      )}

      {/* SUB-TAB 2: GA4 Live Visual Insights */}
      {activeSubTab === 'analytics' && (
        <div className="space-y-8 animate-in fade-in-20 duration-300">
          
          {/* Key Metrics Dashboard Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-slate-450">
                <span className="text-[10px] font-bold uppercase tracking-wider">Active Stream Visitors</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-550 animate-ping"></span>
              </div>
              <div className="flex items-baseline gap-2 pt-1">
                <span className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">
                  {activeRate}
                </span>
                <span className="text-[10px] font-bold text-emerald-500">+12% vs last hour</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Real-time active users on hosted tracking script page.</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-2xs space-y-1">
              <div className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">Estimated Sessions</div>
              <div className="flex items-baseline gap-2 pt-1">
                <span className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">
                  {totalSessions.toLocaleString()}
                </span>
                <span className="text-[10px] font-bold text-indigo-500">Gtag metrics</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Total registered Web hit events parsed since container boot.</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-2xs space-y-1">
              <div className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">Generated Leads</div>
              <div className="flex items-baseline gap-2 pt-1">
                <span className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">
                  {totalLeadConversions}
                </span>
                <span className="text-[10px] font-bold text-teal-500">Conv Goal 1</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Submissions registering fully registered profiles.</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-2xs space-y-1">
              <div className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">Lead Conversion Rate</div>
              <div className="flex items-baseline gap-2 pt-1">
                <span className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">
                  {conversionRate}%
                </span>
                <span className="text-[10px] font-bold text-purple-500">Optimal target 4%</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Mathematical efficiency of your embedded contact forms.</p>
            </div>
          </div>

          {/* Sandbox Controls - Play Live Web Events */}
          <div className="bg-slate-950 text-slate-100 p-6 rounded-2xl border border-slate-850 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-slate-205 tracking-wider uppercase flex items-center gap-1.5">
                  <Play size={13} className="text-indigo-400" />
                  <span>Google Tag Sandbox Interactive Trigger Simulator</span>
                </h4>
                <p className="text-[10px] text-slate-450 leading-normal font-sans font-medium">
                  Trigger mock external user actions below to generate live tracking data and test connection pathways visually in real-time.
                </p>
              </div>

              <div className="text-[10px] font-mono bg-indigo-950 text-indigo-300 border border-indigo-900 px-2 py-0.5 rounded">
                Gtag target: {gaTagId || 'None'}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => triggerSimulation('page_view')}
                disabled={!gaTagId}
                className="px-4 py-2 hover:bg-slate-900 border border-white/10 bg-slate-900/60 font-semibold rounded-xl text-xs flex items-center gap-2 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Activity size={14} className="text-sky-400" />
                <span>Simulate Web Pageview Hit (+12 sessions)</span>
              </button>

              <button
                onClick={() => triggerSimulation('lead_submission')}
                disabled={!gaTagId}
                className="px-4 py-2 hover:bg-indigo-905 border border-indigo-700/40 bg-indigo-950/70 font-semibold rounded-xl text-xs flex items-center gap-2 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Sparkles size={14} className="text-yellow-405" />
                <span>Simulate CRM Consultation Sign-up (+1 lead)</span>
              </button>

              <button
                onClick={() => triggerSimulation('error_ping')}
                disabled={!gaTagId}
                className="px-4 py-2 hover:bg-slate-900 border border-white/10 bg-slate-900/60 font-semibold rounded-xl text-xs flex items-center gap-2 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-stone-300"
              >
                <RefreshCw size={12} className="text-amber-500 animate-spin" />
                <span>Simulate Fluctuations (Fluctuate users)</span>
              </button>
            </div>
          </div>

          {/* Visual Recharts Graphs Container Section */}
          <div className="grid md:grid-cols-3 gap-8">
            
            {/* Hour-by-Hour Traffic Trend Area Chart */}
            <div className="col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-extrabold text-slate-850 dark:text-slate-100">12-Hour Traffic Analytics Timeline</h4>
                  <p className="text-[11px] text-slate-500">Detailed overview of active page views and goal conversions tracked.</p>
                </div>
                <div className="flex items-center gap-2.5 text-[10px] font-bold font-sans">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                    <span>Sessions</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>Goal Conversions</span>
                  </span>
                </div>
              </div>

              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analyticsData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0}/>
                      </linearGradient>
                      <linearGradient id="colorConversions" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-850" />
                    <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#0f172a', 
                        borderColor: '#1e293b', 
                        borderRadius: '0.75rem', 
                        fontSize: '11px',
                        color: '#f8fafc'
                      }}
                      labelClassName="font-extrabold pb-0.5 border-b border-slate-800 text-xs text-indigo-400"
                    />
                    <Area type="monotone" name="Web Visitors" dataKey="visitors" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorVisitors)" />
                    <Area type="monotone" name="Lead Signups" dataKey="conversions" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorConversions)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Traffic Acquisition Pie/Bar Chart */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
              <div>
                <h4 className="text-sm font-extrabold text-slate-850 dark:text-slate-100">Traffic Acquisition Channels</h4>
                <p className="text-[11px] text-slate-500">Distribution of inbound user discovery streams.</p>
              </div>

              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sourceDistribution} layout="vertical" margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" className="dark:stroke-slate-850" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 9, fill: '#64748b', fontWeight: 'bold' }} width={85} axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#0f172a', 
                        borderColor: '#1e293b', 
                        borderRadius: '0.75rem', 
                        fontSize: '11px',
                        color: '#f8fafc'
                      }}
                    />
                    <Bar dataKey="value" name="Sessions" radius={[0, 4, 4, 0]}>
                      {sourceDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Dynamic Legend List with percentages */}
              <div className="space-y-1.5 pt-1">
                {sourceDistribution.map((dist, idx) => {
                  const pct = totalSessions > 0 ? ((dist.value / totalSessions) * 100).toFixed(0) : '0';
                  return (
                    <div key={idx} className="flex items-center justify-between text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: dist.fill }} />
                        <span className="truncate max-w-[120px]">{dist.name}</span>
                      </div>
                      <div className="font-mono text-slate-900 dark:text-slate-200">
                        {dist.value} <span className="text-slate-400">({pct}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>

          </div>

          {/* Dynamic Google Tag Event Stream Logger Console */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></div>
                <h4 className="text-xs font-black uppercase text-slate-300 font-mono tracking-widest">
                  Live gtag.js Event Payload Telemetry Console ({eventLogs.length} events logged)
                </h4>
              </div>

              <button
                onClick={() => setEventLogs([])}
                className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors font-mono font-bold cursor-pointer underline"
              >
                Clear Stream logs
              </button>
            </div>

            {eventLogs.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500 font-mono italic">
                {gaTagId 
                  ? 'No interactive events recorded in this session. Trigger simulated actions above to dispatch telemetry packages.'
                  : 'Establish a Google Analytics G-XXXXXX Measurement Tag above to open target console outputs.'}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4 max-h-[290px] overflow-y-auto pr-1">
                {eventLogs.map((log) => (
                  <div key={log.id} className="bg-slate-950 p-4 rounded-xl border border-slate-850/60 font-mono text-[10px] text-slate-300 space-y-2 select-text text-left">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-900">
                      <span className="text-indigo-400 font-bold">{log.event}</span>
                      <span className="text-zinc-500">{log.timestamp}</span>
                    </div>
                    <pre className="text-slate-400 overflow-x-auto leading-relaxed max-h-[140px] whitespace-pre p-1">
                      <code>{log.payload}</code>
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
};

const StepCard: React.FC<{ number: string, title: string, desc: string }> = ({ number, title, desc }) => (
  <div className="p-6 bg-slate-50 dark:bg-slate-805 rounded-2xl border border-slate-205/60 dark:border-slate-800/80">
    <div className="text-2xl font-black text-indigo-600/20 mb-2">{number}</div>
    <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-1 text-sm">{title}</h4>
    <p className="text-xs text-slate-500 dark:text-slate-405 leading-relaxed font-semibold">{desc}</p>
  </div>
);

export default IntegrationCode;
