import { Dispatch, SetStateAction } from 'react';
import { QuantumSystemConfig, QuantumSystemType } from '../types';
import { Eye, EyeOff, Sliders, Zap, Anchor, ShieldAlert, ArrowUpRight } from 'lucide-react';

interface ParameterPanelProps {
  systemType: QuantumSystemType;
  config: QuantumSystemConfig;
  setConfig: Dispatch<SetStateAction<QuantumSystemConfig>>;
}

export default function ParameterPanel({ systemType, config, setConfig }: ParameterPanelProps) {
  
  const toggleLabels = () => {
    setConfig((prev) => ({ ...prev, showLabels: !prev.showLabels }));
  };

  const toggleProbabilityDensity = () => {
    setConfig((prev) => ({ ...prev, showProbabilityDensity: !prev.showProbabilityDensity }));
  };

  const toggleSpinActive = () => {
    setConfig((prev) => ({ ...prev, spinActive: !prev.spinActive }));
  };

  return (
    <div id="parameter-panel-card" className="flex flex-col gap-4 font-sans h-full bg-slate-900/60 border border-slate-800 p-5 rounded-2xl backdrop-blur-md shadow-lg shadow-slate-950/20">
      
      {/* Header and Toggle buttons */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-indigo-400" />
          <h2 className="text-sm font-semibold tracking-wider font-sans uppercase text-slate-100">Quantum Modulations</h2>
        </div>
        
        {/* Visual helper toggles */}
        <div className="flex items-center gap-1.5">
          <button
            id="toggle-labels-btn"
            onClick={toggleLabels}
            className={`p-1.5 rounded-lg border cursor-pointer transition-colors ${
              config.showLabels
                ? 'bg-indigo-950/40 border-indigo-500/30 text-indigo-300'
                : 'bg-slate-950/30 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
            title="Toggle Formula Labels Overlay"
          >
            {config.showLabels ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Dynamic parameters depending on active systemType */}
      <div className="flex-1 flex flex-col justify-between gap-4">
        
        {/* Wavefunction parameters */}
        {systemType === 'wavefunction' && (
          <div id="wavefunction-params" className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-slate-300 flex items-center gap-1">
                  Spatial Uncertainty (Δx)
                </span>
                <span className="font-mono text-cyan-400 font-bold">{config.uncertaintyScale.toFixed(2)} fm</span>
              </div>
              <input
                id="uncertainty-slider"
                type="range"
                min="0.5"
                max="2.5"
                step="0.05"
                value={config.uncertaintyScale}
                disabled={config.isCollapsed || config.isCollapsing}
                onChange={(e) => setConfig((prev) => ({ ...prev, uncertaintyScale: parseFloat(e.target.value) }))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 disabled:opacity-40"
              />
              <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
                As Δx decreases, the probability wave becomes highly localized, simulating physical position constraints (Heisenberg Principle: Δx·Δp ≥ ℏ/2).
              </p>
            </div>

            <div className="border border-slate-800/80 bg-slate-950/40 p-3.5 rounded-xl flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold text-slate-200 font-sans">|ψ|² Density Liquid Grid</span>
                <span className="text-[10px] text-slate-500 font-mono">Show complex probability manifold</span>
              </div>
              <button
                id="toggle-density-grid-btn"
                onClick={toggleProbabilityDensity}
                className={`w-10 h-5 rounded-full p-0.5 cursor-pointer transition-colors duration-200 focus:outline-hidden ${
                  config.showProbabilityDensity ? 'bg-indigo-600' : 'bg-slate-800'
                } relative`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                  config.showProbabilityDensity ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>

            {config.isCollapsed && (
              <div id="unmeasure-cta-box" className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-950/20 text-[11px] leading-relaxed text-amber-300">
                <span className="font-bold flex items-center gap-1 font-mono uppercase mb-1">
                  <Zap className="w-3.5 h-3.5 text-amber-400" /> State Collapsed!
                </span>
                The wavefunction collapsed into a determinate coordinate. Trigger "EXCITE STATE" on the simulation bar to restore quantum superposition and float back to probability states.
              </div>
            )}
          </div>
        )}

        {/* Superposition parameters */}
        {systemType === 'superposition' && (
          <div id="superposition-params" className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-slate-300">Wave Amplitude (A)</span>
                <span className="font-mono text-pink-400 font-bold">{(config.superpositionAmplitude ?? 0.8).toFixed(1)} arb.</span>
              </div>
              <input
                id="superposition-amplitude-slider"
                type="range"
                min="0.2"
                max="2.0"
                step="0.1"
                value={config.superpositionAmplitude ?? 0.8}
                onChange={(e) => setConfig((prev) => ({ ...prev, superpositionAmplitude: parseFloat(e.target.value) }))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
              />
              <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
                Stretches or squashes the crests of your cyan wavefunction relative to the magenta target template envelope.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-slate-300">Harmonic Frequency (f)</span>
                <span className="font-mono text-purple-400 font-bold">{(config.superpositionFrequency ?? 1.5).toFixed(1)} GHz</span>
              </div>
              <input
                id="superposition-frequency-slider"
                type="range"
                min="0.5"
                max="4.0"
                step="0.1"
                value={config.superpositionFrequency ?? 1.5}
                onChange={(e) => setConfig((prev) => ({ ...prev, superpositionFrequency: parseFloat(e.target.value) }))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
                Adjusts the spatial frequency (wavelength density). Higher frequency packs the wave ripples closer together.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-slate-300">Hamiltonian Phase Shift (θ)</span>
                <span className="font-mono text-cyan-400 font-bold">{Math.round(config.superpositionPhase ?? 120)}°</span>
              </div>
              <input
                id="superposition-phase-slider"
                type="range"
                min="0"
                max="360"
                step="5"
                value={config.superpositionPhase ?? 120}
                onChange={(e) => setConfig((prev) => ({ ...prev, superpositionPhase: parseFloat(e.target.value) }))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
                Shifts the wavefunction horizontally along the physical axis to align peak crests directly over the target.
              </p>
            </div>
          </div>
        )}

        {/* Entanglement parameters */}
        {systemType === 'entanglement' && (
          <div id="entanglement-params" className="flex flex-col gap-4">
            <div className="p-3.5 bg-slate-950/30 border border-slate-800 rounded-xl flex flex-col gap-3">
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider font-semibold flex items-center gap-1">
                <Anchor className="w-3.5 h-3.5" /> EPR Bell Pair Correlation
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                Alice and Bob are correlated across the universe. ChangingAlice's coordinate states forces Bob to adapt instantly, proving nonlocal connection that does not decay over spatial distance.
              </p>
            </div>

            <div className="p-3.5 bg-indigo-950/20 border border-indigo-500/20 rounded-xl">
              <div className="flex items-center gap-2 mb-1.5">
                <ShieldAlert className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold text-slate-200">No-Communication Theorem</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Even though spin shifts sync instantly, information cannot travel faster than light because measurements are random. Quantum mechanics perfectly preserves Einstein's general relativity!
              </p>
            </div>
          </div>
        )}

        {/* Tunneling parameters */}
        {systemType === 'tunneling' && (
          <div id="tunneling-params" className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-slate-300">Potential Wall Energy (V₀)</span>
                <span className="font-mono text-pink-400 font-bold">{config.tunnelingBarrierEnergy.toFixed(1)} eV</span>
              </div>
              <input
                id="tunnel-barrier-slider"
                type="range"
                min="2.0"
                max="9.5"
                step="0.1"
                value={config.tunnelingBarrierEnergy}
                onChange={(e) => setConfig((prev) => ({ ...prev, tunnelingBarrierEnergy: parseFloat(e.target.value) }))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
              />
              <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
                Increasing the barrier potential narrows the wavefunction penetration, dropping exponential transmission (T) decaying inside forbidden zones.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-slate-300">Incident Momentum (Wave packet width)</span>
                <span className="font-mono text-cyan-400 font-bold">{(config.tunnelingWavePacketWidth * 1.5).toFixed(0)} MeV</span>
              </div>
              <input
                id="tunnel-width-slider"
                type="range"
                min="4"
                max="10"
                step="0.5"
                value={config.tunnelingWavePacketWidth}
                onChange={(e) => setConfig((prev) => ({ ...prev, tunnelingWavePacketWidth: parseFloat(e.target.value) }))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
                Higher incident momentum boosts particle kinetic energy (E), increasing probability of successfully tunneling through the solid energy wall.
              </p>
            </div>
          </div>
        )}

        {/* Spin parameters */}
        {systemType === 'spin' && (
          <div id="spin-params" className="flex flex-col gap-4 font-sans">
            <div className="border border-slate-800/80 bg-slate-950/40 p-3.5 rounded-xl flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold text-slate-200">Precession Motion</span>
                <span className="text-[10px] text-slate-500 font-mono">Simulate magnetic moment precessing</span>
              </div>
              <button
                id="toggle-spin-precession-btn"
                onClick={toggleSpinActive}
                className={`w-10 h-5 rounded-full p-0.5 cursor-pointer transition-colors duration-200 focus:outline-hidden ${
                  config.spinActive ? 'bg-cyan-500' : 'bg-slate-800'
                } relative`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                  config.spinActive ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>

            <div className="p-3.5 bg-slate-950/30 border border-slate-800 rounded-xl flex flex-col gap-2">
              <span className="text-[10px] font-mono text-cyan-400 flex items-center gap-1 uppercase tracking-wider font-semibold">
                Magnetic Larmor Precession
              </span>
              <p className="text-[10px] text-slate-400 leading-normal">
                When immersed in a static magnetic field, a quantum particle's spin axis precesses gracefully, sweeping out a cone path.
              </p>
            </div>
          </div>
        )}

        {/* Double slit parameters */}
        {systemType === 'doubleslit' && (
          <div id="doubleslit-params" className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-slate-300">Slit Separation (d)</span>
                <span className="font-mono text-amber-400 font-bold">{(config.doubleSlitSlitDistance ?? 2.2).toFixed(2)} nm</span>
              </div>
              <input
                id="doubleslit-distance-slider"
                type="range"
                min="1.0"
                max="3.5"
                step="0.1"
                value={config.doubleSlitSlitDistance ?? 2.2}
                onChange={(e) => setConfig((prev) => ({ ...prev, doubleSlitSlitDistance: parseFloat(e.target.value) }))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
              <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
                Controls the distance between the two slits. A larger separation crowds the interference stripes closer together on the screen.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-slate-300">De Broglie Wavelength (λ)</span>
                <span className="font-mono text-cyan-400 font-bold">{(config.doubleSlitWaveWavelength ?? 1.2).toFixed(2)} Å</span>
              </div>
              <input
                id="doubleslit-wavelength-slider"
                type="range"
                min="0.5"
                max="2.2"
                step="0.1"
                value={config.doubleSlitWaveWavelength ?? 1.2}
                onChange={(e) => setConfig((prev) => ({ ...prev, doubleSlitWaveWavelength: parseFloat(e.target.value) }))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
                Determines the wavelength of the particle wave. Longer wavelengths widen the spacing between adjacent fringes.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-slate-300">Individual Slit Width (w)</span>
                <span className="font-mono text-purple-400 font-bold">{(config.doubleSlitSlitWidth ?? 0.4).toFixed(2)} nm</span>
              </div>
              <input
                id="doubleslit-width-slider"
                type="range"
                min="0.15"
                max="0.75"
                step="0.05"
                value={config.doubleSlitSlitWidth ?? 0.4}
                onChange={(e) => setConfig((prev) => ({ ...prev, doubleSlitSlitWidth: parseFloat(e.target.value) }))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
                Determines individual slit width. Narrower slits diffuse the probability envelope wider across the phosphor screen.
              </p>
            </div>

            <div className="border border-indigo-500/20 bg-indigo-950/20 p-3 rounded-xl text-[10px] leading-relaxed text-slate-300 flex flex-col gap-1">
              <span className="font-bold flex items-center gap-1 font-mono uppercase text-indigo-400">
                💡 EXPERIMENT HELP GUIDE
              </span>
              <p className="text-[10px] text-slate-300">
                In this classic experiment, particles behave as <strong>probability waves</strong>. 
                As they pass through both slits, their wave crests interfere with each other, forming a <strong>fringe pattern</strong> of bright stripes on the screen.
              </p>
              <ul className="list-disc pl-3.5 space-y-0.5 text-slate-400">
                <li><strong className="text-amber-400">Slit Separation (d):</strong> Controls the distance between slits. Higher distance crowds stripes closer together.</li>
                <li><strong className="text-cyan-400">Wavelength (λ):</strong> Higher De Broglie wavelength stretches the spacing between adjacent stripes wider.</li>
                <li><strong>Quest Objective:</strong> Set <strong>Separation (d) to 2.20 nm</strong> and <strong>Wavelength (λ) to 1.20 Å</strong> to align active cyan stripes with the pink holographic guides!</li>
              </ul>
            </div>
          </div>
        )}

        {/* Global Scientific Citation footer */}
        <div id="parameter-citation" className="border-t border-slate-800/60 pt-3.5 flex items-center justify-between">
          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Calculations constant: Planck (ℏ)</span>
          <a
            href="https://wikipedia.org/wiki/Quantum_mechanics"
            target="_blank"
            rel="noreferrer"
            className="text-[9px] font-mono text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-0.5 cursor-pointer"
          >
            Wiki Docs <ArrowUpRight className="w-2.5 h-2.5" />
          </a>
        </div>

      </div>

    </div>
  );
}
