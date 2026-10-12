import { useMemo } from 'react'
import { Esqueleto, Icono, Insignia, Tarjeta, Vacio } from './ui'
import { fechaHora, fechaLarga, haceCuanto, horasDesde, saludo } from './formato'

/** Una orden o pedido que lleva más de esto sin atenderse se marca como demorado. */
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

/**
 * Página de inicio: indicadores de lo que pide acción, la cola de trabajo
 * ordenada por antigüedad, el recorrido de las lecturas y la actividad
 * reciente (reconstruida con las fechas que ya devuelven las listas).
 */
function Resumen({ datos, ahora, cargando, irA, abrirCarta }) {
  const { esperando = [], pendientes = [], aprobadas = [], pedidos = [] } = datos

  const resumen = useMemo(() => {
    const sinPdf = aprobadas.filter((c) => !c.fecha_correo_entrega && !c.reembolsado)
    const conPdf = aprobadas.filter((c) => c.fecha_correo_entrega && !c.reembolsado)
    const pedidosPago = pedidos.filter((p) => p.estado === 'pendiente')
    const pedidosEnvio = pedidos.filter((p) => p.estado === 'confirmado')
    const hace30 = (ahora || 0) - 30 * 86400000
    const entregadasMes = conPdf.filter((c) => new Date(c.fecha_correo_entrega).getTime() > hace30).length
      + pedidos.filter((p) => p.estado === 'enviado' && new Date(p.fecha_envio).getTime() > hace30).length
    const reembolsos = aprobadas.filter((c) => c.reembolsado).length + pedidos.filter((p) => p.estado === 'reembolsado').length

    const cola = [
      ...pendientes.map((c) => ({ clave: `r${c.id}`, tipo: 'Revisar y aprobar', nombre: c.nombre_reporte, email: c.email,
        desde: c.fecha_solicitud_compra || c.fecha_generacion, abrir: () => abrirCarta(c.id), producto: 'Carta natal' })),
      ...sinPdf.map((c) => ({ clave: `e${c.id}`, tipo: 'Enviar PDF', nombre: c.nombre_reporte, email: c.email,
        desde: c.fecha_envio, abrir: () => abrirCarta(c.id), producto: 'Carta natal' })),
      ...esperando.map((c) => ({ clave: `p${c.id}`, tipo: 'Confirmar pago', nombre: c.nombre_reporte, email: c.email,
        desde: c.fecha_solicitud_compra, abrir: () => irA('esperando-pago'), producto: 'Carta natal' })),
      ...pedidosEnvio.map((p) => ({ clave: `pe${p.id}`, tipo: 'Preparar y enviar', nombre: p.nombre, email: p.email,
        desde: p.fecha_confirmacion_pago, abrir: () => irA('pedidos'), producto: p.producto_nombre })),
      ...pedidosPago.map((p) => ({ clave: `pp${p.id}`, tipo: 'Confirmar pago', nombre: p.nombre, email: p.email,
        desde: p.fecha_solicitud_compra, abrir: () => irA('pedidos'), producto: p.producto_nombre })),
    ].sort((a, b) => new Date(a.desde || 0) - new Date(b.desde || 0))

    const actividad = [
      ...esperando.map((c) => ({ fecha: c.fecha_solicitud_compra, texto: 'cargó sus datos y fue a pagar', nombre: c.nombre_reporte })),
      ...pendientes.map((c) => ({ fecha: c.fecha_solicitud_compra, texto: 'compró su carta natal', nombre: c.nombre_reporte })),
      ...aprobadas.flatMap((c) => [
        { fecha: c.fecha_envio, texto: 'lectura aprobada', nombre: c.nombre_reporte },
        c.fecha_correo_entrega && { fecha: c.fecha_correo_entrega, texto: 'recibió su PDF por correo', nombre: c.nombre_reporte, tono: 'verde' },
        c.fecha_reembolso && { fecha: c.fecha_reembolso, texto: 'reembolso registrado', nombre: c.nombre_reporte, tono: 'rojo' },
      ]),
      ...pedidos.flatMap((p) => [
        { fecha: p.fecha_solicitud_compra, texto: `pidió ${p.producto_nombre}`, nombre: p.nombre },
        p.fecha_confirmacion_pago && { fecha: p.fecha_confirmacion_pago, texto: `pago confirmado · ${p.producto_nombre}`, nombre: p.nombre },
        p.fecha_envio && { fecha: p.fecha_envio, texto: `recibió ${p.producto_nombre}`, nombre: p.nombre, tono: 'verde' },
        p.fecha_reembolso && { fecha: p.fecha_reembolso, texto: `reembolso · ${p.producto_nombre}`, nombre: p.nombre, tono: 'rojo' },
      ]),
    ].filter((e) => e && e.fecha).sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).slice(0, 10)

    return { sinPdf, conPdf, pedidosPago, pedidosEnvio, entregadasMes, reembolsos, cola, actividad }
  }, [esperando, pendientes, aprobadas, pedidos, abrirCarta, irA, ahora])

  const demoradas = resumen.cola.filter((t) => horasDesde(t.desde) > HORAS_DEMORA).length

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-tinta-tenue">{fechaLarga()}</p>
        <h2 className="mt-1 font-display text-3xl text-tinta">
          {saludo()}. {cargando ? '' : resumen.cola.length === 0
            ? 'No hay nada pendiente.'
            : `Hay ${resumen.cola.length} ${resumen.cola.length === 1 ? 'tarea' : 'tareas'} en la cola${demoradas ? `, ${demoradas} con más de un día` : ''}.`}
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Indicador etiqueta="Por revisar" valor={pendientes.length} tono="oro" cargando={cargando}
          detalle="Pagadas, esperan tu aprobación" onClick={() => irA('pendientes')} />
        <Indicador etiqueta="PDF por enviar" valor={resumen.sinPdf.length} tono="azul" cargando={cargando}
          detalle="Aprobadas sin correo de entrega" onClick={() => irA('aprobadas')} />
        <Indicador etiqueta="Esperando pago" valor={esperando.length + resumen.pedidosPago.length} tono="ambar" cargando={cargando}
          detalle="Por cruzar con Hotmart" onClick={() => irA(esperando.length ? 'esperando-pago' : 'pedidos')} />
        <Indicador etiqueta="Otros reportes" valor={resumen.pedidosEnvio.length} tono="verde" cargando={cargando}
          detalle="Pagados, por preparar y enviar" onClick={() => irA('pedidos')} />
      </div>

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] [&>*]:min-w-0">
        <Tarjeta>
          <div className="flex items-center justify-between border-b border-linea px-5 py-4">
            <div>
              <h3 className="font-display text-xl text-tinta">Cola de trabajo</h3>
              <p className="text-xs text-tinta-tenue">De la más antigua a la más reciente</p>
            </div>
            {demoradas > 0 && <Insignia tono="ambar" punto>{demoradas} con más de 24 h</Insignia>}
          </div>
          {cargando ? (
            <div className="space-y-3 p-5">{[0, 1, 2].map((i) => <Esqueleto key={i} className="h-12" />)}</div>
          ) : resumen.cola.length === 0 ? (
            <Vacio titulo="Todo al día" texto="Cuando entre una compra o haya algo por enviar, aparecerá aquí." />
          ) : (
            <ul className="divide-y divide-linea">
              {resumen.cola.slice(0, 8).map((t) => {
                const demorada = horasDesde(t.desde) > HORAS_DEMORA
                return (
                  <li key={t.clave}>
                    <button type="button" onClick={t.abrir} className="flex w-full items-center gap-3 px-4 py-3.5 sm:gap-4 sm:px-5 text-left hover:bg-marfil">
                      <span className={`size-2 shrink-0 rounded-full ${demorada ? 'bg-ambar' : 'bg-oro-claro'}`} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-tinta">{t.nombre || t.email}</div>
                        <div className="truncate text-xs text-tinta-tenue">{t.producto} · {t.email}</div>
                      </div>
                      <Insignia tono={t.tipo === 'Confirmar pago' ? 'ambar' : t.tipo === 'Enviar PDF' ? 'azul' : t.tipo === 'Preparar y enviar' ? 'verde' : 'oro'}>{t.tipo}</Insignia>
                      <span className={`hidden w-24 text-right text-xs sm:block ${demorada ? 'font-medium text-ambar' : 'text-tinta-tenue'}`}>{haceCuanto(t.desde)}</span>
                      <Icono nombre="flecha" className="size-4 text-tinta-tenue" />
                    </button>
                  </li>
                )
              })}
              {resumen.cola.length > 8 && (
                <li className="px-5 py-3 text-xs text-tinta-tenue">y {resumen.cola.length - 8} más en sus secciones.</li>
              )}
            </ul>
          )}
        </Tarjeta>

        <div className="space-y-6">
          <Tarjeta className="p-5">
            <h3 className="font-display text-xl text-tinta">Recorrido de las cartas natales</h3>
            <p className="mb-5 text-xs text-tinta-tenue">Dónde está cada orden ahora</p>
            {cargando ? <Esqueleto className="h-20" /> : (
              <Recorrido etapas={[
                { etiqueta: 'Esperando pago', valor: esperando.length, color: 'bg-ambar/70' },
                { etiqueta: 'Por revisar', valor: pendientes.length, color: 'bg-oro' },
                { etiqueta: 'PDF por enviar', valor: resumen.sinPdf.length, color: 'bg-azul' },
                { etiqueta: 'Entregadas', valor: resumen.conPdf.length, color: 'bg-salvia' },
              ]} />
            )}
            <div className="mt-5 grid grid-cols-2 gap-3 border-t border-linea pt-4 text-sm">
              <div>
                <div className="text-xs text-tinta-tenue">Entregas en 30 días</div>
                <div className="font-display text-2xl lining-nums">{resumen.entregadasMes}</div>
              </div>
              <div>
                <div className="text-xs text-tinta-tenue">Reembolsos registrados</div>
                <div className="font-display text-2xl lining-nums">{resumen.reembolsos}</div>
              </div>
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
                        <span className="font-medium text-tinta">{e.nombre || 'Alguien'}</span>{' '}
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
