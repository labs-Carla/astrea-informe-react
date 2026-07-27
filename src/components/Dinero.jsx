/**
 * Capítulo VIII: Dinero y abundancia. Viene de la segunda llamada a Claude
 * (areas_de_vida.dinero).
 */
function Dinero({ datos, onVolver }) {
    const texto = datos?.areas_de_vida?.dinero
  
    return (
      <div className="max-w-md mx-auto px-6 pt-10">
        <button onClick={onVolver} className="text-[#8B6F47] mb-4 text-sm">
          ← Volver
        </button>
  
        <div className="text-xs tracking-widest text-[#8B6F47] mb-1">CAPÍTULO VIII</div>
        <h1 className="font-serif text-2xl text-[#3D5A6C] mb-6">Dinero y Abundancia</h1>
  
        {texto ? (
          <p className="font-serif italic text-[#2B2620] leading-relaxed bg-[#EDE6D3] border-l-2 border-[#3D5A6C] px-5 py-5 rounded-r whitespace-pre-line">
            {texto}
          </p>
        ) : (
          <p className="text-[#5C5346] italic">Esta sección no está disponible todavía.</p>
        )}
      </div>
    )
  }
  
  export default Dinero