import { IpcRenderer } from "./ipc-renderer.types";

const {
    contextBridge,
    ipcRenderer,
} = require('electron');

// TODO: Colocar o arquivo de preload em um lugar adequado dentro do projeto
// TODO: passar uma função de remove listener para o ipcService e enteder como funciona o return () => removeListener
// TODO: arrumar interface do listener para especificar corretamente os parametros
const ipcApi: IpcRenderer = {
    send: (channel: string, ...data: any[]) => {
        ipcRenderer.send(channel, data);
    },
    on: (channel: string, listener: (...args: any[]) => void) => {
        // Encapsulando o listener em uma função que passará somente os argumentos, não expondo o evento no renderer
        // O termo 'subscription' faz referência ao que recebemos ao se inscrevermos em um observable, pois essa 'subscription' pode ser usada para remover o listener
        const subscription = (event: any, ...args: any[]) => listener(...args);
        ipcRenderer.on(channel, subscription);

        // Retorna uma função para se 'desinscrevermos' ou seja, remover o listener usando sua 'subscription'
        return () => {
            ipcRenderer.removeListener(channel, subscription);
        }
    },
    removeAllListeners: (channel: string) => {
        ipcRenderer.removeAllListeners(channel);
    },
    isAvailable: true
}
contextBridge.exposeInMainWorld('ipc', ipcApi);