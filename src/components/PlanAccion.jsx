/**
 * Capítulo XIII: Tu plan de acción. Viene de la segunda llamada a Claude
 * (areas_de_vida.plan_de_accion), con 4 listas: potencia, observa, evita, empieza.
 */
function PlanAccion({ datos, onVolver }) {
    const plan = datos?.areas_de_vida?.plan_de_accion
  
    const bloques = [
      { clave: 'potencia', titulo: 'Potencia', icono: '✔' },
      { clave: 'observa', titulo: 'Observa', icono: '◎' },
      { clave: 'evita', titulo: 'Evita', icono: '✕' },
      { clave: 'empieza', titulo: 'Empieza', icono: '→' },
    ]
  
    return (
      <div className="max-w-md mx-auto px-6 pt-10">
        <button onClick={onVolver} className="text-[#8B6F47] mb-4 text-sm">
          ← Volver
        </button>
  
        <div className="text-xs tracking-widest text-[#8B6F47] mb-1">CAPÍTULO XIII</div>
        <h1 className="font-serif text-2xl text-[#3D5A6C] mb-6">Tu Plan de Acción</h1>
  
        {plan ? (
          bloques.map(({ clave, titulo, icono }) => (
            <div key={clave} className="bg-[#EDE6D3] rounded-lg p-5 mb-4">
              <div className="text-xs tracking-widest text-[#8B6F47] mb-3">{titulo.toUpperCase()}</div>
              <ul className="space-y-2">
                {plan[clave].map((item, idx) => (
                  <li key={idx} className="text-sm text-[#2B2620] pl-5 relative">
                    <span className="absolute left-0 text-[#3D5A6C]">{icono}</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))
        ) : (
          <p className="text-[#5C5346] italic">Esta sección no está disponible todavía.</p>
        )}
      </div>
    )
  }
  
  export default PlanAccion