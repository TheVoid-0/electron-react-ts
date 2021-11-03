import React from 'react';
import './App.css';
import SelectSerial from './components/select-serial/SelectSerial'
function App() {

  return (
    <div className="App">
      <div className="card">
          <h3>DETECTOR DE PRESENÇA</h3>
          <hr></hr>
          
          <SelectSerial></SelectSerial>

          <hr></hr>
          <div className="card-footer">
              <small>Desenvolvido por: Diovanna, Felipe P. e Marco</small>
              <small>Disciplina: Integração e Software-Hardware</small>
          </div>
        </div>
    </div>
  );
}

export default App;
