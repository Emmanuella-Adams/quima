import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { QuantumEvent } from '../types';
import { Terminal, ShieldAlert, CheckCircle2, Zap, Trash2, Cpu, Globe, Rocket, HelpCircle } from 'lucide-react';

interface EventLogPanelProps {
  events: QuantumEvent[];
  onClear: () => void;
}

export default function EventLogPanel({ events, onClear }: EventLogPanelProps) {
  const [secretUnlocked, setSecretUnlocked] = useState(false);

  // Returns appropriate icon matching event type
  const getEventIcon = (type: QuantumEvent['type']) => {
    switch (type) {
      case 'quantum':
        return <Cpu className="w-3.5 h-3.5 text-cyan-400" />;
      case 'warning':
        return <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />;
      case 'success':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />;
      default:
        return <Terminal className="w-3.5 h-3.5 text-indigo-400" />;
    }
  };

  // Color maps matching type
  const getTypeColor = (type: QuantumEvent['type']) => {
    switch (type) {
      case 'quantum':
        return 'text-cyan-300 border-cyan-500/10 bg-cyan-950/20';
      case 'warning':
        return 'text-amber-300 border-amber-500/10 bg-amber-950/20';
      case 'success':
        return 'text-emerald-300 border-emerald-500/10 bg-emerald-950/20';
      default:
        return 'text-slate-300 border-slate-800 bg-slate-900/40';
    }
  };

  return (
    <div id="quantum-event-log-panel" className="bg-gradient-to-br from-slate-900/60 to-slate-950/60 border border-slate-900 rounded-2xl backdrop-blur-md overflow-hidden flex flex-col h-[280px] relative transition-all duration-300">
      
      {/* Panel Header */}
      <div className="px-4 py-3 border-b border-slate-900 bg-slate-950/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Pulsing signal indicator */}
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${secretUnlocked ? 'bg-pink-400' : 'bg-cyan-400'}`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${secretUnlocked ? 'bg-pink-500' : 'bg-cyan-500'}`}></span>
          </span>
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-300 font-bold block">
            {secretUnlocked ? 'MIND-GRID PORTAL OVERRIDE v1.02' : 'Quantum Telemetry Stream'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Metric label showing count */}
          <span className="text-[9px] font-mono bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-md text-cyan-400">
            {events.length} logs
          </span>
          {events.length > 0 && (
            <button
              onClick={onClear}
              className="p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
              title="Clear event history"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Logs Scroll viewport */}
      <div className="flex-1 p-3 overflow-y-auto font-mono text-xs space-y-2 select-text scrollbar-thin scrollbar-thumb-indigo-950">
        
        {/* Unlocked holographic top card if secret activated */}
        <AnimatePresence>
          {secretUnlocked && (
            <motion.div
              initial={{ height: 0, opacity: 0, y: -10 }}
              animate={{ height: 'auto', opacity: 1, y: 0 }}
              exit={{ height: 0, opacity: 0, y: -10 }}
              className="border border-pink-500/30 bg-pink-950/20 rounded-xl p-3 flex flex-col gap-2 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-1">
                <span className="text-[8px] tracking-wider text-pink-400 bg-pink-900/40 px-1.5 py-0.5 rounded font-mono font-medium animate-pulse">SECRET PORTAL ONLINE</span>
              </div>
              <h5 className="text-[11px] font-bold text-pink-200 uppercase tracking-wider flex items-center gap-1.5">
                <Rocket className="w-3.5 h-3.5 text-pink-400" />
                <span>Creative Core & Uplinks Decoded</span>
              </h5>
              <p className="text-[10px] text-slate-300 font-sans leading-relaxed">
                Welcome to the hyper-dimensional terminal. Emmanuella Adams designs highly immersive virtual simulations translating complex scientific constants and neural research layouts.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                <a
                  href="https://emmanuellaadams.vercel.app/"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-2 rounded-lg bg-pink-950/40 hover:bg-pink-900/30 border border-pink-400/20 text-[10px] text-pink-300 font-medium transition-all group hover:scale-[1.01]"
                >
                  <span className="flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-pink-400 group-hover:rotate-12 transition-transform" />
                    <span>Holographic Portfolio</span>
                  </span>
                  <span className="text-pink-500">→</span>
                </a>

                <a
                  href="https://ladyanuelle.vercel.app/"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-2 rounded-lg bg-indigo-950/40 hover:bg-indigo-900/30 border border-indigo-400/20 text-[10px] text-indigo-300 font-medium transition-all group hover:scale-[1.01]"
                >
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-indigo-400 group-hover:animate-bounce" />
                    <span>Creative Lab Studio</span>
                  </span>
                  <span className="text-indigo-400">→</span>
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence initial={false}>
          {events.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              className="h-full flex flex-col items-center justify-center gap-1.5 text-center text-slate-500 my-auto"
            >
              <Zap className="w-6 h-6 text-indigo-500/50" />
              <p className="text-[11px]">System coherent. Waiting for quantum particle interactions...</p>
            </motion.div>
          ) : (
            events.map((evt) => (
              <motion.div
                key={evt.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.15 }}
                className={`p-2.5 rounded-lg border flex items-start gap-2.5 leading-relaxed text-[11px] ${getTypeColor(evt.type)}`}
              >
                {/* Visual Icon indicator */}
                <span className="mt-0.5 shrink-0">
                  {getEventIcon(evt.type)}
                </span>

                {/* Event timestamp */}
                <div className="flex-1">
                  <span className="text-slate-500 text-[10px] mr-2">
                    [{evt.timestamp}]
                  </span>
                  {/* Category marker */}
                  <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-400/80 mr-2 bg-indigo-950/45 px-1 rounded">
                    {evt.system}
                  </span>
                  {/* Actual text message */}
                  <span className="font-sans text-slate-200">
                    {evt.message}
                  </span>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Mini console details line */}
      <div className="px-3.5 py-1.5 border-t border-slate-900 bg-slate-950/30 text-[9px] font-mono text-slate-500 flex items-center justify-between select-none">
        <span className="hover:text-cyan-300 transition-colors cursor-help">Baud rate: Q-Sync 2.4 Tbps</span>
        <button
          onClick={() => setSecretUnlocked(!secretUnlocked)}
          className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition-all cursor-pointer font-bold ${
            secretUnlocked 
              ? 'bg-pink-500/20 text-pink-300 border border-pink-500/50 hover:bg-pink-500/30' 
              : 'text-slate-500 hover:text-cyan-400 hover:bg-slate-900/60'
          }`}
          title="Decrypt Secure Portals"
        >
          <span>{secretUnlocked ? 'Disable Override' : 'Secure Tunneling Channel ✓'}</span>
        </button>
      </div>

    </div>
  );
}
