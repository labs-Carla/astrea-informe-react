import { useEffect, useMemo, useState } from 'react'
import { Boton, BotonCopiar, Esqueleto, Insignia, Tarjeta, Vacio } from './ui'
import { useAviso, useConfirmar } from './contextos'
import { coincide, fechaHora, haceCuanto } from './formato'

/**
 * Personas Beta (astrea-API /admin/beta, desde 2026-10-19: Beta = Astrea Plus gratis).
 * Quien está en la lista entra a Astrea aunque esté en pausa y, al entrar, recibe
 * Astrea Plus gratis hasta el fin de la beta, con su precio de fundador guardado.
 * Quitarla le cierra el acceso de inmediato y su Plus beta se vence en su próxima visita.
 */

const campo = 'mt-1 w-full rounded-lg bg-papel px-3 py-2 text-sm ring-1 ring-linea outline-none focus:ring-2 focus:ring-oro'
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const fechaDia = (iso) => new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
const usd = (n) => `USD ${Number(n).toLocaleString('es', { minimumFractionDigits: 2 })}/mes`

function Beta({ api, busqueda, recarga }) {
  const avisar = useAviso()
  const confirmar = useConfirmar()
  const [datos, setDatos] = useState(null)
  const [error, setError] = useState(null)
  const [version, setVersion] = useState(0)
  const [email, setEmail] = useState('')
  const [nota, setNota] = useState('')
  const [enCurso, setEnCurso] = useState(null)

  useEffect(() => {
    let vigente = true
    api.get('/admin/beta')
      .then((d) => { if (vigente) { setDatos(d); setError(null) } })
      .catch((e) => { if (vigente) setError(e.message) })
    return () => { vigente = false }
  }, [api, recarga, version])

  async function agregar(e) {
    e.preventDefault()
    const correo = email.trim()
    if (!EMAIL.test(correo)) { avisar('Revisa el correo: no parece válido.', 'error'); return }
    setEnCurso('agregar')
    try {
      const r = await api.post('/admin/beta', { email: correo, nota: nota.trim() || null })
      avisar(`${r.email} ya es Beta: recibe Astrea Plus al entrar a Astrea.`)
      setEmail('')
      setNota('')
    } catch (err) {
      avisar(err.message, 'error')
    } finally {
      setEnCurso(null)
      setVersion((v) => v + 1)
    }
  }

  async function quitar(a) {
    const ok = await confirmar({
      titulo: '¿Quitar de la Beta?',
      texto: (
        <>
          <p><b>{a.email}</b> deja de entrar a Astrea mientras esté en pausa.</p>
          <p>Su Astrea Plus de la beta se vence en su próxima visita; sus conversaciones quedan guardadas.</p>
        </>
      ),
      accion: 'Quitar de la Beta', variante: 'peligro',
    })
    if (!ok) return
    setEnCurso(`quitar:${a.id}`)
    try {
      await api.borrar(`/admin/beta/${a.id}`)
      avisar(`${a.email} ya no es Beta.`)
    } catch (err) {
      avisar(err.message, 'error')
    } finally {
      setEnCurso(null)
      setVersion((v) => v + 1)
    }
  }

  const filas = useMemo(() => (datos?.accesos || [])
    .filter((a) => !busqueda || coincide(`${a.email} ${a.nota || ''}`, busqueda)), [datos, busqueda])

  if (error && !datos) return <p className="rounded-lg bg-[#fbeeec] px-4 py-3 text-sm text-vino ring-1 ring-vino/20">No se pudo cargar la lista Beta: {error}</p>

  return (
    <div className="space-y-5">
      <Tarjeta className="p-5">
        <form onSubmit={agregar} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <label className="block text-sm font-medium">Correo
            <input type="email" className={campo} value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="el mismo con el que compró o entrará" autoComplete="off" required />
          </label>
          <label className="block text-sm font-medium">Nota <span className="font-normal text-tinta-tenue">(opcional)</span>
            <input className={campo} value={nota} onChange={(e) => setNota(e.target.value)} maxLength={120} placeholder="Manuel, astrólogo" />
          </label>
          <Boton variante="primario" cargando={enCurso === 'agregar'} type="submit">Agregar a la Beta</Boton>
        </form>
        {datos && (
          <p className="mt-3 text-xs text-tinta-suave">
            Recibe <b>Astrea Plus gratis hasta el {fechaDia(datos.plus_hasta)}</b> al entrar a Astrea, con precio de fundador
            de <b>{usd(datos.precio_fundador_usd)}</b>. 7 días antes del fin le avisamos por correo para pasar a pago.
          </p>
        )}
      </Tarjeta>

      <Tarjeta>
        {!datos ? <div className="p-5"><Esqueleto className="h-20" /></div> : filas.length === 0 ? (
          <div className="p-8"><Vacio titulo={busqueda ? 'Nadie coincide' : 'Todavía no hay nadie en la Beta'}
            texto="Agrega el correo de quien quieras observar de cerca: entra con acceso completo y Astrea Plus gratis." /></div>
        ) : (
          <ul className="divide-y divide-linea">
            {filas.map((a) => (
              <li key={a.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Insignia tono="azul">Beta</Insignia>
                    <span className="font-medium">{a.email}</span>
                    <BotonCopiar texto={a.email} etiqueta="Copiar correo" />
                  </div>
                  <p className="text-xs text-tinta-tenue">
                    {a.nota && <span className="mr-3 text-tinta-suave">{a.nota}</span>}
                    <span title={fechaHora(a.fecha_creacion)}>agregada {haceCuanto(a.fecha_creacion)}</span>
                  </p>
                </div>
                <button type="button" onClick={() => quitar(a)} disabled={enCurso === `quitar:${a.id}`}
                  className="self-start text-xs text-tinta-tenue hover:text-vino hover:underline disabled:opacity-50 sm:self-center">
                  Quitar de la Beta
                </button>
              </li>
            ))}
          </ul>
        )}
      </Tarjeta>
    </div>
  )
}

export default Beta
