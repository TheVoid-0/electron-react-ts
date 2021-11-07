import { BrowserWindow } from 'electron';
import { Observable } from 'rxjs'
import { SerialProvider } from '../../common/services/serial.provider'
import { Service } from 'typedi';
import SerialPort from 'serialport';
import { FileService } from '../files/file.service';
import { AppService } from '../../common/services/app.service';

@Service()
export class SerialService {

    constructor(private serialProvider: SerialProvider, private fileService: FileService, private appService: AppService) {
        console.log('serialService constructor');
    }

    private readInfo(data: string, window: BrowserWindow, port: SerialPort, responseChannel?: string) {
        if (responseChannel) {
            window.webContents.send(responseChannel, data);
            return;
        }

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
            case 'p': // detector de presença
                window.webContents.send('presence_detected', data[1]);
                break;
            default:
                break;
        }
    }

    private readAnswer(data: string, window: BrowserWindow, port: SerialPort, responseChannel?: string) {
        if (responseChannel) {
            window.webContents.send(responseChannel, data);
            return;
        }

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

    public removeAllListeners(port: { pid?: string, path?: string }, eventName: string) {
        let portOpened = this.serialProvider.getOpenedPort(port);
        if (!portOpened) {
            return { error: true, message: `Não foi possível encontrar a porta: ${port.pid} ${port.path}` }
        }

        portOpened.removeAllListeners(eventName);
        return;
    }

    public async setupListeners(window: BrowserWindow, responseChannel: string, port: { pid?: string, path?: string }): Promise<any> {

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

            this.readData(window, portOpened as SerialPort, responseChannel);
            return { error: false, message: 'Listeners adicionados com sucesso!' }
        }

        if (port.pid) {
            let portInfo = await this.serialProvider.findPort({ pid: port.pid });
            if (portInfo) {
                let err;
                let port = await this.open(portInfo.path).catch((error) => {
                    err = error;
                });

                if (err) {
                    return { error: err, message: 'Não foi possível abrir a porta' };
                }

                this.readData(window, port as SerialPort, responseChannel);
            } else {
                return { error: true, message: 'Não foi possível encontrar a porta: ' + port.pid };
            }
        }

        return { error: false, message: 'Listeners adicionados com sucesso!' }

    }

    private readData(window: BrowserWindow, port: SerialPort, responseChannel?: string) {
        // Garante que somente um listener de data será adicionado a esta porta
        port.removeAllListeners('data');

        let parser = this.serialProvider.setReadLineParser(port);
        parser.on('data', (data: string) => {
            console.log('dados recebidos: ', data);
            switch (data[0]) {
                case 'a': // resposta a um envio prévio
                    this.readAnswer(data.slice(1), window, port, responseChannel);
                    break;
                case 'i': // informação enviada sem uma requisição
                    this.readInfo(data.slice(1), window, port, responseChannel);
                    break;
                default:
                    break;
            }
        })
        console.log('Listener serial setado: ', port.path);

    }

    public async findPorts() {
        return await this.serialProvider.findPorts();
    }

    public sendData(portPath: string, data: string) {
        return this.serialProvider.sendData(portPath, data);
    }

    public sendCommand(data: string, portPath: string): Observable<void> {
        return this.serialProvider.sendData(`c${data}\n`, portPath);
    }

    // TODO: Verificar o cleanup da serial port
    public async open(path: string, options?: SerialPort.OpenOptions) {
        this.appService.onTerminate(this.cleanup.bind(this));
        return await this.serialProvider.open(path, options);
    }

    public async closePort(path?: string) {
        await this.serialProvider.closePort();
    }

    private cleanup() {
        console.log('rodando cleanup serial')
        this.serialProvider.closePort();
    }
}
