// pages/DashboardTutor.jsx — Panel del tutor: ve dudas activas, filtra por
// materia y estado con pestañas amigables, acepta tutorías y chatea con
// el estudiante una vez asignado.

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { dudasApi } from '../api';
import TarjetaDuda from '../components/TarjetaDuda';

const MATERIAS = ['Matemáticas', 'Ciencias', 'Lenguaje'];

const TABS = [
  { key: 'pendiente', label: 'Por atender', icon: '🙋' },
  { key: 'en curso', label: 'Mis tutorías activas', icon: '💬' },
  { key: 'completada', label: 'Historial', icon: '✅' },
];

export default function DashboardTutor() {
  const [perfil, setPerfil] = useState(() => {
    const saved = localStorage.getItem('educonecta_tutor');
    return saved ? JSON.parse(saved) : null;
  });
  const [nombreInput, setNombreInput] = useState('');
  const [univInput, setUnivInput] = useState('');
  const [areaInput, setAreaInput] = useState(MATERIAS[0]);

  const [dudas, setDudas] = useState([]);
  const [filtroMateria, setFiltroMateria] = useState('');
  const [tab, setTab] = useState('pendiente');
  const [aceptandoId, setAceptandoId] = useState(null);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    if (!perfil) return;
    try {
      const params = {};
      if (filtroMateria) params.materia = filtroMateria;
      const data = await dudasApi.listar(params);
      setDudas(data);
      setError('');
    } catch {
      setError('No se pudo conectar con el backend en http://localhost:4000. ¿Está corriendo "npm run dev" en /backend?');
    }
  }, [perfil, filtroMateria]);

  useEffect(() => {
    if (!perfil) return;
    cargar();
    const id = setInterval(cargar, 4000);
    return () => clearInterval(id);
  }, [perfil, cargar]);

  function iniciar(e) {
    e.preventDefault();
    if (!nombreInput.trim()) return;
    const p = { nombre: nombreInput.trim(), universidad: univInput.trim() || 'No especificada', area: areaInput };
    localStorage.setItem('educonecta_tutor', JSON.stringify(p));
    setPerfil(p);
    setFiltroMateria(areaInput);
  }

  async function aceptar(duda) {
    setAceptandoId(duda.id);
    try {
      await dudasApi.aceptar(duda.id, { tutor: perfil.nombre, universidad: perfil.universidad });
      await cargar();
      setTab('en curso');
    } catch {
      setError('Esa duda ya fue tomada por otro tutor, o el backend no respondió.');
    } finally {
      setAceptandoId(null);
    }
  }

  async function completar(duda) {
    await dudasApi.completar(duda.id);
    cargar();
  }

  const resumen = useMemo(() => ({
    pendiente: dudas.filter(d => d.estado === 'pendiente').length,
    'en curso': dudas.filter(d => d.estado === 'en curso' && d.tutor === perfil?.nombre).length,
    completada: dudas.filter(d => d.estado === 'completada' && d.tutor === perfil?.nombre).length,
  }), [dudas, perfil]);

  const dudasFiltradas = useMemo(() => {
    if (tab === 'pendiente') return dudas.filter(d => d.estado === 'pendiente');
    return dudas.filter(d => d.estado === tab && d.tutor === perfil?.nombre);
  }, [dudas, tab, perfil]);

  if (!perfil) {
    return (
      <div>
        <div className="topbar">
          <Link to="/" className="brand"><span className="dot-mark">e</span> EduConecta</Link>
        </div>
        <div className="wrap app-shell" style={{ maxWidth: 460 }}>
          <h1 style={{ fontSize: 26 }}>¡Gracias por sumarte! 🙌</h1>
          <p style={{ color: 'var(--ink-soft)', marginBottom: 22 }}>Cuéntanos quién eres y en qué área ayudas.</p>
          <form className="card" onSubmit={iniciar}>
            <div className="field">
              <label>Tu nombre</label>
              <input value={nombreInput} onChange={e => setNombreInput(e.target.value)} placeholder="Ej. Diego Ramírez" autoFocus />
            </div>
            <div className="field">
              <label>Universidad</label>
              <input value={univInput} onChange={e => setUnivInput(e.target.value)} placeholder="Ej. Universidad Nacional de Ingeniería" />
            </div>
            <div className="field">
              <label>Área de dominio</label>
              <select value={areaInput} onChange={e => setAreaInput(e.target.value)}>
                {MATERIAS.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <button className="btn btn-teal" type="submit" style={{ width: '100%', justifyContent: 'center' }}>Comenzar →</button>
          </form>
        </div>
      </div>
    );
  }

  const yo = { nombre: perfil.nombre, rol: 'tutor' };

  return (
    <div>
      <div className="topbar">
        <Link to="/" className="brand"><span className="dot-mark">e</span> EduConecta</Link>
        <button className="btn btn-ghost btn-small" onClick={() => { localStorage.removeItem('educonecta_tutor'); setPerfil(null); }}>
          Cambiar de usuario
        </button>
      </div>

      <div className="wrap app-shell">
        {error && <div className="api-banner">⚠️ {error}</div>}

        <div className="main-head">
          <div>
            <h1>Hola, {perfil.nombre} 🙌</h1>
            <p>{perfil.universidad} · Área: {perfil.area}</p>
          </div>
          <select className="area-select" value={filtroMateria} onChange={e => setFiltroMateria(e.target.value)}>
            <option value="">Todas las materias</option>
            {MATERIAS.map(m => <option key={m}>{m}</option>)}
          </select>
        </div>

        <div className="stat-cards">
          <div className="stat-card pend">
            <span className="stat-num">{resumen.pendiente}</span>
            <span className="stat-label">Esperando tutor</span>
          </div>
          <div className="stat-card curso">
            <span className="stat-num">{resumen['en curso']}</span>
            <span className="stat-label">Mis tutorías activas</span>
          </div>
          <div className="stat-card comp">
            <span className="stat-num">{resumen.completada}</span>
            <span className="stat-label">Completadas por mí</span>
          </div>
        </div>

        <div className="tabs">
          {TABS.map(t => (
            <button key={t.key} className={`tab-btn ${tab === t.key ? 'on' : ''}`} onClick={() => setTab(t.key)}>
              <span>{t.icon}</span> {t.label}
              {resumen[t.key] > 0 && <span className="tab-badge">{resumen[t.key]}</span>}
            </button>
          ))}
        </div>

        {dudasFiltradas.length === 0 ? (
          <div className="empty">
            <b>
              {tab === 'pendiente' && 'No hay dudas esperando tutor'}
              {tab === 'en curso' && 'No tienes tutorías activas'}
              {tab === 'completada' && 'Aún no completas tutorías'}
            </b>
            {tab === 'pendiente' && 'En cuanto un estudiante publique una duda en tu materia, aparecerá aquí.'}
            {tab === 'en curso' && 'Acepta una duda pendiente para comenzar a ayudar.'}
            {tab === 'completada' && 'Cuando termines una sesión y la marques como completada, se verá aquí.'}
          </div>
        ) : (
          dudasFiltradas.map(d => (
            <TarjetaDuda
              key={d.id}
              duda={d}
              vista="tutor"
              yo={yo}
              aceptando={aceptandoId === d.id}
              onAceptar={() => aceptar(d)}
              onCompletar={() => completar(d)}
            />
          ))
        )}
      </div>
    </div>
  );
}
