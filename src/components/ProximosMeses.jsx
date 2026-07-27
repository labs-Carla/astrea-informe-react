/**
 * Capítulo XII: Los próximos meses. Viene de la tercera llamada a Claude
 * (transitos.proximos_meses), con 4 áreas: carrera, amor, dinero, crecimiento.
 */
function ProximosMeses({ datos, onVolver }) {
    const proximos = datos?.transitos?.proximos_meses
  
    const areas = [
      { clave: 'carrera', titulo: 'Carrera' },
      { clave: 'amor', titulo: 'Amor' },
      { clave: 'dinero', titulo: 'Dinero' },
      { clave: 'crecimiento', titulo: 'Crecimiento' },
    ]
  
    return (
      <div className="max-w-md mx-auto px-6 pt-10">
        <button onClick={onVolver} className="text-[#8B6F47] mb-4 text-sm">
          ← Volver
        </button>
  
        <div className="text-xs tracking-widest text-[#8B6F47] mb-1">CAPÍTULO XII</div>
        <h1 className="font-serif text-2xl text-[#3D5A6C] mb-6">Los Próximos Meses</h1>
  
        {proximos ? (
          areas.map(({ clave, titulo }) => (
            <div key={clave} className="mb-5">
              <h3 className="font-serif text-lg text-[#2B2620] mb-2">{titulo}</h3>
              <p className="text-[#2B2620] leading-relaxed">{proximos[clave]}</p>
            </div>
          ))
        ) : (
          <p className="text-[#5C5346] italic">Esta sección no está disponible todavía.</p>
        )}
      </div>
    )
  }
  
  export default ProximosMeses