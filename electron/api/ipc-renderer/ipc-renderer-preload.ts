import { ipcRenderer, contextBridge } from "electron";
import { IpcRenderer } from "../../../src/@common/types/ipc-renderer.types";

let ipc = IpcRenderer.createIpcRenderer(ipcRenderer);
console.log("ipc renderer created", ipc);
contextBridge.exposeInMainWorld('ipcApi', ipc);