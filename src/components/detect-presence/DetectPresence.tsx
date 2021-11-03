import React, { Dispatch, FC, SetStateAction, useEffect } from 'react';
import './DetectPresence.css';
import ipcService from '../../services/ipc.service';

interface IDetectPresence {
    isVisibleDetectPresence: boolean,
    setVisibleSelectSerial: Dispatch<SetStateAction<boolean>>
    setVisibleDetectPresence: Dispatch<SetStateAction<boolean>>
}

const DetectPresence: FC<IDetectPresence> = (props) => {


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
