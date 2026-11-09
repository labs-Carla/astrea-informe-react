import { useEffect, useMemo, useState } from 'react'
import { Boton, Esqueleto, Icono, Insignia, Tarjeta, Vacio } from './ui'
import { useAviso, useConfirmar } from './contextos'
import { coincide, fechaHora, haceCuanto } from './formato'

/**
 * Compatibilidades escritas con IA (astrea-API /admin/compatibilidades-escritas, 2026-11-09).
 *
 * Con Astrea Plus, Astrea escribe los capítulos de una compatibilidad. Pasa por chequeos fijos y
 * por la revisora; si no pasa dos veces queda aquí («en revisión») y la persona ve los textos fijos.
 * Aquí la apruebas (tal cual o editada), la descartas o la generas de nuevo (usa la IA).
 * La lista no muestra nombres, correos ni datos de nacimiento; el texto sí nombra a la otra persona.
 */

const ESTADOS = [
  ['en_panel', 'En revisión'],
  ['aprobada', 'Publicadas'],
  ['descartada', 'Descartadas'],
  ['fallida', 'Con error'],
]

const VINCULOS = { pareja: 'Pareja', amistad: 'Amistad', familia: 'Familia', trabajo: 'Trabajo' }

const PRONOMBRES = { ella: 'en femenino', el: 'en masculino', neutro: 'sin género' }

const CAMPOS = [
  ['titular', 'Titular', 2],
  ['bajada', 'Bajada', 3],
  ['capitulos.esencia', 'Esencia', 8],
  ['capitulos.emocion', 'Emoción', 8],
  ['capitulos.afecto', 'Afecto', 8],
  ['capitulos.palabra', 'Palabra', 8],
  ['capitulos.futuro', 'Futuro', 8],
  ['retos', 'Retos', 8],
  ['superpoder', 'Superpoder', 3],
  ['cierre', 'Cierre', 3],
]

const leer = (contenido, ruta) => ruta.split('.').reduce((o, k) => (o == null ? o : o[k]), contenido) ?? ''

function escribir(contenido, ruta, valor) {
  const [a, b] = ruta.split('.')
  return b ? { ...contenido, [a]: { ...contenido[a], [b]: valor } } : { ...contenido, [a]: valor }
}

const NOMBRE_PORCENTAJE = { global: 'Global', ...Object.fromEntries(CAMPOS.map(([c, t]) => [c.replace('capitulos.', ''), t])) }

const usd = (n, decimales = 2) => `USD ${n.toLocaleString('es', { minimumFractionDigits: decimales, maximumFractionDigits: decimales })}`

const vinculo = (v) => VINCULOS[v] || 'Sin vínculo'
const pronombre = (p) => PRONOMBRES[p] || 'sin elegir'

function Cifra({ etiqueta, valor, ayuda, destacada = false }) {
  return (
    <div title={ayuda} className={`rounded-lg px-4 py-3 ring-1 ${destacada && valor > 0 ? 'bg-[#f8ead6] ring-ambar/30' : 'bg-papel ring-linea'}`}>
      <div className="font-display text-3xl leading-none text-tinta">{valor ?? '—'}</div>
      <div className="mt-1 text-xs text-tinta-suave">{etiqueta}</div>
    </div>
  )
}

function Puntajes({ puntajes }) {
  const lista = Object.entries(puntajes || {})
  if (!lista.length) return null
  return <span className="text-xs text-tinta-tenue">{lista.map(([k, v]) => `${k.charAt(0).toUpperCase()}${k.slice(1)} ${v}`).join(' · ')}</span>
}

function Detalle({ api, fila, interruptor, onCerrar, onCambio }) {
  const avisar = useAviso()
  const confirmar = useConfirmar()
  const [datos, setDatos] = useState(null)
  const [error, setError] = useState(null)
  const [borrador, setBorrador] = useState(null)       // null = sin editar
  const [nota, setNota] = useState('')
  const [enCurso, setEnCurso] = useState(null)
  const ruta = `/admin/compatibilidades-escritas/${fila.id}`

  useEffect(() => {
    let vigente = true
    api.get(ruta).then((d) => { if (vigente) setDatos(d) }).catch((e) => { if (vigente) setError(e.message) })
    const alTeclear = (e) => e.key === 'Escape' && !document.querySelector('[role=alertdialog]') && onCerrar()
    window.addEventListener('keydown', alTeclear)
    return () => { vigente = false; window.removeEventListener('keydown', alTeclear) }
  }, [api, ruta, onCerrar])

  async function hacer(accion, cuerpo, exito) {
    setEnCurso(accion)
    try {
      const r = await api.post(`${ruta}/${accion}`, cuerpo)
      avisar(typeof exito === 'function' ? exito(r) : exito)
      onCambio()
      onCerrar()
    } catch (err) {
      avisar(err.message, 'error')
    } finally {
      setEnCurso(null)
    }
  }

  async function aprobar() {
    const editada = borrador != null
    const ok = await confirmar({
      titulo: editada ? '¿Publicar tu versión?' : '¿Aprobar esta compatibilidad?',
      texto: <p>{editada ? 'Se publica con tus cambios' : 'Se publica tal como está'} y la persona la lee en sus capítulos, en Astrea.</p>,
      accion: 'Publicar',
    })
    if (ok) await hacer('aprobar', editada ? { contenido: borrador } : {}, 'Compatibilidad publicada.')
  }

  async function descartar() {
    if (nota.trim().length < 3) { avisar('Escribe qué está mal (sirve para mejorar la revisión).', 'error'); return }
    const ok = await confirmar({
      titulo: '¿Descartar esta compatibilidad?',
      texto: <p>No se publica: la persona sigue viendo los textos fijos de sus capítulos. No se vuelve a escribir sola.</p>,
      accion: 'Descartar', variante: 'peligro',
    })
    if (ok) await hacer('descartar', { nota: nota.trim() }, 'Compatibilidad descartada.')
  }

  async function regenerar() {
    const ok = await confirmar({
      titulo: '¿Escribirla de nuevo?',
      texto: <p>Usa la IA (unos USD 0,03 a 0,06) y cuenta para el tope diario. La nueva versión pasa otra vez por la revisión automática.</p>,
      accion: 'Escribir de nuevo',
    })
    if (ok) await hacer('regenerar', {}, (r) => r?.mensaje || 'Se está escribiendo de nuevo.')
  }

  const contenido = borrador ?? datos?.contenido
  const ocupada = Boolean(enCurso) || fila.estado === 'preparando'

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-noche/40 backdrop-blur-[1px]" onClick={onCerrar} />
      <section role="dialog" aria-modal="true" aria-label={`Compatibilidad escrita #${fila.compatibilidad_id}`}
        className="relative flex h-full w-full max-w-3xl flex-col bg-marfil font-ui shadow-2xl">
        <header className="border-b border-linea bg-papel px-6 pb-5 pt-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-wider text-tinta-tenue">
                Compatibilidad escrita · #{fila.compatibilidad_id} · {fila.con_invitacion ? 'con invitación' : 'con sus datos'}
              </div>
              <h2 className="mt-1 font-display text-3xl leading-tight text-tinta">{vinculo(fila.vinculo)}</h2>
              <p className="mt-1 text-sm text-tinta-suave">
                Quien lee: {pronombre(fila.pronombres?.tuyo)} · La otra persona: {pronombre(fila.pronombres?.suyo)}
              </p>
            </div>
            <button type="button" onClick={onCerrar} aria-label="Cerrar" className="rounded-lg p-2 text-tinta-tenue hover:bg-pergamino hover:text-tinta">
              <Icono nombre="cerrar" className="size-5" />
            </button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-tinta-tenue">
              {fila.intentos} intento{fila.intentos === 1 ? '' : 's'}
              {fila.costo_usd != null && ` · ${usd(fila.costo_usd, 3)}`} · {fechaHora(fila.preparada)}
            </span>
            <Puntajes puntajes={fila.puntajes} />
          </div>
          {datos?.porcentajes && (
            <p className="mt-2 text-xs text-tinta-tenue">
              Porcentajes: {Object.entries(datos.porcentajes).map(([k, v]) => `${NOMBRE_PORCENTAJE[k] || k} ${v} %`).join(' · ')}
            </p>
          )}
          {fila.motivos?.length > 0 && (
            <p className="mt-2 rounded-lg bg-[#fbeeec] px-3 py-2 text-sm text-vino">Lo que vio la revisión: {fila.motivos.join(' · ')}</p>
          )}
          {datos?.avisos?.length > 0 && (
            <p className="mt-2 rounded-lg bg-[#f8ead6] px-3 py-2 text-sm text-ambar">Los chequeos fijos, ahora: {datos.avisos.join(' · ')}</p>
          )}
          {fila.panel?.nota && <p className="mt-2 text-sm text-tinta-suave">Tu nota: {fila.panel.nota}</p>}
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {error && <p className="text-sm text-vino">No se pudo abrir: {error}</p>}
          {!datos && !error && <div className="space-y-3"><Esqueleto className="h-6 w-1/2" /><Esqueleto className="h-24" /><Esqueleto className="h-24" /></div>}
          {datos && !contenido && <p className="text-tinta-tenue">No hay un texto válido guardado: genéralo de nuevo o descártala.</p>}
          {contenido && CAMPOS.map(([campo, titulo, filas]) => (
            <section key={campo} className="mt-5">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-tinta-suave">{titulo}</h3>
              {borrador ? (
                <textarea aria-label={titulo} value={leer(borrador, campo)} rows={filas}
                  onChange={(e) => setBorrador((b) => escribir(b, campo, e.target.value))}
                  className="mt-1 w-full rounded-lg bg-papel px-3 py-2 text-sm leading-relaxed ring-1 ring-linea outline-none focus:ring-2 focus:ring-oro" />
              ) : (
                String(leer(contenido, campo)).split(/\n\s*\n/).map((p, i) => <p key={i} className="mt-1 leading-relaxed text-tinta">{p}</p>)
              )}
            </section>
          ))}
        </div>

        <footer className="space-y-3 border-t border-linea bg-papel px-6 py-4">
          {fila.estado !== 'aprobada' && (
            <label className="block text-sm font-medium">Si la descartas, cuenta por qué
              <textarea value={nota} onChange={(e) => setNota(e.target.value)} rows={2} maxLength={1000}
                placeholder="Ej.: habla del destino del vínculo, le pone género a la otra persona…"
                className="mt-1 w-full rounded-lg bg-marfil px-3 py-2 text-sm ring-1 ring-linea outline-none focus:ring-2 focus:ring-oro" />
            </label>
          )}
          <div className="flex flex-wrap gap-2">
            {fila.estado !== 'aprobada' && (
              <Boton variante="primario" icono="check" onClick={aprobar} cargando={enCurso === 'aprobar'} disabled={!contenido || ocupada}>
                {borrador ? 'Publicar mi versión' : 'Aprobar y publicar'}
              </Boton>
            )}
            {datos?.contenido && fila.estado !== 'aprobada' && (
              borrador
                ? <Boton onClick={() => setBorrador(null)} disabled={ocupada}>Deshacer cambios</Boton>
                : <Boton onClick={() => setBorrador(datos.contenido)} disabled={ocupada}>Editar</Boton>
            )}
            {fila.estado !== 'aprobada' && fila.estado !== 'descartada' && (
              <Boton variante="peligro" onClick={descartar} cargando={enCurso === 'descartar'} disabled={ocupada}>Descartar</Boton>
            )}
            <span title={interruptor ? undefined : 'La compatibilidad escrita está apagada (COMPAT_IA_ACTIVA)'}>
              <Boton icono="recargar" onClick={regenerar} cargando={enCurso === 'regenerar'} disabled={ocupada || !interruptor}>Escribir de nuevo</Boton>
            </span>
          </div>
        </footer>
      </section>
    </div>
  )
}

function Fila({ fila, onAbrir }) {
  return (
    <li>
      <button type="button" onClick={() => onAbrir(fila)} className="flex w-full flex-col gap-1 px-5 py-4 text-left hover:bg-pergamino/60 sm:flex-row sm:items-center sm:gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{vinculo(fila.vinculo)}</span>
            <span className="font-mono text-xs text-tinta-tenue">#{fila.compatibilidad_id}</span>
            <Insignia tono={fila.con_invitacion ? 'azul' : 'neutro'}>{fila.con_invitacion ? 'Con invitación' : 'Con sus datos'}</Insignia>
            {fila.panel?.editada && <Insignia tono="oro">Editada por ti</Insignia>}
          </div>
          <p className="mt-0.5 text-xs text-tinta-tenue">
            {fila.motivos?.length > 0 ? fila.motivos.join(' · ') : <Puntajes puntajes={fila.puntajes} />}
          </p>
        </div>
        <span className="text-xs text-tinta-tenue" title={fechaHora(fila.preparada)}>{haceCuanto(fila.preparada)}</span>
        <Icono nombre="flecha" className="hidden size-4 text-tinta-tenue sm:block" />
      </button>
    </li>
  )
}

function CompatibilidadesEscritas({ api, busqueda, recarga }) {
  const [estado, setEstado] = useState('en_panel')
  const [datos, setDatos] = useState(null)
  const [error, setError] = useState(null)
  const [abierta, setAbierta] = useState(null)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let vigente = true
    api.get(`/admin/compatibilidades-escritas?estado=${estado}&dias=30`)
      .then((d) => { if (vigente) { setDatos(d); setError(null) } })
      .catch((e) => { if (vigente) setError(e.message) })
    return () => { vigente = false }
  }, [api, estado, recarga, version])

  const lista = useMemo(() => (datos?.lista || []).filter((f) => !busqueda
    || coincide(`${vinculo(f.vinculo)} ${f.compatibilidad_id} ${(f.motivos || []).join(' ')}`, busqueda)), [datos, busqueda])

  if (error && !datos) {
    return <p className="rounded-lg bg-[#fbeeec] px-4 py-3 text-sm text-vino ring-1 ring-vino/20">No se pudieron cargar las compatibilidades escritas: {error}</p>
  }
  const r = datos?.resumen

  return (
    <div className="space-y-5">
      {datos && !datos.interruptor && (
        <div className="flex items-start gap-2 rounded-lg bg-pergamino px-4 py-3 text-sm text-tinta-suave ring-1 ring-linea">
          <Icono nombre="alerta" className="mt-0.5 size-4 shrink-0" />
          <span><b>Apagada en producción</b> (COMPAT_IA_ACTIVA): no se escribe nada y en la app se ven los textos fijos. Tampoco se puede escribir de nuevo desde aquí.</span>
        </div>
      )}

      <Tarjeta className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl">Ahora</h2>
          {datos && (
            <span className="text-sm text-tinta-suave">
              Topes: {datos.tope_mensual} por persona al mes · {datos.tope_diario} al día en total
            </span>
          )}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Cifra etiqueta="En revisión" valor={r?.por_estado.en_panel} destacada ayuda="Esperan tu decisión: la persona ve los textos fijos" />
          <Cifra etiqueta="Publicadas" valor={r?.por_estado.aprobada} ayuda="Se leen en la app" />
          <Cifra etiqueta={`Escritas en ${r?.dias ?? 30} días`} valor={r?.preparadas} ayuda="Cada una puede tener 1 o 2 intentos" />
          <Cifra etiqueta="Costo en esos días" valor={r ? usd(r.costo_usd) : null}
            ayuda={r?.costo_promedio_usd != null ? `${usd(r.costo_promedio_usd, 3)} cada una, en promedio` : 'Escritura + revisora + correctora'} />
        </div>
      </Tarjeta>

      <Tarjeta>
        <div className="flex gap-1 overflow-x-auto border-b border-linea px-5 pt-4" role="tablist">
          {ESTADOS.map(([id, etiqueta]) => (
            <button key={id} type="button" role="tab" aria-selected={estado === id} onClick={() => setEstado(id)}
              className={`-mb-px shrink-0 border-b-2 px-3 pb-2 text-sm font-medium ${estado === id ? 'border-oro text-tinta' : 'border-transparent text-tinta-tenue hover:text-tinta'}`}>
              {etiqueta}{r && <span className="ml-1.5 text-xs text-tinta-tenue">{r.por_estado[id]}</span>}
            </button>
          ))}
        </div>
        {!datos ? <div className="p-5"><Esqueleto className="h-20" /></div> : lista.length === 0 ? (
          <div className="p-8">
            <Vacio titulo={busqueda ? 'Ninguna coincide' : estado === 'en_panel' ? 'No hay nada en revisión' : 'No hay ninguna'}
              texto={estado === 'en_panel' ? 'Aquí llegan las que no pasan la revisión automática dos veces.' : ''} />
          </div>
        ) : (
          <ul className="divide-y divide-linea">{lista.map((f) => <Fila key={f.id} fila={f} onAbrir={setAbierta} />)}</ul>
        )}
      </Tarjeta>

      {abierta && (
        <Detalle api={api} fila={abierta} interruptor={Boolean(datos?.interruptor)} onCerrar={() => setAbierta(null)} onCambio={() => setVersion((v) => v + 1)} />
      )}
    </div>
  )
}

export default CompatibilidadesEscritas
