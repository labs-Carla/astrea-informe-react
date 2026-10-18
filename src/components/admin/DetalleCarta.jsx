import { useCallback, useEffect, useState } from 'react'
import { URL_LECTURA } from './api'
import { Boton, BotonCopiar, Esqueleto, Icono, Insignia, Paso } from './ui'
import { useAviso, useConfirmar } from './contextos'
import { entrega, fechaHora, lugar } from './formato'
import NarracionLectura from './NarracionLectura'

const PLANETAS = [
  ['sol', 'Sol'], ['luna', 'Luna'], ['mercurio', 'Mercurio'], ['venus', 'Venus'], ['marte', 'Marte'],
  ['jupiter', 'Júpiter'], ['saturno', 'Saturno'], ['urano', 'Urano'], ['neptuno', 'Neptuno'], ['pluton', 'Plutón'],
  ['nodo_norte', 'Nodo Norte'], ['quiron', 'Quirón'], ['ascendente', 'Ascendente'], ['medio_cielo', 'Medio Cielo'],
]

/** Las tres generaciones con Claude, en el orden en que se hacen. */
const BLOQUES = [
  {
    id: 'interpretacion', titulo: 'Interpretación completa', endpoint: 'generar-interpretacion',
    secciones: (d) => [
      ['Esencia', d?.carta_en_una_mirada?.esencia], ['Visión general', d?.overview],
      ['Elementos y dignidades', d?.lectura_elementos_dignidades],
      ...PLANETAS.map(([clave, nombre]) => [nombre, d?.[clave]]),
      ['Conclusión', d?.conclusion], ['Frase de cierre', d?.frase_de_cierre],
    ],
  },
  {
    id: 'areas_de_vida', titulo: 'Áreas de vida', endpoint: 'generar-areas-de-vida',
    secciones: (d) => [['Vocación', d?.vocacion], ['Dinero', d?.dinero], ['Amor', d?.amor], ['Herida y don', d?.herida_y_don]],
  },
  {
    id: 'transitos', titulo: 'Tránsitos', endpoint: 'generar-transitos',
    secciones: (d) => [['Clima energético', d?.clima_energetico], ['Oportunidades', d?.oportunidades], ['Retos', d?.retos], ['Consejo', d?.consejo]],
  },
]

function estadoBloque(detalle, id) {
  const valor = detalle?.[id]
  if (!valor) return 'falta'
  if (valor._validation_error) return 'error'
  return 'listo'
}

/** Sol, Luna y Ascendente del cálculo (si vienen), para ubicar la carta de un vistazo. */
function TresGrandes({ calculo }) {
  const signo = (x) => x?.signo
  const datos = [
    ['Sol', signo(calculo?.planetas?.Sol)], ['Luna', signo(calculo?.planetas?.Luna)],
    ['Ascendente', signo(calculo?.puntos_angulares?.Ascendente)],
  ].filter(([, s]) => s)
  if (!datos.length) return null
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
      {datos.map(([k, s]) => <span key={k}><span className="text-tinta-tenue">{k}</span> <span className="text-tinta">{s}</span></span>)}
    </div>
  )
}

/**
 * Ficha de una carta en un panel lateral: estado del recorrido, las tres
 * generaciones con Claude (cada una con su botón), vista previa y, abajo,
 * los dos pasos finales separados: «Aprobar lectura» (revisión, no envía
 * nada) y «Enviar al cliente» (genera el PDF y lo manda adjunto).
 */
function DetalleCarta({ api, cartaId, resumenLista, onCerrar, onCambio, acciones }) {
  const avisar = useAviso()
  const confirmar = useConfirmar()
  const [detalle, setDetalle] = useState(null)
  const [error, setError] = useState(null)
  const [genero, setGenero] = useState('')
  const [enCurso, setEnCurso] = useState(null)
  const [pestana, setPestana] = useState('interpretacion')

  /** Detalle de la carta; 409 = todavía sin interpretación (se muestra para generarla). */
  const obtener = useCallback(async () => {
    try {
      return { datos: await api.get(`/admin/carta/${cartaId}`) }
    } catch (err) {
      return err.status === 409 ? { datos: { sinInterpretacion: true } } : { error: err.message }
    }
  }, [api, cartaId])

  const aplicar = useCallback(({ datos, error: fallo }) => {
    setError(fallo || null)
    if (datos) setDetalle(datos)
    if (datos?.genero) setGenero(datos.genero)
  }, [])

  const cargar = useCallback(async () => aplicar(await obtener()), [obtener, aplicar])

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

  async function accion(endpoint, cuerpo, exito) {
    setEnCurso(endpoint)
    try {
      const r = await api.post(`/admin/${endpoint}/${cartaId}`, cuerpo)
      avisar(exito || r.mensaje || 'Listo.')
      await cargar()
      onCambio()
      return r
    } catch (err) {
      avisar(err.message, 'error')
      return null
    } finally {
      setEnCurso(null)
    }
  }

  async function generar(bloque, existe) {
    if (existe) {
      const ok = await confirmar({
        titulo: `¿Regenerar ${bloque.titulo.toLowerCase()}?`,
        texto: <p>Se reemplaza el texto actual por uno nuevo (es otra llamada a la IA, con costo). Revísalo antes de aprobar.</p>,
        accion: 'Regenerar',
      })
      if (!ok) return
    }
    await accion(bloque.endpoint, { genero: genero || null, forzar: existe }, `${bloque.titulo}: generada.`)
  }

  async function aprobar() {
    const ok = await confirmar({
      titulo: '¿Aprobar esta lectura?',
      texto: <p>Queda lista para enviar y se crea su enlace web. <b>Todavía no se envía ningún correo</b>: eso lo hace el botón «Enviar al cliente».</p>,
      accion: 'Aprobar lectura',
    })
    if (ok) await accion('aprobar', {}, 'Lectura aprobada. Ya puedes enviarla.')
  }

  async function enviar(reenviar) {
    const aMano = estadoEntrega === 'a-mano'
    const ok = await confirmar({
      titulo: reenviar ? '¿Reenviar el PDF?' : aMano ? '¿Enviarle también el PDF?' : '¿Enviar la lectura al cliente?',
      texto: (
        <p>
          {aMano && 'Esta lectura ya se entregó a mano. '}
          Se arma el PDF con el texto aprobado y se envía adjunto a <b>{detalle.email}</b> con el correo «Tu lectura está lista».
          {(reenviar || aMano) && ' La persona recibirá un correo nuevo.'}
        </p>
      ),
      accion: reenviar ? 'Reenviar' : 'Enviar ahora',
      variante: 'oro',
    })
    if (ok) await accion('enviar-lectura', reenviar ? { reenviar: true } : {})
  }

  /** La vista previa exige X-Admin-Secret: se pide con fetch y se abre como blob. */
  async function vistaPrevia() {
    const pestanaNueva = window.open('', '_blank')
    setEnCurso('vista-previa')
    try {
      const html = await api.texto(`/admin/carta/${cartaId}/vista-previa`)
      const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }))
      if (pestanaNueva) pestanaNueva.location.href = url
      else window.location.href = url
    } catch (err) {
      pestanaNueva?.close()
      avisar(`No se pudo abrir la vista previa: ${err.message}`, 'error')
    } finally {
      setEnCurso(null)
    }
  }

  const aprobada = Boolean(detalle?.enviado)
  const estadoEntrega = detalle && !detalle.sinInterpretacion ? entrega(detalle).estado : 'por-enviar'
  const enviada = estadoEntrega === 'correo'
  const entregada = enviada || estadoEntrega === 'a-mano'
  const estados = Object.fromEntries(BLOQUES.map((b) => [b.id, estadoBloque(detalle, b.id)]))
  const faltan = BLOQUES.filter((b) => estados[b.id] !== 'listo')
  const bloque = BLOQUES.find((b) => b.id === pestana)

  const pasos = [
    ['Pagada', true],
    ['Interpretación', estados.interpretacion === 'listo'],
    ['Áreas de vida', estados.areas_de_vida === 'listo'],
    ['Tránsitos', estados.transitos === 'listo'],
    ['Aprobada', aprobada],
    ['Entregada', entregada],
  ]
  const primerPendiente = pasos.findIndex(([, hecho]) => !hecho)

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-noche/40 backdrop-blur-[1px]" onClick={onCerrar} />
      <section role="dialog" aria-modal="true" aria-label={`Carta ${cartaId}`}
        className="relative flex h-full w-full max-w-3xl flex-col bg-marfil font-ui shadow-2xl">
        <header className="border-b border-linea bg-papel px-6 pb-5 pt-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-wider text-tinta-tenue">Carta natal · #{cartaId}</div>
              <h2 className="mt-1 truncate font-display text-3xl leading-tight text-tinta">
                {detalle?.nombre_reporte || resumenLista?.nombre_reporte || (detalle ? '(sin nombre)' : '…')}
              </h2>
              {detalle?.email && (
                <div className="mt-0.5 flex items-center gap-1 text-sm text-tinta-suave">
                  {detalle.email}<BotonCopiar texto={detalle.email} etiqueta="Copiar correo" />
                </div>
              )}
            </div>
            <button type="button" onClick={onCerrar} aria-label="Cerrar"
              className="rounded-lg p-2 text-tinta-tenue hover:bg-pergamino hover:text-tinta">
              <Icono nombre="cerrar" className="size-5" />
            </button>
          </div>

          {detalle && !detalle.sinInterpretacion && (
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-tinta-suave">
              <span>{lugar(detalle.ciudad, detalle.pais)}</span>
              <TresGrandes calculo={detalle.calculo} />
              {aprobada && (
                <Insignia tono={{ correo: 'verde', 'a-mano': 'verde', reembolsada: 'rojo' }[estadoEntrega] || 'azul'} punto>
                  {{ correo: 'PDF enviado por correo', 'a-mano': 'Entregada a mano', reembolsada: 'Reembolsada' }[estadoEntrega] || 'Lista para enviar'}
                </Insignia>
              )}
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
          {!detalle && !error && <div className="space-y-4"><Esqueleto className="h-10" /><Esqueleto className="h-64" /></div>}

          {detalle && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-end gap-4">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-tinta-tenue">Género (para la concordancia del texto)</span>
                  <select value={genero} onChange={(e) => setGenero(e.target.value)}
                    className="h-9 rounded-lg bg-papel px-3 text-sm ring-1 ring-linea-fuerte outline-none focus:ring-2 focus:ring-oro">
                    <option value="">No especificar</option>
                    <option value="femenino">Femenino</option>
                    <option value="masculino">Masculino</option>
                  </select>
                </label>
                <Boton icono="externo" onClick={vistaPrevia} cargando={enCurso === 'vista-previa'}>Ver vista previa del PDF</Boton>
                {resumenLista?.token && (
                  <a href={`${URL_LECTURA}${resumenLista.token}`} target="_blank" rel="noreferrer"
                    className="inline-flex h-9 items-center gap-1.5 text-sm text-oro hover:underline">
                    Ver enlace web <Icono nombre="externo" className="size-3.5" />
                  </a>
                )}
              </div>

              {aprobada && !detalle.reembolsado && <NarracionLectura api={api} cartaId={cartaId} />}

              <div className="rounded-xl bg-papel ring-1 ring-linea">
                <div className="flex gap-1 overflow-x-auto border-b border-linea px-2 pt-2" role="tablist">
                  {BLOQUES.map((b) => (
                    <button key={b.id} type="button" role="tab" aria-selected={pestana === b.id} onClick={() => setPestana(b.id)}
                      className={`flex items-center gap-2 whitespace-nowrap rounded-t-lg border-b-2 px-3 py-2.5 text-sm transition ${
                        pestana === b.id ? 'border-oro text-tinta' : 'border-transparent text-tinta-tenue hover:text-tinta'
                      }`}>
                      <span className={`size-1.5 rounded-full ${estados[b.id] === 'listo' ? 'bg-salvia' : estados[b.id] === 'error' ? 'bg-vino' : 'bg-linea-fuerte'}`} />
                      {b.titulo}
                    </button>
                  ))}
                </div>

                <div className="p-5">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    {estados[bloque.id] === 'listo' && <Insignia tono="verde" punto>Generada</Insignia>}
                    {estados[bloque.id] === 'error' && <Insignia tono="rojo" punto>Salió con errores: regenérala</Insignia>}
                    {estados[bloque.id] === 'falta' && <Insignia punto>Aún no generada</Insignia>}
                    <Boton variante={estados[bloque.id] === 'listo' ? 'borde' : 'primario'} tamano="sm"
                      cargando={enCurso === bloque.endpoint}
                      disabled={bloque.id !== 'interpretacion' && estados.interpretacion !== 'listo'}
                      onClick={() => generar(bloque, estados[bloque.id] !== 'falta')}>
                      {enCurso === bloque.endpoint ? 'Generando (15–30 s)…' : estados[bloque.id] === 'falta' ? 'Generar' : 'Regenerar'}
                    </Boton>
                  </div>
                  {bloque.id !== 'interpretacion' && estados.interpretacion !== 'listo' && (
                    <p className="mb-4 text-sm text-tinta-tenue">Primero genera la interpretación completa.</p>
                  )}
                  {estados[bloque.id] === 'listo' ? (
                    <div className="space-y-5">
                      {bloque.secciones(detalle[bloque.id]).filter(([, t]) => t).map(([titulo, texto]) => (
                        <div key={titulo}>
                          <div className="mb-1 font-romana text-[11px] tracking-[.18em] text-oro">{titulo.toUpperCase()}</div>
                          <p className="whitespace-pre-line font-display text-[17px] leading-relaxed text-tinta">{texto}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-tinta-tenue">Aquí aparecerá el texto para revisarlo antes de aprobar.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {detalle && (
          <footer className="border-t border-linea bg-papel px-6 py-4">
            {detalle.reembolsado ? (
              <p className="text-sm text-vino">Pedido reembolsado: no se envía.</p>
            ) : (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex-1 text-sm text-tinta-suave">
                  {!aprobada && (faltan.length
                    ? `Falta generar: ${faltan.map((b) => b.titulo.toLowerCase()).join(', ')}.`
                    : 'Todo está generado. Revisa el texto y apruébalo.')}
                  {aprobada && !entregada && 'Aprobada. Falta enviarle el PDF por correo.'}
                  {estadoEntrega === 'a-mano' && `Entregada a mano (aprobada el ${fechaHora(detalle.fecha_envio)}). Si quieres, también puedes enviarle el PDF.`}
                  {enviada && `PDF enviado por correo el ${fechaHora(detalle.fecha_correo_entrega)}.`}
                </div>
                <Boton variante={aprobada ? 'borde' : 'primario'} tamano="lg" icono={aprobada ? 'check' : undefined}
                  disabled={aprobada || estados.interpretacion !== 'listo'} cargando={enCurso === 'aprobar'} onClick={aprobar}>
                  {aprobada ? 'Aprobada' : 'Aprobar lectura'}
                </Boton>
                <Boton variante={entregada ? 'borde' : 'oro'} tamano="lg" icono="enviar" disabled={!aprobada}
                  cargando={enCurso === 'enviar-lectura'} onClick={() => enviar(enviada)}>
                  {enCurso === 'enviar-lectura' ? 'Armando el PDF y enviando…' : enviada ? 'Reenviar PDF' : estadoEntrega === 'a-mano' ? 'Enviar PDF por correo' : 'Enviar al cliente'}
                </Boton>
              </div>
            )}
            {acciones && !detalle.reembolsado && (
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1">
                <button type="button" onClick={() => acciones.orderBump({ id: cartaId, nombre_reporte: detalle.nombre_reporte, email: detalle.email })}
                  className="text-xs text-tinta-tenue underline-offset-2 hover:text-tinta hover:underline">
                  Registrar order bump de Amor y vínculos
                </button>
                {aprobada && (
                  <button type="button" onClick={() => acciones.reembolsar({ id: cartaId, nombre_reporte: detalle.nombre_reporte, email: detalle.email }).then(cargar)}
                    className="text-xs text-tinta-tenue underline-offset-2 hover:text-vino hover:underline">
                    Registrar reembolso
                  </button>
                )}
              </div>
            )}
          </footer>
        )}
      </section>
    </div>
  )
}

export default DetalleCarta
