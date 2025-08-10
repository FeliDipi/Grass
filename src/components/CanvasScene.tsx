import React, { useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, StatsGl, Sky } from '@react-three/drei';
import { Grass } from './Grass';
import { setupGUI } from '../gui/setupGUI';

export const CanvasScene: React.FC = () => {
  useEffect(() => {
    const gui = setupGUI();
    return () => gui.destroy();
  }, []);

  return (
    <Canvas shadows camera={{ position: [12, 8, 12], fov: 50 }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 15, 5]} castShadow intensity={1.2} />
      <Sky sunPosition={[50, 30, -10]} turbidity={8} mieCoefficient={0.02} />
      <Grass />
      <OrbitControls makeDefault enableDamping />
      <StatsGl />
    </Canvas>
  );
};
