import React from 'react';
import './App.css';
import ipcService from './services/ipc.service';

function App() {

  const testeIpc = () => {
    console.log('ipc')

    ipcService.initializePageListener('serial-page')
      .subscribe({
        next: () => {
          console.log('ready');
        }, error: () => {
          console.log('error');
        }
      })
  };

  testeIpc();

  let qtdeDetectada = 5;
  let statusSistema = 'desligado';
  let statusDeteccao = 'off';

  return (
    <div className="App">
      <div className="card">
        <h3>DETECTOR DE PRESENÇA</h3>
        <hr></hr>

        <div>
          <strong>Status: <span className={statusSistema}>{statusSistema}</span></strong>
          <hr></hr>
        </div>

        <div className="deteccao-section">
          <strong>Detecção:</strong>
          <div className={statusDeteccao + ' led'}></div>
        </div>

        <div className="qtde-section">
          <label><span className="qtde">{ qtdeDetectada }</span> presenças detectadas</label>
        </div>

        <div className="exportar-section">
          <button className="exportar">
            Exportar arquivo
          </button>
        </div>

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
