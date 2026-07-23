const SIMBOLOS = {
    Sol: '☉', Luna: '☽', Mercurio: '☿', Venus: '♀', Marte: '♂',
    Jupiter: '♃', Saturno: '♄', Urano: '♅', Neptuno: '♆', Pluton: '♇',
    NodoNorte: '☊', Quiron: '⚷', Ascendente: 'Asc', MedioCielo: 'MC',
  }
  
  const SIMBOLOS_ASPECTO = {
    Conjuncion: '☌', Trigono: '△', Sextil: '⚹', Cuadratura: '□', Oposicion: '☍',
  }
  
  const DESCRIPCION_ASPECTO = {
    Conjuncion: 'Energías que se fusionan y amplifican.',
    Trigono: 'Fluidez y facilidad entre ambos puntos.',
    Sextil: 'Comunicación armoniosa entre ambas energías.',
    Cuadratura: 'Tensión que impulsa al crecimiento.',
    Oposicion: 'Polaridad que busca equilibrio.',
  }
  
  /**
   * Capítulo VI: Aspectos. Cada fila muestra los dos puntos involucrados, el
   * tipo de aspecto (con su símbolo) y una descripción breve de qué implica.
   */
  function Aspectos({ datos, onVolver }) {
    const aspectos = datos?.aspectos || []
  
    return (
      <div className="max-w-md mx-auto px-6 pt-10">
        <button onClick={onVolver} className="text-[#8B6F47] mb-4 text-sm">
          ← Volver
        </button>
  
        <div className="text-xs tracking-widest text-[#8B6F47] mb-1">CAPÍTULO VI</div>
        <h1 className="font-serif text-2xl text-[#3D5A6C] mb-1">Aspectos</h1>
        <p className="text-sm text-[#5C5346] mb-6">
          Las conexiones entre los planetas revelan cómo fluye la energía en tu carta.
        </p>
  
        <ul className="divide-y divide-[#C4B8A0]">
          {aspectos.map((asp, idx) => (
            <li key={idx} className="py-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[#3D5A6C]">{SIMBOLOS[asp.punto_a] || asp.punto_a}</span>
                <span className="text-[#8B6F47]">{SIMBOLOS_ASPECTO[asp.aspecto] || ''}</span>
                <span className="text-[#3D5A6C]">{SIMBOLOS[asp.punto_b] || asp.punto_b}</span>
                <span className="ml-auto text-xs text-[#5C5346]">{asp.orbe_usado}°</span>
              </div>
              <div className="text-sm text-[#2B2620]">
                {asp.aspecto} entre {asp.punto_a} y {asp.punto_b}
              </div>
              {DESCRIPCION_ASPECTO[asp.aspecto] && (
                <div className="text-xs text-[#5C5346] italic mt-0.5">
                  {DESCRIPCION_ASPECTO[asp.aspecto]}
                </div>
              )}
            </li>
          ))}
        </ul>
  
        <p className="text-xs text-[#8B6F47] italic text-center mt-6 bg-[#EDE6D3] rounded-lg p-4">
          Los aspectos no son buenos ni malos. Son simplemente información sobre cómo interactúan tus energías.
        </p>
      </div>
    )
  }
  
  export default Aspectos