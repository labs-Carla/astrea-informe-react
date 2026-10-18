import { useCallback, useEffect, useState } from 'react'
import { Boton, Esqueleto, Icono, Insignia, Tarjeta } from './ui'
import { useAviso, useConfirmar } from './contextos'
import { fechaHora } from './formato'

/**
 * Campañas: correos puntuales a toda la lista (astrea-API /admin/campanas).
 * Se escriben aquí, se previsualizan en vivo, se prueban en tu correo y se
 * programan para un día (salen en la corrida de las 9:00) o se envían al momento.
 */

const ESTADO = {
  borrador: { etiqueta: 'Borrador', tono: 'neutro' },
  programada: { etiqueta: 'Programada', tono: 'oro' },
  enviando: { etiqueta: 'Enviándose', tono: 'azul' },
  enviada: { etiqueta: 'Enviada', tono: 'verde' },
}
const VACIA = { asunto: '', cuerpo: '', boton_texto: '', boton_url: '' }
const EDITABLE = (c) => c.estado === 'borrador' || c.estado === 'programada'
const hoyISO = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' })
const fechaCorta = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString('es', { day: 'numeric', month: 'long' })

function Editor({ api, inicial, onCerrar, onGuardada }) {
  const avisar = useAviso()
  const [d, setD] = useState(inicial || VACIA)
  const [vista, setVista] = useState(null)
  const [errorVista, setErrorVista] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const cambiar = (campo) => (e) => setD((x) => ({ ...x, [campo]: e.target.value }))

  useEffect(() => {
    const t = setTimeout(async () => {
      if (d.asunto.trim().length < 3 || d.cuerpo.trim().length < 10) { setVista(null); setErrorVista(null); return }
      try {
        setVista(await api.post('/admin/campanas/vista-previa', d))
        setErrorVista(null)
      } catch (e) {
        setErrorVista(e.message)
      }
    }, 500)
    return () => clearTimeout(t)
  }, [api, d])

  async function guardar() {
    setGuardando(true)
    try {
      const c = inicial?.id ? await api.put(`/admin/campanas/${inicial.id}`, d) : await api.post('/admin/campanas', d)
      avisar(inicial?.id ? 'Campaña guardada.' : 'Campaña creada como borrador.')
      onGuardada(c)
    } catch (e) {
      avisar(e.message, 'error')
    } finally {
      setGuardando(false)
    }
  }

  const campo = 'mt-1 w-full rounded-lg bg-papel px-3 py-2 text-sm ring-1 ring-linea outline-none focus:ring-2 focus:ring-oro'
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-noche/40" onMouseDown={onCerrar}>
      <section className="flex h-full w-full max-w-5xl flex-col bg-marfil shadow-2xl" onMouseDown={(e) => e.stopPropagation()}
        aria-label="Editor de campaña">
        <header className="flex items-center gap-3 border-b border-linea px-6 py-4">
          <h2 className="flex-1 font-display text-2xl">{inicial?.id ? 'Editar campaña' : 'Nueva campaña'}</h2>
          <button type="button" onClick={onCerrar} aria-label="Cerrar" className="rounded-md p-1.5 hover:bg-pergamino"><Icono nombre="cerrar" /></button>
        </header>
        <div className="grid min-h-0 flex-1 gap-6 overflow-y-auto p-6 lg:grid-cols-2">
          <div className="space-y-4">
            <label className="block text-sm font-medium">Asunto
              <input className={campo} value={d.asunto} onChange={cambiar('asunto')} maxLength={120} placeholder="{nombre}, el pack con descuento solo por 72 horas" />
            </label>
            <label className="block text-sm font-medium">Texto
              <textarea className={`${campo} min-h-[260px] font-[inherit] leading-relaxed`} value={d.cuerpo} onChange={cambiar('cuerpo')} maxLength={5000}
                placeholder={'Hola, {nombre}:\n\nEscribe aquí tu mensaje. Deja una línea en blanco entre párrafos.'} />
            </label>
            <p className="text-xs text-tinta-tenue">Escribe <code>{'{nombre}'}</code> donde quieras el nombre de cada persona. La firma «Carla, de Astrea» y el enlace para darse de baja se agregan solos.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm font-medium">Botón (opcional)
                <input className={campo} value={d.boton_texto || ''} onChange={cambiar('boton_texto')} maxLength={80} placeholder="Ver el pack" />
              </label>
              <label className="block text-sm font-medium">Enlace del botón
                <input className={campo} value={d.boton_url || ''} onChange={cambiar('boton_url')} placeholder="https://astrea-charts.site/reportes/pack" />
              </label>
            </div>
            <p className="text-xs text-tinta-tenue">Si el enlace es de la tienda, se le agrega solo el origen de la campaña para ver sus ventas en Hotmart.</p>
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium">Vista previa <span className="font-normal text-tinta-tenue">(con el nombre «Ana»)</span></div>
            <Tarjeta className="mt-1 overflow-hidden">
              {vista ? (
                <>
                  <div className="border-b border-linea bg-pergamino/60 px-4 py-2 text-sm"><span className="text-tinta-tenue">De:</span> Carla de Astrea · <span className="text-tinta-tenue">Asunto:</span> <b>{vista.asunto}</b></div>
                  <iframe title="Vista previa del correo" sandbox="" srcDoc={vista.html} className="h-[460px] w-full bg-white" />
                </>
              ) : (
                <p className="p-6 text-sm text-tinta-tenue">{errorVista || 'Escribe el asunto y el texto para ver cómo queda.'}</p>
              )}
            </Tarjeta>
          </div>
        </div>
        <footer className="flex justify-end gap-2 border-t border-linea px-6 py-4">
          <Boton onClick={onCerrar}>Cancelar</Boton>
          <Boton variante="primario" cargando={guardando} onClick={guardar}>Guardar</Boton>
        </footer>
      </section>
    </div>
  )
}

function Campanas({ api, correoPrueba, onEnvio }) {
  const avisar = useAviso()
  const confirmar = useConfirmar()
  const [datos, setDatos] = useState(null)
  const [editando, setEditando] = useState(null)   // null | {} (nueva) | campaña
  const [enCurso, setEnCurso] = useState(null)
  const [fechas, setFechas] = useState({})

  const cargar = useCallback(async () => {
    try {
      setDatos(await api.get('/admin/campanas'))
    } catch (e) {
      avisar(`No se pudieron cargar las campañas: ${e.message}`, 'error')
    }
  }, [api, avisar])

  useEffect(() => {
    let vigente = true
    api.get('/admin/campanas').then((d) => { if (vigente) setDatos(d) }).catch(() => {})
    return () => { vigente = false }
  }, [api])

  async function accion(clave, fn, exito) {
    setEnCurso(clave)
    try {
      const r = await fn()
      avisar(typeof exito === 'function' ? exito(r) : exito)
      await cargar()
    } catch (e) {
      avisar(e.message, 'error')
    } finally {
      setEnCurso(null)
    }
  }

  const prueba = (c) => accion(`prueba:${c.id}`, () => api.post(`/admin/campanas/${c.id}/prueba`, { email: correoPrueba }),
    `Te enviamos una prueba a ${correoPrueba}.`)
  const programar = (c) => {
    const fecha = fechas[c.id] || c.programada_para || hoyISO()
    return accion(`programar:${c.id}`, () => api.post(`/admin/campanas/${c.id}/programar`, { fecha }),
      `Programada para el ${fechaCorta(fecha)}: sale en la corrida de las 9:00.`)
  }
  async function enviarAhora(c) {
    const ok = await confirmar({
      titulo: '¿Enviar ahora a toda la lista?',
      texto: <p>«<b>{c.asunto}</b>» sale ya a las <b>{datos.destinatarios - c.enviados}</b> personas activas que no la recibieron. Si superan el tope diario ({datos.maximo_diario}), el resto sale mañana.</p>,
      accion: 'Enviar ahora',
    })
    if (ok) {
      await accion(`enviar:${c.id}`, () => api.post(`/admin/campanas/${c.id}/enviar-ahora`),
        (r) => (r.limite_alcanzado ? `Se enviaron ${r.enviados}; el resto sale mañana por el tope diario.` : `Se enviaron ${r.enviados} correos.`))
      onEnvio?.()
    }
  }
  const pausar = (c) => accion(`pausar:${c.id}`, () => api.post(`/admin/campanas/${c.id}/pausar`), 'Campaña pausada: volvió a borrador.')
  async function eliminar(c) {
    const ok = await confirmar({ titulo: '¿Eliminar este borrador?', texto: <p>«{c.asunto}» se borra y no se puede recuperar.</p>, accion: 'Eliminar', variante: 'peligro' })
    if (ok) accion(`eliminar:${c.id}`, () => api.borrar(`/admin/campanas/${c.id}`), 'Borrador eliminado.')
  }

  return (
    <Tarjeta>
      <div className="flex flex-wrap items-center gap-3 border-b border-linea px-5 py-4">
        <div className="flex-1">
          <h2 className="font-display text-xl text-tinta">Campañas</h2>
          <p className="text-sm text-tinta-tenue">Un correo a toda la lista activa{datos ? ` (${datos.destinatarios} personas)` : ''}: Black Friday, Navidad, lanzamientos.</p>
        </div>
        <Boton variante="primario" icono="enviar" onClick={() => setEditando({})}>Nueva campaña</Boton>
      </div>
      {!datos ? <div className="p-5"><Esqueleto className="h-16" /></div> : datos.campanas.length === 0 ? (
        <p className="px-5 py-6 text-sm text-tinta-tenue">Todavía no hay campañas. Crea la primera: queda como borrador hasta que la programes.</p>
      ) : (
        <ul className="divide-y divide-linea">
          {datos.campanas.map((c) => {
            const e = ESTADO[c.estado] || ESTADO.borrador
            return (
              <li key={c.id} className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Insignia tono={e.tono}>{e.etiqueta}</Insignia>
                    <span className="truncate font-medium">{c.asunto}</span>
                  </div>
                  <p className="mt-1 text-xs text-tinta-tenue">
                    {c.estado === 'programada' && `Sale el ${fechaCorta(c.programada_para)} a las 9:00 · `}
                    {c.enviados > 0 && `${c.enviados} enviados · `}
                    {c.fecha_fin_envio ? `terminó ${fechaHora(c.fecha_fin_envio)}` : `creada ${fechaHora(c.fecha_creacion)}`}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {EDITABLE(c) && <Boton tamano="sm" onClick={() => setEditando(c)}>Editar</Boton>}
                  <Boton tamano="sm" cargando={enCurso === `prueba:${c.id}`} onClick={() => prueba(c)} title={`Enviar una prueba a ${correoPrueba}`}>Enviarme una prueba</Boton>
                  {EDITABLE(c) && (
                    <span className="flex items-center gap-1">
                      <input type="date" min={hoyISO()} value={fechas[c.id] || c.programada_para || hoyISO()} aria-label="Fecha de envío"
                        onChange={(ev) => setFechas((f) => ({ ...f, [c.id]: ev.target.value }))}
                        className="h-8 rounded-lg bg-papel px-2 text-sm ring-1 ring-linea" />
                      <Boton tamano="sm" cargando={enCurso === `programar:${c.id}`} onClick={() => programar(c)}>Programar</Boton>
                    </span>
                  )}
                  {c.estado !== 'enviada' && <Boton tamano="sm" variante="oro" icono="enviar" cargando={enCurso === `enviar:${c.id}`} onClick={() => enviarAhora(c)}>Enviar ahora</Boton>}
                  {(c.estado === 'programada' || c.estado === 'enviando') && <Boton tamano="sm" cargando={enCurso === `pausar:${c.id}`} onClick={() => pausar(c)}>Pausar</Boton>}
                  {c.estado === 'borrador' && c.enviados === 0 && (
                    <button type="button" onClick={() => eliminar(c)} className="text-xs text-tinta-tenue hover:text-vino hover:underline">Eliminar</button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
      {editando && (
        <Editor api={api} inicial={editando.id ? editando : null} onCerrar={() => setEditando(null)}
          onGuardada={() => { setEditando(null); cargar() }} />
      )}
    </Tarjeta>
  )
}

export default Campanas
