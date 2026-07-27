/**
 * Capítulo XI: Tu cielo de hoy. Viene de la tercera llamada a Claude
 * (transitos), es una foto fija calculada al momento de aprobar la carta.
 */
function CieloHoy({ datos, onVolver }) {
    const transitos = datos?.transitos
  
    return (
      <div className="max-w-md mx-auto px-6 pt-10">
        <button onClick={onVolver} className="text-[#8B6F47] mb-4 text-sm">
          ← Volver
        </button>
  
        <div className="text-xs tracking-widest text-[#8B6F47] mb-1">CAPÍTULO XI</div>
        <h1 className="font-serif text-2xl text-[#3D5A6C] mb-6">Tu Cielo de Hoy</h1>
  
        {transitos ? (
          <>
            <p className="font-serif italic text-[#2B2620] leading-relaxed bg-[#EDE6D3] border-l-2 border-[#3D5A6C] px-5 py-5 rounded-r whitespace-pre-line mb-5">
              {transitos.clima_energetico}
            </p>
  
            <div className="bg-[#EDE6D3] rounded-lg p-5 mb-5">
              <div className="text-xs tracking-widest text-[#8B6F47] mb-3">ÁREAS ACTIVADAS</div>
              <ul className="space-y-2">
                {transitos.areas_activadas.map((area, idx) => (
                  <li key={idx} className="text-sm text-[#2B2620] pl-4 relative">
                    <span className="absolute left-0 text-[#3D5A6C]">✔</span>
                    {area}
                  </li>
                ))}
              </ul>
            </div>
  
            <div className="mb-5">
              <h3 className="font-serif text-lg text-[#2B2620] mb-2">Oportunidades</h3>
              <p className="text-[#2B2620] leading-relaxed">{transitos.oportunidades}</p>
            </div>
  
            <div className="mb-5">
              <h3 className="font-serif text-lg text-[#2B2620] mb-2">Retos</h3>
              <p className="text-[#2B2620] leading-relaxed">{transitos.retos}</p>
            </div>
  
            <div className="bg-[#EDE6D3] border border-[#C4B8A0] rounded-lg p-5">
              <div className="text-xs tracking-widest text-[#8B6F47] mb-2">CONSEJO</div>
              <p className="text-[#2B2620]">{transitos.consejo}</p>
            </div>
          </>
        ) : (
          <p className="text-[#5C5346] italic">Esta sección no está disponible todavía.</p>
        )}
      </div>
    )
  }
  
  export default CieloHoy