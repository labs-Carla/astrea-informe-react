import { useCallback, useEffect, useState } from 'react'
import { Boton, Esqueleto, Icono, Insignia, Tarjeta } from './ui'
import { useAviso, useConfirmar } from './contextos'
import { fechaHora } from './formato'

/**
 * Horóscopo semanal del blog (astrea-API /admin/horoscopo-semanal). Cada sábado
 * se genera solo el borrador del lunes siguiente (OpenAI, a partir de los
 * tránsitos calculados); aquí se revisa, se corrige y se publica en
 * astrea-charts.site/blog. Mientras no se publique, el blog muestra la semana anterior.
 */

const BLOG = 'https://astrea-charts.site/blog/horoscopo-semanal'
const ESTADO = {
  borrador: { etiqueta: 'Borrador', tono: 'oro' },
  publicado: { etiqueta: 'Publicado', tono: 'verde' },
}
const NOMBRE = {
  Aries: 'Aries', Tauro: 'Tauro', Geminis: 'Géminis', Cancer: 'Cáncer', Leo: 'Leo', Virgo: 'Virgo', Libra: 'Libra',
  Escorpio: 'Escorpio', Sagitario: 'Sagitario', Capricornio: 'Capricornio', Acuario: 'Acuario', Piscis: 'Piscis',
}
const semanaLarga = (iso) => {
  const lunes = new Date(`${iso}T12:00:00`)
  const domingo = new Date(lunes.getTime() + 6 * 86400000)
  const f = (d) => d.toLocaleDateString('es', { day: 'numeric', month: 'long' })
  return `${f(lunes)} al ${f(domingo)}`
}
const palabras = (t) => (t.trim() ? t.trim().split(/\s+/).length : 0)

function Revision({ api, semana, onCerrar, onCambio }) {
  const avisar = useAviso()
  const [d, setD] = useState(null)
  const [c, setC] = useState(null)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    let vigente = true
    api.get(`/admin/horoscopo-semanal/${semana}`).then((r) => { if (vigente) { setD(r); setC(r.contenido) } })
      .catch((e) => avisar(e.message, 'error'))
    return () => { vigente = false }
  }, [api, semana, avisar])

  const campo = 'mt-1 w-full rounded-lg bg-papel px-3 py-2 text-sm ring-1 ring-linea outline-none focus:ring-2 focus:ring-oro'
  const cambiar = (k) => (e) => setC((x) => ({ ...x, [k]: e.target.value }))
  const cambiarSigno = (i, k) => (e) => setC((x) => ({ ...x, signos: x.signos.map((s, j) => (j === i ? { ...s, [k]: e.target.value } : s)) }))

  async function guardar() {
    setGuardando(true)
    try {
      const r = await api.put(`/admin/horoscopo-semanal/${semana}`, c)
      setD(r)
      setC(r.contenido)
      avisar(r.estado === 'publicado' ? 'Cambios guardados y publicados.' : 'Cambios guardados en el borrador.')
      onCambio()
    } catch (e) {
      avisar(e.message, 'error')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-noche/40" onMouseDown={onCerrar}>
      <section className="flex h-full w-full max-w-5xl flex-col bg-marfil shadow-2xl" onMouseDown={(e) => e.stopPropagation()}
        aria-label="Revisión del horóscopo semanal">
        <header className="flex items-center gap-3 border-b border-linea px-6 py-4">
          <div className="flex-1">
            <h2 className="font-display text-2xl">Semana del {semanaLarga(semana)}</h2>
            {d && <p className="text-xs text-tinta-tenue">{d.modelo} · prompt {d.version_prompt} · generado {fechaHora(d.fecha_generacion)}
              {d.costo_usd != null && ` · USD ${d.costo_usd.toFixed(3)}`}</p>}
          </div>
          <button type="button" onClick={onCerrar} aria-label="Cerrar" className="rounded-md p-1.5 hover:bg-pergamino"><Icono nombre="cerrar" /></button>
        </header>
        {!c ? <div className="p-6"><Esqueleto className="h-40" /></div> : (
          <div className="grid min-h-0 flex-1 gap-6 overflow-y-auto p-6 lg:grid-cols-[1fr_300px]">
            <div className="min-w-0 space-y-5">
              <label className="block text-sm font-medium">Título del post
                <input className={campo} value={c.titulo} onChange={cambiar('titulo')} maxLength={100} />
              </label>
              <label className="block text-sm font-medium">Resumen (Google y redes)
                <textarea className={`${campo} min-h-[64px]`} value={c.resumen} onChange={cambiar('resumen')} maxLength={200} />
              </label>
              <label className="block text-sm font-medium">El cielo de la semana <span className="font-normal text-tinta-tenue">· {palabras(c.cielo_de_la_semana)} palabras</span>
                <textarea className={`${campo} min-h-[180px] leading-relaxed`} value={c.cielo_de_la_semana} onChange={cambiar('cielo_de_la_semana')} />
              </label>
              {c.signos.map((s, i) => (
                <fieldset key={s.signo} className="space-y-2 rounded-xl bg-papel/60 p-4 ring-1 ring-linea">
                  <legend className="px-1 font-display text-lg">{NOMBRE[s.signo]}</legend>
                  <input className={campo} value={s.titulo} onChange={cambiarSigno(i, 'titulo')} maxLength={90} aria-label={`Título de ${NOMBRE[s.signo]}`} />
                  <textarea className={`${campo} min-h-[220px] leading-relaxed`} value={s.texto} onChange={cambiarSigno(i, 'texto')}
                    aria-label={`Texto de ${NOMBRE[s.signo]}`} />
                  <p className="text-xs text-tinta-tenue">{palabras(s.texto)} palabras · deja una línea en blanco entre párrafos</p>
                  <input className={campo} value={s.clave} onChange={cambiarSigno(i, 'clave')} maxLength={160} aria-label={`Clave de ${NOMBRE[s.signo]}`} />
                  <input className={campo} value={s.pregunta} onChange={cambiarSigno(i, 'pregunta')} maxLength={200} aria-label={`Pregunta de ${NOMBRE[s.signo]}`} />
                </fieldset>
              ))}
            </div>
            <aside className="space-y-5 text-sm lg:sticky lg:top-0 lg:self-start">
              <div>
                <h3 className="font-medium">Avisos para revisar</h3>
                {d.avisos.length === 0 ? <p className="mt-1 text-tinta-tenue">Sin avisos.</p> : (
                  <ul className="mt-1 space-y-1">{d.avisos.map((a) => <li key={a} className="flex gap-1.5 text-ambar"><Icono nombre="alerta" className="mt-0.5 size-3.5 shrink-0" />{a}</li>)}</ul>
                )}
              </div>
              <div>
                <h3 className="font-medium">Lo que calculó Swiss Ephemeris</h3>
                <p className="mt-1 text-xs text-tinta-tenue">El texto solo puede afirmar esto (hora de Colombia).</p>
                <ul className="mt-2 space-y-1.5">{d.cielo.eventos.length === 0 ? <li className="text-tinta-tenue">Sin eventos exactos esta semana.</li>
                  : d.cielo.eventos.map((e) => <li key={e} className="border-l-2 border-oro/40 pl-2">{e}</li>)}</ul>
              </div>
            </aside>
          </div>
        )}
        <footer className="flex justify-end gap-2 border-t border-linea px-6 py-4">
          <Boton onClick={onCerrar}>Cerrar</Boton>
          <Boton variante="primario" cargando={guardando} disabled={!c} onClick={guardar}>Guardar cambios</Boton>
        </footer>
      </section>
    </div>
  )
}

function HoroscopoSemanal({ api }) {
  const avisar = useAviso()
  const confirmar = useConfirmar()
  const [datos, setDatos] = useState(null)
  const [enCurso, setEnCurso] = useState(null)
  const [abierta, setAbierta] = useState(null)

  const cargar = useCallback(async () => {
    try {
      setDatos(await api.get('/admin/horoscopo-semanal'))
    } catch (e) {
      avisar(`No se pudo cargar el horóscopo semanal: ${e.message}`, 'error')
    }
  }, [api, avisar])

  useEffect(() => {
    let vigente = true
    api.get('/admin/horoscopo-semanal').then((d) => { if (vigente) setDatos(d) }).catch(() => {})
    return () => { vigente = false }
  }, [api])

  async function accion(clave, fn, exito) {
    setEnCurso(clave)
    try {
      const r = await fn()
      if (r?.status === 'error') avisar(r.mensaje, 'error')
      else avisar(typeof exito === 'function' ? exito(r) : exito)
      await cargar()
    } catch (e) {
      avisar(e.message, 'error')
    } finally {
      setEnCurso(null)
    }
  }

  async function generar(semana, forzar = false) {
    const ok = await confirmar({
      titulo: forzar ? '¿Escribir de nuevo este borrador?' : '¿Generar el borrador?',
      texto: <p>Se calcula el cielo de la semana del <b>{semanaLarga(semana)}</b> y OpenAI escribe los 12 signos (una llamada, unos centavos). Tarda alrededor de un minuto.{forzar && ' Los cambios que hiciste al borrador se pierden.'}</p>,
      accion: forzar ? 'Escribir de nuevo' : 'Generar',
    })
    if (ok) accion(`generar:${semana}`, () => api.post('/admin/horoscopo-semanal/generar', { semana, forzar }),
      (r) => (r.status === 'ya_existia' ? 'Ese borrador ya existía.' : 'Borrador listo para revisar.'))
  }
  async function publicar(s) {
    const ok = await confirmar({
      titulo: '¿Publicar en el blog?',
      texto: <p>«<b>{s.titulo}</b>» queda visible en astrea-charts.site/blog{s.avisos.length > 0 && <> con <b>{s.avisos.length} aviso(s)</b> sin revisar</>}.</p>,
      accion: 'Publicar',
    })
    if (ok) accion(`publicar:${s.semana}`, () => api.post(`/admin/horoscopo-semanal/${s.semana}/publicar`), 'Publicado en el blog.')
  }
  const despublicar = (s) => accion(`despublicar:${s.semana}`, () => api.post(`/admin/horoscopo-semanal/${s.semana}/despublicar`),
    'Se quitó del blog: volvió a borrador.')

  const proximo = datos?.proximo_lunes
  const tieneProximo = datos?.semanas.some((s) => s.semana === proximo)

  return (
    <Tarjeta>
      <div className="flex flex-wrap items-center gap-3 border-b border-linea px-5 py-4">
        <div className="flex-1">
          <h2 className="font-display text-xl text-tinta">Horóscopo semanal</h2>
          <p className="text-sm text-tinta-tenue">El borrador del lunes se genera solo cada sábado a las 18:00. Revísalo y publícalo aquí.</p>
        </div>
        {proximo && !tieneProximo && (
          <Boton variante="primario" icono="estrella" cargando={enCurso === `generar:${proximo}`} onClick={() => generar(proximo)}>
            Generar la semana del {semanaLarga(proximo).split(' al ')[0]}
          </Boton>
        )}
      </div>
      {!datos ? <div className="p-5"><Esqueleto className="h-16" /></div> : datos.semanas.length === 0 ? (
        <p className="px-5 py-6 text-sm text-tinta-tenue">Todavía no hay semanas. Genera la primera: queda como borrador hasta que la publiques.</p>
      ) : (
        <ul className="divide-y divide-linea">
          {datos.semanas.map((s) => {
            const e = ESTADO[s.estado] || ESTADO.borrador
            return (
              <li key={s.semana} className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Insignia tono={e.tono}>{e.etiqueta}</Insignia>
                    <span className="truncate font-medium">{s.titulo}</span>
                    {s.avisos.length > 0 && <Insignia tono="ambar">{s.avisos.length} aviso{s.avisos.length > 1 ? 's' : ''}</Insignia>}
                  </div>
                  <p className="mt-1 text-xs text-tinta-tenue">
                    Semana del {semanaLarga(s.semana)} · {s.fecha_publicacion ? `publicada ${fechaHora(s.fecha_publicacion)}` : `generada ${fechaHora(s.fecha_generacion)}`}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Boton tamano="sm" onClick={() => setAbierta(s.semana)}>Revisar y editar</Boton>
                  {s.estado === 'borrador' && (
                    <>
                      <Boton tamano="sm" cargando={enCurso === `generar:${s.semana}`} onClick={() => generar(s.semana, true)}>Escribir de nuevo</Boton>
                      <Boton tamano="sm" variante="oro" icono="check" cargando={enCurso === `publicar:${s.semana}`} onClick={() => publicar(s)}>Publicar</Boton>
                    </>
                  )}
                  {s.estado === 'publicado' && (
                    <>
                      <a className="inline-flex items-center gap-1 text-sm text-azul hover:underline" href={`${BLOG}/${s.semana}`} target="_blank" rel="noreferrer">
                        Ver en el blog <Icono nombre="externo" className="size-3.5" />
                      </a>
                      <Boton tamano="sm" cargando={enCurso === `despublicar:${s.semana}`} onClick={() => despublicar(s)}>Quitar del blog</Boton>
                    </>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
      {abierta && <Revision api={api} semana={abierta} onCerrar={() => setAbierta(null)} onCambio={cargar} />}
    </Tarjeta>
  )
}

export default HoroscopoSemanal
