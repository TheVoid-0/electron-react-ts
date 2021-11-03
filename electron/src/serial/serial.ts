import { usbNgElectronApp } from "../app";
import { SerialService } from "./serial.service";
import { Service } from 'typedi';
import { IpcMainService } from "../../common/services/ipc-main.service";
import { IpcMainEvent } from "electron";
import { SERIAL_ROUTES } from "./serial-routes";

// TODO: Criar um DTO para padronizar a entrada de dados em todos os endpoints e criar mensagens de erro ao receber parametros inexperados
// TODO: Ajustar as depreciações do toPromise do Observable
@Service()
export class Serial {
    private channel: string = SERIAL_ROUTES.MODULE.init;
    constructor(private _ipcMainService: IpcMainService) {
        console.log('serial constructor', this._ipcMainService)

        // Cria a rota principal desse módulo que irá inicializar as outras rotas quando solicitada
        this._ipcMainService.initializePageListener(this.channel, this.setupRoutes.bind(this));
    }

    private async setupRoutes(initialEvent: IpcMainEvent) {
        console.log('Criando rotas do modulo');

        this._ipcMainService.on(this.channel, SERIAL_ROUTES.MODULE.destroy, () => {
            this._ipcMainService.removeAllFromPage(this.channel);
        });

        // import SerialService
        // O SerialService não é importado na inicialização como dependência do módulo pois ele possui o SerialProvider como dependência que importa a biblioteca SerialPort. Utilizando o LazyLoad do service evitamos de importar um módulo na aplicação que não será utilizado (mesmo que nessa aplicação ele sempre seja)
        let serialService: SerialService = (await import('./serial.service')).serialService;

        // Listeners do serial
        serialService.setupListeners(usbNgElectronApp.getMainWindow());

        // Rotas do controller interno que será adicionado após a entrada na página
        this._ipcMainService.on(this.channel, SERIAL_ROUTES.GET_PORTS, serialService.findPorts);

        this._ipcMainService.on(this.channel, SERIAL_ROUTES.POST_AUTOREAD, serialService.sendCommand);

        this._ipcMainService.on(this.channel, SERIAL_ROUTES.POST_OPEN_PORT, serialService.open);

        this._ipcMainService.on(this.channel, SERIAL_ROUTES.POST_LED_STATUS, serialService.sendCommand);

        // Avisa que o módulo preparou as rotas para as funcionalidades
        initialEvent.sender.send(this.channel);

    }

}