import { firstValueFrom } from 'rxjs'
import { BrowserWindow, IpcMainEvent } from "electron";
import { SERIAL_ROUTES } from "../../../src/@common/routes/serial-routes";
import { SerialService } from "./serial.service";
import { Service } from 'typedi';


@Service()
export class SerialController {
    constructor(private serialService: SerialService) {
    }

    public setupSerialListeners(window: BrowserWindow): void {
        this.serialService.setupListeners(window, { pid: 'EA60' });
    }

    public async getPorts(event: IpcMainEvent) {
        console.log('buscando portas...');
        event.sender.send(SERIAL_ROUTES.GET_PORTS, { ports: await this.serialService.findPorts() });
    }

    public async postAutoread(event: IpcMainEvent, data: string) {
        firstValueFrom(this.serialService.sendCommand(data)).then(() => {
            event.sender.send(SERIAL_ROUTES.POST_AUTOREAD, { message: 'success' });
        }).catch((error: any) => {
            console.log('error', error)
            event.sender.send(SERIAL_ROUTES.POST_OPEN_PORT, { error: error, message: 'error' });
        })
    }

    public async openPort(event: IpcMainEvent, path: string) {
        console.log('args open-port', path);

        let port = await this.serialService.open(path).catch((error) => {
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

    public async postLedStatus(event: IpcMainEvent, data: string) {
        firstValueFrom(this.serialService.sendCommand(data)).then(() => {
            event.sender.send(SERIAL_ROUTES.POST_AUTOREAD, { message: 'success' });
        }).catch((error: any) => {
            console.log('error', error)
            event.sender.send(SERIAL_ROUTES.POST_OPEN_PORT, { error: error, message: 'error' });
        })
    }
}