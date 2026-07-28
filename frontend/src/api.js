import axios from 'axios';

// URL del backend. En desarrollo local apunta a http://localhost:4000.
// Se puede sobreescribir creando un archivo .env con VITE_API_URL=https://tu-backend.onrender.com/api
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

// Origen sin el sufijo /api, usado para armar las URLs de las fotos servidas en /uploads
export const API_ORIGIN = API_URL.replace(/\/api\/?$/, '');
export function imagenUrl(rutaRelativa) {
  return `${API_ORIGIN}${rutaRelativa}`;
}

const api = axios.create({ baseURL: API_URL });

export const dudasApi = {
  listar: (params) => api.get('/dudas', { params }).then(r => r.data),
  obtener: (id) => api.get(`/dudas/${id}`).then(r => r.data),
  // "data" puede ser un objeto plano o un FormData (cuando incluye fotos)
  crear: (data) => api.post('/dudas', data).then(r => r.data),
  aceptar: (id, data) => api.put(`/dudas/${id}/aceptar`, data).then(r => r.data),
  completar: (id) => api.put(`/dudas/${id}/completar`).then(r => r.data),
  // Chat anidado por duda
  mensajes: (id) => api.get(`/dudas/${id}/mensajes`).then(r => r.data),
  enviarMensaje: (id, data) => api.post(`/dudas/${id}/mensajes`, data).then(r => r.data),
};

export default api;
