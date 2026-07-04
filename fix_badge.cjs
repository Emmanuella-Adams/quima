const fs = require('fs');
let code = fs.readFileSync('src/components/QuantumSimulator.tsx', 'utf8');

const oldBadge = /<div id="instruction-badge"[\s\S]*?<\/div>/;
const newBadge = `
        {/* Instruction badge in-canvas */}
        <div id="instruction-badge" className="absolute top-4 left-4 font-mono text-[10px] text-slate-400 bg-slate-900/80 border border-slate-800/80 px-3 py-1.5 rounded-lg flex items-center gap-1.5 backdrop-blur-md max-w-sm">
          <Layers className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span className="leading-tight">
            {activeChallengeId === 'predict-collapse' && "QUEST: Predict highest probability zone and click canvas to measure!"}
            {activeChallengeId === 'stabilize-wave' && "QUEST: Adjust Uncertainty slider until waves perfectly overlap (resonate)."}
            {activeChallengeId === 'tunneling-barrier' && "QUEST: Adjust Momentum and Barrier Energy to maximize wave transmission!"}
            {activeChallengeId === 'entanglement-sync' && "QUEST: Wait for precession vectors to align, then click TRIGGER SPIN PULSE!"}
            {!activeChallengeId && "DRAG TO ROTATE • WHEEL TO ZOOM • CLICK WAVE TO MEASURE"}
          </span>
        </div>
`;
code = code.replace(oldBadge, newBadge);

fs.writeFileSync('src/components/QuantumSimulator.tsx', code);
