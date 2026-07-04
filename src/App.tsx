import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  QuantumSystemConfig,
  QuantumSystemType,
  CHALLENGES,
  QuantumEvent
} from './types';
import QuantumSimulator from './components/QuantumSimulator';
import EventLogPanel from './components/EventLogPanel';
import ParameterPanel from './components/ParameterPanel';
import ChallengeCenter from './components/ChallengeCenter';
import {
  Waves,
  Shuffle,
  GitCommit,
  ArrowRightLeft,
  Settings2,
  Trophy,
  Sparkles, Sun, Moon,
  HelpCircle,
  Activity,
  Award,
  BookOpen,
  Info,
  TrendingUp,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export default function App() {
  // 1. Core State
  const [isLightMode, setIsLightMode] = useState(false);
  useEffect(() => {
    if (isLightMode) document.body.classList.add('light-theme');
    else document.body.classList.remove('light-theme');
  }, [isLightMode]);
  const [systemType, setSystemType] = useState<QuantumSystemType>('wavefunction');
  const [activeChallengeId, setActiveChallengeId] = useState<string | null>(null);

  // Quantum interaction log histories
  const [events, setEvents] = useState<QuantumEvent[]>([
    {
      id: 'init-1',
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
      type: 'quantum',
      message: 'Liquid-cooled superconducting qubit cluster synchronized. Coherent state registered.',
      system: 'wavefunction',
    },
  ]);

  const addEvent = useCallback((type: 'info' | 'success' | 'warning' | 'quantum', message: string, systemOverride?: QuantumSystemType) => {
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
    const id = `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    setEvents((prev) => {
      // Avoid duplicate logs if matching the exact last entry to prevent render spam
      if (prev.length > 0 && prev[0].message === message) return prev;
      return [
        { id, timestamp, type, message, system: systemOverride || systemType },
        ...prev,
      ].slice(0, 45);
    });
  }, [systemType]);

  const [config, setConfig] = useState<QuantumSystemConfig>({
    speed: 1.0,
    showLabels: true,
    showProbabilityDensity: true,
    uncertaintyScale: 1.2,
    isCollapsing: false,
    isCollapsed: false,
    collapsedPosition: null,
    spinActive: true,
    tunnelingBarrierEnergy: 5.5,
    tunnelingWavePacketWidth: 6.5,
  });

  // Gamification tracking states
  const [currentScore, setCurrentScore] = useState<number>(0);
  const [currentFeedback, setCurrentFeedback] = useState<string>('');
  const [isSolved, setIsSolved] = useState<boolean>(false);
  const [showCelebration, setShowCelebration] = useState<boolean>(false);

  // New Interactive explanatory system states
  const [showExplanatoryGuide, setShowExplanatoryGuide] = useState<boolean>(false); // start closed to not block view
  const [activeGuideTab, setActiveGuideTab] = useState<'born' | 'heisenberg' | 'entangle' | 'tunnel' | 'spin'>('born');

  // Brief educational descriptions for each concept
  const conceptDetails: Record<QuantumSystemType, {
    title: string;
    subtitle: string;
    formula: string;
    text: string;
  }> = {
    wavefunction: {
      title: 'Wavefunction Probability Cloud & Core Localization',
      subtitle: 'The fundamental mathematical descriptor of quantum mechanical particles.',
      formula: 'iℏ ∂/∂t Ψ(x,t) = Ĥ Ψ(x,t)',
      text: 'According to Max Born, a particle does not occupy a deterministic coordinate. Instead, it exists inside a volumetric probability density cloud (|Ψ|²). The brighter neon zones represent high orbital density. Performing a Measurement forces the cloud to collapse instantly, localizing the candidate into a single definite point of intense light.',
    },
    superposition: {
      title: 'Quantum State Superposition & Interference',
      subtitle: 'A system co-existing in multiple coherent states simultaneously.',
      formula: '|Ψ⟩ = c₁|ψ_A⟩ + c₂|ψ_B⟩',
      text: 'Rather than choosing either A or B, a quantum computer registers both states concurrently. Watch the cyan and magenta wave functions layer and visually construct interference ripples. Adjust the timeline to see waves blend into purple where constructive phase synchronization takes place.',
    },
    entanglement: {
      title: 'Einstein-Podolsky-Rosen (EPR) Entanglement Link',
      subtitle: 'Instantaneous correlation between distant particles, bypassing spatial limits.',
      formula: '|Ψ_Bell⟩ = 1/√2 (|↑↓⟩ - |↓↑⟩)',
      text: 'Two particles can be prepared such that measuring the spin axis profile of Particle A instantly forces Particle B to configure to a matching anti-aligned orientation. Notice how the synchronized space-time grid pulses instantly across space, with no physical communication line, proving quantum nonlocality.',
    },
    tunneling: {
      title: 'Quantum Wave Tunneling Effect',
      subtitle: 'Spontaneous penetration of solid classically-forbidden potential walls.',
      formula: 'T ≈ exp( -2w √[2m(V₀ - E)/ℏ²] )',
      text: 'In Newtonian mechanics, particles bounce off solid potential barriers. In quantum physics, a wave function decays exponentially inside the wall but retains a non-zero probability of emerging on the other side. Adjust momentum and potential wall density to maximize wave packet transmission.',
    },
    spin: {
      title: 'Magnetic Larmor Precession & Spin Dynamics',
      subtitle: 'Intrinsic quantum angular momentum precessing under external fields.',
      formula: 'Ω = -γ B₀',
      text: 'Every quantum particle possesses an intrinsic magnetic spin orientation vector. When placed under an external magnetic field force, the spin axes do not stand rigid; instead, they precess gracefully, drawing symmetrical cones in space accompanied by transverse field rings.',
    },
  };

  const handleChallengeProgress = (score: number, feedback: string) => {
    setCurrentScore(score);
    setCurrentFeedback(feedback);

    // If score matches challenge threshold conditions
    const active = CHALLENGES.find((c) => c.id === activeChallengeId);
    if (active) {
      let isCompletedNow = false;
      if (active.id === 'predict-collapse' && score >= 85) {
        isCompletedNow = true;
      } else if (active.id === 'stabilize-wave' && score >= 90) {
        isCompletedNow = true;
      } else if (active.id === 'tunneling-barrier' && score >= 40) {
        isCompletedNow = true;
      } else if (active.id === 'entanglement-sync' && score >= 95) {
        isCompletedNow = true;
      }

      if (isCompletedNow && !isSolved) {
        setIsSolved(true);
        setShowCelebration(true);
        addEvent('success', `Axiom satisfied: Experimental goal achieved for "${active.title}". Score: ${score.toFixed(1)}%`);
      }
    }
  };

  const resetChallengeStates = () => {
    setCurrentScore(0);
    setCurrentFeedback('');
    setIsSolved(false);
    setShowCelebration(false);
  };

  const handleTabChange = (type: QuantumSystemType) => {
    setSystemType(type);
    
    // Auto-select correct challenge matching mode
    const matchingChallenge = CHALLENGES.find((c) => c.systemType === type);
    if (matchingChallenge) {
      setActiveChallengeId(matchingChallenge.id);
    } else {
      setActiveChallengeId(null);
    }
    
    resetChallengeStates();

    const modeLabels: Record<QuantumSystemType, string> = {
      wavefunction: 'Born Wavefunction Probability Cloud',
      superposition: 'Quantum Coherent Superposition States',
      entanglement: 'EPR Space-time Non-locality Link',
      tunneling: 'Potential Barrier Tunneling Effect',
      spin: 'Larmor Precession and Spin Orbitals',
    };
    addEvent('quantum', `Vacuum-cooler chamber recalibrated. Active mode: ${modeLabels[type]}`, type);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500/30 selection:text-white">
      
      {/* 1. TOP INTERACTIVE DASHBOARD HEADER */}
      <header id="app-header" className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          
          {/* Neon Title & Branding */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center shadow-lg shadow-cyan-500/10 animate-pulse">
              <Sparkles className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 via-indigo-400 to-pink-400 bg-clip-text text-transparent font-sans">
                Quima Quantum 3D Playground
              </h1>
              <button 
                onClick={() => setIsLightMode(!isLightMode)} 
                className="absolute right-4 top-4 p-2 rounded-full bg-slate-900/50 hover:bg-slate-800/80 border border-slate-700/50 text-slate-300 transition-colors z-50"
              >
                {isLightMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-orange-300" />}
              </button>
              <p className="text-[10px] uppercase tracking-widest font-mono text-slate-400">
                Quantum Simulation Lab
              </p>
            </div>
          </div>

          {/* Quick System Status Monitor & Informational Toggle */}
          <div className="flex flex-wrap items-center gap-3 self-end md:self-auto">
            
            {/* Quick telemetry indicators */}
            <div id="status-monitor" className="flex items-center gap-4 bg-slate-900/60 border border-slate-800/80 px-4 py-2 rounded-xl font-mono text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                <span>State: <strong className="text-cyan-300 font-bold font-mono">Coherent Superposition</strong></span>
              </div>
              <div className="w-px h-4 bg-slate-800" />
              <div className="flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-purple-400" />
                <span>Planck ℏ: <strong className="text-purple-300 font-bold font-mono">1.054e-34 J·s</strong></span>
              </div>
            </div>

            {/* Toggle primary guidebook */}
            <button
              id="guidebook-toggle-btn"
              onClick={() => setShowExplanatoryGuide(!showExplanatoryGuide)}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold tracking-wide flex items-center gap-2 transition-all cursor-pointer ${
                showExplanatoryGuide 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-medium' 
                  : 'bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>THEORY DECK {showExplanatoryGuide ? 'OPEN' : 'CLOSED'}</span>
              {showExplanatoryGuide ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
            </button>

          </div>

        </div>

        {/* INTERACTIVE GUIDE & REALTIME PHYSICS MATHEMATICAL CALCULATOR DECK */}
        <AnimatePresence>
          {showExplanatoryGuide && (
            <motion.div
              id="explanatory-guide-panel"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-slate-900 bg-slate-950/95 overflow-hidden"
            >
              <div className="max-w-7xl mx-auto px-4 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-900/30 rounded-2xl border border-slate-900 p-5 relative overflow-hidden">
                  
                  {/* Decorative faint grid overlay */}
                  <div className="absolute inset-0 bg-radial-gradient from-transparent to-slate-950/20 opacity-30 pointer-events-none" />
                  
                  {/* Side tabs to select core postulate list */}
                  <div className="lg:col-span-3 flex flex-col gap-1.5 z-10">
                    <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest font-bold mb-1">
                      Quantum Principles
                    </span>
                    <button
                      onClick={() => setActiveGuideTab('born')}
                      className={`text-left px-3.5 py-2.5 rounded-lg text-xs font-mono transition-all flex items-center justify-between cursor-pointer ${
                        activeGuideTab === 'born' 
                          ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-bold' 
                          : 'text-slate-400 hover:text-slate-300 hover:bg-slate-900/40'
                      }`}
                    >
                      <span>1. Born Wavefunction</span>
                      <span className="text-[9px] opacity-70">|Ψ|²</span>
                    </button>
                    <button
                      onClick={() => setActiveGuideTab('heisenberg')}
                      className={`text-left px-3.5 py-2.5 rounded-lg text-xs font-mono transition-all flex items-center justify-between cursor-pointer ${
                        activeGuideTab === 'heisenberg' 
                          ? 'bg-purple-500/10 text-purple-300 border border-purple-500/30 font-bold' 
                          : 'text-slate-400 hover:text-slate-300 hover:bg-slate-900/40'
                      }`}
                    >
                      <span>2. Heisenberg Limits</span>
                      <span className="text-[9px] opacity-70">Δx·Δp</span>
                    </button>
                    <button
                      onClick={() => setActiveGuideTab('entangle')}
                      className={`text-left px-3.5 py-2.5 rounded-lg text-xs font-mono transition-all flex items-center justify-between cursor-pointer ${
                        activeGuideTab === 'entangle' 
                          ? 'bg-pink-500/10 text-pink-300 border border-pink-500/30 font-bold' 
                          : 'text-slate-400 hover:text-slate-300 hover:bg-slate-900/40'
                      }`}
                    >
                      <span>3. EPR Entanglement</span>
                      <span className="text-[9px] opacity-70">Bell Link</span>
                    </button>
                    <button
                      onClick={() => setActiveGuideTab('tunnel')}
                      className={`text-left px-3.5 py-2.5 rounded-lg text-xs font-mono transition-all flex items-center justify-between cursor-pointer ${
                        activeGuideTab === 'tunnel' 
                          ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-bold' 
                          : 'text-slate-400 hover:text-slate-300 hover:bg-slate-900/40'
                      }`}
                    >
                      <span>4. Barrier Tunneling</span>
                      <span className="text-[9px] opacity-70">T ≈ 2%</span>
                    </button>
                    <button
                      onClick={() => setActiveGuideTab('spin')}
                      className={`text-left px-3.5 py-2.5 rounded-lg text-xs font-mono transition-all flex items-center justify-between cursor-pointer ${
                        activeGuideTab === 'spin' 
                          ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-bold' 
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                      }`}
                    >
                      <span>5. Spin Precession</span>
                      <span className="text-[9px] opacity-70">Ω = -γB₀</span>
                    </button>
                  </div>

                  {/* Main contents block showing live calculating state details */}
                  <div className="lg:col-span-9 bg-slate-950/80 border border-slate-900 py-4 px-5 rounded-xl z-10 flex flex-col justify-between min-h-[220px]">
                    
                    {/* tab 1: Born wavefunction */}
                    {activeGuideTab === 'born' && (
                      <div className="flex flex-col gap-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-900 pb-2">
                          <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
                            <span>Born Rule of Probability Density</span>
                          </h4>
                          <code className="text-[11px] font-mono text-cyan-300 bg-slate-900 px-2.5 py-0.5 rounded-md border border-slate-800">
                            P(x) = |Ψ(x)|² dx
                          </code>
                        </div>
                        <p className="text-xs text-slate-300 font-sans leading-relaxed">
                          A quantum system resides in a complex-valued amplitude field <span className="text-cyan-400 font-mono">Ψ(x)</span>. When we invoke physical monitoring (measurement), the system instantly forces the wave packet to undergo state collapse. The probability of measuring a particle at a coordinate is proportional to the square of its amplitude.
                        </p>
                        
                        {/* LIVE INTERACTIVE SIMULATOR READOUT */}
                        <div className="mt-2 bg-slate-900/40 border border-slate-800/60 p-3 rounded-lg flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                          <div className="font-mono text-xs">
                            <span className="text-slate-500 block text-[10px] uppercase">State Superposition Profile</span>
                            <span className="text-cyan-400 font-bold font-mono">
                              Ψ(x) = 1/√2 [ |Excited₁⟩ + |Excited₂⟩ ]
                            </span>
                          </div>
                          
                          {/* Live calculation simulation stats */}
                          <div className="flex items-center gap-4 text-xs font-mono">
                            <div className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg">
                              <span className="text-slate-500 block text-[9px] uppercase">Peak Amplitude</span>
                              <span className="text-teal-400 font-bold font-mono">0.707 V/m</span>
                            </div>
                            <div className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg">
                              <span className="text-slate-500 block text-[9px] uppercase">Born Density</span>
                              <span className="text-pink-400 font-bold font-mono">50.0% Max</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* tab 2: Heisenberg Uncertainty Limits */}
                    {activeGuideTab === 'heisenberg' && (
                      <div className="flex flex-col gap-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-900 pb-2">
                          <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                            <Activity className="w-4 h-4 text-purple-400 animate-pulse" />
                            <span>Heisenberg Principle Realtime Matrix</span>
                          </h4>
                          <code className="text-[11px] font-mono text-purple-300 bg-slate-900 px-2.5 py-0.5 rounded-md border border-slate-800">
                            Δx · Δp ≥ ℏ / 2
                          </code>
                        </div>
                        <p className="text-xs text-slate-300 font-sans leading-relaxed">
                          We cannot determine both position (<span className="text-cyan-400 font-mono">x</span>) and linear momentum (<span className="text-purple-400 font-mono">p</span>) simultaneously with absolute certainty. As we constrain spatial boundary width to localize the particle, momentum energy skyrockets and creates unstable speed fluctuations.
                        </p>
                        
                        {/* LIVE CALCULATION LINKED TO SLIDERS */}
                        <div className="mt-2 bg-slate-900/40 border border-slate-800/60 p-3 rounded-lg grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="font-mono text-xs">
                            <span className="text-slate-500 text-[10px] block uppercase">Live Δx Width</span>
                            <span className="text-cyan-400 font-bold">
                              {config.uncertaintyScale.toFixed(3)} nm
                            </span>
                          </div>
                          <div className="font-mono text-xs">
                            <span className="text-slate-500 text-[10px] block uppercase">Calculated Min Δp</span>
                            <span className="text-purple-400 font-bold">
                              {(0.527 / config.uncertaintyScale).toFixed(3)} eV·s/m
                            </span>
                          </div>
                          <div className="font-mono text-xs">
                            <span className="text-slate-500 text-[10px] block uppercase">Product (Live)</span>
                            <span className="font-bold text-emerald-400">
                              {(config.uncertaintyScale * (0.527 / config.uncertaintyScale)).toFixed(3)} ℏ
                            </span>
                          </div>
                          <div className="font-mono text-xs">
                            <span className="text-slate-500 text-[10px] block uppercase">Inequality</span>
                            <span className="text-amber-400 font-bold flex items-center gap-1">
                              <span>Verified ✓</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* tab 3: EPR Entanglement */}
                    {activeGuideTab === 'entangle' && (
                      <div className="flex flex-col gap-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-900 pb-2">
                          <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                            <GitCommit className="w-4 h-4 text-pink-400 animate-pulse" />
                            <span>EPR Non-locality / Bell Link</span>
                          </h4>
                          <code className="text-[11px] font-mono text-pink-300 bg-slate-900 px-2.5 py-0.5 rounded-md border border-slate-800">
                            |Ψ_Bell⟩ = 1/√2 (|↑↓⟩ - |↓↑⟩)
                          </code>
                        </div>
                        <p className="text-xs text-slate-300 font-sans leading-relaxed">
                          Entangled pairs share a single non-local state wavefunction. A measurement action on Alice (particle 1) collapses her spin, resolving it as either Spin Up or Spin Down. In that identical Planck time interval, Bob (particle 2) collapses instantaneously to the inverse spin, no matter how far away they are in space.
                        </p>
                        
                        {/* EPR LIVE EXPERIMENT */}
                        <div className="mt-2 bg-slate-900/40 border border-slate-800/60 p-3 rounded-lg flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 font-mono text-xs">
                          <div>
                            <span className="text-slate-500 text-[10px] block uppercase">Quantum Spin Space-Time Channel</span>
                            <span className="text-pink-400 font-bold font-mono">CH-80: Solid state entanglement link</span>
                          </div>
                          
                          <div className="flex gap-4 items-center">
                            <div className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-2">
                              <span className="text-slate-500 text-[9px] uppercase">ALICE SPIN:</span>
                              <span className="text-cyan-300 font-bold">1/2 ↑ (Up)</span>
                            </div>
                            <div className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-2">
                              <span className="text-slate-500 text-[9px] uppercase">BOB SPIN:</span>
                              <span className="text-pink-300 font-bold">-1/2 ↓ (Down)</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* tab 4: Barrier Tunneling */}
                    {activeGuideTab === 'tunnel' && (
                      <div className="flex flex-col gap-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-900 pb-2">
                          <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                            <ArrowRightLeft className="w-4 h-4 text-emerald-400 animate-pulse" />
                            <span>Tunneling Wave Transmission Dynamics</span>
                          </h4>
                          <code className="text-[11px] font-mono text-emerald-300 bg-slate-900 px-2.5 py-0.5 rounded-md border border-slate-800">
                            T ≈ e^(-2 w √[2m(V₀ - E)/ℏ²])
                          </code>
                        </div>
                        <p className="text-xs text-slate-300 font-sans leading-relaxed">
                          When a quantum particle meets a mechanical potential density wall higher than its kinetic energy, classical equations predict continuous complete bouncing. But quantum physics allows the wavefunction to leak inside as an exponential decay path. If the wall is narrow, the wave can pass directly through!
                        </p>
                        
                        {/* LIVE FORMULA CALCULATION OF TRANSMISSION PROBABILITY */}
                        {(() => {
                          const V0 = config.tunnelingBarrierEnergy;
                          const width = config.tunnelingWavePacketWidth;
                          const kappa = Math.sqrt(Math.max(0.1, V0 - 2.5));
                          const T_val = Math.min(99.9, Math.max(0.1, 100 * Math.exp(-0.35 * width * kappa)));
                          return (
                            <div className="mt-2 bg-slate-900/40 border border-slate-800/60 p-3 rounded-lg grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs">
                              <div>
                                <span className="text-slate-500 text-[10px] block uppercase">Barrier Density (V₀)</span>
                                <span className="text-amber-400 font-bold">{V0.toFixed(2)} eV</span>
                              </div>
                              <div>
                                <span className="text-slate-500 text-[10px] block uppercase">Wall Width (w)</span>
                                <span className="text-cyan-400 font-bold">{width.toFixed(2)} nm</span>
                              </div>
                              <div>
                                <span className="text-slate-500 text-[10px] block uppercase">Transmission Rate (T)</span>
                                <span className="text-emerald-400 font-bold">{T_val.toFixed(1)}%</span>
                              </div>
                              <div>
                                <span className="text-slate-500 text-[10px] block uppercase">Reflection Rate (R)</span>
                                <span className="text-indigo-400 font-bold">{(100 - T_val).toFixed(1)}%</span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {/* tab 5: Spin Precession */}
                    {activeGuideTab === 'spin' && (
                      <div className="flex flex-col gap-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-900 pb-2">
                          <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                            <Waves className="w-4 h-4 text-indigo-400 animate-pulse" />
                            <span>Spin & Magnetic Larmor Precession</span>
                          </h4>
                          <code className="text-[11px] font-mono text-indigo-300 bg-slate-900 px-2.5 py-0.5 rounded-md border border-slate-800">
                            Ω = -γ B₀
                          </code>
                        </div>
                        <p className="text-xs text-slate-300 font-sans leading-relaxed">
                          Applying an external magnetic uniform vector <span className="text-indigo-400 font-mono">B₀</span> to a particle with spin results in a torque. This torque forces the magnetic dipole to trace an orbit or cone in space around the field line, creating a continuous frequency called the Larmor precession frequency.
                        </p>
                        
                        {/* LIVE DYNAMICS INDICATORS */}
                        <div className="mt-2 bg-slate-900/40 border border-slate-800/60 p-3 rounded-lg flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 font-mono text-xs">
                          <div>
                            <span className="text-slate-500 text-[10px] block">External Field Intensity (B₀)</span>
                            <span className="text-amber-400 font-bold font-mono">
                              {(config.speed * 2.5).toFixed(2)} Tesla (linked to Speed Coefficient)
                            </span>
                          </div>
                          
                          <div className="flex gap-4 items-center">
                            <div className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg">
                              <span className="text-slate-500 text-[9px] block">LARMOR FREQ (Ω)</span>
                              <span className="text-indigo-300 font-bold font-mono">{(config.speed * 0.398).toFixed(3)} GHz</span>
                            </div>
                            <div className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg">
                              <span className="text-slate-500 text-[9px] block font-mono">GYROMAGNETIC RATIO</span>
                              <span className="text-pink-300 font-bold font-mono">1.59e-1 γ</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Explanatory helper status footer */}
                    <div className="mt-4 pt-3 border-t border-slate-900 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Interactive guide parameters synchronize instantly with the slider controls below.</span>
                      </span>
                      <span className="text-purple-400 font-bold uppercase hover:underline cursor-pointer" onClick={() => setActiveGuideTab((prev) => prev === 'born' ? 'heisenberg' : prev === 'heisenberg' ? 'entangle' : prev === 'entangle' ? 'tunnel' : prev === 'tunnel' ? 'spin' : 'born')}>
                        Next Core Concept →
                      </span>
                    </div>

                  </div>

                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* 2. CHOOSE SIMULATOR CONCEPTS TAB-BAR */}
      <section id="simulator-tabs" className="max-w-7xl w-full mx-auto px-4 mt-6">
        <div className="bg-slate-900/40 border border-slate-800/80 p-1.5 rounded-2xl flex flex-wrap gap-1">
          
          <button
            id="tab-wavefunction"
            onClick={() => handleTabChange('wavefunction')}
            className={`flex-1 min-w-[140px] flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl text-xs font-mono font-bold tracking-wide transition-all cursor-pointer ${
              systemType === 'wavefunction'
                ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 shadow-indigo-950/20 shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30 border border-transparent'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>WAVEFUNCTION ψ</span>
          </button>

          <button
            id="tab-superposition"
            onClick={() => handleTabChange('superposition')}
            className={`flex-1 min-w-[140px] flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl text-xs font-mono font-bold tracking-wide transition-all cursor-pointer ${
              systemType === 'superposition'
                ? 'bg-purple-500/10 text-purple-300 border border-purple-500/30 shadow-indigo-950/20 shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30 border border-transparent'
            }`}
          >
            <Shuffle className="w-4 h-4" />
            <span>SUPERPOSITION</span>
          </button>

          <button
            id="tab-entanglement"
            onClick={() => handleTabChange('entanglement')}
            className={`flex-1 min-w-[140px] flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl text-xs font-mono font-bold tracking-wide transition-all cursor-pointer ${
              systemType === 'entanglement'
                ? 'bg-pink-500/10 text-pink-300 border border-pink-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30 border border-transparent'
            }`}
          >
            <GitCommit className="w-4 h-4" />
            <span>ENTANGLEMENT LINK</span>
          </button>

          <button
            id="tab-tunneling"
            onClick={() => handleTabChange('tunneling')}
            className={`flex-1 min-w-[140px] flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl text-xs font-mono font-bold tracking-wide transition-all cursor-pointer ${
              systemType === 'tunneling'
                ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30 border border-transparent'
            }`}
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>TUNNELING (BARRIER)</span>
          </button>

          <button
            id="tab-spin"
            onClick={() => handleTabChange('spin')}
            className={`flex-1 min-w-[140px] flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl text-xs font-mono font-bold tracking-wide transition-all cursor-pointer ${
              systemType === 'spin'
                ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30 border border-transparent'
            }`}
          >
            <Waves className="w-4 h-4" />
            <span>SPIN PRECESSION</span>
          </button>

        </div>
      </section>

      {/* 3. CORE TWO-COLUMN MAIN WORKSPACE */}
      <main className="max-w-7xl w-full mx-auto px-4 mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 pb-16">
        
        {/* Left Column (Canvas & Wave theory text) - span 2 */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Main 3D WebGL simulator canvas view */}
          <div className="flex-1 bg-slate-900/20 border border-slate-900 rounded-3xl p-1 relative min-h-[550px]">
            <QuantumSimulator
              systemType={systemType}
              config={config}
              setConfig={setConfig}
              activeChallengeId={activeChallengeId}
              onChallengeProgress={handleChallengeProgress}
              onAddEvent={addEvent}
            />
          </div>

          {/* Educational Concept Guide & Equations Info box */}
          <div id="theory-info-box" className="p-5 bg-gradient-to-br from-slate-900/60 to-slate-950/60 border border-slate-900 rounded-2xl backdrop-blur-md relative overflow-hidden">
            
            {/* Ambient cybernetic line detail */}
            <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500" />

            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] uppercase font-mono tracking-widest text-indigo-400 font-bold block">
                  PHYSICS THEORETICAL BASIS
                </span>
                <h2 className="text-base font-bold text-slate-100 font-sans tracking-tight">
                  {conceptDetails[systemType].title}
                </h2>
                <p className="text-xs text-slate-400 font-sans leading-relaxed mt-1">
                  {conceptDetails[systemType].text}
                </p>
              </div>

              {/* Holographic formula overlay */}
              <div className="shrink-0 bg-slate-950 border border-slate-800/80 px-4 py-3 rounded-xl flex flex-col gap-1 text-center self-start md:self-auto min-w-[200px] shadow-sm">
                <span className="text-[9px] font-mono text-slate-500 uppercase">Schrödinger Hamiltonian</span>
                <code className="text-xs text-indigo-300 font-mono font-bold tracking-tight">
                  {conceptDetails[systemType].formula}
                </code>
              </div>
            </div>

          </div>

          {/* Real-time Quantum Interaction Event Log */}
          <EventLogPanel events={events} onClear={() => setEvents([])} />

        </div>

        {/* Right Column (Parameters & active Challenge controller) */}
        <div className="flex flex-col gap-6">
          
          {/* Parameter Tuning module */}
          <div className="flex-1">
            <ParameterPanel
              systemType={systemType}
              config={config}
              setConfig={setConfig}
            />
          </div>

          {/* Quantum Labs Challenge center */}
          <div className="flex-1">
            <ChallengeCenter
              activeChallengeId={activeChallengeId}
              setActiveChallengeId={setActiveChallengeId}
              systemType={systemType}
              setSystemType={setSystemType}
              currentScore={currentScore}
              currentFeedback={currentFeedback}
              isSolved={isSolved}
              onResetChallenge={resetChallengeStates}
            />
          </div>

        </div>

      </main>

      {/* 3. VISUAL FOOTER WITH AUTHORSHIP */}
      <footer id="app-footer" className="border-t border-slate-900 bg-slate-950/40 py-5 mt-auto text-xs font-mono text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Quima Quantum Simulator © 2026</span>
          </div>
          <p className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <span>Designed & Engineered by</span>
            <strong className="text-cyan-400 font-sans font-bold tracking-wide hover:text-cyan-300 transition-colors uppercase">Emmanuella Adams</strong>
          </p>
        </div>
      </footer>

      {/* 4. HIGH CONTRAST CELEBRATION QUEST MODAL */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            id="celebration-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-lg"
          >
            <motion.div
              id="celebration-modal"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="max-w-md w-full bg-slate-900 border border-indigo-500/50 p-6 rounded-3xl flex flex-col items-center gap-4 text-center shadow-2xl relative overflow-hidden"
            >
              {/* Particle glow ring background */}
              <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 to-transparent pointer-events-none" />

              {/* Achievement Badge Icon */}
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-400 flex items-center justify-center mb-1 shadow-lg shadow-emerald-500/20 animate-bounce">
                <Trophy className="w-8 h-8 text-emerald-400" />
              </div>

              <div>
                <span className="text-[9px] font-mono text-emerald-400 uppercase tracking-widest font-bold block mb-1">
                  Theory Fully Mastered
                </span>
                <h3 className="text-lg font-bold text-slate-100 font-sans tracking-tight">
                  Quantum Coherence Aligned!
                </h3>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed font-sans px-4">
                You successfully synchronized the parameters and completed the objective with standard accuracy! Your understanding of <strong className="text-indigo-300 font-mono text-[11px] uppercase">{systemType}</strong> mechanics is verified.
              </p>

              <div id="quest-achievement" className="rounded-2xl border border-slate-800 bg-slate-950/85 w-full py-3 px-4 flex items-center justify-between font-mono text-xs">
                <span className="text-slate-400">Score Achieved:</span>
                <span className="text-emerald-400 font-bold">{currentScore.toFixed(0)}% Accuracy</span>
              </div>

              <div className="flex gap-2.5 w-full mt-2">
                <button
                  id="sandbox-continue-btn"
                  onClick={() => setShowCelebration(false)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-mono font-semibold bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 transition-colors cursor-pointer"
                >
                  Continue Sandbox
                </button>
                <button
                  id="try-next-quest-btn"
                  onClick={() => {
                    setShowCelebration(false);
                    // Cycle next challenge or clear
                    setActiveChallengeId(null);
                    resetChallengeStates();
                  }}
                  className="flex-1 py-2.5 rounded-xl text-xs font-mono font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer"
                >
                  Other Quests
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
