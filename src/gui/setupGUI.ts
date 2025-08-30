import GUI from 'lil-gui';
import { useControls } from '../store/useControls';

export function setupGUI() {
  const gui = new GUI({ title: 'Grass Controls', width: 320 });
  const store = useControls.getState();
  const update = (key: keyof typeof store) => (value: any) => useControls.getState().set({ [key]: value } as any);

  gui.add(store, 'bladeCount', 500, 100000, 500).name('Blades').onFinishChange(update('bladeCount'));
  gui.add(store, 'patchSize', 5, 80, 1).name('Patch Size').onChange(update('patchSize'));
  gui.add(store, 'bladeHeight', 0.05, 2.5, 0.01).name('Blade Height').onChange(update('bladeHeight'));
  gui.add(store, 'bladeWidth', 0.005, 1.0, 0.001).name('Blade Width').onChange(update('bladeWidth'));
  gui.add(store, 'windStrength', 0, 2, 0.01).name('Wind Strength').onChange(update('windStrength'));
  gui.add(store, 'timeScale', 0, 2, 0.01).name('Time Scale').onChange(update('timeScale'));
  gui.add(store, 'noiseFreq', 0.1, 3, 0.01).name('Noise Freq').onChange(update('noiseFreq'));
  gui.add(store, 'noiseAmp', 0, 1.5, 0.01).name('Noise Amp').onChange(update('noiseAmp'));
  gui.addColor(store, 'colorBottom').name('Color Bottom').onChange(update('colorBottom'));
  gui.addColor(store, 'colorTop').name('Color Top').onChange(update('colorTop'));
  gui.add(store, 'curvature', 0, 1, 0.01).name('Curvature').onChange(update('curvature'));
  gui.add(store, 'distribution', { Plane: 'plane', Sphere: 'sphere', Torus: 'torus', Custom: 'custom' }).name('Distribution').onChange(update('distribution'));
  gui.add(store, 'followNormals').name('Follow Normals').onChange(update('followNormals'));
  gui.add(store, 'wireframe').name('Grass Wireframe').onChange(update('wireframe'));
  const wave = gui.addFolder('Wave Wind');
  wave.add(store, 'waveBlend', 0, 1, 0.01).name('Blend').onChange(update('waveBlend'));
  wave.add(store, 'waveAmp', 0, 4, 0.01).name('Amplitude').onChange(update('waveAmp'));
  wave.add(store, 'waveLength', 1, 120, 0.5).name('Length').onChange(update('waveLength'));
  wave.add(store, 'waveSpeed', 0, 2, 0.01).name('Speed').onChange(update('waveSpeed'));
  return gui;
}
