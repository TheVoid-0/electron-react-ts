import { firstValueFrom } from 'rxjs'
import { IpcMainEvent } from "electron";
import { SERIAL_ROUTES } from "./serial-routes";
import { serialService, SerialService } from "./serial.service";



export class SerialController {
    constructor(private serialService: SerialService) {
    }

    public async getPorts(event: IpcMainEvent) {
        console.log('buscando portas...');
        event.sender.send(SERIAL_ROUTES.GET_PORTS, { ports: await serialService.findPorts() });
    }

    public async postAutoread(event: IpcMainEvent, data: string) {
        firstValueFrom(serialService.sendCommand(data)).then(() => {
            event.sender.send(SERIAL_ROUTES.POST_AUTOREAD, { message: 'success' });
        }).catch((error: any) => {
            console.log('error', error)
            event.sender.send(SERIAL_ROUTES.POST_OPEN_PORT, { error: error, message: 'error' });
        })
    }

    public async openPort(event: IpcMainEvent, path: string) {
        console.log('args open-port', path);

        let port = await serialService.open(path).catch((error) => {
            console.log(error);
            event.sender.send(SERIAL_ROUTES.POST_OPEN_PORT, { error: error, message: 'error' });
        });

        event.sender.send(SERIAL_ROUTES.POST_OPEN_PORT, { message: 'success' });
    }

    public async postLedStatus(event: IpcMainEvent, data: string) {
        firstValueFrom(serialService.sendCommand(data)).then(() => {
            event.sender.send(SERIAL_ROUTES.POST_AUTOREAD, { message: 'success' });
        }).catch((error: any) => {
            console.log('error', error)
            event.sender.send(SERIAL_ROUTES.POST_OPEN_PORT, { error: error, message: 'error' });
        })
    }
}