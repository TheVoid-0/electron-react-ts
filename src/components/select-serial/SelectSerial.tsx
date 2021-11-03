import React, { FC, useEffect, useRef, useState } from "react";
import ipcService from "../../services/ipc.service";
import './SelectSerial.css';

interface ISelectSerial {
    isVisibleSelectSerial: boolean,
    setVisibleSelectSerial: (isVibleSelectSerial: boolean) => void,
    setVisibleDetectPresence: (isVisibleDetectPresence: boolean) => void
}

const SelectSerial: FC<ISelectSerial> = (props) => {
    const [isIpcAvailable, setIpcAvailable] = useState(false);
    const isIpcAvailableRef = useRef(isIpcAvailable);

    useEffect(() => {
        const isIpcAvailable = ipcService.isAvailable();
        setIpcAvailable(isIpcAvailable)
        isIpcAvailableRef.current = isIpcAvailable;
        if (isIpcAvailableRef.current) {
            ipcService.initializeModuleListener('serial-module').subscribe(
                {
                    next: () => {
                        console.log('serial-module ready');
                        getPorts()
                    },
                    error: (err) => console.log(err, 'serial-module error')
                }
            )
        }
    }, []);

    const getPorts = () => {
        ipcService.sendAndExpectResponse('serial-module-get-ports').subscribe(
            {
                next: ({ body }) => {
                    console.log('ports: ', body);
                },
                error: (err) => console.log(err)
            }
        )
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
                            <select>
                                <option>Selecione uma</option>
                                <option>Porta 1</option>
                                <option>Porta 2</option>
                            </select>
                        </div>

                        <div className="conectar-section">
                            <button className="btn" onClick={showDetection}>
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