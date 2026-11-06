import { useEffect, useMemo, useState } from 'react'
import { Esqueleto, Icono, Tarjeta, Vacio } from './ui'
import { coincide } from './formato'

/**
 * Métricas (plan de métricas, fases 3 y 4, 2026-11-06).
 * - Canales (astrea-API /admin/canales): por cada `src`, visitas, cartas en /carta, cuentas nuevas,
 *   pedidos y ventas pagadas. Las ventas tienen canal desde el 06/11/2026.
 * - Costo de IA (/admin/costo-ia): por día, por tarea y por persona en el chat.
 */

const PERIODOS = [7, 30, 90]

const COLUMNAS_CANAL = [
  ['entradas', 'Entradas', 'Llegadas desde fuera de astrea-charts.site por ese enlace'],
  ['visitantes', 'Personas', 'Personas distintas por día que entraron por ese canal'],
  ['cartas_calculadas', 'Cartas', 'Cartas calculadas en /carta sin cuenta'],
  ['cartas_guardadas', 'Guardadas', 'Cartas de /carta guardadas con su correo'],
  ['cuentas', 'Cuentas', 'Cuentas que recibieron su primera carta'],
  ['pedidos', 'Pedidos', 'Órdenes, temáticos y regalos pedidos (pagados o no)'],
  ['pagadas', 'Pagadas', 'Con el pago confirmado y sin reembolso'],
]

const TIPOS_VENTA = { lectura: 'Lectura natal', tematico: 'Temáticos', regalo: 'Regalos' }

const TAREAS = {
  'chat.plus': 'Chat con IA (Plus)',
  'chat.compra': 'Chat con IA (compra)',
  'chat.default': 'Chat con IA',
  'chat.deep': 'Chat con IA (profundo)',
  'report.premium': 'Lecturas de pago',
  'report.juez': 'Revisora de lecturas',
  'sugerencias.carta': 'Preguntas sugeridas',
  'blog.horoscopo_semanal': 'Horóscopo semanal del blog',
}

const numero = (n) => (n == null ? '—' : n.toLocaleString('es'))
const usd = (n, max = 2) => (n == null ? '—' : `US$ ${n.toLocaleString('es', { minimumFractionDigits: 2, maximumFractionDigits: max })}`)
const porcentaje = (parte, total) => (total ? `${Math.round((parte / total) * 100)} %` : '—')

function Cifra({ etiqueta, valor, ayuda }) {
  return (
    <div title={ayuda} className="rounded-lg bg-papel px-4 py-3 ring-1 ring-linea">
      <div className="font-display text-3xl leading-none text-tinta tabular-nums">{valor ?? '—'}</div>
      <div className="mt-1 text-xs text-tinta-suave">{etiqueta}</div>
    </div>
  )
}

function Aviso({ children }) {
  return (
    <div className="flex items-start gap-2 rounded-lg bg-pergamino px-4 py-3 text-sm text-tinta-suave ring-1 ring-linea">
      <Icono nombre="alerta" className="mt-0.5 size-4 shrink-0" />
      <span>{children}</span>
    </div>
  )
}

function Pestanas({ opciones, actual, onCambio, etiqueta }) {
  return (
    <div className="flex gap-1" role="group" aria-label={etiqueta}>
      {opciones.map(([id, texto]) => (
        <button key={id} type="button" onClick={() => onCambio(id)} aria-pressed={actual === id}
          className={`rounded-md px-2.5 py-1 text-xs font-medium ${actual === id ? 'bg-tinta text-papel' : 'text-tinta-suave ring-1 ring-linea hover:bg-pergamino'}`}>
          {texto}
        </button>
      ))}
    </div>
  )
}

/* ───────────── Canales ───────────── */

function Canales({ datos, busqueda }) {
  const [agrupar, setAgrupar] = useState('familia')
  const filas = useMemo(() => {
    const lista = agrupar === 'familia' ? datos.por_familia : datos.por_canal
    return lista.filter((f) => !busqueda || coincide(`${f.nombre} ${f.familia || ''}`, busqueda))
  }, [datos, agrupar, busqueda])
  const t = datos.totales

  return (
    <div className="space-y-5">
      {!datos.eventos_disponibles && (
        <Aviso>Supabase no respondió: faltan las cartas calculadas, las guardadas y las cuentas. Visitas y ventas sí están.</Aviso>
      )}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {COLUMNAS_CANAL.map(([k, etiqueta, ayuda]) => <Cifra key={k} etiqueta={etiqueta} ayuda={ayuda} valor={numero(t[k])} />)}
      </div>

      <Tarjeta className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl">Por canal</h2>
          <Pestanas etiqueta="Agrupar" actual={agrupar} onCambio={setAgrupar}
            opciones={[['familia', 'Por familia'], ['canal', 'Cada enlace']]} />
        </div>
        {filas.length === 0 ? (
          <div className="py-8">
            <Vacio titulo={busqueda ? 'Ningún canal coincide' : 'Todavía no hay datos'}
              texto="Los canales aparecen cuando alguien entra con un enlace con ?src= o compra." />
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <caption className="sr-only">Visitas, cartas, cuentas y ventas por canal</caption>
              <thead>
                <tr className="text-left text-xs text-tinta-tenue">
                  <th className="py-1 font-medium">{agrupar === 'familia' ? 'Familia' : 'Enlace (src)'}</th>
                  {COLUMNAS_CANAL.map(([k, etiqueta, ayuda]) => <th key={k} title={ayuda} className="py-1 text-right font-medium">{etiqueta}</th>)}
                  <th className="py-1 text-right font-medium" title="Cuentas nuevas sobre entradas">Entrada → cuenta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-linea">
                {filas.map((f) => (
                  <tr key={f.nombre}>
                    <td className="py-1.5">
                      <span className={agrupar === 'canal' ? 'font-mono text-xs' : ''}>{f.nombre}</span>
                      {agrupar === 'canal' && f.familia !== f.nombre && <span className="ml-2 text-xs text-tinta-tenue">{f.familia}</span>}
                    </td>
                    {COLUMNAS_CANAL.map(([k]) => (
                      <td key={k} className={`py-1.5 text-right tabular-nums ${k === 'pagadas' && f[k] > 0 ? 'font-semibold text-salvia' : ''}`}>
                        {numero(f[k])}
                      </td>
                    ))}
                    <td className="py-1.5 text-right tabular-nums text-tinta-suave">{porcentaje(f.cuentas, f.entradas)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-3 text-xs leading-relaxed text-tinta-tenue">
          <b>directo</b>: entró sin enlace con <code>?src=</code>. <b>sin canal</b>: una carta, cuenta o venta sin canal conocido
          (anterior al {new Date(`${datos.inicio_canal_en_ventas}T12:00:00`).toLocaleDateString('es', { day: 'numeric', month: 'long' })},
          o pasaron más de 30 días desde que llegó). Una persona puede entrar por un canal y comprar por otro: cuenta el último.
        </p>
      </Tarjeta>

      {datos.ventas_por_tipo.length > 0 && (
        <Tarjeta className="p-5">
          <h2 className="font-display text-xl">Ventas por tipo</h2>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
            {datos.ventas_por_tipo.map((v) => (
              <Cifra key={v.tipo} etiqueta={`${TIPOS_VENTA[v.tipo] || v.tipo}: pagadas de ${numero(v.pedidos)} pedidos`} valor={numero(v.pagadas)} />
            ))}
          </div>
        </Tarjeta>
      )}
    </div>
  )
}

/* ───────────── Costo de IA ───────────── */

function CostoIA({ datos }) {
  const maximo = Math.max(...datos.por_dia.map((d) => d.costo_usd), 0)
  const chat = datos.chat

  return (
    <div className="space-y-5">
      {datos.llamadas_sin_precio > 0 && (
        <Aviso>{numero(datos.llamadas_sin_precio)} llamadas usaron un modelo sin precio cargado: no suman al costo. Hay que agregar su precio en LLM_PRECIOS.</Aviso>
      )}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Cifra etiqueta="Costo total" valor={usd(datos.costo_usd)} ayuda="Todas las llamadas a la IA del período" />
        <Cifra etiqueta="Llamadas a la IA" valor={numero(datos.llamadas)} />
        <Cifra etiqueta="Personas que usaron el chat con IA" valor={numero(chat.personas)} />
        <Cifra etiqueta="Costo del chat por persona" valor={usd(chat.por_persona_usd, 4)}
          ayuda="Meta del plan: menos de US$ 2 por suscriptora activa al mes" />
      </div>

      <Tarjeta className="p-5">
        <h2 className="font-display text-xl">Por día</h2>
        {datos.llamadas === 0 ? (
          <div className="py-8"><Vacio titulo="Todavía no hay llamadas registradas" texto="El costo se suma desde que se desplegó la fase 3." /></div>
        ) : (
          <div className="mt-4 flex h-32 items-end gap-0.5" role="img" aria-label="Costo de IA por día">
            {datos.por_dia.map((d) => (
              <div key={d.dia} title={`${d.dia}: ${usd(d.costo_usd, 4)} en ${d.llamadas} llamadas`}
                className="flex-1 rounded-t bg-oro/70 hover:bg-oro"
                style={{ height: `${maximo ? Math.max((d.costo_usd / maximo) * 100, d.costo_usd > 0 ? 3 : 0) : 0}%` }} />
            ))}
          </div>
        )}
        <div className="mt-1 flex justify-between text-xs text-tinta-tenue"><span>{datos.desde}</span><span>{datos.hasta}</span></div>
      </Tarjeta>

      <div className="grid gap-5 lg:grid-cols-2">
        <Tarjeta className="p-5">
          <h2 className="font-display text-xl">Por tarea</h2>
          <table className="mt-3 w-full text-sm">
            <thead><tr className="text-left text-xs text-tinta-tenue">
              <th className="py-1 font-medium">Tarea</th><th className="py-1 text-right font-medium">Llamadas</th>
              <th className="py-1 text-right font-medium">Costo</th><th className="py-1 text-right font-medium">Del total</th>
            </tr></thead>
            <tbody className="divide-y divide-linea">
              {datos.por_tarea.map((t) => (
                <tr key={t.tarea}>
                  <td className="py-1.5" title={t.tarea}>{TAREAS[t.tarea] || t.tarea}</td>
                  <td className="py-1.5 text-right tabular-nums">{numero(t.llamadas)}</td>
                  <td className="py-1.5 text-right tabular-nums">{usd(t.costo_usd, 4)}</td>
                  <td className="py-1.5 text-right tabular-nums text-tinta-suave">{porcentaje(t.costo_usd, datos.costo_usd)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Tarjeta>

        <Tarjeta className="p-5">
          <h2 className="font-display text-xl">Quién más usa el chat con IA</h2>
          {chat.mayores.length === 0 ? <p className="mt-3 text-sm text-tinta-tenue">Nadie todavía en este período.</p> : (
            <table className="mt-3 w-full text-sm">
              <thead><tr className="text-left text-xs text-tinta-tenue">
                <th className="py-1 font-medium">Cuenta</th><th className="py-1 text-right font-medium">Llamadas</th>
                <th className="py-1 text-right font-medium">Costo</th>
              </tr></thead>
              <tbody className="divide-y divide-linea">
                {chat.mayores.map((p) => (
                  <tr key={p.persona}>
                    <td className="py-1.5 font-mono text-xs">{p.persona}…</td>
                    <td className="py-1.5 text-right tabular-nums">{numero(p.llamadas)}</td>
                    <td className="py-1.5 text-right tabular-nums">{usd(p.costo_usd, 4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p className="mt-3 text-xs text-tinta-tenue">El comienzo del id de la cuenta en Supabase. Cada pregunta puede hacer dos llamadas si la primera respuesta no pasa la revisión.</p>
        </Tarjeta>
      </div>
    </div>
  )
}

/* ───────────── Sección ───────────── */

function Metricas({ api, busqueda, recarga }) {
  const [vista, setVista] = useState('canales')
  const [dias, setDias] = useState(30)
  const [datos, setDatos] = useState({})
  const [error, setError] = useState(null)
  const ruta = vista === 'canales' ? '/admin/canales' : '/admin/costo-ia'
  const clave = `${vista}:${dias}`

  useEffect(() => {
    let vigente = true
    api.get(`${ruta}?dias=${dias}`)
      .then((d) => { if (vigente) { setDatos((a) => ({ ...a, [clave]: d })); setError(null) } })
      .catch((e) => { if (vigente) setError(e.message) })
    return () => { vigente = false }
  }, [api, ruta, dias, clave, recarga])

  const actuales = datos[clave]

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 border-b border-linea" role="tablist">
          {[['canales', 'Canales'], ['costo', 'Costo de IA']].map(([id, etiqueta]) => (
            <button key={id} type="button" role="tab" aria-selected={vista === id} onClick={() => setVista(id)}
              className={`-mb-px border-b-2 px-3 pb-2 text-sm font-medium ${vista === id ? 'border-oro text-tinta' : 'border-transparent text-tinta-tenue hover:text-tinta'}`}>
              {etiqueta}
            </button>
          ))}
        </div>
        <Pestanas etiqueta="Período" actual={dias} onCambio={setDias} opciones={PERIODOS.map((d) => [d, `${d} días`])} />
      </div>

      {error && !actuales && (
        <p className="rounded-lg bg-[#fbeeec] px-4 py-3 text-sm text-vino ring-1 ring-vino/20">No se pudieron cargar las métricas: {error}</p>
      )}
      {!actuales && !error && <Esqueleto className="h-64" />}
      {actuales && (vista === 'canales' ? <Canales datos={actuales} busqueda={busqueda} /> : <CostoIA datos={actuales} />)}
    </div>
  )
}

export default Metricas
