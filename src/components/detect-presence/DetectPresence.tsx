import React, { Dispatch, FC, SetStateAction, useEffect, useState } from 'react';
import './DetectPresence.css';
import ipcService from '../../services/ipc.service';
import { SERIAL_ROUTES } from '../../@common/routes/serial-routes';
import { FILE_ROUTES } from '../../@common/routes/file-routes';

interface IDetectPresence {
    isVisibleDetectPresence: boolean,
    setVisibleSelectSerial: Dispatch<SetStateAction<boolean>>
    setVisibleDetectPresence: Dispatch<SetStateAction<boolean>>
    selectedPort: any
}

const DetectPresence: FC<IDetectPresence> = (props) => {


    const showSelection = () => {
        props.setVisibleDetectPresence(false);
        props.setVisibleSelectSerial(true);
    }

    const [detectionCount, setDetectionCount] = useState<number>(0);
    const [detectionStatus, setDetectionStatus] = useState<'off' | 'on'>('off')
    const [isSystemEnabled, setSystemEnabled] = useState<boolean>(false)

    const getSystemEnabledTemplate = () => {
        return isSystemEnabled ? 'ligado' : 'desligado'
    }

    useEffect(() => {
        if (ipcService.isAvailable()) {

            ipcService.initializeModuleListener(SERIAL_ROUTES.MODULE.init)
                .subscribe(
                    {
                        next: ({ body }) => {
                            console.log(body);
                            addSerialDataListener();
                        },
                        error: (error) => console.log(error)
                    }
                );
            ipcService.initializeModuleListener(FILE_ROUTES.MODULE.init)
                .subscribe(
                    {
                        next: ({ body }) => {
                            console.log(body);
                            loadDeviceHistory();
                        },
                        error: (error) => console.log(error)
                    }
                );
        }

        return () => {
            console.log('unmount selectSerial');
            if (ipcService.isAvailable()) {
                ipcService.removeAllFromPage(SERIAL_ROUTES.MODULE.init);
                ipcService.removeMainListener(SERIAL_ROUTES.MODULE.destroy);
                ipcService.removeMainListener(FILE_ROUTES.MODULE.destroy);
            }
        }
    }, [])

    const loadDeviceHistory = () => {
        ipcService.sendAndExpectResponse(FILE_ROUTES.GET_DEVICE_HISTORY, props.selectedPort.productId)
    }

    const addSerialDataListener = () => {
        console.log('addSerialDataListener', props.selectedPort);

        // Adiciona o listener para receber o dado do electron
        ipcService.on(SERIAL_ROUTES.MODULE.init, 'presence_detected', (data) => {
            console.log('RECEBI DO SERIAL', data);
            let presenceStatus = data === '1' ? true : false;
            if (presenceStatus) {
                let qtd = detectionCount + 1;
                setDetectionCount(qtd);
                setDetectionStatus('on');
            } else {
                setDetectionStatus('off');
            }
        });

        // Envia para o electron um sinal para preparar o listener da porta serial
        ipcService.sendAndExpectResponse(SERIAL_ROUTES.POST_SET_DATA_LISTENER, undefined, { path: props.selectedPort.path })
            .subscribe(
                {
                    next: () => {
                        console.log('Listeners adicionados!')
                    },
                    error: (error) => {
                        console.log(error)
                    }
                }
            );
    }



    return (
        <div className={props.isVisibleDetectPresence ? 'show detection-content' : 'hide'}>
            <div className="card">

                <div className="link-voltar">
                    <a onClick={showSelection}>Trocar porta serial</a>
                </div>

                <div>
                    <strong>Status: <span className={getSystemEnabledTemplate() ? 'ligado' : 'desligado'}>{getSystemEnabledTemplate()}</span></strong>
                    <hr></hr>
                </div>

                <div className="deteccao-section">
                    <strong>Detecção:</strong>
                    <div className={detectionStatus + ' led'}></div>
                </div>

                <div className="qtde-section">
                    <label><span className="qtde">{detectionCount}</span> presenças detectadas</label>
                </div>

                <div className="exportar-section">
                    <button className="btn exportar">
                        {/* todo: fazer exportar o arquivo txt */}
                        Exportar arquivo
                    </button>
                </div>

            </div>
        </div>
    );
}

export default DetectPresence;
