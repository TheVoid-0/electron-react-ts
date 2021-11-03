import { BrowserWindow } from 'electron';
import { Observable } from 'rxjs'
import { usbNgElectronApp } from '../app';
import { SerialProvider } from '../../common/services/serial.provider'
import { Service } from 'typedi';

// TODO: Criar as classes com as dependências no construtor e exportar elas instanciando as dependências necessárias
// TODO: Deixar as funções do service como async
const DEVICE_PID = 'EA60'
@Service()
export class SerialService {

    constructor(private serialProvider: SerialProvider) { }

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
        this.serialProvider.findPortByPID(DEVICE_PID).then(portInfo => {
            if (portInfo) {
                this.serialProvider.open(portInfo.path).then(port => {
                    let parser = this.serialProvider.setReadLineParser(port);
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
        return await this.serialProvider.findPorts();
    }

    public sendData(data: string) {
        return this.serialProvider.sendData(data);
    }

    public sendCommand(data: string): Observable<void> {
        return this.serialProvider.sendData(`c${data}\n`);
    }

    // TODO: Verificar o cleanup da serial port
    public async open(path: string) {
        usbNgElectronApp.onTerminate(this.cleanup);
        console.log('args open-port', path);

        return await this.serialProvider.open(path);
    }

    private cleanup() {
        this.serialProvider.closePort();
    }
}
