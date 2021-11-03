import { BrowserWindow } from 'electron';
import { Observable } from 'rxjs'
import { usbNgElectronApp } from '../app';
import { serialProvider } from '../../common/services/serial.provider'
import { SERIAL_ROUTES } from './serial-routes';
import { IpcMainEvent } from 'electron/main';

// TODO: Criar as classes com as dependências no construtor e exportar elas instanciando as dependências necessárias
// TODO: Deixar as funções do service como async
const DEVICE_PID = 'EA60'
export class SerialService {

    constructor() { }

    private readInfo(data: string, window: BrowserWindow) {
        switch (data[0]) {
            case '1':
                window.webContents.send('l1', data[1]);
                break;
            case '2':
                window.webContents.send('l2', data[1]);
                break;
            case '3':
                window.webContents.send('l3', data[1]);
                break;
            case 't':
                let temp = parseFloat(data.slice(1));
                window.webContents.send('t', temp);
                break;
            default:
                break;
        }
    }

    private readAnswer(data: string, window: BrowserWindow) {
        switch (data[0]) {
            case '1':
                window.webContents.send('l1', data[1]);
                break;
            case '2':
                window.webContents.send('l2', data[1]);
                break;
            case '3':
                window.webContents.send('l3', data[1]);
                break;
            case 't':
                let temp = parseFloat(data.slice(1));
                window.webContents.send('t', temp);
                break;
            default:
                break;
        }
    }

    public setupListeners(window: BrowserWindow) {
        serialProvider.findPortByPID(DEVICE_PID).then(portInfo => {
            if (portInfo) {
                serialProvider.open(portInfo.path).then(port => {
                    let parser = serialProvider.setReadLineParser(port);
                    parser.on('data', (data: string) => {
                        console.log('dados recebidos: ', data);
                        switch (data[0]) {
                            case 'a': // resposta a um envio prévio
                                this.readAnswer(data.slice(1), window);
                                break;
                            case 'i': // informação enviada sem uma requisição
                                this.readInfo(data.slice(1), window);
                                break;
                            default:
                                break;
                        }
                    })
                    console.log('Listener serial setado');
                })
            }
        })
    }

    public async findPorts() {
        return await serialProvider.findPorts();
    }

    public sendData(data: string) {
        return serialProvider.sendData(data);
    }

    public sendCommand(data: string): Observable<void> {
        return serialProvider.sendData(`c${data}\n`);
    }

    // TODO: Verificar o cleanup da serial port
    public async open(path: string) {
        usbNgElectronApp.onTerminate(this.cleanup);
        console.log('args open-port', path);

        return await serialProvider.open(path);
    }

    private cleanup() {
        serialProvider.closePort();
    }
}

export const serialService = new SerialService();