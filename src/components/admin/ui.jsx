import { useCallback, useEffect, useRef, useState } from 'react'
import { ContextoAvisos, ContextoConfirmar } from './contextos'

/* ───────────── Iconos (trazo fino, sin dependencias) ───────────── */

const TRAZOS = {
  resumen: 'M3 13h8V3H3v10Zm10 8h8V11h-8v10ZM3 21h8v-6H3v6Zm10-18v6h8V3h-8Z',
  pago: 'M3 7h18v10H3V7Zm0 3h18M7 14h3',
  revisar: 'M9 5h10M9 12h10M9 19h10M4 5l1 1 2-2M4 12l1 1 2-2M4 19l1 1 2-2',
  aprobadas: 'M4 6h16v12H4V6Zm0 0 8 6 8-6',
  pedidos: 'M6 3h12l2 4H4l2-4Zm-2 4h16v13H4V7Zm5 4h6',
  buscar: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm5-2 4 4',
  recargar: 'M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7',
  salir: 'M15 4h4v16h-4M10 8l-4 4 4 4M6 12h11',
  cerrar: 'M6 6l12 12M18 6 6 18',
  externo: 'M14 4h6v6M20 4l-9 9M18 14v6H4V6h6',
  copiar: 'M9 9h11v11H9V9Zm-5 6V4h11',
  check: 'm5 12 4 4 10-10',
  alerta: 'M12 4 2 20h20L12 4Zm0 6v4m0 3v.5',
  flecha: 'm9 6 6 6-6 6',
  menu: 'M4 7h16M4 12h16M4 17h16',
  enviar: 'M4 12 20 4l-6 16-3-7-7-1Z',
  reloj: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-13v4l3 2',
  estrella: 'M12 3l1.6 6.4L20 11l-6.4 1.6L12 19l-1.6-6.4L4 11l6.4-1.6L12 3Z',
}

export function Icono({ nombre, className = 'size-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
      strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={TRAZOS[nombre]} />
    </svg>
  )
}

/* ───────────── Piezas básicas ───────────── */

const TONOS = {
  neutro: 'bg-pergamino text-tinta-suave ring-linea-fuerte/60',
  oro: 'bg-[#f4ead3] text-oro ring-oro/30',
  verde: 'bg-[#e9efe2] text-salvia ring-salvia/25',
  azul: 'bg-[#e4ecf0] text-azul ring-azul/25',
  rojo: 'bg-[#f5e4e1] text-vino ring-vino/25',
  ambar: 'bg-[#f8ead6] text-ambar ring-ambar/30',
}

export function Insignia({ tono = 'neutro', children, punto = false }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${TONOS[tono]}`}>
      {punto && <span className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
}

const VARIANTES = {
  primario: 'bg-tinta text-papel hover:bg-noche-2 shadow-sm',
  oro: 'bg-oro text-papel hover:bg-[#7a5c2f] shadow-sm',
  borde: 'bg-papel text-tinta ring-1 ring-inset ring-linea-fuerte hover:bg-pergamino',
  peligro: 'bg-papel text-vino ring-1 ring-inset ring-vino/40 hover:bg-[#f5e4e1]',
  fantasma: 'text-tinta-suave hover:bg-pergamino hover:text-tinta',
}

export function Boton({ variante = 'borde', tamano = 'md', icono, cargando, children, className = '', ...props }) {
  const tamanos = { sm: 'h-8 px-3 text-xs gap-1.5', md: 'h-9 px-3.5 text-sm gap-2', lg: 'h-11 px-5 text-sm gap-2' }
  return (
    <button
      type="button"
      {...props}
      disabled={props.disabled || cargando}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-lg font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-oro disabled:cursor-not-allowed disabled:opacity-50 ${tamanos[tamano]} ${VARIANTES[variante]} ${className}`}
    >
      {cargando ? <Giro /> : icono && <Icono nombre={icono} />}
      {children}
    </button>
  )
}

export function Giro({ className = 'size-4' }) {
  return (
    <svg viewBox="0 0 24 24" className={`animate-spin ${className}`} aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeOpacity=".25" strokeWidth="2.5" />
      <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}

export function Tarjeta({ className = '', children }) {
  return <div className={`rounded-xl bg-papel ring-1 ring-linea shadow-[0_1px_2px_rgba(31,26,20,.04)] ${className}`}>{children}</div>
}

export function Esqueleto({ className = '' }) {
  return <div className={`animate-pulse rounded-md bg-pergamino ${className}`} />
}

export function Vacio({ titulo, texto }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <Icono nombre="estrella" className="mb-3 size-6 text-oro-claro" />
      <p className="font-display text-xl text-tinta">{titulo}</p>
      {texto && <p className="mt-1 max-w-sm text-sm text-tinta-tenue">{texto}</p>}
    </div>
  )
}

export function BotonCopiar({ texto, etiqueta = 'Copiar' }) {
  const [copiado, setCopiado] = useState(false)
  async function copiar(e) {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(texto)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 1500)
    } catch {
      /* el portapapeles puede estar bloqueado: no es crítico */
    }
  }
  return (
    <button type="button" onClick={copiar} title={etiqueta} aria-label={etiqueta}
      className="inline-flex size-6 items-center justify-center rounded text-tinta-tenue hover:bg-pergamino hover:text-tinta">
      <Icono nombre={copiado ? 'check' : 'copiar'} className="size-3.5" />
    </button>
  )
}

/** Un paso del recorrido de una lectura (ficha lateral). */
export function Paso({ hecho, actual, etiqueta, ultimo }) {
  return (
    <li className="flex flex-1 items-center gap-2">
      <span className={`flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] ring-1 ${
        hecho ? 'bg-salvia text-papel ring-salvia' : actual ? 'bg-papel text-oro ring-oro' : 'bg-papel text-tinta-tenue ring-linea-fuerte'
      }`}>
        {hecho ? <Icono nombre="check" className="size-3.5" /> : <span className="size-1.5 rounded-full bg-current" />}
      </span>
      <span className={`whitespace-nowrap text-xs ${hecho || actual ? 'text-tinta' : 'text-tinta-tenue'}`}>{etiqueta}</span>
      {!ultimo && <span className={`h-px min-w-3 flex-1 ${hecho ? 'bg-salvia/50' : 'bg-linea'}`} />}
    </li>
  )
}

/* ───────────── Avisos (toasts) ───────────── */

export function ProveedorAvisos({ children }) {
  const [avisos, setAvisos] = useState([])
  const siguiente = useRef(0)

  const avisar = useCallback((texto, tono = 'ok') => {
    const id = ++siguiente.current
    setAvisos((a) => [...a, { id, texto, tono }])
    setTimeout(() => setAvisos((a) => a.filter((x) => x.id !== id)), tono === 'error' ? 7000 : 4000)
  }, [])

  return (
    <ContextoAvisos.Provider value={avisar}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[70] flex w-[min(92vw,380px)] flex-col gap-2" aria-live="polite">
        {avisos.map((a) => (
          <div key={a.id}
            className={`pointer-events-auto flex items-start gap-2.5 rounded-lg px-4 py-3 text-sm shadow-lg ring-1 ${
              a.tono === 'error' ? 'bg-[#fbeeec] text-vino ring-vino/25' : 'bg-noche text-papel ring-black/10'
            }`}>
            <Icono nombre={a.tono === 'error' ? 'alerta' : 'check'} className="mt-0.5 size-4 shrink-0" />
            <span>{a.texto}</span>
          </div>
        ))}
      </div>
    </ContextoAvisos.Provider>
  )
}

/* ───────────── Confirmación (reemplaza window.confirm) ───────────── */

export function ProveedorConfirmacion({ children }) {
  const [pedido, setPedido] = useState(null)

  const confirmar = useCallback(
    (opciones) => new Promise((resolver) => setPedido({ ...opciones, resolver })),
    [],
  )

  function cerrar(valor) {
    pedido?.resolver(valor)
    setPedido(null)
  }

  useEffect(() => {
    if (!pedido) return
    const alTeclear = (e) => e.key === 'Escape' && cerrar(false)
    window.addEventListener('keydown', alTeclear)
    return () => window.removeEventListener('keydown', alTeclear)
  })

  return (
    <ContextoConfirmar.Provider value={confirmar}>
      {children}
      {pedido && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-noche/50 p-4 backdrop-blur-[2px]"
          onMouseDown={() => cerrar(false)}>
          <div role="alertdialog" aria-modal="true" aria-labelledby="confirmar-titulo"
            className="w-full max-w-md rounded-2xl bg-papel p-6 shadow-2xl ring-1 ring-linea"
            onMouseDown={(e) => e.stopPropagation()}>
            <h2 id="confirmar-titulo" className="font-display text-2xl leading-tight text-tinta">{pedido.titulo}</h2>
            {pedido.texto && <div className="mt-2 space-y-2 text-sm leading-relaxed text-tinta-suave">{pedido.texto}</div>}
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Boton onClick={() => cerrar(false)}>Cancelar</Boton>
              <Boton variante={pedido.variante || 'primario'} onClick={() => cerrar(true)} autoFocus>
                {pedido.accion || 'Confirmar'}
              </Boton>
            </div>
          </div>
        </div>
      )}
    </ContextoConfirmar.Provider>
  )
}
