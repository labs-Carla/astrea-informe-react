const ITEMS_NAV = [
  { id: 'inicio', label: 'Inicio', icono: '⌂' },
  { id: 'capitulos', label: 'Capítulos', icono: '☰' },
  { id: 'planetas', label: 'Planetas', icono: '☉' },
  { id: 'casas', label: 'Casas', icono: '▢' },
  { id: 'mas', label: 'Más', icono: '⋯' },
]

function BarraInferior({ vistaActual, onNavegar }) {
  return (
    <nav className="shrink-0 bg-[#F7F3E9] border-t border-[#C4B8A0] flex justify-around py-2">
      {ITEMS_NAV.map((item) => {
        const activo = vistaActual === item.id
        return (
          <button
            key={item.id}
            onClick={() => onNavegar(item.id)}
            className={`flex flex-col items-center gap-1 px-3 py-1 text-xs ${
              activo ? 'text-[#3D5A6C]' : 'text-[#8B6F47]'
            }`}
          >
            <span className="text-lg">{item.icono}</span>
            {item.label}
          </button>
        )
      })}
    </nav>
  )
}

export default BarraInferior