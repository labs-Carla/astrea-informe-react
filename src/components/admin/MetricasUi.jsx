import { Icono } from './ui'

/** Piezas compartidas por las pestañas de Métricas. */

export function Cifra({ etiqueta, valor, ayuda }) {
  return (
    <div title={ayuda} className="rounded-lg bg-papel px-4 py-3 ring-1 ring-linea">
      <div className="font-display text-3xl leading-none text-tinta tabular-nums">{valor ?? '—'}</div>
      <div className="mt-1 text-xs text-tinta-suave">{etiqueta}</div>
    </div>
  )
}

export function Aviso({ children }) {
  return (
    <div className="flex items-start gap-2 rounded-lg bg-pergamino px-4 py-3 text-sm text-tinta-suave ring-1 ring-linea">
      <Icono nombre="alerta" className="mt-0.5 size-4 shrink-0" />
      <span>{children}</span>
    </div>
  )
}
