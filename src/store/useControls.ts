import { create } from 'zustand';

export interface ControlState {
  bladeCount: number;
  patchSize: number;
  bladeHeight: number;
  windStrength: number;
  timeScale: number;
  noiseFreq: number;
  noiseAmp: number;
  colorBottom: string; // hex
  colorTop: string; // hex
  curvature: number;
  distribution: 'plane' | 'sphere' | 'torus';
  followNormals: boolean;
  waveAmp: number;
  waveLength: number;
  waveSpeed: number;
  waveDirectionDeg: number; // direction angle in degrees on XZ plane
  waveBlend: number; // blend factor 0-1
  set: (partial: Partial<ControlState>) => void;
}

export const useControls = create<ControlState>((set) => ({
  bladeCount: 40000,
  patchSize: 30,
  bladeHeight: 1.2,
  windStrength: 0.6,
  timeScale: 1.0,
  noiseFreq: 0.9,
  noiseAmp: 0.4,
  colorBottom: '#2d6b18',
  colorTop: '#b4ff6b',
  curvature: 0.25,
  distribution: 'plane',
  followNormals: true,
  waveAmp: 0.4,
  waveLength: 12,
  waveSpeed: 0.18,
  waveDirectionDeg: 35,
  waveBlend: 1,
  set: (partial) => set(partial)
}));
