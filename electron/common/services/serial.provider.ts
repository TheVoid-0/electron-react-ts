import SerialPort = require('serialport');
import { AsyncSubject, Observable, ReplaySubject, Subscription } from 'rxjs'
import { Service } from 'typedi';

// type SerialPort = typeof import('serialport')
interface SerialDataSubscriptions {
    [key: string]: { subscription: Subscription, data: any }
}
@Service()
export class SerialProvider {

    private serialPort: typeof SerialPort
    private portsOpened: { [path: string]: { port: SerialPort, portInfo: SerialPort.PortInfo } } = {};
    private portReadyRSubject: ReplaySubject<SerialPort> = new ReplaySubject<SerialPort>();
    /**
     * Dados que estão pendentes para envio na porta serial
     */
    private serialDataWaiting: SerialDataSubscriptions = {}
    constructor() {
        this.serialPort = SerialPort;
    }

    public async findPort(findOptions: { pid?: string, path?: string }): Promise<SerialPort.PortInfo | undefined> {
        if (!findOptions.path && !findOptions.pid) {
            return undefined;
        }
        let ports = await this.serialPort.list();

        if (findOptions.path) {
            return ports.find((port) => port.path === findOptions.path);
        }

        return ports.find((port) => port.productId === findOptions.pid);

    }

    public async findPorts() {
        return await this.serialPort.list();
    }

    public async open(path: string, options?: SerialPort.OpenOptions): Promise<SerialPort> {
        // Se a porta requisita já esta aberta retorna ela
        if (this.portsOpened[path] && this.portsOpened[path].port.path === path) {
            console.log('porta já esta aberta', this.portsOpened[path].port.path);
            return Promise.resolve(this.portsOpened[path].port);
        }

        return new Promise<SerialPort>((resolve, reject) => {
            const port: SerialPort = new SerialPort(path, options ? options : { baudRate: 115200 }, async (error) => {
                if (error) {
                    console.log('Failed to open port: ' + error);
                    reject(error);
                } else {
                    console.log('Porta aberta');

                    // Passando tipo fixo no retorno do findPort pois nesse caso, como a porta já foi aberta, é impossível ele não encontrar a porta
                    this.portsOpened[path] = { port: port, portInfo: await this.findPort({ path: path }) as SerialPort.PortInfo };

                    this.portReadyRSubject.next(this.portsOpened[path].port);
                    resolve(this.portsOpened[path].port);
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
     * 
     * @param portPath O caminho da porta na qual o dado deve ser escrito. Esta será a porta que será aguardada para o observable ser completado.
     * @param data Dados para serem escritos na porta serial
     * @param dataKey Chave para identificar o dado que está sendo enviado, será usada para cancelar o envio se estiver pendente
     * ou saber se o envio já foi realizado em um momento futuro, se nenhuma chave for dada as informações não serão guardadas.
     * @returns Um Observable que completa após a tentativa de escrever na porta serial
     */
    public sendData(data: string, portPath: string, dataKey?: string): Observable<void> {
        return new Observable<void>(subscriber => {
            let sub = this.onPortReady(portPath).subscribe(port => {

                // port.setEncoding('utf-8');
                console.log('escrevendo na serial... ', data);
                let buffer = Buffer.from(data);
                console.log('buffer vai escrever: ', buffer);
                port.write(data, (error) => {
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
                    console.log('Dados escritos');
                });
            });

            // Verifica se a subscription ainda está ativa para deixá-la na lista de pendências
            if (sub) {
                console.log('subscription alive')
                this.serialDataWaiting[dataKey ? dataKey : 'lastData'] = { subscription: sub, data: data };
            }
        });

    }

    /**
     * Fecha todas as portas abertas ou somente a do caminho especificado.
     * 
     * @param path 
     */
    public closePort(path?: string) {
        return new Promise<void>((resolve, reject) => {

            // Fecha a porta no caminho especificado
            if (path) {
                if (!this.portsOpened[path]) {
                    reject('Porta não consta como aberta: ' + path);
                }
                this.portsOpened[path].port.close((error) => {
                    if (error) reject(error);
                    delete this.portsOpened[path];
                    resolve()
                });
            }

            // Se nenhum caminho foi especificado, fecha todas que encontrar
            for (const key in this.portsOpened) {
                if (this.portsOpened[key]) {
                    this.portsOpened[key].port.close((error) => {
                        if (error) reject(error);
                        delete this.portsOpened[key];
                    });
                }
            }
            resolve();
        })
    }

    /**
     * Cancela todos os envios pendentes na porta serial ou somente o especificado.
     * 
     * Para verificar se um dado específico está pendente ou não use: {@link isDataPending}
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
     * OBS: false não significa que o dado foi enviado com sucesso, mas somente que o dado não está mais pendente.
     * 
     * @param dataKey chave do dado que será verificado a pendência
     * @returns true se o dado está pendente, false caso contrário
     */
    public isDataPending(dataKey: string) {
        return !!this.serialDataWaiting[dataKey];
    }

    /**
     * Retorna a porta do caminho especificado assim que ela estiver pronta. Ficará aguardando por tempo indeterminado a porta solicitada
     * 
     * @param path caminho da porta que deseja esperar
     */
    public onPortReady(path: string): Observable<SerialPort> {
        return new Observable<SerialPort>((subscriber) => {
            console.log('onPortReady, portsOpened: ', Object.keys(this.portsOpened), 'porta desejada: ', path);
            if (this.portsOpened[path]) {
                subscriber.next(this.portsOpened[path].port);
                subscriber.complete();
                return;
            }

            console.log('Adicionando subscribe no portReadyASubject');
            let subscription = this.portReadyRSubject.asObservable().subscribe(
                {
                    next: (port) => {
                        console.log('onPortReady subscription, porta aberta: ', port.path)
                        if (port.path === path && port.isOpen) {
                            subscriber.next(port);
                            subscriber.complete();
                            subscription.unsubscribe();
                        }
                    },
                    error: (error) => {
                        console.log('subscribe:', error); 
                        subscriber.error(error); 
                        subscriber.complete();
                        subscription.unsubscribe();
                    }
                });
        });
    }
}
