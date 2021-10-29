const { 
    contextBridge,
    ipcRenderer,
} = require('electron');

// TODO: Colocar o arquivo de preload em um lugar adequado dentro do projeto
// TODO: passar uma função de remove listener para o ipcService e enteder como funciona o return () => removeListener
// TODO: arrumar interface do listener para especificar corretamente os parametros
contextBridge.exposeInMainWorld(
    "ipc", {
        send: (channel: string, data: any) => {
            ipcRenderer.send(channel, data);
        },
        on: (channel: string, listener: any) => {
            const subscription = (event: any, ...args: any[]) => listener(event, ...args);
            ipcRenderer.on(channel, subscription);

            return () => {
                ipcRenderer.removeListener(channel, subscription);
            }
        },
    },   
);