import { useEffect, useMemo, useState } from 'react'
import { BotonCopiar, Boton, Esqueleto, Insignia, Tarjeta, Vacio } from './ui'
import { useAviso, useConfirmar } from './contextos'
import { coincide, fechaHora, haceCuanto } from './formato'

/**
 * Tarjetas de regalo (astrea-API /admin/regalos). Quien regala paga en Hotmart con
 * sck=astrea-regalo-<n>; al confirmar el pago aquí se genera el código y le llega la
 * tarjeta en PDF. Cuando la persona la canjea en /canjear, su lectura aparece en
 * «Por preparar» ya pagada.
 */

const ESTADO = {
  pendiente: { etiqueta: 'Pago por confirmar', tono: 'ambar' },
  activo: { etiqueta: 'Tarjeta enviada', tono: 'azul' },
  canjeado: { etiqueta: 'Canjeada', tono: 'verde' },
  vencido: { etiqueta: 'Vencida', tono: 'neutro' },
  reembolsado: { etiqueta: 'Reembolsada', tono: 'rojo' },
}
const FILTROS = [
  ['pendiente', 'Por confirmar', (r) => r.estado === 'pendiente'],
  ['activo', 'Sin canjear', (r) => r.estado === 'activo'],
  ['canjeado', 'Canjeadas', (r) => r.estado === 'canjeado'],
  ['todos', 'Todas', () => true],
]
const fechaCorta = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })

function Regalos({ api, busqueda, recarga }) {
  const avisar = useAviso()
  const confirmar = useConfirmar()
  const [regalos, setRegalos] = useState(null)
  const [error, setError] = useState(null)
  const [filtro, setFiltro] = useState('pendiente')
  const [enCurso, setEnCurso] = useState(null)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let vigente = true
    api.get('/admin/regalos')
      .then((d) => { if (vigente) { setRegalos(d); setError(null) } })
      .catch((e) => { if (vigente) setError(e.message) })
    return () => { vigente = false }
  }, [api, recarga, version])

  async function accion(clave, fn) {
    setEnCurso(clave)
    try {
      const r = await fn()
      avisar(r.mensaje)
    } catch (e) {
      avisar(e.message, 'error')
    } finally {
      setEnCurso(null)
      setVersion((v) => v + 1)
    }
  }

  async function confirmarPago(r) {
    const ok = await confirmar({
      titulo: '¿Confirmar el pago del regalo?',
      texto: (
        <>
          <p>Confirma solo si ya viste la venta de <b>{r.comprador_nombre}</b> en Hotmart: «{r.lectura}», código <b>{r.referencia_hotmart}</b>.</p>
          <p>Se genera el código y le enviamos la tarjeta en PDF a <b>{r.comprador_email}</b>.</p>
        </>
      ),
      accion: 'Confirmar y enviar tarjeta',
    })
    if (ok) accion(`pago:${r.id}`, () => api.post(`/admin/regalos/${r.id}/confirmar-pago`))
  }
  async function reembolsar(r) {
    const ok = await confirmar({
      titulo: '¿Registrar el reembolso?',
      texto: <p>Hazlo solo si ya devolviste el dinero en Hotmart. El código {r.codigo ? <b>{r.codigo}</b> : 'de la tarjeta'} deja de servir.</p>,
      accion: 'Registrar reembolso', variante: 'peligro',
    })
    if (ok) accion(`reembolso:${r.id}`, () => api.post(`/admin/regalos/${r.id}/reembolsar`))
  }

  const conteo = useMemo(() => Object.fromEntries(FILTROS.map(([id, , f]) => [id, (regalos || []).filter(f).length])), [regalos])
  const filas = useMemo(() => (regalos || [])
    .filter(FILTROS.find(([id]) => id === filtro)[2])
    .filter((r) => !busqueda || coincide(`${r.comprador_nombre} ${r.comprador_email} ${r.para_nombre} ${r.codigo || ''} ${r.referencia_hotmart} ${r.lectura}`, busqueda)),
  [regalos, filtro, busqueda])

  if (error && !regalos) return <p className="rounded-lg bg-[#fbeeec] px-4 py-3 text-sm text-vino ring-1 ring-vino/20">No se pudieron cargar los regalos: {error}</p>

  return (
    <Tarjeta>
      <div className="flex flex-wrap items-center gap-2 border-b border-linea px-5 py-3">
        {FILTROS.map(([id, etiqueta]) => (
          <button key={id} type="button" onClick={() => setFiltro(id)}
            className={`rounded-full px-3 py-1 text-sm ${filtro === id ? 'bg-noche text-papel' : 'text-tinta-suave hover:bg-pergamino'}`}>
            {etiqueta}{conteo[id] > 0 && <span className="ml-1.5 opacity-70">{conteo[id]}</span>}
          </button>
        ))}
      </div>
      {!regalos ? <div className="p-5"><Esqueleto className="h-20" /></div> : filas.length === 0 ? (
        <div className="p-8"><Vacio titulo="Nada por aquí" texto="Los regalos aparecen cuando alguien compra una tarjeta en astrea-charts.site/regalar." /></div>
      ) : (
        <ul className="divide-y divide-linea">
          {filas.map((r) => {
            const e = ESTADO[r.estado] || ESTADO.pendiente
            return (
              <li key={r.id} className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-start">
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Insignia tono={e.tono}>{e.etiqueta}</Insignia>
                    <span className="font-medium">{r.lectura}</span>
                    <span className="text-sm text-tinta-suave">para <b className="font-medium text-tinta">{r.para_nombre}</b></span>
                  </div>
                  <p className="text-sm text-tinta-suave">
                    De {r.comprador_nombre} · {r.comprador_email} <BotonCopiar texto={r.comprador_email} etiqueta="Copiar correo" />
                  </p>
                  {r.dedicatoria && <p className="text-sm italic text-tinta-suave">«{r.dedicatoria}»</p>}
                  <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-tinta-tenue">
                    <span className="inline-flex items-center gap-1">Hotmart: <b className="font-mono">{r.referencia_hotmart}</b><BotonCopiar texto={r.referencia_hotmart} etiqueta="Copiar referencia" /></span>
                    {r.codigo && <span>Código: <b className="font-mono text-tinta">{r.codigo}</b></span>}
                    {r.vence && <span>vence {fechaCorta(r.vence)}</span>}
                    <span title={fechaHora(r.fecha_solicitud)}>pedido {haceCuanto(r.fecha_solicitud)}</span>
                    {r.fecha_canje && <span>canjeada {fechaHora(r.fecha_canje)}</span>}
                    {r.estado === 'activo' && !r.fecha_envio_tarjeta && <span className="text-vino">la tarjeta no se pudo enviar: reenvíala</span>}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {r.estado === 'pendiente' && <Boton tamano="sm" variante="primario" cargando={enCurso === `pago:${r.id}`} onClick={() => confirmarPago(r)}>Confirmar pago</Boton>}
                  {r.estado === 'activo' && <Boton tamano="sm" icono="enviar" cargando={enCurso === `tarjeta:${r.id}`}
                    onClick={() => accion(`tarjeta:${r.id}`, () => api.post(`/admin/regalos/${r.id}/reenviar-tarjeta`))}>Reenviar tarjeta</Boton>}
                  {(r.estado === 'pendiente' || r.estado === 'activo' || r.estado === 'vencido') && (
                    <button type="button" onClick={() => reembolsar(r)} className="text-xs text-tinta-tenue hover:text-vino hover:underline">Registrar reembolso</button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </Tarjeta>
  )
}

export default Regalos
