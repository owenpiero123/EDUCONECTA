// routes/dudas.js — Controla qué pasa cuando React consulta o envía datos.
// Implementa RF-08 (API REST: GET / POST) y RF-09 (persistencia leyendo/
// escribiendo data/dudas.json con fs/promises en cada creación o modificación).

const express = require('express');
const fs = require('fs/promises');
const path = require('path');
const multer = require('multer');
const router = express.Router();

const DATA_PATH = path.join(__dirname, '..', 'data', 'dudas.json');
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

// ---------- multer: fotos adjuntas a la duda ----------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 4 }, // 5MB por imagen, máx. 4 imágenes
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Solo se permiten archivos de imagen.'));
    }
    cb(null, true);
  }
});

// ---------- helpers ----------
async function leerDudas() {
  const raw = await fs.readFile(DATA_PATH, 'utf-8');
  return JSON.parse(raw);
}

async function guardarDudas(dudas) {
  await fs.writeFile(DATA_PATH, JSON.stringify(dudas, null, 2), 'utf-8');
}

function generarId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// RF-07: genera el enlace de Jitsi Meet siguiendo el patrón EduConecta-[ID_Duda]
function generarEnlaceJitsi(idDuda) {
  return `https://meet.jit.si/EduConecta-${idDuda}`;
}

// ---------- GET /api/dudas ----------
// RF-04 (panel de dudas activas) + RF-05 (filtro por materia) + RF-02 (estado)
// Devuelve todas las dudas. Admite filtros opcionales por query string:
// /api/dudas?materia=Matemáticas&estado=pendiente&estudiante=Mateo
router.get('/', async (req, res) => {
  try {
    let dudas = await leerDudas();
    const { materia, estado, estudiante, tutor } = req.query;

    if (materia) dudas = dudas.filter(d => d.materia === materia);
    if (estado) dudas = dudas.filter(d => d.estado === estado);
    if (estudiante) dudas = dudas.filter(d => d.estudiante.toLowerCase() === estudiante.toLowerCase());
    if (tutor) dudas = dudas.filter(d => d.tutor && d.tutor.toLowerCase() === tutor.toLowerCase());

    dudas.sort((a, b) => b.fecha - a.fecha);
    res.json(dudas);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'No se pudo leer el archivo de dudas.' });
  }
});

// ---------- POST /api/dudas ----------
// RF-01: el estudiante publica una nueva duda (nombre, materia, descripción).
// Acepta multipart/form-data con hasta 4 imágenes en el campo "imagenes".
router.post('/', (req, res) => {
  upload.array('imagenes', 4)(req, res, async (err) => {
    if (err) {
      const msg = err.code === 'LIMIT_FILE_SIZE'
        ? 'Cada imagen debe pesar como máximo 5MB.'
        : (err.message || 'No se pudieron procesar las imágenes.');
      return res.status(400).json({ error: msg });
    }

    try {
      const { estudiante, colegio, materia, descripcion, urgencia } = req.body;

      if (!estudiante || !materia || !descripcion) {
        return res.status(400).json({ error: 'Faltan campos obligatorios: estudiante, materia, descripcion.' });
      }

      const dudas = await leerDudas();

      const imagenes = (req.files || []).map(f => `/uploads/${f.filename}`);

      const nuevaDuda = {
        id: generarId(),
        estudiante,
        colegio: colegio || 'No especificado',
        materia,
        descripcion,
        urgencia: urgencia || 'Esta semana',
        imagenes,
        estado: 'pendiente',
        tutor: null,
        universidadTutor: null,
        enlaceReunion: null,
        mensajes: [],
        fecha: Date.now()
      };

      dudas.push(nuevaDuda);
      await guardarDudas(dudas);

      res.status(201).json(nuevaDuda);
    } catch (err2) {
      console.error(err2);
      res.status(500).json({ error: 'No se pudo guardar la duda.' });
    }
  });
});

// ---------- PUT /api/dudas/:id/aceptar ----------
// RF-06: el tutor acepta la tutoría; el estado cambia inmediatamente.
// RF-07: se genera automáticamente el enlace único de Jitsi Meet
// siguiendo el patrón https://meet.jit.si/EduConecta-[ID_Duda].
router.put('/:id/aceptar', async (req, res) => {
  try {
    const { tutor, universidad } = req.body;
    if (!tutor) return res.status(400).json({ error: 'Falta el nombre del tutor.' });

    const dudas = await leerDudas();
    const duda = dudas.find(d => d.id === req.params.id);
    if (!duda) return res.status(404).json({ error: 'Duda no encontrada.' });
    if (duda.estado !== 'pendiente') {
      return res.status(409).json({ error: 'Esta duda ya fue tomada por otro tutor.' });
    }

    duda.estado = 'en curso';
    duda.tutor = tutor;
    duda.universidadTutor = universidad || 'No especificada';
    duda.enlaceReunion = generarEnlaceJitsi(duda.id);

    await guardarDudas(dudas);
    res.json(duda);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'No se pudo aceptar la duda.' });
  }
});

// ---------- PUT /api/dudas/:id/completar ----------
// Se marca la sesión como finalizada.
router.put('/:id/completar', async (req, res) => {
  try {
    const dudas = await leerDudas();
    const duda = dudas.find(d => d.id === req.params.id);
    if (!duda) return res.status(404).json({ error: 'Duda no encontrada.' });

    duda.estado = 'completada';
    await guardarDudas(dudas);
    res.json(duda);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'No se pudo actualizar la duda.' });
  }
});

// ---------- GET /api/dudas/:id ----------
// Devuelve una sola duda (incluye su hilo de mensajes). Se usa para
// refrescar el chat sin tener que releer la lista completa.
router.get('/:id', async (req, res) => {
  try {
    const dudas = await leerDudas();
    const duda = dudas.find(d => d.id === req.params.id);
    if (!duda) return res.status(404).json({ error: 'Duda no encontrada.' });
    res.json(duda);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'No se pudo leer la duda.' });
  }
});

// ---------- GET /api/dudas/:id/mensajes ----------
// Chat entre el estudiante y el tutor asignado a esa duda.
router.get('/:id/mensajes', async (req, res) => {
  try {
    const dudas = await leerDudas();
    const duda = dudas.find(d => d.id === req.params.id);
    if (!duda) return res.status(404).json({ error: 'Duda no encontrada.' });
    res.json(duda.mensajes || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'No se pudo leer el chat.' });
  }
});

// ---------- POST /api/dudas/:id/mensajes ----------
// Envía un mensaje nuevo al chat de la duda (estudiante o tutor).
router.post('/:id/mensajes', async (req, res) => {
  try {
    const { autor, rol, texto } = req.body;
    if (!autor || !rol || !texto || !texto.trim()) {
      return res.status(400).json({ error: 'Faltan campos: autor, rol, texto.' });
    }

    const dudas = await leerDudas();
    const duda = dudas.find(d => d.id === req.params.id);
    if (!duda) return res.status(404).json({ error: 'Duda no encontrada.' });

    if (!duda.mensajes) duda.mensajes = [];
    const mensaje = {
      id: generarId(),
      autor,
      rol, // "estudiante" | "tutor"
      texto: texto.trim(),
      fecha: Date.now()
    };
    duda.mensajes.push(mensaje);

    await guardarDudas(dudas);
    res.status(201).json(mensaje);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'No se pudo enviar el mensaje.' });
  }
});

module.exports = router;
