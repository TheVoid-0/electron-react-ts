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
}