import { useState, useEffect } from 'react'

const API_BASE = 'https://astrea-api-production.up.railway.app/api/v1'

/**
 * Hook que trae los datos de la carta natal desde el endpoint /carta-natal/data.
 * Lee los parámetros desde la URL (nombre, fecha_nacimiento, ciudad, pais) y
 * los traduce al nombre exacto que espera el backend (fecha_hora_local) solo
 * al armar el body de la petición.
 */
export function useCartaNatal() {
  const [datos, setDatos] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
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

    async function cargar() {
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

    cargar()
  }, [])

  return { datos, cargando, error }
}