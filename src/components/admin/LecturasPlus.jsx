import { useEffect, useMemo, useState } from 'react'
import { Boton, Esqueleto, Icono, Insignia, Tarjeta, Vacio } from './ui'
import { useAviso, useConfirmar } from './contextos'
import { coincide, fechaHora, haceCuanto } from './formato'

/**
 * Lecturas de Plus (astrea-API /admin/lecturas-plus, P1b 2c, 2026-11-04).
 *
 * Con Astrea Plus, la lectura natal de la carta principal se genera sola, pasa por el control
 * de calidad y, si lo pasa, se publica SOLO PARA LEER (los temáticos van con candado: Plus les
 * da descuento, no los incluye; decisión de Carla, 2026-11-04). Aquí:
 * - la COLA: las que no pasaron el control dos veces, o en las que marcaste un problema;
 * - la MUESTRA: publicadas que te toca revisar (no todas): por alerta, por poco, de las
 *   primeras de su tipo o al azar;
 * - las MÉTRICAS del período y de ahora.
 * Las compras (lecturas permanentes) NO pasan por aquí: siguen en «Por preparar», con tu revisión.
 * Nada muestra nombre, correo ni datos de nacimiento: solo el número de carta y su Big 3.
 */

const PERIODOS = [1, 7, 30]

const MOTIVOS_MUESTRA = {
  alerta: { tono: 'rojo', texto: 'Alerta', ayuda: 'Marcaste un problema en otra de este tipo esta semana' },
  en_el_limite: { tono: 'ambar', texto: 'Por poco', ayuda: 'La revisora la aprobó con algún puntaje en el mínimo' },
  primeras: { tono: 'azul', texto: 'De las primeras', ayuda: 'Calibración: de las primeras de su tipo' },
  al_azar: { tono: 'neutro', texto: 'Al azar', ayuda: 'Parte del porcentaje al azar' },
}

const PERIODO = [
  ['solicitadas', 'Solicitadas', 'Lecturas que la app (o tú) pidió preparar'],
  ['generadas', 'Generadas', 'Textos pedidos a la IA (cada intento cuenta para el tope)'],
  ['fallidas', 'Fallidas', 'Errores del proveedor: se reintentan, como mucho 3 veces al día'],
  ['aplazadas', 'Aplazadas', 'Por el tope diario o por demasiados fallos: quedan para otro día'],
  ['aprobadas_solas', 'Publicadas solas', 'Pasaron el control'],
  ['al_panel', 'A la cola', 'No pasaron el control dos veces'],
  ['aprobadas_por_ti', 'Aprobadas por ti', 'Desde la cola o la muestra'],
  ['problemas', 'Problemas', 'Las que retiraste'],
]

const AHORA = [
  ['pendientes', 'Pendientes', 'Cola + muestra por revisar'],
  ['en_cola', 'En la cola', 'Esperan tu decisión: no se ven en la app'],
  ['muestra_por_revisar', 'Muestra por revisar', 'Publicadas que te toca mirar'],
  ['publicadas', 'Publicadas', 'Se leen en la app con Plus'],
  ['revisadas_por_ti', 'Revisadas por ti', 'Aprobadas o retiradas'],
]

const NOMBRES = {
  'carta-natal': 'Lectura natal', amor: 'Amor y vínculos', vocacion: 'Vocación y propósito',
  dinero: 'Dinero y abundancia', patrones: 'Patrones y transformación',
}

const humano = (clave) => {
  const t = String(clave).replace(/_/g, ' ')
  return t.charAt(0).toUpperCase() + t.slice(1)
}

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
  return (
    <span className="text-xs text-tinta-tenue">
      {lista.map(([k, v]) => `${humano(k)} ${v}`).join(' · ')}
    </span>
  )
}

/** Muestra cualquier contenido (la natal es un objeto anidado; un temático, secciones de texto). */
function Contenido({ valor, nivel = 0 }) {
  if (valor == null || valor === '') return null
  if (typeof valor === 'string' || typeof valor === 'number' || typeof valor === 'boolean') {
    return String(valor).split(/\n\s*\n/).map((p, i) => <p key={i} className="mt-2 leading-relaxed text-tinta">{p}</p>)
  }
  if (Array.isArray(valor)) {
    return <ul className="mt-2 list-disc space-y-1 pl-5">{valor.map((v, i) => <li key={i}><Contenido valor={v} nivel={nivel + 1} /></li>)}</ul>
  }
  const Titulo = nivel === 0 ? 'h3' : 'h4'
  return Object.entries(valor).filter(([k]) => !k.startsWith('_')).map(([k, v]) => (
    <section key={k} className={nivel === 0 ? 'mt-6' : 'mt-3'}>
      <Titulo className={nivel === 0 ? 'font-display text-2xl text-tinta' : 'text-sm font-semibold uppercase tracking-wide text-tinta-suave'}>{humano(k)}</Titulo>
      <Contenido valor={v} nivel={nivel + 1} />
    </section>
  ))
}

function Detalle({ api, lectura, onCerrar, onCambio }) {
  const avisar = useAviso()
  const confirmar = useConfirmar()
  const [datos, setDatos] = useState(null)
  const [error, setError] = useState(null)
  const [nota, setNota] = useState('')
  const [enCurso, setEnCurso] = useState(null)
  const ruta = `/admin/lecturas-plus/${lectura.codigo}/${lectura.carta_id}`

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
    const ok = await confirmar({
      titulo: '¿Aprobar esta lectura?',
      texto: lectura.estado === 'en_panel'
        ? <p>Se publica tal como está y la suscriptora la podrá leer en Astrea con Plus.</p>
        : <p>Confirmas que está bien: sigue publicada y sale de la muestra.</p>,
      accion: 'Aprobar',
    })
    if (ok) await hacer('aprobar', {}, 'Lectura aprobada.')
  }

  async function marcarProblema() {
    if (nota.trim().length < 3) { avisar('Escribe qué está mal (sirve para mejorar el control).', 'error'); return }
    const ok = await confirmar({
      titulo: '¿Retirar esta lectura?',
      texto: <p>Deja de verse en la app y queda en la cola con tu nota. Desde ahí puedes generarla de nuevo o aprobarla.</p>,
      accion: 'Retirar', variante: 'peligro',
    })
    if (ok) await hacer('marcar-problema', { nota: nota.trim() }, 'Lectura retirada: quedó en la cola.')
  }

  async function regenerar() {
    const ok = await confirmar({
      titulo: '¿Generarla de nuevo?',
      texto: (
        <>
          <p>Usa la IA (tiene costo) y cuenta para el tope diario. La nueva versión pasa otra vez por el control.</p>
          <p>Si la carta tiene una compra, la lectura natal no se reescribe.</p>
        </>
      ),
      accion: 'Generar de nuevo',
    })
    if (ok) await hacer('regenerar', {}, (r) => r?.mensaje || 'Se está generando de nuevo.')
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-noche/40 backdrop-blur-[1px]" onClick={onCerrar} />
      <section role="dialog" aria-modal="true" aria-label={`${NOMBRES[lectura.codigo]} de la carta ${lectura.carta_id}`}
        className="relative flex h-full w-full max-w-3xl flex-col bg-marfil font-ui shadow-2xl">
        <header className="border-b border-linea bg-papel px-6 pb-5 pt-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-wider text-tinta-tenue">Lectura de Plus · carta #{lectura.carta_id}</div>
              <h2 className="mt-1 font-display text-3xl leading-tight text-tinta">{NOMBRES[lectura.codigo] || lectura.codigo}</h2>
              {datos?.carta && (
                <p className="mt-1 text-sm text-tinta-suave">
                  Sol en {datos.carta.Sol || '—'} · Luna en {datos.carta.Luna || '—'} · Ascendente en {datos.carta.Ascendente || '—'}
                </p>
              )}
            </div>
            <button type="button" onClick={onCerrar} aria-label="Cerrar" className="rounded-lg p-2 text-tinta-tenue hover:bg-pergamino hover:text-tinta">
              <Icono nombre="cerrar" className="size-5" />
            </button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            {lectura.estado === 'en_panel' ? <Insignia tono="rojo" punto>En la cola</Insignia> : <Insignia tono="verde" punto>Publicada</Insignia>}
            {lectura.motivo_muestra && <Insignia tono={MOTIVOS_MUESTRA[lectura.motivo_muestra].tono}>{MOTIVOS_MUESTRA[lectura.motivo_muestra].texto}</Insignia>}
            <span className="text-tinta-tenue">{lectura.intentos} intento{lectura.intentos === 1 ? '' : 's'} · {fechaHora(lectura.fecha)}</span>
            <Puntajes puntajes={lectura.puntajes} />
          </div>
          {lectura.motivos?.length > 0 && (
            <p className="mt-2 rounded-lg bg-[#fbeeec] px-3 py-2 text-sm text-vino">Lo que vio el control: {lectura.motivos.join(' · ')}</p>
          )}
          {lectura.problema && (
            <p className="mt-2 rounded-lg bg-[#f8ead6] px-3 py-2 text-sm text-ambar">Tu nota ({haceCuanto(lectura.problema.fecha)}): {lectura.problema.nota}</p>
          )}
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {error && <p className="text-sm text-vino">No se pudo abrir la lectura: {error}</p>}
          {!datos && !error && <div className="space-y-3"><Esqueleto className="h-6 w-1/2" /><Esqueleto className="h-24" /><Esqueleto className="h-24" /></div>}
          {datos && (datos.secciones?.length
            ? datos.secciones.map((sec) => (
              <section key={sec.titulo} className="mt-6">
                <h3 className="font-display text-2xl text-tinta">{sec.titulo}</h3>
                <Contenido valor={sec.texto} nivel={1} />
              </section>
            ))
            : datos.contenido ? <Contenido valor={datos.contenido} /> : <p className="text-tinta-tenue">No hay un texto válido guardado.</p>)}
        </div>

        <footer className="space-y-3 border-t border-linea bg-papel px-6 py-4">
          <label className="block text-sm font-medium">Si algo está mal, cuéntalo
            <textarea value={nota} onChange={(e) => setNota(e.target.value)} rows={2} maxLength={1000}
              placeholder="Ej.: repite frases, dice que el Sol está en Cáncer, promete resultados…"
              className="mt-1 w-full rounded-lg bg-marfil px-3 py-2 text-sm ring-1 ring-linea outline-none focus:ring-2 focus:ring-oro" />
          </label>
          <div className="flex flex-wrap gap-2">
            <Boton variante="primario" icono="check" onClick={aprobar} cargando={enCurso === 'aprobar'} disabled={!datos?.contenido || Boolean(enCurso)}>
              {lectura.estado === 'en_panel' ? 'Aprobar y publicar' : 'Está bien'}
            </Boton>
            {lectura.estado !== 'en_panel' && (
              <Boton variante="peligro" onClick={marcarProblema} cargando={enCurso === 'marcar-problema'} disabled={Boolean(enCurso)}>Retirar por un problema</Boton>
            )}
            <Boton icono="recargar" onClick={regenerar} cargando={enCurso === 'regenerar'} disabled={Boolean(enCurso)}>Generar de nuevo</Boton>
          </div>
        </footer>
      </section>
    </div>
  )
}

function Fila({ lectura, onAbrir }) {
  const motivo = lectura.motivo_muestra && MOTIVOS_MUESTRA[lectura.motivo_muestra]
  return (
    <li>
      <button type="button" onClick={() => onAbrir(lectura)} className="flex w-full flex-col gap-1 px-5 py-4 text-left hover:bg-pergamino/60 sm:flex-row sm:items-center sm:gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{NOMBRES[lectura.codigo] || lectura.codigo}</span>
            <span className="font-mono text-xs text-tinta-tenue">carta #{lectura.carta_id}</span>
            {motivo && <span title={motivo.ayuda}><Insignia tono={motivo.tono}>{motivo.texto}</Insignia></span>}
            {lectura.problema && <Insignia tono="ambar">Con tu nota</Insignia>}
          </div>
          <p className="mt-0.5 text-xs text-tinta-tenue">
            {lectura.motivos?.length > 0 ? lectura.motivos.join(' · ') : <Puntajes puntajes={lectura.puntajes} />}
          </p>
        </div>
        <span className="text-xs text-tinta-tenue" title={fechaHora(lectura.fecha)}>{haceCuanto(lectura.fecha)}</span>
        <Icono nombre="flecha" className="hidden size-4 text-tinta-tenue sm:block" />
      </button>
    </li>
  )
}

function LecturasPlus({ api, busqueda, recarga }) {
  const [dias, setDias] = useState(7)
  const [vista, setVista] = useState('cola')
  const [metricas, setMetricas] = useState(null)
  const [cola, setCola] = useState(null)
  const [muestra, setMuestra] = useState(null)
  const [error, setError] = useState(null)
  const [abierta, setAbierta] = useState(null)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let vigente = true
    Promise.all([api.get(`/admin/lecturas-plus/metricas?dias=${dias}`), api.get('/admin/lecturas-plus'),
                 api.get('/admin/lecturas-plus/muestra?n=100')])
      .then(([m, c, s]) => { if (vigente) { setMetricas(m); setCola(c); setMuestra(s); setError(null) } })
      .catch((e) => { if (vigente) setError(e.message) })
    return () => { vigente = false }
  }, [api, dias, recarga, version])

  const filtrar = (lista) => (lista || []).filter((l) => !busqueda
    || coincide(`${NOMBRES[l.codigo] || ''} ${l.codigo} ${l.carta_id}`, busqueda))
  const lista = useMemo(() => filtrar(vista === 'cola' ? cola : muestra?.lecturas),
    [vista, cola, muestra, busqueda])   // eslint-disable-line react-hooks/exhaustive-deps

  if (error && !metricas) {
    return <p className="rounded-lg bg-[#fbeeec] px-4 py-3 text-sm text-vino ring-1 ring-vino/20">No se pudieron cargar las lecturas de Plus: {error}</p>
  }

  return (
    <div className="space-y-5">
      {metricas && !metricas.interruptor && (
        <div className="flex items-start gap-2 rounded-lg bg-pergamino px-4 py-3 text-sm text-tinta-suave ring-1 ring-linea">
          <Icono nombre="alerta" className="mt-0.5 size-4 shrink-0" />
          <span><b>Apagadas en producción</b> (PLUS_LECTURAS_ACTIVAS): no se genera nada y nadie las ve en la app. Las compras no cambian: siguen en «Por preparar».</span>
        </div>
      )}

      <Tarjeta className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl">Ahora</h2>
          {metricas && (
            <span className="text-sm text-tinta-suave">
              Generadas hoy: <b>{metricas.generadas_hoy}</b> de {metricas.tope_diario} (tope diario, día de Bogotá)
            </span>
          )}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {AHORA.map(([k, etiqueta, ayuda]) => (
            <Cifra key={k} etiqueta={etiqueta} ayuda={ayuda} valor={metricas?.ahora[k]} destacada={k === 'pendientes'} />
          ))}
        </div>
      </Tarjeta>

      <Tarjeta className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl">Lo que pasó</h2>
          <div className="flex gap-1" role="group" aria-label="Período">
            {PERIODOS.map((d) => (
              <button key={d} type="button" onClick={() => setDias(d)} aria-pressed={dias === d}
                className={`rounded-md px-2.5 py-1 text-xs font-medium ${dias === d ? 'bg-tinta text-papel' : 'text-tinta-suave ring-1 ring-linea hover:bg-pergamino'}`}>
                {d === 1 ? 'Hoy' : `${d} días`}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {PERIODO.map(([k, etiqueta, ayuda]) => (
            <Cifra key={k} etiqueta={etiqueta} ayuda={ayuda} valor={metricas?.periodo[k]} destacada={k === 'fallidas' || k === 'problemas'} />
          ))}
        </div>
        {metricas && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <caption className="sr-only">Por tipo de lectura</caption>
              <thead>
                <tr className="text-left text-xs text-tinta-tenue">
                  <th className="py-1 font-medium">Lectura</th>
                  {['Solicitadas', 'Generadas', 'Fallidas', 'Publicadas solas', 'A la cola', 'Problemas'].map((t) => <th key={t} className="py-1 text-right font-medium">{t}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-linea">
                {/* Plus abre hoy solo la natal (los temáticos van con candado): un tipo sin movimiento no se muestra. */}
                {Object.entries(metricas.por_lectura)
                  .filter(([codigo, c]) => codigo === 'carta-natal' || Object.values(c).some((n) => n > 0))
                  .map(([codigo, c]) => (
                  <tr key={codigo}>
                    <td className="py-1.5">{NOMBRES[codigo] || codigo}</td>
                    {['solicitadas', 'generadas', 'fallidas', 'aprobadas_solas', 'al_panel', 'problemas'].map((k) => (
                      <td key={k} className="py-1.5 text-right tabular-nums">{c[k]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {metricas && (
          <p className="mt-3 text-xs text-tinta-tenue">
            Muestreo: las primeras {metricas.muestreo.primeras} de cada tipo, el {metricas.muestreo.porcentaje} % al azar, las aprobadas por poco
            y, si marcas un problema, todas las de ese tipo durante 7 días.
          </p>
        )}
      </Tarjeta>

      <Tarjeta>
        <div className="flex gap-1 border-b border-linea px-5 pt-4" role="tablist">
          {[['cola', 'Cola', cola?.length], ['muestra', 'Muestra por revisar', muestra?.total]].map(([id, etiqueta, n]) => (
            <button key={id} type="button" role="tab" aria-selected={vista === id} onClick={() => setVista(id)}
              className={`-mb-px border-b-2 px-3 pb-2 text-sm font-medium ${vista === id ? 'border-oro text-tinta' : 'border-transparent text-tinta-tenue hover:text-tinta'}`}>
              {etiqueta}{n != null && <span className="ml-1.5 text-xs text-tinta-tenue">{n}</span>}
            </button>
          ))}
        </div>
        {!metricas ? <div className="p-5"><Esqueleto className="h-20" /></div> : lista.length === 0 ? (
          <div className="p-8">
            <Vacio titulo={busqueda ? 'Ninguna coincide' : vista === 'cola' ? 'La cola está vacía' : 'No hay nada que revisar'}
              texto={vista === 'cola' ? 'Aquí llegan las que no pasan el control dos veces y las que retires.'
                : 'Aquí aparecen las publicadas que te toca mirar: no hace falta revisarlas todas.'} />
          </div>
        ) : (
          <ul className="divide-y divide-linea">{lista.map((l) => <Fila key={`${l.codigo}:${l.carta_id}`} lectura={l} onAbrir={setAbierta} />)}</ul>
        )}
      </Tarjeta>

      {abierta && (
        <Detalle api={api} lectura={abierta} onCerrar={() => setAbierta(null)} onCambio={() => setVersion((v) => v + 1)} />
      )}
    </div>
  )
}

export default LecturasPlus
