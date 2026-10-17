import { useCallback, useEffect, useMemo, useState } from 'react'
import { crearClienteAdmin } from './api'
import DetalleCarta from './DetalleCarta'
import DetallePedido from './DetallePedido'
import Resumen from './Resumen'
import TablaLecturas from './TablaLecturas'
import { Boton, Icono } from './ui'
import { useAviso, useConfirmar } from './contextos'
import { haceCuanto } from './formato'
import { unirLecturas } from './lecturas'

/**
 * Secciones del panel, por etapa: todas las lecturas (carta natal y demás
 * reportes) van juntas. `etapa` alimenta el contador de la barra lateral.
 */
const SECCIONES = [
  { id: 'resumen', etiqueta: 'Resumen', icono: 'resumen', titulo: 'Resumen', bajada: 'Lo que necesita tu atención hoy' },
  { id: 'pagos', etiqueta: 'Pagos por confirmar', icono: 'pago', etapa: 'pago', tabla: 'pago',
    titulo: 'Pagos por confirmar', bajada: 'Lecturas con los datos cargados: confírmalas cuando veas la venta en Hotmart' },
  { id: 'por-preparar', etiqueta: 'Por preparar', icono: 'revisar', etapa: 'preparar', tabla: 'preparar',
    titulo: 'Por preparar', bajada: 'Lecturas pagadas: genera el texto, revísalo y apruébalo' },
  { id: 'entregas', etiqueta: 'Entregas', icono: 'aprobadas', etapa: 'lista', tabla: 'entregas',
    titulo: 'Entregas', bajada: 'Lecturas aprobadas: envía el PDF o consulta cuándo se entregó' },
]

function seccionDesdeHash() {
  const id = window.location.hash.slice(1)
  return SECCIONES.some((s) => s.id === id) ? id : 'resumen'
}

/**
 * Escritorio del panel: barra lateral, encabezado con buscador y la sección
 * activa. Carga las cuatro listas del backend a la vez (cada una puede fallar
 * por separado) y las comparte con el resumen, las tablas y el detalle.
 */
function Escritorio({ clave, onSalir }) {
  const api = useMemo(() => crearClienteAdmin(clave), [clave])
  const avisar = useAviso()
  const confirmar = useConfirmar()
  const [seccion, setSeccion] = useState(seccionDesdeHash)
  const [datos, setDatos] = useState({})
  const [errores, setErrores] = useState({})
  const [cargando, setCargando] = useState(true)
  const [actualizado, setActualizado] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [cartaAbierta, setCartaAbierta] = useState(null)
  const [pedidoAbierto, setPedidoAbierto] = useState(null)
  const [menuMovil, setMenuMovil] = useState(false)
  const [enCurso, setEnCurso] = useState(null)
  const [, setReloj] = useState(0)

  /** Pide las cuatro listas a la vez; cada una puede fallar por separado. */
  const obtener = useCallback(async () => {
    const rutas = {
      esperando: '/admin/esperando-pago',
      pendientes: '/admin/pendientes',
      aprobadas: '/admin/enviadas',
      pedidos: '/admin/pedidos',
    }
    const claves = Object.keys(rutas)
    const resultados = await Promise.allSettled(claves.map((k) => api.get(rutas[k])))
    const nuevos = {}
    const fallos = {}
    resultados.forEach((r, i) => {
      if (r.status === 'fulfilled') nuevos[claves[i]] = r.value
      else fallos[claves[i]] = r.reason.message
    })
    return { nuevos, fallos }
  }, [api])

  const aplicar = useCallback(({ nuevos, fallos }) => {
    setDatos((anteriores) => ({ ...anteriores, ...nuevos }))
    setErrores(fallos)
    setActualizado(Date.now())
    setCargando(false)
  }, [])

  const cargar = useCallback(async () => {
    setCargando(true)
    aplicar(await obtener())
  }, [obtener, aplicar])

  useEffect(() => {
    let vigente = true
    obtener().then((r) => { if (vigente) aplicar(r) })
    return () => { vigente = false }
  }, [obtener, aplicar])

  // Refresca el "hace X min" y vuelve a pedir datos cada 2 minutos.
  useEffect(() => {
    const t = setInterval(() => setReloj((n) => n + 1), 30000)
    const r = setInterval(() => { if (!document.hidden) cargar() }, 120000)
    return () => { clearInterval(t); clearInterval(r) }
  }, [cargar])

  useEffect(() => {
    const alCambiar = () => setSeccion(seccionDesdeHash())
    window.addEventListener('hashchange', alCambiar)
    return () => window.removeEventListener('hashchange', alCambiar)
  }, [])

  function irA(id) {
    window.history.pushState(null, '', `#${id}`)
    setSeccion(id)
    setBusqueda('')
    setMenuMovil(false)
  }

  async function ejecutar(clave, fn, exito) {
    setEnCurso(clave)
    try {
      const resultado = await fn()
      avisar(typeof exito === 'function' ? exito(resultado) : exito)
      await cargar()
      return resultado
    } catch (err) {
      avisar(err.message, 'error')
      return null
    } finally {
      setEnCurso(null)
    }
  }

  const acciones = {
    enCurso,
    async confirmarPago(carta) {
      const opciones = { orderBump: false }
      const ok = await confirmar({
        titulo: '¿Confirmar el pago?',
        texto: (
          <>
            <p>Confirma solo si ya viste la venta de <b>{carta.nombre_reporte || carta.email}</b> en Hotmart.</p>
            {carta.pack ? (
              <p>Es un <b>pack</b>: busca la venta de «Carta natal + 2 reportes temáticos» por <b>{carta.email}</b> o por el código <b>astrea-orden-{carta.id}</b>. Pasan a «Por preparar» la carta natal, <b>{carta.pack.join(' y ')}</b>.</p>
            ) : (
              <>
                <p>Búscala por <b>{carta.email}</b> o por el código <b>astrea-orden-{carta.id}</b>. La lectura pasará a «Por preparar».</p>
                <label className="mt-3 flex items-start gap-2 text-sm">
                  <input type="checkbox" className="mt-0.5" onChange={(e) => { opciones.orderBump = e.target.checked }} />
                  <span>La venta incluye el order bump de <b>Amor y vínculos</b>. Se crea también ese pedido, ya pagado.</span>
                </label>
              </>
            )}
          </>
        ),
        accion: 'Confirmar pago',
      })
      if (!ok) return
      await ejecutar(`pago:${carta.id}`, async () => {
        await api.post(`/admin/confirmar-pago/${carta.id}`)
        if (opciones.orderBump) await api.post(`/admin/ordenes/${carta.id}/order-bump`)
      }, carta.pack
        ? `Pago del pack confirmado. La carta natal, ${carta.pack.join(' y ')} pasaron a «Por preparar».`
        : opciones.orderBump
          ? 'Pago confirmado. La carta natal y Amor y vínculos pasaron a «Por preparar».'
          : 'Pago confirmado. La lectura pasó a «Por preparar».')
    },
    async orderBump(carta) {
      const ok = await confirmar({
        titulo: '¿Registrar el order bump?',
        texto: (
          <>
            <p>Hazlo si la venta de <b>{carta.nombre_reporte || carta.email}</b> en Hotmart incluye <b>Amor y vínculos</b>.</p>
            <p>Se crea ese pedido con los mismos datos natales, ya pagado, en «Por preparar».</p>
          </>
        ),
        accion: 'Registrar order bump',
      })
      if (ok) await ejecutar(`bump:${carta.id}`, () => api.post(`/admin/ordenes/${carta.id}/order-bump`),
        (r) => (r?.status === 'ya_registrado' ? 'Ese order bump ya estaba registrado.' : 'Order bump registrado: Amor y vínculos está en «Por preparar».'))
    },
    async reembolsar(carta) {
      const ok = await confirmar({
        titulo: '¿Registrar el reembolso?',
        texto: (
          <>
            <p>Hazlo solo si ya le devolviste el dinero a <b>{carta.nombre_reporte || carta.email}</b> en Hotmart.</p>
            <p>El enlace de la lectura sigue funcionando.</p>
          </>
        ),
        accion: 'Registrar reembolso',
        variante: 'peligro',
      })
      if (ok) await ejecutar(`reembolso:${carta.id}`, () => api.post(`/admin/reembolsar/${carta.id}`), 'Reembolso registrado.')
    },
    async pedido(pedido, accion) {
      const textos = {
        'confirmar-pago': {
          titulo: '¿Confirmar el pago?',
          texto: <p>¿<b>{pedido.email}</b> ya pagó <b>{pedido.producto_nombre}</b>? Busca la venta en Hotmart por el correo o por <b>{pedido.referencia_hotmart}</b>.</p>,
          accion: 'Confirmar pago', exito: 'Pago confirmado. La lectura pasó a «Por preparar».',
        },
        'marcar-enviado': {
          titulo: '¿Marcar como entregado?',
          texto: <p>¿Ya le enviaste <b>{pedido.producto_nombre}</b> a <b>{pedido.email}</b> por correo? Esto solo lo registra; no envía nada.</p>,
          accion: 'Marcar enviado', exito: 'Pedido marcado como entregado.',
        },
        reembolsar: {
          titulo: '¿Registrar el reembolso?',
          texto: <p>Registra el reembolso de <b>{pedido.producto_nombre}</b> de <b>{pedido.email}</b> solo si ya devolviste el dinero en Hotmart.</p>,
          accion: 'Registrar reembolso', variante: 'peligro', exito: 'Reembolso registrado.',
        },
      }[accion]
      if (!(await confirmar(textos))) return false
      return Boolean(await ejecutar(`pedido:${pedido.id}:${accion}`, () => api.post(`/admin/pedidos/${pedido.id}/${accion}`), textos.exito))
    },
  }

  const actual = SECCIONES.find((s) => s.id === seccion)
  const lecturas = useMemo(() => unirLecturas(datos), [datos])
  const abrir = useCallback((l) => (l.tipo === 'carta' ? setCartaAbierta(l.id) : setPedidoAbierto(l.id)), [])

  const navegacion = (
    <nav className="space-y-0.5" aria-label="Secciones">
      {SECCIONES.map((s) => {
        const n = s.etapa && lecturas ? lecturas.filter((l) => l.etapa === s.etapa).length : null
        const activa = s.id === seccion
        return (
          <button key={s.id} type="button" onClick={() => irA(s.id)} aria-current={activa ? 'page' : undefined}
            className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
              activa ? 'bg-white/[.08] text-papel' : 'text-papel/60 hover:bg-white/[.04] hover:text-papel'
            }`}>
            <Icono nombre={s.icono} className={`size-[18px] ${activa ? 'text-oro-claro' : ''}`} />
            <span className="flex-1 text-left">{s.etiqueta}</span>
            {n > 0 && (
              <span className={`min-w-6 rounded-full px-1.5 py-px text-center text-[11px] font-semibold ${
                activa ? 'bg-oro-claro text-noche' : 'bg-white/10 text-papel/80'
              }`}>{n}</span>
            )}
          </button>
        )
      })}
    </nav>
  )

  const barraLateral = (
    <div className="flex h-full flex-col bg-noche px-4 py-6">
      <div className="px-3">
        <div className="font-romana text-[13px] tracking-[.5em] text-papel">ASTREA</div>
        <div className="mt-1 text-[11px] tracking-[.25em] text-oro-claro/80">PANEL DE LECTURAS</div>
      </div>
      <div className="mt-8 flex-1">{navegacion}</div>
      <div className="space-y-3 border-t border-white/10 px-3 pt-4">
        <p className="text-[11px] leading-relaxed text-papel/40">
          {actualizado ? `Actualizado ${haceCuanto(actualizado)}` : 'Cargando…'}
        </p>
        <button type="button" onClick={onSalir} className="flex items-center gap-2 text-sm text-papel/60 hover:text-papel">
          <Icono nombre="salir" /> Salir
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-marfil font-ui text-tinta antialiased">
      <aside className="fixed inset-y-0 left-0 hidden w-64 lg:block">{barraLateral}</aside>

      {menuMovil && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-noche/60" onClick={() => setMenuMovil(false)} />
          <div className="absolute inset-y-0 left-0 w-72 shadow-2xl">{barraLateral}</div>
        </div>
      )}

      <div className="min-w-0 lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-linea bg-marfil/90 backdrop-blur">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-8">
            <button type="button" onClick={() => setMenuMovil(true)} aria-label="Abrir menú"
              className="-ml-1 rounded-md p-1.5 text-tinta-suave hover:bg-pergamino lg:hidden">
              <Icono nombre="menu" className="size-5" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="truncate font-display text-[28px] leading-tight text-tinta sm:text-[32px]">{actual.titulo}</h1>
              <p className="hidden truncate text-sm text-tinta-tenue sm:block">{actual.bajada}</p>
            </div>
            {seccion !== 'resumen' && (
              <label className="relative hidden md:block">
                <span className="sr-only">Buscar</span>
                <Icono nombre="buscar" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-tinta-tenue" />
                <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar por nombre, correo o número"
                  className="h-9 w-72 rounded-lg bg-papel pl-9 pr-3 text-sm ring-1 ring-linea outline-none placeholder:text-tinta-tenue focus:ring-2 focus:ring-oro" />
              </label>
            )}
            <Boton icono="recargar" onClick={cargar} cargando={cargando} aria-label="Actualizar">
              <span className="hidden sm:inline">Actualizar</span>
            </Boton>
          </div>
          {seccion !== 'resumen' && (
            <div className="px-4 pb-3 md:hidden">
              <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar por nombre, correo o número"
                className="h-9 w-full rounded-lg bg-papel px-3 text-sm ring-1 ring-linea outline-none focus:ring-2 focus:ring-oro" />
            </div>
          )}
        </header>

        <main className="min-w-0 px-4 py-6 sm:px-8 sm:py-8">
          {Object.keys(errores).length > 0 && (
            <div className="mb-6 flex items-start gap-2 rounded-lg bg-[#fbeeec] px-4 py-3 text-sm text-vino ring-1 ring-vino/20">
              <Icono nombre="alerta" className="mt-0.5 shrink-0" />
              <span>No se pudo cargar todo: {Object.values(errores)[0]} Lo que ves puede estar incompleto.</span>
            </div>
          )}

          {seccion === 'resumen' && (
            <Resumen lecturas={lecturas} ahora={actualizado} cargando={cargando && !actualizado} irA={irA} abrir={abrir} />
          )}
          {actual.tabla && (
            <TablaLecturas key={actual.tabla} seccion={actual.tabla} lecturas={lecturas} busqueda={busqueda}
              acciones={acciones} abrir={abrir} />
          )}
        </main>
      </div>

      {pedidoAbierto && (
        <DetallePedido api={api} pedidoId={pedidoAbierto} onCerrar={() => setPedidoAbierto(null)} onCambio={cargar} acciones={acciones} />
      )}

      {cartaAbierta && (
        <DetalleCarta
          api={api}
          cartaId={cartaAbierta}
          resumenLista={[...(datos.pendientes || []), ...(datos.aprobadas || [])].find((c) => c.id === cartaAbierta)}
          onCerrar={() => setCartaAbierta(null)}
          onCambio={cargar}
          acciones={acciones}
        />
      )}
    </div>
  )
}

export default Escritorio
