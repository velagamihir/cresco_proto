import React from 'react';
import { CanvasViewport } from './components/canvas/CanvasViewport';

function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0 }}>
      <CanvasViewport />
    </div>
  );
}

export default App;