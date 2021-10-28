import { IpcRendererEvent } from 'electron';
import { Observable, Subscriber } from 'rxjs';

type IpcResponse = {
    event: IpcRendererEvent,
    body: any
}

type Unsubscribe = () => void;
type Listener = (...args: any[]) => void;

interface ipcRenderer {
    send: (channel: string, ...data: any[]) => void
    on: (channel: string, listener: Listener) => Unsubscribe
}

class IpcService {

    private _ipc: ipcRenderer | undefined;
    private listeners: { [key: string]: string[] } = {};

    constructor() {
        console.log('service constructor code')
        if ((window as any).ipc) {
            try {
                this._ipc = (window as any).ipc as ipcRenderer;
                console.log(this._ipc)
            } catch (e) {
                console.warn('Electron\'s IPC was not loaded');
                throw e;
            }
        } else {
            console.warn('Electron\'s IPC was not loaded');
        }
    }

    public on(page: string, channel: string, listener: (event: IpcRendererEvent, ...args: any[]) => void): void {
        if (!this._ipc) {
            return;
        }
        this._ipc.on(channel, listener);

        // Verifica se já existe um listener dessa página, se sima adiciona esse canal aos listeners dessa página, se não, cria a página com esse canal como listener
        this.listeners[page] ? this.listeners[page].push(channel) : this.listeners = { [page]: [channel] };
    }

    public send(channel: string, ...args: any[]): void {
        if (!this._ipc) {
            return;
        }
        this._ipc.send(channel, ...args);
    }

    public sendAndExpectResponse(channel: string, ...args: any[]): Observable<IpcResponse> {
        return new Observable<IpcResponse>(subscriber => {
            if (!this._ipc) {
                subscriber.error('Electron ipc não foi carregado corretamente');
                return;
            }
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

        this._ipc?.on(`${channel}-ready`, (event, args) => {
            clearTimeout(timeout);

            if (args?.error) {
                subscriber.error(args.message)
            } else {
                subscriber.next({ event, body: { ...args } });
            }

            subscriber.complete();
        });
    }

    // public removeFromChannel(channel: string): void {
    //     this._ipc?.removeAllListeners(channel);
    // }

    // public removeAllFromPage(page: string): void {
    //     for (const channel of this.listeners[page]) {
    //         this._ipc?.removeAllListeners(channel);
    //     }
    //     delete this.listeners[page];
    //     this._ipc?.send(`${page}-closed`);
    // }

    /**
     * Envia uma mensagem para o electron indicando que a página foi fechada e deve limpar os listeners
     * @param page página que os listener devem ser fechados
     */
    public removeMainListener(page: string): void {
        this._ipc?.send(`${page}-closed`);
    }

    public isAvailable(): boolean {
        return !!this._ipc;
    }


    /**
     * Envia uma mensagem pelo ipc do electron para indicar que essa página foi inicializada e transmite a mensagem através de um observable quando obtém resposta
     * 
     * @param page nome da página na qual o electron precisa saber que foi inicializada. IMPORTANTE: esse nome deve ser igual ao que o listener do electron espera
     */
    public initializePageListener(page: string): Observable<IpcResponse> {
        // Garante que haverá somente um listener da página no main process do electron
        this.removeMainListener(page);
        return this.sendAndExpectResponse(page);
    }
}

export default new IpcService();