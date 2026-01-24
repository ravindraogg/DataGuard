'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  BarChart3,
  Brain,
  TrendingUp,
  Zap,
  Globe,
  ChevronRight,
  Server,
  Target,
  Clock,
  Sun,
  Moon,
  Sparkles,
  Rocket,
  ChevronDown,
  Star,
  Wrench,
  Stethoscope,
  Lock,
  Workflow,
  Factory,
  HeartPulse,
  Leaf,
  Home
} from 'lucide-react';
import Link from 'next/link';

type ThemeMode = 'light' | 'dark';

interface ThemeColors {
  bgPrimary: string;
  textPrimary: string;
  textSecondary: string;
  cardBg: string;
  cardBorder: string;
  navBg: string;
  gridColor: string;
  highlightColor: string;
  chipGradient: string;
  glowPrimary: string;
  glowSecondary: string;
}

interface DomainCard {
  name: string;
  category: string;
  reliability: string;
  latency: string;
  description: string;
  tags: string[];
}

const DomainTooltip = ({
  model,
  mousePos,
  theme,
  currentTheme
}: {
  model: DomainCard | null;
  mousePos: { x: number; y: number };
  theme: ThemeMode;
  currentTheme: ThemeColors;
}) => {
  if (!model) return null;

  const isDark = theme === 'dark';
  const bgColor = isDark ? 'bg-[#0F172A]' : 'bg-white';
  const borderColor = isDark ? 'border-blue-500/50' : 'border-blue-200/50';

  return (
    <div
      className={`fixed z-[100] p-4 rounded-xl shadow-2xl border ${bgColor} ${borderColor} max-w-xs transition-opacity duration-100 pointer-events-none`}
      style={{
        left: `${mousePos.x + 20}px`,
        top: `${mousePos.y + 20}px`
      }}
    >
      <h4 className={`text-xl font-bold mb-1 ${currentTheme.textPrimary}`}>
        {model.name}
      </h4>
      <p className="text-blue-500 text-sm mb-3 font-semibold">{model.category}</p>

      <p className={`text-sm mb-4 ${currentTheme.textSecondary}`}>{model.description}</p>

      <div className="space-y-2 border-t pt-3 mt-3 border-gray-500/20">
        <div className="flex items-center justify-between text-sm">
          <span className={`flex items-center space-x-2 ${currentTheme.textPrimary}`}>
            <Star className="w-4 h-4 text-blue-500 fill-blue-500" />
            <span>Reliability:</span>
          </span>
          <span className="font-bold text-blue-500">{model.reliability}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className={`flex items-center space-x-2 ${currentTheme.textPrimary}`}>
            <Zap className="w-4 h-4 text-blue-400" />
            <span>Latency:</span>
          </span>
          <span className={`font-bold ${currentTheme.textPrimary}`}>{model.latency}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-gray-500/20">
        {model.tags?.map((tag, i) => (
          <span
            key={i}
            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              isDark
                ? 'bg-[#1E293B] text-blue-200 border border-blue-500/20'
                : 'bg-blue-50 text-blue-600'
            }`}
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
};

export default function DataHealLanding() {
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredModel, setHoveredModel] = useState<DomainCard | null>(null);
  const [selectedRole, setSelectedRole] = useState('iot');
  const [currentTagline, setCurrentTagline] = useState(0);
  const [stats, setStats] = useState({ devices: 0, anomalies: 0, streams: 0 });
  const [scrollY, setScrollY] = useState(0);

  const [particles, setParticles] = useState<
    Array<{ left: string; top: string; delay: string }>
  >([]);

  const heroRef = useRef<HTMLElement>(null);

  const colorScheme: Record<ThemeMode, ThemeColors> = {
    light: {
      bgPrimary: 'bg-slate-50',
      textPrimary: 'text-slate-900',
      textSecondary: 'text-slate-600',
      cardBg: 'bg-white',
      cardBorder: 'border-slate-200',
      navBg: 'bg-slate-50/80',
      gridColor: 'rgba(59, 130, 246, 0.08)',
      highlightColor: '#3B82F6',
      chipGradient:
        'linear-gradient(135deg, rgba(59,130,246,0.25) 0%, rgba(37,99,235,0.25) 20%, rgba(59,130,246,0.2) 60%, rgba(59,130,246,0) 89%)',
      glowPrimary: 'shadow-[0_0_30px_rgba(59,130,246,0.3)]',
      glowSecondary: 'shadow-[0_0_30px_rgba(14,165,233,0.4)]'
    },
    dark: {
      bgPrimary: 'bg-[#0B1120]',
      textPrimary: 'text-[#E2E8F0]',
      textSecondary: 'text-[#94A3B8]',
      cardBg: 'bg-[#1E293B]',
      cardBorder: 'border-blue-500/20',
      navBg: 'bg-[#0B1120]/80',
      gridColor: 'rgba(59, 130, 246, 0.05)',
      highlightColor: '#3B82F6',
      chipGradient:
        'linear-gradient(135deg, rgba(59,130,246,0.2) 0%, rgba(14,165,233,0.2) 20%, rgba(59,130,246,0.2) 60%, rgba(59,130,246,0) 89%)',
      glowPrimary: 'hover:shadow-[0_0_30px_rgba(59,130,246,0.3)]',
      glowSecondary: 'hover:shadow-[0_0_30px_rgba(14,165,233,0.4)]'
    }
  };

  const currentTheme = colorScheme[theme];

  const taglines = [
    'Stop trusting sensor data blindly. Validate it.',
    'Autonomous healing for real-time IoT streams',
    'Detect. Diagnose. Heal.'
  ];

  const roles = [
    {
      id: 'iot',
      icon: Workflow,
      title: 'IoT Engineer',
      color: 'from-blue-500 to-cyan-500',
      benefits: [
        'Auto-heal missing and delayed sensor values',
        'Domain-aware healing using trained experts',
        'Explainable decisions per request'
      ]
    },
    {
      id: 'operator',
      icon: Factory,
      title: 'Plant Operator',
      color: 'from-cyan-600 to-teal-500',
      benefits: [
        'Catch failures before systems drift',
        'Reduce downtime using live monitoring',
        'Repair history for audits'
      ]
    },
    {
      id: 'energyops',
      icon: Zap,
      title: 'Energy Operations',
      color: 'from-blue-600 to-indigo-700',
      benefits: [
        'Detect power drops and frequency drift',
        'Prevent corrupted grid readings',
        'Confidence-aware fallback safety'
      ]
    },
    {
      id: 'health',
      icon: HeartPulse,
      title: 'Healthcare Technician',
      color: 'from-purple-500 to-blue-500',
      benefits: [
        'Detect missing vitals instantly',
        'Stable patient monitoring streams',
        'Safe fallback for low confidence'
      ]
    }
  ];

  const features = [
    {
      icon: Activity,
      title: 'Real-Time Monitoring',
      description:
        'Track live sensor health in milliseconds. Detect corrupted, missing, delayed, and anomalous values.'
    },
    {
      icon: ShieldFix,
      title: 'Autonomous Healing',
      description:
        'Recover missing values using domain-trained expert models with safe fallback behavior.'
    },
    {
      icon: Brain,
      title: 'Explainable Decisions',
      description:
        'Every heal is accompanied by policy reasoning: strategy used, trust score, and adaptive thresholds.'
    },
    {
      icon: Lock,
      title: 'Safe by Design',
      description:
        'Low-confidence domains fall back conservatively. The “other” domain avoids risky inference.'
    },
    {
      icon: BarChart3,
      title: 'Domain-Aware Stats',
      description:
        'Domain-level monitoring and healing telemetry gives visibility into performance and drift.'
    },
    {
      icon: Wrench,
      title: 'Repair History',
      description:
        'Track before/after values, method used, confidence, and reward feedback for continuous policy improvement.'
    }
  ];

  const challenges = [
    {
      problem:
        'Silent sensor failures (ex: stuck at 0, missing for minutes) corrupt downstream analytics.',
      solution:
        'DataHeal detects anomalies in real time and safely reconstructs missing values based on temporal patterns.'
    },
    {
      problem: 'Domain data behavior differs drastically (healthcare vs grid vs industrial).',
      solution:
        'DataHeal routes streams to domain experts (agriculture/energy/industrial/healthcare/smarthome) for specialized healing.'
    },
    {
      problem: 'Engineers can’t trust black-box healing.',
      solution:
        'Every response includes domain, confidence, policy strategy, trust score, and explainability metadata.'
    }
  ];

  const domains: DomainCard[] = [
    {
      name: 'Agriculture',
      category: 'IoT Farming',
      latency: '<20ms',
      reliability: '99.9%',
      description: 'Heals moisture, humidity, and temperature streams for smart farming pipelines.',
      tags: ['Temperature', 'Humidity', 'Water Level']
    },
    {
      name: 'Industrial',
      category: 'Maintenance',
      latency: '<15ms',
      reliability: '99.8%',
      description: 'Detects vibration drift and reconstructs missing readings in factory machines.',
      tags: ['Vibration', 'Current', 'Acoustic']
    },
    {
      name: 'SmartHome',
      category: 'Automation',
      latency: '<25ms',
      reliability: '99.7%',
      description: 'Ensures stability in occupancy, temperature, and power usage monitoring.',
      tags: ['Occupancy', 'Power', 'Temperature']
    },
    {
      name: 'Energy',
      category: 'Smart Grid',
      latency: '<10ms',
      reliability: '99.95%',
      description: 'Restores voltage/current/frequency/power values and flags drift events.',
      tags: ['Voltage', 'Current', 'Frequency', 'Power']
    }
  ];

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  useEffect(() => {
    setIsVisible(true);

    const newParticles = [...Array(20)].map(() => ({
      left: Math.random() * 100 + '%',
      top: Math.random() * 100 + '%',
      delay: Math.random() * 2 + 's'
    }));
    setParticles(newParticles);

    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as ThemeMode;
      if (savedTheme) setTheme(savedTheme);
    }

    const taglineInterval = setInterval(() => {
      setCurrentTagline(prev => (prev + 1) % taglines.length);
    }, 3500);

    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    const handleScroll = () => setScrollY(window.scrollY);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);

    const duration = 2000;
    const targetStats = { devices: 2500, anomalies: 180000, streams: 980 };
    const steps = 60;
    const stepDuration = duration / steps;

    let step = 0;
    const statsInterval = setInterval(() => {
      step++;
      setStats({
        devices: Math.floor((targetStats.devices / steps) * step),
        anomalies: Math.floor((targetStats.anomalies / steps) * step),
        streams: Math.floor((targetStats.streams / steps) * step)
      });
      if (step >= steps) clearInterval(statsInterval);
    }, stepDuration);

    return () => {
      clearInterval(taglineInterval);
      clearInterval(statsInterval);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const isFeaturesVisible = scrollY > 800;

  return (
    <div
      className={`min-h-screen overflow-hidden relative font-sans ${currentTheme.bgPrimary} ${currentTheme.textPrimary} transition-colors duration-500`}
    >
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Orbitron:wght@500;700;900&display=swap');

        .font-sans {
          font-family: 'Inter', sans-serif;
        }
        .font-display {
          font-family: 'Orbitron', sans-serif;
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-in-out;
        }
      `}</style>

      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className={`absolute w-96 h-96 border ${
            theme === 'light' ? 'border-blue-500/30' : 'border-blue-500/20'
          } rounded-full`}
          style={{
            left: mousePos.x * 0.02 + 'px',
            top: mousePos.y * 0.02 + 'px',
            transform: 'translate(-50%, -50%)'
          }}
        />
        <div
          className="absolute w-64 h-64 border border-cyan-500/30 rounded-full"
          style={{
            right: -mousePos.x * 0.015 + 'px',
            bottom: -mousePos.y * 0.015 + 'px'
          }}
        />

        {particles.map((p, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-blue-500 rounded-full animate-pulse"
            style={{
              left: p.left,
              top: p.top,
              animationDelay: p.delay,
              opacity: 0.3
            }}
          />
        ))}

        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(${currentTheme.gridColor} 1px,transparent 1px),linear-gradient(90deg,${currentTheme.gridColor} 1px,transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      <DomainTooltip model={hoveredModel} mousePos={mousePos} theme={theme} currentTheme={currentTheme} />

      <header
        className={`fixed top-[30px] left-[15px] right-[15px] z-50 backdrop-blur-md rounded-full mb-8 border ${currentTheme.navBg} ${
          theme === 'light' ? 'border-gray-200' : 'border-blue-500/10'
        }`}
      >
        <nav className="max-w-7xl mx-auto px-4 sm:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3 group cursor-pointer">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center relative shadow-lg shadow-blue-500/20">
              <Stethoscope className="w-5 h-5 md:w-7 md:h-7 text-white" />
              <div className="absolute inset-0 bg-blue-500 opacity-0 group-hover:opacity-20 rounded-lg transition-opacity duration-300" />
            </div>
            <div className="text-xl md:text-2xl font-bold tracking-wider font-display">
              <span className="text-blue-500">Data</span>
              <span className={currentTheme.textPrimary}>Guard</span>
            </div>
          </div>

          <div className="hidden lg:flex items-center space-x-8">
            {['Features', 'Roles', 'Domains', 'Impact'].map(item => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className={`${currentTheme.textSecondary} hover:text-blue-500 transition-all duration-300 hover:-translate-y-0.5 cursor-pointer font-medium`}
              >
                {item}
              </a>
            ))}
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className={`p-2 md:p-3 rounded-full transition-colors duration-300 ${
                theme === 'light'
                  ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  : 'bg-[#1E293B] hover:bg-gray-800 text-blue-400'
              }`}
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>

            <Link href="/auth">
              <button className="px-4 py-2 md:px-6 md:py-3 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-lg text-white font-semibold hover:scale-105 hover:shadow-[0_0_20px_rgba(59,130,246,0.6)] transition-all duration-300 shadow-blue-500/20">
                Get Started
              </button>
            </Link>
          </div>
        </nav>
      </header>

      <section ref={heroRef} className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 pt-36 pb-20">
        <div
          className={`text-center transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <div
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{
              position: 'absolute',
              top: '40%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '800px',
              height: '350px',
              zIndex: 0,
              background: currentTheme.chipGradient,
              filter: 'blur(120px)',
              borderRadius: '30% 70% 50% 50%'
            }}
          />

          <div
            className={`inline-flex items-center space-x-2 px-4 py-2 ${
              theme === 'light'
                ? 'bg-white border-blue-500/30 shadow-lg'
                : 'bg-[#1E293B] border-blue-500/30'
            } rounded-full mb-8 relative z-10 border`}
          >
            <Sparkles className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-blue-500 font-medium">
              Phase 6: Policy Adaptation is Live
            </span>
          </div>

          <h1
            className={`text-4xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight tracking-tight relative z-10 ${currentTheme.textPrimary} font-display`}
          >
            The Doctor for Your
            <br />
            <span className="bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-600 bg-clip-text text-transparent">
              IoT Sensor Streams
            </span>
          </h1>

          <div className="h-10 sm:h-20 mb-8 relative z-10">
            <p
              className={`text-xl sm:text-2xl font-light ${
                theme === 'light' ? 'text-blue-900' : 'text-blue-200'
              } animate-fade-in`}
            >
              {taglines[currentTagline]}
            </p>
          </div>

          <p
            className={`text-lg sm:text-xl mb-12 max-w-3xl mx-auto leading-relaxed relative z-10 ${currentTheme.textSecondary}`}
          >
            DataHeal AI sits between your raw sensors and your dashboards to detect corrupted or missing values,
            reconstruct them safely using domain experts, and adapt its healing policy using feedback logs.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 relative z-10">
            <button className="group relative w-full sm:w-auto px-8 py-4 lg:px-10 lg:py-5 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl text-lg font-bold text-white overflow-hidden hover:scale-105 transition-all duration-300 shadow-xl shadow-blue-500/20">
              <span className="relative z-10 flex items-center justify-center space-x-2">
                <Rocket className="w-5 h-5" />
                <span>Start Monitoring</span>
              </span>
              <div className="absolute inset-0 bg-blue-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
            </button>

            <button
              className={`w-full sm:w-auto px-8 py-4 lg:px-10 lg:py-5 ${currentTheme.cardBg} border-2 ${
                theme === 'light'
                  ? 'border-gray-300 text-gray-800 hover:border-blue-500'
                  : 'border-blue-500/50 text-[#E2E8F0] hover:border-blue-400'
              } rounded-xl text-lg font-bold transition-all duration-300`}
            >
              View Documentation
            </button>
          </div>

          <div className="mt-16 animate-bounce">
            <ChevronDown className="w-8 h-8 mx-auto text-blue-500" />
          </div>
        </div>
      </section>

      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 py-10 sm:py-20">
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { label: 'Devices Monitored', value: stats.devices, suffix: '+', icon: Server },
            {
              label: 'Anomalies Detected',
              value: stats.anomalies.toLocaleString(),
              suffix: '+',
              icon: Activity
            },
            { label: 'Sensor Streams / Day', value: stats.streams, suffix: '+', icon: Globe }
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div
                key={i}
                className={`${currentTheme.cardBg} border ${currentTheme.cardBorder} rounded-2xl p-6 sm:p-8 text-center hover:border-blue-500 transition-all group ${
                  theme === 'light'
                    ? 'shadow-md hover:shadow-[0_0_30px_rgba(59,130,246,0.3)]'
                    : 'hover:shadow-[0_0_30px_rgba(59,130,246,0.3)]'
                }`}
              >
                <Icon className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 text-blue-500" />
                <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent mb-2 group-hover:scale-105 transition-transform">
                  {stat.value}
                  {stat.suffix}
                </div>
                <div className={`${currentTheme.textSecondary} text-base sm:text-lg`}>{stat.label}</div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="relative z-10 max-w-6xl mx-auto px-4 sm:px-8 py-10 sm:py-20">
        <h2 className="text-3xl sm:text-5xl font-bold text-center mb-4 bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent font-display">
          From Sensor Failures to Trusted Decisions
        </h2>
        <p className={`text-center ${currentTheme.textSecondary} text-lg sm:text-xl mb-12 sm:mb-16`}>
          Most systems fail because sensor data lies quietly. DataHeal fixes that.
        </p>

        <div className="space-y-6">
          {challenges.map((item, i) => (
            <div
              key={i}
              className={`${currentTheme.cardBg} border ${currentTheme.cardBorder} rounded-2xl p-6 sm:p-8 hover:border-blue-500 transition-all group ${
                theme === 'light' ? 'shadow-md' : ''
              }`}
            >
              <div className="grid md:grid-cols-2 gap-6 md:gap-8">
                <div className="space-y-2">
                  <div className="text-red-500 font-semibold text-xs sm:text-sm uppercase tracking-wider flex items-center space-x-2">
                    <Target className="w-4 h-4" />
                    <span>The Problem</span>
                  </div>
                  <p className={`text-lg sm:text-xl ${currentTheme.textPrimary}`}>{item.problem}</p>
                </div>
                <div className="space-y-2 md:border-l-4 border-blue-500 md:pl-6 pt-4 md:pt-0">
                  <div className="text-green-500 font-semibold text-xs sm:text-sm uppercase tracking-wider flex items-center space-x-2">
                    <Zap className="w-4 h-4" />
                    <span>The DataHeal Fix</span>
                  </div>
                  <p className={`text-lg sm:text-xl ${currentTheme.textPrimary}`}>{item.solution}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="roles" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 py-10 sm:py-20">
        <h2 className="text-3xl sm:text-5xl font-bold text-center mb-4 bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent font-display">
          Built for Domain Operations Teams
        </h2>
        <p className={`text-center ${currentTheme.textSecondary} text-lg sm:text-xl mb-12 sm:mb-16`}>
          Reliability for every real-world system
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {roles.map(role => {
            const Icon = role.icon;
            const isSelected = selectedRole === role.id;

            return (
              <div
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={`cursor-pointer ${currentTheme.cardBg} border rounded-2xl p-6 sm:p-8 transition-all transform hover:scale-[1.02] ${
                  isSelected
                    ? `border-blue-500 ${
                        theme === 'light'
                          ? 'shadow-[0_0_30px_rgba(59,130,246,0.4)]'
                          : 'shadow-[0_0_30px_rgba(59,130,246,0.3)]'
                      }`
                    : `${currentTheme.cardBorder} hover:border-blue-500/50`
                }`}
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${role.color} flex items-center justify-center mb-6`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>

                <h3 className={`text-xl sm:text-2xl font-bold mb-4 ${currentTheme.textPrimary}`}>
                  {role.title}
                </h3>

                <div
                  className={`space-y-3 transition-all duration-500 ${
                    isSelected ? 'opacity-100 max-h-96' : 'opacity-70 max-h-0 overflow-hidden'
                  }`}
                >
                  {role.benefits.map((benefit, i) => (
                    <div key={i} className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2"></div>
                      <p className={currentTheme.textSecondary}>{benefit}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section id="domains" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 py-10 sm:py-20">
        <div className="text-center mb-12">
          <h2 className={`text-3xl sm:text-5xl font-bold mb-4 ${currentTheme.textPrimary} font-display`}>
            <span className="text-blue-500">Trained</span> Domains
          </h2>
          <p className={`text-lg ${currentTheme.textSecondary}`}>
            Your models are domain-aware: agriculture, industrial, smarthome, energy, healthcare
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {domains.map((model, index) => (
            <div
              key={index}
              className={`group ${currentTheme.cardBg} border ${currentTheme.cardBorder} rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:scale-[1.05] hover:border-blue-500 ${
                theme === 'light'
                  ? 'shadow-md hover:shadow-[0_0_30px_rgba(59,130,246,0.4)]'
                  : 'hover:shadow-[0_0_30px_rgba(59,130,246,0.4)]'
              }`}
              onMouseEnter={() => setHoveredModel(model)}
              onMouseLeave={() => setHoveredModel(null)}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl mb-4 flex items-center justify-center text-white">
                <Globe className="w-6 h-6" />
              </div>
              <h3 className={`text-xl font-bold ${currentTheme.textPrimary} mb-2`}>{model.name}</h3>
              <p className="text-blue-500 text-sm mb-4">{model.category}</p>
              <div className="flex justify-between text-sm">
                <span className={currentTheme.textSecondary}>Lat: {model.latency}</span>
                <span className="text-green-500 font-bold">{model.reliability}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="impact" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 py-10 sm:py-20">
        <h2 className="text-3xl sm:text-5xl font-bold text-center mb-4 bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent font-display">
          Business Impact
        </h2>
        <p className={`text-center ${currentTheme.textSecondary} text-lg sm:text-xl mb-12 sm:mb-16`}>
          Reliability improvements you can measure
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            {
              icon: TrendingUp,
              title: 'Uptime',
              desc: 'Improves stream availability and reduces missing values',
              color: 'from-blue-600 to-cyan-500'
            },
            {
              icon: Clock,
              title: 'Speed',
              desc: 'Detects failures instantly and repairs without manual effort',
              color: 'from-purple-500 to-blue-500'
            },
            {
              icon: Zap,
              title: 'Safety',
              desc: 'Confidence-based fallback prevents risky heals',
              color: 'from-cyan-600 to-teal-500'
            },
            {
              icon: Rocket,
              title: 'Adaptation',
              desc: 'Policy adapts from experience logs without retraining models',
              color: 'from-blue-700 to-indigo-600'
            }
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div
                key={i}
                className={`${currentTheme.cardBg} border ${currentTheme.cardBorder} rounded-2xl p-6 sm:p-8 hover:border-blue-500 transition-all group ${
                  theme === 'light' ? 'shadow-md' : ''
                }`}
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-6 group-hover:scale-105 transition-transform shadow-lg`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <h3 className={`text-xl sm:text-2xl font-bold mb-3 ${currentTheme.textPrimary}`}>{item.title}</h3>
                <p className={`text-base sm:text-lg ${currentTheme.textSecondary}`}>{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-8 py-10 sm:py-20">
        <div className={`bg-gradient-to-r from-blue-900/20 to-cyan-900/20 backdrop-blur-sm rounded-3xl p-8 sm:p-16 border border-blue-500/30 text-center relative overflow-hidden ${theme === 'light' ? 'shadow-2xl' : ''}`}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl" />

          <div className="relative z-10">
            <h2 className={`text-3xl sm:text-5xl font-bold mb-6 ${currentTheme.textPrimary} font-display`}>
              Ready to <span className="text-blue-500">Heal</span> Your Streams?
            </h2>
            <p className={`text-lg sm:text-xl mb-10 max-w-2xl mx-auto ${currentTheme.textSecondary}`}>
              Stop letting sensor failures corrupt decisions. Start healing your IoT streams in real time.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth">
                <button className="px-8 py-4 sm:px-12 sm:py-5 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl text-lg sm:text-xl font-bold text-white hover:scale-105 hover:shadow-[0_0_40px_rgba(59,130,246,0.6)] transition-all duration-300 shadow-xl">
                  Deploy Now
                </button>
              </Link>

              <button
                className={`px-8 py-4 sm:px-12 sm:py-5 ${currentTheme.cardBg} border-2 ${
                  theme === 'light'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-blue-500 text-blue-400'
                } rounded-xl text-lg sm:text-xl font-bold hover:bg-blue-500 hover:text-white transition-all duration-300`}
              >
                View Documentation
              </button>
            </div>
          </div>
        </div>
      </section>

      <footer className={`relative z-10 border-t ${theme === 'light' ? 'border-gray-300' : 'border-blue-500/10'} mt-20`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center text-white">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <span className={`text-2xl font-bold ${currentTheme.textPrimary} font-display`}>
                  <span className="text-blue-500">Data</span>Guard
                </span>
              </div>
              <p className={currentTheme.textSecondary}>
                Autonomous data healing for IoT sensor streams with domain-specific experts and adaptive policies.
              </p>
            </div>

            <div>
              <h4 className={`font-bold mb-4 ${currentTheme.textPrimary}`}>Platform</h4>
              <div className="space-y-2">
                {['Features', 'Domains', 'Documentation', 'API'].map(link => (
                  <a
                    key={link}
                    href="#"
                    className={`block ${currentTheme.textSecondary} hover:text-blue-500 transition-colors`}
                  >
                    {link}
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h4 className={`font-bold mb-4 ${currentTheme.textPrimary}`}>Company</h4>
              <div className="space-y-2">
                {['About', 'Contact', 'Status', 'Support'].map(link => (
                  <a
                    key={link}
                    href="#"
                    className={`block ${currentTheme.textSecondary} hover:text-blue-500 transition-colors`}
                  >
                    {link}
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div
            className={`flex flex-col md:flex-row justify-between items-center pt-8 border-t ${
              theme === 'light' ? 'border-gray-200' : 'border-blue-500/10'
            }`}
          >
            <div className={`text-sm ${currentTheme.textSecondary}`}>© 2026 DataHeal AI. All rights reserved.</div>

            <div className="flex space-x-6 mt-4 md:mt-0">
              <a
                href="#"
                className={`text-sm ${currentTheme.textSecondary} hover:text-blue-500 transition-colors`}
              >
                Privacy
              </a>
              <a
                href="#"
                className={`text-sm ${currentTheme.textSecondary} hover:text-blue-500 transition-colors`}
              >
                Terms
              </a>
              <a
                href="#"
                className={`text-sm ${currentTheme.textSecondary} hover:text-blue-500 transition-colors`}
              >
                Status
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function ShieldFix(props: any) {
  return <ShieldFixIcon {...props} />;
}

function ShieldFixIcon(props: any) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}
