import * as fs from 'fs';
import { Service } from 'typedi';

@Service()
export class FileService {

    constructor() { }

    // TODO: Trocar o append por um write para substituir o valor salvo e nao concatenar
    // TODO: Salvar o arquivo em um local que não seja apagado em cada build
    public writeFile(fileName: string, data: Buffer | string) {
        return new Promise<void>((resolve, reject) => {
            fs.appendFile(__dirname + '/' + fileName, Buffer.from(data.toString()), (error) => {
                if (error) {
                    reject(error);
                }
                console.log('created');
                resolve();
            });
        });
    }

    public async saveDeviceHistory(devicePid: string, data: any) {
        let err;
        await this.writeFile(`log_${devicePid}.txt`, data).catch((error) => err = error);
        return err;
    }

    public getDeviceHistory(devicePid: string) {
        return new Promise((resolve, reject) => {
            console.log('reading file history');
            fs.readFile(`${__dirname}/log_${devicePid}.txt`, (err, data: Buffer) => {
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