'use client';

import React, { useState } from 'react';
import { 
  LogIn, 
  UserPlus, 
  Mail, 
  Lock, 
  User, 
  Briefcase, 
  Code, 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  ShieldCheck, 
  Activity, 
  Database, 
  Stethoscope, 
  AlertTriangle, 
  GitMerge, 
  ArrowLeft,
  CheckCircle // Added success icon
} from 'lucide-react';
import { useRouter } from 'next/navigation';

// --- Configuration ---
// Note: In Next.js, use process.env.NEXT_PUBLIC_... 
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

// --- Types ---
interface FormData {
  // Step 1
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  // Step 2
  organization: string;
  role: string;
  experience: string;
  // Step 3
  interests: string[];
  useCases: string[];
}

interface OptionItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

export default function AuthPage() {
  const router = useRouter(); // Using Next.js router
  const [isSignIn, setIsSignIn] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(''); // New state for success message
  const [error, setError] = useState('');
  
  // Form data state
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    organization: '',
    role: '',
    experience: '',
    interests: [],
    useCases: []
  });

  const totalSteps = 3;
  const progress = (currentStep / totalSteps) * 100;

  // --- DataGuard Specific Options ---
  const interestsOptions: OptionItem[] = [
    { id: 'quality', label: 'Data Quality', icon: <ShieldCheck className="w-5 h-5 text-blue-500" /> },
    { id: 'lineage', label: 'Data Lineage', icon: <GitMerge className="w-5 h-5 text-purple-500" /> },
    { id: 'anomaly', label: 'Anomaly Detection', icon: <Activity className="w-5 h-5 text-red-500" /> },
    { id: 'governance', label: 'Governance', icon: <Lock className="w-5 h-5 text-green-500" /> },
    { id: 'schema', label: 'Schema Drift', icon: <Database className="w-5 h-5 text-yellow-500" /> },
    { id: 'rootcause', label: 'Root Cause Analysis', icon: <Stethoscope className="w-5 h-5 text-cyan-500" /> }
  ];

  const useCasesOptions: OptionItem[] = [
    { id: 'streaming', label: 'Real-time Streaming (Kafka/Kinesis)' },
    { id: 'warehouse', label: 'Data Warehouse (Snowflake/BigQuery)' },
    { id: 'lakehouse', label: 'Data Lakehouse (Databricks)' },
    { id: 'mesh', label: 'Data Mesh Implementation' }
  ];

  // --- Handlers ---

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const toggleArrayField = (field: 'interests' | 'useCases', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  const validateStep = (): boolean => {
    if (isSignIn) {
      if (!formData.email || !formData.password) {
        setError('Email and password are required.');
        return false;
      }
      if (!formData.email.includes('@')) {
        setError('Please enter a valid email address.');
        return false;
      }
      return true;
    }

    // Sign Up validation
    if (currentStep === 1) {
      if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
        setError('All fields are required in this step.');
        return false;
      }
      if (!formData.email.includes('@')) {
        setError('Please enter a valid email address.');
        return false;
      }
      if (formData.password.length < 8) {
        setError('Password must be at least 8 characters long.');
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match.');
        return false;
      }
    }
    
    setError('');
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setError('');
  };

  const handleAuth = async () => {
    if (!validateStep()) return;

    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      let endpoint = '';
      let method = 'POST';
      let dataToSend: any = {};

      if (isSignIn) {
        endpoint = `${API_BASE_URL}/api/auth/signin`;
        dataToSend = {
          email: formData.email,
          password: formData.password,
        };
      } else {
        endpoint = `${API_BASE_URL}/api/auth/signup`;
        dataToSend = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          organization: formData.organization,
          role: formData.role,
          experience: formData.experience,
          interests: formData.interests,
          useCases: formData.useCases,
        };
      }

      // --- ACTUAL BACKEND CONNECTION ---
      const response = await fetch(endpoint, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      if (data.token) {
        localStorage.setItem('authToken', data.token);
        
        if (data.user) {
          localStorage.setItem('userName', data.user.email);
          localStorage.setItem('userRole', data.user.role);
          localStorage.setItem('org', data.user.organization);
        }

        // --- SUCCESS LOGIC ---
        // Show success message and wait 3 seconds
        setSuccess(isSignIn ? 'Login Successful! Redirecting...' : 'Account Created! Redirecting...');
        
        setTimeout(() => {
          router.push('/mainpage'); 
        }, 3000);

        // Note: We do NOT set loading(false) here, so the success overlay stays visible until redirect.
      } else {
        throw new Error('Login successful but no token received.');
      }

    } catch (err: any) {
      setError(err.message || 'Network error. Please check your connection.');
      console.error('Auth Error:', err);
      setLoading(false); // Stop loading on error so user can try again
    } 
  };

  const renderStepContent = () => {
    if (isSignIn) {
      return (
        <div className="space-y-5">
          <div>
            <label className="block text-slate-400 text-sm mb-2 ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-500" />
              <input
                type="email"
                placeholder="eng@dataguard.ai"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full bg-[#0B1120] border border-blue-500/20 rounded-xl pl-12 pr-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:shadow-[0_0_15px_rgba(59,130,246,0.2)] transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 text-sm mb-2 ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-500" />
              <input
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className="w-full bg-[#0B1120] border border-blue-500/20 rounded-xl pl-12 pr-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:shadow-[0_0_15px_rgba(59,130,246,0.2)] transition-all"
              />
            </div>
          </div>
        </div>
      );
    }

    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-5">
            <div>
              <label className="block text-slate-400 text-sm mb-2 ml-1">Full Name *</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-500" />
                <input
                  type="text"
                  placeholder="Jane Doe"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full bg-[#0B1120] border border-blue-500/20 rounded-xl pl-12 pr-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:shadow-[0_0_15px_rgba(59,130,246,0.2)] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 text-sm mb-2 ml-1">Work Email *</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-500" />
                <input
                  type="email"
                  placeholder="jane@company.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full bg-[#0B1120] border border-blue-500/20 rounded-xl pl-12 pr-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:shadow-[0_0_15px_rgba(59,130,246,0.2)] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 text-sm mb-2 ml-1">Password *</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-500" />
                <input
                  type="password"
                  placeholder="Min. 8 characters"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="w-full bg-[#0B1120] border border-blue-500/20 rounded-xl pl-12 pr-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:shadow-[0_0_15px_rgba(59,130,246,0.2)] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 text-sm mb-2 ml-1">Confirm Password *</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-500" />
                <input
                  type="password"
                  placeholder="Re-enter password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className="w-full bg-[#0B1120] border border-blue-500/20 rounded-xl pl-12 pr-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:shadow-[0_0_15px_rgba(59,130,246,0.2)] transition-all"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-5">
            <p className="text-slate-400 text-sm mb-4">Tell us about your data stack (Optional)</p>
            
            <div>
              <label className="block text-slate-400 text-sm mb-2 ml-1">Organization</label>
              <div className="relative">
                <Briefcase className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-500" />
                <input
                  type="text"
                  placeholder="Acme Inc."
                  value={formData.organization}
                  onChange={(e) => handleInputChange('organization', e.target.value)}
                  className="w-full bg-[#0B1120] border border-blue-500/20 rounded-xl pl-12 pr-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:shadow-[0_0_15px_rgba(59,130,246,0.2)] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 text-sm mb-2 ml-1">Your Role</label>
              <div className="relative">
                <Code className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-500" />
                <select
                  value={formData.role}
                  onChange={(e) => handleInputChange('role', e.target.value)}
                  className="w-full bg-[#0B1120] border border-blue-500/20 rounded-xl pl-12 pr-4 py-3 text-slate-200 focus:outline-none focus:border-blue-500 focus:shadow-[0_0_15px_rgba(59,130,246,0.2)] transition-all appearance-none"
                >
                  <option value="" className="bg-[#0B1120] text-slate-500">Select your role</option>
                  <option value="data-engineer" className="bg-[#0B1120]">Data Engineer</option>
                  <option value="analytics-engineer" className="bg-[#0B1120]">Analytics Engineer</option>
                  <option value="data-scientist" className="bg-[#0B1120]">Data Scientist</option>
                  <option value="sre" className="bg-[#0B1120]">Site Reliability Engineer</option>
                  <option value="manager" className="bg-[#0B1120]">Data Manager</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 text-sm mb-2 ml-1">Experience Level</label>
              <div className="grid grid-cols-3 gap-3">
                {['Junior', 'Senior', 'Lead'].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => handleInputChange('experience', level)}
                    className={`py-3 rounded-xl border transition-all text-sm font-medium ${
                      formData.experience === level
                        ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                        : 'bg-[#0B1120] border-blue-500/20 text-slate-400 hover:border-blue-500/50'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-5">
            <div>
              <label className="block text-slate-200 text-sm mb-3 ml-1">What are your priorities?</label>
              <div className="grid grid-cols-2 gap-3">
                {interestsOptions.map((interest) => (
                  <button
                    key={interest.id}
                    type="button"
                    onClick={() => toggleArrayField('interests', interest.id)}
                    className={`p-3 rounded-xl border transition-all text-left ${
                      formData.interests.includes(interest.id)
                        ? 'bg-blue-500/10 border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.1)]'
                        : 'bg-[#0B1120] border-blue-500/20 hover:border-blue-500/50'
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      <span>{interest.icon}</span>
                      {formData.interests.includes(interest.id) && (
                        <Check className="w-4 h-4 text-blue-500 ml-auto" />
                      )}
                    </div>
                    <p className={`text-xs font-semibold ${formData.interests.includes(interest.id) ? 'text-slate-200' : 'text-slate-400'}`}>
                      {interest.label}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-slate-200 text-sm mb-3 ml-1">Primary Infrastructure</label>
              <div className="space-y-2">
                {useCasesOptions.map((useCase) => (
                  <button
                    key={useCase.id}
                    type="button"
                    onClick={() => toggleArrayField('useCases', useCase.id)}
                    className={`w-full p-3 rounded-xl border transition-all text-left flex items-center justify-between ${
                      formData.useCases.includes(useCase.id)
                        ? 'bg-blue-500/10 border-blue-500'
                        : 'bg-[#0B1120] border-blue-500/20 hover:border-blue-500/50'
                    }`}
                  >
                    <span className={`text-sm ${formData.useCases.includes(useCase.id) ? 'text-slate-200' : 'text-slate-400'}`}>
                      {useCase.label}
                    </span>
                    {formData.useCases.includes(useCase.id) && (
                      <Check className="w-4 h-4 text-blue-500" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 relative overflow-hidden flex items-center justify-center font-sans">
      
      {/* --- FLOATING NAVBAR (Minimal Version) --- */}
      <header className="fixed top-[10px] left-[10px] right-[10px] z-50 backdrop-blur-md rounded-2xl border border-blue-500/10 bg-[#0B1120]/80">
        <nav className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Stethoscope className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              <span className="text-blue-500">Data</span>Guard
            </span>
          </div>
          
          <button 
            onClick={() => router.push('/')}
            className="flex items-center gap-2 px-4 py-2 bg-[#1E293B] hover:bg-[#334155] border border-blue-500/20 hover:border-blue-500/50 rounded-xl text-sm font-medium transition-all group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform text-blue-400" />
            Back to Home
          </button>
        </nav>
      </header>

      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] top-0 left-0 animate-pulse" />
        <div className="absolute w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] bottom-0 right-0 animate-pulse delay-1000" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      {/* Internal Back Button (Multi-step flow) */}
      {currentStep > 1 && !isSignIn && (
        <button
          onClick={handleBack}
          className="absolute top-28 left-4 md:left-8 z-40 p-3 rounded-full bg-[#1E293B] border border-blue-500/20 text-blue-400 hover:border-blue-500 transition-all"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {/* Progress Bar */}
      {!isSignIn && (
        <div className="fixed top-[70px] left-[10px] right-[10px] z-40 px-2">
          <div className="h-1 bg-[#1E293B] rounded-full overflow-hidden w-full max-w-md mx-auto">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Loading & Success Overlay */}
      {(loading || success) && (
        <div className="fixed inset-0 bg-[#020617]/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-center">
            {success ? (
              <div className="w-20 h-20 bg-green-500/20 border-2 border-green-500 rounded-full flex items-center justify-center mb-6 mx-auto animate-in zoom-in duration-300">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
            ) : (
              <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4 mx-auto" />
            )}
            
            <p className={`text-lg font-semibold animate-pulse ${success ? 'text-green-400' : 'text-blue-400'}`}>
              {success || (isSignIn ? 'Authenticating...' : 'Provisioning workspace...')}
            </p>
          </div>
        </div>
      )}

      {/* Auth Card */}
      <div className="relative z-10 bg-[#0F172A]/80 backdrop-blur-xl border border-blue-500/20 rounded-3xl p-8 md:p-10 max-w-md w-full mx-4 shadow-2xl shadow-blue-900/20 mt-20">
        
        {/* Header Section */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2 font-display">
            {isSignIn ? (
              <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">Welcome Back</span>
            ) : (
              <span className="text-white">
                {currentStep === 1 && 'Join DataGuard'}
                {currentStep === 2 && 'Your Profile'}
                {currentStep === 3 && 'Stack Preferences'}
              </span>
            )}
          </h2>
          <p className="text-slate-400 text-sm">
            {isSignIn 
              ? 'Sign in to monitor your data reliability' 
              : currentStep === 1 
                ? 'The autonomous doctor for your data pipelines' 
                : currentStep === 2
                  ? 'Help us tailor your observability dashboard'
                  : 'Select the technologies you use'}
          </p>
        </div>

        {/* Step Indicator */}
        {!isSignIn && (
          <div className="flex items-center justify-center space-x-3 mb-8">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all text-xs font-bold ${
                    step < currentStep
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : step === currentStep
                        ? 'border-blue-500 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.3)]'
                        : 'border-slate-700 text-slate-600'
                  }`}
                >
                  {step < currentStep ? <Check className="w-4 h-4" /> : step}
                </div>
                {step < 3 && (
                  <div className={`w-8 h-[1px] mx-1 ${step < currentStep ? 'bg-blue-600' : 'bg-slate-800'}`} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Form Content */}
        {renderStepContent()}

        {/* Action Buttons */}
        <div className="mt-8 space-y-4">
          {isSignIn ? (
            <button
              onClick={handleAuth}
              disabled={loading || !!success}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl text-white font-bold text-lg hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-blue-500/30 flex items-center justify-center space-x-2"
            >
              <LogIn className="w-5 h-5" />
              <span>Sign In</span>
            </button>
          ) : (
            <div className="flex space-x-3">
              {currentStep > 1 && (
                <button
                  onClick={handleBack}
                  className="px-6 py-4 bg-[#1E293B] border border-slate-700 hover:border-slate-500 rounded-xl text-slate-300 font-semibold transition-all flex items-center space-x-2"
                >
                  <ChevronLeft className="w-5 h-5" />
                  <span>Back</span>
                </button>
              )}
              
              {currentStep < totalSteps ? (
                <button
                  onClick={handleNext}
                  className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl text-white font-bold hover:scale-[1.02] transition-all duration-300 shadow-lg hover:shadow-blue-500/30 flex items-center justify-center space-x-2"
                >
                  <span>Continue</span>
                  <ChevronRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={handleAuth}
                  disabled={loading || !!success}
                  className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl text-white font-bold hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 shadow-lg hover:shadow-blue-500/30 flex items-center justify-center space-x-2"
                >
                  <UserPlus className="w-5 h-5" />
                  <span>Create Account</span>
                </button>
              )}
            </div>
          )}

          {/* Toggle Sign In/Sign Up */}
          <div className="text-center pt-2">
            <button
              onClick={() => {
                setIsSignIn(!isSignIn);
                setCurrentStep(1);
                setError('');
                setSuccess('');
              }}
              className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              {isSignIn ? "Need a workspace? Create Account" : 'Have a workspace? Sign In'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}