/**
 * Capítulo V: Casas. Tabla simple con las 12 casas, su signo y grado.
 */
function Casas({ datos, onVolver }) {
    const casas = datos?.casas || {}
  
    return (
      <div className="max-w-md mx-auto px-6 pt-10">
        <button onClick={onVolver} className="text-[#8B6F47] mb-4 text-sm">
          ← Volver
        </button>
  
        <div className="text-xs tracking-widest text-[#8B6F47] mb-1">CAPÍTULO V</div>
        <h1 className="font-serif text-2xl text-[#3D5A6C] mb-6">Casas</h1>
  
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-[#3D5A6C] uppercase border-b border-[#3D5A6C]">
              <th className="py-2 w-10">#</th>
              <th className="py-2">Signo</th>
              <th className="py-2 text-right">Grado</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(casas).map(([numero, d]) => (
              <tr key={numero} className="border-b border-[#C4B8A0]">
                <td className="py-2 text-[#2B2620]">{numero}</td>
                <td className="py-2 text-[#2B2620]">{d.signo}</td>
                <td className="py-2 text-right text-[#2B2620]">
                  {d.grado_en_signo.toFixed(2)}°
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }
  
  export default Casas