const fs = require('fs');
let code = fs.readFileSync('src/components/QuantumSimulator.tsx', 'utf8');

// Replace the wave-measure-btn block
const buttonRegex = /\{\s*systemType === 'wavefunction' && \([\s\S]*?<\/button>\s*\)\}/;
const newButton = `
        {/* Contextual Action Button */}
        {systemType === 'wavefunction' && (
          <button
            id="wave-measure-btn"
            onClick={triggerManualCollapse}
            className={\`px-4 py-1 rounded-lg text-xs font-mono tracking-tight font-medium cursor-pointer transition-all \${
              config.isCollapsed
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-900'
                : config.isCollapsing
                ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40 animate-pulse'
                : 'bg-indigo-950/80 text-cyan-200 border border-cyan-500/40 hover:bg-sky-950'
            }\`}
          >
            {config.isCollapsed ? '✦ EXCITE STATE (RESET)' : config.isCollapsing ? '⚡ COLLAPSING ψ...' : '⚡ MEASURE SYSTEM'}
          </button>
        )}
        {systemType === 'spin' && activeChallengeId === 'entanglement-sync' && (
          <button
            id="spin-pulse-btn"
            onClick={() => {
              const alignedVal = Math.abs(Math.sin(accumTimeRef.current * 3.0));
              if (alignedVal < 0.15) {
                onChallengeProgressRef.current(95, 'EPR Spin state synchronizing inside transverse magnetic window!');
              } else {
                onChallengeProgressRef.current(0, 'Missed alignment window! Wait for the vectors to match exactly.');
              }
            }}
            className="px-4 py-1 rounded-lg text-xs font-mono tracking-tight font-medium cursor-pointer transition-all bg-pink-950/80 text-pink-300 border border-pink-500/40 hover:bg-pink-900"
          >
            🌀 TRIGGER SPIN PULSE
          </button>
        )}
`;
code = code.replace(buttonRegex, newButton);

// Remove the auto-check for spin
const autoCheckSpinRegex = /\/\/ Challenge check: Spin synchronization puzzle[\s\S]*?if \(alignedVal < 0\.15\) \{[\s\S]*?onChallengeProgressRef\.current\(95, 'EPR Spin state synchronizing inside transverse magnetic window!'\);[\s\S]*?\}[\s\S]*?\}/;
code = code.replace(autoCheckSpinRegex, "// Spin sync challenge requires manual button trigger now");

fs.writeFileSync('src/components/QuantumSimulator.tsx', code);
