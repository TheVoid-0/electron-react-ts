import React, { FC } from 'react';
import './DetectPresence.css';
import ipcService from '../../services/ipc.service';

interface IDetectPresence {
    isVisibleDetectPresence: boolean,
    setVisibleSelectSerial: (isVibleSelectSerial: boolean) => void,
    setVisibleDetectPresence: (isVisibleDetectPresence: boolean) => void
}

const DetectPresence: FC<IDetectPresence> = (props) => {

    const testeIpc = () => {
        console.log('ipc')

        ipcService.initializeModuleListener('serial-page')
            .subscribe({
                next: () => {
                    console.log('ready');
                    ipcService.sendAndExpectResponse('serial-page-get-ports').subscribe(({ body }) => {
                        console.log('ports', body.ports);
                        ipcService.sendAndExpectResponse('serial-page-post-open-port', body.ports[0]).subscribe(({ body }) => {
                            console.log('ready', body)
                            ipcService.sendAndExpectResponse('serial-page-post-led-status', '@').subscribe(({ body }) => {
                                console.log('resposta post data', body)
                            })
                        })
                    })
                }, error: () => {
                    console.log('error');
                }
            })
    };

    testeIpc();

    const showSelection = () => {
        props.setVisibleDetectPresence(false);
        props.setVisibleSelectSerial(true);
    }

    let qtdeDetectada = 5;
    let statusSistema = 'desligado';
    let statusDeteccao = 'off';

    return (
        <div className={props.isVisibleDetectPresence ? 'show detection-content' : 'hide'}>
            <div className="card">

                <div className="link-voltar">
                    <a onClick={showSelection}>Trocar porta serial</a>
                </div>

                <div>
                    <strong>Status: <span className={statusSistema}>{statusSistema}</span></strong>
                    <hr></hr>
                </div>

                <div className="deteccao-section">
                    <strong>Detecção:</strong>
                    <div className={statusDeteccao + ' led'}></div>
                </div>

                <div className="qtde-section">
                    <label><span className="qtde">{qtdeDetectada}</span> presenças detectadas</label>
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
