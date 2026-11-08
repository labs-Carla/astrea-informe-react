import { Tarjeta, Vacio } from './ui'
import { Aviso, Cifra } from './MetricasUi'

/**
 * Velocidad (astrea-API /admin/velocidad, 2026-11-08): cuánto tarda en abrirse la conversación.
 * La app mide cada apertura paso a paso y cada llamada (red, servidor y Supabase por separado).
 * «Mediana» = la mitad de las aperturas tardó esto o menos; «el 95 %» = casi todas.
 */

const PASOS = {
  html: ['Llegó la página', 'El HTML de app.astrea-charts.site'],
  js: ['Arrancó la app', 'Descargó y ejecutó el código principal'],
  pantalla: ['Código de la conversación', 'El paquete de la pantalla de conversación'],
  sesion: ['Sesión', 'Leyó la sesión guardada en el teléfono'],
  yo: ['Tu cuenta (/ai/yo)', 'Plan, perfiles, compras y permisos'],
  datos: ['Historial y carta', 'Conversaciones, nombre y carta, en paralelo'],
  lista: ['Lista', 'Ya ve su conversación'],
}

const LLAMADAS = {
  '/ai/yo': 'Tu cuenta',
  '/ai/conversaciones': 'Historial',
  '/ai/perfiles/:id/carta': 'Carta',
  '/ai/perfiles/:id/horoscopo': 'Tu día',
  '/ai/perfiles/:id/sugerencias': 'Preguntas sugeridas',
  '/ai/eventos': 'Analítica',
  '/ai/compatibilidades': 'Compatibilidades',
  '/supabase/rest/v1/mensajes': 'Títulos del historial (Supabase directo)',
  '/supabase/rest/v1/perfiles': 'Nombre (Supabase directo)',
}

const GRUPOS = [
  ['por_dispositivo', 'Por dispositivo', { movil: 'Móvil', escritorio: 'Computador', tablet: 'Tablet' }],
  ['por_conexion', 'Por conexión del teléfono', {}],
  ['por_cache', 'Código ya guardado en el teléfono', {}],
  ['por_tipo', 'Cómo llegó', { carga: 'Abrió la app', navegacion: 'Desde otra pantalla' }],
]

// Más de 5 viajes a Supabase en un solo pedido: candidato claro a juntar o paralelizar.
const MUCHOS_VIAJES = 5

export const tiempo = (ms) => {
  if (ms == null) return '—'
  if (ms < 1000) return `${ms} ms`
  return `${(ms / 1000).toLocaleString('es', { maximumFractionDigits: 1, minimumFractionDigits: 1 })} s`
}

function PasoAPaso({ pasos }) {
  const lista = pasos.find((p) => p.paso === 'lista')
  const total = Math.max(lista?.p50 || 0, ...pasos.map((p) => p.p50), 1)
  let anterior = 0
  return (
    <Tarjeta className="p-5">
      <h2 className="font-display text-xl">Paso a paso</h2>
      <p className="mt-1 text-sm text-tinta-suave">Mediana desde que tocó Astrea. La barra muestra cuánto suma cada paso.</p>
      <div className="mt-4 space-y-2">
        {pasos.map((p) => {
          const desde = Math.min(anterior, p.p50)
          const ancho = Math.max(p.p50 - desde, 0)
          anterior = Math.max(anterior, p.p50)
          const [nombre, ayuda] = PASOS[p.paso] || [p.paso, '']
          return (
            <div key={p.paso} className="grid grid-cols-[9rem_1fr_5.5rem] items-center gap-3 text-sm sm:grid-cols-[13rem_1fr_7rem]"
              title={`${nombre}: mediana ${tiempo(p.p50)} desde el inicio (+${tiempo(ancho)}); el 95 % en ${tiempo(p.p95)}. ${p.n} aperturas. ${ayuda}`}>
              <span className={`truncate ${p.paso === 'lista' ? 'font-medium text-tinta' : 'text-tinta-suave'}`}>{nombre}</span>
              <span className="relative h-3.5">
                <span className="absolute inset-y-0 rounded-r bg-oro/80"
                  style={{ left: `${(desde / total) * 100}%`, width: `max(2px, ${(ancho / total) * 100}%)` }} />
              </span>
              <span className="text-right tabular-nums text-tinta-suave">+{tiempo(ancho)}</span>
            </div>
          )
        })}
      </div>
    </Tarjeta>
  )
}

function Llamadas({ llamadas }) {
  return (
    <Tarjeta className="p-5">
      <h2 className="font-display text-xl">Llamadas al abrir</h2>
      <p className="mt-1 text-sm text-tinta-suave">Medianas. «Red» es el viaje entre el teléfono y el servidor; «Supabase» es lo que el servidor esperó a Supabase.</p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-xs sm:text-sm">
          <thead><tr className="text-left text-xs text-tinta-tenue">
            <th className="py-1 font-medium">Llamada</th>
            <th className="py-1 pl-2 text-right font-medium">Total</th>
            <th className="py-1 pl-2 text-right font-medium">El 95 %</th>
            <th className="py-1 pl-2 text-right font-medium">Red</th>
            <th className="py-1 pl-2 text-right font-medium">Servidor</th>
            <th className="py-1 pl-2 text-right font-medium">Supabase</th>
          </tr></thead>
          <tbody className="divide-y divide-linea">
            {llamadas.map((l) => (
              <tr key={l.ruta}>
                <td className="py-1.5" title={`${l.ruta} · ${l.n} veces`}>{LLAMADAS[l.ruta] || <span className="font-mono text-xs">{l.ruta}</span>}</td>
                <td className="py-1.5 text-right font-medium tabular-nums">{tiempo(l.p50)}</td>
                <td className="py-1.5 text-right tabular-nums text-tinta-suave">{tiempo(l.p95)}</td>
                <td className="py-1.5 text-right tabular-nums">{tiempo(l.red_p50)}</td>
                <td className="py-1.5 text-right tabular-nums">{tiempo(l.servidor_p50)}</td>
                <td className={`py-1.5 text-right tabular-nums ${l.supabase_n_p50 > MUCHOS_VIAJES ? 'font-medium text-vino' : ''}`}
                  title={l.supabase_n_p50 == null ? '' : `${l.supabase_n_p50} viajes a Supabase en un solo pedido`}>
                  {tiempo(l.supabase_p50)}{l.supabase_n_p50 != null && <span className="text-tinta-tenue"> · {l.supabase_n_p50}×</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-tinta-tenue">En rojo, las que hacen más de {MUCHOS_VIAJES} viajes seguidos a Supabase.</p>
    </Tarjeta>
  )
}

function PorDia({ dias }) {
  const maximo = Math.max(...dias.map((d) => d.lista_p95 || 0), 1)
  return (
    <Tarjeta className="p-5">
      <h2 className="font-display text-xl">Por día</h2>
      <p className="mt-1 text-sm text-tinta-suave">Mediana de «lista» cada día. Sirve para ver si una mejora se notó.</p>
      <div className="mt-4 flex h-28 items-end gap-0.5" role="img" aria-label="Mediana de la apertura por día">
        {dias.map((d) => (
          <div key={d.dia} className="flex-1 rounded-t bg-oro/70 hover:bg-oro"
            title={d.n ? `${d.dia}: mediana ${tiempo(d.lista_p50)}, el 95 % en ${tiempo(d.lista_p95)} (${d.n} aperturas)` : `${d.dia}: sin aperturas`}
            style={{ height: `${d.lista_p50 ? Math.max((d.lista_p50 / maximo) * 100, 3) : 0}%` }} />
        ))}
      </div>
      <div className="mt-1 flex justify-between text-xs text-tinta-tenue"><span>{dias[0]?.dia}</span><span>{dias.at(-1)?.dia}</span></div>
    </Tarjeta>
  )
}

function Grupo({ titulo, filas, nombres }) {
  return (
    <Tarjeta className="p-5">
      <h2 className="font-display text-lg">{titulo}</h2>
      <table className="mt-2 w-full text-sm">
        <thead><tr className="text-left text-xs text-tinta-tenue">
          <th className="py-1 font-medium" /><th className="py-1 text-right font-medium">Aperturas</th>
          <th className="py-1 text-right font-medium">Mediana</th><th className="py-1 text-right font-medium">El 95 %</th>
        </tr></thead>
        <tbody className="divide-y divide-linea">
          {filas.map((f) => (
            <tr key={f.nombre}>
              <td className="py-1.5">{nombres[f.nombre] || f.nombre}</td>
              <td className="py-1.5 text-right tabular-nums">{f.n}</td>
              <td className="py-1.5 text-right tabular-nums">{tiempo(f.lista_p50)}</td>
              <td className="py-1.5 text-right tabular-nums text-tinta-suave">{tiempo(f.lista_p95)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Tarjeta>
  )
}

function Velocidad({ datos }) {
  const lista = datos.pasos.find((p) => p.paso === 'lista')
  const yo = datos.llamadas.find((l) => l.ruta === '/ai/yo')
  if (!datos.aperturas) {
    return (
      <Tarjeta className="p-5">
        <Vacio titulo="Todavía no hay aperturas medidas"
          texto="Se llenan solas cada vez que alguien abre su conversación en Astrea, desde que se publique la medición." />
      </Tarjeta>
    )
  }
  return (
    <div className="space-y-5">
      {lista?.p50 > 3000 && (
        <Aviso>La mitad de las personas espera más de {tiempo(lista.p50)} para ver su conversación. Más de 3 s ya se siente lento en un teléfono.</Aviso>
      )}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Cifra etiqueta="Lista en (mediana)" valor={tiempo(lista?.p50)} ayuda="La mitad de las aperturas tardó esto o menos hasta ver la conversación" />
        <Cifra etiqueta="El 95 % lista en" valor={tiempo(lista?.p95)} ayuda="Casi todas las aperturas tardaron esto o menos" />
        <Cifra etiqueta="Tu cuenta (/ai/yo)" valor={tiempo(yo?.p50)}
          ayuda={yo ? `Mediana; ${yo.supabase_n_p50 ?? '—'} viajes a Supabase por pedido` : 'Sin datos'} />
        <Cifra etiqueta="Aperturas medidas" valor={datos.aperturas.toLocaleString('es')} />
      </div>
      <PasoAPaso pasos={datos.pasos} />
      <Llamadas llamadas={datos.llamadas} />
      <PorDia dias={datos.por_dia} />
      <div className="grid gap-5 lg:grid-cols-2">
        {GRUPOS.map(([clave, titulo, nombres]) => datos[clave]?.length > 0 && (
          <Grupo key={clave} titulo={titulo} filas={datos[clave]} nombres={nombres} />
        ))}
      </div>
      <p className="text-xs text-tinta-tenue">Sin datos personales: ni cuenta, ni IP, ni ids. Del {datos.desde} al {datos.hasta}.</p>
    </div>
  )
}

export default Velocidad
