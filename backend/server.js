// server.js — Punto de entrada del backend de EduConecta
// Inicializa el puerto, habilita CORS/JSON y conecta las rutas.

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const dudasRouter = require('./routes/dudas');

const app = express();

// Asegura que la carpeta de subidas exista antes de aceptar peticiones
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

app.use(cors());
app.use(express.json());

// Las fotos adjuntas a una duda quedan accesibles en http://localhost:4000/uploads/<archivo>
app.use('/uploads', express.static(UPLOADS_DIR));

// Ruta de salud, útil para verificar que el backend está vivo
app.get('/api/health', (req, res) => {
  res.json({ ok: true, servicio: 'EduConecta API', hora: new Date().toISOString() });
});

// Rutas de dudas (incluye el chat anidado por duda: /api/dudas/:id/mensajes)
app.use('/api/dudas', dudasRouter);

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`✅ EduConecta backend escuchando en http://localhost:${PORT}`);
  console.log(`   Rutas disponibles:`);
  console.log(`   GET    /api/dudas`);
  console.log(`   POST   /api/dudas  (multipart/form-data: campos + imagenes[])`);
  console.log(`   GET    /api/dudas/:id`);
  console.log(`   PUT    /api/dudas/:id/aceptar`);
  console.log(`   PUT    /api/dudas/:id/completar`);
  console.log(`   GET    /api/dudas/:id/mensajes`);
  console.log(`   POST   /api/dudas/:id/mensajes`);
  console.log(`   GET    /uploads/<archivo>  (fotos de las dudas)`);
});
