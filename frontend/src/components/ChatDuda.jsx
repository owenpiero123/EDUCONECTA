// ChatDuda.jsx — Chat simple entre el estudiante y el tutor asignado a una duda.
// Se habilita apenas la duda deja de estar "pendiente" (ya tiene tutor asignado).
// Hace polling ligero mientras el chat está abierto para simular mensajería en vivo.

import { useEffect, useRef, useState } from 'react';
import { dudasApi } from '../api';

function fmtHora(ts) {
  return new Date(ts).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
}

export default function ChatDuda({ dudaId, yo }) {
  const [mensajes, setMensajes] = useState([]);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [cargado, setCargado] = useState(false);
  const bodyRef = useRef(null);

  useEffect(() => {
    let activo = true;
    async function cargar() {
      try {
        const data = await dudasApi.mensajes(dudaId);
        if (activo) { setMensajes(data); setCargado(true); }
      } catch {
        /* silencioso: el chat no es crítico si falla una lectura puntual */
      }
    }
    cargar();
    const id = setInterval(cargar, 3000);
    return () => { activo = false; clearInterval(id); };
  }, [dudaId]);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [mensajes]);

  async function enviar(e) {
    e.preventDefault();
    const t = texto.trim();
    if (!t) return;
    setEnviando(true);
    setTexto('');
    try {
      const nuevo = await dudasApi.enviarMensaje(dudaId, { autor: yo.nombre, rol: yo.rol, texto: t });
      setMensajes(prev => [...prev, nuevo]);
    } catch {
      setTexto(t); // devolver el texto si falló el envío
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="chat-box">
      <div className="chat-box-body" ref={bodyRef}>
        {!cargado ? (
          <p className="chat-empty">Cargando conversación…</p>
        ) : mensajes.length === 0 ? (
          <p className="chat-empty">Escribe para coordinar el horario o resolver dudas antes de la videollamada.</p>
        ) : (
          mensajes.map(m => (
            <div key={m.id} className={`chat-bubble ${m.rol === yo.rol ? 'me' : 'them'}`}>
              {m.rol !== yo.rol && <span className="chat-author">{m.autor}</span>}
              {m.texto}
              <small>{fmtHora(m.fecha)}</small>
            </div>
          ))
        )}
      </div>
      <form className="chat-box-input" onSubmit={enviar}>
        <input
          value={texto}
          onChange={e => setTexto(e.target.value)}
          placeholder="Escribe un mensaje..."
          disabled={enviando}
        />
        <button className="btn btn-teal btn-small" type="submit" disabled={enviando || !texto.trim()}>Enviar</button>
      </form>
    </div>
  );
}
