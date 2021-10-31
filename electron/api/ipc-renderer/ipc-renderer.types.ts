
export type IpcResponse = {
    body: any
}

export type IpcUnsubscribe = () => void;

/**
 * A implementação de uma classe abstrata com comportamento padrão nulo, nos ajuda, nesse caso, a conseguir manipular diferentes objetos dependendo da disponibilidade do ipc, sem comprometer o restante do código, já que os objetos que estendem essa classe terão as propriedades necessárias. 
 * Isso também evita expor esses diferentes objetos diretamente no código, fazendo com que o código externo apenas se preocupe em lidar com o tipo da classe abstrata, enquanto as derivações se preocupam em implementar as funções da maneira que for necessária.
 * 
 * A criação de dois tipos de classes derivadas de um tipo comum serve para impedir uma falha no código, já que o carregamento desse módulo específico é dependente da plataforma e em caso de não estar disponível, um "substituto" precisa ser inserido para continuar com a execução.
 * 
 * A utilização de um método "factory" para retornar uma instância de implementação da classe abstrata, trás como benefício a fácil manutenção de qual classe é instanciada sem impactar diretamente a chamada do código externo, pois onde teria um "new" especificando uma classe fixa, pode-se usar a parametrização da função para alterar em todos os lugares necessários ao mesmo tempo.
 */
export abstract class IpcRenderer {
    public on(channel: string, listener: (...args: any[]) => void): IpcUnsubscribe {
        return () => { }
    }

    public removeAllListeners(channel: string): void {

    }

    public send(channel: string, ...data: any[]) {

    }

    public isAvailable: boolean = false;

    public static createIpcRenderer(ipcRenderer?: Electron.IpcRenderer): IpcRenderer {
        if (!ipcRenderer) {
            return new IpcRendererNotAvailable();
        }
        return new IpcRendederAvailable(ipcRenderer);
    }
}

class IpcRendederAvailable extends IpcRenderer {
    private ipcRenderer: Electron.IpcRenderer

    constructor(ipcRenderer: Electron.IpcRenderer) {
        super();
        this.ipcRenderer = ipcRenderer;
    }

    public on(channel: string, listener: (...args: any[]) => void): IpcUnsubscribe {
        // Encapsulando o listener em uma função que passará somente os argumentos, não expondo o evento no renderer
        // O termo 'subscription' faz referência ao que recebemos ao se inscrevermos em um observable, pois essa 'subscription' pode ser usada para remover o listener
        const subscription = (event: any, ...args: any[]) => listener(...args);
        this.ipcRenderer.on(channel, subscription);

        // Retorna uma função para se 'desinscrevermos' ou seja, remover o listener usando sua 'subscription'
        return () => {
            this.ipcRenderer.removeListener(channel, subscription);
        }
    }

    public removeAllListeners(channel: string): void {
        this.ipcRenderer.removeAllListeners(channel);
    }

    public send(channel: string, ...data: any[]) {
        this.ipcRenderer.send(channel, data);
    }

    public isAvailable: boolean = true;
}

class IpcRendererNotAvailable extends IpcRenderer {
    isAvailable: boolean = false;
}