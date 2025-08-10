# Grass Shader Template (Vite + React + R3F + Drei + Zustand + lil-gui + TypeScript)

An opinionated starter focused on building custom GPU shaders (here: procedural instanced grass) using Three.js via React Three Fiber.

## Features

- Vite + React 18 + TypeScript
- Three.js / React Three Fiber
- @react-three/drei helpers (Sky, OrbitControls, Stats)
- Instanced grass blades with custom vertex + fragment shaders
- Procedural wind sway, curvature, per-blade variation
- Live tweakable uniforms & generation params via lil-gui + Zustand state
- Clean separation: `store`, `components`, `shaders`, `gui`

## Quick Start

```powershell
npm install
npm run dev
```
Then open the printed local URL (default http://localhost:5173/).

Adjust parameters in the GUI (top-right). Changing Blade Count or Patch Size rebuilds geometry (may hitch briefly). Keep Blade Count moderate (<= 25k) for smooth FPS.

## Project Structure

```
src/
  App.tsx               # Overlay + scene
  main.tsx              # React root
  components/
    CanvasScene.tsx     # Canvas + lighting + controls
    Grass.tsx           # Instanced grass + shader uniforms
  shaders/
    grass.vert.glsl
    grass.frag.glsl
  store/
    useControls.ts      # Zustand central state
  gui/
    setupGUI.ts         # lil-gui configuration
```

## Extending (Custom Shader Workflow)

1. Duplicate the grass shader files, e.g. `water.vert.glsl` / `water.frag.glsl`.
2. Create a component similar to `Grass.tsx` setting up geometry + uniforms.
3. Add new controls in `useControls.ts` & `setupGUI.ts`.
4. Import and mount your component inside `CanvasScene`.

## Shader Uniforms Summary

| Uniform | Purpose |
|---------|---------|
| uTime | Animated time (seconds) |
| uWindStrength | Wind sway amplitude |
| uBladeHeight | Scalar blade length |
| uNoiseFreq | Frequency of procedural noise |
| uNoiseAmp | Amplitude of positional noise |
| uColorBottom / uColorTop | Vertical color gradient |
| uCurvature | Static horizontal bend amount |

## Performance Tips

- Lower blade count for weaker hardware.
- Consider frustum culling by chunking the field instead of one big instanced mesh for very large scenes.
- Move expensive noise into a baked attribute if it is static.
- Use a lower dynamic range in colors & add post-processing for tone mapping if expanding scene.

## License

MIT – do whatever, attribution appreciated.
