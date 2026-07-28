// TarjetaDuda.jsx — La tarjeta visual que muestra la materia, descripción,
// las fotos adjuntas, un stepper de progreso (Pendiente → En curso →
// Completada), las acciones disponibles y, una vez asignado un tutor, un
// chat para coordinar la sesión.

import { useState } from 'react';
import ChatDuda from './ChatDuda';
import { imagenUrl } from '../api';

function fmtFecha(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString('es-PE', { day: 'numeric', month: 'short' }) +
    ' · ' + d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
}

const ESTADO_TAG = {
  pendiente: { label: 'Pendiente', cls: 'tag-pend' },
  'en curso': { label: 'En curso', cls: 'tag-curso' },
  completada: { label: 'Completada', cls: 'tag-comp' },
};

const PASOS = ['pendiente', 'en curso', 'completada'];
const PASO_LABEL = { pendiente: 'Publicada', 'en curso': 'Tutor asignado', completada: 'Sesión realizada' };

function Stepper({ estado }) {
  const idx = PASOS.indexOf(estado);
  return (
    <div className="stepper">
      {PASOS.map((p, i) => (
        <div key={p} className={`stepper-item ${i <= idx ? 'done' : ''} ${i === idx ? 'current' : ''}`}>
          <span className="stepper-dot" />
          <span className="stepper-label">{PASO_LABEL[p]}</span>
          {i < PASOS.length - 1 && <span className="stepper-line" />}
        </div>
      ))}
    </div>
  );
}

export default function TarjetaDuda({ duda, vista, onAceptar, onCompletar, aceptando, yo }) {
  const [chatAbierto, setChatAbierto] = useState(false);
  const [fotoAmpliada, setFotoAmpliada] = useState(null);
  const estado = ESTADO_TAG[duda.estado] || ESTADO_TAG.pendiente;
  const puedeChatear = duda.estado !== 'pendiente';
  const numMensajes = (duda.mensajes || []).length;
  const imagenes = duda.imagenes || [];

  return (
    <div className="duda-card">
      <div className="duda-top">
        <div>
          <div className="duda-title">{duda.estudiante}{duda.colegio ? ` · ${duda.colegio}` : ''}</div>
          <div className="duda-meta">
            {vista === 'tutor'
              ? `Publicado ${fmtFecha(duda.fecha)}`
              : (duda.tutor ? `Tutor: ${duda.tutor} (${duda.universidadTutor})` : 'Buscando tutor disponible…')}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <span className="tag tag-mat">{duda.materia}</span>
          {duda.urgencia === 'Es urgente' && <span className="tag tag-urgente">Urgente</span>}
          <span className={`tag ${estado.cls}`}>{estado.label}</span>
        </div>
      </div>

      <Stepper estado={duda.estado} />

      <div className="duda-desc">{duda.descripcion}</div>

      {imagenes.length > 0 && (
        <div className="duda-images">
          {imagenes.map((src, i) => (
            <button
              type="button"
              className="duda-image-thumb"
              key={i}
              onClick={() => setFotoAmpliada(imagenUrl(src))}
              aria-label={`Ver foto ${i + 1} de la duda`}
            >
              <img src={imagenUrl(src)} alt={`Foto ${i + 1} adjunta a la duda`} />
            </button>
          ))}
        </div>
      )}

      <div className="duda-actions">
        {vista === 'tutor' && duda.estado === 'pendiente' && (
          <button className="btn btn-teal btn-small" disabled={aceptando} onClick={onAceptar}>
            {aceptando ? <span className="spinner" /> : '✓'} Aceptar tutoría
          </button>
        )}

        {duda.estado === 'en curso' && duda.enlaceReunion && (
          <a className="jitsi-btn" href={duda.enlaceReunion} target="_blank" rel="noreferrer">
            🎥 Unirse a la clase en vivo
          </a>
        )}

        {vista === 'tutor' && duda.estado === 'en curso' && (
          <button className="btn btn-ghost btn-small" onClick={onCompletar}>
            Marcar como completada
          </button>
        )}

        {puedeChatear && yo && (
          <button className="btn btn-ghost btn-small chat-toggle" onClick={() => setChatAbierto(o => !o)}>
            💬 {chatAbierto ? 'Ocultar chat' : 'Abrir chat'}
            {!chatAbierto && numMensajes > 0 && <span className="chat-count">{numMensajes}</span>}
          </button>
        )}
      </div>

      {puedeChatear && yo && chatAbierto && (
        <ChatDuda dudaId={duda.id} yo={yo} />
      )}

      {fotoAmpliada && (
        <div className="lightbox-backdrop" onClick={() => setFotoAmpliada(null)}>
          <button className="lightbox-close" onClick={() => setFotoAmpliada(null)} aria-label="Cerrar">✕</button>
          <img src={fotoAmpliada} alt="Foto ampliada de la duda" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
