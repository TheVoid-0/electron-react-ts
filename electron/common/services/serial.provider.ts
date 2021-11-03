import SerialPort = require('serialport');
import { AsyncSubject, Observable, Subscription } from 'rxjs'
import { Service } from 'typedi';

// type SerialPort = typeof import('serialport')
interface SerialDataSubscriptions {
    [key: string]: { subscription: Subscription, data: any }
}
@Service()
export class SerialProvider {

    private serialPort: typeof SerialPort
    private portOpened: SerialPort | undefined;
    private portReadyASubject: AsyncSubject<SerialPort> = new AsyncSubject<SerialPort>();
    /**
     * Dados que estão pendentes para envio na porta serial
     */
    private serialDataWaiting: SerialDataSubscriptions = {}
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

    // TODO: Adicionar handling de duas ou mais portas abertas
    public async open(path: string, options?: SerialPort.OpenOptions): Promise<SerialPort> {
        if (this.portOpened != undefined && this.portOpened.path === path) {
            console.log('porta já esta aberta', this.portOpened.path);
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
                    this.portReadyASubject.next(this.portOpened);
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

    // TODO: Testar o cancelamento das inscrições e a disponibilidade da subscription após o subscriber.complete()
    // TODO: Verificar se os parametros data e dataKey não ficarão indisponíveis ao rodar o cb do subscribe após eles serem sobrescritos
    /**
     * OBS: O Observable não será completado até que uma porta serial seja aberta, ou seja, ao enviar um dado
     * por esta função, esse dado ficará esperando uma porta ser aberta para então completar o Observable.
     * Se uma porta já estiver aberta no momento que essa função for chamada, o dado será escrito imediatamente.
     * É importante notar que se uma porta nunca for aberta, a função ficará aguardando para escrever o dado por tempo
     * indeterminado, para cancelar a pendência, use a função: {@link cancelDataSend}.
     * @param data Dados para serem escritos na porta serial
     * @param dataKey Chave para identificar o dado que está sendo enviado, será usada para cancelar o envio se estiver pendente
     * ou saber se o envio já foi realizado em um momento futuro, se nenhuma chave for dada as informações não serão guardadas.
     * @returns Um Observable que completa após a tentativa de escrever na porta serial
     */
    public sendData(data: string, dataKey?: string): Observable<void> {
        return new Observable<void>(subscriber => {
            let sub = this.isPortReady().subscribe(port => {

                // port.setEncoding('utf-8');
                console.log('escrevendo na serial...');
                let buffer = Buffer.from(data);
                console.log('buffer vai escrever: ', buffer);
                port.write(buffer, (error) => {
                    if (error) {
                        console.log(error);
                        subscriber.error(error);
                    } else {
                        subscriber.next();
                    }

                    if (dataKey && sub) {
                        this.serialDataWaiting[dataKey]?.subscription.unsubscribe();
                        delete this.serialDataWaiting[dataKey];
                    }
                    subscriber.complete();
                });
            });

            // Verifica se a subscription ainda está ativa para deixá-la na lista de pendências
            if (sub) {
                console.log('subscription alive')
                this.serialDataWaiting[dataKey ? dataKey : 'lastData'] = { subscription: sub, data: data };
            }
        });

    }

    public closePort() {
        this.portOpened?.close();
    }

    /**
     * Cancela todos os envios pendentes na porta serial ou somente o especificado.
     * 
     * Para verificar se um dado específico já foi enviado ou não use: {@link isDataPending}
     * @param dataKey chave do dado que será cancelado o envio
     */
    public cancelDataSend(dataKey?: string) {
        if (dataKey) {
            this.serialDataWaiting[dataKey].subscription.unsubscribe();
            delete this.serialDataWaiting[dataKey];
        } else {
            for (const key in this.serialDataWaiting) {
                this.serialDataWaiting[key]?.subscription.unsubscribe();
            }
            this.serialDataWaiting = {};
        }
    }

    /**
     * 
     * @param dataKey chave do dado que será verificado a pendência
     * @returns false se o dado já foi enviado, true caso contrário
     */
    public isDataPending(dataKey: string) {
        return !!this.serialDataWaiting[dataKey];
    }

    public isPortReady(): Observable<SerialPort> {
        return this.portReadyASubject.asObservable();
    }
}
