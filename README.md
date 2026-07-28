# EduConecta

Plataforma que conecta a estudiantes de secundaria de escuelas públicas con
tutores universitarios voluntarios, siguiendo la arquitectura Cliente-Servidor:

```
[ FRONTEND: React (Vite) ]  ── POST/GET ──  [ BACKEND: Node.js + Express ] ── lee/escribe ── [ data/dudas.json ]
```

## Estructura del proyecto

```
educonecta-app/
├── backend/
│   ├── server.js              # Inicializa Express, CORS y las rutas
│   ├── routes/dudas.js        # GET, POST, PUT /api/dudas
│   └── data/dudas.json        # "Base de datos" en archivo plano
└── frontend/
    └── src/
        ├── components/
        │   ├── FormularioDuda.jsx   # Formulario del estudiante
        │   └── TarjetaDuda.jsx      # Tarjeta visual de cada duda
        ├── pages/
        │   ├── Home.jsx              # Selección de rol
        │   ├── DashboardEstudiante.jsx
        │   └── DashboardTutor.jsx
        ├── api.js             # Cliente axios hacia el backend
        └── App.jsx            # Rutas (react-router-dom)
```

## Trazabilidad de Requerimientos Funcionales

| RF | Descripción | Dónde está implementado |
|----|-------------|--------------------------|
| RF-01 | Publicar duda (nombre, materia, descripción) | `frontend/src/components/FormularioDuda.jsx` → `POST /api/dudas` en `backend/routes/dudas.js` |
| RF-02 | Estado en tiempo real ("Pendiente" / "En Curso") | `frontend/src/components/TarjetaDuda.jsx` (tags de estado) + polling cada 4s en `DashboardEstudiante.jsx` |
| RF-03 | Botón dinámico para unirse a la videollamada | `TarjetaDuda.jsx` → se muestra automáticamente cuando `duda.estado === 'en curso'` y existe `enlaceReunion` |
| RF-04 | Panel de dudas activas (dinámico) | `frontend/src/pages/DashboardTutor.jsx` → `GET /api/dudas` con `useEffect` + polling |
| RF-05 | Filtro por materia | Selector en `DashboardTutor.jsx` → `GET /api/dudas?materia=...` |
| RF-06 | Aceptar tutoría (cambio de estado inmediato) | Botón "Aceptar tutoría" → `PUT /api/dudas/:id/aceptar` en `backend/routes/dudas.js` |
| RF-07 | Generador de enlace Jitsi Meet | Función `generarEnlaceJitsi()` en `backend/routes/dudas.js`, formato `https://meet.jit.si/EduConecta-[ID_Duda]` |
| RF-08 | API REST (GET / POST) | `backend/routes/dudas.js`: `GET /api/dudas`, `POST /api/dudas` |
| RF-09 | Persistencia ligera en `dudas.json` | Funciones `leerDudas()` / `guardarDudas()` con `fs/promises`, ejecutadas en cada creación o modificación |

## Fotos adjuntas a la duda

El estudiante puede adjuntar hasta **4 fotos** (por ejemplo, del ejercicio o
del cuaderno) al publicar una duda:

- El formulario (`FormularioDuda.jsx`) envía la duda como `multipart/form-data`
  usando `FormData`, con las imágenes en el campo `imagenes`.
- El backend procesa la subida con **multer**, guarda los archivos en
  `backend/uploads/` y los expone públicamente en `GET /uploads/<archivo>`.
- Cada duda guarda en `dudas.json` un arreglo `imagenes: ["/uploads/xxx.jpg", ...]`.
- En las tarjetas (`TarjetaDuda.jsx`) las fotos se muestran como miniaturas
  y se pueden ampliar en un lightbox al hacer clic.
- Límites: máximo 4 fotos por duda, 5MB por imagen, solo formatos de imagen
  (`image/*`). Se validan tanto en el navegador como en el servidor.

## Chat entre estudiante y tutor

Cada duda guarda su propio hilo de mensajes (`mensajes: []` dentro del objeto
en `dudas.json`). Se habilita apenas el tutor acepta la tutoría:

- `GET  /api/dudas/:id/mensajes` → devuelve la conversación de esa duda.
- `POST /api/dudas/:id/mensajes` → envía un mensaje `{ autor, rol, texto }`.

En el frontend, `components/ChatDuda.jsx` se despliega dentro de la tarjeta
(`TarjetaDuda.jsx`) con un botón **"💬 Abrir chat"** que muestra un contador de
mensajes no leídos, y hace polling cada 3 segundos mientras está abierto.

## Experiencia de usuario

Ambos paneles (`DashboardEstudiante.jsx` y `DashboardTutor.jsx`) se
rediseñaron para ser más intuitivos:

- **Tarjetas de resumen** (pendientes / en curso / completadas) para ver el
  estado general de un vistazo.
- **Pestañas** para filtrar rápidamente entre "Por atender", "Activas" e
  "Historial", con contador de elementos.
- **Modal de publicación** para el estudiante ("+ Nueva duda"), en vez de un
  formulario siempre visible.
- **Stepper visual** (Publicada → Tutor asignado → Sesión realizada) en cada
  tarjeta de duda.
- **Chat contextual** dentro de cada tarjeta, sin salir de la vista principal.

## Flujo del sistema

1. El **estudiante** entra a `/estudiante`, escribe su nombre y colegio, y publica
   una duda específica (materia + descripción + urgencia). Esto dispara un
   `POST /api/dudas`.
2. El **backend** guarda la duda en `data/dudas.json` con `estado: "pendiente"`.
3. El **tutor** entra a `/tutor`, ve las dudas filtradas por materia
   (`GET /api/dudas?materia=...`) y da clic en **"Aceptar tutoría"**
   (`PUT /api/dudas/:id/aceptar`).
4. El backend cambia el estado a `"en curso"` y genera automáticamente un
   enlace de videollamada gratuito de **Jitsi Meet**
   (`https://meet.jit.si/EduConecta-<estudiante>-<id>`), sin necesidad de
   cuentas ni configuración adicional.
5. Tanto el estudiante como el tutor ven aparecer el botón
   **"🎥 Unirse a la clase en vivo"** (el frontend refresca cada 4 segundos)
   y entran a la videollamada.
6. Al terminar, el tutor marca la tutoría como **completada**.

## Cómo ejecutarlo localmente

### 1. Backend

```bash
cd backend
npm install
npm run start
```

Esto levanta la API en `http://localhost:4000`. Puedes verificar que funciona
visitando `http://localhost:4000/api/health`.

### 2. Frontend

En otra terminal:

```bash
cd frontend
npm install
npm run dev
```

Esto abre la app en `http://localhost:5173`. El frontend ya está configurado
para hablar con el backend en `http://localhost:4000/api` (ver `src/api.js`).

> Ambos servidores deben estar corriendo al mismo tiempo para que el sistema
> funcione completo.

## Despliegue (opcional)

- **Backend** → Render, Railway o cualquier servicio que soporte Node.js.
- **Frontend** → Vercel (tal como se planteó en el documento del proyecto).
- Si despliegas el backend en otra URL, crea un archivo `.env` dentro de
  `frontend/` con:
  ```
  VITE_API_URL=https://tu-backend.onrender.com/api
  ```

## Notas técnicas

- No se usa base de datos: `data/dudas.json` se lee y escribe con el módulo
  `fs/promises`, tal como se definió en el diseño del sistema.
- Las videollamadas usan **Jitsi Meet** (`meet.jit.si`), un servicio gratuito
  y de código abierto que no requiere backend adicional ni claves de API.
- La actualización "en tiempo real" entre estudiante y tutor se simula con
  refresco periódico (`polling` cada 4 segundos) desde el frontend.
