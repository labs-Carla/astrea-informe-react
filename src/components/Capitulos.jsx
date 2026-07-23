/**
 * Índice de capítulos. Al tocar uno, llama a `onSeleccionar` con el id de la
 * vista correspondiente — App.jsx decide qué componente mostrar según ese id.
 */
const CAPITULOS = [
  { id: 'vision-general', numero: '01', titulo: 'Visión general', icono: '☼\uFE0E' },
  { id: 'elementos', numero: '02', titulo: 'Elementos y dignidades', icono: '≈\uFE0E' },
  { id: 'puntos-angulares', numero: '03', titulo: 'Puntos angulares', icono: '△\uFE0E' },
  { id: 'planetas', numero: '04', titulo: 'Planetas', icono: '♂\uFE0E' },
  { id: 'casas', numero: '05', titulo: 'Casas', icono: '⌂\uFE0E' },
  { id: 'aspectos', numero: '06', titulo: 'Aspectos', icono: '☍\uFE0E' },
  { id: 'sintesis', numero: '07', titulo: 'Síntesis de tu carta', icono: '✳\uFE0E' },
]
  
  function Capitulos({ onSeleccionar }) {
    return (
      <div className="max-w-md mx-auto px-6 pt-10">
        <h1 className="font-serif text-2xl text-[#2B2620] mb-1">Tu lectura ✦</h1>
        <p className="text-sm text-[#5C5346] mb-6">Explora tu mapa capítulo por capítulo.</p>
  
        <ul className="divide-y divide-[#C4B8A0]">
          {CAPITULOS.map((cap) => (
            <li key={cap.id}>
              <button
                onClick={() => onSeleccionar(cap.id)}
                className="w-full flex items-center gap-4 py-4 text-left"
              >
                <span className="text-lg text-[#8B6F47]">{cap.icono}</span>
                <span className="text-xs text-[#8B6F47] w-6">{cap.numero}</span>
                <span className="flex-1 text-[#2B2620]">{cap.titulo}</span>
                <span className="text-[#8B6F47]">›</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    )
  }
  
  export default Capitulos