import { IpcMainEvent } from "electron";

export abstract class Module {
    protected abstract isInitialized: boolean;
    protected abstract setupRoutes(event: IpcMainEvent): void
}