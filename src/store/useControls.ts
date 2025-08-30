import { create } from 'zustand';

export interface ControlState {
  bladeCount: number;
  patchSize: number;
  bladeHeight: number;
  bladeWidth: number;
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
  wireframe: boolean; // show wireframe for grass material
  set: (partial: Partial<ControlState>) => void;
}

export const useControls = create<ControlState>((set) => ({
  bladeCount: 100000,
  patchSize: 30,
  bladeHeight: 0.3,
  bladeWidth: 0.2,
  windStrength: 0.6,
  timeScale: 1.0,
  noiseFreq: 0.9,
  noiseAmp: 0.4,
  colorBottom: '#202428',
  colorTop: '#b4ebfe',
  curvature: 0.0,
  distribution: 'custom',
  followNormals: true,
  waveAmp: 0.8,        // stronger default wave
  waveLength: 40,      // longer wavelength => lower frequency
  waveSpeed: 0.18,
  waveDirectionDeg: 35,
  waveBlend: 1,
  wireframe: false,
  set: (partial) => set(partial)
}));
