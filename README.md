# Grass Shader Template (Vite + React + R3F + Drei + Zustand + lil-gui + TypeScript)

An opinionated starter focused on building custom GPU shaders (here: procedural instanced grass) using Three.js via React Three Fiber.

## Features

- Vite + React 18 + TypeScript
- Three.js / React Three Fiber
- @react-three/drei helpers (Sky, OrbitControls, Stats)
- Instanced grass blades with custom vertex + fragment shaders
- Procedural wind sway, curvature, per-blade variation, interaction, color customization, custom geometry support
- Live tweakable uniforms & generation params via lil-gui + Zustand state
- Clean separation: `store`, `components`, `shaders`, `gui`
