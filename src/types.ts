export type QuantumSystemType = 'wavefunction' | 'superposition' | 'entanglement' | 'tunneling' | 'spin' | 'doubleslit';

export interface QuantumEvent {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'quantum';
  message: string;
  system: QuantumSystemType;
}

export interface QuantumSystemConfig {
  speed: number;
  showLabels: boolean;
  showProbabilityDensity: boolean;
  uncertaintyScale: number; // Δx
  isCollapsing: boolean;
  isCollapsed: boolean;
  collapsedPosition: [number, number, number] | null;
  spinActive: boolean;
  tunnelingBarrierEnergy: number;
  tunnelingWavePacketWidth: number;
  superpositionAmplitude: number;
  superpositionFrequency: number;
  superpositionPhase: number;
  doubleSlitSlitWidth: number;
  doubleSlitSlitDistance: number;
  doubleSlitWaveWavelength: number;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  objective: string;
  systemType: QuantumSystemType;
  instructions: string;
  successCondition: string;
}

export const CHALLENGES: Challenge[] = [
  {
    id: 'predict-collapse',
    title: 'Collapse Probability',
    description: 'Observe the probability density profile, wait for the wave to swell, then perform a Measurement to collapse the particle into a stable state. Can you capture it in the highest probability zone?',
    objective: 'Initiate a Measurement when a peak of |ψ|² aligns with the detector target.',
    systemType: 'wavefunction',
    instructions: 'Observe the probability density map. Press "MEASURE SYSTEM". Click when the glowing wave packet is aligned with the center of the detector indicator!',
    successCondition: 'Capture accuracy of >= 85%'
  },
  {
    id: 'stabilize-wave',
    title: 'Wavefunction Resonance',
    description: 'A chaotic, dephased quantum system is fluctuating. Align the quantum state by adjusting the Hamiltonian constants (Amplitude, Frequency, and Phase) to find a perfect harmonic resonance.',
    objective: 'Match the deforming wave cloud with the target holographic shell pattern.',
    systemType: 'superposition',
    instructions: 'Adjust the Fourier wave components. Match the neon cyan oscillating wave precisely with the static magenta target envelope.',
    successCondition: 'Overlap resonance match of >= 90%'
  },
  {
    id: 'tunneling-barrier',
    title: 'Quantum Tunnel Master',
    description: 'A particle wavepacket is approaching a solid, forbidden potential barrier. Standard physics demands it bounce off, but quantum mechanics allows tunneling! Adjust momentum and barrier thickness to maximize transmission probability.',
    objective: 'Achieve a tunneling probability of greater than 40% using the kinetic energy levels.',
    systemType: 'tunneling',
    instructions: 'Set the barrier height low enough, or wave energy high enough, to let the wave function penetrate. Increase quantum uncertainty to increase the tunneling amplitude!',
    successCondition: 'Tunneling probability >= 40%'
  },
  {
    id: 'entanglement-sync',
    title: 'EPR Spin Entanglement',
    description: 'Two entangled particles share an interconnected spin state. If you change the magnetic spin vector of Particle A, Particle B responds instantly. Synchronize their spins under a rotating exterior magnetic field.',
    objective: 'Align the spin precessions of Particle A and B with an external magnetic pulse.',
    systemType: 'spin',
    instructions: 'Wait for the precession vectors of the entangled pair to sweep past each other, then trigger spin pulse at the perfect synchronization point!',
    successCondition: 'Simultaneous spin alignment match.'
  },
  {
    id: 'doubleslit-diffraction',
    title: 'Double-Slit Diffraction',
    description: 'Adjust the de Broglie wavelength and slit distance to match the constructive interference zones of the detector screen. This creates a beautifully aligned fringes matrix!',
    objective: 'Align interference fringes with the holographic target spots (Separation ≈ 2.2, Wavelength ≈ 1.2).',
    systemType: 'doubleslit',
    instructions: 'Observe how wavelength and slit distance modulate fringe spacing. Match the active fringes to the target hologram, then click EMIT WAVEFRONT to register the lock!',
    successCondition: 'Diffraction alignment >= 90%'
  }
];
