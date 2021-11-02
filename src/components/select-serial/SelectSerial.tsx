import React, { useEffect, useRef, useState } from "react";
import ipcService from "../../services/ipc.service";

function SelectPresence() {
    const [isIpcAvailable, setIpcAvailable] = useState(false);
    const isIpcAvailableRef = useRef(isIpcAvailable);

    useEffect(() => {
        console.log('ipcAvailableRef', isIpcAvailableRef.current);
        setIpcAvailable(ipcService.isAvailable())
        console.log('ipcAvailableRef', isIpcAvailableRef.current);
        if (isIpcAvailableRef.current) {
            ipcService.initializeModuleListener('serial-module').subscribe(
                {
                    next: () => {
                        console.log('serial-module ready');
                    },
                    error: (err) => console.log(err, 'serial-module error')
                }
            )
        }
    }, [])

    return (
        <div>
            {isIpcAvailable ?
                <div>Selecionar Serial funcionando!</div>
                :
                <div>O módulo de comunicação com o desktop não está disponível! </div>}
        </div>
    );
}

export default SelectPresence