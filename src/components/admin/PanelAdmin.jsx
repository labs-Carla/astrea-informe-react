import { useState } from 'react'
import ListaPendientes from './ListaPendientes'

const API_BASE = 'https://astrea-api-production.up.railway.app/api/v1'

/**
 * Punto de entrada del panel de administracion. Pide la clave de admin
 * una sola vez (guardada solo en memoria, se pierde al recargar la
 * pagina — no persiste en localStorage por seguridad), y la valida
 * contra el backend antes de mostrar el resto del panel.
 */
function PanelAdmin() {
  const [clave, setClave] = useState('')
  const [claveValidada, setClaveValidada] = useState(null)
  const [validando, setValidando] = useState(false)
  const [error, setError] = useState(null)

  async function validarClave(e) {
    e.preventDefault()
    setValidando(true)
    setError(null)

    try {
      const respuesta = await fetch(`${API_BASE}/admin/pendientes`, {
        headers: { 'X-Admin-Secret': clave },
      })

      if (!respuesta.ok) {
        setError('Clave incorrecta.')
        setValidando(false)
        return
      }

      setClaveValidada(clave)
    } catch (err) {
      setError('No se pudo conectar con el servidor.')
    } finally {
      setValidando(false)
    }
  }

  if (!claveValidada) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F3E9] px-6">
        <form onSubmit={validarClave} className="w-full max-w-sm">
          <h1 className="font-serif text-2xl text-[#2B2620] mb-6 text-center">
            Panel Astrea
          </h1>
          <input
            type="password"
            value={clave}
            onChange={(e) => setClave(e.target.value)}
            placeholder="Clave de administrador"
            className="w-full border border-[#C4B8A0] rounded-lg px-4 py-3 mb-3"
            autoFocus
          />
          {error && <p className="text-red-700 text-sm mb-3">{error}</p>}
          <button
            type="submit"
            disabled={validando}
            className="w-full bg-[#2B2620] text-[#F7F3E9] rounded-lg py-3 font-medium disabled:opacity-50"
          >
            {validando ? 'Verificando...' : 'Entrar'}
          </button>
        </form>
      </div>
    )
  }

  return <ListaPendientes claveAdmin={claveValidada} />
}

export default PanelAdmin