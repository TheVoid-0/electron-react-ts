const { 
    contextBridge,
    ipcRenderer,
} = require('electron');

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