const SIMBOLOS = {
    Sol: '☉', Luna: '☽', Mercurio: '☿', Venus: '♀', Marte: '♂',
    Jupiter: '♃', Saturno: '♄', Urano: '♅', Neptuno: '♆', Pluton: '♇',
    NodoNorte: '☊', Quiron: '⚷',
  }
  
  /**
   * Lista de planetas. Al tocar uno, llama a `onSeleccionar` con el nombre
   * del planeta — App.jsx guarda ese nombre y cambia a la vista de detalle.
   */
  function Planetas({ datos, onSeleccionar, onVolver }) {
    const planetas = datos?.planetas || {}
  
    return (
      <div className="max-w-md mx-auto px-6 pt-10">
        <button onClick={onVolver} className="text-[#8B6F47] mb-4 text-sm">
          ← Volver
        </button>
  
        <div className="text-xs tracking-widest text-[#8B6F47] mb-1">CAPÍTULO IV</div>
        <h1 className="font-serif text-2xl text-[#3D5A6C] mb-6">Planetas</h1>
  
        <ul className="divide-y divide-[#C4B8A0]">
          {Object.entries(planetas).map(([nombre, d]) => (
            <li key={nombre}>
              <button
                onClick={() => onSeleccionar(nombre)}
                className="w-full flex items-center gap-4 py-4 text-left"
              >
                <span className="text-xl text-[#3D5A6C] w-6">
                  {SIMBOLOS[nombre] || '•'}
                </span>
                <div className="flex-1">
                  <div className="text-[#2B2620]">{nombre}</div>
                  <div className="text-xs text-[#5C5346]">
                    {d.signo} · Casa {d.casa}
                  </div>
                </div>
                <span className="text-[#8B6F47]">›</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    )
  }
  
  export default Planetas