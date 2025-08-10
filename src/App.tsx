import React from 'react';
import { CanvasScene } from './components/CanvasScene';
import { useControls } from './store/useControls';

const Overlay: React.FC = () => {
  const bladeCount = useControls(s => s.bladeCount);
  return (
    <div className="overlay">
      Grass blades: {bladeCount}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <>
      <Overlay />
      <CanvasScene />
    </>
  );
};

export default App;
