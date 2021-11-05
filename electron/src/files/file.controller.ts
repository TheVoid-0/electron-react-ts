import { IpcMainEvent } from "electron";
import { Service } from "typedi";
import { FILE_ROUTES } from "../../../src/@common/routes/file-routes";
import { FileService } from "./file.service";


@Service()
export class FileController {
    constructor(private fileService: FileService) {

    }

    public async getDeviceHistory(event: IpcMainEvent, devicePid: string) {
        let data = await this.fileService.getDeviceHistory(devicePid);
        event.sender.send(FILE_ROUTES.GET_DEVICE_HISTORY, data);
    }
}