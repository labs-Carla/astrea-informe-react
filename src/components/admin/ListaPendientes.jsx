import { useState, useEffect } from 'react'
import DetalleCarta from './DetalleCarta'

const API_BASE = 'https://astrea-api-production.up.railway.app/api/v1'

function formatearFechaHora(isoString) {
  if (!isoString) return 'sin fecha'
  const fecha = new Date(isoString)
  return fecha.toLocaleString('es-CO', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'America/Bogota',
  })
}

const PESTANAS = [
  { id: 'esperando-pago', etiqueta: 'Esperando pago', vacia: 'No hay órdenes esperando pago.' },
  { id: 'pendientes', etiqueta: 'Pendientes', vacia: 'No hay cartas pendientes.' },
  { id: 'enviadas', etiqueta: 'Enviadas', vacia: 'Aún no hay cartas enviadas.' },
]

/**
 * Lista de cartas en tres pestañas: "Esperando pago" (ordenes con datos
 * natales cargados en comprar.html, pago en Hotmart aun sin confirmar —
 * no hay webhook, se confirma a mano), "Pendientes" (pagadas, aun no
 * aprobadas) y "Enviadas" (ya aprobadas, con su link/token visible). Al
 * seleccionar una, muestra su detalle via DetalleCarta.
 */
function ListaPendientes({ claveAdmin }) {
  const [pestana, setPestana] = useState('pendientes')
  const [cartas, setCartas] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [cartaSeleccionada, setCartaSeleccionada] = useState(null)
  const [confirmando, setConfirmando] = useState(null)

  useEffect(() => {
    cargarCartas()
  }, [pestana])

  async function cargarCartas() {
    setCargando(true)
    setError(null)
    setCartas(null)

    try {
      const respuesta = await fetch(`${API_BASE}/admin/${pestana}`, {
        headers: { 'X-Admin-Secret': claveAdmin },
      })

      if (!respuesta.ok) throw new Error('No se pudo cargar la lista.')

      const datos = await respuesta.json()
      setCartas(datos)
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }

  async function confirmarPago(carta) {
    const ok = window.confirm(
      `¿Confirmas que ${carta.nombre_reporte || carta.email} ya pagó en Hotmart?\n` +
        `Busca la venta por ${carta.email} o por el código astrea-orden-${carta.id}.`
    )
    if (!ok) return

    setConfirmando(carta.id)
    setError(null)
    try {
      const respuesta = await fetch(`${API_BASE}/admin/confirmar-pago/${carta.id}`, {
        method: 'POST',
        headers: { 'X-Admin-Secret': claveAdmin },
      })
      if (!respuesta.ok) throw new Error('No se pudo confirmar el pago.')
      setCartas((actuales) => actuales.filter((c) => c.id !== carta.id))
    } catch (err) {
      setError(err.message)
    } finally {
      setConfirmando(null)
    }
  }

  if (cartaSeleccionada) {
    return (
      <DetalleCarta
        claveAdmin={claveAdmin}
        cartaId={cartaSeleccionada}
        onVolver={() => {
          setCartaSeleccionada(null)
          cargarCartas()
        }}
      />
    )
  }

  return (
    <div className="min-h-screen bg-[#F7F3E9] px-6 py-8 max-w-2xl mx-auto">
      <h1 className="font-serif text-2xl text-[#2B2620] mb-4">Cartas</h1>

      <div className="flex flex-wrap gap-2 mb-6">
        {PESTANAS.map(({ id, etiqueta }) => (
          <button
            key={id}
            onClick={() => setPestana(id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              pestana === id
                ? 'bg-[#2B2620] text-[#F7F3E9]'
                : 'border border-[#C4B8A0] text-[#5C5346]'
            }`}
          >
            {etiqueta}
          </button>
        ))}
      </div>

      {pestana === 'esperando-pago' && (
        <p className="text-sm text-[#5C5346] mb-4">
          Personas que ya llenaron sus datos y fueron enviadas a Hotmart. Cuando veas la venta en
          Hotmart (mismo correo, o código <code>astrea-orden-ID</code>), confirma el pago para
          pasarla a Pendientes.
        </p>
      )}

      {cargando && <p className="text-[#5C5346]">Cargando...</p>}
      {error && <p className="text-red-700">{error}</p>}

      {cartas && cartas.length === 0 && (
        <p className="text-[#5C5346] italic">
          {PESTANAS.find((p) => p.id === pestana).vacia}
        </p>
      )}

      {cartas && cartas.length > 0 && (
        <ul className="divide-y divide-[#C4B8A0]">
          {cartas.map((carta) => (
            <li key={carta.id} className="flex items-center gap-3">
              <button
                onClick={() => setCartaSeleccionada(carta.id)}
                className="flex-1 min-w-0 flex items-center justify-between py-4 text-left"
              >
                <div>
                  <div className="text-[#2B2620] font-medium">
                    {carta.nombre_reporte || '(sin nombre)'}
                  </div>
                  <div className="text-sm text-[#5C5346]">{carta.email}</div>
                  <div className="text-xs text-[#8B6F47] space-y-0.5">
                    {pestana === 'esperando-pago' && <div>Orden: astrea-orden-{carta.id}</div>}
                    {pestana !== 'enviadas' ? (
                      <>
                        <div>Nacimiento: {carta.fecha_hora_local}</div>
                        {carta.ciudad && (
                          <div>Lugar: {[carta.ciudad, carta.pais].filter(Boolean).join(', ')}</div>
                        )}
                        <div>Solicitado: {formatearFechaHora(carta.fecha_solicitud_compra)}</div>
                      </>
                    ) : (
                      <div>Enviado: {formatearFechaHora(carta.fecha_envio)}</div>
                    )}
                  </div>
                </div>
                <span className="text-[#8B6F47]">›</span>
              </button>
              {pestana === 'esperando-pago' && (
                <button
                  onClick={() => confirmarPago(carta)}
                  disabled={confirmando === carta.id}
                  className="shrink-0 bg-[#2B2620] text-[#F7F3E9] rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-50"
                >
                  {confirmando === carta.id ? 'Confirmando...' : 'Confirmar pago'}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default ListaPendientes