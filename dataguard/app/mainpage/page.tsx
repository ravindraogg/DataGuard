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

// --- 2. Mock API for Sensor Data ---

interface HealResponse {
  domain: string;
  confidence: number;
  mode: string;
  policy: any;
  data: Record<string, number>;
  anomalies?: any[];
  repairs?: any[];
}

const mockHealAPI = (domain: string): Promise<HealResponse> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const config = DOMAIN_CONFIG[domain] || DOMAIN_CONFIG['energy'];
      const sensors = Object.keys(config);
      const data: Record<string, number> = {};
      
      sensors.forEach(s => {
        data[s] = Math.random() * 100;
      });

      resolve({
        domain,
        confidence: 0.85 + Math.random() * 0.14,
        mode: 'active_defense',
        policy: {
          strategy: Math.random() > 0.8 ? 'MODEL_INFER' : 'PASSTHROUGH',
          threshold: 0.92,
          domain_trust: 0.88,
          sensor_policy: {}
        },
        data,
        anomalies: Math.random() > 0.85 ? [{
          sensor: sensors[0],
          severity: 'high',
          type: 'sudden_spike'
        }] : [],
        repairs: Math.random() > 0.8 ? [{
          sensor: sensors[1] || sensors[0],
          before: 0,
          after: data[sensors[1] || sensors[0]],
          method: 'interpolation'
        }] : []
      });
    }, 400); 
  });
};

// --- 3. UI Helpers ---

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

// --- 4. Sub-Components ---

const AddDeviceModal = ({ isOpen, onClose, onAdd }: { isOpen: boolean, onClose: () => void, onAdd: (device: Device) => void }) => {
  const [formData, setFormData] = useState({
    name: '',
    deviceId: '',
    domain: 'energy',
    setupMode: 'auto', 
    sourceType: 'http',
    endpoint: '',
    authKey: '',
    facility: '',
    zone: '',
    location: '',
    healthRules: {} as Record<string, string>,
    repairLogging: true,
    notifyRepairs: false,
  });

  const [detecting, setDetecting] = useState(false);
  const [detectedSensors, setDetectedSensors] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleDetect = () => {
    setDetecting(true);
    setTimeout(() => {
      const config = DOMAIN_CONFIG[formData.domain as keyof typeof DOMAIN_CONFIG] || DOMAIN_CONFIG['energy'];
      setDetectedSensors(Object.keys(config));
      setDetecting(false);
    }, 2500);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    
    try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error("No auth token found");

      const res = await fetch(`${API_BASE_URL}/api/devices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'auth-token': token
        },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const errData = await res.text();
        throw new Error(errData || 'Failed to save device');
      }

      const savedDevice = await res.json();
      onAdd(savedDevice);
      onClose();
    } catch (err: any) {
      console.error(err);
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
              <Plus className="w-6 h-6 text-blue-500" /> Add New Device
            </h2>
            <p className="text-gray-400 text-sm">Register a new machine for monitoring & healing</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full transition-colors">
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
              Error: {error}
            </div>
          )}

          {/* Section A: Identity */}
          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-blue-400 flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-xs">A</div>
              Device Identity
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Device Name</label>
                <input 
                  type="text" 
                  className="w-full bg-gray-800 border border-gray-700 rounded p-2.5 text-white focus:border-blue-500 focus:outline-none"
                  placeholder="e.g. Boiler Room Unit 2"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Device ID (Unique)</label>
                <input 
                  type="text" 
                  className="w-full bg-gray-800 border border-gray-700 rounded p-2.5 text-white focus:border-blue-500 focus:outline-none font-mono"
                  placeholder="e.g. IND-UNIT-002"
                  value={formData.deviceId}
                  onChange={e => setFormData({...formData, deviceId: e.target.value})}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-400 mb-1">Domain / Industry</label>
                <select 
                  className="w-full bg-gray-800 border border-gray-700 rounded p-2.5 text-white focus:border-blue-500 focus:outline-none"
                  value={formData.domain}
                  onChange={e => setFormData({...formData, domain: e.target.value})}
                >
                  <option value="energy">Energy</option>
                  <option value="industrial">Industrial</option>
                  <option value="agriculture">Agriculture</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="smarthome">Smart Home</option>
                  <option value="other">Other</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Determines default sensor templates and anomaly models.</p>
              </div>
            </div>
          </section>

          {/* Section B: Sensor Setup */}
          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-blue-400 flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-xs">B</div>
              Sensor Configuration
            </h3>
            
            <div className="flex gap-4 p-1 bg-gray-800/50 rounded-lg w-fit border border-gray-700">
              <button 
                onClick={() => setFormData({...formData, setupMode: 'auto'})}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${formData.setupMode === 'auto' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                Auto Detect (Recommended)
              </button>
              <button 
                onClick={() => setFormData({...formData, setupMode: 'manual'})}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${formData.setupMode === 'manual' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                Manual Setup
              </button>
            </div>

            {formData.setupMode === 'auto' ? (
              <div className="bg-gray-800/30 border border-gray-700 border-dashed rounded-lg p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Live Data Source</label>
                    <select 
                      className="w-full bg-gray-800 border border-gray-700 rounded p-2.5 text-white"
                      value={formData.sourceType}
                      onChange={e => setFormData({...formData, sourceType: e.target.value})}
                    >
                      <option value="http">HTTP Real-time API</option>
                      <option value="mqtt">MQTT Broker</option>
                      <option value="websocket">WebSocket</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-400 mb-1">Endpoint URL / Broker</label>
                    <input type="text" placeholder="http://192.168.1.10:8080/stream" className="w-full bg-gray-800 border border-gray-700 rounded p-2.5 text-white font-mono text-sm" value={formData.endpoint} onChange={e => setFormData({...formData, endpoint: e.target.value})} />
                  </div>
                </div>

                {!detecting && detectedSensors.length === 0 && (
                  <button 
                    onClick={handleDetect}
                    className="w-full py-3 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded flex items-center justify-center gap-2 text-white transition-all"
                  >
                    <Wifi className="w-4 h-4" /> Start Sensor Detection
                  </button>
                )}

                {detecting && (
                  <div className="py-8 text-center space-y-3">
                    <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
                    <p className="text-gray-300">Listening for packets...</p>
                  </div>
                )}

                {!detecting && detectedSensors.length > 0 && (
                  <div className="bg-green-900/20 border border-green-700/50 rounded p-4 animate-in slide-in-from-top-2">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-green-400 font-semibold flex items-center gap-2">
                        <Check className="w-4 h-4" /> Sensors Detected
                      </h4>
                      <span className="text-xs text-green-500/80">Confidence: 92%</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {detectedSensors.map(s => (
                        <span key={s} className="px-3 py-1 bg-gray-800 border border-gray-600 rounded text-sm text-white capitalize">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 bg-gray-800 rounded border border-gray-700 text-center text-gray-400">
                Manual sensor entry fields would appear here.
              </div>
            )}
          </section>

          {/* Section C: Location */}
          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-blue-400 flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-xs">C</div>
              Location & Context
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Facility / Site</label>
                <div className="relative">
                  <Database className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                  <input type="text" placeholder="e.g. BIT Lab" className="w-full bg-gray-800 border border-gray-700 rounded p-2.5 pl-9 text-white" value={formData.facility} onChange={e => setFormData({...formData, facility: e.target.value})}/>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Zone</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                  <input type="text" placeholder="e.g. Zone 3" className="w-full bg-gray-800 border border-gray-700 rounded p-2.5 pl-9 text-white" value={formData.zone} onChange={e => setFormData({...formData, zone: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Location (Manual)</label>
                <input type="text" placeholder="City/Floor" className="w-full bg-gray-800 border border-gray-700 rounded p-2.5 text-white" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
              </div>
            </div>
          </section>

          {/* Section F: Repair & Audit */}
          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-blue-400 flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-xs">F</div>
              Repair & Audit
            </h3>
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-3 p-3 bg-gray-800 border border-gray-700 rounded cursor-pointer hover:bg-gray-700/50 transition-colors">
                <input 
                  type="checkbox" 
                  checked={formData.repairLogging} 
                  onChange={e => setFormData({...formData, repairLogging: e.target.checked})}
                  className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-600 ring-offset-gray-800"
                />
                <div>
                  <span className="block text-white font-medium">Enable Repair History Logging</span>
                  <span className="block text-xs text-gray-400">Keep detailed logs of every data point intercepted and healed.</span>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 bg-gray-800 border border-gray-700 rounded cursor-pointer hover:bg-gray-700/50 transition-colors">
                <input 
                  type="checkbox" 
                  checked={formData.notifyRepairs} 
                  onChange={e => setFormData({...formData, notifyRepairs: e.target.checked})}
                  className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-600 ring-offset-gray-800"
                />
                <div>
                  <span className="block text-white font-medium">Notify on Critical Repair</span>
                  <span className="block text-xs text-gray-400">Send alerts via Email/Slack when confidence drops below 60%.</span>
                </div>
              </label>
            </div>
          </section>

        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-800 bg-gray-900 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2.5 rounded font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
            Cancel
          </button>
          <button 
            onClick={handleSave} 
            disabled={isSaving}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded font-medium shadow-lg shadow-blue-900/20 transition-all flex items-center gap-2"
          >
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSaving ? 'Saving...' : 'Add Device'}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- 5. Dashboard Views ---

const DeviceCard = ({ device, onClick }: { device: Device, onClick: () => void }) => {
  const statusColors = {
    operational: 'green',
    warning: 'amber',
    critical: 'red',
    offline: 'gray'
  };

  return (
    <Card onClick={onClick} className="group relative overflow-hidden transition-all hover:scale-[1.02]">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2.5 bg-gray-700/50 rounded-lg group-hover:bg-blue-600/20 group-hover:text-blue-400 transition-colors">
          <Server className="w-6 h-6 text-gray-400 group-hover:text-blue-400" />
        </div>
        <Badge color={statusColors[device.status]}>{device.status}</Badge>
      </div>
      
      <h3 className="text-lg font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">{device.name}</h3>
      <p className="text-sm text-gray-500 font-mono mb-4">{device.deviceId}</p>
      
      <div className="space-y-2 border-t border-gray-700 pt-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Domain</span>
          <span className="text-gray-200 capitalize">{device.domain}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Trust Score</span>
          <span className={`font-bold ${device.confidence > 90 ? 'text-green-400' : device.confidence > 70 ? 'text-amber-400' : 'text-red-400'}`}>
            {device.confidence}%
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Location</span>
          <span className="text-gray-200">{device.location}</span>
        </div>
      </div>
    </Card>
  );
};

const DeviceDashboard = ({ device, onBack }: { device: Device, onBack: () => void }) => {
  const [dataHistory, setDataHistory] = useState<any[]>([]);
  const [currentStatus, setCurrentStatus] = useState<HealResponse | null>(null);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [repairs, setRepairs] = useState<any[]>([]);
  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(async () => {
      const response = await mockHealAPI(device.domain);
      setCurrentStatus(response);
      
      const timestamp = new Date().toLocaleTimeString();
      setDataHistory(prev => {
        const newData = [...prev, { time: timestamp, ...response.data }];
        return newData.slice(-20);
      });

      if (response.anomalies?.length) {
        setAnomalies(prev => [...response.anomalies!.map(a => ({ ...a, time: timestamp })), ...prev].slice(0, 10));
      }
      if (response.repairs?.length) {
        setRepairs(prev => [...response.repairs!.map(r => ({ ...r, time: timestamp })), ...prev].slice(0, 10));
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [device, isLive]);

  const config = DOMAIN_CONFIG[device.domain] || DOMAIN_CONFIG['energy'];
  const sensorKeys = Object.keys(config);

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              {device.name}
              <span className="px-3 py-1 bg-gray-800 text-sm font-normal text-gray-400 rounded-full border border-gray-700">
                {device.deviceId}
              </span>
            </h1>
            <p className="text-sm text-gray-500 capitalize">{device.domain} Monitoring • {device.location}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-800 rounded-lg border border-gray-700">
            <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-300">{isLive ? 'Live Stream' : 'Paused'}</span>
          </div>
          <button 
            onClick={() => setIsLive(!isLive)}
            className={`p-2 rounded-lg border transition-all ${
              isLive ? 'bg-green-900/20 border-green-700 text-green-400' : 'bg-gray-800 border-gray-600 text-gray-400'
            }`}
          >
            <RefreshCw className={`w-5 h-5 ${isLive ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Sensor Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {sensorKeys.map(key => {
          const conf = config[key];
          const val = currentStatus?.data[key] || 0;
          return (
            <Card key={key} className="relative overflow-hidden group">
              <div className="flex justify-between items-start mb-2">
                <span className="text-gray-400 text-sm font-mono uppercase">{conf.label}</span>
                <Signal className={`w-4 h-4 ${val > 0 ? 'text-green-500' : 'text-gray-600'}`} />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-white tracking-tight">{val.toFixed(1)}</span>
                <span className="text-gray-500 text-sm">{conf.unit}</span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-10 opacity-10 group-hover:opacity-20 transition-opacity">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dataHistory}>
                    <Area type="monotone" dataKey={key} stroke={conf.color} fill={conf.color} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Main Chart */}
      <Card className="h-96">
        <h3 className="text-lg font-semibold text-white mb-6">Real-Time Telemetry</h3>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={dataHistory}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
            <XAxis dataKey="time" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '0.5rem', color: '#fff' }}
            />
            <Legend />
            {sensorKeys.map(key => (
              <Line 
                key={key}
                type="monotone"
                dataKey={key}
                stroke={config[key].color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6 }}
                name={config[key].label}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Logs & Policies */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <h3 className="text-lg font-semibold text-white mb-4">Anomaly Logs</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-gray-400 border-b border-gray-700">
                <tr>
                  <th className="py-3 px-2">Time</th>
                  <th className="py-3 px-2">Sensor</th>
                  <th className="py-3 px-2">Type</th>
                  <th className="py-3 px-2">Severity</th>
                  <th className="py-3 px-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {anomalies.length === 0 ? (
                  <tr><td colSpan={5} className="py-4 text-center text-gray-500">No active anomalies detected.</td></tr>
                ) : (
                  anomalies.map((a, i) => (
                    <tr key={i} className="hover:bg-gray-700/50 transition-colors">
                      <td className="py-3 px-2 text-gray-300 font-mono">{a.time}</td>
                      <td className="py-3 px-2 text-white font-medium">{config[a.sensor]?.label}</td>
                      <td className="py-3 px-2 text-gray-300 capitalize">{a.type.replace('_', ' ')}</td>
                      <td className="py-3 px-2">
                        <Badge color={a.severity === 'high' ? 'red' : 'amber'}>{a.severity}</Badge>
                      </td>
                      <td className="py-3 px-2 text-blue-400 flex items-center gap-1">
                        <Activity className="w-3 h-3" /> Healing
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-white mb-4">Active Policy</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-700">
              <span className="text-gray-400">Strategy</span>
              <span className="text-white font-mono">{currentStatus?.policy.strategy || 'MODEL_INFER'}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-gray-700">
              <span className="text-gray-400">Trust Score</span>
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold">{((currentStatus?.policy.domain_trust || 0.88) * 100).toFixed(0)}%</span>
                <Shield className="w-4 h-4 text-emerald-500" />
              </div>
            </div>
            <div className="p-3 bg-blue-900/20 border border-blue-800 rounded-lg">
              <p className="text-xs text-blue-300">
                <span className="font-bold">AI Note:</span> Sensor drift detected on {sensorKeys[0]}. Auto-calibration active.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

// --- 6. Main Page Controller ---

export default function MainPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // State for user profile display (organization, role)
  const [userProfile, setUserProfile] = useState({ org: 'Loading...', role: 'Loading...' });

  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        router.push('/auth');
        return;
      }

      // 1. Get User Info from LocalStorage (Requires Update in Auth Page)
      const storedOrg = localStorage.getItem('organization') || 'My Organization';
      const storedRole = localStorage.getItem('userRole') || 'User';
      setUserProfile({ org: storedOrg, role: storedRole });

      // 2. Fetch Devices
      try {
        const res = await fetch(`${API_BASE_URL}/api/devices`, {
          headers: { 'auth-token': token }
        });
        if (res.ok) {
          const data = await res.json();
          setDevices(data);
        }
      } catch (err) {
        console.error("Failed to fetch devices", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleLogout = () => {
    localStorage.clear();
    router.push('/auth');
  };

  const handleAddDevice = (newDevice: Device) => {
    setDevices([...devices, newDevice]);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans selection:bg-blue-500 selection:text-white">
      {/* FLOATING HEADER */}
      <header className="fixed top-[30px] left-[15px] right-[15px] z-50 backdrop-blur-md rounded-full border border-blue-500/10 bg-gray-900/80">
        <nav className="max-w-7xl mx-auto px-4 sm:px-8 py-4 flex items-center justify-between">
          <div 
            className="flex items-center space-x-3 group cursor-pointer"
            onClick={() => setSelectedDevice(null)}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div className="text-xl font-bold tracking-wider font-display">
              <span className="text-blue-500">Data</span>
              <span className="text-white">Guard</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {!selectedDevice && (
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-all shadow-lg shadow-blue-900/20"
              >
                <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Add Device</span>
              </button>
            )}

            <div className="h-8 w-px bg-gray-700 mx-2"></div>
            
            <div className="flex items-center gap-3">
              {/* Dynamic User Profile Display */}
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-white">{userProfile.org}</p>
                <p className="text-xs text-gray-500 uppercase">{userProfile.role}</p>
              </div>
              <div className="h-9 w-9 bg-gray-700 rounded-full flex items-center justify-center border border-gray-600 text-gray-300">
                <Server className="w-5 h-5" />
              </div>
              <button 
                onClick={handleLogout} 
                className="p-2 md:p-2 rounded-full transition-colors bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-red-400"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="container mx-auto px-4 pt-36 pb-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : selectedDevice ? (
          <DeviceDashboard 
            device={selectedDevice} 
            onBack={() => setSelectedDevice(null)} 
          />
        ) : (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="flex items-center justify-between border-l-4 border-l-blue-500">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Total Devices</p>
                  <h3 className="text-3xl font-bold text-white mt-1">{devices.length}</h3>
                </div>
                <Database className="w-8 h-8 text-blue-500 opacity-50" />
              </Card>
              <Card className="flex items-center justify-between border-l-4 border-l-green-500">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Operational</p>
                  <h3 className="text-3xl font-bold text-white mt-1">{devices.filter(d => d.status === 'operational').length}</h3>
                </div>
                <Check className="w-8 h-8 text-green-500 opacity-50" />
              </Card>
              <Card className="flex items-center justify-between border-l-4 border-l-red-500">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Critical Attention</p>
                  <h3 className="text-3xl font-bold text-white mt-1">{devices.filter(d => d.status === 'critical').length}</h3>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-500 opacity-50" />
              </Card>
            </div>

            {/* Device Grid */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Your Devices</h2>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                    <input 
                      type="text" 
                      placeholder="Search devices..." 
                      className="bg-gray-800 border border-gray-700 rounded-full py-2 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {devices.map(device => (
                  <DeviceCard 
                    key={device._id} 
                    device={device} 
                    onClick={() => setSelectedDevice(device)} 
                  />
                ))}
                
                {/* Empty State / Add New Card */}
                <button 
                  onClick={() => setIsAddModalOpen(true)}
                  className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-700 rounded-lg hover:border-blue-500 hover:bg-gray-800/50 transition-all group h-full min-h-[200px]"
                >
                  <div className="p-4 rounded-full bg-gray-800 group-hover:bg-blue-600/20 mb-4 transition-colors">
                    <Plus className="w-8 h-8 text-gray-400 group-hover:text-blue-500" />
                  </div>
                  <span className="font-medium text-gray-400 group-hover:text-white">Register New Device</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <AddDeviceModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onAdd={handleAddDevice} 
      />
    </div>
  );
}