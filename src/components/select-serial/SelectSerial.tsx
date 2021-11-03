import React, { Dispatch, FC, SetStateAction, useEffect, useRef, useState } from "react";
import { SERIAL_ROUTES } from "../../@common/routes/serial-routes";
import ipcService from "../../services/ipc.service";
import './SelectSerial.css';

interface ISelectSerial {
    isVisibleSelectSerial: boolean,
    setVisibleSelectSerial: Dispatch<SetStateAction<boolean>>
    setVisibleDetectPresence: Dispatch<SetStateAction<boolean>>
}

const SelectSerial: FC<ISelectSerial> = (props) => {
    const [isIpcAvailable, setIpcAvailable] = useState(false);

    const [selectedPort, setSelectedPort] = useState("");
    const [comPorts, setComPorts] = useState([]);

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
            ipcService.removeMainListener(SERIAL_ROUTES.MODULE.destroy)
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
        ipcService.sendAndExpectResponse(SERIAL_ROUTES.POST_OPEN_PORT, selectedPort)
        .subscribe({
            next: () => {
                console.log('Porta aberta!');
                // showDetection();
            }, 
            error: (error) => console.log('Não foi possível abrir a porta: ', error) // TODO: Colocar mensagem de erro na tela
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
                            <select value={selectedPort} onChange={(event) => { setSelectedPort(event.target.value) }}>
                                <option value="0" selected>{comPorts.length > 0 ? 'Selecione uma porta...' : 'Nenhuma porta disponível!'}</option>
                                {comPorts.map((port: any) => (<option>{port.path}</option>))}
                            </select>
                        </div>

                        <div className="conectar-section">
                            <button className="btn" onClick={openPort}>
                                Conectar
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