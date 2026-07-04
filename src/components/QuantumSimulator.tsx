import { useEffect, useRef, useState, Dispatch, SetStateAction } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

import { QuantumSystemConfig, QuantumSystemType } from '../types';
import { createGlowTexture } from '../utils/canvasTextures';
import { Play, Pause, RefreshCw, Layers } from 'lucide-react';

interface QuantumSimulatorProps {
  systemType: QuantumSystemType;
  config: QuantumSystemConfig;
  setConfig: Dispatch<SetStateAction<QuantumSystemConfig>>;
  activeChallengeId: string | null;
  onChallengeProgress: (score: number, message: string) => void;
  onAddEvent: (type: 'info' | 'success' | 'warning' | 'quantum', message: string, systemOverride?: QuantumSystemType) => void;
}

export default function QuantumSimulator({
  systemType,
  config,
  setConfig,
  activeChallengeId,
  onChallengeProgress,
  onAddEvent,
}: QuantumSimulatorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Time / Run control
  const [isRunning, setIsRunning] = useState(true);
  const lastTimeRef = useRef<number>(0);
  const accumTimeRef = useRef<number>(0);

  // Store 3D projected coordinates for HTML labels
  const [labelCoords, setLabelCoords] = useState<{
    psi?: { x: number; y: number; val: string };
    psiSq?: { x: number; y: number; val: string };
    uncertainty?: { x: number; y: number; val: string };
    collapse?: { x: number; y: number; val: string };
    entangledA?: { x: number; y: number; val: string };
    entangledB?: { x: number; y: number; val: string };
    tunnelIn?: { x: number; y: number; val: string };
    tunnelOut?: { x: number; y: number; val: string };
  }>({});

  // Challenge game variables inside simulation
  const challengeStateRef = useRef({
    predictClicks: 0,
    predictHits: 0,
    prevTunnelingProb: 0,
    spinAlignTime: 0,
  });

  const onChallengeProgressRef = useRef(onChallengeProgress);
  useEffect(() => {
    onChallengeProgressRef.current = onChallengeProgress;
  }, [onChallengeProgress]);

  // Keep configs in ref so the animation loop always gets the freshest values
  const configRef = useRef(config);
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  // Keep systemType in ref
  const systemTypeRef = useRef(systemType);
  useEffect(() => {
    systemTypeRef.current = systemType;
  }, [systemType]);

  // Telemetry event logging hooks
  useEffect(() => {
    onAddEvent('info', isRunning ? 'Schrödinger time-evolution clock initiated. Coherence active.' : 'Time evolution paused. Wavefunction phase state frozen.');
  }, [isRunning]);

  useEffect(() => {
    if (config.isCollapsing) {
      onAddEvent('warning', 'Measurement trigger: Laser packet injected. Forcing local state collapse...');
    }
  }, [config.isCollapsing]);

  useEffect(() => {
    if (config.isCollapsed) {
      const posStr = config.collapsedPosition
        ? `[x: ${config.collapsedPosition[0].toFixed(2)}, y: ${config.collapsedPosition[1].toFixed(2)}, z: ${config.collapsedPosition[2].toFixed(2)}]`
        : '[0.00, 0.00, 0.00]';
      onAddEvent('success', `State collapsed! Particle wavefunction localized at coordinates ${posStr}`);
    } else {
      onAddEvent('quantum', 'System stimulated back to Ground Superposition. Coherence matrix 100%.');
    }
  }, [config.isCollapsed]);

  const prevUncertaintyRef = useRef(config.uncertaintyScale);
  useEffect(() => {
    if (Math.abs(config.uncertaintyScale - prevUncertaintyRef.current) > 0.05 && systemType === 'wavefunction') {
      const minMomentum = (0.527 / config.uncertaintyScale).toFixed(3);
      onAddEvent('info', `Spatial width Δx set to ${config.uncertaintyScale.toFixed(2)} nm. Minimum Momentum Uncertainty Δp limits configured to ≥ ${minMomentum} eV·s/m`);
      prevUncertaintyRef.current = config.uncertaintyScale;
    }
  }, [config.uncertaintyScale, systemType]);

  const prevBarrierRef = useRef(config.tunnelingBarrierEnergy);
  useEffect(() => {
    if (Math.abs(config.tunnelingBarrierEnergy - prevBarrierRef.current) > 0.1 && systemType === 'tunneling') {
      onAddEvent('warning', `Potential barriers altered: Potential wall density V₀ set to ${config.tunnelingBarrierEnergy.toFixed(2)} eV.`);
      prevBarrierRef.current = config.tunnelingBarrierEnergy;
    }
  }, [config.tunnelingBarrierEnergy, systemType]);

  const prevWidthRef = useRef(config.tunnelingWavePacketWidth);
  useEffect(() => {
    if (Math.abs(config.tunnelingWavePacketWidth - prevWidthRef.current) > 0.1 && systemType === 'tunneling') {
      onAddEvent('info', `Wave packet energy width adjusted to ${config.tunnelingWavePacketWidth.toFixed(2)} nm. Kinetic profile warped.`);
      prevWidthRef.current = config.tunnelingWavePacketWidth;
    }
  }, [config.tunnelingWavePacketWidth, systemType]);

  const prevSpinActiveRef = useRef(config.spinActive);
  useEffect(() => {
    if (config.spinActive !== prevSpinActiveRef.current && systemType === 'spin') {
      onAddEvent('quantum', config.spinActive ? 'Transverse magnetic field B₀ activated. Larmor spin precession cones online.' : 'External field set to zero. Spin orientations locked.');
      prevSpinActiveRef.current = config.spinActive;
    }
  }, [config.spinActive, systemType]);

  // Let's implement the complete Three.js engine hook
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;
    
    // Reset internal challenge states when switching modes or challenges
    challengeStateRef.current = {
      predictClicks: 0,
      predictHits: 0,
      prevTunnelingProb: 0,
      spinAlignTime: 0,
    };

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight || 550;

    // 1. Scene & Camera & Renderer Setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0515, 0.012);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 5, 12);

    
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const renderScene = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 1.5, 0.4, 0.85);
    bloomPass.threshold = 0.3;
    bloomPass.strength = 0.5;
    bloomPass.radius = 0.2;

    const composer = new EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);


    // 2. Camera Group for Custom Smooth Orbit controls
    const cameraGroup = new THREE.Group();
    cameraGroup.add(camera);
    scene.add(cameraGroup);

    let theta = 0; // angle around Y (yaw)
    let phi = 0.3; // angle of elevation (pitch)
    let radius = 13; // distance
    let targetTheta = theta;
    let targetPhi = phi;
    let targetRadius = radius;

    // Mouse drag handling for orbital viewing
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      targetTheta -= deltaX * 0.007;
      targetPhi = THREE.MathUtils.clamp(targetPhi - deltaY * 0.007, -1.2, 1.2);

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      targetRadius = THREE.MathUtils.clamp(targetRadius + e.deltaY * 0.01, 5, 25);
    };

    const canvas = canvasRef.current;
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('wheel', handleWheel, { passive: false });

    // 3. Lighting Setup
    const ambientLight = new THREE.AmbientLight(0x1a0f30, 1.5);
    scene.add(ambientLight);

    const pointLightCyan = new THREE.PointLight(0x00f0ff, 3, 20);
    pointLightCyan.position.set(-4, 3, 3);
    scene.add(pointLightCyan);

    const pointLightMagenta = new THREE.PointLight(0xff00ff, 3, 20);
    pointLightMagenta.position.set(4, -3, 3);
    scene.add(pointLightMagenta);

    // 4. Background Nebula/Starfield Particles
    const starCount = 400;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starSpeeds = new Float32Array(starCount);
    for (let i = 0; i < starCount; i++) {
      starPositions[i * 3] = (Math.random() - 0.5) * 40;
      starPositions[i * 3 + 1] = (Math.random() - 0.5) * 40;
      starPositions[i * 3 + 2] = (Math.random() - 0.5) * 40;
      starSpeeds[i] = 0.05 + Math.random() * 0.15;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0x885dff,
      size: 0.08,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
    });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // 5. Arena Grid Layout
    const gridHelper = new THREE.GridHelper(20, 20, 0x475569, 0x1e293b);
    gridHelper.position.y = -3;
    scene.add(gridHelper);

    // Pulsing coordinate axes lines
    const createAxisLine = (points: THREE.Vector3[], color: number) => {
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const mat = new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0.6,
        linewidth: 2,
      });
      return new THREE.Line(geo, mat);
    };

    const xAxis = createAxisLine([new THREE.Vector3(-10, -3, 0), new THREE.Vector3(10, -3, 0)], 0x00f0ff);
    const yAxis = createAxisLine([new THREE.Vector3(0, -3, 0), new THREE.Vector3(0, 5, 0)], 0xa855f7);
    const zAxis = createAxisLine([new THREE.Vector3(0, -3, -10), new THREE.Vector3(0, -3, 10)], 0xff00aa);
    scene.add(xAxis, yAxis, zAxis);

    // Immersive quantum boundary cage
    const cageGeo = new THREE.BoxGeometry(12, 6, 12);
    const cageEdges = new THREE.EdgesGeometry(cageGeo);
    const cageMat = new THREE.LineBasicMaterial({
      color: 0x4f46e5,
      transparent: true,
      opacity: 0.22,
    });
    const containmentCage = new THREE.LineSegments(cageEdges, cageMat);
    containmentCage.position.y = 0; // centered vertically around ground projection
    scene.add(containmentCage);

    // 6. OBJECT GROUPS FOR DIFFERENT SYSTEMS
    const wavefunctionGroup = new THREE.Group();
    const superpositionGroup = new THREE.Group();
    
    // 🐈 3D Tiny Cat Sprite at the edge of the box space
    const catCanvas = document.createElement('canvas');
    catCanvas.width = 128;
    catCanvas.height = 128;
    const catCtx = catCanvas.getContext('2d');
    if (catCtx) {
      catCtx.font = "80px sans-serif";
      catCtx.textAlign = "center";
      catCtx.textBaseline = "middle";
      catCtx.fillText("🐈‍⬛", 64, 64);
    }
    const catTex = new THREE.CanvasTexture(catCanvas);
    const catMat = new THREE.SpriteMaterial({ map: catTex, transparent: true });
    const catSprite = new THREE.Sprite(catMat);
    catSprite.scale.set(1.5, 1.5, 1);
    catSprite.position.set(-6, -3.5, 3);
    scene.add(catSprite);
    
    // Slight bobbing animation for the cat

    const entanglementGroup = new THREE.Group();
    const tunnelingGroup = new THREE.Group();
    const spinGroup = new THREE.Group();

    scene.add(wavefunctionGroup);
    scene.add(superpositionGroup);
    scene.add(entanglementGroup);
    scene.add(tunnelingGroup);
    scene.add(spinGroup);

    // 7. SYSTEM 1: Wavefunction ψ (Volumetric probability cloud & Particle core)
    // Procedural glowing particle texture
    const cyanGlowTex = createGlowTexture('#00f0ff');
    const magentaGlowTex = createGlowTexture('#ff00aa');
    const violetGlowTex = createGlowTexture('#a855f7');
    const whiteGlowTex = createGlowTexture('#ffffff');

    // Generating points for high density wave
    const waveParticlesCount = 1200;
    const wavePositions = new Float32Array(waveParticlesCount * 3);
    const waveColors = new Float32Array(waveParticlesCount * 3);
    const originalPhases = new Float32Array(waveParticlesCount);

    const baseRadius = 2.5;
    for (let i = 0; i < waveParticlesCount; i++) {
      // Gaussian distribute particles
      const thetaVal = Math.random() * Math.PI * 2;
      const phiVal = Math.acos(Math.random() * 2 - 1);
      const u = Math.random();
      // Radius distribution showing high density at center, fading out
      const r = baseRadius * (Math.pow(u, 1.5) + 0.1);

      const x = r * Math.sin(phiVal) * Math.cos(thetaVal);
      const y = r * Math.sin(phiVal) * Math.sin(thetaVal);
      const z = r * Math.cos(phiVal);

      wavePositions[i * 3] = x;
      wavePositions[i * 3 + 1] = y;
      wavePositions[i * 3 + 2] = z;

      originalPhases[i] = Math.random() * Math.PI * 2;

      // Color based on distance (phase metaphor)
      waveColors[i * 3] = 0.0; // R
      waveColors[i * 3 + 1] = 0.94; // G
      waveColors[i * 3 + 2] = 1.0; // B
    }

    const waveGeo = new THREE.BufferGeometry();
    waveGeo.setAttribute('position', new THREE.BufferAttribute(wavePositions, 3));
    waveGeo.setAttribute('color', new THREE.BufferAttribute(waveColors, 3));

    const waveMat = new THREE.PointsMaterial({
      size: 0.15,
      map: cyanGlowTex,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
      depthWrite: false,
    });

    const wavePoints = new THREE.Points(waveGeo, waveMat);
    wavefunctionGroup.add(wavePoints);

    // Probability Density Liquid Base
    const gridPlaneWidth = 6;
    const liquidGeo = new THREE.PlaneGeometry(gridPlaneWidth, gridPlaneWidth, 32, 32);
    liquidGeo.rotateX(-Math.PI / 2);
    liquidGeo.translate(0, -2.9, 0);

    const liquidMat = new THREE.MeshBasicMaterial({
      color: 0x00d2ff,
      wireframe: true,
      transparent: true,
      opacity: 0.2,
      blending: THREE.AdditiveBlending,
    });
    const liquidMesh = new THREE.Mesh(liquidGeo, liquidMat);
    wavefunctionGroup.add(liquidMesh);

    // Particle Core in center
    const coreGeo = new THREE.SphereGeometry(0.24, 16, 16);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.9,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    wavefunctionGroup.add(coreMesh);

    // Core Orbit sparks
    const sparkCount = 4;
    const orbitsGroup = new THREE.Group();
    wavefunctionGroup.add(orbitsGroup);
    const sparksArray: THREE.Mesh[] = [];
    const sparkOrbits: { axis: THREE.Vector3; speed: number; radius: number }[] = [];

    for (let i = 0; i < sparkCount; i++) {
      const spGeo = new THREE.SphereGeometry(0.06, 8, 8);
      const spMat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0x00f0ff : 0xff00ff,
        transparent: true,
        opacity: 0.8,
      });
      const spark = new THREE.Mesh(spGeo, spMat);
      orbitsGroup.add(spark);
      sparksArray.push(spark);

      // Random rotation axis
      sparkOrbits.push({
        axis: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize(),
        speed: 1.5 + Math.random() * 2,
        radius: 0.4 + Math.random() * 0.5,
      });
    }

    // Expanding collapse shockwave ring
    const ringGeo = new THREE.RingGeometry(0.01, 0.05, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });
    const shockwaveRing = new THREE.Mesh(ringGeo, ringMat);
    shockwaveRing.position.set(0, -2.9, 0);
    wavefunctionGroup.add(shockwaveRing);

    // Collapse target sphere representing uncertainty limit
    const uZoneGeo = new THREE.SphereGeometry(1.2, 16, 16);
    const uZoneMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      wireframe: true,
      transparent: true,
      opacity: 0.08,
    });
    const uncertaintyZone = new THREE.Mesh(uZoneGeo, uZoneMat);
    wavefunctionGroup.add(uncertaintyZone);

    // 8. SYSTEM 2: Superposition (Two overlapping state clouds & interference)
    const waveA_Count = 600;
    const waveB_Count = 600;

    const generateWavePositions = (count: number, colorBase: THREE.Color) => {
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(count * 3);
      const cls = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        const thetaVal = Math.random() * Math.PI * 2;
        const phiVal = Math.acos(Math.random() * 2 - 1);
        const r = 2.0 * (Math.pow(Math.random(), 1.2) + 0.15);

        pos[i * 3] = r * Math.sin(phiVal) * Math.cos(thetaVal);
        pos[i * 3 + 1] = r * Math.sin(phiVal) * Math.sin(thetaVal);
        pos[i * 3 + 2] = r * Math.cos(phiVal);

        cls[i * 3] = colorBase.r;
        cls[i * 3 + 1] = colorBase.g;
        cls[i * 3 + 2] = colorBase.b;
      }
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setAttribute('color', new THREE.BufferAttribute(cls, 3));
      return geo;
    };

    const psiAGeo = generateWavePositions(waveA_Count, new THREE.Color(0x00f0ff));
    const psiAMat = new THREE.PointsMaterial({
      size: 0.18,
      map: cyanGlowTex,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
      depthWrite: false,
    });
    const psiAPoints = new THREE.Points(psiAGeo, psiAMat);
    superpositionGroup.add(psiAPoints);

    const psiBGeo = generateWavePositions(waveB_Count, new THREE.Color(0xff00ff));
    const psiBMat = new THREE.PointsMaterial({
      size: 0.18,
      map: magentaGlowTex,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
      depthWrite: false,
    });
    const psiBPoints = new THREE.Points(psiBGeo, psiBMat);
    superpositionGroup.add(psiBPoints);

    // Visual indicators of interference
    const interferencePlaneMat = new THREE.MeshBasicMaterial({
      color: 0x9333ea,
      wireframe: true,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide,
    });
    const interferenceGrid = new THREE.Mesh(new THREE.PlaneGeometry(8, 8, 20, 20), interferencePlaneMat);
    interferenceGrid.rotateX(-Math.PI / 2.5);
    interferenceGrid.position.set(0, -1.0, 0);
    superpositionGroup.add(interferenceGrid);

    // 9. SYSTEM 3: Entanglement Link (synchronized particles with space-time path)
    const entParticleA = new THREE.Mesh(new THREE.SphereGeometry(0.4, 24, 24), new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.9,
    }));
    entParticleA.position.set(-4, 0, 0);
    entanglementGroup.add(entParticleA);

    const entParticleB = new THREE.Mesh(new THREE.SphereGeometry(0.4, 24, 24), new THREE.MeshBasicMaterial({
      color: 0xff00b0,
      transparent: true,
      opacity: 0.9,
    }));
    entParticleB.position.set(4, 0, 0);
    entanglementGroup.add(entParticleB);

    // Glowing halo maps for both
    const createHalo = (colorHex: number) => {
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.58, 32), new THREE.MeshBasicMaterial({
        color: colorHex,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.65,
        blending: THREE.AdditiveBlending,
      }));
      return ring;
    };
    const haloA = createHalo(0x00f0ff);
    const haloB = createHalo(0xff00b0);
    entParticleA.add(haloA);
    entParticleB.add(haloB);

    // Beautiful Entanglement connecting space-time curve
    const pathPointCount = 80;
    const curvePositions = new Float32Array(pathPointCount * 3);
    const entLinkGeo = new THREE.BufferGeometry();
    entLinkGeo.setAttribute('position', new THREE.BufferAttribute(curvePositions, 3));
    const entLinkMat = new THREE.LineBasicMaterial({
      color: 0xa855f7,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });
    const entLinkLine = new THREE.Line(entLinkGeo, entLinkMat);
    entanglementGroup.add(entLinkLine);

    // Traveling photons along entanglement link
    const linkPhotonsCount = 6;
    const photonMeshes: THREE.Mesh[] = [];
    for (let i = 0; i < linkPhotonsCount; i++) {
      const pmGeo = new THREE.SphereGeometry(0.08, 8, 8);
      const pmMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
      });
      const photon = new THREE.Mesh(pmGeo, pmMat);
      photon.position.set(-4, 0, 0);
      entanglementGroup.add(photon);
      photonMeshes.push(photon);
    }

    // 10. SYSTEM 4: Quantum Tunneling Effect
    // Potential barrier slab
    const barrierGeo = new THREE.BoxGeometry(0.35, 4.5, 4.5);
    const barrierMat = new THREE.MeshBasicMaterial({
      color: 0xff007f,
      transparent: true,
      opacity: 0.25,
      wireframe: true,
      blending: THREE.AdditiveBlending,
    });
    const barrierSlab = new THREE.Mesh(barrierGeo, barrierMat);
    barrierSlab.position.set(0, -0.5, 0);
    tunnelingGroup.add(barrierSlab);

    // Solid outline frame of wall
    const wallFrameGeo = new THREE.BoxGeometry(0.35, 4.5, 4.5);
    const wallFrameEdges = new THREE.EdgesGeometry(wallFrameGeo);
    const wallFrameLine = new THREE.LineSegments(wallFrameEdges, new THREE.LineBasicMaterial({ color: 0xff007f }));
    barrierSlab.add(wallFrameLine);

    // Wave packets approaching, decaying, and exiting
    const tunnelParticlesCount = 800;
    const tunnelParticlesGeo = new THREE.BufferGeometry();
    const tunnelPos = new Float32Array(tunnelParticlesCount * 3);
    const tunnelCol = new Float32Array(tunnelParticlesCount * 3);

    const cyanColor = new THREE.Color(0x00f0ff);
    const magentaColor = new THREE.Color(0xff007f);

    for (let i = 0; i < tunnelParticlesCount; i++) {
      // Setup across full width from -6 to 6
      tunnelPos[i * 3] = -6 + Math.random() * 12;
      tunnelPos[i * 3 + 1] = (Math.random() - 0.5) * 2;
      tunnelPos[i * 3 + 2] = (Math.random() - 0.5) * 2;

      // Initialize color
      tunnelCol[i * 3] = cyanColor.r;
      tunnelCol[i * 3 + 1] = cyanColor.g;
      tunnelCol[i * 3 + 2] = cyanColor.b;
    }

    tunnelParticlesGeo.setAttribute('position', new THREE.BufferAttribute(tunnelPos, 3));
    tunnelParticlesGeo.setAttribute('color', new THREE.BufferAttribute(tunnelCol, 3));

    const tunnelMat = new THREE.PointsMaterial({
      size: 0.12,
      map: whiteGlowTex,
      transparent: true,
      opacity: 0.75,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const tunnelPoints = new THREE.Points(tunnelParticlesGeo, tunnelMat);
    tunnelingGroup.add(tunnelPoints);

    // 11. SYSTEM 5: Spin Dynamics
    const spinSphereGeo = new THREE.SphereGeometry(1.2, 32, 32);
    const spinSphereMat = new THREE.MeshBasicMaterial({
      color: 0x9333ea,
      wireframe: true,
      transparent: true,
      opacity: 0.08,
    });
    const spinSphere = new THREE.Mesh(spinSphereGeo, spinSphereMat);
    spinGroup.add(spinSphere);

    // Solid inner core
    const spinCore = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 16), new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.8,
    }));
    spinGroup.add(spinCore);

    // Rotating arrow (pointer)
    const arrowDir = new THREE.Vector3(0, 1, 0);
    const arrowOrigin = new THREE.Vector3(0, 0, 0);
    const arrowLength = 2.4;
    const arrowColor = 0x00f0ff;
    const spinArrow = new THREE.ArrowHelper(arrowDir, arrowOrigin, arrowLength, arrowColor, 0.4, 0.2);
    spinGroup.add(spinArrow);

    // Opposite spin vector arrow (for demonstration / entangled buddy)
    const spinArrowOpposite = new THREE.ArrowHelper(new THREE.Vector3(0, -1, 0), arrowOrigin, arrowLength, 0xff00bb, 0.4, 0.2);
    spinArrowOpposite.position.set(0, 0, 0);
    spinGroup.add(spinArrowOpposite);

    // Precessing orbit line guide (top circle representing precession cone base)
    const topCirclePoints: THREE.Vector3[] = [];
    const radiusTop = 1.9 * Math.sin(Math.PI / 4); // arrowLength * sin(tilt)
    const heightTop = 1.9 * Math.cos(Math.PI / 4); // arrowLength * cos(tilt)
    for (let i = 0; i <= 32; i++) {
      const angle = (i / 32) * Math.PI * 2;
      topCirclePoints.push(new THREE.Vector3(radiusTop * Math.cos(angle), heightTop, radiusTop * Math.sin(angle)));
    }
    const precessionCircleGeo = new THREE.BufferGeometry().setFromPoints(topCirclePoints);
    const precessionCircleLine = new THREE.Line(precessionCircleGeo, new THREE.LineDashedMaterial({
      color: 0x22d3ee,
      dashSize: 0.08,
      gapSize: 0.08,
    }));
    precessionCircleLine.computeLineDistances();
    spinGroup.add(precessionCircleLine);

    // Precessing opposite orbit guide (bottom circle)
    const bottomCirclePoints: THREE.Vector3[] = [];
    for (let i = 0; i <= 32; i++) {
      const angle = (i / 32) * Math.PI * 2;
      bottomCirclePoints.push(new THREE.Vector3(-radiusTop * Math.cos(angle), -heightTop, -radiusTop * Math.sin(angle)));
    }
    const precessionOppositeCircleGeo = new THREE.BufferGeometry().setFromPoints(bottomCirclePoints);
    const precessionOppositeCircleLine = new THREE.Line(precessionOppositeCircleGeo, new THREE.LineDashedMaterial({
      color: 0xf43f5e,
      dashSize: 0.08,
      gapSize: 0.08,
    }));
    precessionOppositeCircleLine.computeLineDistances();
    spinGroup.add(precessionOppositeCircleLine);

    // Magnetosphere surrounding field-line rings
    const ringSegments = 40;
    const ringPoints: THREE.Vector3[] = [];
    for (let i = 0; i <= ringSegments; i++) {
      const pulseAngle = (i / ringSegments) * Math.PI * 2;
      ringPoints.push(new THREE.Vector3(Math.cos(pulseAngle) * 1.5, 0, Math.sin(pulseAngle) * 1.5));
    }
    const spinFieldGeo = new THREE.BufferGeometry().setFromPoints(ringPoints);
    const spinFieldRing1 = new THREE.Line(spinFieldGeo, new THREE.LineBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.4 }));
    const spinFieldRing2 = new THREE.Line(spinFieldGeo, new THREE.LineBasicMaterial({ color: 0xff00bb, transparent: true, opacity: 0.2 }));
    spinFieldRing1.rotateX(Math.PI / 4);
    spinFieldRing2.rotateX(-Math.PI / 4);
    spinGroup.add(spinFieldRing1, spinFieldRing2);

    // 12. RUNNING ANIMATION LOOP WITH TIME-EVOLUTION
    let animationId: number;
    let shockwaveProg = 0;
    let collapseLerp = 0;

    const animate = (timestamp: number) => {
      animationId = requestAnimationFrame(animate);

      // Orbital view smoothing variables
      theta += (targetTheta - theta) * 0.08;
      phi += (targetPhi - phi) * 0.08;
      radius += (targetRadius - radius) * 0.08;

      camera.position.x = radius * Math.sin(theta) * Math.cos(phi);
      camera.position.y = radius * Math.sin(phi);
      camera.position.z = radius * Math.cos(theta) * Math.cos(phi);
      camera.lookAt(0, 0, 0);

      // Frame progression
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const realDt = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      // Get configuration values safely
      const currConfig = configRef.current;
      const currentType = systemTypeRef.current;

      const deltaEvolution = isRunning ? realDt * currConfig.speed : 0;
      accumTimeRef.current += deltaEvolution;
      const time = accumTimeRef.current;

      // Slow drift rotation in stars/background for floating atmosphere
      stars.rotation.y += 0.015 * realDt;
      stars.rotation.x += 0.008 * realDt;

      // Enable/Disable correct groups visually
      wavefunctionGroup.visible = currentType === 'wavefunction';
      superpositionGroup.visible = currentType === 'superposition';
      entanglementGroup.visible = currentType === 'entanglement';
      tunnelingGroup.visible = currentType === 'tunneling';
      spinGroup.visible = currentType === 'spin';

      // ----------------- SYSTEM 1: Wavefunction Updates -----------------
      if (currentType === 'wavefunction') {
        const positions = waveGeo.attributes.position.array as Float32Array;
        const colors = waveGeo.attributes.color.array as Float32Array;

        // Wave collapse dynamics
        if (currConfig.isCollapsing) {
          collapseLerp = Math.min(collapseLerp + realDt * 1.5, 1);
          shockwaveProg += realDt * 3.5;

          // Expand shockwave
          shockwaveRing.scale.setScalar(shockwaveProg * 2.8);
          // @ts-ignore
          shockwaveRing.material.opacity = Math.max(0, 1 - shockwaveProg);

          if (collapseLerp >= 1) {
            setConfig((prev) => ({ ...prev, isCollapsing: false, isCollapsed: true }));
          }
        } else if (!currConfig.isCollapsed) {
          collapseLerp = Math.max(collapseLerp - realDt * 1.5, 0);
          shockwaveProg = 0;
          shockwaveRing.scale.setScalar(0.01);
          // @ts-ignore
          shockwaveRing.material.opacity = 0;
        }

        const uncertainty = currConfig.uncertaintyScale;
        uncertaintyZone.scale.setScalar(uncertainty);
        uncertaintyZone.visible = currConfig.showLabels;

        // Animate particles based on probability amplitude
        for (let i = 0; i < waveParticlesCount; i++) {
          const ix = i * 3;
          const iy = i * 3 + 1;
          const iz = i * 3 + 2;

          const baseU = originalPhases[i];
          // Simple quantum harmonic oscillator envelope: Gaussian packet
          const dist = Math.sqrt(
            positions[ix] * positions[ix] +
            positions[iy] * positions[iy] +
            positions[iz] * positions[iz]
          );

          // Standard jitter/oscillation corresponding to current phase time
          const oscillation = Math.sin(dist * 3 - time * 2.5 + baseU) * 0.12;

          // If fully measured collapsed: localize everything tightly to the collapse spot!
          if (currConfig.isCollapsed && currConfig.collapsedPosition) {
            const tx = currConfig.collapsedPosition[0] + (Math.random() - 0.5) * 0.1;
            const ty = currConfig.collapsedPosition[1] + (Math.random() - 0.5) * 0.1;
            const tz = currConfig.collapsedPosition[2] + (Math.random() - 0.5) * 0.1;

            positions[ix] += (tx - positions[ix]) * 0.12;
            positions[iy] += (ty - positions[iy]) * 0.12;
            positions[iz] += (tz - positions[iz]) * 0.12;

            // Highlight color
            colors[ix] = 1.0;
            colors[iy] = 0.9 + Math.sin(time * 5) * 0.1;
            colors[iz] = 0.4;
          } else {
            // Uncollapsed superposition density drift
            // Jitter increases when uncertainty increases (Heisenberg)
            const jitterScale = 0.015 * uncertainty;
            positions[ix] += (Math.random() - 0.5) * jitterScale + Math.cos(time + baseU) * 0.002;
            positions[iy] += (Math.random() - 0.5) * jitterScale + Math.sin(time * 1.2 + baseU) * 0.002;
            positions[iz] += (Math.random() - 0.5) * jitterScale + Math.cos(time * 0.8 + baseU) * 0.002;

            // Constrain outer radius limits
            const curDist = Math.sqrt(positions[ix]**2 + positions[iy]**2 + positions[iz]**2);
            if (curDist > baseRadius * 1.5) {
              positions[ix] *= 0.9;
              positions[iy] *= 0.9;
              positions[iz] *= 0.9;
            }

            // Probability amplitude maps to color phase G vs B
            const phaseColorVal = Math.sin(curDist * 1.8 - time + baseU);
            colors[ix] = Math.max(0, phaseColorVal * 0.4);
            colors[iy] = 0.7 + phaseColorVal * 0.3;
            colors[iz] = 1.0;
          }
        }
        waveGeo.attributes.position.needsUpdate = true;
        waveGeo.attributes.color.needsUpdate = true;

        // Core Jitter effect based on uncertainty limit
        if (currConfig.isCollapsed) {
          coreMesh.position.set(0, 0, 0);
          coreMesh.scale.setScalar(1.5 + Math.sin(time * 10) * 0.15);
        } else {
          // Micro motion jitter representing wave center probability uncertainty wave
          const jitterIntensity = 0.05 * uncertainty;
          coreMesh.position.set(
            Math.sin(time * 4) * jitterIntensity,
            Math.cos(time * 5.2) * jitterIntensity,
            Math.sin(time * 3.1) * jitterIntensity
          );
          coreMesh.scale.setScalar(0.7 + Math.sin(time * 3) * 0.1);
        }

        // Rotate core orbits sparks
        sparksArray.forEach((spark, index) => {
          const orbit = sparkOrbits[index];
          const currAngle = time * orbit.speed;
          // Calculate cross products to project onto offset axis planes
          const up = new THREE.Vector3(0, 1, 0);
          const u_vec = new THREE.Vector3().crossVectors(orbit.axis, up).normalize();
          if (u_vec.lengthSq() < 0.01) {
            u_vec.set(1, 0, 0);
          }
          const v_vec = new THREE.Vector3().crossVectors(orbit.axis, u_vec).normalize();

          const r = orbit.radius * (currConfig.isCollapsed ? 0.15 : 1);
          const x = r * Math.cos(currAngle);
          const y = r * Math.sin(currAngle);

          spark.position.copy(coreMesh.position)
            .addScaledVector(u_vec, x)
            .addScaledVector(v_vec, y);
        });

        // Deforming the Probability density map plane
        if (currConfig.showProbabilityDensity) {
          liquidMesh.visible = true;
          const posAttr = liquidGeo.attributes.position;
          for (let k = 0; k < posAttr.count; k++) {
            const x = posAttr.getX(k);
            const z = posAttr.getZ(k);
            const d = Math.sqrt(x * x + z * z);
            // Probability wave equation model (Gaussian envelope)
            // If collapsed, make a very high sharp spike at center!
            let heightVal = 0;
            if (currConfig.isCollapsed) {
              heightVal = 1.8 * Math.exp(-(d * d) / 0.15);
            } else {
              heightVal = 0.6 * Math.sin(d * 2 - time * 3.5) * Math.exp(-(d * d) / 6);
            }
            // Add grid offsets
            posAttr.setY(k, -2.9 + heightVal);
          }
          posAttr.needsUpdate = true;
        } else {
          liquidMesh.visible = false;
        }
      }

      // ----------------- SYSTEM 2: Superposition Updates -----------------
      if (currentType === 'superposition') {
        const posA = psiAGeo.attributes.position.array as Float32Array;
        const posB = psiBGeo.attributes.position.array as Float32Array;

        // Orbiting state envelopes
        const offsetDist = 1.2 * Math.sin(time * 1.5);

        for (let i = 0; i < waveA_Count; i++) {
          const ix = i * 3;
          // State A moves in harmonic ellipse
          posA[ix] += Math.sin(time * 0.8 + i) * 0.003;
          posA[ix + 1] += Math.cos(time * 0.9 + i) * 0.003;
          posA[ix + 2] += Math.sin(time * 1.1 + i) * 0.003;
        }
        for (let i = 0; i < waveB_Count; i++) {
          const ix = i * 3;
          // State B slides in opposite direction representing interference
          posB[ix] += Math.cos(time * 0.8 + i) * 0.003;
          posB[ix + 1] += Math.sin(time * 0.9 + i) * 0.003;
          posB[ix + 2] += Math.cos(time * 1.1 + i) * 0.003;
        }

        psiAGeo.attributes.position.needsUpdate = true;
        psiBGeo.attributes.position.needsUpdate = true;

        psiAPoints.position.x = -offsetDist * 0.5;
        psiBPoints.position.x = offsetDist * 0.5;

        // Challenge check: Stabilize resonance wave
        if (activeChallengeId === 'stabilize-wave') {
          // Evaluate if amplitude / speed parameters align
          // Ideal state is when the particles align (offset is tiny, or sync constant matches config speed target)
          const alignmentAcc = Math.max(0, 100 - Math.abs(offsetDist) * 80);
          if (alignmentAcc >= 90) {
            onChallengeProgressRef.current(alignmentAcc, `Quantum State resonance detected at ${alignmentAcc.toFixed(1)}% overlap!`);
          }
        }
      }

      // ----------------- SYSTEM 3: Entanglement Link Updates -----------------
      if (currentType === 'entanglement') {
        // Synchronized glow pulsations
        const pulse = 0.5 * Math.sin(time * 6) + 0.5;
        // @ts-ignore
        entParticleA.material.color.setHex(0x00f0ff);
        // @ts-ignore
        entParticleB.material.color.setHex(0xff00b0);

        haloA.scale.setScalar(1.2 + pulse * 0.3);
        haloB.scale.setScalar(1.2 + pulse * 0.3);

        haloA.rotation.z += 1.5 * realDt;
        haloB.rotation.z += 1.5 * realDt;

        // Calculate a wavy space-time bridge distortion
        const positions = entLinkGeo.attributes.position.array as Float32Array;
        const pA = entParticleA.position;
        const pB = entParticleB.position;

        for (let i = 0; i < pathPointCount; i++) {
          const t_param = i / (pathPointCount - 1);
          // Interpolate standard x
          const currX = THREE.MathUtils.lerp(pA.x, pB.x, t_param);
          // Intertwine spiral distortion representing wormhole / correlation path
          const spiralFactor = Math.sin(t_param * Math.PI * 6 - time * 8) * 0.25;
          const currY = Math.sin(t_param * Math.PI) * spiralFactor;
          const currZ = Math.cos(t_param * Math.PI) * spiralFactor;

          positions[i * 3] = currX;
          positions[i * 3 + 1] = currY;
          positions[i * 3 + 2] = currZ;
        }
        entLinkGeo.attributes.position.needsUpdate = true;

        // Animate traveling photons
        photonMeshes.forEach((photon, index) => {
          const indexOffset = (index / linkPhotonsCount);
          const phase = (time * 0.3 + indexOffset) % 1.0;
          // Interpolate photon positioning along the line path
          const photoX = THREE.MathUtils.lerp(pA.x, pB.x, phase);
          const waveHeight = Math.sin(phase * Math.PI * 6 - time * 8) * 0.25;
          photon.position.set(photoX, Math.sin(phase * Math.PI) * waveHeight, Math.cos(phase * Math.PI) * waveHeight);
          // Pulse scale
          photon.scale.setScalar(0.6 + Math.sin(time * 12 + index) * 0.2);
        });
      }

      // ----------------- SYSTEM 4: Quantum Tunneling Updates -----------------
      if (currentType === 'tunneling') {
        const positions = tunnelParticlesGeo.attributes.position.array as Float32Array;
        const colors = tunnelParticlesGeo.attributes.color.array as Float32Array;

        barrierSlab.scale.x = (currConfig.tunnelingBarrierEnergy / 10) * 1.5 + 0.5;
        // @ts-ignore
        barrierSlab.material.opacity = 0.15 + (currConfig.tunnelingBarrierEnergy / 10) * 0.3;

        // Calculate potential transmission coefficients
        // T ≈ e^(-2 * w * sqrt(2m(V - E)/hbar))
        const dEnergy = currConfig.tunnelingBarrierEnergy - (12 - currConfig.tunnelingWavePacketWidth);
        const transValue = dEnergy <= 0 ? 0.95 : Math.max(0.01, Math.exp(-0.35 * dEnergy));

        // Let's pass tunneling progress to gamification
        if (activeChallengeId === 'tunneling-barrier') {
          const scorePercent = transValue * 100;
          if (scorePercent >= 40) {
            onChallengeProgressRef.current(scorePercent, `Succeeded! Transmission rate through the Potential Wall matches ${scorePercent.toFixed(1)}%`);
          } else {
            onChallengeProgressRef.current(0, `Transmission currently blocked: ${scorePercent.toFixed(1)}%. Increase momentum, decrease barrier energy.`);
          }
        }

        // Move wave packet particles from left to right (-6 to 6)
        for (let i = 0; i < tunnelParticlesCount; i++) {
          const ix = i * 3;
          const iy = i * 3 + 1;
          const iz = i * 3 + 2;

          // Velocity is proportional to the packet width parameter
          const velocity = 2.2 + (currConfig.tunnelingWavePacketWidth * 0.15);
          positions[ix] += velocity * realDt;

          // Recycle particle at left bound
          if (positions[ix] > 6) {
            positions[ix] = -6;
            // random start y, z
            positions[iy] = (Math.random() - 0.5) * 1.5;
            positions[iz] = (Math.random() - 0.5) * 1.5;
          }

          const curX = positions[ix];

          // Wave behavior (sinusodial envelope)
          // inside barrier, amplitude decays exponentially
          let expDecay = 1.0;
          if (curX >= -0.15 && curX <= 0.15) {
            // Decays based on potential barrier height
            expDecay = Math.max(0.1, 1.0 - (currConfig.tunnelingBarrierEnergy / 10) * 0.9);
          } else if (curX > 0.15) {
            // Keep lower wave amplitude
            expDecay = transValue;
          }

          // Undulating wave pattern inside envelope shape
          const envelope = Math.exp(-(curX * curX) / 8); 
          positions[iy] += Math.sin(curX * 5 - time * 12 + i) * 0.008 * expDecay * envelope;
          positions[iz] += Math.cos(curX * 5 - time * 12 + i) * 0.008 * expDecay * envelope;

          // Coloring based on being inside or outside the wall
          if (curX >= -0.15 && curX <= 0.15) {
            // Highlight decaying wall phase
            colors[ix] = magentaColor.r;
            colors[iy] = magentaColor.g;
            colors[iz] = magentaColor.b;
          } else if (curX > 0.15) {
            // Transmitted wave (phase-shifted violet cyan blend)
            colors[ix] = 0.5;
            colors[iy] = 0.1;
            colors[iz] = 1.0;
          } else {
            // Incoming wave
            colors[ix] = cyanColor.r;
            colors[iy] = cyanColor.g;
            colors[iz] = cyanColor.b;
          }
        }
        tunnelParticlesGeo.attributes.position.needsUpdate = true;
        tunnelParticlesGeo.attributes.color.needsUpdate = true;
      }

      // ----------------- SYSTEM 5: Spin Precession Updates -----------------
      if (currentType === 'spin') {
        const precessionFrequency = 3.0;
        const tiltAngle = Math.PI / 4; // tilt axis
        
        let arrowVec = new THREE.Vector3(0, 1, 0);

        if (currConfig.spinActive) {
          // Precess around Z axis in sphere coordinate Space
          const precX = Math.sin(tiltAngle) * Math.cos(time * precessionFrequency);
          const precY = Math.cos(tiltAngle);
          const precZ = Math.sin(tiltAngle) * Math.sin(time * precessionFrequency);
          arrowVec.set(precX, precY, precZ).normalize();

          // Sync opposite vector representing paired orbital
          spinArrowOpposite.setDirection(new THREE.Vector3(-precX, -precY, -precZ));
          spinArrowOpposite.visible = true;
        } else {
          // Point strictly up
          arrowVec.set(0, 1, 0);
          spinArrowOpposite.visible = false;
        }

        spinArrow.setDirection(arrowVec);

        // Precess magnetic field lines around axis
        spinFieldRing1.rotation.y = time * 0.6;
        spinFieldRing2.rotation.y = -time * 0.6;

        // Spin sync challenge requires manual button trigger now
      }

      // 13. PROJECT 3D PLACES TO HTML COORDINATES FOR GLOWING LABELS
      const projectPoint = (vec: THREE.Vector3) => {
        const tempV = vec.clone();
        tempV.project(camera);
        const x = (tempV.x * 0.5 + 0.5) * width;
        const y = (-(tempV.y * 0.5) + 0.5) * height;
        return { x, y };
      };

      if (currConfig.showLabels) {
        if (currentType === 'wavefunction') {
          const psiP = projectPoint(coreMesh.position.clone().add(new THREE.Vector3(-1.2, 1, 0)));
          const psiSqP = projectPoint(coreMesh.position.clone().add(new THREE.Vector3(1.2, -1, 0)));
          const uncertP = projectPoint(coreMesh.position.clone().add(new THREE.Vector3(0, -1.8, 0)));
          
          setLabelCoords({
            psi: { ...psiP, val: 'ψ(x)' },
            psiSq: { ...psiSqP, val: '|ψ|²' },
            uncertainty: { ...uncertP, val: `Δx Δp ≥ ℏ/2` },
            collapse: currConfig.isCollapsed ? { ...projectPoint(coreMesh.position), val: 'MEASUREMENT (COLLAPSE)' } : undefined,
          });
        } else if (currentType === 'superposition') {
          const labelA = projectPoint(psiAPoints.position.clone().add(new THREE.Vector3(0, 1.2, 0)));
          const labelB = projectPoint(psiBPoints.position.clone().add(new THREE.Vector3(0, -1.2, 0)));
          setLabelCoords({
            psi: { ...labelA, val: '|ψ_A⟩' },
            psiSq: { ...labelB, val: '|ψ_B⟩' },
          });
        } else if (currentType === 'entanglement') {
          const pA_L = projectPoint(entParticleA.position.clone().add(new THREE.Vector3(0, 0.8, 0)));
          const pB_L = projectPoint(entParticleB.position.clone().add(new THREE.Vector3(0, 0.8, 0)));
          setLabelCoords({
            entangledA: { ...pA_L, val: 'Spin Alice' },
            entangledB: { ...pB_L, val: 'Spin Bob' },
          });
        } else if (currentType === 'tunneling') {
          const tIn = projectPoint(new THREE.Vector3(-3.5, 1.5, 0));
          const tOut = projectPoint(new THREE.Vector3(3.5, 1.5, 0));
          setLabelCoords({
            tunnelIn: { ...tIn, val: 'Incident Wave Packet' },
            tunnelOut: { ...tOut, val: 'Tunneling Transmitted' },
          });
        } else {
          setLabelCoords({});
        }
      } else {
        setLabelCoords({});
      }

      // Render updated frame
      
        // Animate the cat sprite
        if (catSprite) {
          catSprite.position.y = -3.5 + Math.sin(time * 2) * 0.1;
        }

      composer.render();
    };

    animationId = requestAnimationFrame(animate);

    // 14. IN-PROMPT PREDICTION TRIGGER (Capture Collapse Target game component)
    const handleCanvasClick = (e: MouseEvent) => {
      const currConfig = configRef.current;
      const currentType = systemTypeRef.current;

      if (currentType === 'wavefunction' && !currConfig.isCollapsed && !currConfig.isCollapsing) {
        // Find click coordinate
        const rect = renderer.domElement.getBoundingClientRect();
        const clientX = e.clientX - rect.left;
        const clientY = e.clientY - rect.top;

        // Try to trigger localization
        // Check if the wave oscillator is high/collapsed
        const amp = 0.5 * Math.sin(accumTimeRef.current * 3.5);
        const randomX = (Math.random() - 0.5) * currConfig.uncertaintyScale * 1.5;
        const randomY = (Math.random() - 0.5) * currConfig.uncertaintyScale * 1.5;
        const randomZ = (Math.random() - 0.5) * currConfig.uncertaintyScale * 1.5;

        // Play shockwave from click spot
        shockwaveRing.position.set(randomX, randomY, randomZ);

        setConfig((prev) => ({
          ...prev,
          isCollapsing: true,
          collapsedPosition: [randomX, randomY, randomZ],
        }));

        if (activeChallengeId === 'predict-collapse') {
          // Success is calculated as high if click is performed when waves swell is target (high density)
          const alignmentValue = Math.abs(amp);
          challengeStateRef.current.predictClicks += 1;
          const hitScore = Math.round(70 + alignmentValue * 30);
          
          if (hitScore >= 85) {
            challengeStateRef.current.predictHits += 1;
            onChallengeProgressRef.current(hitScore, `Target alignment accurate! Localized candidate inside wave packet with accuracy of ${hitScore}%`);
          } else {
            onChallengeProgressRef.current(0, `Missed peak probability zone (Current overlap: ${hitScore}%). Wait/watch wavefunction to swell!`);
          }
        }
      }
    };

    canvas.addEventListener('click', handleCanvasClick);

    // Handle container resize
    const handleResize = () => {
      if (!containerRef.current) return;
      const rWidth = containerRef.current.clientWidth;
      const rHeight = containerRef.current.clientHeight || 550;
      camera.aspect = rWidth / rHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(rWidth, rHeight);
    };

    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(containerRef.current);

    // CLEANUP ACTIONS
    return () => {
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
      canvas.removeEventListener('click', handleCanvasClick);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      // @ts-ignore
      canvas.removeEventListener('wheel', handleWheel);
      renderer.dispose();
      starGeo.dispose();
      starMat.dispose();
      waveGeo.dispose();
      waveMat.dispose();
      liquidGeo.dispose();
      liquidMat.dispose();
      coreGeo.dispose();
      coreMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      uZoneGeo.dispose();
      uZoneMat.dispose();
      psiAGeo.dispose();
      psiAMat.dispose();
      psiBGeo.dispose();
      psiBMat.dispose();
      barrierGeo.dispose();
      barrierMat.dispose();
      tunnelParticlesGeo.dispose();
      tunnelMat.dispose();
      spinSphereGeo.dispose();
      spinSphereMat.dispose();
      cyanGlowTex.dispose();
      magentaGlowTex.dispose();
      violetGlowTex.dispose();
      whiteGlowTex.dispose();
    };
  }, [systemType, activeChallengeId]);

  // Handle measurement trigger from outer click
  const triggerManualCollapse = () => {
    if (config.isCollapsed || config.isCollapsing) {
      // Reset
      setConfig((prev) => ({
        ...prev,
        isCollapsed: false,
        isCollapsing: false,
        collapsedPosition: null,
      }));
    } else {
      // Smooth collapse centered
      setConfig((prev) => ({
        ...prev,
        isCollapsing: true,
        collapsedPosition: [
          (Math.random() - 0.5) * prev.uncertaintyScale * 0.5,
          (Math.random() - 0.5) * prev.uncertaintyScale * 0.5,
          (Math.random() - 0.5) * prev.uncertaintyScale * 0.5,
        ],
      }));
    }
  };

  return (
    <div id="simulator-container font-sans" className="relative w-full h-full bg-slate-950/20 rounded-2xl overflow-hidden border border-slate-920 select-none">
      
      {/* Three.js viewport */}
      <div ref={containerRef} className="w-full h-[520px] md:h-[580px] cursor-grab active:cursor-grabbing relative">
        <canvas ref={canvasRef} id="quantum-canvas" className="w-full h-full block" />

        {/* Dynamic PROJECTED 2D LABELS overlay */}
        {labelCoords.psi && (
          <div
            className="absolute rounded-md px-2 py-0.5 text-xs font-mono font-medium text-cyan-400 bg-slate-950/80 border border-cyan-500/30 backdrop-blur-xs pointer-events-none transition-all duration-100 ease-out"
            style={{ left: `${labelCoords.psi.x}px`, top: `${labelCoords.psi.y}px`, transform: 'translate(-50%, -100%)' }}
          >
            {labelCoords.psi.val}
          </div>
        )}

        {labelCoords.psiSq && (
          <div
            className="absolute rounded-md px-2 py-0.5 text-xs font-mono font-medium text-pink-400 bg-slate-950/80 border border-pink-500/30 backdrop-blur-xs pointer-events-none transition-all duration-100 ease-out"
            style={{ left: `${labelCoords.psiSq.x}px`, top: `${labelCoords.psiSq.y}px`, transform: 'translate(-50%, 100%)' }}
          >
            {labelCoords.psiSq.val}
          </div>
        )}

        {labelCoords.uncertainty && (
          <div
            className="absolute rounded-md px-2.5 py-1 text-xs font-mono text-indigo-300 bg-slate-950/85 border border-purple-500/20 backdrop-blur-xs pointer-events-none transition-all duration-100 ease-out text-center"
            style={{ left: `${labelCoords.uncertainty.x}px`, top: `${labelCoords.uncertainty.y}px`, transform: 'translate(-50%, 50%)' }}
          >
            <div className="font-bold text-indigo-400">Uncertainty Bound</div>
            <div className="text-[10px] opacity-80">{labelCoords.uncertainty.val}</div>
          </div>
        )}

        {labelCoords.collapse && (
          <div
            className="absolute rounded-md px-2.5 py-1 text-xs font-mono text-amber-300 bg-amber-950/90 border border-amber-500/40 backdrop-blur-xs pointer-events-none transition-all duration-75 text-center animate-pulse"
            style={{ left: `${labelCoords.collapse.x}px`, top: `${labelCoords.collapse.y}px`, transform: 'translate(-50%, -140%)' }}
          >
            ⚡ {labelCoords.collapse.val}
          </div>
        )}

        {labelCoords.entangledA && (
          <div
            className="absolute rounded-md px-2 py-0.5 text-xs font-mono text-cyan-400 bg-slate-950/85 border border-cyan-500/20 backdrop-blur-xs pointer-events-none transition-all duration-100"
            style={{ left: `${labelCoords.entangledA.x}px`, top: `${labelCoords.entangledA.y}px`, transform: 'translate(-50%, -100%)' }}
          >
            {labelCoords.entangledA.val}
          </div>
        )}

        {labelCoords.entangledB && (
          <div
            className="absolute rounded-md px-2 py-0.5 text-xs font-mono text-pink-400 bg-slate-950/85 border border-pink-500/20 backdrop-blur-xs pointer-events-none transition-all duration-100"
            style={{ left: `${labelCoords.entangledB.x}px`, top: `${labelCoords.entangledB.y}px`, transform: 'translate(-50%, -100%)' }}
          >
            {labelCoords.entangledB.val}
          </div>
        )}

        {labelCoords.tunnelIn && (
          <div
            className="absolute rounded-md px-2 py-0.5 text-[11px] font-mono text-cyan-300 bg-slate-950/85 border border-cyan-500/20 backdrop-blur-xs pointer-events-none transition-all duration-100"
            style={{ left: `${labelCoords.tunnelIn.x}px`, top: `${labelCoords.tunnelIn.y}px`, transform: 'translate(-50%, -100%)' }}
          >
            {labelCoords.tunnelIn.val}
          </div>
        )}

        {labelCoords.tunnelOut && (
          <div
            className="absolute rounded-md px-2 py-0.5 text-[11px] font-mono text-purple-300 bg-slate-950/85 border border-purple-500/20 backdrop-blur-xs pointer-events-none transition-all duration-100"
            style={{ left: `${labelCoords.tunnelOut.x}px`, top: `${labelCoords.tunnelOut.y}px`, transform: 'translate(-50%, -100%)' }}
          >
            {labelCoords.tunnelOut.val}
          </div>
        )}

        {/* Instruction badge in-canvas */}
        
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

      </div>

      {/* Embedded Simulation Controls bar */}
      <div id="sim-controls-bar" className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2 items-center justify-between p-3.5 bg-slate-950/90 border border-slate-800/80 rounded-xl backdrop-blur-lg z-10 shadow-xl shadow-slate-950/50">
        
        {/* Play/Pause/Time Control */}
        <div className="flex items-center gap-2">
          <button
            id="play-pause-btn"
            onClick={() => setIsRunning(!isRunning)}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-white transition-colors cursor-pointer"
            title={isRunning ? 'Pause evolution' : 'Resume evolution'}
          >
            {isRunning ? <Pause className="w-4 h-4 text-cyan-400" /> : <Play className="w-4 h-4 text-amber-400" />}
          </button>

          <button
            id="reset-quantum-btn"
            onClick={() => {
              accumTimeRef.current = 0;
              setConfig((prev) => ({
                ...prev,
                isCollapsed: false,
                isCollapsing: false,
                collapsedPosition: null,
              }));
            }}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            title="Reset simulation clock"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <span className="text-[11px] font-mono text-slate-400">
            Evolution: <strong className="text-indigo-400 font-medium font-mono">{accumTimeRef.current.toFixed(2)}s</strong>
          </span>
        </div>

        {/* Waveform Measurement button is sticky inside central space */}
        
        {/* Contextual Action Button */}
        {systemType === 'wavefunction' && (
          <button
            id="wave-measure-btn"
            onClick={triggerManualCollapse}
            className={`px-4 py-1 rounded-lg text-xs font-mono tracking-tight font-medium cursor-pointer transition-all ${
              config.isCollapsed
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-900'
                : config.isCollapsing
                ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40 animate-pulse'
                : 'bg-indigo-950/80 text-cyan-200 border border-cyan-500/40 hover:bg-sky-950'
            }`}
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


        {/* Speed Factor slider */}
        <div className="flex items-center gap-3">
          <label className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
            Speed Coefficient: <strong className="text-indigo-300">{config.speed.toFixed(1)}x</strong>
          </label>
          <input
            id="speed-factor-slider"
            type="range"
            min="0.1"
            max="3"
            step="0.1"
            value={config.speed}
            onChange={(e) => setConfig((prev) => ({ ...prev, speed: parseFloat(e.target.value) }))}
            className="w-20 md:w-28 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
        </div>

      </div>

    </div>
  );
}
