import SerialPort = require('serialport');
import { BehaviorSubject, Observable, Subject, Subscriber } from 'rxjs'

// type SerialPort = typeof import('serialport')
export class SerialProvider {

    private serialPort: typeof SerialPort
    private portOpened: SerialPort | undefined;
    private portReadyBSubject: BehaviorSubject<SerialPort | undefined> = new BehaviorSubject<SerialPort | undefined>(undefined);
    constructor() {
        this.serialPort = SerialPort;
    }

    public async findPortByPID(pid: string): Promise<SerialPort.PortInfo | undefined> {
        let ports = await this.serialPort.list();
        return ports.find((port) => port.productId === pid);

    }
    public async findPorts() {
        return await this.serialPort.list();
    }

    public async open(path: string, options?: SerialPort.OpenOptions): Promise<SerialPort> {
        if (this.portOpened?.path === path) {
            return Promise.resolve(this.portOpened);
        }
        return new Promise<SerialPort>((resolve, reject) => {
            const port: SerialPort = new SerialPort(path, options ? options : { baudRate: 19200 }, (error) => {
                if (error) {
                    console.log('Failed to open port: ' + error);
                    reject(error);
                } else {
                    console.log('Porta aberta');
                    this.portOpened = port;
                    this.portReadyBSubject.next(this.portOpened);
                    resolve(this.portOpened);
                }
            });
        });
    }

    public setReadLineParser(port: SerialPort): SerialPort.parsers.Readline {
        const parser = new SerialPort.parsers.Readline({ encoding: 'utf8', delimiter: '\n' });
        port.pipe(parser)
        return parser;
    }

    public sendData(data: string, callback?: Function): Observable<void> {
        return new Observable<void>(subscriber => {
            this.isPortReady().subscribe(port => {
                if (!port) return;

                // port.setEncoding('utf-8');
                console.log('escrevendo na serial...');
                let buffer = Buffer.from([0x40]);
                console.log('buffer vai escrever: ', buffer);
                port.write(buffer, (error) => {
                    if (error) {
                        console.log(error);
                        subscriber.error(error);
                    } else {
                        subscriber.next();
                        subscriber.complete();
                    }
                });
            });
        });

    }

    public closePort() {
        this.portOpened?.close();
    }

    public isPortReady(): Observable<SerialPort | undefined> {
        return this.portReadyBSubject.asObservable();
    }
}

export const serialProvider = new SerialProvider();