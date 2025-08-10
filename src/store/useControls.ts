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
  distribution: 'plane' | 'sphere' | 'torus' | 'custom';
  followNormals: boolean;
  waveAmp: number;
  waveLength: number;
  waveSpeed: number;
  waveDirectionDeg: number; // direction angle in degrees on XZ plane
  waveBlend: number; // blend factor 0-1
  set: (partial: Partial<ControlState>) => void;
}

export const useControls = create<ControlState>((set) => ({
  bladeCount: 12500,
  patchSize: 30,
  bladeHeight: 0.5,
  windStrength: 0.6,
  timeScale: 1.0,
  noiseFreq: 0.9,
  noiseAmp: 0.4,
  colorBottom: '#172f0f',
  colorTop: '#5db65f',
  curvature: 0.25,
  distribution: 'custom',
  followNormals: true,
  waveAmp: 0.8,        // stronger default wave
  waveLength: 40,      // longer wavelength => lower frequency
  waveSpeed: 0.18,
  waveDirectionDeg: 35,
  waveBlend: 1,
  set: (partial) => set(partial)
}));
