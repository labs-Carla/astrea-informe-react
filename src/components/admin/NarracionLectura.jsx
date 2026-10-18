import { useCallback, useEffect, useState } from 'react'
import { Boton, Insignia } from './ui'
import { useAviso, useConfirmar } from './contextos'

const CADA_MS = 5000

/**
 * Narración (audio) de una lectura aprobada: capítulos listos, botón para
 * generarlos y progreso mientras se generan (en segundo plano, en el backend).
 * Solo se generan los capítulos que faltan: lo ya narrado no se vuelve a pagar.
 */
function NarracionLectura({ api, cartaId }) {
  const avisar = useAviso()
  const confirmar = useConfirmar()
  const [estado, setEstado] = useState(null)
  const [error, setError] = useState(null)
  const [pidiendo, setPidiendo] = useState(false)

  /** Estado de la narración; nunca lanza (el error se muestra en la ficha). */
  const obtener = useCallback(async () => {
    try {
      return { datos: await api.get(`/admin/audio/${cartaId}`) }
    } catch (err) {
      return { error: err.message }
    }
  }, [api, cartaId])

  const aplicar = useCallback(({ datos, error: fallo }) => {
    setError(fallo || null)
    if (datos) setEstado(datos)
  }, [])

  useEffect(() => {
    let vigente = true
    obtener().then((r) => { if (vigente) aplicar(r) })
    return () => { vigente = false }
  }, [obtener, aplicar])

  // Mientras se genera, se consulta el progreso cada 5 s.
  useEffect(() => {
    if (!estado?.generando) return undefined
    const id = window.setInterval(() => obtener().then(aplicar), CADA_MS)
    return () => window.clearInterval(id)
  }, [estado?.generando, obtener, aplicar])

  async function generar() {
    const faltan = estado.total - estado.listos
    const usd = Math.max(0.01, (estado.caracteres_pendientes / 36000) * 0.55).toFixed(2)
    const ok = await confirmar({
      titulo: '¿Generar la narración?',
      texto: <p>Se narran <b>{faltan} capítulos</b> con la voz de Astrea (OpenAI, unos USD {usd}). Tarda unos minutos y queda guardada: no se vuelve a pagar.</p>,
      accion: 'Generar audio',
      variante: 'oro',
    })
    if (!ok) return
    setPidiendo(true)
    try {
      const r = await api.post(`/admin/generar-audio/${cartaId}`, {})
      avisar(r.mensaje || 'Generando la narración.')
      setEstado(r)
    } catch (err) {
      avisar(err.message, 'error')
    } finally {
      setPidiendo(false)
    }
  }

  if (error) return <p className="text-sm text-tinta-tenue">Narración: {error}</p>
  if (!estado) return null
  const completa = estado.total > 0 && estado.listos === estado.total
  const porcentaje = estado.total ? Math.round((estado.listos / estado.total) * 100) : 0

  return (
    <section aria-label="Narración de la lectura" className="rounded-xl bg-papel p-4 ring-1 ring-linea">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="font-romana text-[11px] tracking-[.18em] text-oro">NARRACIÓN (AUDIO)</div>
          <div className="mt-1 text-sm text-tinta-suave">
            {completa ? 'Lista: la persona puede escucharla en Astrea Reader.'
              : estado.generando ? `Generando… ${estado.listos} de ${estado.total} capítulos.`
              : `${estado.listos} de ${estado.total} capítulos narrados.`}
          </div>
        </div>
        {completa ? <Insignia tono="verde" punto>Completa</Insignia> : (
          <Boton variante="borde" tamano="sm" cargando={pidiendo || estado.generando} disabled={estado.generando} onClick={generar}>
            {estado.generando ? 'Generando…' : estado.listos ? 'Completar audio' : 'Generar audio'}
          </Boton>
        )}
      </div>
      {!completa && (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-pergamino" role="progressbar" aria-valuenow={porcentaje} aria-valuemin={0} aria-valuemax={100}
             aria-label="Capítulos narrados">
          <div className="h-full bg-oro transition-all" style={{ width: `${porcentaje}%` }} />
        </div>
      )}
    </section>
  )
}

export default NarracionLectura
