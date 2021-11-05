import React, { ChangeEvent, Dispatch, FC, SetStateAction, useEffect, useState } from "react";
import { SERIAL_ROUTES } from "../../@common/routes/serial-routes";
import ipcService from "../../services/ipc.service";
import './SelectSerial.css';

// TODO: Adicionar select de baudRate
// TODO: Ajustar o botão de teste para testar a comunicação com a porta serial
interface ISelectSerial {
    isVisibleSelectSerial: boolean,
    setVisibleSelectSerial: Dispatch<SetStateAction<boolean>>
    setVisibleDetectPresence: Dispatch<SetStateAction<boolean>>
    selectedPort: any //{ path: string, productId: string }
    setSelectedPort: Dispatch<SetStateAction<any>>
}

const SelectSerial: FC<ISelectSerial> = (props) => {
    const [isIpcAvailable, setIpcAvailable] = useState(false);
    const [isLoadingPorts, setLoadingPorts] = useState(false);

    const [comPorts, setComPorts] = useState([]);

    // loadings
    const [isBtnConectarLoading, setBtnConectarLoading] = useState(false);

    useEffect(() => {
        console.log('mount selectSerial');
        const isIpcAvailable = ipcService.isAvailable();
        setIpcAvailable(isIpcAvailable)
        if (isIpcAvailable) {
            ipcService.initializeModuleListener(SERIAL_ROUTES.MODULE.init).subscribe(
                {
                    next: () => {
                        console.log('serial-module ready');
                        getPorts()
                    },
                    error: (err) => console.log(err, 'serial-module error')
                }
            )
        }
        return () => {
            console.log('unmount selectSerial');
            if (isIpcAvailable) {
                ipcService.removeMainListener(SERIAL_ROUTES.MODULE.destroy)
            }
        }
    }, []);

    const sendSerialData = () => {
        ipcService.sendAndExpectResponse(SERIAL_ROUTES.POST_DATA, 'teste', 'COM3').subscribe(
            {
                next: (data) => {
                    console.log('sendSerialData: ', data);
                },
                error: (error) => console.log('error', error)
            }
        )
    }

    const getPorts = () => {
        setLoadingPorts(true);
        ipcService.sendAndExpectResponse(SERIAL_ROUTES.GET_PORTS).subscribe(
            {
                next: ({ body }) => {
                    console.log('ports: ', body);
                    setComPorts(body.ports);
                    setLoadingPorts(false);
                },
                error: (err) => {
                    console.log(err);
                    setLoadingPorts(false);
                }
            }
        )
    }

    const openPort = () => {
        setBtnConectarLoading(true);
        ipcService.sendAndExpectResponse(SERIAL_ROUTES.POST_OPEN_PORT, props.selectedPort.path)
            .subscribe({
                next: () => {
                    console.log('Porta aberta!');
                    setBtnConectarLoading(false);
                    showDetection();
                },
                error: (error) => {
                    setBtnConectarLoading(false)
                    console.log('Não foi possível abrir a porta: ', error) // TODO: Colocar mensagem de erro na tela
                }
            })
    }

    const closePort = () => {
        setBtnConectarLoading(true);
        ipcService.sendAndExpectResponse(SERIAL_ROUTES.POST_CLOSE_PORT, props.selectedPort.path)
            .subscribe({
                next: () => {
                    console.log('Porta Fechada!');
                    setBtnConectarLoading(false);
                },
                error: (error) => {
                    console.log('Não foi possível fechar a porta: ', error) // TODO: Colocar mensagem de erro na tela
                    setBtnConectarLoading(false)
                }
            })
    }

    const showDetection = () => {
        props.setVisibleSelectSerial(false);
        props.setVisibleDetectPresence(true);
    }

    const handleSelectChange = (event: ChangeEvent<HTMLSelectElement>) => {
        console.log('handleSelectChange: ', event.target.value, props.selectedPort);
        props.setSelectedPort(comPorts.find((port: any) => event.target.value === port.path));
    }

    return (
        <div className={props.isVisibleSelectSerial ? 'show selection-content' : 'hide'}>
            <div className="card">
                {isIpcAvailable ?
                    <div>
                        <p>Selecione uma porta serial para estabelecer a conexão</p>

                        <div>
                            <small>Portas disponíveis:</small>
                            <select value={props.selectedPort.path} onChange={handleSelectChange}>
                                <option value="0" selected>{comPorts.length > 0 ? 'Selecione uma porta...' : 'Nenhuma porta disponível!'}</option>
                                {comPorts.map((port: any) => (<option value={port.path}>{`${port.path} ${port.productId}`}</option>))}
                            </select>
                        </div>

                        <p className="reload-ports" onClick={getPorts}>{isLoadingPorts ? 'Carregando portas...' : 'Recarregar portas'}</p>

                        <div className="conectar-section">
                            <button className="btn conectar" disabled={isBtnConectarLoading} onClick={openPort}>
                                {isBtnConectarLoading ? 'Aguarde...' : 'Conectar'}
                            </button>
                            <button className="btn" disabled={isBtnConectarLoading} onClick={closePort}>
                                {isBtnConectarLoading ? 'Aguarde...' : 'Desconectar'}
                            </button>
                            <button onClick={sendSerialData}>TESTE</button>
                        </div>
                    </div>
                    :
                    <div>O módulo de comunicação com o desktop não está disponível! </div>
                }
            </div>
        </div>
    );
}

export default SelectSerial