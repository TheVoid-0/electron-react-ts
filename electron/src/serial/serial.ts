import { usbNgElectronApp } from "../app";
import { SerialService } from "./serial.service";
import { Service } from 'typedi';
import { IpcMainService } from "../../common/services/ipc-main.service";
import { IpcMainEvent } from "electron";

// TODO: Criar um DTO para padronizar a entrada de dados em todos os endpoints e criar mensagens de erro ao receber parametros inexperados
// TODO: Ajustar as depreciações do toPromise do Observable
@Service()
export class Serial {
    private channel: string = 'serial-module';
    constructor(private _ipcMainService: IpcMainService) {
        console.log('serial constructor', this._ipcMainService)

        // Cria a rota principal desse módulo que irá inicializar as outras rotas quando solicitada
        this._ipcMainService.initializePageListener(this.channel, this.setupRoutes.bind(this));
    }

    private async setupRoutes(initialEvent: IpcMainEvent) {
        console.log('Criando rotas do modulo');

        this._ipcMainService.on(this.channel, `${this.channel}-closed`, () => {
            this._ipcMainService.removeAllFromPage(this.channel);
        });

        // import SerialService
        // O SerialService não é importado na inicialização como dependência do módulo pois ele possui o SerialProvider como dependência que importa a biblioteca SerialPort. Utilizando o LazyLoad do service evitamos de importar um módulo na aplicação que não será utilizado (mesmo que nessa aplicação ele sempre seja)
        let serialService: SerialService = (await import('./serial.service')).serialService;

        // Listeners do serial
        serialService.setupListeners(usbNgElectronApp.getMainWindow());

        // Rotas do controller interno que será adicionado após a entrada na página
        this._ipcMainService.on(this.channel, 'serial-module-get-ports', (event) => {
            console.log('buscando portas...');

            serialService.findPorts().then((ports) => {
                event.sender.send('serial-module-get-ports-ready', { ports: ports });
            })
        });

        this._ipcMainService.on(this.channel, 'serial-module-post-autoread', (event, args) => {

            serialService.sendCommand(args).toPromise().then(() => {
                event.sender.send('serial-module-post-autoread-ready', { message: 'success' });
            }).catch((error) => {
                event.sender.send('serial-module-post-autoread-ready', { error: error, message: 'error' });
            });
        });

        this._ipcMainService.on(this.channel, 'serial-module-post-open-port', (event, args: { path: string }) => {
            console.log('args open-port', args);
            serialService.open(args.path).then((port) => {
                event.sender.send('serial-module-post-open-port-ready', { message: 'success' });
            }).catch(error => {
                console.log(error);
                event.sender.send('serial-module-post-open-port-ready', { error: error, message: 'error' });
            });
        });

        this._ipcMainService.on(this.channel, 'serial-module-post-led-status', (event, args) => {
            console.log('enviando na porta serial', args);
            serialService.sendCommand(args).toPromise().then(() => {
                console.log('sucesso');
                event.sender.send('serial-module-post-led-status-ready', { message: 'success' });
            }).catch(error => {
                console.log(error);
                event.sender.send('serial-module-post-led-status-ready', { error: error, message: 'error' });
            })
        })

        initialEvent.sender.send(`${this.channel}-ready`);

    }

}