import { IpcMainEvent } from "electron";
import { Service } from "typedi";
import { IpcMainService } from "../../common/services/ipc-main.service";
import { FILE_ROUTES } from "../../../src/@common/routes/file-routes"
import { FileController } from "./file.controller";

@Service()
export class File {
    private channel = FILE_ROUTES.MODULE.init

    constructor(private _ipcMainService: IpcMainService, private fileController: FileController) {
        console.log('file constructor', this._ipcMainService)

        // Cria a rota principal desse módulo que irá inicializar as outras rotas quando solicitada
        this._ipcMainService.initializeModuleListener(this.channel, this.setupRoutes.bind(this));
    }

    private async setupRoutes(initialEvent: IpcMainEvent) {
        console.log('Criando rotas do modulo file');

        this._ipcMainService.on(this.channel,
            FILE_ROUTES.GET_DEVICE_HISTORY,
            this.fileController.getDeviceHistory.bind(this.fileController));

        initialEvent.sender.send(FILE_ROUTES.MODULE.init);

    }
}