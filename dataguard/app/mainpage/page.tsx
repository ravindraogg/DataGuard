'use client';

import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  AreaChart, Area
} from 'recharts';
import { 
  Activity, Shield, AlertTriangle, RefreshCw, LogOut, Server, Cpu, Zap, 
  Plus, X, Check, Search, Wifi, Database, MapPin, ArrowLeft, Signal, Loader2
} from 'lucide-react';
import { useRouter } from 'next/navigation';

// --- 1. Configuration & Types ---

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

type DomainType = 'energy' | 'agriculture' | 'healthcare' | 'industrial' | 'smarthome' | 'other';

interface SensorConfig {
  label: string;
  unit: string;
  color: string;
}

interface Device {
  _id: string;
  deviceId: string;
  name: string;
  domain: DomainType;
  status: 'operational' | 'warning' | 'critical' | 'offline';
  location: string;
  confidence: number;
  lastActive: string;
}
const DOMAIN_CONFIG: Record<string, Record<string, SensorConfig>> = {
  energy: {
    voltage: { label: 'Voltage', unit: 'V', color: '#ef4444' },
    current: { label: 'Current', unit: 'A', color: '#3b82f6' },
    frequency: { label: 'Frequency', unit: 'Hz', color: '#10b981' },
    power: { label: 'Power', unit: 'kW', color: '#f59e0b' },
  },
  agriculture: {
    temperature: { label: 'Air Temp', unit: '°C', color: '#f97316' },
    humidity: { label: 'Humidity', unit: '%', color: '#06b6d4' },
    water_level: { label: 'Water Lvl', unit: 'm', color: '#3b82f6' },
  },
  healthcare: {
    heart_rate: { label: 'Heart Rate', unit: 'bpm', color: '#ef4444' },
    spo2: { label: 'SpO2', unit: '%', color: '#0ea5e9' },
    body_temperature: { label: 'Body Temp', unit: '°C', color: '#ec4899' },
  },
  industrial: {
    temperature: { label: 'Temp', unit: '°C', color: '#f97316' },
    vibration: { label: 'Vibration', unit: 'Hz', color: '#8b5cf6' },
    current: { label: 'Load', unit: 'A', color: '#3b82f6' },
    acoustic: { label: 'Noise', unit: 'dB', color: '#64748b' },
  },
};

// --- 2. UI Helpers ---

const Card = ({ children, className = '', onClick }: { children: React.ReactNode, className?: string, onClick?: () => void }) => (
  <div onClick={onClick} className={`bg-gray-800 border border-gray-700 rounded-lg p-5 shadow-lg ${onClick ? 'cursor-pointer hover:border-blue-500/50 hover:shadow-blue-900/10 transition-all' : ''} ${className}`}>
    {children}
  </div>
);

const Badge = ({ children, color = 'blue' }: { children: React.ReactNode, color?: string }) => {
  const colors: Record<string, string> = {
    blue: 'bg-blue-900/50 text-blue-200 border-blue-700',
    green: 'bg-emerald-900/50 text-emerald-200 border-emerald-700',
    red: 'bg-rose-900/50 text-rose-200 border-rose-700',
    amber: 'bg-amber-900/50 text-amber-200 border-amber-700',
    gray: 'bg-gray-700/50 text-gray-300 border-gray-600',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${colors[color] || colors.blue}`}>
      {children}
    </span>
  );
};

// --- 3. Add Device Modal (Fix: Real Schema Detection) ---

const AddDeviceModal = ({ isOpen, onClose, onAdd }: { isOpen: boolean, onClose: () => void, onAdd: (device: Device) => void }) => {
  // Domain Aliases mapping as requested
  const DOMAIN_ALIASES: Record<string, string[]> = {
    agriculture: ["temperature", "humidity", "water_level"],
    industrial: ["temperature", "vibration", "current", "acoustic"],
    smarthome: ["temperature", "power", "occupancy"],
    energy: ["voltage", "current", "frequency", "power"],
    healthcare: ["heart_rate", "spo2", "body_temperature"],
  };

  const [formData, setFormData] = useState({
    name: '',
    domain: 'agriculture' as DomainType,
    setupMode: 'auto', 
    sourceType: 'http',
    endpoint: 'http://127.0.0.1:7000/api/schema',
    location: '',
    repairLogging: true,
  });

  const [detecting, setDetecting] = useState(false);
  const [detectedSensors, setDetectedSensors] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleDetect = async () => {
    if (!formData.endpoint) {
      setError("Please provide a schema endpoint URL.");
      return;
    }

    setDetecting(true);
    setError('');
    try {
      const res = await fetch(formData.endpoint);
      if (!res.ok) throw new Error("Failed to reach API endpoint");
      
      const result = await res.json();
      const schemaData = result.schema || result.data || result;
      
      // Filter metadata to extract raw sensors
      const metaFields = ['deviceId', 'timestamp', 'recordId', 'id', '_id', 'source'];
      const sensors = Object.keys(schemaData).filter(key => !metaFields.includes(key));
      
      // --- Schema Cross-Check Logic ---
      const required = DOMAIN_ALIASES[formData.domain];
      if (required) {
        const missing = required.filter(reqKey => !sensors.includes(reqKey));
        if (missing.length > 0) {
          // Force manual update if schema doesn't match the domain requirement
          throw new Error(`Schema Mismatch: API missing required columns for ${formData.domain}: [${missing.join(', ')}]. Please adjust your API or use Manual Setup.`);
        }
      }
      
      setDetectedSensors(sensors);
    } catch (err: any) {
      setError(err.message);
      setDetectedSensors([]);
    } finally {
      setDetecting(false);
    }
  };

  const handleSave = async () => {
    // Client-side validation to prevent the "Path name is required" error
    if (!formData.name.trim()) {
      setError("Device Name is required.");
      return;
    }

    setIsSaving(true);
    setError('');
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_BASE_URL}/api/devices`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'auth-token': token || '' 
        },
        // deviceId is omitted here; backend generates it uniquely
        body: JSON.stringify(formData) 
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to save device');
      }

      const savedDevice = await res.json();
      onAdd(savedDevice);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-gray-700 w-full max-w-4xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-900">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Plus className="w-6 h-6 text-blue-500" /> Register System
            </h2>
            <p className="text-gray-400 text-sm">Unique Device ID will be assigned by the Secure Gateway</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full transition-colors"><X className="w-6 h-6 text-gray-400" /></button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm flex gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <div><p className="font-bold">Device Validation Failed</p>{error}</div>
            </div>
          )}

          {/* Section A: Identity */}
          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-blue-400 flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-xs">A</div>Identity
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Device Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Smart Pump #4" 
                  className="w-full bg-gray-800 border border-gray-700 rounded p-2.5 text-white focus:border-blue-500 outline-none" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Domain / Industry</label>
                <select 
                  className="w-full bg-gray-800 border border-gray-700 rounded p-2.5 text-white" 
                  value={formData.domain} 
                  onChange={e => {
                    setFormData({...formData, domain: e.target.value as DomainType});
                    setDetectedSensors([]); // Reset sensors when domain changes
                  }}
                >
                  <option value="agriculture">Agriculture</option>
                  <option value="energy">Energy</option>
                  <option value="industrial">Industrial</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="smarthome">Smart Home</option>
                </select>
              </div>
            </div>
          </section>

          {/* Section B: Configuration */}
          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-blue-400 flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-xs">B</div>Sensor Mapping
            </h3>
            <div className="flex gap-4 p-1 bg-gray-800/50 rounded-lg w-fit border border-gray-700">
              <button onClick={() => setFormData({...formData, setupMode: 'auto'})} className={`px-4 py-2 rounded text-sm transition-all ${formData.setupMode === 'auto' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>Auto Detect API</button>
              <button onClick={() => setFormData({...formData, setupMode: 'manual'})} className={`px-4 py-2 rounded text-sm transition-all ${formData.setupMode === 'manual' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>Manual Reference</button>
            </div>

            {formData.setupMode === 'auto' ? (
              <div className="bg-gray-800/30 border border-gray-700 border-dashed rounded-lg p-6 space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Discovery URL</label>
                  <input type="text" className="w-full bg-gray-800 border border-gray-700 rounded p-2.5 text-white font-mono text-sm" value={formData.endpoint} onChange={e => setFormData({...formData, endpoint: e.target.value})} />
                </div>
                {!detecting && detectedSensors.length === 0 && (
                  <button onClick={handleDetect} className="w-full py-3 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 text-blue-400 rounded flex items-center justify-center gap-2 transition-colors">
                    <Wifi className="w-4 h-4" /> Validate API Schema
                  </button>
                )}
                {detecting && <div className="py-8 text-center"><Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto" /></div>}
                {detectedSensors.length > 0 && (
                  <div className="animate-in fade-in duration-300">
                    <p className="text-xs text-green-400 mb-2 font-medium flex items-center gap-1"><Check className="w-3 h-3" /> Validated Columns:</p>
                    <div className="flex flex-wrap gap-2">{detectedSensors.map(s => <span key={s} className="px-3 py-1 bg-blue-900/20 border border-blue-700 text-blue-300 rounded text-xs font-mono">{s}</span>)}</div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-6 space-y-4">
                <p className="text-sm text-blue-400 font-medium">Domain-Specific Columns for {formData.domain}:</p>
                <div className="grid grid-cols-2 gap-3">
                  {DOMAIN_ALIASES[formData.domain]?.map(alias => (
                    <div key={alias} className="flex items-center gap-2 p-2 bg-gray-900 rounded border border-gray-700">
                      <Check className="w-3 h-3 text-emerald-500" />
                      <span className="text-xs font-mono text-gray-300">{alias}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-blue-400 mb-4">Location</h3>
              <input type="text" placeholder="e.g. Warehouse A, Section 4" className="w-full bg-gray-800 border border-gray-700 rounded p-2.5" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-400 mb-4">Automation</h3>
              <label className="flex items-center gap-3 p-3 bg-gray-800 border border-gray-700 rounded cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded bg-gray-900 border-gray-700 text-blue-600" checked={formData.repairLogging} onChange={e => setFormData({...formData, repairLogging: e.target.checked})} />
                <span className="text-sm">Enable Autonomous Repair Logging</span>
              </label>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-800 bg-gray-900 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2.5 text-gray-400">Cancel</button>
          <button 
            onClick={handleSave} 
            disabled={isSaving || (formData.setupMode === 'auto' && detectedSensors.length === 0)} 
            className="px-6 py-2.5 bg-blue-600 disabled:bg-gray-700 rounded-lg flex items-center gap-2 font-medium transition-all"
          >
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />} Register System
          </button>
        </div>
      </div>
    </div>
  );
};

// --- 4. Dashboard View (Real Data Mapping) ---

const DeviceDashboard = ({ device, onBack }: { device: Device, onBack: () => void }) => {
  const [dataHistory, setDataHistory] = useState<any[]>([]);
  const [currentStatus, setCurrentStatus] = useState<any | null>(null);
  const [repairs, setRepairs] = useState<any[]>([]);
  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/external/fetch-heal`);
        const result = await res.json();
        if (result.status === "fetched_and_healed") {
          const h = result.healed;
          setCurrentStatus(h);
          const time = new Date().toLocaleTimeString();
          setDataHistory(prev => [...prev, { time, ...h.data }].slice(-20));
          if (h.mode !== 'policy_passthrough') {
            setRepairs(prev => [{ time, mode: h.mode, strategy: h.policy.strategy, trust: h.policy.domain_trust }, ...prev].slice(0, 10));
          }
        }
      } catch (e) { console.error(e); }
    }, 2000);
    return () => clearInterval(interval);
  }, [isLive]);

  // Use config based on device domain
  const config = DOMAIN_CONFIG[device.domain] || DOMAIN_CONFIG['agriculture'];
  const sensors = Object.keys(config);

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      <div className="flex items-center justify-between pb-4 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-800"><ArrowLeft /></button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">{device.name} <span className="px-3 py-1 bg-gray-800 text-sm rounded-full border border-gray-700">{device.deviceId}</span></h1>
            <p className="text-sm text-gray-500 capitalize">{device.domain} Monitoring • {device.location}</p>
          </div>
        </div>
        <button onClick={() => setIsLive(!isLive)} className={`p-2 rounded border transition-all ${isLive ? 'bg-green-900/20 text-green-400 border-green-700' : 'bg-gray-800 border-gray-600 text-gray-400'}`}>
          <RefreshCw className={isLive ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sensors.map(k => (
          <Card key={k} className="relative overflow-hidden group">
            <span className="text-gray-400 text-xs font-mono uppercase">{config[k].label}</span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold">{currentStatus?.data[k]?.toFixed(1) || '--'}</span>
              <span className="text-gray-500 text-sm">{config[k].unit}</span>
            </div>
          </Card>
        ))}
      </div>

      <Card className="h-96">
        <h3 className="text-lg font-semibold mb-6">Real-Time Telemetry (Autonomous Healing)</h3>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={dataHistory}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="time" stroke="#9ca3af" fontSize={12} />
            <YAxis stroke="#9ca3af" fontSize={12} />
            <Tooltip contentStyle={{ backgroundColor: '#1f2937' }} />
            <Legend />
            {sensors.map(k => <Line key={k} type="monotone" dataKey={k} stroke={config[k].color} strokeWidth={2} dot={false} name={config[k].label} />)}
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <h3 className="font-semibold mb-4">Autonomous Healing Logs</h3>
          <div className="space-y-2">
            {repairs.length === 0 ? <p className="text-gray-500 text-sm">Monitoring stream integrity...</p> : 
              repairs.map((r, i) => (
                <div key={i} className="flex justify-between items-center p-3 bg-gray-900/50 rounded border border-gray-700 hover:border-blue-500/30 transition-colors">
                  <div className="flex items-center gap-3"><Activity className="w-4 h-4 text-blue-500" /><span className="text-sm font-mono">{r.time} - {r.mode}</span></div>
                  <Badge color={r.trust > 0.8 ? 'green' : 'amber'}>{r.strategy}</Badge>
                </div>
              ))
            }
          </div>
        </Card>
        <Card>
          <h3 className="font-semibold mb-4">Active AI Policy</h3>
          <div className="space-y-4 text-sm">
            <div className="flex justify-between items-center pb-2 border-b border-gray-700"><span>Strategy</span><span className="font-mono text-white font-bold">{currentStatus?.policy.strategy || 'MODEL_INFER'}</span></div>
            <div className="flex justify-between items-center pb-2 border-b border-gray-700"><span>Domain Trust</span><span className="text-emerald-400 font-bold">{((currentStatus?.policy.domain_trust || 0) * 100).toFixed(0)}%</span></div>
            <div className="p-3 bg-blue-900/10 border border-blue-800/50 rounded-lg"><p className="text-[10px] text-blue-300 leading-tight">System is intercepting {device.domain} telemetry and performing on-the-fly reconstruction using Domain-Specific Experts.</p></div>
          </div>
        </Card>
      </div>
    </div>
  );
};

// --- 5. Main Page Controller ---

export default function MainPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState({ org: 'DataHeal AI Labs', role: 'Fleet Manager' });

  const router = useRouter();

  useEffect(() => {
    const fetchD = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) { router.push('/auth'); return; }
      try {
        const res = await fetch(`${API_BASE_URL}/api/devices`, { headers: { 'auth-token': token } });
        if (res.ok) setDevices(await res.json());
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchD();
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <header className="fixed top-[30px] left-[15px] right-[15px] z-50 backdrop-blur-md rounded-full border border-blue-500/10 bg-gray-900/80 px-8 py-4 flex items-center justify-between shadow-2xl">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setSelectedDevice(null)}>
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-400 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20"><Zap className="w-5 h-5 text-white" /></div>
          <div className="text-xl font-bold tracking-tight"><span className="text-blue-500">Data</span>Heal</div>
        </div>
        <div className="flex items-center gap-4">
          {!selectedDevice && <button onClick={() => setIsAddModalOpen(true)} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 rounded-full text-sm font-semibold transition-all shadow-lg shadow-blue-900/30"><Plus className="w-4 h-4 inline mr-2" />Add Device</button>}
          <div className="text-right hidden sm:block"><p className="text-sm font-medium">{userProfile.org}</p><p className="text-[10px] text-gray-500 uppercase tracking-widest">{userProfile.role}</p></div>
          <button onClick={() => { localStorage.clear(); router.push('/auth'); }} className="p-2 rounded-full bg-gray-800 hover:text-red-400 border border-gray-700 transition-colors"><LogOut className="w-5 h-5" /></button>
        </div>
      </header>

      <main className="container mx-auto px-4 pt-36 pb-8">
        {loading ? <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-blue-500 w-10 h-10" /></div> : 
        selectedDevice ? <DeviceDashboard device={selectedDevice} onBack={() => setSelectedDevice(null)} /> : (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-l-4 border-l-blue-500"><div><p className="text-gray-400 text-sm">Managed Systems</p><h3 className="text-3xl font-bold">{devices.length}</h3></div><Database className="w-8 h-8 text-blue-500 opacity-20" /></Card>
              <Card className="border-l-4 border-l-green-500"><div><p className="text-gray-400 text-sm">Operational</p><h3 className="text-3xl font-bold">{devices.filter(d => d.status === 'operational').length}</h3></div><Check className="w-8 h-8 text-green-500 opacity-20" /></Card>
              <Card className="border-l-4 border-l-red-500"><div><p className="text-gray-400 text-sm">Active Healing</p><h3 className="text-3xl font-bold">{devices.filter(d => d.status === 'critical').length}</h3></div><AlertTriangle className="w-8 h-8 text-red-500 opacity-20" /></Card>
            </div>

            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Device Fleet</h2>
              <div className="relative"><Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" /><input type="text" placeholder="Search devices..." className="bg-gray-800 border border-gray-700 rounded-full py-2 pl-9 pr-4 text-sm focus:border-blue-500 focus:outline-none transition-all" /></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {devices.map(d => (
                <Card key={d._id} onClick={() => setSelectedDevice(d)} className="group border border-gray-700/50 hover:border-blue-500/50">
                  <Server className="text-gray-400 group-hover:text-blue-500 mb-4 transition-colors" />
                  <h3 className="font-bold mb-1 group-hover:text-blue-400 transition-colors">{d.name}</h3>
                  <p className="text-sm font-mono text-gray-500 mb-4">{d.deviceId}</p>
                  <div className="flex justify-between items-center text-xs border-t border-gray-700 pt-4"><span className="text-gray-400 capitalize">{d.domain}</span><span className="text-green-400 font-bold">{d.confidence}% Trust</span></div>
                </Card>
              ))}
              <button onClick={() => setIsAddModalOpen(true)} className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-700 rounded-lg hover:border-blue-500 hover:bg-gray-800/50 group h-full min-h-[200px] transition-all"><Plus className="w-8 h-8 text-gray-500 group-hover:text-blue-500 mb-2 transition-all" /><span className="text-gray-500 group-hover:text-white font-medium">Register New System</span></button>
            </div>
          </div>
        )}
      </main>

      <AddDeviceModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAdd={(d) => setDevices([...devices, d])} />
    </div>
  );
}