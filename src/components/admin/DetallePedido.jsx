import { useCallback, useEffect, useState } from 'react'
import { Boton, BotonCopiar, Esqueleto, Icono, Insignia, Paso } from './ui'
import { useAviso, useConfirmar } from './contextos'
import { ESTADOS_REPORTE, fechaHora, lugar, nacimiento } from './formato'

/**
 * Ficha lateral de un reporte temático (amor, vocación, dinero, patrones):
 * generar con IA, revisar el texto, vista previa del PDF y, abajo, los dos
 * pasos finales separados: «Aprobar reporte» (no envía nada) y «Enviar al
 * cliente» (genera el PDF y lo manda adjunto). Mismo recorrido que la carta natal.
 */
function DetallePedido({ api, pedidoId, onCerrar, onCambio }) {
  const avisar = useAviso()
  const confirmar = useConfirmar()
  const [datos, setDatos] = useState(null)
  const [error, setError] = useState(null)
  const [genero, setGenero] = useState('')
  const [enCurso, setEnCurso] = useState(null)

  const obtener = useCallback(async () => {
    try {
      return { datos: await api.get(`/admin/pedidos/${pedidoId}/reporte`) }
    } catch (err) {
      return { error: err.message }
    }
  }, [api, pedidoId])

  const aplicar = useCallback(({ datos: nuevos, error: fallo }) => {
    setError(fallo || null)
    if (nuevos) setDatos(nuevos)
    if (nuevos?.reporte?.genero) setGenero(nuevos.reporte.genero)
  }, [])

  useEffect(() => {
    let vigente = true
    obtener().then((r) => { if (vigente) aplicar(r) })
    return () => { vigente = false }
  }, [obtener, aplicar])

  useEffect(() => {
    const alTeclear = (e) => e.key === 'Escape' && !document.querySelector('[role=alertdialog]') && onCerrar()
    window.addEventListener('keydown', alTeclear)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', alTeclear); document.body.style.overflow = '' }
  }, [onCerrar])

  async function accion(ruta, cuerpo) {
    setEnCurso(ruta)
    try {
      const r = await api.post(`/admin/pedidos/${pedidoId}/reporte/${ruta}`, cuerpo)
      avisar(r.mensaje || 'Listo.', r.status === 'error' ? 'error' : 'ok')
      aplicar({ datos: { pedido: r.pedido, reporte: r.reporte } })
      onCambio()
    } catch (err) {
      avisar(err.message, 'error')
    } finally {
      setEnCurso(null)
    }
  }

  const pedido = datos?.pedido
  const reporte = datos?.reporte
  const estado = reporte?.estado ?? null
  const hayTexto = ['generado', 'editado', 'aprobado', 'enviado'].includes(estado)
  const aprobado = ['aprobado', 'enviado'].includes(estado)
  const enviado = estado === 'enviado'
  const bloqueado = pedido && (pedido.estado === 'pendiente' || pedido.estado === 'reembolsado')

  async function generar() {
    if (hayTexto) {
      const ok = await confirmar({
        titulo: '¿Regenerar el reporte?',
        texto: <p>Se reemplaza el texto actual por uno nuevo (es otra llamada a la IA, con costo). Revísalo antes de aprobar.</p>,
        accion: 'Regenerar',
      })
      if (!ok) return
    }
    await accion('generar', { genero: genero || null })
  }

  async function aprobar() {
    const ok = await confirmar({
      titulo: '¿Aprobar este reporte?',
      texto: <p>Queda listo para enviar. <b>Todavía no se envía ningún correo</b>: eso lo hace el botón «Enviar al cliente».</p>,
      accion: 'Aprobar reporte',
    })
    if (ok) await accion('aprobar', {})
  }

  async function enviar() {
    const ok = await confirmar({
      titulo: enviado ? '¿Reenviar el PDF?' : '¿Enviar el reporte al cliente?',
      texto: (
        <p>Se arma el PDF de <b>{pedido.producto_nombre}</b> con el texto aprobado y se envía adjunto a <b>{pedido.email}</b>.
          {enviado && ' La persona recibirá un correo nuevo.'}</p>
      ),
      accion: enviado ? 'Reenviar' : 'Enviar ahora',
      variante: 'oro',
    })
    if (ok) await accion('enviar', enviado ? { reenviar: true } : {})
  }

  async function vistaPrevia() {
    const pestana = window.open('', '_blank')
    setEnCurso('vista-previa')
    try {
      const html = await api.texto(`/admin/pedidos/${pedidoId}/reporte/vista-previa`)
      const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }))
      if (pestana) pestana.location.href = url
      else window.location.href = url
    } catch (err) {
      pestana?.close()
      avisar(`No se pudo abrir la vista previa: ${err.message}`, 'error')
    } finally {
      setEnCurso(null)
    }
  }

  const pasos = [
    ['Pagado', pedido && pedido.estado !== 'pendiente'],
    ['Generado', hayTexto],
    ['Aprobado', aprobado],
    ['Entregado', enviado],
  ]
  const primerPendiente = pasos.findIndex(([, hecho]) => !hecho)
  const insignia = ESTADOS_REPORTE[estado] || ESTADOS_REPORTE.null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-noche/40 backdrop-blur-[1px]" onClick={onCerrar} />
      <section role="dialog" aria-modal="true" aria-label={`Pedido ${pedidoId}`}
        className="relative flex h-full w-full max-w-3xl flex-col bg-marfil font-ui shadow-2xl">
        <header className="border-b border-linea bg-papel px-6 pb-5 pt-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-wider text-tinta-tenue">{pedido?.producto_nombre || 'Reporte'} · pedido #{pedidoId}</div>
              <h2 className="mt-1 truncate font-display text-3xl leading-tight text-tinta">{pedido?.nombre || '…'}</h2>
              {pedido && (
                <div className="mt-0.5 flex items-center gap-1 text-sm text-tinta-suave">
                  {pedido.email}<BotonCopiar texto={pedido.email} etiqueta="Copiar correo" />
                </div>
              )}
            </div>
            <button type="button" onClick={onCerrar} aria-label="Cerrar"
              className="rounded-lg p-2 text-tinta-tenue hover:bg-pergamino hover:text-tinta">
              <Icono nombre="cerrar" className="size-5" />
            </button>
          </div>
          {pedido && (
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-tinta-suave">
              <span>Nació {nacimiento(pedido.fecha_hora_local)} · {lugar(pedido.ciudad, pedido.pais)}</span>
              <span className="inline-flex items-center gap-1 font-mono text-xs">{pedido.referencia_hotmart}<BotonCopiar texto={pedido.referencia_hotmart} etiqueta="Copiar código" /></span>
              <Insignia tono={insignia.tono} punto>{insignia.etiqueta}</Insignia>
            </div>
          )}
          <ol className="mt-5 flex flex-wrap gap-y-2">
            {pasos.map(([etiqueta, hecho], i) => (
              <Paso key={etiqueta} etiqueta={etiqueta} hecho={hecho} actual={i === primerPendiente} ultimo={i === pasos.length - 1} />
            ))}
          </ol>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {error && <p className="rounded-lg bg-[#fbeeec] px-4 py-3 text-sm text-vino">{error}</p>}
          {!datos && !error && <div className="space-y-4"><Esqueleto className="h-10" /><Esqueleto className="h-64" /></div>}

          {datos && (
            <div className="space-y-6">
              {bloqueado && (
                <p className="rounded-lg bg-[#f8ead6] px-4 py-3 text-sm text-ambar">
                  {pedido.estado === 'pendiente' ? 'Primero confirma el pago de este pedido.' : 'Este pedido está reembolsado.'}
                </p>
              )}
              <div className="flex flex-wrap items-end gap-4">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-tinta-tenue">Género (para la concordancia del texto)</span>
                  <select value={genero} onChange={(e) => setGenero(e.target.value)} disabled={aprobado}
                    className="h-9 rounded-lg bg-papel px-3 text-sm ring-1 ring-linea-fuerte outline-none focus:ring-2 focus:ring-oro disabled:opacity-60">
                    <option value="">No especificar</option>
                    <option value="femenino">Femenino</option>
                    <option value="masculino">Masculino</option>
                  </select>
                </label>
                <Boton variante={hayTexto ? 'borde' : 'primario'} cargando={enCurso === 'generar'} disabled={aprobado || bloqueado}
                  onClick={generar}>
                  {enCurso === 'generar' ? 'Generando (30–60 s)…' : hayTexto ? 'Regenerar' : 'Generar reporte'}
                </Boton>
                {hayTexto && <Boton icono="externo" onClick={vistaPrevia} cargando={enCurso === 'vista-previa'}>Ver vista previa del PDF</Boton>}
              </div>

              {estado === 'fallido' && (
                <p className="rounded-lg bg-[#fbeeec] px-4 py-3 text-sm text-vino">
                  La IA respondió con errores (por ejemplo, una sección demasiado corta o larga). Genera el reporte de nuevo.
                </p>
              )}
              {estado === 'pendiente' && (
                <p className="rounded-lg bg-[#fbeeec] px-4 py-3 text-sm text-vino">La última generación no terminó porque la IA no respondió. Vuelve a generarlo.</p>
              )}

              <div className="rounded-xl bg-papel p-5 ring-1 ring-linea">
                {hayTexto ? (
                  <div className="space-y-6">
                    <div className="text-xs text-tinta-tenue">Generado {fechaHora(reporte.fecha_generacion)}</div>
                    {reporte.secciones.filter((s) => s.texto).map((s) => (
                      <div key={s.clave}>
                        <div className="mb-1 font-romana text-[11px] tracking-[.18em] text-oro">{s.titulo.toUpperCase()}</div>
                        <p className="whitespace-pre-line font-display text-[17px] leading-relaxed text-tinta">{s.texto}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-tinta-tenue">
                    {bloqueado ? 'Sin reporte.' : 'Genera el reporte para revisarlo aquí antes de aprobarlo. La IA tarda entre 30 y 60 segundos.'}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {datos && !bloqueado && (
          <footer className="flex flex-col gap-3 border-t border-linea bg-papel px-6 py-4 sm:flex-row sm:items-center">
            <div className="flex-1 text-sm text-tinta-suave">
              {!hayTexto && 'Falta generar el reporte.'}
              {hayTexto && !aprobado && 'Revisa el texto y apruébalo.'}
              {estado === 'aprobado' && 'Aprobado. Falta enviarle el PDF por correo.'}
              {enviado && `PDF enviado por correo el ${fechaHora(reporte.fecha_envio || pedido.fecha_envio)}.`}
            </div>
            <Boton variante={aprobado ? 'borde' : 'primario'} tamano="lg" icono={aprobado ? 'check' : undefined}
              disabled={aprobado || !hayTexto} cargando={enCurso === 'aprobar'} onClick={aprobar}>
              {aprobado ? 'Aprobado' : 'Aprobar reporte'}
            </Boton>
            <Boton variante={enviado ? 'borde' : 'oro'} tamano="lg" icono="enviar" disabled={!aprobado}
              cargando={enCurso === 'enviar'} onClick={enviar}>
              {enCurso === 'enviar' ? 'Armando el PDF y enviando…' : enviado ? 'Reenviar PDF' : 'Enviar al cliente'}
            </Boton>
          </footer>
        )}
      </section>
    </div>
  )
}

export default DetallePedido
