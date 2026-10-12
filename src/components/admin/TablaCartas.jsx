import { useState } from 'react'
import { URL_LECTURA } from './api'
import { Boton, BotonCopiar, Esqueleto, Icono, Insignia, Tarjeta, Vacio } from './ui'
import { coincide, fechaHora, haceCuanto, horasDesde, lugar, nacimiento } from './formato'

const VACIOS = {
  'esperando-pago': ['Sin órdenes esperando pago', 'Cuando alguien cargue sus datos en la tienda y vaya a Hotmart, aparecerá aquí.'],
  pendientes: ['Nada por revisar', 'Las cartas pagadas aparecen aquí para generar, revisar y aprobar.'],
  aprobadas: ['Aún no hay lecturas aprobadas', ''],
}

const FILTROS_APROBADAS = [
  { id: 'todas', etiqueta: 'Todas', incluye: () => true },
  { id: 'sin-pdf', etiqueta: 'PDF por enviar', incluye: (c) => !c.fecha_correo_entrega && !c.reembolsado },
  { id: 'entregadas', etiqueta: 'Entregadas', incluye: (c) => c.fecha_correo_entrega && !c.reembolsado },
  { id: 'reembolsadas', etiqueta: 'Reembolsadas', incluye: (c) => c.reembolsado },
]

export function EstadoPdf({ carta }) {
  if (carta.reembolsado) return <Insignia tono="rojo" punto>Reembolsada</Insignia>
  if (carta.fecha_correo_entrega) return <Insignia tono="verde" punto>PDF enviado</Insignia>
  return <Insignia tono="azul" punto>PDF por enviar</Insignia>
}

function Cliente({ carta }) {
  return (
    <div className="min-w-0">
      <div className="truncate font-medium text-tinta">{carta.nombre_reporte || '(sin nombre)'}</div>
      <div className="flex items-center gap-1 truncate text-xs text-tinta-tenue">
        <span className="truncate">{carta.email}</span>
        {carta.email && <BotonCopiar texto={carta.email} etiqueta="Copiar correo" />}
      </div>
    </div>
  )
}

function Antiguedad({ iso }) {
  const demorada = horasDesde(iso) > 24
  return (
    <div title={fechaHora(iso)}>
      <div className={demorada ? 'font-medium text-ambar' : 'text-tinta'}>{haceCuanto(iso)}</div>
      <div className="text-xs text-tinta-tenue">{fechaHora(iso)}</div>
    </div>
  )
}

/**
 * Columnas por sección. Cada una define encabezado, celda y, opcionalmente,
 * clases para ocultarla en pantallas medianas.
 */
function columnas(tipo, acciones) {
  const cliente = { titulo: 'Cliente', celda: (c) => <Cliente carta={c} />, ancho: 'w-[30%]' }
  const nac = { titulo: 'Nacimiento', celda: (c) => (
    <div><div className="tabular-nums text-tinta">{nacimiento(c.fecha_hora_local)}</div><div className="text-xs text-tinta-tenue">{lugar(c.ciudad, c.pais)}</div></div>
  ), clase: 'hidden xl:table-cell' }

  if (tipo === 'esperando-pago') {
    return [
      cliente,
      { titulo: 'Código Hotmart', celda: (c) => (
        <span className="inline-flex items-center gap-1 font-mono text-xs text-tinta-suave">astrea-orden-{c.id}<BotonCopiar texto={`astrea-orden-${c.id}`} etiqueta="Copiar código" /></span>
      ) },
      nac,
      { titulo: 'Solicitada', celda: (c) => <Antiguedad iso={c.fecha_solicitud_compra} /> },
      { titulo: '', clase: 'text-right', celda: (c) => (
        <Boton variante="primario" tamano="sm" cargando={acciones.enCurso === `pago:${c.id}`}
          onClick={(e) => { e.stopPropagation(); acciones.confirmarPago(c) }}>Confirmar pago</Boton>
      ) },
    ]
  }
  if (tipo === 'pendientes') {
    return [
      cliente,
      nac,
      { titulo: 'Compró', celda: (c) => <Antiguedad iso={c.fecha_solicitud_compra || c.fecha_generacion} /> },
      { titulo: 'Estado', celda: () => <Insignia tono="oro" punto>Por revisar</Insignia>, clase: 'hidden md:table-cell' },
      { titulo: '', clase: 'text-right', celda: () => (
        <span className="inline-flex items-center gap-1 text-sm font-medium text-oro">Revisar <Icono nombre="flecha" /></span>
      ) },
    ]
  }
  return [
    cliente,
    { titulo: 'Aprobada', celda: (c) => <div title={fechaHora(c.fecha_envio)}><div className="text-tinta">{fechaHora(c.fecha_envio)}</div></div>, clase: 'hidden lg:table-cell' },
    { titulo: 'Correo con PDF', celda: (c) => (
      <div className="space-y-1"><EstadoPdf carta={c} />
        {c.fecha_correo_entrega && <div className="text-xs text-tinta-tenue">{fechaHora(c.fecha_correo_entrega)}</div>}</div>
    ) },
    { titulo: 'Lectura web', clase: 'hidden xl:table-cell', celda: (c) => c.token && (
      <span className="inline-flex items-center gap-1 text-xs">
        <a href={`${URL_LECTURA}${c.token}`} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 text-oro hover:underline">Abrir <Icono nombre="externo" className="size-3.5" /></a>
        <BotonCopiar texto={`${URL_LECTURA}${c.token}`} etiqueta="Copiar enlace" />
      </span>
    ) },
    { titulo: '', clase: 'text-right', celda: (c) => !c.reembolsado && (
      <Boton variante="fantasma" tamano="sm" cargando={acciones.enCurso === `reembolso:${c.id}`}
        onClick={(e) => { e.stopPropagation(); acciones.reembolsar(c) }} className="text-vino hover:text-vino">Reembolso</Boton>
    ) },
  ]
}

/** Tabla de cartas de una sección (esperando pago, por revisar o aprobadas). */
function TablaCartas({ tipo, cartas, busqueda, acciones, abrirCarta }) {
  const [filtro, setFiltro] = useState('todas')
  const cols = columnas(tipo, acciones)
  const abrible = tipo !== 'esperando-pago'

  let visibles = (cartas || []).filter((c) =>
    !busqueda || coincide(`${c.nombre_reporte} ${c.email} #${c.id} ${c.ciudad || ''}`, busqueda))
  if (tipo === 'aprobadas') visibles = visibles.filter(FILTROS_APROBADAS.find((f) => f.id === filtro).incluye)

  return (
    <div className="space-y-4">
      {tipo === 'esperando-pago' && (
        <p className="max-w-3xl text-sm leading-relaxed text-tinta-suave">
          Estas personas llenaron sus datos y fueron enviadas a Hotmart. Cuando veas la venta (mismo correo o código
          <span className="font-mono text-xs"> astrea-orden-ID</span>), confirma el pago para pasarla a «Por revisar».
        </p>
      )}
      {tipo === 'aprobadas' && (
        <div className="flex flex-wrap gap-2">
          {FILTROS_APROBADAS.map((f) => {
            const n = (cartas || []).filter(f.incluye).length
            return (
              <button key={f.id} type="button" onClick={() => setFiltro(f.id)}
                className={`rounded-full px-3 py-1 text-sm transition ${filtro === f.id ? 'bg-tinta text-papel' : 'bg-papel text-tinta-suave ring-1 ring-linea hover:ring-linea-fuerte'}`}>
                {f.etiqueta} <span className="opacity-60">{n}</span>
              </button>
            )
          })}
        </div>
      )}

      <Tarjeta className="overflow-hidden">
        {!cartas ? (
          <div className="space-y-3 p-5">{[0, 1, 2, 3].map((i) => <Esqueleto key={i} className="h-12" />)}</div>
        ) : visibles.length === 0 ? (
          busqueda || filtro !== 'todas'
            ? <Vacio titulo="Sin resultados" texto="Prueba con otro nombre, correo o filtro." />
            : <Vacio titulo={VACIOS[tipo][0]} texto={VACIOS[tipo][1]} />
        ) : (
          <>
            <table className="hidden w-full text-sm md:table">
              <thead>
                <tr className="border-b border-linea bg-marfil/60 text-left text-[11px] uppercase tracking-wider text-tinta-tenue">
                  <th className="px-5 py-3 font-medium">#</th>
                  {cols.map((c, i) => <th key={i} className={`px-4 py-3 font-medium ${c.clase || ''} ${c.ancho || ''}`}>{c.titulo}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-linea">
                {visibles.map((carta) => (
                  <tr key={carta.id} onClick={abrible ? () => abrirCarta(carta.id) : undefined}
                    className={`align-middle transition-colors ${abrible ? 'cursor-pointer hover:bg-marfil' : ''}`}>
                    <td className="px-5 py-3.5 tabular-nums text-xs text-tinta-tenue">{carta.id}</td>
                    {cols.map((c, i) => <td key={i} className={`px-4 py-3.5 ${c.clase || ''}`}>{c.celda(carta)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>

            <ul className="divide-y divide-linea md:hidden">
              {visibles.map((carta) => (
                <li key={carta.id} onClick={abrible ? () => abrirCarta(carta.id) : undefined}
                  className={`space-y-3 px-4 py-4 ${abrible ? 'active:bg-marfil' : ''}`}>
                  <div className="flex items-start justify-between gap-3">
                    <Cliente carta={carta} />
                    <span className="text-xs text-tinta-tenue">#{carta.id}</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    {tipo === 'aprobadas' ? <EstadoPdf carta={carta} /> : <Antiguedad iso={carta.fecha_solicitud_compra || carta.fecha_generacion} />}
                    {cols[cols.length - 1].celda(carta)}
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </Tarjeta>
      {cartas && visibles.length > 0 && (
        <p className="text-xs text-tinta-tenue">{visibles.length} de {cartas.length}</p>
      )}
    </div>
  )
}

export default TablaCartas
