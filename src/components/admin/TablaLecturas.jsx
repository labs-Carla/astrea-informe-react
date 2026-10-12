import { useState } from 'react'
import { URL_LECTURA } from './api'
import { Boton, BotonCopiar, Esqueleto, Icono, Insignia, Tarjeta, Vacio } from './ui'
import { coincide, fechaHora, haceCuanto, horasDesde, lugar, nacimiento } from './formato'
import { ETAPAS, productos, tarea } from './lecturas'

/** Estado de una lectura: etapa y, si ya se entregó, cómo. */
export function EstadoLectura({ lectura }) {
  if (lectura.etapa === 'entregada') {
    return <Insignia tono="verde" punto>{lectura.entrega?.estado === 'correo' ? 'PDF enviado por correo' : 'Entregada a mano'}</Insignia>
  }
  const { etiqueta, tono } = ETAPAS[lectura.etapa]
  return <Insignia tono={tono} punto>{etiqueta}</Insignia>
}

const VACIOS = {
  pago: ['No hay pagos por confirmar', 'Cuando alguien cargue sus datos en la tienda y pase a Hotmart, aparecerá aquí.'],
  preparar: ['Nada por preparar', 'Las lecturas pagadas aparecen aquí para generar el texto, revisarlo y aprobarlo.'],
  entregas: ['Aún no hay entregas', 'Las lecturas aprobadas aparecen aquí.'],
}

const FILTROS_ENTREGAS = [
  { id: 'todas', etiqueta: 'Todas', etapas: ['lista', 'entregada', 'reembolsada'] },
  { id: 'lista', etiqueta: 'Listas para enviar', etapas: ['lista'] },
  { id: 'entregada', etiqueta: 'Entregadas', etapas: ['entregada'] },
  { id: 'reembolsada', etiqueta: 'Reembolsadas', etapas: ['reembolsada'] },
]

function Lectura({ l }) {
  return (
    <div className="min-w-0">
      <div className="font-romana text-[10.5px] tracking-[.14em] text-oro">{l.producto.toUpperCase()}</div>
      <div className="truncate font-medium text-tinta">{l.nombre || '(sin nombre)'}</div>
      <div className="flex items-center gap-1 truncate text-xs text-tinta-tenue">
        <span className="truncate">{l.email}</span>
        {l.email && <BotonCopiar texto={l.email} etiqueta="Copiar correo" />}
      </div>
    </div>
  )
}

function Espera({ iso, avisar = true }) {
  const demorada = avisar && horasDesde(iso) > 24
  return (
    <div title={fechaHora(iso)}>
      <div className={demorada ? 'font-medium text-ambar' : 'text-tinta'}>{haceCuanto(iso)}</div>
      <div className="text-xs text-tinta-tenue">{fechaHora(iso)}</div>
    </div>
  )
}

function DatosExtra({ extra }) {
  if (extra?.revolucion_solar) {
    const rs = extra.revolucion_solar
    return <div>Cumpleaños en {rs.ciudad}, {rs.pais} · ciclo {rs.anio}</div>
  }
  if (extra?.segunda_persona) {
    const sp = extra.segunda_persona
    return <div>Con {sp.nombre} · {sp.fecha} · {sp.hora ? `${sp.hora} h` : 'hora desconocida'} · {sp.ciudad}, {sp.pais}</div>
  }
  return null
}

/** Se abre la ficha (carta natal o reporte temático); los reportes a mano no tienen ficha. */
const abrible = (l) => l.etapa !== 'pago' && l.automatica

function columnas(seccion, acciones, abrir) {
  const ocupado = (clave) => acciones.enCurso === clave
  const lectura = { titulo: 'Lectura', celda: (l) => <Lectura l={l} />, ancho: 'w-[34%]' }
  const nac = { titulo: 'Nacimiento', clase: 'hidden xl:table-cell', celda: (l) => (
    <div className="text-sm">
      <div className="tabular-nums text-tinta">{nacimiento(l.fecha_hora_local)}</div>
      <div className="text-xs text-tinta-tenue">{lugar(l.ciudad, l.pais)}</div>
      <div className="text-xs text-tinta-tenue"><DatosExtra extra={l.datosExtra} /></div>
    </div>
  ) }

  if (seccion === 'pago') {
    return [
      lectura,
      { titulo: 'Código en Hotmart', celda: (l) => (
        <span className="inline-flex items-center gap-1 font-mono text-xs text-tinta-suave">{l.codigoHotmart}<BotonCopiar texto={l.codigoHotmart} etiqueta="Copiar código" /></span>
      ) },
      nac,
      { titulo: 'Pedido', celda: (l) => <Espera iso={l.desde} /> },
      { titulo: '', clase: 'text-right', celda: (l) => {
        const clave = l.tipo === 'carta' ? `pago:${l.id}` : `pedido:${l.id}:confirmar-pago`
        return (
          <Boton variante="primario" tamano="sm" cargando={ocupado(clave)}
            onClick={(e) => { e.stopPropagation(); l.tipo === 'carta' ? acciones.confirmarPago(l.original) : acciones.pedido(l.original, 'confirmar-pago') }}>
            Confirmar pago
          </Boton>
        )
      } },
    ]
  }

  if (seccion === 'preparar') {
    return [
      lectura,
      nac,
      { titulo: 'Pagada', celda: (l) => <Espera iso={l.desde} /> },
      { titulo: 'Qué falta', clase: 'hidden md:table-cell', celda: (l) => <Insignia tono={l.automatica ? 'oro' : 'neutro'} punto>{tarea(l)}</Insignia> },
      { titulo: '', clase: 'text-right', celda: (l) => l.automatica ? (
        <Boton variante="oro" tamano="sm" onClick={(e) => { e.stopPropagation(); abrir(l) }}>
          {tarea(l) === 'Generar reporte' ? 'Generar reporte' : 'Revisar'}
        </Boton>
      ) : (
        <Boton variante="borde" tamano="sm" cargando={ocupado(`pedido:${l.id}:marcar-enviado`)}
          title="Prepáralo a mano, envíalo por correo y luego márcalo aquí"
          onClick={(e) => { e.stopPropagation(); acciones.pedido(l.original, 'marcar-enviado') }}>
          Marcar enviado
        </Boton>
      ) },
    ]
  }

  return [
    lectura,
    { titulo: 'Estado', celda: (l) => (
      <div className="space-y-1">
        <EstadoLectura lectura={l} />
        {l.etapa === 'entregada' && l.entrega?.fecha && <div className="text-xs text-tinta-tenue">{fechaHora(l.entrega.fecha)}</div>}
      </div>
    ) },
    { titulo: 'Enlace web', clase: 'hidden xl:table-cell', celda: (l) => l.token && (
      <span className="inline-flex items-center gap-1 text-xs">
        <a href={`${URL_LECTURA}${l.token}`} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 text-oro hover:underline">Abrir <Icono nombre="externo" className="size-3.5" /></a>
        <BotonCopiar texto={`${URL_LECTURA}${l.token}`} etiqueta="Copiar enlace" />
      </span>
    ) },
    { titulo: '', clase: 'text-right', celda: (l) => (
      <div className="flex flex-wrap justify-end gap-2">
        {l.etapa === 'lista' && (
          <Boton variante="oro" tamano="sm" icono="enviar" onClick={(e) => { e.stopPropagation(); abrir(l) }}>Enviar</Boton>
        )}
        {l.etapa !== 'reembolsada' && (
          <Boton variante="fantasma" tamano="sm" className="text-vino hover:text-vino"
            cargando={ocupado(l.tipo === 'carta' ? `reembolso:${l.id}` : `pedido:${l.id}:reembolsar`)}
            onClick={(e) => { e.stopPropagation(); l.tipo === 'carta' ? acciones.reembolsar(l.original) : acciones.pedido(l.original, 'reembolsar') }}>
            Registrar reembolso
          </Boton>
        )}
      </div>
    ) },
  ]
}

/**
 * Tabla de una sección del panel (pagos por confirmar, por preparar o
 * entregas) con todas las lecturas juntas: carta natal y demás reportes.
 */
function TablaLecturas({ seccion, lecturas, busqueda, acciones, abrir }) {
  const [filtro, setFiltro] = useState('todas')
  const [producto, setProducto] = useState('')
  const filtroEntregas = FILTROS_ENTREGAS.find((f) => f.id === filtro)
  const etapas = seccion === 'entregas' ? filtroEntregas.etapas : [seccion]
  const deSeccion = (lecturas || []).filter((l) =>
    (seccion === 'entregas' ? FILTROS_ENTREGAS[0].etapas : [seccion]).includes(l.etapa))
  const visibles = deSeccion
    .filter((l) => etapas.includes(l.etapa))
    .filter((l) => !producto || l.producto === producto)
    .filter((l) => !busqueda || coincide(`${l.nombre} ${l.email} ${l.producto} ${l.codigoHotmart} #${l.id} ${l.ciudad || ''}`, busqueda))
    .sort((a, b) => seccion === 'entregas'
      ? new Date(b.desde || 0) - new Date(a.desde || 0)
      : new Date(a.desde || 0) - new Date(b.desde || 0))
  const cols = columnas(seccion, acciones, abrir)
  const opciones = productos(deSeccion)

  return (
    <div className="space-y-4">
      {seccion === 'pago' && (
        <p className="max-w-3xl text-sm leading-relaxed text-tinta-suave">
          Estas personas cargaron sus datos en la tienda y pasaron a Hotmart. Cuando veas la venta (mismo correo o el
          código), confirma el pago y la lectura pasará a «Por preparar».
        </p>
      )}
      {seccion === 'preparar' && (
        <p className="max-w-3xl text-sm leading-relaxed text-tinta-suave">
          Genera el texto, revísalo y apruébalo. Revolución solar y compatibilidad todavía se preparan a mano: envía el PDF
          por correo y luego toca «Marcar enviado».
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {seccion === 'entregas' && FILTROS_ENTREGAS.map((f) => {
          const n = deSeccion.filter((l) => f.etapas.includes(l.etapa) && (!producto || l.producto === producto)).length
          return (
            <button key={f.id} type="button" onClick={() => setFiltro(f.id)}
              className={`rounded-full px-3 py-1 text-sm transition ${filtro === f.id ? 'bg-tinta text-papel' : 'bg-papel text-tinta-suave ring-1 ring-linea hover:ring-linea-fuerte'}`}>
              {f.etiqueta} <span className="opacity-60">{n}</span>
            </button>
          )
        })}
        {opciones.length > 1 && (
          <label className="ml-auto inline-flex items-center gap-2 text-sm text-tinta-suave">
            Lectura
            <select value={producto} onChange={(e) => setProducto(e.target.value)}
              className="h-8 w-56 rounded-lg bg-papel px-2.5 text-sm text-tinta ring-1 ring-linea outline-none focus:ring-2 focus:ring-oro">
              <option value="">Todas</option>
              {opciones.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>
        )}
      </div>

      <Tarjeta className="overflow-hidden">
        {!lecturas ? (
          <div className="space-y-3 p-5">{[0, 1, 2, 3].map((i) => <Esqueleto key={i} className="h-12" />)}</div>
        ) : visibles.length === 0 ? (
          busqueda || producto || filtro !== 'todas'
            ? <Vacio titulo="Sin resultados" texto="Prueba con otro nombre, correo, código o filtro." />
            : <Vacio titulo={VACIOS[seccion][0]} texto={VACIOS[seccion][1]} />
        ) : (
          <>
            <table className="hidden w-full text-sm md:table">
              <thead>
                <tr className="border-b border-linea bg-marfil/60 text-left text-[11px] uppercase tracking-wider text-tinta-tenue">
                  {cols.map((c, i) => <th key={i} className={`px-4 py-3 font-medium first:pl-5 ${c.clase || ''} ${c.ancho || ''}`}>{c.titulo}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-linea">
                {visibles.map((l) => (
                  <tr key={l.clave} onClick={abrible(l) ? () => abrir(l) : undefined}
                    className={`align-middle transition-colors ${abrible(l) ? 'cursor-pointer hover:bg-marfil' : ''}`}>
                    {cols.map((c, i) => <td key={i} className={`px-4 py-3.5 first:pl-5 ${c.clase || ''}`}>{c.celda(l)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>

            <ul className="divide-y divide-linea md:hidden">
              {visibles.map((l) => (
                <li key={l.clave} onClick={abrible(l) ? () => abrir(l) : undefined}
                  className={`space-y-3 px-4 py-4 ${abrible(l) ? 'active:bg-marfil' : ''}`}>
                  <Lectura l={l} />
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    {seccion === 'entregas' ? <EstadoLectura lectura={l} /> : <Espera iso={l.desde} />}
                    {cols[cols.length - 1].celda(l)}
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </Tarjeta>
      {lecturas && visibles.length > 0 && <p className="text-xs text-tinta-tenue">{visibles.length} de {deSeccion.length}</p>}
    </div>
  )
}

export default TablaLecturas
