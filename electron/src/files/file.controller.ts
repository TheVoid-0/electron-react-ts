import { IpcMainEvent } from "electron";
import { Service } from "typedi";
import { FILE_ROUTES } from "../../../src/@common/routes/file-routes";
import { FileService } from "./file.service";


@Service()
export class FileController {
    constructor(private fileService: FileService) {

    }

    public async getDeviceHistory(event: IpcMainEvent, devicePid: string) {
        let data;
        try {
            data = await this.fileService.getDeviceHistory(devicePid)
        } catch (error) {
            data = { error: error, message: 'histórico do dispositivo possivelmente não existe' }
        }
        event.sender.send(FILE_ROUTES.GET_DEVICE_HISTORY, data);
    }

    public async saveDeviceHistory(event: IpcMainEvent, devicePid: string, data: any) {
        let err = await this.fileService.saveDeviceHistory(devicePid, data);
        event.sender.send(FILE_ROUTES.POST_DEVICE_HISTORY, { error: err });
    }
}