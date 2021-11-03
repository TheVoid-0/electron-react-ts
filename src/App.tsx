import React, { useState } from 'react';
import './App.css';
import SelectSerial from './components/select-serial/SelectSerial';
import DetectPresence from './components/detect-presence/DetectPresence';

function App() {

  const [isVisibleSelectSerial, setVisibleSelectSerial] = useState(true);
  const [isVisibleDetectPresence, setVisibleDetectPresence] = useState(false);

  return (
    <div className="App">
      <h3>DETECTOR DE PRESENÇA</h3>

      {
        isVisibleSelectSerial ?
          <SelectSerial
            isVisibleSelectSerial={isVisibleSelectSerial}
            setVisibleSelectSerial={setVisibleSelectSerial}
            setVisibleDetectPresence={setVisibleDetectPresence}>
          </SelectSerial>
          : null
      }

      {
        isVisibleDetectPresence ?
          <DetectPresence
            isVisibleDetectPresence={isVisibleDetectPresence}
            setVisibleSelectSerial={setVisibleSelectSerial}
            setVisibleDetectPresence={setVisibleDetectPresence}>
          </DetectPresence>
          : null
      }

      <div className="footer">
        <hr></hr>
        <small>Desenvolvido por: Diovanna, Felipe P. e Marco</small>
        <small>Disciplina: Integração e Software-Hardware</small>
      </div>
    </div>
  );
}

export default App;
