import { create } from 'zustand';
export const useControls = create((set) => ({
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
    waveAmp: 0.8,
    waveLength: 40,
    waveSpeed: 0.18,
    waveDirectionDeg: 35,
    waveBlend: 1,
    wireframe: false,
    set: (partial) => set(partial)
}));
