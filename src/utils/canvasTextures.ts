import * as THREE from 'three';

/**
 * Generates a glowing radial circular particle texture procedurally.
 * This ensures beautiful, soft-edged glowing neon particles.
 */
export function createGlowTexture(colorStr: string = '#ffffff'): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    // Tighten the glow gradient for a cleaner, higher contrast, less fuzzy appearance
    gradient.addColorStop(0, colorStr);
    gradient.addColorStop(0.25, colorStr);
    gradient.addColorStop(0.6, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/**
 * Generates a ring-like orbital glow pattern procedurally.
 */
export function createRingTexture(colorInner: string, colorOuter: string): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    const gradient = ctx.createRadialGradient(64, 64, 20, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(0.4, colorInner);
    gradient.addColorStop(0.7, colorOuter);
    gradient.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}
