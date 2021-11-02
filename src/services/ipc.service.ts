import { Observable, Subscriber } from 'rxjs';

import { IpcRenderer, IpcResponse } from '../@common/types/ipc-renderer.types'

class IpcService {

    private _ipc: IpcRenderer;
    private listeners: { [key: string]: string[] } = {};

    constructor() {
        console.log('service constructor code')
        if ((window as any).ipcApi) {
            this._ipc = (window as any).ipcApi as IpcRenderer;
            console.log('ipcRenderer', this._ipc)
        } else {
            this._ipc = IpcRenderer.createIpcRenderer();
            console.warn('Electron\'s IPC is was not loaded', this._ipc);
        }
    }

    public static isIpcAvailable(): boolean {
        const ipcApi = ((window as any).ipcApi as IpcRenderer | undefined);
        if(!ipcApi) {
            return false;
        }
        return ipcApi.isAvailable();
    }

    public on(page: string, channel: string, listener: (...args: any[]) => void): void {
        this._ipc.on(channel, listener);

        // Verifica se já existe um listener dessa página, se sim adiciona esse canal aos listeners dessa página, se não, cria a página com esse canal como listener
        this.listeners[page] ? this.listeners[page].push(channel) : this.listeners = { [page]: [channel] };
    }

    public send(channel: string, ...args: any[]): void {
        this._ipc.send(channel, ...args);
    }

    public sendAndExpectResponse(channel: string, ...args: any[]): Observable<IpcResponse> {
        return new Observable<IpcResponse>(subscriber => {
            this.createResponseListener(subscriber, channel);
            this._ipc.send(channel, ...args);
        });
    }

    private createResponseListener(subscriber: Subscriber<IpcResponse>, channel: string) {
        // Tempo máximo para obter uma resposta do Electron
        let timeout = setTimeout(() => {
            subscriber.error('IPC Timeout');
            subscriber.complete();
        }, 3000);

        let unsub = this._ipc.on(`${channel}-ready`, (event, args) => {
            clearTimeout(timeout);

            if (args?.error) {
                subscriber.error(args.message)
            } else {
                subscriber.next({ body: { ...args } });
            }
            unsub();
            subscriber.complete();
        });
    }

    public removeFromChannel(channel: string): void {
        this._ipc.removeAllListeners(channel);
    }

    public removeAllFromPage(page: string): void {
        for (const channel of this.listeners[page]) {
            this._ipc.removeAllListeners(channel);
        }
        delete this.listeners[page];
        this._ipc.send(`${page}-closed`);
    }

    /**
     * Envia uma mensagem para o electron indicando que a página foi fechada e deve limpar os listeners
     * @param page página que os listener devem ser fechados
     */
    public removeMainListener(page: string): void {
        this._ipc.send(`${page}-closed`);
    }

    public isAvailable(): boolean {
        return this._ipc.isAvailable();
    }


    /**
     * Envia uma mensagem pelo ipc do electron para indicar que essa página foi inicializada e transmite a mensagem através de um observable quando obtém resposta
     * 
     * @param module nome do módulo no qual o electron precisa saber que foi inicializado. IMPORTANTE: esse nome deve ser igual ao que o listener do electron espera
     */
    public initializeModuleListener(module: string): Observable<IpcResponse> {
        // Garante que haverá somente um listener da página no main process do electron
        this.removeMainListener(module);
        return this.sendAndExpectResponse(module);
    }
}

console.log('ipc service static check', IpcService.isIpcAvailable());
export default new IpcService();