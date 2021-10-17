import { IpcMain, ipcMain, IpcMainEvent } from "electron";
import { Service } from "typedi";

@Service()
export class IpcMainService {
    private _ipcMain: IpcMain;
    private listeners: { [key: string]: string[] } = {};

    constructor() {
        this._ipcMain = ipcMain;
    }


    public getIpcMain(): IpcMain {
        return this._ipcMain;
    }

    /**
     * Cria um listener que aguarda o sinal de que uma página precisa dos recursos desse módulo;
     * 
     * @param page nome da página na qual o electron espera ser chamado.
     * @param listener callback que será chamado quando uma "requisição" para essa página chegar, pode conter qualquer lógica de negócio e inicializar outros
     * listeners que aguardam novas requisições
     */
    public initializePageListener(page: string, listener: (event: IpcMainEvent, ...args: any[]) => void) {
        // Garante que haverá somente um listener da página no main process do electron
        this.removeAllFromPage(page);
        this._ipcMain.on(page, listener);
    }

    /**
     * 
     * @param page Nome do canal/página/módulo "pai" que guardará todos os "subcanais" para eventos que acontecem nessa página/módulo.
     * EX: dado o módulo cliente, você pode incializar o listener para esse módulo passando para esse parâmetro a string 'cliente-page',
     * e então, pode adicionar listeners desse módulo passando para esta função essa mesma string e um outro canal que responderá pela funcionalidade
     * específica: ...on('cliente-page', 'cliente-page-find-all', listener)
     * @param channel Nome do canal que aguardará ser chamado para invocar a função listener
     * @param listener Função que será invocada quando o channel for chamado
     */
    public on(page: string, channel: string, listener: (event: IpcMainEvent, ...args: any[]) => void): void {
        if (!this._ipcMain) {
            return;
        }
        this._ipcMain.on(channel, listener);

        // Verifica se já existe um listener dessa página, se sima adiciona esse canal aos listeners dessa página, se não, cria a página com esse canal como listener
        this.listeners[page] ? this.listeners[page].push(channel) : this.listeners = { [page]: [channel] };
    }

    public removeAllFromPage(page: string): void {
        if (!this.listeners[page]) return;

        for (const channel of this.listeners[page]) {
            this._ipcMain?.removeAllListeners(channel);
        }
        // NÃO remover o listener da própria página, pois ele poderá ser chamado para recriar as rotas!!
        // this._ipcMain.removeAllListeners(page);
        // delete this.listeners[page];
    }
}