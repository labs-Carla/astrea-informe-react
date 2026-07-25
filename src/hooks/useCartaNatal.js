import { useState, useEffect } from 'react'

const API_BASE = 'https://astrea-api-production.up.railway.app/api/v1'

/**
 * Hook que trae los datos de la carta natal. Soporta dos modos de acceso:
 * 1. Via token en la URL (/r/{token}) — usado por el flujo real de entrega
 *    post-compra, sin necesitar login.
 * 2. Via query params (?nombre=...&fecha_nacimiento=...&ciudad=...&pais=...)
 *    — usado para pruebas internas antes de tener un token real.
 */
export function useCartaNatal() {
  const [datos, setDatos] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const path = window.location.pathname
    const matchToken = path.match(/^\/r\/(.+)$/)

    async function cargarPorToken(token) {
      try {
        const respuesta = await fetch(`${API_BASE}/carta-natal/token/${token}`)

        if (!respuesta.ok) {
          const cuerpoError = await respuesta.json()
          throw new Error(cuerpoError.detail || 'No se pudo cargar tu lectura.')
        }

        const json = await respuesta.json()
        setDatos(json)
      } catch (err) {
        setError(err.message)
      } finally {
        setCargando(false)
      }
    }

    async function cargarPorQueryParams() {
      const params = new URLSearchParams(window.location.search)
      const nombre = params.get('nombre') || ''
      const fecha_nacimiento = params.get('fecha_nacimiento') || ''
      const ciudad = params.get('ciudad') || ''
      const pais = params.get('pais') || ''

      if (!fecha_nacimiento || !ciudad || !pais) {
        setError('Falta información para mostrar tu lectura. Verifica el enlace recibido.')
        setCargando(false)
        return
      }

      try {
        const respuesta = await fetch(`${API_BASE}/carta-natal/data`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nombre,
            fecha_hora_local: fecha_nacimiento,
            ciudad,
            pais,
          }),
        })

        if (!respuesta.ok) {
          const cuerpoError = await respuesta.json()
          throw new Error(cuerpoError.detail || 'No se pudo cargar tu lectura.')
        }

        const json = await respuesta.json()
        setDatos(json)
      } catch (err) {
        setError(err.message)
      } finally {
        setCargando(false)
      }
    }

    if (matchToken) {
      cargarPorToken(matchToken[1])
    } else {
      cargarPorQueryParams()
    }
  }, [])

  return { datos, cargando, error }
}