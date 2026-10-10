import { useState, useEffect } from 'react'

const API_BASE = 'https://astrea-api-production.up.railway.app/api/v1'

function formatearFechaHora(isoString) {
  if (!isoString) return 'sin fecha'
  return new Date(isoString).toLocaleString('es-CO', {
    day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
    hour12: false, timeZone: 'America/Bogota',
  })
}

const ESTADOS = {
  pendiente: { etiqueta: 'Esperando pago', clase: 'text-[#8B6F47] border-[#8B6F47]' },
  confirmado: { etiqueta: 'Pagado · por enviar', clase: 'text-[#3D5A6C] border-[#3D5A6C]' },
  enviado: { etiqueta: 'Enviado', clase: 'text-[#4E6B3A] border-[#4E6B3A]' },
  reembolsado: { etiqueta: 'Reembolsado', clase: 'text-[#8B3A3A] border-[#8B3A3A]' },
}

const FILTROS = [
  { id: 'activos', etiqueta: 'Por atender', incluye: ['pendiente', 'confirmado'] },
  { id: 'enviado', etiqueta: 'Enviados', incluye: ['enviado'] },
  { id: 'todos', etiqueta: 'Todos', incluye: null },
]

function DatosExtra({ extra }) {
  if (!extra) return null
  if (extra.revolucion_solar) {
    const rs = extra.revolucion_solar
    return <div>Cumpleaños en: {rs.ciudad}, {rs.pais} · ciclo {rs.anio}</div>
  }
  if (extra.segunda_persona) {
    const sp = extra.segunda_persona
    return (
      <div>
        Otra persona: {sp.nombre} · {sp.fecha} · {sp.hora ? `${sp.hora} h` : 'hora desconocida'} · {sp.ciudad}, {sp.pais}
      </div>
    )
  }
  return null
}

/**
 * Pedidos de la tienda para los reportes distintos de la carta natal
 * (amor, vocación, dinero, patrones, revolución solar, compatibilidad).
 * Se preparan y envían a mano por correo; aquí se confirma el pago (cruzando
 * la venta de Hotmart por astrea-pedido-<id>), se marca el envío y se
 * registra un reembolso. Marcar enviado habilita las 5 preguntas en Astrea.ai.
 */
function ListaPedidos({ claveAdmin }) {
  const [pedidos, setPedidos] = useState(null)
  const [filtro, setFiltro] = useState('activos')
  const [error, setError] = useState(null)
  const [enCurso, setEnCurso] = useState(null)

  useEffect(() => {
    let vigente = true
    fetch(`${API_BASE}/admin/pedidos`, { headers: { 'X-Admin-Secret': claveAdmin } })
      .then((r) => {
        if (!r.ok) throw new Error('No se pudieron cargar los pedidos.')
        return r.json()
      })
      .then((datos) => { if (vigente) setPedidos(datos) })
      .catch((err) => { if (vigente) setError(err.message) })
    return () => { vigente = false }
  }, [claveAdmin])

  async function accion(pedido, nombre, pregunta) {
    if (!window.confirm(pregunta)) return
    setEnCurso(`${pedido.id}:${nombre}`)
    setError(null)
    try {
      const r = await fetch(`${API_BASE}/admin/pedidos/${pedido.id}/${nombre}`, {
        method: 'POST',
        headers: { 'X-Admin-Secret': claveAdmin },
      })
      const datos = await r.json()
      if (!r.ok) throw new Error(datos.detail || 'No se pudo completar la acción.')
      setPedidos((actuales) => actuales.map((p) => (p.id === pedido.id ? datos.pedido : p)))
    } catch (err) {
      setError(err.message)
    } finally {
      setEnCurso(null)
    }
  }

  const incluye = FILTROS.find((f) => f.id === filtro).incluye
  const visibles = (pedidos || []).filter((p) => !incluye || incluye.includes(p.estado))

  return (
    <div>
      <p className="text-sm text-[#5C5346] mb-4">
        Reportes que se preparan a mano: confirma el pago en Hotmart (busca el código), envía el PDF por correo y márcalo como enviado.
      </p>
      <div className="flex flex-wrap gap-2 mb-4">
        {FILTROS.map(({ id, etiqueta }) => (
          <button
            key={id}
            onClick={() => setFiltro(id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
              filtro === id ? 'bg-[#8B6F47] text-[#F7F3E9]' : 'border border-[#C4B8A0] text-[#5C5346]'
            }`}
          >
            {etiqueta}
          </button>
        ))}
      </div>

      {error && <p className="text-red-700 text-sm mb-4">{error}</p>}
      {pedidos === null && !error && <p className="text-[#5C5346]">Cargando...</p>}
      {pedidos && visibles.length === 0 && <p className="text-[#5C5346]">No hay pedidos aquí.</p>}

      <ul className="divide-y divide-[#C4B8A0]">
        {visibles.map((p) => {
          const estado = ESTADOS[p.estado] || ESTADOS.pendiente
          const ocupado = enCurso?.startsWith(`${p.id}:`)
          return (
            <li key={p.id} className="py-4 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-serif text-lg text-[#2B2620]">{p.producto_nombre}</span>
                <span className={`text-xs border rounded px-2 py-0.5 ${estado.clase}`}>{estado.etiqueta}</span>
              </div>
              <div className="text-sm text-[#2B2620]">{p.nombre} · {p.email}</div>
              <div className="text-xs text-[#8B6F47] space-y-0.5">
                <div>Código Hotmart: {p.referencia_hotmart}</div>
                <div>Nacimiento: {p.fecha_hora_local.replace('T', ' ').slice(0, 16)} · {p.ciudad}, {p.pais}</div>
                <DatosExtra extra={p.datos_extra} />
                <div>Pedido: {formatearFechaHora(p.fecha_solicitud_compra)}</div>
                {p.fecha_confirmacion_pago && <div>Pago confirmado: {formatearFechaHora(p.fecha_confirmacion_pago)}</div>}
                {p.fecha_envio && <div>Enviado: {formatearFechaHora(p.fecha_envio)}</div>}
                {p.fecha_reembolso && <div className="text-[#8B3A3A]">Reembolsado: {formatearFechaHora(p.fecha_reembolso)}</div>}
                <div>Carta calculada: #{p.carta_id}</div>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {p.estado === 'pendiente' && (
                  <button
                    disabled={ocupado}
                    onClick={() => accion(p, 'confirmar-pago', `¿${p.email} ya pagó ${p.producto_nombre} en Hotmart?\nBusca la venta por el correo o por ${p.referencia_hotmart}.`)}
                    className="bg-[#2B2620] text-[#F7F3E9] rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-50"
                  >
                    Confirmar pago
                  </button>
                )}
                {p.estado === 'confirmado' && (
                  <button
                    disabled={ocupado}
                    onClick={() => accion(p, 'marcar-enviado', `¿Ya enviaste ${p.producto_nombre} a ${p.email}?\nAl marcarlo, se habilitan sus 5 preguntas en Astrea.ai.`)}
                    className="bg-[#2B2620] text-[#F7F3E9] rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-50"
                  >
                    Marcar enviado
                  </button>
                )}
                {p.estado !== 'reembolsado' && p.estado !== 'pendiente' && (
                  <button
                    disabled={ocupado}
                    onClick={() => accion(p, 'reembolsar', `¿Registrar el reembolso de ${p.producto_nombre} de ${p.email}?\nHazlo solo si ya se reembolsó en Hotmart.`)}
                    className="border border-[#8B3A3A] text-[#8B3A3A] rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-50"
                  >
                    Registrar reembolso
                  </button>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default ListaPedidos
