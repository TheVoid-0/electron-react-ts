import { ipcRenderer, contextBridge } from "electron";
import { IpcRenderer } from "./ipc-renderer.types";


contextBridge.exposeInMainWorld('ipc', IpcRenderer.createIpcRenderer(ipcRenderer));