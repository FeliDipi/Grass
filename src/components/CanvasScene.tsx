import React, { useEffect, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, StatsGl, Sky, useGLTF } from "@react-three/drei";
import { Grass } from "./Grass";
import { setupGUI } from "../gui/setupGUI";
import * as THREE from "three";
import { useControls } from "../store/useControls";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

export const CanvasScene: React.FC = () => {
  useEffect(() => {
    const gui = setupGUI();
    return () => gui.destroy();
  }, []);

  const { distribution, patchSize } = useControls();

  const gltf = useGLTF("/models/bottle.glb", true) as any;

  const sourceGeometry = useMemo(() => {
    if (distribution === "custom") {
      if (gltf && gltf.scene) {
        const geometries: THREE.BufferGeometry[] = [];
        gltf.scene.updateMatrixWorld(true);
        gltf.scene.traverse((child: any) => {
          if (child.isMesh && child.geometry) {
            const cloned = child.geometry.clone();
            // Apply world transform so sampling uses world-space surface
            cloned.applyMatrix4(child.matrixWorld);
            geometries.push(cloned);
          }
        });
        if (geometries.length) {
          let merged =
            geometries.length === 1
              ? geometries[0]
              : mergeGeometries(geometries, true)!;
          if (!merged.getAttribute("normal")) merged.computeVertexNormals();
          merged.computeBoundingSphere();
          merged.computeBoundingBox();
          return merged;
        }
      }
      return null;
    }
    switch (distribution) {
      case "sphere": {
        const g = new THREE.SphereGeometry(patchSize * 0.5, 32, 32);
        g.computeBoundingSphere();
        g.computeBoundingBox();
        return g;
      }
      case "torus": {
        const g = new THREE.TorusKnotGeometry(
          patchSize * 0.2,
          patchSize * 0.06,
          128,
          16
        );
        g.computeBoundingSphere();
        g.computeBoundingBox();
        return g;
      }
      case "plane":
      default:
        return new THREE.PlaneGeometry(patchSize, patchSize, 1, 1);
    }
  }, [distribution, patchSize, gltf]);

  return (
    <Canvas shadows camera={{ position: [12, 8, 12], fov: 50 }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 15, 5]} castShadow intensity={1.2} />
      <Sky sunPosition={[50, 30, -10]} turbidity={8} mieCoefficient={0.02} />
      <Grass sourceGeometry={sourceGeometry || undefined} />
      <OrbitControls makeDefault enableDamping />
      <StatsGl />
    </Canvas>
  );
};
