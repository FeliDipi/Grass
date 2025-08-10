import React, { useEffect, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, StatsGl, Sky } from "@react-three/drei";
import { Grass } from "./Grass";
import { setupGUI } from "../gui/setupGUI";
import * as THREE from "three";
import { useControls } from "../store/useControls";

export const CanvasScene: React.FC = () => {
  useEffect(() => {
    const gui = setupGUI();
    return () => gui.destroy();
  }, []);

  const { distribution, patchSize } = useControls();

  const sourceGeometry = useMemo(() => {
    switch (distribution) {
      case "sphere":
        return new THREE.SphereGeometry(patchSize * 0.5, 32, 32);
      case "torus":
        return new THREE.TorusKnotGeometry(
          patchSize * 0.2,
          patchSize * 0.06,
          128,
          16
        );
      case "plane":
      default:
        return new THREE.PlaneGeometry(patchSize, patchSize, 1, 1);
    }
  }, [distribution, patchSize]);

  return (
    <Canvas shadows camera={{ position: [12, 8, 12], fov: 50 }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 15, 5]} castShadow intensity={1.2} />
      <Sky sunPosition={[50, 30, -10]} turbidity={8} mieCoefficient={0.02} />
      <Grass sourceGeometry={sourceGeometry} />
      <OrbitControls makeDefault enableDamping />
      <StatsGl />
    </Canvas>
  );
};
