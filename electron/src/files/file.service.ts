import * as fs from 'fs';
import { Service } from 'typedi';
import { dialog } from 'electron';
import { usbNgElectronApp } from '../app';
import { join, dirname } from 'path';
@Service()
export class FileService {
    private defaultSaveLocation = join(__dirname, '..', '..', '..', '..', '..', 'public', 'saved');
    constructor() { }

    public writeFile(filePath: string, data: Buffer | string) {
        return new Promise<void>((resolve, reject) => {
            fs.mkdir(dirname(filePath), { recursive: true }, (error) => {

                if (error) {
                    console.log('mkdir error: ', error);
                    reject(error);
                    return;
                }

                fs.writeFile(filePath, Buffer.from(data.toString()), (error) => {
                    if (error) {
                        console.log('create file error: ', error);
                        reject(error);
                        return;
                    }
                    console.log('created file on: ', filePath);
                    resolve();
                });
            });

        });
    }

    public async saveDeviceHistory(devicePid: string, data: any) {
        let err;
        try {
            let dialogReturn = await dialog.showSaveDialog(usbNgElectronApp.getMainWindow(), { filters: [{ extensions: ['txt'], name: 'log' }] });
            if (dialogReturn.filePath) {
                await this.writeFile(`${dialogReturn.filePath}`, data);
            }
            await this.writeFile(join(this.defaultSaveLocation, `log_${devicePid}.txt`), data);
        } catch (error) {
            err = error
        }
        return err;
    }

    public getDeviceHistory(devicePid: string) {
        return new Promise((resolve, reject) => {
            console.log('reading file history');
            fs.readFile(join(this.defaultSaveLocation, `log_${devicePid}.txt`), (err, data: Buffer) => {
                if (err) {
                    console.log(err);
                    reject(err);
                    return;
                }
                console.log(data, 'parsed: ', data.toString('utf-8'));
                resolve(data.toString('utf-8'));
            });
        });
    }
}