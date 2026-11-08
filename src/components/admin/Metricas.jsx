import { useEffect, useMemo, useState } from 'react'
import { Esqueleto, Tarjeta, Vacio } from './ui'
import { Aviso, Cifra } from './MetricasUi'
import Velocidad from './Velocidad'
import { coincide } from './formato'

/**
 * Métricas (plan de métricas, fases 3 y 4, 2026-11-06).
 * - Canales (astrea-API /admin/canales): por cada `src`, visitas, cartas en /carta, cuentas nuevas,
 *   pedidos y ventas pagadas. Las ventas tienen canal desde el 06/11/2026.
 * - Costo de IA (/admin/costo-ia): por día, por tarea y por persona en el chat.
 * - Velocidad (/admin/velocidad, 2026-11-08): cuánto tarda en abrirse la conversación (Velocidad.jsx).
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

/* ───────────── Semana ───────────── */

const NUMEROS_SEMANA = [
  ['activas', 'Hablaron con su carta', 'La métrica norte: personas que mandaron al menos una pregunta', 'numero'],
  ['abrieron', 'Abrieron Astrea', 'Abrieron la app, vieron «Tu día» o preguntaron', 'numero'],
  ['cuentas_nuevas', 'Cuentas nuevas', 'Cuentas que recibieron su primera carta', 'numero'],
  ['cartas_calculadas', 'Cartas en /carta', 'Calculadas sin cuenta', 'numero'],
  ['preguntas_ia', 'Preguntas con IA', 'Plus o compra', 'numero'],
  ['preguntas_gratis', 'Preguntas gratis', 'Chat gratis, con textos aprobados', 'numero'],
  ['sin_respuesta', 'Sin respuesta (gratis)', 'Preguntas del chat gratis sin texto aprobado', 'numero', true],
  ['llegaron_al_limite', 'Llegaron al límite gratis', 'Personas que usaron sus preguntas gratis del día', 'numero'],
  ['ofertas_tocadas', 'Ofertas tocadas', 'Tocaron Plus o una lectura desde el chat o una tarjeta', 'numero'],
  ['pagos_abiertos', 'Pagos abiertos', 'Abrieron el pago dentro de Astrea', 'numero'],
  ['ventas_pagadas', 'Ventas pagadas', 'Órdenes, temáticos y regalos con el pago confirmado', 'numero'],
  ['costo_ia_usd', 'Costo de IA', 'Todas las llamadas a la IA', 'usd', true],
  ['costo_chat_por_persona_usd', 'Chat con IA por persona', 'Costo del chat con IA dividido por quienes lo usaron', 'usd4', true],
]

function Cambio({ actual, anterior, alReves = false }) {
  if (actual == null || anterior == null || actual === anterior) return <span className="text-xs text-tinta-tenue">igual que la anterior</span>
  if (!anterior) return <span className="text-xs text-tinta-tenue">antes: 0</span>
  const pct = Math.round(((actual - anterior) / anterior) * 100)
  const bueno = alReves ? pct < 0 : pct > 0
  return <span className={`text-xs font-medium ${bueno ? 'text-salvia' : 'text-vino'}`}>{pct > 0 ? '+' : ''}{pct} % vs la anterior</span>
}

function Semana({ datos }) {
  const { actual, anterior } = datos
  const maximo = Math.max(...datos.activas_por_dia.map((d) => d.activas), 1)
  const formato = (tipo, v) => (tipo === 'usd' ? usd(v) : tipo === 'usd4' ? usd(v, 4) : numero(v))
  const dia = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString('es', { weekday: 'short', day: 'numeric' })

  return (
    <div className="space-y-5">
      <p className="text-sm text-tinta-suave">
        Del {dia(datos.desde)} al {dia(datos.hasta)}, comparado con los 7 días anteriores. Míralo los lunes y elige <b>un</b> número que no se mueve.
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {NUMEROS_SEMANA.map(([k, etiqueta, ayuda, tipo, alReves], i) => (
          <div key={k} title={ayuda} className={`rounded-lg px-4 py-3 ring-1 ${i === 0 ? 'bg-[#f4ead3] ring-oro/30 sm:col-span-2' : 'bg-papel ring-linea'}`}>
            <div className="font-display text-3xl leading-none text-tinta tabular-nums">{formato(tipo, actual[k])}</div>
            <div className="mt-1 text-xs text-tinta-suave">{etiqueta}</div>
            <div className="mt-1"><Cambio actual={actual[k]} anterior={anterior[k]} alReves={alReves} /></div>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Tarjeta className="p-5">
          <h2 className="font-display text-xl">Hablaron con su carta, por día</h2>
          <div className="mt-4 flex h-28 items-end gap-2" role="img" aria-label="Personas que hablaron con su carta cada día">
            {datos.activas_por_dia.map((d) => (
              <div key={d.dia} className="flex flex-1 flex-col items-center gap-1" title={`${d.dia}: ${d.activas}`}>
                <span className="text-xs tabular-nums text-tinta-suave">{d.activas}</span>
                <div className="w-full rounded-t bg-oro/70" style={{ height: `${(d.activas / maximo) * 80}px` }} />
              </div>
            ))}
          </div>
          <div className="mt-1 flex gap-2 text-center text-[11px] text-tinta-tenue">
            {datos.activas_por_dia.map((d) => <span key={d.dia} className="flex-1">{dia(d.dia)}</span>)}
          </div>
        </Tarjeta>

        <Tarjeta className="p-5">
          <h2 className="font-display text-xl">Lo que piden y no tiene respuesta</h2>
          {datos.sin_respuesta_por_tema.length === 0 ? <p className="mt-3 text-sm text-tinta-tenue">Ninguna pregunta del chat gratis quedó sin texto esta semana.</p> : (
            <ul className="mt-3 divide-y divide-linea text-sm">
              {datos.sin_respuesta_por_tema.map((t) => (
                <li key={t.tema} className="flex justify-between py-1.5"><span>{t.tema}</span><span className="tabular-nums">{t.n}</span></li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-tinta-tenue">El tema general, nunca el texto de la pregunta. Los más pedidos deciden los próximos textos.</p>
        </Tarjeta>
      </div>
    </div>
  )
}

/* ───────────── Cohortes ───────────── */

function Celda({ dato }) {
  if (!dato || dato.maduras === 0) return <td className="py-1.5 text-right text-tinta-tenue">—</td>
  const tono = dato.pct >= 30 ? 'bg-[#e9efe2]' : dato.pct >= 15 ? 'bg-[#f8ead6]' : 'bg-[#f5e4e1]'
  return (
    <td className="py-1.5 text-right">
      <span className={`inline-block min-w-14 rounded px-2 py-0.5 tabular-nums ${tono}`} title={`${dato.retenidas} de ${dato.maduras}`}>{dato.pct} %</span>
    </td>
  )
}

function Cohortes({ datos }) {
  const semana = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString('es', { day: 'numeric', month: 'short' })
  const total = datos.filas.reduce((n, f) => n + f.cuentas, 0)
  return (
    <Tarjeta className="p-5">
      <h2 className="font-display text-xl">¿Siguen volviendo?</h2>
      <p className="mt-1 text-sm text-tinta-suave">
        De las cuentas creadas cada semana, cuántas volvieron a usar Astrea entre el día 7 y el 13, el 14 y el 20, y el 30 y el 36.
        La meta del plan es 20 % a los 30 días.
      </p>
      {total === 0 ? (
        <div className="py-8"><Vacio titulo="Todavía no hay cuentas nuevas" texto="Las cohortes se arman con las cuentas que reciben su primera carta." /></div>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <thead><tr className="text-left text-xs text-tinta-tenue">
              <th className="py-1 font-medium">Semana del</th><th className="py-1 text-right font-medium">Cuentas</th>
              {datos.retencion_dias.map((d) => <th key={d} className="py-1 text-right font-medium">A los {d} días</th>)}
            </tr></thead>
            <tbody className="divide-y divide-linea">
              {datos.filas.map((f) => (
                <tr key={f.semana}>
                  <td className="py-1.5">{semana(f.semana)}</td>
                  <td className="py-1.5 text-right tabular-nums">{numero(f.cuentas)}</td>
                  {datos.retencion_dias.map((d) => <Celda key={d} dato={f[`d${d}`]} />)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-3 text-xs text-tinta-tenue">— = esa semana todavía no llegó a esa ventana. Con menos de 100 cuentas por semana los porcentajes saltan mucho: pasa el cursor para ver las cuentas.</p>
    </Tarjeta>
  )
}

/* ───────────── Funciones ───────────── */

const valor = (v, unidad) => (v == null ? '—' : unidad === '%' ? `${v} %` : numero(v))

function Funciones({ datos, busqueda }) {
  const filas = datos.filas.filter((f) => !busqueda || coincide(f.nombre, busqueda))
  return (
    <Tarjeta className="p-5">
      <h2 className="font-display text-xl">Uso y efecto de cada cosa que producimos</h2>
      <p className="mt-1 text-sm text-tinta-suave">
        Uso: cuánta gente la toca. Efecto: si quien la toca vuelve o compra. Lo que tiene uso y no tiene efecto se mejora o se quita.
        {datos.volvieron_base != null && <> De todas las personas activas, el <b>{datos.volvieron_base} %</b> volvió otro día.</>}
      </p>
      {/* En el teléfono, una tarjeta por función: la tabla escondería el efecto. */}
      <ul className="mt-4 divide-y divide-linea sm:hidden">
        {filas.map((f) => (
          <li key={f.id} className="space-y-1 py-3 text-sm">
            <p className="font-medium">{f.nombre}</p>
            <p><span className="text-xs text-tinta-tenue">Uso · </span><b className="tabular-nums">{valor(f.uso.valor, f.uso.unidad)}</b> <span className="text-tinta-suave">{f.uso.texto}</span></p>
            <p><span className="text-xs text-tinta-tenue">Efecto · </span>{f.efecto.valor != null && <b className="tabular-nums">{valor(f.efecto.valor, f.efecto.unidad)} </b>}<span className="text-tinta-suave">{f.efecto.texto}</span></p>
            {f.comparacion && <p><span className="text-xs text-tinta-tenue">Para comparar · </span><b className="tabular-nums">{valor(f.comparacion.valor, f.comparacion.unidad)}</b> <span className="text-tinta-suave">{f.comparacion.texto}</span></p>}
          </li>
        ))}
      </ul>
      <div className="mt-4 hidden overflow-x-auto sm:block">
        <table className="w-full min-w-[640px] text-sm">
          <thead><tr className="text-left text-xs text-tinta-tenue">
            <th className="py-1 font-medium">Qué</th><th className="py-1 font-medium">Uso</th>
            <th className="py-1 font-medium">Efecto</th><th className="py-1 font-medium">Para comparar</th>
          </tr></thead>
          <tbody className="divide-y divide-linea align-top">
            {filas.map((f) => (
              <tr key={f.id}>
                <td className="py-2 pr-3 font-medium">{f.nombre}</td>
                <td className="py-2 pr-3"><b className="tabular-nums">{valor(f.uso.valor, f.uso.unidad)}</b> <span className="text-tinta-suave">{f.uso.texto}</span></td>
                <td className="py-2 pr-3">
                  {f.efecto.valor != null && <b className="tabular-nums">{valor(f.efecto.valor, f.efecto.unidad)} </b>}
                  <span className="text-tinta-suave">{f.efecto.texto}</span>
                </td>
                <td className="py-2 text-tinta-suave">
                  {f.comparacion ? <><b className="tabular-nums text-tinta">{valor(f.comparacion.valor, f.comparacion.unidad)}</b> {f.comparacion.texto}</> : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-tinta-tenue">«Volvió otro día»: abrió Astrea, vio «Tu día» o preguntó en dos días distintos del período. Los correos se suman en la fase 5.</p>
    </Tarjeta>
  )
}

/* ───────────── Correos ───────────── */

const pct = (v) => (v == null ? '—' : `${v.toLocaleString('es')} %`)

function TablaCorreos({ filas, clave, etiqueta, nombre, limites }) {
  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full text-xs sm:text-sm">
        <thead><tr className="text-left text-xs text-tinta-tenue">
          <th className="py-1 font-medium">{etiqueta}</th><th className="py-1 pl-2 text-right font-medium">Enviados</th>
          <th className="py-1 pl-2 text-right font-medium">Llegan</th><th className="py-1 pl-2 text-right font-medium">Rebotan</th>
          <th className="py-1 pl-2 text-right font-medium">Spam</th>
        </tr></thead>
        <tbody className="divide-y divide-linea">
          {filas.map((f) => (
            <tr key={f[clave]}>
              <td className="py-1.5" title={f[clave]}>{nombre(f)}</td>
              <td className="py-1.5 text-right tabular-nums">{numero(f.enviados)}</td>
              <td className="py-1.5 text-right tabular-nums">{pct(f.entrega_pct)}</td>
              <td className={`py-1.5 text-right tabular-nums ${f.rebote_pct > limites.rebote_pct ? 'font-medium text-vino' : ''}`}
                title={`${f.rebotados} rebotados, ${f.rebotes_permanentes} permanentes`}>{pct(f.rebote_pct)}</td>
              <td className={`py-1.5 text-right tabular-nums ${f.spam_pct > limites.spam_pct ? 'font-medium text-vino' : ''}`}
                title={`${f.spam} quejas`}>{pct(f.spam_pct)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Correos({ datos }) {
  const t = datos.total
  const alto = (d) => Math.max(d.enviados, d.entregados)
  const maximo = Math.max(...datos.por_dia.map(alto), 1)
  return (
    <div className="space-y-5">
      {datos.alertas.map((a) => <Aviso key={a}>{a} Revisa qué tipo de correo y qué dominio lo causan.</Aviso>)}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        <Cifra etiqueta="Correos enviados" valor={numero(t.enviados)} />
        <Cifra etiqueta="Llegaron al buzón" valor={pct(t.entrega_pct)} ayuda={`${t.entregados} entregados`} />
        <Cifra etiqueta="Rebotaron" valor={pct(t.rebote_pct)}
          ayuda={`${t.rebotados} rebotados (${t.rebotes_permanentes} permanentes). Límite sano: ${datos.limites.rebote_pct} %`} />
        <Cifra etiqueta="Marcados como spam" valor={pct(t.spam_pct)}
          ayuda={`${t.spam} quejas. Límite sano: ${datos.limites.spam_pct} %`} />
        <Cifra etiqueta="Clics a Astrea" valor={numero(datos.clics.total)}
          ayuda="Visitas que entraron desde un enlace de un correo (src=correo-… o campana-…)" />
      </div>

      {t.enviados === 0 ? (
        <Tarjeta className="p-5">
          <Vacio titulo="Todavía no llegan avisos de Resend"
            texto="Se llenan cuando el webhook de Resend esté configurado y salgan correos. Los clics ya se cuentan." />
        </Tarjeta>
      ) : (
        <>
          <Tarjeta className="p-5">
            <h2 className="font-display text-xl">Por día</h2>
            <div className="mt-4 flex h-28 items-end gap-0.5" role="img" aria-label="Correos enviados por día">
              {datos.por_dia.map((d) => (
                <div key={d.dia} className="flex-1 rounded-t bg-oro/70 hover:bg-oro"
                  title={`${d.dia}: ${d.enviados} enviados, ${d.entregados} entregados, ${d.rebotados} rebotados, ${d.spam} spam`}
                  style={{ height: `${alto(d) ? Math.max((alto(d) / maximo) * 100, 3) : 0}%` }} />
              ))}
            </div>
            <div className="mt-1 flex justify-between text-xs text-tinta-tenue"><span>{datos.desde}</span><span>{datos.hasta}</span></div>
          </Tarjeta>
          <div className="space-y-5">
            <Tarjeta className="p-5">
              <h2 className="font-display text-xl">Por tipo de correo</h2>
              <TablaCorreos filas={datos.por_tipo} clave="tipo" etiqueta="Correo" nombre={(f) => f.nombre} limites={datos.limites} />
            </Tarjeta>
            <Tarjeta className="p-5">
              <h2 className="font-display text-xl">Por proveedor de correo</h2>
              <TablaCorreos filas={datos.por_dominio} clave="dominio" etiqueta="Dominio" nombre={(f) => f.dominio} limites={datos.limites} />
              <p className="mt-3 text-xs text-tinta-tenue">Solo el dominio de quien recibe, nunca la dirección.</p>
            </Tarjeta>
          </div>
        </>
      )}

      <Tarjeta className="p-5">
        <h2 className="font-display text-xl">Desde qué enlace volvieron</h2>
        {datos.clics.por_enlace.length === 0 ? <p className="mt-3 text-sm text-tinta-tenue">Nadie entró desde un correo en este período.</p> : (
          <ul className="mt-3 divide-y divide-linea text-sm">
            {datos.clics.por_enlace.map((c) => (
              <li key={c.origen} className="flex justify-between gap-3 py-1.5"><span className="break-all font-mono text-xs">{c.origen}</span><span className="tabular-nums">{numero(c.entradas)}</span></li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs text-tinta-tenue">No medimos aperturas: los clics son la señal de interés. Lo que compran después se ve en Canales, en la familia «correo».</p>
      </Tarjeta>
    </div>
  )
}

/* ───────────── Sección ───────────── */

const VISTAS = [
  ['semana', 'Semana'], ['canales', 'Canales'], ['cohortes', 'Cohortes'], ['funciones', 'Funciones'], ['correos', 'Correos'],
  ['costo', 'Costo de IA'], ['velocidad', 'Velocidad'],
]
const RUTAS = {
  semana: () => '/admin/metricas/semana',
  canales: (dias) => `/admin/canales?dias=${dias}`,
  cohortes: (_, semanas) => `/admin/metricas/cohortes?semanas=${semanas}`,
  funciones: (dias) => `/admin/metricas/funciones?dias=${dias}`,
  correos: (dias) => `/admin/correos?dias=${dias}`,
  costo: (dias) => `/admin/costo-ia?dias=${dias}`,
  velocidad: (dias) => `/admin/velocidad?dias=${dias}`,
}

function Metricas({ api, busqueda, recarga }) {
  const [vista, setVista] = useState('semana')
  const [dias, setDias] = useState(30)
  const [semanas, setSemanas] = useState(8)
  const [datos, setDatos] = useState({})
  const [errores, setErrores] = useState({})
  const ruta = RUTAS[vista](dias, semanas)

  useEffect(() => {
    let vigente = true
    api.get(ruta)
      .then((d) => { if (vigente) { setDatos((a) => ({ ...a, [ruta]: d })); setErrores((a) => ({ ...a, [ruta]: null })) } })
      .catch((e) => { if (vigente) setErrores((a) => ({ ...a, [ruta]: e.message })) })
    return () => { vigente = false }
  }, [api, ruta, recarga])

  const actuales = datos[ruta]
  const error = errores[ruta]

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex max-w-full gap-1 overflow-x-auto border-b border-linea" role="tablist">
          {VISTAS.map(([id, etiqueta]) => (
            <button key={id} type="button" role="tab" aria-selected={vista === id} onClick={() => setVista(id)}
              className={`-mb-px shrink-0 border-b-2 px-3 pb-2 text-sm font-medium ${vista === id ? 'border-oro text-tinta' : 'border-transparent text-tinta-tenue hover:text-tinta'}`}>
              {etiqueta}
            </button>
          ))}
        </div>
        {['canales', 'funciones', 'correos', 'costo', 'velocidad'].includes(vista) && (
          <Pestanas etiqueta="Período" actual={dias} onCambio={setDias} opciones={PERIODOS.map((d) => [d, `${d} días`])} />
        )}
        {vista === 'cohortes' && (
          <Pestanas etiqueta="Semanas" actual={semanas} onCambio={setSemanas} opciones={[[8, '8 semanas'], [12, '12 semanas']]} />
        )}
      </div>

      {error && !actuales && (
        <p className="rounded-lg bg-[#fbeeec] px-4 py-3 text-sm text-vino ring-1 ring-vino/20">No se pudieron cargar las métricas: {error}</p>
      )}
      {!actuales && !error && <Esqueleto className="h-64" />}
      {actuales && vista === 'semana' && <Semana datos={actuales} />}
      {actuales && vista === 'canales' && <Canales datos={actuales} busqueda={busqueda} />}
      {actuales && vista === 'cohortes' && <Cohortes datos={actuales} />}
      {actuales && vista === 'funciones' && <Funciones datos={actuales} busqueda={busqueda} />}
      {actuales && vista === 'correos' && <Correos datos={actuales} />}
      {actuales && vista === 'costo' && <CostoIA datos={actuales} />}
      {actuales && vista === 'velocidad' && <Velocidad datos={actuales} />}
    </div>
  )
}

export default Metricas
