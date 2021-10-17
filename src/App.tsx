import React from 'react';
import './App.css';
import ipcService from './services/ipc.service';

function App() {

  const testeIpc = () => {
    console.log('ipc')
    ipcService.initializePageListener('serial-page')
      .subscribe({
        next: () => {
          console.log('redy');
        }, error: () => {
          console.log('error');
        }
      })
  };

  testeIpc();

  return (
    <div className="App">
      <header className="App-header">
        <p>1q1
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
