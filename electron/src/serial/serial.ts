import { usbNgElectronApp } from "../app";
import { SerialService } from "./serial.service";
import Container, { Service } from 'typedi';
import { IpcMainService } from "../../common/services/ipc-main.service";
import { IpcMainEvent } from "electron";
import { SERIAL_ROUTES } from "../../../src/@common/routes/serial-routes";
import { SerialController } from "./serial.controller";

// TODO: Criar um DTO para padronizar a entrada de dados em todos os endpoints e criar mensagens de erro ao receber parametros inexperados
@Service()
export class Serial {
    private channel: string = SERIAL_ROUTES.MODULE.init;
    constructor(private _ipcMainService: IpcMainService) {
        console.log('serial constructor', this._ipcMainService)

        // Cria a rota principal desse módulo que irá inicializar as outras rotas quando solicitada
        this._ipcMainService.initializeModuleListener(this.channel, this.setupRoutes.bind(this));
    }

    private async setupRoutes(initialEvent: IpcMainEvent) {
        console.log('Criando rotas do modulo');

        this._ipcMainService.on(this.channel, SERIAL_ROUTES.MODULE.destroy, () => {
            console.log('limpando rotas do módulo')
            this._ipcMainService.removeAllFromPage(this.channel);
        });

        // import SerialService
        // O SerialService não é importado na inicialização como dependência do módulo pois ele possui o SerialProvider como dependência que importa a biblioteca SerialPort. Utilizando o LazyLoad do service evitamos de importar um módulo na aplicação que não será utilizado (mesmo que nessa aplicação ele sempre seja)
        // const serialService: SerialService = Container.get((await import('./serial.service')).SerialService);
        console.log('Container getting serialController');
        const serialController = Container.get(SerialController);

        // Listeners do serial
        serialController.setupSerialListeners(usbNgElectronApp.getMainWindow());

        // Rotas do controller interno que será adicionado após a entrada na página
        this._ipcMainService.on(this.channel, SERIAL_ROUTES.GET_PORTS, serialController.getPorts.bind(serialController));

        this._ipcMainService.on(this.channel, SERIAL_ROUTES.POST_AUTOREAD, serialController.postAutoread.bind(serialController));

        this._ipcMainService.on(this.channel, SERIAL_ROUTES.POST_OPEN_PORT, serialController.openPort.bind(serialController));

        this._ipcMainService.on(this.channel, SERIAL_ROUTES.POST_LED_STATUS, serialController.postLedStatus.bind(serialController));

        // Avisa que o módulo preparou as rotas para as funcionalidades
        initialEvent.sender.send(this.channel);

    }

}