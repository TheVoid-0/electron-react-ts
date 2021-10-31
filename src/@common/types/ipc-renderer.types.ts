
/**
 * OBS: Devido a ferramenta de build do react ser pouco flexível e muito complexa para configurar maneiras de compilações diferentes da qual ela já vem como padrão,
 * os tipos do IpcRenderer foram movidos para dentro do src/ do react, assim ele consegue compilar e usar os tipos, porém aqui ficamos sem os tipos definidos pelo electron:
 * Electron.IpcRenderer, assim para lembrarmos que o IpcRenderer é injetado na aplicação pelo o electron, o namespace dele foi criado aqui
 */
declare namespace Electron {
    type IpcRenderer = any;
}

export type IpcResponse = {
    body: any
}

export type IpcUnsubscribe = () => void;

/**
 * Classe que representa o IpcRenderer e as funções disponíveis para serem utilizadas pelo "front"
 * 
 * NOTES:
 * A implementação de uma classe abstrata com comportamento padrão nulo, nos ajuda, nesse caso, a conseguir manipular diferentes objetos dependendo da disponibilidade do ipc, sem comprometer o restante do código, já que os objetos que estendem essa classe terão as propriedades necessárias. 
 * Isso também evita expor esses diferentes objetos diretamente no código, fazendo com que o código externo apenas se preocupe em lidar com o tipo da classe abstrata, enquanto as derivações se preocupam em implementar as funções da maneira que for necessária.
 * 
 * A criação de dois tipos de classes derivadas de um tipo comum serve para impedir uma falha no código, já que o carregamento desse módulo específico é dependente da plataforma e em caso de não estar disponível, um "substituto" precisa ser inserido para continuar com a execução.
 * 
 * A utilização de um método "factory" para retornar uma instância de implementação da classe abstrata, trás como benefício a fácil manutenção de qual classe é instanciada sem impactar diretamente a chamada do código externo, pois onde teria um "new" especificando uma classe fixa, pode-se usar a parametrização da função para alterar em todos os lugares necessários ao mesmo tempo.
 * 
 * As funções não podem ficar no prototype (tipo do objeto) pois esse "tipo" não será passado pela bridge API, resultando na perda de toda a informação armazenada no tipo, dessa forma, é necessário guardar as funções em propriedades da própria instância do objeto, onde estarão disponíveis independentemente da classe.
 */
export abstract class IpcRenderer {
    public readonly on = (channel: string, listener: (...args: any[]) => void): IpcUnsubscribe => {
        throw new Error('Not implemented')
    }

    public readonly removeAllListeners = (channel: string): void => {
        throw new Error('Not implemented')
    }

    public readonly send = (channel: string, ...data: any[]): void => {
        throw new Error('Not implemented')
    }

    public abstract isAvailable: ()  => boolean;

    public static createIpcRenderer(ipcRenderer?: Electron.IpcRenderer): IpcRenderer {
        if (!ipcRenderer) {
            return new IpcRendererNotAvailable();
        }
        return new IpcRendederAvailable(ipcRenderer);
    }
}

class IpcRendederAvailable extends IpcRenderer {
    // private ipcRenderer: Electron.IpcRenderer

    public on;
    public removeAllListeners;
    public send
    public readonly isAvailable

    constructor(ipcRenderer: Electron.IpcRenderer) {
        super()
        this.on = (channel: string, listener: (...args: any[]) => void): IpcUnsubscribe => {
            // Encapsulando o listener em uma função que passará somente os argumentos, não expondo o evento no renderer
            // O termo 'subscription' faz referência ao que recebemos ao se inscrevermos em um observable, pois essa 'subscription' pode ser usada para remover o listener
            const subscription = (event: any, ...args: any[]) => listener(...args);
            ipcRenderer.on(channel, subscription);

            // Retorna uma função para se 'desinscrevermos' ou seja, remover o listener usando sua 'subscription'
            return () => {
                ipcRenderer.removeListener(channel, subscription);
            }
        }

        this.removeAllListeners = (channel: string): void => {
            ipcRenderer.removeAllListeners(channel);
        }

        this.send = (channel: string, ...data: any[]) => {
            ipcRenderer.send(channel, data);
        }

        this.isAvailable = (): boolean => { return true };
    }

}

class IpcRendererNotAvailable extends IpcRenderer {
    public readonly isAvailable = (): boolean => { return false };
}