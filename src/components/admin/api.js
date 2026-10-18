/**
 * Acceso al backend del panel. Todas las rutas /admin/* exigen el header
 * X-Admin-Secret; este cliente lo agrega y convierte las respuestas con
 * error en excepciones con el mensaje del backend (campo `detail`).
 *
 * En local se puede apuntar a otro backend con VITE_API_BASE
 * (ej. VITE_API_BASE=http://localhost:8000/api/v1 npm run dev).
 */
export const API_BASE =
  import.meta.env.VITE_API_BASE || 'https://astrea-api-production.up.railway.app/api/v1'

/** Enlace público de una lectura aprobada (visor /r/<token> de la tienda). */
export const URL_LECTURA = 'https://astrea-charts.site/r/'

export class ErrorApi extends Error {
  constructor(mensaje, status) {
    super(mensaje)
    this.status = status
  }
}

export function crearClienteAdmin(clave) {
  async function pedir(ruta, opciones = {}) {
    let respuesta
    try {
      respuesta = await fetch(`${API_BASE}${ruta}`, {
        ...opciones,
        headers: { 'X-Admin-Secret': clave, ...(opciones.headers || {}) },
      })
    } catch {
      throw new ErrorApi('No se pudo conectar con el servidor.', 0)
    }
    if (!respuesta.ok) {
      let detalle = null
      try {
        detalle = (await respuesta.json()).detail
      } catch {
        /* respuesta sin JSON */
      }
      throw new ErrorApi(
        typeof detalle === 'string' ? detalle : `Error ${respuesta.status} del servidor.`,
        respuesta.status,
      )
    }
    return respuesta
  }

  return {
    async get(ruta) {
      return (await pedir(ruta)).json()
    },
    async texto(ruta) {
      return (await pedir(ruta)).text()
    },
    async post(ruta, cuerpo = {}) {
      const respuesta = await pedir(ruta, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cuerpo),
      })
      return respuesta.json()
    },
    async put(ruta, cuerpo = {}) {
      const respuesta = await pedir(ruta, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cuerpo),
      })
      return respuesta.json()
    },
    async borrar(ruta) {
      return (await pedir(ruta, { method: 'DELETE' })).json()
    },
  }
}
