import React, { Dispatch, FC, SetStateAction, useEffect, useRef, useState } from 'react';
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

    const [isIpcAvailable, setIsIpcAvailable] = useState(false);
    const [detectionCount, setDetectionCount] = useState<number>(0);
    const detectionCountRef = useRef(detectionCount);
    const [detectionStatus, setDetectionStatus] = useState<'off' | 'on'>('off')
    const [isSystemEnabled, setSystemEnabled] = useState<boolean>(true)

    const getSystemEnabledTemplate = () => {
        return isSystemEnabled ? 'ligado' : 'desligado'
    }

    useEffect(() => {
        setIsIpcAvailable(ipcService.isAvailable());
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
            console.log('unmount detectPresence');
            if (ipcService.isAvailable()) {
                console.log('removing listeners')
                ipcService.removeAllFromPage(SERIAL_ROUTES.MODULE.init);
                // ipcService.removeMainListener(SERIAL_ROUTES.MODULE.destroy);
                // ipcService.removeMainListener(FILE_ROUTES.MODULE.destroy);
            }
        }
    }, [])

    const loadDeviceHistory = () => {
        ipcService.sendAndExpectResponse(FILE_ROUTES.GET_DEVICE_HISTORY, props.selectedPort.productId).
            subscribe(
                {
                    next: ({ body }) => {
                        console.log('historico do dispositivo: ', body);
                        detectionCountRef.current = parseInt(body);
                        setDetectionCount(parseInt(body));
                    },
                    error: (error) => console.log('error', error)
                }
            )
    }

    const exportFile = () => {
        ipcService.sendAndExpectResponse(FILE_ROUTES.POST_DEVICE_HISTORY, props.selectedPort.productId, detectionCountRef.current).
            subscribe(
                {
                    next: ({ body }) => {
                        console.log(body);
                    },
                    error: (error) => console.log('error', error)
                }
            )
    }

    const addSerialDataListener = () => {
        console.log('addSerialDataListener', props.selectedPort);

        // Adiciona o listener para receber o dado do electron
        ipcService.on(SERIAL_ROUTES.MODULE.init, 'presence_detected', (data) => {
            console.log('RECEBI DO SERIAL', data);
            let presenceStatus = data === '1' ? true : false;
            if (presenceStatus) {
                let qtd = detectionCountRef.current + 1;
                setDetectionCount(qtd);
                detectionCountRef.current = qtd;
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
        <div className={props.isVisibleDetectPresence && isIpcAvailable ? 'show detection-content' : 'hide'}>
            <div className="card">

                <div className="link-voltar">
                    <a onClick={showSelection}>Trocar porta serial</a>
                </div>

                <div>
                    <strong>Status: <span className={getSystemEnabledTemplate() ? 'ligado' : 'desligado'}>{getSystemEnabledTemplate()}</span></strong>
                    <hr></hr>
                </div>

                <div className="deteccao-section">
                    <strong>Detec????o:</strong>
                    <div className={detectionStatus + ' led'}></div>
                </div>

                <div className="qtde-section">
                    <label><span className="qtde">{detectionCount}</span> presen??as detectadas</label>
                </div>

                <div className="exportar-section">
                    <button className="btn exportar" onClick={exportFile}>
                        Exportar arquivo
                    </button>
                </div>

            </div>
        </div>
    );
}

export default DetectPresence;
