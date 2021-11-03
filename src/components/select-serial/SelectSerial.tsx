import React, { Dispatch, FC, MouseEvent, SetStateAction, useEffect, useRef, useState } from "react";
import { SERIAL_ROUTES } from "../../@common/routes/serial-routes";
import ipcService from "../../services/ipc.service";
import './SelectSerial.css';

interface ISelectSerial {
    isVisibleSelectSerial: boolean,
    setVisibleSelectSerial: Dispatch<SetStateAction<boolean>>
    setVisibleDetectPresence: Dispatch<SetStateAction<boolean>>
    selectedPort: string
    setSelectedPort: Dispatch<SetStateAction<string>>
}

const SelectSerial: FC<ISelectSerial> = (props) => {
    const [isIpcAvailable, setIpcAvailable] = useState(false);

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

    const getPorts = () => {
        ipcService.sendAndExpectResponse(SERIAL_ROUTES.GET_PORTS).subscribe(
            {
                next: ({ body }) => {
                    console.log('ports: ', body);
                    setComPorts(body.ports);
                },
                error: (err) => console.log(err)
            }
        )
    }

    const openPort = () => {
        setBtnConectarLoading(true);
        ipcService.sendAndExpectResponse(SERIAL_ROUTES.POST_OPEN_PORT, props.selectedPort)
            .subscribe({
                next: () => {
                    console.log('Porta aberta!');
                    addSerialDataListener()
                },
                error: (error) => {
                    setBtnConectarLoading(false)
                    console.log('Não foi possível abrir a porta: ', error) // TODO: Colocar mensagem de erro na tela
                }
            })
    }

    const addSerialDataListener = () => {
        ipcService.sendAndExpectResponse(SERIAL_ROUTES.POST_SET_DATA_LISTENER, props.selectedPort)
            .subscribe(
                {
                    next: () => {
                        console.log('Listeners adicionados!')
                        setBtnConectarLoading(false);
                        showDetection();
                    },
                    error: (error) => {
                        console.log(error)
                        setBtnConectarLoading(false)
                    }
                }
            )
    }

    const closePort = () => {
        setBtnConectarLoading(true);
        ipcService.sendAndExpectResponse(SERIAL_ROUTES.POST_CLOSE_PORT, props.selectedPort)
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

    return (
        <div className={props.isVisibleSelectSerial ? 'show selection-content' : 'hide'}>
            <div className="card">
                {isIpcAvailable ?
                    <div>
                        <p>Selecione uma porta serial para estabelecer a conexão</p>

                        <div>
                            <small>Portas disponíveis:</small>
                            <select value={props.selectedPort} onChange={(event) => { props.setSelectedPort(event.target.value) }}>
                                <option value="0" selected>{comPorts.length > 0 ? 'Selecione uma porta...' : 'Nenhuma porta disponível!'}</option>
                                {comPorts.map((port: any) => (<option>{port.path}</option>))}
                            </select>
                        </div>

                        <div className="conectar-section">
                            <button className="btn" disabled={isBtnConectarLoading} onClick={openPort}>
                                {isBtnConectarLoading ? 'Aguarde...' : 'Conectar'}
                            </button>
                            <button className="btn" disabled={isBtnConectarLoading} onClick={closePort}>
                                {isBtnConectarLoading ? 'Aguarde...' : 'Desconectar'}
                            </button>
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