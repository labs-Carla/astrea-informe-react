import { useState, useEffect } from 'react'

const API_BASE = 'https://astrea-api-production.up.railway.app/api/v1'

function Seccion({ titulo, texto }) {
  if (!texto) return null
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-[#8B6F47] mb-1">{titulo}</div>
      <p>{texto}</p>
    </div>
  )
}

/**
 * Botones de accion y contenido de cada una de las 3 llamadas a Claude.
 * Cada bloque muestra su propio contenido (si existe) junto con el boton
 * para generarlo o regenerarlo, en vez de agrupar todos los botones al final.
 */
function BloqueGeneracion({ titulo, existe, contenido, generando, onGenerar, textoBotonGenerar, textoBotonRegenerar }) {
  return (
    <div className="bg-[#EDE6D3] rounded-lg p-5 mb-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-serif text-lg text-[#2B2620]">{titulo}</h2>
        <button
          onClick={onGenerar}
          disabled={generando}
          className="text-xs border border-[#8B6F47] text-[#8B6F47] rounded-lg px-3 py-1.5 font-medium disabled:opacity-50 whitespace-nowrap"
        >
          {generando ? 'Generando...' : existe ? textoBotonRegenerar : textoBotonGenerar}
        </button>
      </div>

      {existe ? (
        <details>
          <summary className="cursor-pointer text-xs uppercase tracking-wide text-[#8B6F47]">
            Ver contenido
          </summary>
          <div className="mt-4 space-y-4 text-sm text-[#2B2620] max-h-[500px] overflow-y-auto">
            {contenido}
          </div>
        </details>
      ) : (
        <p className="text-sm text-[#5C5346] italic">Aún no generado.</p>
      )}
    </div>
  )
}

/**
 * Detalle de una carta pendiente: muestra el contenido completo de las
 * 3 llamadas a Claude (interpretacion completa, areas de vida, transitos),
 * cada una con su propio boton de generar/regenerar, y finalmente aprobar
 * el envio (genera el token de acceso).
 */
function DetalleCarta({ claveAdmin, cartaId, onVolver }) {
  const [detalle, setDetalle] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [genero, setGenero] = useState('')
  const [accionEnCurso, setAccionEnCurso] = useState(null)
  const [mensajeAccion, setMensajeAccion] = useState(null)
  const [linkAprobado, setLinkAprobado] = useState(null)

  useEffect(() => {
    cargarDetalle()
  }, [])

  async function cargarDetalle() {
    setCargando(true)
    setError(null)

    try {
      const respuesta = await fetch(`${API_BASE}/admin/carta/${cartaId}`, {
        headers: { 'X-Admin-Secret': claveAdmin },
      })

      if (respuesta.status === 409) {
        setDetalle({ sinInterpretacion: true })
        setCargando(false)
        return
      }

      if (!respuesta.ok) throw new Error('No se pudo cargar el detalle.')

      const datos = await respuesta.json()
      setDetalle(datos)
      if (datos.genero) setGenero(datos.genero)
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }

  async function llamarAccion(endpoint, body = {}) {
    setAccionEnCurso(endpoint)
    setMensajeAccion(null)

    try {
      const respuesta = await fetch(`${API_BASE}/admin/${endpoint}/${cartaId}`, {
        method: 'POST',
        headers: {
          'X-Admin-Secret': claveAdmin,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      const resultado = await respuesta.json()

      if (!respuesta.ok) {
        setMensajeAccion(`Error: ${resultado.detail || 'algo salió mal'}`)
        return
      }

      if (endpoint === 'aprobar') {
        setLinkAprobado(resultado.link)
      } else {
        setMensajeAccion(resultado.mensaje || resultado.status)
        cargarDetalle()
      }
    } catch (err) {
      setMensajeAccion('Error de conexión.')
    } finally {
      setAccionEnCurso(null)
    }
  }

  if (cargando) return <div className="p-6 text-[#5C5346]">Cargando...</div>
  if (error) return <div className="p-6 text-red-700">{error}</div>

  const tieneErrorValidacion = Boolean(detalle.interpretacion?._validation_error)
  const sinInterpretacion = detalle.sinInterpretacion || tieneErrorValidacion

  const nombresPlanetas = [
    'sol', 'luna', 'mercurio', 'venus', 'marte', 'jupiter',
    'saturno', 'urano', 'neptuno', 'pluton', 'nodo_norte', 'quiron',
    'ascendente', 'medio_cielo',
  ]

  if (sinInterpretacion) {
    return (
      <div className="min-h-screen bg-[#F7F3E9] px-6 py-8 max-w-2xl mx-auto">
        <button onClick={onVolver} className="text-[#8B6F47] mb-4 text-sm">
          ← Volver a la lista
        </button>

        <h1 className="font-serif text-2xl text-[#2B2620] mb-6">Carta #{cartaId}</h1>

        <div className="bg-[#EDE6D3] rounded-lg p-5 mb-4">
          <p className="text-[#5C5346] mb-4">
            {tieneErrorValidacion
              ? 'La interpretación generada tuvo un error de formato. Puedes regenerarla.'
              : 'Esta carta aún no tiene interpretación completa generada.'}
          </p>

          <label className="block text-xs uppercase tracking-wide text-[#8B6F47] mb-1">
            Género (para concordancia gramatical)
          </label>
          <select
            value={genero}
            onChange={(e) => setGenero(e.target.value)}
            className="w-full border border-[#C4B8A0] rounded-lg px-3 py-2 mb-4"
          >
            <option value="">No especificar</option>
            <option value="masculino">Masculino</option>
            <option value="femenino">Femenino</option>
          </select>

          <button
            onClick={() =>
              llamarAccion('generar-interpretacion', {
                genero: genero || null,
                forzar: tieneErrorValidacion,
              })
            }
            disabled={accionEnCurso === 'generar-interpretacion'}
            className="w-full bg-[#2B2620] text-[#F7F3E9] rounded-lg py-3 font-medium disabled:opacity-50"
          >
            {accionEnCurso === 'generar-interpretacion'
              ? 'Generando (15-30 seg)...'
              : 'Generar interpretación completa'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F7F3E9] px-6 py-8 max-w-2xl mx-auto">
      <button onClick={onVolver} className="text-[#8B6F47] mb-4 text-sm">
        ← Volver a la lista
      </button>

      <h1 className="font-serif text-2xl text-[#2B2620] mb-2">Carta #{cartaId}</h1>

      <div className="mb-4">
        <label className="block text-xs uppercase tracking-wide text-[#8B6F47] mb-1">
          Género (aplica a las 3 generaciones)
        </label>
        <select
          value={genero}
          onChange={(e) => setGenero(e.target.value)}
          className="w-full border border-[#C4B8A0] rounded-lg px-3 py-2"
        >
          <option value="">No especificar</option>
          <option value="masculino">Masculino</option>
          <option value="femenino">Femenino</option>
        </select>
      </div>

      <BloqueGeneracion
        titulo="Interpretación completa"
        existe={true}
        generando={accionEnCurso === 'generar-interpretacion'}
        onGenerar={() =>
          llamarAccion('generar-interpretacion', { genero: genero || null, forzar: true })
        }
        textoBotonGenerar="Generar"
        textoBotonRegenerar="Regenerar"
        contenido={
          <>
            <Seccion titulo="Esencia" texto={detalle.interpretacion?.carta_en_una_mirada?.esencia} />
            <Seccion titulo="Visión general" texto={detalle.interpretacion?.overview} />
            <Seccion titulo="Elementos y dignidades" texto={detalle.interpretacion?.lectura_elementos_dignidades} />
            {nombresPlanetas.map((planeta) => (
              <Seccion key={planeta} titulo={planeta} texto={detalle.interpretacion?.[planeta]} />
            ))}
            <Seccion titulo="Conclusión" texto={detalle.interpretacion?.conclusion} />
            <Seccion titulo="Frase de cierre" texto={detalle.interpretacion?.frase_de_cierre} />
          </>
        }
      />

      <BloqueGeneracion
        titulo="Áreas de vida"
        existe={Boolean(detalle.areas_de_vida)}
        generando={accionEnCurso === 'generar-areas-de-vida'}
        onGenerar={() =>
          llamarAccion('generar-areas-de-vida', { genero: genero || null, forzar: true })
        }
        textoBotonGenerar="Generar"
        textoBotonRegenerar="Regenerar"
        contenido={
          detalle.areas_de_vida && (
            <>
              <Seccion titulo="Vocación" texto={detalle.areas_de_vida.vocacion} />
              <Seccion titulo="Dinero" texto={detalle.areas_de_vida.dinero} />
              <Seccion titulo="Amor" texto={detalle.areas_de_vida.amor} />
              <Seccion titulo="Herida y don" texto={detalle.areas_de_vida.herida_y_don} />
            </>
          )
        }
      />

      <BloqueGeneracion
        titulo="Tránsitos"
        existe={Boolean(detalle.transitos)}
        generando={accionEnCurso === 'generar-transitos'}
        onGenerar={() =>
          llamarAccion('generar-transitos', { genero: genero || null, forzar: true })
        }
        textoBotonGenerar="Generar"
        textoBotonRegenerar="Regenerar"
        contenido={
          detalle.transitos && (
            <>
              <Seccion titulo="Clima energético" texto={detalle.transitos.clima_energetico} />
              <Seccion titulo="Oportunidades" texto={detalle.transitos.oportunidades} />
              <Seccion titulo="Retos" texto={detalle.transitos.retos} />
              <Seccion titulo="Consejo" texto={detalle.transitos.consejo} />
            </>
          )
        }
      />

      {mensajeAccion && (
        <p className="text-sm text-[#5C5346] mb-4">{mensajeAccion}</p>
      )}

      {linkAprobado ? (
        <div className="bg-[#EDE6D3] rounded-lg p-5">
          <p className="text-[#2B2620] mb-2">✓ Aprobado. Link listo para enviar:</p>
          <a
            href={linkAprobado}
            target="_blank"
            rel="noreferrer"
            className="text-[#3D5A6C] underline break-all text-sm"
          >
            {linkAprobado}
          </a>
        </div>
      ) : (
        <button
          onClick={() => llamarAccion('aprobar', {})}
          disabled={accionEnCurso === 'aprobar'}
          className="w-full bg-[#2B2620] text-[#F7F3E9] rounded-lg py-3 font-medium disabled:opacity-50"
        >
          {accionEnCurso === 'aprobar' ? 'Aprobando...' : 'Aprobar y generar link'}
        </button>
      )}
    </div>
  )
}

export default DetalleCarta