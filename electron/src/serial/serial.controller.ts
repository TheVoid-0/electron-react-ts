import { firstValueFrom } from 'rxjs'
import { BrowserWindow, IpcMainEvent } from "electron";
import { SERIAL_ROUTES } from "../../../src/@common/routes/serial-routes";
import { SerialService } from "./serial.service";
import { Service } from 'typedi';
import SerialPort from 'serialport';


// TODO: Criar um DTO para padronizar a entrada de dados em todos os endpoints e criar mensagens de erro ao receber parametros inexperados
@Service()
export class SerialController {
    constructor(private serialService: SerialService) {
    }

    public async setupSerialListeners(window: BrowserWindow, event: IpcMainEvent, responseChannel: string, findPortOptions: { path?: string, pid?: string }): Promise<void> {
        console.log('SetupSerialListeners: ', findPortOptions);
        let err = await this.serialService.setupListeners(window, responseChannel, { pid: 'EA60', path: findPortOptions.path });
        event.sender.send(SERIAL_ROUTES.POST_SET_DATA_LISTENER, err);
    }

    public async postData(event: IpcMainEvent, data: any, portPath: string) {
        await firstValueFrom(this.serialService.sendCommand(data, portPath));
        event.sender.send(SERIAL_ROUTES.POST_DATA);
    }

    public async getPorts(event: IpcMainEvent) {
        console.log('buscando portas...');
        event.sender.send(SERIAL_ROUTES.GET_PORTS, { ports: await this.serialService.findPorts() });
    }

    public async postAutoread(event: IpcMainEvent, portPath: string, data: string) {
        firstValueFrom(this.serialService.sendCommand(data, portPath)).then(() => {
            event.sender.send(SERIAL_ROUTES.POST_AUTOREAD, { message: 'success' });
        }).catch((error: any) => {
            console.log('error', error)
            event.sender.send(SERIAL_ROUTES.POST_OPEN_PORT, { error: error, message: 'error' });
        })
    }

    public async openPort(event: IpcMainEvent, path: string, options: SerialPort.OpenOptions) {
        console.log('args open-port', path);

        let port = await this.serialService.open(path, options).catch((error) => {
            console.log(error);
            event.sender.send(SERIAL_ROUTES.POST_OPEN_PORT, { error: error, message: 'error' });
        });

        event.sender.send(SERIAL_ROUTES.POST_OPEN_PORT, { message: 'success' });
    }

    public async closePort(event: IpcMainEvent, path?: string) {
        console.log('fechando porta', path);
        this.serialService.closePort(path).
            then(() =>
                event.sender.send(SERIAL_ROUTES.POST_CLOSE_PORT, { message: 'success' }))
            .catch((error: any) =>
                event.sender.send(SERIAL_ROUTES.POST_CLOSE_PORT, { error: error, message: 'error' }));
    }

    public async postLedStatus(event: IpcMainEvent, portPath: string, data: string) {
        firstValueFrom(this.serialService.sendCommand(portPath, data)).then(() => {
            event.sender.send(SERIAL_ROUTES.POST_AUTOREAD, { message: 'success' });
        }).catch((error: any) => {
            console.log('error', error)
            event.sender.send(SERIAL_ROUTES.POST_OPEN_PORT, { error: error, message: 'error' });
        })
    }
}