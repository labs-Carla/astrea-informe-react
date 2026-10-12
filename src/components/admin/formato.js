const ZONA = 'America/Bogota'

/** "12 oct 2026, 09:41" en hora de Colombia (las fechas del backend llegan en UTC con Z). */
export function fechaHora(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-CO', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    hour12: false, timeZone: ZONA,
  })
}

/** Fecha de nacimiento: viene en hora local del lugar, sin zona; se muestra tal cual. */
export function nacimiento(isoLocal) {
  if (!isoLocal) return '—'
  const [fecha, hora = ''] = isoLocal.split('T')
  const [a, m, d] = fecha.split('-')
  return `${d}/${m}/${a}${hora ? ` · ${hora.slice(0, 5)}` : ''}`
}

/** "hace 3 h", "hace 2 días"… */
export function haceCuanto(iso, ahora = Date.now()) {
  if (!iso) return '—'
  const minutos = Math.max(0, Math.round((ahora - new Date(iso).getTime()) / 60000))
  if (minutos < 1) return 'ahora'
  if (minutos < 60) return `hace ${minutos} min`
  const horas = Math.round(minutos / 60)
  if (horas < 24) return `hace ${horas} h`
  const dias = Math.round(horas / 24)
  return dias === 1 ? 'hace 1 día' : `hace ${dias} días`
}

export function horasDesde(iso, ahora = Date.now()) {
  return iso ? (ahora - new Date(iso).getTime()) / 3600000 : 0
}

export function lugar(ciudad, pais) {
  return [ciudad, pais].filter(Boolean).join(', ') || '—'
}

export function fechaLarga(fecha = new Date()) {
  const texto = fecha.toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: ZONA,
  })
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

export function saludo(fecha = new Date()) {
  const hora = Number(fecha.toLocaleString('en-US', { hour: 'numeric', hour12: false, timeZone: ZONA }))
  if (hora < 12) return 'Buenos días'
  if (hora < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

/** Coincidencia sin tildes ni mayúsculas, para el buscador. */
export function coincide(texto, consulta) {
  const normalizar = (s) => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  return normalizar(texto).includes(normalizar(consulta))
}

/** Estado del reporte temático de un pedido (último ProductoGenerado) para mostrar en el panel. */
export const ESTADOS_REPORTE = {
  null: { etiqueta: 'Por generar', tono: 'neutro' },
  pendiente: { etiqueta: 'Generación incompleta', tono: 'rojo' },
  generando: { etiqueta: 'Generando', tono: 'neutro' },
  fallido: { etiqueta: 'Falló: regenerar', tono: 'rojo' },
  generado: { etiqueta: 'Por revisar', tono: 'oro' },
  editado: { etiqueta: 'Por revisar', tono: 'oro' },
  aprobado: { etiqueta: 'PDF por enviar', tono: 'azul' },
  enviado: { etiqueta: 'PDF enviado', tono: 'verde' },
}
