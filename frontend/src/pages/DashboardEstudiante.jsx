// DashboardEstudiante.jsx — Panel del estudiante: publica dudas y ve su estado
// actualizarse (pendiente → en curso → completada) mediante refresco periódico
// (polling) a GET /api/dudas. Incluye un resumen amigable y chat con el tutor.

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { dudasApi } from '../api';
import FormularioDuda from '../components/FormularioDuda';
import TarjetaDuda from '../components/TarjetaDuda';

const TABS = [
  { key: '', label: 'Todas', icon: '📋' },
  { key: 'pendiente', label: 'Pendientes', icon: '⏳' },
  { key: 'en curso', label: 'En curso', icon: '💬' },
  { key: 'completada', label: 'Completadas', icon: '✅' },
];

export default function DashboardEstudiante() {
  const [perfil, setPerfil] = useState(() => {
    const saved = localStorage.getItem('educonecta_estudiante');
    return saved ? JSON.parse(saved) : null;
  });
  const [nombreInput, setNombreInput] = useState('');
  const [colegioInput, setColegioInput] = useState('');

  const [misDudas, setMisDudas] = useState([]);
  const [tab, setTab] = useState('');
  const [error, setError] = useState('');
  const [mostrarForm, setMostrarForm] = useState(false);

  const cargar = useCallback(async () => {
    if (!perfil) return;
    try {
      const data = await dudasApi.listar({ estudiante: perfil.nombre });
      setMisDudas(data);
      setError('');
    } catch {
      setError('No se pudo conectar con el backend en http://localhost:4000. ¿Está corriendo "npm run dev" en /backend?');
    }
  }, [perfil]);

  useEffect(() => {
    if (!perfil) return;
    cargar();
    const id = setInterval(cargar, 4000);
    return () => clearInterval(id);
  }, [perfil, cargar]);

  const resumen = useMemo(() => ({
    pendiente: misDudas.filter(d => d.estado === 'pendiente').length,
    'en curso': misDudas.filter(d => d.estado === 'en curso').length,
    completada: misDudas.filter(d => d.estado === 'completada').length,
  }), [misDudas]);

  const dudasFiltradas = tab ? misDudas.filter(d => d.estado === tab) : misDudas;

  function iniciar(e) {
    e.preventDefault();
    if (!nombreInput.trim()) return;
    const p = { nombre: nombreInput.trim(), colegio: colegioInput.trim() || 'No especificado' };
    localStorage.setItem('educonecta_estudiante', JSON.stringify(p));
    setPerfil(p);
  }

  if (!perfil) {
    return (
      <div>
        <div className="topbar">
          <Link to="/" className="brand"><span className="dot-mark">e</span> EduConecta</Link>
        </div>
        <div className="wrap app-shell" style={{ maxWidth: 460 }}>
          <h1 style={{ fontSize: 26 }}>¡Hola! 👋</h1>
          <p style={{ color: 'var(--ink-soft)', marginBottom: 22 }}>Antes de publicar tu duda, cuéntanos quién eres.</p>
          <form className="card" onSubmit={iniciar}>
            <div className="field">
              <label>Tu nombre</label>
              <input value={nombreInput} onChange={e => setNombreInput(e.target.value)} placeholder="Ej. Mateo Rivas" autoFocus />
            </div>
            <div className="field">
              <label>Colegio</label>
              <input value={colegioInput} onChange={e => setColegioInput(e.target.value)} placeholder="Ej. I.E. José Olaya" />
            </div>
            <button className="btn btn-amber" type="submit" style={{ width: '100%', justifyContent: 'center' }}>Comenzar →</button>
          </form>
        </div>
      </div>
    );
  }

  const yo = { nombre: perfil.nombre, rol: 'estudiante' };

  return (
    <div>
      <div className="topbar">
        <Link to="/" className="brand"><span className="dot-mark">e</span> EduConecta</Link>
        <button className="btn btn-ghost btn-small" onClick={() => { localStorage.removeItem('educonecta_estudiante'); setPerfil(null); }}>
          Cambiar de usuario
        </button>
      </div>

      <div className="wrap app-shell">
        {error && <div className="api-banner">⚠️ {error}</div>}

        <div className="main-head">
          <div>
            <h1>Hola, {perfil.nombre} 👋</h1>
            <p>Aquí puedes publicar dudas nuevas y ver cómo avanzan.</p>
          </div>
          <button className="btn btn-amber" onClick={() => setMostrarForm(true)}>+ Nueva duda</button>
        </div>

        <div className="stat-cards">
          <div className="stat-card pend">
            <span className="stat-num">{resumen.pendiente}</span>
            <span className="stat-label">Pendientes</span>
          </div>
          <div className="stat-card curso">
            <span className="stat-num">{resumen['en curso']}</span>
            <span className="stat-label">En curso</span>
          </div>
          <div className="stat-card comp">
            <span className="stat-num">{resumen.completada}</span>
            <span className="stat-label">Completadas</span>
          </div>
        </div>

        {mostrarForm && (
          <div className="modal-backdrop on" onClick={(e) => { if (e.target === e.currentTarget) setMostrarForm(false); }}>
            <div className="modal">
              <h3>Cuéntanos tu duda</h3>
              <p className="sub">Sé lo más específico posible para que un tutor pueda ayudarte mejor.</p>
              <FormularioDuda
                estudiante={perfil.nombre}
                colegio={perfil.colegio}
                onPublicada={() => { cargar(); setMostrarForm(false); setTab('pendiente'); }}
              />
              <button className="btn btn-ghost btn-small" style={{ marginTop: 14, width: '100%', justifyContent: 'center' }} onClick={() => setMostrarForm(false)}>
                Cancelar
              </button>
            </div>
          </div>
        )}

        <div className="tabs">
          {TABS.map(t => (
            <button key={t.key} className={`tab-btn ${tab === t.key ? 'on' : ''}`} onClick={() => setTab(t.key)}>
              <span>{t.icon}</span> {t.label}
              {t.key && resumen[t.key] > 0 && <span className="tab-badge">{resumen[t.key]}</span>}
            </button>
          ))}
        </div>

        {dudasFiltradas.length === 0 ? (
          misDudas.length === 0 ? (
            <div className="empty">
              <b>Aún no has publicado dudas</b>
              Cuando algo no te quede claro en clase, publícalo aquí y un tutor voluntario te ayudará.
              <div style={{ marginTop: 16 }}>
                <button className="btn btn-amber btn-small" onClick={() => setMostrarForm(true)}>Publicar mi primera duda</button>
              </div>
            </div>
          ) : (
            <div className="empty"><b>No tienes dudas en esta categoría</b>Prueba con otra pestaña arriba.</div>
          )
        ) : (
          dudasFiltradas.map(d => <TarjetaDuda key={d.id} duda={d} vista="estudiante" yo={yo} />)
        )}
      </div>
    </div>
  );
}
