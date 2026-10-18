import { useCallback, useEffect, useMemo, useState } from 'react'
import { Boton, Esqueleto, Icono, Insignia, Tarjeta, Vacio } from './ui'
import { coincide, fechaHora, haceCuanto } from './formato'
import Campanas from './Campanas'

// Las pruebas de campaña llegan aquí (decisión de Astrea, 2026-10-18).
const CORREO_PRUEBA = 'guiasastrologicas@gmail.com'

/**
 * Lista de correos (astrea-API: /admin/lista y /admin/lista/procesar).
 * Cuántas personas hay, de qué canal llegaron, qué correos recibió cada una y
 * qué sale en la corrida de hoy (simulada: el envío real lo hace GitHub Actions
 * todos los días a las 9:00 de Bogotá).
 */

// Nombre legible de cada paso de las secuencias (app/domain/secuencias_lista.py).
const NOMBRE_PASO = {
  'bienvenida:dia-2': 'Bienvenida · día 2',
  'bienvenida:dia-5': 'Bienvenida · día 5',
  post_entrega: 'Post-entrega',
  cumpleanos: 'Cumpleaños',
}
const nombrePaso = (c) => (c.secuencia === 'campana' ? `Campaña #${c.paso}`
  : NOMBRE_PASO[`${c.secuencia}:${c.paso}`] || NOMBRE_PASO[c.secuencia] || `${c.secuencia} · ${c.paso}`)
const NOMBRE_SECUENCIA = { bienvenida: 'Bienvenida', cumpleanos: 'Cumpleaños', post_entrega: 'Post-entrega', campana: 'Campañas' }

function Cifra({ etiqueta, valor, detalle, cargando }) {
  return (
    <Tarjeta className="p-4 sm:p-5">
      <span className="text-[11px] font-medium uppercase tracking-wider text-tinta-tenue sm:text-xs">{etiqueta}</span>
      {cargando ? <Esqueleto className="mt-3 h-10 w-16" /> : (
        <div className={`mt-2 font-display text-5xl leading-none lining-nums ${valor > 0 ? 'text-oro' : 'text-tinta/30'}`}>{valor}</div>
      )}
      <div className="mt-2 text-xs text-tinta-suave sm:text-sm">{detalle}</div>
    </Tarjeta>
  )
}

function PorOrigen({ porOrigen }) {
  const filas = Object.entries(porOrigen || {})
  const maximo = Math.max(1, ...filas.map(([, n]) => n))
  if (!filas.length) return <p className="text-sm text-tinta-tenue">Todavía no hay suscriptores activos.</p>
  return (
    <ul className="space-y-2.5">
      {filas.map(([origen, n]) => (
        <li key={origen} className="grid grid-cols-[minmax(0,9rem)_1fr_2rem] items-center gap-3 text-sm">
          <span className="truncate text-tinta-suave" title={origen}>{origen}</span>
          <span className="h-2 rounded-full bg-pergamino"><span className="block h-2 rounded-full bg-oro" style={{ width: `${(n / maximo) * 100}%` }} /></span>
          <span className="text-right font-medium lining-nums">{n}</span>
        </li>
      ))}
    </ul>
  )
}

function CorridaDeHoy({ api }) {
  const [plan, setPlan] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(null)
  async function simular() {
    setCargando(true)
    setError(null)
    try {
      setPlan(await api.post('/admin/lista/procesar?simular=true'))
    } catch (e) {
      setError(e.message)
    } finally {
      setCargando(false)
    }
  }
  return (
    <div>
      <p className="text-sm text-tinta-suave">Los correos de secuencia salen solos todos los días a las 9:00 (Bogotá). Mira qué saldría hoy, sin enviar nada.</p>
      <Boton className="mt-3" icono="reloj" cargando={cargando} onClick={simular}>Ver qué sale hoy</Boton>
      {error && <p className="mt-3 text-sm text-vino">{error}</p>}
      {plan && (
        plan.detalle.length === 0
          ? <p className="mt-3 text-sm text-tinta-suave">Hoy no le toca ningún correo a nadie.</p>
          : (
            <ul className="mt-3 space-y-1.5 text-sm">
              {plan.detalle.map((d) => (
                <li key={`${d.suscriptor_id}-${d.secuencia}-${d.paso}`} className="flex gap-2">
                  <Insignia tono="oro">{nombrePaso(d)}</Insignia>
                  <span className="truncate text-tinta-suave">{d.asunto}</span>
                </li>
              ))}
              {plan.limite_alcanzado && <li className="text-ambar">Se alcanzó el tope diario: el resto sale mañana.</li>}
            </ul>
          )
      )}
    </div>
  )
}

function ListaCorreos({ api, busqueda, recarga }) {
  const [datos, setDatos] = useState(null)
  const [error, setError] = useState(null)
  const [filtro, setFiltro] = useState('activos')

  const cargar = useCallback(async () => {
    try {
      setDatos(await api.get('/admin/lista'))
      setError(null)
    } catch (e) {
      setError(e.message)
    }
  }, [api])

  useEffect(() => {
    let vigente = true
    api.get('/admin/lista')
      .then((d) => { if (vigente) { setDatos(d); setError(null) } })
      .catch((e) => { if (vigente) setError(e.message) })
    return () => { vigente = false }
  }, [api, recarga])

  const filas = useMemo(() => (datos?.suscriptores || [])
    .filter((s) => (filtro === 'activos' ? s.activo : filtro === 'bajas' ? !s.activo : true))
    .filter((s) => !busqueda || coincide(`${s.nombre} ${s.email} ${s.origen || ''}`, busqueda)), [datos, filtro, busqueda])

  const r = datos?.resumen
  const correos7 = r ? Object.values(r.correos_7_dias || {}).reduce((a, b) => a + b, 0) : 0
  const detalle7 = r && Object.keys(r.correos_7_dias || {}).length
    ? Object.entries(r.correos_7_dias).map(([s, n]) => `${NOMBRE_SECUENCIA[s] || s}: ${n}`).join(' · ')
    : 'Bienvenida, cumpleaños y post-entrega'

  if (error && !datos) {
    return (
      <div className="flex items-start gap-2 rounded-lg bg-[#fbeeec] px-4 py-3 text-sm text-vino ring-1 ring-vino/20">
        <Icono nombre="alerta" className="mt-0.5 shrink-0" />
        <span>No se pudo cargar la lista: {error} <button type="button" className="underline" onClick={cargar}>Reintentar</button></span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Cifra etiqueta="Activos" valor={r?.activos ?? 0} detalle={`Suscriptores · ${r?.total ?? 0} en total`} cargando={!datos} />
        <Cifra etiqueta="Altas · 7 días" valor={r?.altas_7_dias ?? 0} detalle="Personas que se sumaron esta semana" cargando={!datos} />
        <Cifra etiqueta="Correos · 7 días" valor={correos7} detalle={detalle7} cargando={!datos} />
        <Cifra etiqueta="Bajas" valor={r?.bajas ?? 0} detalle={`${r?.big3_enviados ?? 0} Big 3 enviados en total`} cargando={!datos} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Tarjeta className="p-5">
          <h2 className="font-display text-xl text-tinta">De dónde llegan</h2>
          <p className="mb-4 text-sm text-tinta-tenue">Suscriptores activos por canal (el <code>src</code> del enlace)</p>
          {datos ? <PorOrigen porOrigen={r.por_origen} /> : <Esqueleto className="h-24" />}
        </Tarjeta>
        <Tarjeta className="p-5">
          <h2 className="font-display text-xl text-tinta">Correos de hoy</h2>
          <div className="mt-2"><CorridaDeHoy api={api} /></div>
        </Tarjeta>
      </div>

      <Campanas api={api} correoPrueba={CORREO_PRUEBA} onEnvio={cargar} />

      <Tarjeta>
        <div className="flex flex-wrap items-center gap-2 border-b border-linea px-5 py-3">
          {[['activos', 'Activos'], ['bajas', 'Bajas'], ['todos', 'Todos']].map(([id, etiqueta]) => (
            <button key={id} type="button" onClick={() => setFiltro(id)}
              className={`rounded-full px-3 py-1 text-sm ${filtro === id ? 'bg-noche text-papel' : 'text-tinta-suave hover:bg-pergamino'}`}>
              {etiqueta}
            </button>
          ))}
          <span className="ml-auto text-xs text-tinta-tenue">{filas.length} de {datos?.suscriptores.length ?? 0}</span>
        </div>
        {datos && filas.length === 0 ? (
          <div className="p-8"><Vacio titulo="Nadie por aquí todavía" texto="Las personas aparecen cuando piden su Big 3 en la carta gratis o marcan la casilla de correos al comprar." /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-tinta-tenue">
                  <th className="px-5 py-2.5 font-medium">Persona</th>
                  <th className="px-3 py-2.5 font-medium">Canal</th>
                  <th className="px-3 py-2.5 font-medium">Alta</th>
                  <th className="px-3 py-2.5 font-medium">Correos recibidos</th>
                  <th className="px-5 py-2.5 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {!datos && [0, 1, 2].map((i) => (
                  <tr key={i} className="border-t border-linea"><td colSpan={5} className="px-5 py-3"><Esqueleto className="h-5" /></td></tr>
                ))}
                {filas.map((s) => (
                  <tr key={s.id} className="border-t border-linea align-top">
                    <td className="px-5 py-3">
                      <div className="font-medium text-tinta">{s.nombre}</div>
                      <div className="text-xs text-tinta-tenue">{s.email}</div>
                    </td>
                    <td className="px-3 py-3 text-tinta-suave">{s.origen || '—'}</td>
                    <td className="px-3 py-3 text-tinta-suave" title={fechaHora(s.fecha_alta)}>{haceCuanto(s.fecha_alta)}</td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {s.fecha_envio_big3 && <span title={fechaHora(s.fecha_envio_big3)}><Insignia tono="verde">Big 3</Insignia></span>}
                        {s.correos.map((c) => (
                          <span key={`${c.secuencia}-${c.paso}`} title={fechaHora(c.fecha)}><Insignia tono="azul">{nombrePaso(c)}</Insignia></span>
                        ))}
                        {!s.fecha_envio_big3 && s.correos.length === 0 && <span className="text-xs text-tinta-tenue">Ninguno todavía</span>}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      {s.activo ? <Insignia tono="verde" punto>Activo</Insignia>
                        : <span title={fechaHora(s.fecha_baja)}><Insignia tono="rojo">Baja</Insignia></span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Tarjeta>
    </div>
  )
}

export default ListaCorreos
