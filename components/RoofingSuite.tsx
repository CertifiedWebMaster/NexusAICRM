import React, { useState } from 'react';
import { 
  CloudRain, ShieldAlert, Hammer, FileText, CheckSquare, Truck, Calendar, 
  MapPin, AlertCircle, Compass, Circle, CheckCircle, RefreshCw, Layers, 
  ArrowRight, ShieldCheck, Mail, ClipboardCheck, Info
} from 'lucide-react';
import { Lead } from '../types';

interface RoofingSuiteProps {
  leads: Lead[];
  onAddReminder: (reminder: any) => void;
  onAddEmail: (email: any) => void;
}

const FLORIDA_STORM_CELL_DATA = [
  { id: 'st-1', county: 'Hillsborough County (Tampa)', status: 'Severe Hail Warning', speed: '48 mph gust', advisories: 'Roof damage likely. Active storm-related prospecting recommended.', risk: 'Critical' },
  { id: 'st-2', county: 'Orange County (Orlando)', status: 'High Winds Warning', speed: '35 mph gust', advisories: 'Subcontractor crew mobilization alerts issued.', risk: 'Elevated' },
  { id: 'st-3', county: 'Miami-Dade County', status: 'Tropical Depressional Warning', speed: '55 mph gust', advisories: 'Permit offices closed Tuesday.', risk: 'Moderate' },
];

const INITIAL_ROOFING_PERMITS = [
  { id: 'perm-1', client: 'Sarah Connor', location: 'Tampa, FL', status: 'Board Approved', permitNo: 'FL-PM-89410', codeOffice: 'Hillsborough County Permitting', lastUpdated: '2026-06-08' },
  { id: 'perm-2', client: 'John Doe', location: 'Orlando, FL', status: 'Under Inspection', permitNo: 'FL-PM-20935', codeOffice: 'Orange County Code Office', lastUpdated: '2026-06-10' },
  { id: 'perm-3', client: 'Marcus Brody', location: 'Jacksonville, FL', status: 'Initial File Stage', permitNo: 'FL-PM-44810', codeOffice: 'Duval County Building Department', lastUpdated: '2026-06-05' },
];

const INITIAL_INSURANCE_CLAIMS = [
  { id: 'clm-1', client: 'Sarah Connor', carrier: 'Citizens Florida', claimNo: 'CIT-8X2-901', status: 'Carrier Counter-Offer', amount: 14200, supplementMonitor: 'Requested supplement $4,200 for decking repairs', lastUpdated: '2026-06-09' },
  { id: 'clm-2', client: 'John Doe', carrier: 'Progressive Home', claimNo: 'PRG-441-332', status: 'Deductible Approved', amount: 8400, supplementMonitor: 'In negotiation over overhead and profit supplement', lastUpdated: '2026-06-10' },
  { id: 'clm-3', client: 'Marcus Brody', carrier: 'State Farm Financial', claimNo: 'SF-991-008', status: 'Supplements Approved', amount: 22100, supplementMonitor: 'Decking and underlayment materials supplement cleared', lastUpdated: '2026-06-04' },
];

const INITIAL_MATERIAL_ALERTS = [
  { id: 'mat-1', client: 'Sarah Connor', material: '40 Squares Lifetime Charcoal Shingles', vendor: 'ABC Supply Tampa', deliveryDate: '2026-06-12', deliveryTime: '08:00 AM', status: 'Shipped' },
  { id: 'mat-2', client: 'John Doe', material: '32 Squares Premium Ridge Cap & Nails', vendor: 'Beacon Pro Orlando', deliveryDate: '2026-06-14', deliveryTime: '11:30 AM', status: 'Ordered' },
  { id: 'mat-3', client: 'Marcus Brody', material: '45 Squares Slate Gray Synthetic Underlayment', vendor: 'SRS Distribution Jax', deliveryDate: '2026-06-11', deliveryTime: '02:00 PM', status: 'Delivered' },
];

const ROOF_CREW_SCHEDULE = [
  { id: 'crw-1', name: 'Tampa Crew Alpha (Storm)', jobSite: 'Sarah Connor House', currentTask: 'Felt Paper & Deck Inspections', members: 5, status: 'On Site' },
  { id: 'crw-2', name: 'Orlando Crew Beta', jobSite: 'John Doe House', currentTask: 'Drip Edge Install', members: 4, status: 'Departing base' },
  { id: 'crw-3', name: 'North FL Crew Gamma', jobSite: 'Jacksonville Complex', currentTask: 'Awaiting Materials Delivery', members: 6, status: 'Standby' },
];

export const RoofingSuite: React.FC<RoofingSuiteProps> = ({ leads, onAddReminder, onAddEmail }) => {
  const [permits, setPermits] = useState(INITIAL_ROOFING_PERMITS);
  const [claims, setClaims] = useState(INITIAL_INSURANCE_CLAIMS);
  const [materialAlerts, setMaterialAlerts] = useState(INITIAL_MATERIAL_ALERTS);
  const [activeTab, setActiveTab] = useState<'storm' | 'permits' | 'insurance' | 'materials'>('storm');

  // Trigger quick storm outreach logic
  const handleLaunchStormOutreach = (county: string) => {
    onAddEmail({
      leadName: 'Tampa Roofing Projections',
      recipientEmail: 'contractor-alert@floridaroofers.org',
      subject: `Storm Assessment Warning: Wind speeds and hail in ${county}`,
      body: `Notice and Checklist for ${county}:\n\nA Severe Weather Advisory was flagged. This automation script has compiled storm-damaged home addresses inside the active county zone.\nPlease dispatch inspector crews immediately and pull the localized permit files.\n\nSent on behalf of Florida Roof Consultants AI Overlay`,
      status: 'Scheduled',
      scheduledDate: new Date().toISOString().split('T')[0]
    });
    alert(`System action compiled! Launched pre-emptive storm recovery email sequence for matching roofing prospects in ${county}.`);
  };

  const handleUpdatePermitStatus = (id: string, newStatus: string) => {
    setPermits(prev => prev.map(p => p.id === id ? { ...p, status: newStatus as any, lastUpdated: new Date().toISOString().split('T')[0] } : p));
  };

  const handleUpdateClaimStatus = (id: string, newStatus: string) => {
    setClaims(prev => prev.map(c => c.id === id ? { ...c, status: newStatus as any, lastUpdated: new Date().toISOString().split('T')[0] } : p => p));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Florida Roof Consultants Header Cover */}
      <div className="bg-gradient-to-r from-teal-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-8 border border-teal-500/10 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-2/5 h-full bg-gradient-to-l from-teal-500/10 to-transparent pointer-events-none"></div>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 bg-teal-500/20 text-teal-300 font-bold px-3 py-1 rounded-full text-xs font-mono">
              <Compass size={14} className="animate-spin text-teal-400" />
              <span>FLORIDA ROOF CONSULTANTS EXCLUSIVE PORTAL</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight">Roofing Intelligence Suite</h2>
            <p className="text-slate-350 text-sm max-w-2xl leading-relaxed">
              Tailored workflow enhancements designed exclusively for Florida residential builders. Seamlessly monitor live weather cell triggers, track underwriting approvals, supplement allocations, active permits, and material workflows.
            </p>
          </div>
          <div className="bg-slate-800/60 backdrop-blur border border-teal-500/20 p-4.5 rounded-2xl flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-ping"></div>
            <div>
              <span className="text-[10px] uppercase font-black text-slate-400">Storm Sensor Node</span>
              <p className="text-[11px] text-teal-400 font-bold font-mono">Hillsborough radar online</p>
            </div>
          </div>
        </div>
      </div>

      {/* Internal Navigation Subtabs */}
      <div className="flex border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('storm')}
          className={`px-5 py-3 font-semibold text-xs uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'storm' 
              ? 'border-teal-600 text-teal-700 font-extrabold' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          🌪️ Storm Prospector
        </button>
        <button 
          onClick={() => setActiveTab('permits')}
          className={`px-5 py-3 font-semibold text-xs uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'permits' 
              ? 'border-teal-600 text-teal-700 font-extrabold' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          📜 Permit Tracker
        </button>
        <button 
          onClick={() => setActiveTab('insurance')}
          className={`px-5 py-3 font-semibold text-xs uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'insurance' 
              ? 'border-teal-600 text-teal-700 font-extrabold' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          🤝 Insurance Claims & Supplements
        </button>
        <button 
          onClick={() => setActiveTab('materials')}
          className={`px-5 py-3 font-semibold text-xs uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'materials' 
              ? 'border-teal-600 text-teal-700 font-extrabold' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          🚛 Material & Production Alerts
        </button>
      </div>

      {/* Active Tab Screen Component Panels */}
      {activeTab === 'storm' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Animated Florida Satellite radar Simulation */}
          <div className="lg:col-span-2 bg-slate-950 text-white p-6 rounded-2xl border border-slate-850 shadow-sm flex flex-col justify-between overflow-hidden relative min-h-[440px]">
            <div className="absolute top-0 right-0 p-3 bg-red-600/10 text-red-400 font-black text-[9px] uppercase tracking-widest border border-red-500/20 rounded-bl-xl">
              🔴 Live Radar Scan feed
            </div>

            <div>
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800/80 mb-4 bg-teal-900/10 p-2.5 rounded border border-teal-500/20">
                <Compass className="text-teal-400 animate-spin" size={16} />
                <h4 className="font-bold text-slate-100 text-xs tracking-wider uppercase">Florida Regional Weather Advisory Matrix</h4>
              </div>
              <p className="text-xs text-slate-450 leading-relaxed max-w-xl">
                Continuous radar integration monitors heavy lightning downstrikes, winds, and severe hail cells. The database automatically extracts home age coordinates within advisory vectors to flag optimal storm-restoration lead prospecting!
              </p>

              {/* Realistic CSS Simulated Radar concentric rings */}
              <div className="flex items-center justify-center py-6">
                <div className="relative w-48 h-48 rounded-full border border-teal-500/30 flex items-center justify-center animate-pulse">
                  <div className="absolute w-36 h-36 rounded-full border border-teal-500/20 flex items-center justify-center">
                    <div className="absolute w-24 h-24 rounded-full border border-teal-500/15 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping"></div>
                    </div>
                  </div>
                  {/* Sweep arm */}
                  <div className="absolute left-1/2 top-1/2 w-24 h-0.5 bg-gradient-to-r from-teal-500 to-transparent origin-left rotate-45 animate-[spin_4s_linear_infinite]"></div>
                  
                  {/* Flg Dots for Tampa, Miami, Orlando */}
                  <span className="absolute text-[8px] font-bold text-teal-400/80 font-mono left-5 top-12 flex items-center gap-1">
                    <span className="w-1 h-1 bg-teal-400 rounded-full"></span> Tampa Cell
                  </span>
                  <span className="absolute text-[8px] font-bold text-red-400/80 font-mono right-8 top-16 flex items-center gap-1 animate-pulse">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span> Hail Vector
                  </span>
                  <span className="absolute text-[8px] font-bold text-teal-400/80 font-mono bottom-12 left-16 flex items-center gap-1">
                    <span className="w-1 h-1 bg-teal-400 rounded-full"></span> Orlando Cell
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="text-xs">
                <strong className="block text-slate-200">Florida Storm Prospecting Algorithm</strong>
                <span className="block text-slate-450 text-[10.5px] mt-0.5">Calculates hail size metrics exceeding 1 inch to queue automatic phone and email workflows.</span>
              </div>
              <button 
                onClick={() => alert("Scattered storm reports matching Duval, FL loaded into active pipeline.")}
                className="bg-teal-600 hover:bg-teal-700 text-xs font-bold px-4 py-2 rounded-lg text-white transition-all shadow"
              >
                Trigger Automatic Lead Batch
              </button>
            </div>
          </div>

          {/* Storm Cells list */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-1.5">
                  <CloudRain className="text-teal-600 animate-pulse" size={18} />
                  <h3 className="font-bold text-slate-800">Severe Cell Feeds</h3>
                </div>
                <span className="text-[10px] bg-red-50 text-red-700 font-extrabold px-1.5 py-0.5 rounded uppercase">Active Radar</span>
              </div>

              <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                {FLORIDA_STORM_CELL_DATA.map(cell => (
                  <div key={cell.id} className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl space-y-2 hover:border-teal-200 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">{cell.county}</span>
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded font-mono ${
                        cell.risk === 'Critical' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {cell.risk}
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-500 font-medium space-y-1">
                      <p className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Alert: <strong className="text-slate-700">{cell.status}</strong>
                      </p>
                      <p className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Winds: <strong className="text-slate-700">{cell.speed}</strong>
                      </p>
                      <p className="text-slate-600 leading-normal italic mt-1 bg-white p-1.5 rounded border border-slate-100">
                        "{cell.advisories}"
                      </p>
                    </div>

                    <button 
                      onClick={() => handleLaunchStormOutreach(cell.county)}
                      className="w-full mt-2.5 bg-teal-600 text-white hover:bg-teal-700 text-[10px] font-extrabold py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1 shadow-sm"
                    >
                      Deploy Storm Rebuild Sequence
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Permits Tracking Screen */}
      {activeTab === 'permits' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-extrabold text-slate-800 text-lg">Florida Roof Permit Underwriting Ledger</h3>
              <p className="text-xs text-slate-500 font-medium">Automatic monitoring of municipality building permit submission and board approval status nodes.</p>
            </div>
            <span className="text-[10px] bg-teal-50 text-teal-700 font-semibold px-2.5 py-1 rounded-lg uppercase font-mono">Synced with Municipality Feeds</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {permits.map(perm => (
              <div key={perm.id} className="p-5 border border-slate-150 rounded-2xl bg-slate-50/50 hover:border-teal-200 transition-all flex flex-col justify-between gap-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div>
                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-wide">Client Node</h4>
                    <span className="text-sm font-extrabold text-slate-800 block mt-0.5">{perm.client}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">{perm.location}</span>
                  </div>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    perm.status === 'Under Inspection' 
                      ? 'bg-amber-100 text-amber-800' 
                      : perm.status === 'Board Approved'
                      ? 'bg-green-100 text-green-850 bg-green-50'
                      : 'bg-indigo-100 text-indigo-800'
                  }`}>
                    {perm.status}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-slate-600 font-medium font-sans">
                  <div className="flex justify-between">
                    <span>Permit Code:</span>
                    <strong className="text-slate-800 text-right font-mono">{perm.permitNo}</strong>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span>Jurisdiction:</span>
                    <strong className="text-slate-800 text-right text-[11px] truncate max-w-[170px]">{perm.codeOffice}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Synced:</span>
                    <strong className="text-slate-500 text-right">{perm.lastUpdated}</strong>
                  </div>
                </div>

                {/* Option to trigger stage completion */}
                <div className="pt-2 border-t border-slate-100 flex gap-2">
                  <button 
                    onClick={() => handleUpdatePermitStatus(perm.id, 'Under Inspection')}
                    className="flex-1 py-1 px-2 border border-slate-200 hover:border-teal-200 text-[10px] font-extrabold text-slate-700 hover:text-teal-700 bg-white rounded-lg transition-all"
                  >
                    Set Inspection
                  </button>
                  <button 
                    onClick={() => handleUpdatePermitStatus(perm.id, 'Board Approved')}
                    className="flex-1 py-1 px-2 bg-teal-600 hover:bg-teal-700 text-[10px] font-extrabold text-white rounded-lg transition-all"
                  >
                    Sim Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Insurance Claims and Supplements Tracking */}
      {activeTab === 'insurance' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-extrabold text-slate-800 text-lg">Insurance Claims & Supplement Monitor</h3>
              <p className="text-xs text-slate-500 font-medium">Underwrite supplemental claim values, adjust carrier communication, and monitor deductible audits.</p>
            </div>
            <span className="text-[10px] bg-teal-50 text-teal-700 font-semibold px-2.5 py-1 rounded-lg uppercase font-mono">Supplement Engine</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {claims.map(claim => (
              <div key={claim.id} className="p-5 border border-slate-150 rounded-2xl bg-slate-50/50 hover:border-teal-200 transition-all flex flex-col justify-between gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Carrier: {claim.carrier}</h4>
                    <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">Claim #{claim.claimNo}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-slate-400 uppercase tracking-tighter block">Approved Value</span>
                    <strong className="text-sm text-slate-800 font-mono font-black">${claim.amount.toLocaleString()}</strong>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-150 space-y-1">
                  <span className="text-[9px] font-black text-rose-600 uppercase block font-mono">Supplement Active Monitor</span>
                  <p className="text-[11px] text-slate-600 leading-normal font-sans font-medium">{claim.supplementMonitor}</p>
                </div>

                <div className="flex justify-between items-center text-[10px] text-slate-400 pt-2 border-t border-slate-100 font-semibold">
                  <span>Status: <strong className="text-teal-600 font-bold">{claim.status}</strong></span>
                  <span>Synced {claim.lastUpdated}</span>
                </div>

                <div className="flex gap-2 pt-1 border-t border-slate-100">
                  <button 
                    onClick={() => {
                      alert(`Dispatched draft carrier supplement brief of $4,200 deck materials override to Citizens Commercial Underwriters.`);
                    }}
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-[10px] py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1 shadow-sm"
                  >
                    <Mail size={11} /> Pitch Supplement Brief
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Material & Production Alerts Tab */}
      {activeTab === 'materials' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Material Delivery Warnings */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Truck className="text-teal-600" size={18} />
                <h3 className="font-bold text-slate-800">Shippment & Material Allocations</h3>
              </div>
              <span className="text-[10px] bg-teal-50 text-teal-700 px-2 py-0.5 rounded font-black font-mono">ABC & Beacon Supplier sync</span>
            </div>

            <div className="space-y-3">
              {materialAlerts.map(mat => (
                <div key={mat.id} className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 bg-teal-600/10 text-teal-700 rounded-xl flex-shrink-0">
                      <Truck size={16} />
                    </div>
                    <div>
                      <span className="text-xs font-black text-slate-800 tracking-tight">{mat.material}</span>
                      <div className="text-[10px] text-slate-500 font-semibold mt-0.5 block space-x-2">
                        <span>Vendor: {mat.vendor}</span>
                        <span>•</span>
                        <span className="text-teal-600 font-bold">Est: {mat.deliveryDate} @ {mat.deliveryTime}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 self-end md:self-auto">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                      mat.status === 'Shipped' 
                        ? 'bg-blue-100 text-blue-800' 
                        : mat.status === 'Delivered'
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {mat.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Roof Production Crew Schedule */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-1.5">
                  <Hammer className="text-teal-600" size={18} />
                  <h3 className="font-bold text-slate-800">Crew Production</h3>
                </div>
                <span className="text-[10px] bg-teal-50 text-teal-700 font-extrabold px-1.5 py-0.5 rounded uppercase">Active Crews</span>
              </div>

              <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                {ROOF_CREW_SCHEDULE.map(crw => (
                  <div key={crw.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1 hover:border-teal-200 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-800">{crw.name}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        crw.status === 'On Site' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {crw.status}
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-500 font-medium space-y-0.5">
                      <p>JobSite: <strong className="text-slate-700">{crw.jobSite}</strong></p>
                      <p>Task: <strong className="text-teal-700">{crw.currentTask}</strong></p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoofingSuite;
