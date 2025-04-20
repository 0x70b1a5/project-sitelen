import { useState, useRef } from 'react'
import './App.css'
import Canvas from './components/Canvas'

function App() {
  const canvasRef = useRef(null);

  const handleAddElement = () => {
    if (canvasRef.current) {
      canvasRef.current.addElement();
    }
  };

  return (
    <div className="app-container">
      <div className="toolbar">
        <button onClick={handleAddElement}>Add Element</button>
      </div>
      <Canvas ref={canvasRef} />
    </div>
  )
}

export default App