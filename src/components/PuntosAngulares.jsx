/**
 * Capítulo III: Puntos Angulares (Ascendente y Medio Cielo), con su tabla
 * de posiciones y la interpretación de cada uno.
 */
function PuntosAngulares({ datos, onVolver }) {
    const puntos = datos?.puntos_angulares
    const ascendente = datos?.interpretacion?.ascendente
    const medioCielo = datos?.interpretacion?.medio_cielo
  
    return (
      <div className="max-w-md mx-auto px-6 pt-10">
        <button onClick={onVolver} className="text-[#8B6F47] mb-4 text-sm">
          ← Volver
        </button>
  
        <div className="text-xs tracking-widest text-[#8B6F47] mb-1">CAPÍTULO III</div>
        <h1 className="font-serif text-2xl text-[#3D5A6C] mb-6">Puntos Angulares</h1>
  
        {puntos && (
          <table className="w-full text-sm mb-6">
            <thead>
              <tr className="text-left text-xs text-[#3D5A6C] uppercase border-b border-[#3D5A6C]">
                <th className="py-2">Punto</th>
                <th className="py-2">Signo</th>
                <th className="py-2 text-right">Grado</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(puntos).map(([nombre, d]) => (
                <tr key={nombre} className="border-b border-[#C4B8A0]">
                  <td className="py-2 text-[#2B2620]">{nombre}</td>
                  <td className="py-2 text-[#2B2620]">{d.signo}</td>
                  <td className="py-2 text-right text-[#2B2620]">
                    {d.grado_en_signo.toFixed(2)}°
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
  
        {ascendente && (
          <div className="bg-[#EDE6D3] border border-[#C4B8A0] rounded-lg p-5 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-serif text-lg text-[#3D5A6C]">Asc</span>
              <h3 className="font-serif text-[#2B2620]">Ascendente</h3>
            </div>
            <p className="text-sm text-[#2B2620] text-justify">{ascendente}</p>
          </div>
        )}
  
        {medioCielo && (
          <div className="bg-[#EDE6D3] border border-[#C4B8A0] rounded-lg p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-serif text-lg text-[#3D5A6C]">MC</span>
              <h3 className="font-serif text-[#2B2620]">Medio Cielo</h3>
            </div>
            <p className="text-sm text-[#2B2620] text-justify">{medioCielo}</p>
          </div>
        )}
      </div>
    )
  }
  
  export default PuntosAngulares