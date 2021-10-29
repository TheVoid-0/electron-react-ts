export type IpcResponse = {
    body: any
}

export type IpcUnsubscribe = () => void;

export interface IpcRenderer {
    send: (channel: string, ...data: any[]) => void
    on: (channel: string, listener: (...args: any[]) => void) => IpcUnsubscribe
    removeAllListeners: (channel: string) => void
    isAvailable: boolean
}