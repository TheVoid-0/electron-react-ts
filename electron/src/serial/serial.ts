import { usbNgElectronApp } from "../app";
import { SerialService } from "./serial.service";
import { Service } from 'typedi';
import { IpcMainService } from "../common/services/ipc-main.service";

@Service()
export class Serial {
    private channel: string = 'serial-page';
    constructor(private _ipcMainService: IpcMainService) {
        console.log('serial constructor', this._ipcMainService)
        this.setupRoutes();
    }

    private setupRoutes() {
        this._ipcMainService.initializePageListener(this.channel, async (event) => {
            console.log('Criando rotas da página');
            this._ipcMainService.on(this.channel, `${this.channel}-closed`, () => {
                this._ipcMainService.removeAllFromPage(this.channel);
            });

            // import SerialService
            let serialService: SerialService = (await import('./serial.service')).serialService;

            // Listeners do serial
            serialService.setupListeners(usbNgElectronApp.getMainWindow());

            // Rota do controller interno que será adicionado após a entrada na página
            this._ipcMainService.on(this.channel, 'serial-page-get-ports', (event) => {
                console.log('buscando portas...');

                serialService.findPorts().then((ports) => {
                    event.sender.send('serial-page-get-ports-ready', { ports: ports });
                })
            });

            this._ipcMainService.on(this.channel, 'serial-page-post-autoread', (event, args) => {

                serialService.sendCommand(args).toPromise().then(() => {
                    event.sender.send('serial-page-post-autoread-ready', { message: 'success' });
                }).catch((error) => {
                    event.sender.send('serial-page-post-autoread-ready', { error: error, message: 'error' });
                });
            });

            this._ipcMainService.on(this.channel, 'serial-page-post-open-port', (event, args: { path: string }) => {
                console.log('args open-port', args);
                serialService.open(args.path).then((port) => {
                    event.sender.send('serial-page-post-open-port-ready', { message: 'success' });
                }).catch(error => {
                    console.log(error);
                    event.sender.send('serial-page-post-open-port-ready', { error: error, message: 'error' });
                });
            });

            this._ipcMainService.on(this.channel, 'serial-page-post-led-status', (event, args) => {
                console.log('enviando na porta serial', args);
                serialService.sendCommand(args).toPromise().then(() => {
                    console.log('sucesso');
                    event.sender.send('serial-page-post-led-status-ready', { message: 'success' });
                }).catch(error => {
                    console.log(error);
                    event.sender.send('serial-page-post-led-status-ready', { error: error, message: 'error' });
                })
            })

            event.sender.send(`${this.channel}-ready`);

        });
    }

}