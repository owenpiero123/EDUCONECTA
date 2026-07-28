import { useNavigate } from 'react-router-dom';

const PASOS = [
  {
    n: 1,
    titulo: 'El alumno pregunta',
    texto: 'Envía su duda escolar en tiempo real a través de un formulario interactivo, con opción de adjuntar fotos.',
  },
  {
    n: 2,
    titulo: 'El tutor elige',
    texto: 'Un universitario voluntario revisa las dudas filtradas por materia y acepta la que domine desde su panel.',
  },
  {
    n: 3,
    titulo: 'Clase en vivo',
    texto: 'El sistema genera un enlace de videollamada instantáneo en Jitsi Meet para estudiar en vivo.',
  },
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <div>
      <nav className="navbar2">
        <div className="wrap navbar2-inner">
          <div className="brand"><span className="dot-mark">e</span> EduConecta</div>
          <div className="nav-links">
            <a href="#como-funciona">¿Cómo funciona?</a>
          </div>
          <span className="badge-live">● Demo activo</span>
        </div>
      </nav>

      <section className="hero2">
        <div className="wrap hero2-grid">
          <div>
            <h1>Conectamos el <em>conocimiento</em> con el futuro escolar</h1>
            <p>
              EduConecta une a estudiantes de escuelas públicas con tutores universitarios
              voluntarios para resolver dudas académicas en tiempo real, de forma 100% gratuita.
            </p>
            <div className="hero-ctas">
              <button className="btn btn-amber" onClick={() => navigate('/estudiante')}>
                Soy estudiante (pedir ayuda)
              </button>
              <button className="btn btn-ink" onClick={() => navigate('/tutor')}>
                Soy tutor (ver dudas)
              </button>
            </div>
          </div>

          <div className="demo-card">
            <div className="demo-card-head">
              <div>
                <div className="demo-name">Mateo R.</div>
                <div className="demo-sub">Estudiante de 3° de Secundaria</div>
              </div>
              <span className="tag tag-mat">Matemáticas</span>
            </div>
            <p className="demo-quote">
              "Hola, no logro entender cómo se aplica la fórmula general para resolver
              ecuaciones de segundo grado. ¿Alguien me ayuda con un ejemplo?"
            </p>
            <div className="demo-foot">
              <span className="demo-status"><span className="dot-live" /> Esperando tutor…</span>
              <button className="btn btn-amber btn-small" onClick={() => navigate('/tutor')}>Aceptar tutoría</button>
            </div>
          </div>
        </div>
      </section>

      <section className="steps-section wrap" id="como-funciona">
        <h2>¿Cómo funciona el sistema?</h2>
        <p className="steps-sub">Un flujo ágil de comunicación directa entre estudiante y tutor, sin complejidades técnicas.</p>

        <div className="steps-grid">
          {PASOS.map(p => (
            <div className="step-card" key={p.n}>
              <div className="step-num-circle">{p.n}</div>
              <h3>{p.titulo}</h3>
              <p>{p.texto}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="site-footer2 wrap">EduConecta — Reforzamiento académico para escuelas públicas.</footer>
    </div>
  );
}
