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

/**
 * Lista de cartas, con toggle entre "Pendientes" (aun no aprobadas) y
 * "Enviadas" (ya aprobadas, con su link/token visible). Al seleccionar
 * una, muestra su detalle via DetalleCarta.
 */
function ListaPendientes({ claveAdmin }) {
  const [pestana, setPestana] = useState('pendientes')
  const [cartas, setCartas] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [cartaSeleccionada, setCartaSeleccionada] = useState(null)

  useEffect(() => {
    cargarCartas()
  }, [pestana])

  async function cargarCartas() {
    setCargando(true)
    setError(null)
    setCartas(null)

    const endpoint = pestana === 'pendientes' ? 'pendientes' : 'enviadas'

    try {
      const respuesta = await fetch(`${API_BASE}/admin/${endpoint}`, {
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

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setPestana('pendientes')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            pestana === 'pendientes'
              ? 'bg-[#2B2620] text-[#F7F3E9]'
              : 'border border-[#C4B8A0] text-[#5C5346]'
          }`}
        >
          Pendientes
        </button>
        <button
          onClick={() => setPestana('enviadas')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            pestana === 'enviadas'
              ? 'bg-[#2B2620] text-[#F7F3E9]'
              : 'border border-[#C4B8A0] text-[#5C5346]'
          }`}
        >
          Enviadas
        </button>
      </div>

      {cargando && <p className="text-[#5C5346]">Cargando...</p>}
      {error && <p className="text-red-700">{error}</p>}

      {cartas && cartas.length === 0 && (
        <p className="text-[#5C5346] italic">
          {pestana === 'pendientes' ? 'No hay cartas pendientes.' : 'Aún no hay cartas enviadas.'}
        </p>
      )}

      {cartas && cartas.length > 0 && (
        <ul className="divide-y divide-[#C4B8A0]">
          {cartas.map((carta) => (
            <li key={carta.id}>
              <button
                onClick={() => setCartaSeleccionada(carta.id)}
                className="w-full flex items-center justify-between py-4 text-left"
              >
                <div>
                  <div className="text-[#2B2620] font-medium">
                    {carta.nombre_reporte || '(sin nombre)'}
                  </div>
                  <div className="text-sm text-[#5C5346]">{carta.email}</div>
                  <div className="text-xs text-[#8B6F47] space-y-0.5">
                    {pestana === 'pendientes' ? (
                      <>
                        <div>Nacimiento: {carta.fecha_hora_local}</div>
                        <div>Solicitado: {formatearFechaHora(carta.fecha_solicitud_compra)}</div>
                      </>
                    ) : (
                      <div>Enviado: {formatearFechaHora(carta.fecha_envio)}</div>
                    )}
                  </div>
                </div>
                <span className="text-[#8B6F47]">›</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default ListaPendientes