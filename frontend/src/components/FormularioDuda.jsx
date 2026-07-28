// FormularioDuda.jsx — El formulario limpio para que el estudiante escriba su duda.
// Ahora también permite adjuntar hasta 4 fotos (por ejemplo, una foto del
// ejercicio o del cuaderno) para que el tutor entienda mejor el problema.
// Al publicar, hace POST /api/dudas como multipart/form-data y muestra un
// estado visual de carga ("Buscando tutor...") sin recargar la página.

import { useState, useRef } from 'react';
import { dudasApi } from '../api';

const MATERIAS = ['Matemáticas', 'Ciencias', 'Lenguaje'];
const MAX_FOTOS = 4;
const MAX_MB = 5;

export default function FormularioDuda({ estudiante, colegio, onPublicada }) {
  const [materia, setMateria] = useState(MATERIAS[0]);
  const [descripcion, setDescripcion] = useState('');
  const [urgencia, setUrgencia] = useState('Esta semana');
  const [fotos, setFotos] = useState([]); // [{file, preview}]
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  function handleFotos(e) {
    const nuevos = Array.from(e.target.files || []);
    e.target.value = ''; // permite volver a elegir el mismo archivo si se removió antes

    let mensaje = '';
    const validos = [];
    for (const file of nuevos) {
      if (!file.type.startsWith('image/')) {
        mensaje = 'Solo se permiten archivos de imagen.';
        continue;
      }
      if (file.size > MAX_MB * 1024 * 1024) {
        mensaje = `Cada foto debe pesar menos de ${MAX_MB}MB.`;
        continue;
      }
      validos.push(file);
    }

    setFotos(prev => {
      const espacioDisponible = MAX_FOTOS - prev.length;
      if (validos.length > espacioDisponible) mensaje = `Puedes adjuntar hasta ${MAX_FOTOS} fotos.`;
      const aAgregar = validos.slice(0, Math.max(0, espacioDisponible));
      const nuevasEntradas = aAgregar.map(file => ({ file, preview: URL.createObjectURL(file) }));
      return [...prev, ...nuevasEntradas];
    });

    setError(mensaje);
  }

  function quitarFoto(idx) {
    setFotos(prev => {
      const copia = [...prev];
      URL.revokeObjectURL(copia[idx].preview);
      copia.splice(idx, 1);
      return copia;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!descripcion.trim()) {
      setError('Cuéntanos qué necesitas resolver.');
      return;
    }
    setError('');
    setEnviando(true);
    try {
      const formData = new FormData();
      formData.append('estudiante', estudiante);
      formData.append('colegio', colegio || '');
      formData.append('materia', materia);
      formData.append('descripcion', descripcion);
      formData.append('urgencia', urgencia);
      fotos.forEach(f => formData.append('imagenes', f.file));

      const nueva = await dudasApi.crear(formData);

      fotos.forEach(f => URL.revokeObjectURL(f.preview));
      setDescripcion('');
      setFotos([]);
      onPublicada && onPublicada(nueva);
    } catch (err) {
      const msg = err?.response?.data?.error;
      setError(msg || 'No se pudo publicar la duda. Verifica que el backend esté corriendo.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="card" style={{ maxWidth: 560 }} onSubmit={handleSubmit}>
      <div className="field">
        <label>Materia</label>
        <select value={materia} onChange={e => setMateria(e.target.value)}>
          {MATERIAS.map(m => <option key={m}>{m}</option>)}
        </select>
      </div>
      <div className="field">
        <label>Tu duda</label>
        <textarea
          rows={4}
          placeholder={`Ej. "No entiendo cómo despejar 'x' en 3x + 5 = 20"`}
          value={descripcion}
          onChange={e => setDescripcion(e.target.value)}
        />
      </div>

      <div className="field">
        <label>Fotos (opcional)</label>
        <p className="field-hint">Agrega una foto del ejercicio o tu cuaderno — hasta {MAX_FOTOS}, máx. {MAX_MB}MB cada una.</p>

        <div className="foto-grid">
          {fotos.map((f, idx) => (
            <div className="foto-thumb" key={idx}>
              <img src={f.preview} alt={`Adjunto ${idx + 1}`} />
              <button type="button" className="foto-remove" onClick={() => quitarFoto(idx)} aria-label="Quitar foto">✕</button>
            </div>
          ))}
          {fotos.length < MAX_FOTOS && (
            <button type="button" className="foto-add" onClick={() => fileInputRef.current?.click()}>
              <span className="foto-add-icon">📷</span>
              <span>Agregar</span>
            </button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={handleFotos}
        />
      </div>

      <div className="field">
        <label>Urgencia</label>
        <select value={urgencia} onChange={e => setUrgencia(e.target.value)}>
          <option>Puede esperar unos días</option>
          <option>Esta semana</option>
          <option>Es urgente</option>
        </select>
      </div>
      {error && <p style={{ color: 'var(--coral)', fontSize: 13.5, marginTop: -6, marginBottom: 14 }}>{error}</p>}
      <button className="btn btn-amber" type="submit" disabled={enviando}>
        {enviando ? <span className="spinner" /> : null}
        {enviando ? 'Buscando tutor…' : 'Publicar duda'}
      </button>
    </form>
  );
}
