import * as fs from 'fs';
import { Service } from 'typedi';

@Service()
export class FileService {

    constructor() {}

    /**
     * 
     * @param devicePid Pid do dispositivo
     */
    public createFile(devicePid: string) {
        fs.appendFile('log_' + devicePid  + '.txt', 'teste\n', (error) => {
            if (error) throw error;
            console.log('created');
        })
    }
}