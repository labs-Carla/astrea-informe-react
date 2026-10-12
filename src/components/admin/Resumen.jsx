import { useMemo } from 'react'
import { Esqueleto, Icono, Insignia, Tarjeta, Vacio } from './ui'
import { fechaHora, fechaLarga, haceCuanto, horasDesde, saludo } from './formato'
import { tarea } from './lecturas'

/** Una lectura que lleva más de esto esperando en su etapa se marca como demorada. */
const HORAS_DEMORA = 24

function Indicador({ etiqueta, valor, detalle, tono, onClick, cargando }) {
  const colores = { oro: 'text-oro', azul: 'text-azul', ambar: 'text-ambar', verde: 'text-salvia' }
  return (
    <button type="button" onClick={onClick}
      className="group min-w-0 rounded-xl bg-papel p-4 text-left sm:p-5 ring-1 ring-linea transition hover:-translate-y-px hover:shadow-md hover:ring-linea-fuerte">
      <div className="flex items-center justify-between">
        <span className="truncate text-[11px] font-medium uppercase tracking-wider text-tinta-tenue sm:text-xs">{etiqueta}</span>
        <Icono nombre="flecha" className="size-4 text-tinta-tenue opacity-0 transition group-hover:opacity-100" />
      </div>
      {cargando ? <Esqueleto className="mt-3 h-10 w-16" /> : (
        <div className={`mt-2 font-display text-5xl leading-none lining-nums ${valor > 0 ? colores[tono] : 'text-tinta/30'}`}>{valor}</div>
      )}
      <div className="mt-2 text-xs text-tinta-suave sm:text-sm">{detalle}</div>
    </button>
  )
}

/** Barra del recorrido de una lectura: cuántas hay en cada etapa. */
function Recorrido({ etapas }) {
  const total = etapas.reduce((s, e) => s + e.valor, 0) || 1
  return (
    <div>
      <div className="flex h-2.5 overflow-hidden rounded-full bg-pergamino">
        {etapas.map((e) => e.valor > 0 && (
          <div key={e.etiqueta} className={e.color} style={{ width: `${(e.valor / total) * 100}%` }} title={`${e.etiqueta}: ${e.valor}`} />
        ))}
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3">
        {etapas.map((e) => (
          <div key={e.etiqueta}>
            <dt className="flex items-center gap-2 text-xs text-tinta-tenue"><span className={`size-2 rounded-full ${e.color}`} />{e.etiqueta}</dt>
            <dd className="mt-0.5 font-display text-2xl text-tinta lining-nums">{e.valor}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

const TONO_TAREA = {
  'Confirmar pago': 'ambar', 'Revisar y aprobar': 'oro', 'Generar reporte': 'oro', 'Enviar PDF': 'azul', 'Preparar a mano': 'neutro',
}

/** Eventos de la actividad reciente, reconstruidos con las fechas que ya traen las lecturas. */
function eventos(l) {
  const o = l.original
  const de = (fecha, texto, tono) => fecha && { fecha, texto, tono, nombre: l.nombre }
  if (l.tipo === 'carta') {
    return [
      de(o.fecha_solicitud_compra, `pidió «${l.producto}»${l.etapa === 'pago' ? ' (pago por confirmar)' : ''}`),
      o.entregada_a_mano
        ? de(o.fecha_envio, `recibió «${l.producto}» (entrega a mano)`, 'verde')
        : de(o.fecha_envio, `«${l.producto}» aprobada`),
      de(o.fecha_correo_entrega, `recibió «${l.producto}» en PDF por correo`, 'verde'),
      de(o.fecha_reembolso, `reembolso registrado de «${l.producto}»`, 'rojo'),
    ]
  }
  return [
    de(o.fecha_solicitud_compra, `pidió «${l.producto}»${l.etapa === 'pago' ? ' (pago por confirmar)' : ''}`),
    de(o.fecha_confirmacion_pago, `pago confirmado de «${l.producto}»`),
    de(o.fecha_envio, `recibió «${l.producto}»${l.entrega?.estado === 'correo' ? ' en PDF por correo' : ''}`, 'verde'),
    de(o.fecha_reembolso, `reembolso registrado de «${l.producto}»`, 'rojo'),
  ]
}

/**
 * Página de inicio: indicadores por etapa, los pendientes ordenados por
 * antigüedad, cuántas lecturas hay en cada etapa y la actividad reciente.
 * Todas las lecturas cuentan igual: carta natal y demás reportes.
 */
function Resumen({ lecturas, ahora, cargando, irA, abrir }) {
  const resumen = useMemo(() => {
    const todas = lecturas || []
    const en = (etapa) => todas.filter((l) => l.etapa === etapa)
    const hace30 = (ahora || 0) - 30 * 86400000
    const pendientes = todas
      .filter((l) => ['pago', 'preparar', 'lista'].includes(l.etapa))
      .map((l) => ({ ...l, tarea: tarea(l) }))
      .sort((a, b) => new Date(a.desde || 0) - new Date(b.desde || 0))
    return {
      pago: en('pago'), preparar: en('preparar'), lista: en('lista'), entregada: en('entregada'),
      reembolsos: en('reembolsada').length,
      entregadasMes: en('entregada').filter((l) => new Date(l.desde || 0).getTime() > hace30).length,
      pendientes,
      actividad: todas.flatMap(eventos).filter(Boolean).sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).slice(0, 10),
    }
  }, [lecturas, ahora])

  const irDeTarea = (l) => (l.etapa === 'pago' ? irA('pagos') : l.automatica ? abrir(l) : irA('por-preparar'))
  const demoradas = resumen.pendientes.filter((t) => horasDesde(t.desde) > HORAS_DEMORA).length
  const n = resumen.pendientes.length

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-tinta-tenue">{fechaLarga()}</p>
        <h2 className="mt-1 font-display text-3xl text-tinta">
          {saludo()}. {cargando ? '' : n === 0
            ? 'Todo está al día.'
            : `Tienes ${n} ${n === 1 ? 'lectura pendiente' : 'lecturas pendientes'}${demoradas ? `, ${demoradas} con más de un día de espera` : ''}.`}
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Indicador etiqueta="Pagos por confirmar" valor={resumen.pago.length} tono="ambar" cargando={cargando}
          detalle="Revisa la venta en Hotmart" onClick={() => irA('pagos')} />
        <Indicador etiqueta="Por preparar" valor={resumen.preparar.length} tono="oro" cargando={cargando}
          detalle="Pagadas: generar, revisar y aprobar" onClick={() => irA('por-preparar')} />
        <Indicador etiqueta="Listas para enviar" valor={resumen.lista.length} tono="azul" cargando={cargando}
          detalle="Aprobadas, falta enviar el PDF" onClick={() => irA('entregas')} />
        <Indicador etiqueta="Entregadas en 30 días" valor={resumen.entregadasMes} tono="verde" cargando={cargando}
          detalle="Por correo o a mano" onClick={() => irA('entregas')} />
      </div>

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] [&>*]:min-w-0">
        <Tarjeta>
          <div className="flex items-center justify-between border-b border-linea px-5 py-4">
            <div>
              <h3 className="font-display text-xl text-tinta">Pendientes</h3>
              <p className="text-xs text-tinta-tenue">Primero lo que lleva más tiempo esperando</p>
            </div>
            {demoradas > 0 && <Insignia tono="ambar" punto>{demoradas} con más de 24 h</Insignia>}
          </div>
          {cargando ? (
            <div className="space-y-3 p-5">{[0, 1, 2].map((i) => <Esqueleto key={i} className="h-12" />)}</div>
          ) : n === 0 ? (
            <Vacio titulo="Todo al día" texto="Cuando entre un pedido o haya algo por enviar, aparecerá aquí." />
          ) : (
            <ul className="divide-y divide-linea">
              {resumen.pendientes.slice(0, 8).map((t) => {
                const demorada = horasDesde(t.desde) > HORAS_DEMORA
                return (
                  <li key={t.clave}>
                    <button type="button" onClick={() => irDeTarea(t)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-marfil sm:gap-4 sm:px-5">
                      <span className={`size-2 shrink-0 rounded-full ${demorada ? 'bg-ambar' : 'bg-oro-claro'}`} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-tinta">{t.nombre || t.email}</div>
                        <div className="truncate text-xs text-tinta-tenue">{t.producto} · {t.email}</div>
                      </div>
                      <Insignia tono={TONO_TAREA[t.tarea] || 'neutro'}>{t.tarea}</Insignia>
                      <span className={`hidden w-24 text-right text-xs sm:block ${demorada ? 'font-medium text-ambar' : 'text-tinta-tenue'}`}>{haceCuanto(t.desde)}</span>
                      <Icono nombre="flecha" className="size-4 text-tinta-tenue" />
                    </button>
                  </li>
                )
              })}
              {n > 8 && <li className="px-5 py-3 text-xs text-tinta-tenue">y {n - 8} más en sus secciones.</li>}
            </ul>
          )}
        </Tarjeta>

        <div className="space-y-6">
          <Tarjeta className="p-5">
            <h3 className="font-display text-xl text-tinta">Lecturas por etapa</h3>
            <p className="mb-5 text-xs text-tinta-tenue">Cuántas hay en cada paso ahora</p>
            {cargando ? <Esqueleto className="h-20" /> : (
              <Recorrido etapas={[
                { etiqueta: 'Pago por confirmar', valor: resumen.pago.length, color: 'bg-ambar/70' },
                { etiqueta: 'Por preparar', valor: resumen.preparar.length, color: 'bg-oro' },
                { etiqueta: 'Listas para enviar', valor: resumen.lista.length, color: 'bg-azul' },
                { etiqueta: 'Entregadas', valor: resumen.entregada.length, color: 'bg-salvia' },
              ]} />
            )}
            <div className="mt-5 border-t border-linea pt-4 text-sm">
              <div className="text-xs text-tinta-tenue">Reembolsos</div>
              <div className="font-display text-2xl lining-nums">{resumen.reembolsos}</div>
            </div>
          </Tarjeta>

          <Tarjeta>
            <h3 className="border-b border-linea px-5 py-4 font-display text-xl text-tinta">Actividad reciente</h3>
            {cargando ? <div className="space-y-3 p-5">{[0, 1, 2].map((i) => <Esqueleto key={i} className="h-8" />)}</div> : (
              resumen.actividad.length === 0 ? <p className="px-5 py-6 text-sm text-tinta-tenue">Sin movimientos todavía.</p> : (
                <ol className="relative px-5 py-4">
                  {resumen.actividad.map((e, i) => (
                    <li key={i} className="relative flex gap-3 pb-4 last:pb-0">
                      {i < resumen.actividad.length - 1 && <span className="absolute left-[3px] top-3 h-full w-px bg-linea" />}
                      <span className={`relative mt-1.5 size-[7px] shrink-0 rounded-full ${e.tono === 'verde' ? 'bg-salvia' : e.tono === 'rojo' ? 'bg-vino' : 'bg-oro-claro'}`} />
                      <div className="min-w-0 text-sm">
                        <span className="font-medium text-tinta">{e.nombre || 'Sin nombre'}</span>{' '}
                        <span className="text-tinta-suave">{e.texto}</span>
                        <div className="text-xs text-tinta-tenue" title={fechaHora(e.fecha)}>{haceCuanto(e.fecha)}</div>
                      </div>
                    </li>
                  ))}
                </ol>
              )
            )}
          </Tarjeta>
        </div>
      </div>
    </div>
  )
}

export default Resumen
