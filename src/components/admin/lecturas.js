import { entrega } from './formato'

/**
 * Todas las lecturas del panel en una sola forma, sin importar el producto:
 * la carta natal llega por /admin/esperando-pago, /admin/pendientes y
 * /admin/enviadas; los demás reportes, por /admin/pedidos. El panel las
 * ordena por ETAPA (pago → preparar → enviar → entregada), no por producto.
 *
 * Etapas:
 * - pago:        datos cargados en la tienda, falta confirmar la venta en Hotmart.
 * - preparar:    pagada; hay que generar el texto, revisarlo y aprobarlo
 *                (revolución solar y compatibilidad: prepararla a mano y marcarla).
 * - lista:       aprobada; falta enviar el PDF por correo.
 * - entregada:   enviada por correo desde el panel o entregada a mano.
 * - reembolsada.
 */

export const ETAPAS = {
  pago: { etiqueta: 'Pago por confirmar', tono: 'ambar' },
  preparar: { etiqueta: 'Por preparar', tono: 'oro' },
  lista: { etiqueta: 'Lista para enviar', tono: 'azul' },
  entregada: { etiqueta: 'Entregada', tono: 'verde' },
  reembolsada: { etiqueta: 'Reembolsada', tono: 'rojo' },
}

const CARTA_NATAL = 'Carta natal'

function desdeCarta(carta, origen) {
  let etapa = origen
  let entregaInfo = null
  if (origen === 'aprobada') {
    entregaInfo = entrega(carta)
    etapa = { reembolsada: 'reembolsada', 'por-enviar': 'lista' }[entregaInfo.estado] || 'entregada'
  }
  return {
    clave: `c${carta.id}`,
    tipo: 'carta',
    id: carta.id,
    producto: CARTA_NATAL,
    nombre: carta.nombre_reporte,
    email: carta.email,
    fecha_hora_local: carta.fecha_hora_local,
    ciudad: carta.ciudad,
    pais: carta.pais,
    codigoHotmart: `astrea-orden-${carta.id}`,
    etapa,
    // Cómo se entregó (correo / a mano) y cuándo; solo para las aprobadas.
    entrega: entregaInfo,
    automatica: true,
    token: carta.token,
    // La fecha desde la que corre la espera de la etapa actual.
    desde: {
      pago: carta.fecha_solicitud_compra,
      preparar: carta.fecha_solicitud_compra || carta.fecha_generacion,
      lista: carta.fecha_envio,
      entregada: entregaInfo?.fecha,
      reembolsada: carta.fecha_reembolso,
    }[etapa],
    original: carta,
  }
}

function desdePedido(p) {
  const etapa = {
    pendiente: 'pago',
    confirmado: p.automatico && p.reporte_estado === 'aprobado' ? 'lista' : 'preparar',
    enviado: 'entregada',
    reembolsado: 'reembolsada',
  }[p.estado] || 'pago'
  return {
    clave: `p${p.id}`,
    tipo: 'pedido',
    id: p.id,
    producto: p.producto_nombre,
    nombre: p.nombre,
    email: p.email,
    fecha_hora_local: p.fecha_hora_local,
    ciudad: p.ciudad,
    pais: p.pais,
    codigoHotmart: p.referencia_hotmart,
    etapa,
    entrega: etapa === 'entregada' ? { estado: p.reporte_estado === 'enviado' ? 'correo' : 'a-mano', fecha: p.fecha_envio } : null,
    automatica: p.automatico,
    reporteEstado: p.reporte_estado,
    datosExtra: p.datos_extra,
    desde: {
      pago: p.fecha_solicitud_compra,
      preparar: p.fecha_confirmacion_pago,
      lista: p.fecha_confirmacion_pago,
      entregada: p.fecha_envio,
      reembolsada: p.fecha_reembolso,
    }[etapa],
    original: p,
  }
}

/** Une las cuatro listas del backend. Las que todavía no cargaron se omiten. */
export function unirLecturas({ esperando, pendientes, aprobadas, pedidos }) {
  if (!esperando && !pendientes && !aprobadas && !pedidos) return null
  return [
    ...(esperando || []).map((c) => desdeCarta(c, 'pago')),
    ...(pendientes || []).map((c) => desdeCarta(c, 'preparar')),
    ...(aprobadas || []).map((c) => desdeCarta(c, 'aprobada')),
    ...(pedidos || []).map(desdePedido),
  ]
}

/** Qué hay que hacer con una lectura según su etapa (texto de la cola y del botón). */
export function tarea(l) {
  if (l.etapa === 'pago') return 'Confirmar pago'
  if (l.etapa === 'lista') return 'Enviar PDF'
  if (l.etapa !== 'preparar') return null
  if (!l.automatica) return 'Preparar a mano'
  if (l.tipo === 'carta') return 'Revisar y aprobar'
  if (['generado', 'editado'].includes(l.reporteEstado)) return 'Revisar y aprobar'
  return 'Generar reporte'
}

/** Productos presentes, para el filtro (la carta natal primero). */
export function productos(lecturas) {
  const nombres = [...new Set((lecturas || []).map((l) => l.producto))]
  return nombres.sort((a, b) => (a === CARTA_NATAL ? -1 : b === CARTA_NATAL ? 1 : a.localeCompare(b, 'es')))
}
