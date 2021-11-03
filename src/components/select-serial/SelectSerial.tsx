import React, { useEffect, useRef, useState } from "react";
import ipcService from "../../services/ipc.service";
import './SelectSerial.css';

function SelectPresence() {
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

    return (
        <div>
            {isIpcAvailable ?
                <div>
                    <p>Selecione uma porta serial para estabelecer a conexão</p>
                    <div className="conectar-section">
                        <button className="btn">
                            Conectar
                        </button>
                    </div>
                </div>
                :
                <div>O módulo de comunicação com o desktop não está disponível! </div>
            }            
        </div>
    );
}

export default SelectPresence