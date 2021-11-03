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
     * Cria um listener que aguarda o sinal de que uma módulo precisa dos recursos desse módulo;
     * 
     * @param module nome da módulo no qual o electron espera ser chamado.
     * @param listener callback que será chamado quando uma "requisição" para esse módulo chegar, pode conter qualquer lógica de negócio e inicializar outros
     * listeners que aguardam novas requisições
     */
    public initializeModuleListener(module: string, listener: (event: IpcMainEvent, ...args: any[]) => void) {
        // Garante que haverá somente um listener da módulo no main process do electron
        this.removeAllFromPage(module);
        this._ipcMain.on(module, listener);
    }

    /**
     * 
     * @param module Nome do canal/página/módulo "pai" que guardará todos os "subcanais" para eventos que acontecem nessa página/módulo.
     * EX: dado o módulo cliente, você pode incializar o listener para esse módulo passando para esse parâmetro a string 'cliente-module',
     * e então, pode adicionar listeners desse módulo passando para esta função essa mesma string e um outro canal que responderá pela funcionalidade
     * específica: ...on('cliente-module', 'cliente-module-find-all', listener)
     * @param channel Nome do canal que aguardará ser chamado para invocar a função listener
     * @param listener Função que será invocada quando o channel for chamado
     */
    public on(module: string, channel: string, listener: (event: IpcMainEvent, ...args: any[]) => void): void {
        if (!this._ipcMain) {
            return;
        }
        this._ipcMain.on(channel, listener);

        // Verifica se já existe um listener desse página, se sima adiciona esse canal aos listeners dessa módulo, se não, cria a módulo com esse canal como listener
        this.listeners[module] ? this.listeners[module].push(channel) : this.listeners = { [module]: [channel] };
    }

    public removeAllFromPage(module: string): void {
        if (!this.listeners[module]) return;

        for (const channel of this.listeners[module]) {
            this._ipcMain?.removeAllListeners(channel);
        }
        // NÃO remover o listener da própria módulo, pois ele poderá ser chamado para recriar as rotas!!
        // this._ipcMain.removeAllListeners(module);
        // delete this.listeners[module];
    }
}