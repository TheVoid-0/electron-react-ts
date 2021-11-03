import { BrowserWindow } from 'electron';
import { Observable } from 'rxjs'
import { usbNgElectronApp } from '../app';
import { SerialProvider } from '../../common/services/serial.provider'
import { Service } from 'typedi';
import SerialPort from 'serialport';

// TODO: Criar as classes com as dependências no construtor e exportar elas instanciando as dependências necessárias
// TODO: Deixar as funções do service como async
@Service()
export class SerialService {

    constructor(private serialProvider: SerialProvider) {
        console.log('serialService constructor');
    }

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

    // TODO: Alterar protocolo de comunicação se necessário e adicionar lógica para contar o número de presenças
    public async setupListeners(window: BrowserWindow, port: { pid?: string, path?: string }): Promise<any> {

        if (!port.path && !port.pid) {
            return { error: true, message: 'Envie o PID ou PATH da porta' };
        }

        if (port.path) {
            let err;
            let portOpened = await this.open(port.path).catch((error) => {
                err = error;
            });

            if (err) {
                return { error: err, message: 'Não foi possível abrir a porta' };
            }

            this.readData(window, portOpened as SerialPort);
            return { error: false, message: 'Listeners adicionados com sucesso!' }
        }

        if (port.pid) {
            let portInfo = await this.serialProvider.findPortByPID(port.pid);
            if (portInfo) {
                let err;
                let port = await this.open(portInfo.path).catch((error) => {
                    err = error;
                });

                if (err) {
                    return { error: err, message: 'Não foi possível abrir a porta' };
                }

                this.readData(window, port as SerialPort);
            } else {
                return { error: true, message: 'Não foi possível encontrar a porta: ' + port.pid };
            }
        }

        return { error: false, message: 'Listeners adicionados com sucesso!' }

    }

    private readData(window: BrowserWindow, port: SerialPort) {
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
        return await this.serialProvider.open(path);
    }

    public async closePort(path?: string) {
        await this.serialProvider.closePort();
    }

    private cleanup() {
        this.serialProvider.closePort();
    }
}
