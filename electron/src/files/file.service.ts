import * as fs from 'fs';
import { Service } from 'typedi';

@Service()
export class FileService {

    constructor() { }

    public writeFile(fileName: string, data: Buffer | string) {
        fs.appendFile(__dirname + '/' + fileName, 'teste\n', (error) => {
            if (error) throw error;
            console.log('created');
        })
    }

    public getDeviceHistory(devicePid: string) {
        return new Promise((resolve, reject) => {
            console.log('reading file history');
            fs.readFile(`${__dirname}/log_${devicePid}.txt`, (err, data: Buffer) => {
                if (err) {
                    console.log(err);
                    reject(err);
                }
                console.log(data);
                resolve(data);
            });
        });
    }
}