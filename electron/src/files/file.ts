import { IpcMainEvent } from "electron";
import { Service } from "typedi";
import { IpcMainService } from "../../common/services/ipc-main.service";
import { FILE_ROUTES } from "../../../src/@common/routes/file-routes"
import { FileController } from "./file.controller";
import { Module } from "../app.types";

@Service()
export class File extends Module {
    private channel = FILE_ROUTES.MODULE.init
    protected isInitialized = false;

    constructor(private _ipcMainService: IpcMainService, private fileController: FileController) {
        super()
        console.log('file constructor', this._ipcMainService)

        // Cria a rota principal desse módulo que irá inicializar as outras rotas quando solicitada
        this._ipcMainService.initializeModuleListener(this.channel, this.setupRoutes.bind(this));
    }

    protected async setupRoutes(initialEvent: IpcMainEvent) {
        if (this.isInitialized) {
            initialEvent.sender.send(this.channel)
            return;
        }
        this.isInitialized = true;

        console.log('Criando rotas do modulo file');

        this._ipcMainService.on(this.channel, FILE_ROUTES.MODULE.destroy, () => {
            console.log('limpando rotas do modulo file')
            this._ipcMainService.removeAllFromPage(this.channel);
        });

        this._ipcMainService.on(this.channel,
            FILE_ROUTES.GET_DEVICE_HISTORY,
            this.fileController.getDeviceHistory.bind(this.fileController));

        this._ipcMainService.on(this.channel, FILE_ROUTES.POST_DEVICE_HISTORY, this.fileController.saveDeviceHistory.bind(this.fileController));

        initialEvent.sender.send(FILE_ROUTES.MODULE.init);

    }
}