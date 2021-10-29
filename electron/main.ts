import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import { usbNgElectronApp } from './src/app';

// verifica se foi passado o argumento para dar auto-reload
const args: string[] = process.argv.slice(1);
let watch: boolean = args.some(val => val === '--watch');

function createWindow() {

    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        backgroundColor: '#fff',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, "preload.js")
        }
    })
    usbNgElectronApp.addWindow(mainWindow);

    if (watch) {

        // Habilita o auto-reload do angular na janela da aplicação electron
        require('electron-reload')
        mainWindow.loadURL('http://localhost:3000');

    } else {
        mainWindow.loadFile(path.join(__dirname, '..', 'index.html'));
    }

    // Abre o inspecionador.
    mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
    createWindow()

    app.on('activate', function () {
        // No macOS o comportamento padrão dos apps é recriar a janela
        // ao clicar no ícone que fica na 'dock', caso não tenha nenhuma aberta.
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit()
})