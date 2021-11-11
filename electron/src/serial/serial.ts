import Container, { Service } from 'typedi';
import { IpcMainService } from "../../common/services/ipc-main.service";
import { IpcMainEvent } from "electron";
import { SERIAL_ROUTES } from "../../../src/@common/routes/serial-routes";
import { SerialController } from "./serial.controller";
import { Module } from "../app.types";
import { AppService } from '../../common/services/app.service';

@Service()
export class Serial extends Module {
    private channel: string = SERIAL_ROUTES.MODULE.init;
    protected isInitialized: boolean = false;

    constructor(private _ipcMainService: IpcMainService, private _appService: AppService) {
        super()
        console.log('serial constructor', this._ipcMainService)

        // Cria a rota principal desse módulo que irá inicializar as outras rotas quando solicitada
        this._ipcMainService.initializeModuleListener(this.channel, this.setupRoutes.bind(this));
    }

    protected async setupRoutes(initialEvent: IpcMainEvent) {
        if (this.isInitialized) {
            initialEvent.sender.send(this.channel)
            return;
        }
        this.isInitialized = true;

        console.log('Criando rotas do modulo serial');

        this._ipcMainService.on(this.channel, SERIAL_ROUTES.MODULE.destroy, () => {
            console.log('limpando rotas do modulo serial')
            this._ipcMainService.removeAllFromPage(this.channel);
        });

        // import SerialService
        // O SerialService não é importado na inicialização como dependência do módulo pois ele possui o SerialProvider como dependência que importa a biblioteca SerialPort. Utilizando o LazyLoad do service evitamos de importar um módulo na aplicação que não será utilizado (mesmo que nessa aplicação ele sempre seja)
        // const serialService: SerialService = Container.get((await import('./serial.service')).SerialService);
        console.log('Container getting serialController');
        const serialController = Container.get(SerialController);

        // Rotas do controller interno que será adicionado após a entrada na página
        this._ipcMainService.on(this.channel, SERIAL_ROUTES.GET_PORTS, serialController.getPorts.bind(serialController));

        this._ipcMainService.on(this.channel, SERIAL_ROUTES.POST_AUTOREAD, serialController.postAutoread.bind(serialController));

        this._ipcMainService.on(this.channel, SERIAL_ROUTES.POST_OPEN_PORT, serialController.openPort.bind(serialController));

        this._ipcMainService.on(this.channel, SERIAL_ROUTES.POST_CLOSE_PORT, serialController.closePort.bind(serialController));

        this._ipcMainService.on(this.channel, SERIAL_ROUTES.POST_LED_STATUS, serialController.postLedStatus.bind(serialController));

        this._ipcMainService.on(this.channel, SERIAL_ROUTES.POST_SET_DATA_LISTENER, serialController.setupSerialListeners.bind(serialController, this._appService.getMainWindow()));

        this._ipcMainService.on(this.channel, SERIAL_ROUTES.POST_REMOVE_DATA_LISTENER, serialController.removeSerialListeners.bind(serialController));

        this._ipcMainService.on(this.channel, SERIAL_ROUTES.POST_DATA, serialController.postData.bind(serialController));

        // Avisa que o módulo preparou as rotas para as funcionalidades
        initialEvent.sender.send(this.channel);

    }

}