/**
 * Capítulo XIV: Tu brújula personal. Viene de la segunda llamada a Claude
 * (areas_de_vida.brujula): 5 aprendizajes, un mantra, y una frase final.
 */
function Brujula({ datos, onVolver }) {
    const brujula = datos?.areas_de_vida?.brujula
  
    return (
      <div className="max-w-md mx-auto px-6 pt-10">
        <button onClick={onVolver} className="text-[#8B6F47] mb-4 text-sm">
          ← Volver
        </button>
  
        <div className="text-xs tracking-widest text-[#8B6F47] mb-1">CAPÍTULO XIV</div>
        <h1 className="font-serif text-2xl text-[#3D5A6C] mb-6">Tu Brújula Personal</h1>
  
        {brujula ? (
          <>
            <div className="bg-[#EDE6D3] rounded-lg p-5 mb-5">
              <div className="text-xs tracking-widest text-[#8B6F47] mb-3">TUS 5 APRENDIZAJES</div>
              <ul className="space-y-2">
                {brujula.aprendizajes.map((a, idx) => (
                  <li key={idx} className="text-sm text-[#2B2620] pl-5 relative">
                    <span className="absolute left-0 text-[#3D5A6C]">✦</span>
                    {a}
                  </li>
                ))}
              </ul>
            </div>
  
            <div className="bg-[#EDE6D3] border-l-2 border-[#3D5A6C] rounded-r px-5 py-5 mb-6">
              <div className="text-xs tracking-widest text-[#8B6F47] mb-2">TU MANTRA</div>
              <p className="font-serif italic text-lg text-[#2B2620]">{brujula.mantra}</p>
            </div>
  
            <p className="font-serif italic text-xl text-[#3D5A6C] text-center py-4">
              {brujula.frase_final}
            </p>
          </>
        ) : (
          <p className="text-[#5C5346] italic">Esta sección no está disponible todavía.</p>
        )}
      </div>
    )
  }
  
  export default Brujula