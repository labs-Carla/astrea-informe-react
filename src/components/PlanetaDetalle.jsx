const SIMBOLOS = {
    Sol: '☉', Luna: '☽', Mercurio: '☿', Venus: '♀', Marte: '♂',
    Jupiter: '♃', Saturno: '♄', Urano: '♅', Neptuno: '♆', Pluton: '♇',
    NodoNorte: '☊', Quiron: '⚷',
  }
  
  /**
   * Vista de detalle de un planeta específico. `nombrePlaneta` viene de App.jsx
   * (el planeta que se tocó en la lista); busca sus datos dentro de `datos.planetas`.
   */
  function PlanetaDetalle({ datos, nombrePlaneta, onVolver }) {
    const planeta = datos?.planetas?.[nombrePlaneta]
  
    if (!planeta) {
      return (
        <div className="max-w-md mx-auto px-6 pt-10">
          <button onClick={onVolver} className="text-[#8B6F47] mb-4 text-sm">
            ← Volver
          </button>
          <p className="text-[#5C5346] italic">No se encontró información de este planeta.</p>
        </div>
      )
    }
  
    return (
      <div className="max-w-md mx-auto px-6 pt-10">
        <button onClick={onVolver} className="text-[#8B6F47] mb-4 text-sm">
          ← Volver
        </button>
  
        <div className="flex items-center gap-3 mb-1">
          <span className="text-2xl text-[#3D5A6C]">{SIMBOLOS[nombrePlaneta] || '•'}</span>
          <h1 className="font-serif text-2xl text-[#2B2620]">{nombrePlaneta}</h1>
        </div>
        <p className="text-sm text-[#5C5346] mb-6">
          {planeta.signo} · Casa {planeta.casa}
          {planeta.retrogrado && <span className="text-[#8B6F47]"> · Retrógrado</span>}
        </p>
  
        {planeta.interpretacion && (
          <p className="text-[#2B2620] leading-relaxed text-justify">
            {planeta.interpretacion}
          </p>
        )}
      </div>
    )
  }
  
  export default PlanetaDetalle