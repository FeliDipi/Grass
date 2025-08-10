import GUI from 'lil-gui';
import { useControls } from '../store/useControls';

export function setupGUI() {
  const gui = new GUI({ title: 'Grass Controls', width: 320 });
  const store = useControls.getState();
  const update = (key: keyof typeof store) => (value: any) => useControls.getState().set({ [key]: value } as any);

  gui.add(store, 'bladeCount', 500, 40000, 500).name('Blades').onFinishChange(update('bladeCount'));
  gui.add(store, 'patchSize', 5, 80, 1).name('Patch Size').onChange(update('patchSize'));
  gui.add(store, 'bladeHeight', 0.3, 2.5, 0.05).name('Blade Height').onChange(update('bladeHeight'));
  gui.add(store, 'windStrength', 0, 2, 0.01).name('Wind Strength').onChange(update('windStrength'));
  gui.add(store, 'timeScale', 0, 2, 0.01).name('Time Scale').onChange(update('timeScale'));
  gui.add(store, 'noiseFreq', 0.1, 3, 0.01).name('Noise Freq').onChange(update('noiseFreq'));
  gui.add(store, 'noiseAmp', 0, 1.5, 0.01).name('Noise Amp').onChange(update('noiseAmp'));
  gui.addColor(store, 'colorBottom').name('Color Bottom').onChange(update('colorBottom'));
  gui.addColor(store, 'colorTop').name('Color Top').onChange(update('colorTop'));
  gui.add(store, 'curvature', 0, 1, 0.01).name('Curvature').onChange(update('curvature'));
  const info = { note: () => window.open('https://threejs.org/') };
  gui.add(info, 'note').name('Three.js Site');
  return gui;
}
