import { useState } from 'react'
import { Boton, BotonCopiar, Esqueleto, Insignia, Tarjeta, Vacio } from './ui'
import { ESTADOS_REPORTE, coincide, fechaHora, haceCuanto, horasDesde, lugar, nacimiento } from './formato'

const ESTADOS = {
  pendiente: { etiqueta: 'Esperando pago', tono: 'ambar' },
  confirmado: { etiqueta: 'Pagado · por enviar', tono: 'azul' },
  enviado: { etiqueta: 'Enviado', tono: 'verde' },
  reembolsado: { etiqueta: 'Reembolsado', tono: 'rojo' },
}

const FILTROS = [
  { id: 'activos', etiqueta: 'Por atender', incluye: ['pendiente', 'confirmado'] },
  { id: 'enviado', etiqueta: 'Enviados', incluye: ['enviado'] },
  { id: 'reembolsado', etiqueta: 'Reembolsados', incluye: ['reembolsado'] },
  { id: 'todos', etiqueta: 'Todos', incluye: null },
]

function DatosExtra({ extra }) {
  if (!extra) return null
  if (extra.revolucion_solar) {
    const rs = extra.revolucion_solar
    return <div>Cumpleaños en {rs.ciudad}, {rs.pais} · ciclo {rs.anio}</div>
  }
  if (extra.segunda_persona) {
    const sp = extra.segunda_persona
    return <div>Con {sp.nombre} · {sp.fecha} · {sp.hora ? `${sp.hora} h` : 'hora desconocida'} · {sp.ciudad}, {sp.pais}</div>
  }
  return null
}

/** La fecha que importa según el estado (cuánto lleva esperando lo que toca hacer). */
function fechaClave(p) {
  return {
    pendiente: ['Pedido', p.fecha_solicitud_compra],
    confirmado: ['Pagado', p.fecha_confirmacion_pago],
    enviado: ['Enviado', p.fecha_envio],
    reembolsado: ['Reembolsado', p.fecha_reembolso],
  }[p.estado] || ['Pedido', p.fecha_solicitud_compra]
}

/**
 * Pedidos de la tienda para los reportes distintos de la carta natal
 * (amor, vocación, dinero, patrones, revolución solar, compatibilidad).
 * Se preparan y envían a mano por correo; aquí se confirma el pago (cruzando
 * la venta de Hotmart por astrea-pedido-<id>), se marca el envío y se
 * registra un reembolso.
 */
function ListaPedidos({ pedidos, busqueda, acciones, abrirPedido }) {
  const [filtro, setFiltro] = useState('activos')
  const incluye = FILTROS.find((f) => f.id === filtro).incluye
  const visibles = (pedidos || [])
    .filter((p) => !incluye || incluye.includes(p.estado))
    .filter((p) => !busqueda || coincide(`${p.nombre} ${p.email} ${p.producto_nombre} ${p.referencia_hotmart} #${p.id}`, busqueda))

  function botones(p) {
    const ocupado = (accion) => acciones.enCurso === `pedido:${p.id}:${accion}`
    return (
      <div className="flex flex-wrap justify-end gap-2">
        {p.estado === 'pendiente' && (
          <Boton variante="primario" tamano="sm" cargando={ocupado('confirmar-pago')} onClick={() => acciones.pedido(p, 'confirmar-pago')}>Confirmar pago</Boton>
        )}
        {p.automatico && p.estado !== 'pendiente' && p.estado !== 'reembolsado' && (
          <Boton variante={p.estado === 'enviado' ? 'borde' : 'oro'} tamano="sm" onClick={() => abrirPedido(p.id)}>
            {p.estado === 'enviado' ? 'Ver reporte' : !p.reporte_estado || ['pendiente', 'fallido'].includes(p.reporte_estado) ? 'Generar reporte' : 'Revisar y enviar'}
          </Boton>
        )}
        {p.estado === 'confirmado' && (
          <Boton variante={p.automatico ? 'fantasma' : 'oro'} tamano="sm" cargando={ocupado('marcar-enviado')}
            title={p.automatico ? 'Solo si lo enviaste tú por correo, fuera del panel' : undefined}
            onClick={() => acciones.pedido(p, 'marcar-enviado')}>{p.automatico ? 'Marcar enviado a mano' : 'Marcar enviado'}</Boton>
        )}
        {(p.estado === 'confirmado' || p.estado === 'enviado') && (
          <Boton variante="fantasma" tamano="sm" className="text-vino hover:text-vino" cargando={ocupado('reembolsar')}
            onClick={() => acciones.pedido(p, 'reembolsar')}>Reembolso</Boton>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="max-w-3xl text-sm leading-relaxed text-tinta-suave">
        Confirma el pago en Hotmart (busca el código). Amor, vocación, dinero y patrones se generan, revisan y envían desde aquí;
        revolución solar y compatibilidad todavía se preparan a mano: envía el PDF por correo y márcalo como enviado.
      </p>
      <div className="flex flex-wrap gap-2">
        {FILTROS.map((f) => {
          const n = (pedidos || []).filter((p) => !f.incluye || f.incluye.includes(p.estado)).length
          return (
            <button key={f.id} type="button" onClick={() => setFiltro(f.id)}
              className={`rounded-full px-3 py-1 text-sm transition ${filtro === f.id ? 'bg-tinta text-papel' : 'bg-papel text-tinta-suave ring-1 ring-linea hover:ring-linea-fuerte'}`}>
              {f.etiqueta} <span className="opacity-60">{n}</span>
            </button>
          )
        })}
      </div>

      <Tarjeta className="overflow-hidden">
        {!pedidos ? (
          <div className="space-y-3 p-5">{[0, 1, 2].map((i) => <Esqueleto key={i} className="h-14" />)}</div>
        ) : visibles.length === 0 ? (
          <Vacio titulo={busqueda ? 'Sin resultados' : 'No hay pedidos aquí'} texto={busqueda ? 'Prueba con otro nombre, correo o código.' : ''} />
        ) : (
          <ul className="divide-y divide-linea">
            {visibles.map((p) => {
              const estado = ESTADOS[p.estado] || ESTADOS.pendiente
              const [etiquetaFecha, fecha] = fechaClave(p)
              const demorado = (p.estado === 'pendiente' || p.estado === 'confirmado') && horasDesde(fecha) > 24
              return (
                <li key={p.id} className="grid gap-4 px-5 py-4 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_auto] md:items-center">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-display text-lg leading-tight text-tinta">{p.producto_nombre}</span>
                      <Insignia tono={estado.tono} punto>{estado.etiqueta}</Insignia>
                      {p.automatico && p.estado === 'confirmado' && (
                        <Insignia tono={(ESTADOS_REPORTE[p.reporte_estado] || ESTADOS_REPORTE.null).tono}>
                          Reporte: {(ESTADOS_REPORTE[p.reporte_estado] || ESTADOS_REPORTE.null).etiqueta.toLowerCase()}
                        </Insignia>
                      )}
                    </div>
                    <div className="flex items-center gap-1 truncate text-sm text-tinta">
                      <span className="truncate">{p.nombre} · {p.email}</span>
                      <BotonCopiar texto={p.email} etiqueta="Copiar correo" />
                    </div>
                    <div className="space-y-0.5 text-xs text-tinta-tenue">
                      <div>Nació {nacimiento(p.fecha_hora_local)} · {lugar(p.ciudad, p.pais)}</div>
                      <DatosExtra extra={p.datos_extra} />
                    </div>
                  </div>
                  <div className="space-y-1 text-xs text-tinta-tenue">
                    <div className="inline-flex items-center gap-1 font-mono text-tinta-suave">
                      {p.referencia_hotmart}<BotonCopiar texto={p.referencia_hotmart} etiqueta="Copiar código Hotmart" />
                    </div>
                    <div className={demorado ? 'font-medium text-ambar' : ''} title={fechaHora(fecha)}>
                      {etiquetaFecha} {haceCuanto(fecha)}
                    </div>
                    <div>Carta calculada #{p.carta_id}</div>
                  </div>
                  {botones(p)}
                </li>
              )
            })}
          </ul>
        )}
      </Tarjeta>
    </div>
  )
}

export default ListaPedidos
