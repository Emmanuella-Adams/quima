import { Challenge, CHALLENGES, QuantumSystemType } from '../types';
import { Award, ShieldAlert, CheckCircle2, Play, Flame, HelpCircle } from 'lucide-react';

interface ChallengeCenterProps {
  activeChallengeId: string | null;
  setActiveChallengeId: (id: string | null) => void;
  systemType: QuantumSystemType;
  setSystemType: (type: QuantumSystemType) => void;
  currentScore: number;
  currentFeedback: string;
  isSolved: boolean;
  onResetChallenge: () => void;
}

export default function ChallengeCenter({
  activeChallengeId,
  setActiveChallengeId,
  systemType,
  setSystemType,
  currentScore,
  currentFeedback,
  isSolved,
  onResetChallenge,
}: ChallengeCenterProps) {
  
  const handleSelectChallenge = (challenge: Challenge) => {
    onResetChallenge();
    setActiveChallengeId(challenge.id);
    setSystemType(challenge.systemType);
  };

  const activeChallenge = CHALLENGES.find((c) => c.id === activeChallengeId);

  return (
    <div id="challenge-center-card" className="flex flex-col gap-4 font-sans h-full bg-slate-900/60 border border-slate-800 p-5 rounded-2xl backdrop-blur-md shadow-lg shadow-slate-950/20">
      
      {/* Header and badge */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-400" />
          <h2 className="text-sm font-semibold tracking-wider font-sans uppercase text-slate-100">Quantum Labs Sandbox</h2>
        </div>
        {activeChallengeId && (
          <span className="text-[10px] bg-indigo-950/80 border border-indigo-500/30 text-indigo-300 font-mono font-medium px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
            Active Quest
          </span>
        )}
      </div>

      {/* Challenge details is selected */}
      {activeChallenge ? (
        <div id="active-challenge-desc" className="flex flex-col gap-3">
          <div className="flex items-start justify-between">
            <h3 className="text-base font-bold font-sans text-cyan-300 tracking-tight">{activeChallenge.title}</h3>
            <button
              id="exit-quest-btn"
              onClick={() => setActiveChallengeId(null)}
              className="text-[11px] font-mono font-medium text-pink-400 hover:text-pink-300 cursor-pointer bg-pink-950/30 hover:bg-pink-950/60 border border-pink-500/20 px-2 py-0.5 rounded-md"
            >
              Exit Quest
            </button>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed font-sans">{activeChallenge.description}</p>
          
          <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-3 flex flex-col gap-2">
            <span className="text-[10px] font-mono text-purple-400 uppercase tracking-widest font-semibold flex items-center gap-1">
              <Flame className="w-3 h-3 text-amber-400" /> Master Objective
            </span>
            <p className="text-xs text-slate-200 font-medium font-sans">{activeChallenge.objective}</p>
          </div>

          {/* Current Challenge Progress */}
          <div className="p-3.5 rounded-xl border bg-slate-950/40 border-slate-800">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Resonance Match</span>
              <span className={`text-xs font-mono font-semibold ${isSolved ? 'text-emerald-400' : 'text-cyan-400'}`}>
                {currentScore > 0 ? `${currentScore.toFixed(0)}%` : '0%'}
              </span>
            </div>

            {/* Progress line */}
            <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 rounded-full ${isSolved ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-cyan-500 to-indigo-500'}`}
                style={{ width: `${Math.min(100, currentScore)}%` }}
              />
            </div>

            {/* Target condition */}
            <div className="mt-2 text-[10px] font-mono text-slate-400 flex justify-between items-center">
              <span>Goal: {activeChallenge.successCondition}</span>
              {isSolved ? (
                <span className="text-emerald-400 flex items-center gap-1 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> QUEST CLEARED
                </span>
              ) : (
                <span className="text-amber-400 animate-pulse flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" /> Aligning...
                </span>
              )}
            </div>
          </div>

          {/* live instructions / feedback console */}
          <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/80 font-mono text-[11px] leading-relaxed text-slate-300">
            <span className="text-[10px] text-amber-400 uppercase font-semibold block mb-1">🎮 Control Instructions</span>
            <span className="font-mono text-slate-300">{activeChallenge.instructions}</span>
            {currentFeedback && (
              <div className="mt-2 pt-2 border-t border-slate-800 text-teal-300 text-[10px] italic">
                Feedback: {currentFeedback}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Choose a challenge */
        <div id="inactive-challenges" className="flex flex-col gap-3">
          <p className="text-xs text-slate-400 font-sans leading-relaxed">
            Select an educational lab quest to test your intuition of quantum probability, wave superposition, spin synchronization, and tunneling.
          </p>

          <div className="flex flex-col gap-2">
            {CHALLENGES.map((challenge) => {
              const worksOnCurrSystem = systemType === challenge.systemType;
              return (
                <button
                  id={`quest-btn-${challenge.id}`}
                  key={challenge.id}
                  onClick={() => handleSelectChallenge(challenge)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    worksOnCurrSystem
                      ? 'bg-indigo-950/20 hover:bg-indigo-950/40 border-indigo-500/30 hover:border-indigo-500/60'
                      : 'bg-slate-950/40 hover:bg-slate-950/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold text-slate-200 font-sans">{challenge.title}</span>
                    <span className="text-[10px] font-mono text-slate-400">
                      Concept: <strong className="text-purple-400 uppercase text-[9px] font-mono font-bold">{challenge.systemType}</strong>
                    </span>
                  </div>
                  <Play className={`w-3.5 h-3.5 ${worksOnCurrSystem ? 'text-indigo-400' : 'text-slate-500'} shrink-0`} />
                </button>
              );
            })}
          </div>

          {/* Small Quantum Fun Fact widget */}
          <div className="mt-2 p-3 rounded-xl bg-slate-950/40 border border-slate-800 text-[11px] text-slate-400 leading-normal font-sans">
            <span id="did-you-know" className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-1 flex items-center gap-1 font-mono">
              <HelpCircle className="w-3.5 h-3.5 text-emerald-400" /> Quantum Fact: Superposition
            </span>
            Until a wavefunction probability is measured (subject to collapse), it occupies multiple physical coordinates and states simultaneously, behaving purely like a wave!
          </div>
        </div>
      )}
    </div>
  );
}
