import { useEffect, useState } from 'react'
import { crearClienteAdmin } from './api'
import Escritorio from './Escritorio'
import { Boton, Icono, ProveedorAvisos, ProveedorConfirmacion } from './ui'

const FUENTES =
  'https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600&family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Inter:wght@400;500;600&display=swap'

/** Carga las fuentes del panel solo en /admin (el reporte del cliente no las necesita). */
function useFuentesPanel() {
  useEffect(() => {
    if (document.getElementById('fuentes-panel')) return
    const enlace = Object.assign(document.createElement('link'), { id: 'fuentes-panel', rel: 'stylesheet', href: FUENTES })
    document.head.appendChild(enlace)
    document.title = 'Astrea · Panel editorial'
  }, [])
}

/**
 * Punto de entrada del panel de administracion. Pide la clave de admin
 * una sola vez (guardada solo en memoria, se pierde al recargar la
 * pagina — no persiste en localStorage por seguridad), y la valida
 * contra el backend antes de mostrar el escritorio.
 */
function PanelAdmin() {
  useFuentesPanel()
  const [clave, setClave] = useState('')
  const [claveValidada, setClaveValidada] = useState(null)
  const [validando, setValidando] = useState(false)
  const [error, setError] = useState(null)

  async function validarClave(e) {
    e.preventDefault()
    setValidando(true)
    setError(null)
    try {
      await crearClienteAdmin(clave).get('/admin/pendientes')
      setClaveValidada(clave)
    } catch (err) {
      setError(err.status === 401 || err.status === 403 ? 'Clave incorrecta.' : err.message)
    } finally {
      setValidando(false)
    }
  }

  if (claveValidada) {
    return (
      <ProveedorAvisos>
        <ProveedorConfirmacion>
          <Escritorio clave={claveValidada} onSalir={() => { setClaveValidada(null); setClave('') }} />
        </ProveedorConfirmacion>
      </ProveedorAvisos>
    )
  }

  return (
    <div className="grid min-h-screen font-ui lg:grid-cols-[1.1fr_1fr]">
      <div className="relative hidden overflow-hidden bg-noche lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(201,169,110,.18),transparent_55%),radial-gradient(ellipse_at_80%_90%,rgba(201,169,110,.10),transparent_50%)]" />
        <div className="relative flex h-full flex-col justify-between p-12 text-papel">
          <div className="font-romana text-sm tracking-[.5em]">ASTREA</div>
          <div>
            <Icono nombre="estrella" className="mb-6 size-6 text-oro-claro" />
            <p className="max-w-md font-display text-5xl leading-[1.05]">El taller donde cada lectura se revisa antes de llegar a quien la pidió.</p>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-papel/60">Pagos, revisión, aprobación y entrega del PDF en un solo lugar.</p>
          </div>
          <div className="text-xs tracking-[.3em] text-papel/40">PANEL EDITORIAL</div>
        </div>
      </div>

      <div className="flex items-center justify-center bg-marfil px-6 py-16">
        <form onSubmit={validarClave} className="w-full max-w-sm">
          <div className="mb-10 font-romana text-sm tracking-[.5em] text-tinta lg:hidden">ASTREA</div>
          <h1 className="font-display text-4xl text-tinta">Entrar al panel</h1>
          <p className="mt-2 text-sm text-tinta-suave">Usa la clave de administrador. No se guarda en este navegador.</p>
          <label htmlFor="clave" className="mt-8 mb-1.5 block text-xs font-medium uppercase tracking-wider text-tinta-suave">Clave</label>
          <input
            id="clave"
            type="password"
            value={clave}
            onChange={(e) => setClave(e.target.value)}
            className="h-11 w-full rounded-lg bg-papel px-3.5 text-tinta ring-1 ring-linea-fuerte outline-none transition focus:ring-2 focus:ring-oro"
            autoFocus
            autoComplete="current-password"
          />
          {error && <p className="mt-2 text-sm text-vino">{error}</p>}
          <Boton type="submit" variante="primario" tamano="lg" cargando={validando} disabled={!clave} className="mt-5 w-full">
            {validando ? 'Verificando…' : 'Entrar'}
          </Boton>
        </form>
      </div>
    </div>
  )
}

export default PanelAdmin
