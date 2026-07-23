/**
 * Capítulo VII: Síntesis de tu carta. Muestra la conclusión generada por IA
 * y la frase de cierre, junto con el disclaimer legal obligatorio.
 */
function Sintesis({ datos, onVolver }) {
    const conclusion = datos?.interpretacion?.conclusion
    const fraseCierre = datos?.interpretacion?.frase_de_cierre
  
    return (
      <div className="max-w-md mx-auto px-6 pt-10">
        <button onClick={onVolver} className="text-[#8B6F47] mb-4 text-sm">
          ← Volver
        </button>
  
        <div className="text-xs tracking-widest text-[#8B6F47] mb-1">CAPÍTULO VII</div>
        <h1 className="font-serif text-2xl text-[#3D5A6C] mb-1">Síntesis de tu carta</h1>
        <p className="text-sm text-[#5C5346] mb-6">Una visión integrada de tu mapa natal.</p>
  
        {conclusion && (
          <p className="text-[#2B2620] leading-relaxed text-justify mb-6">
            {conclusion}
          </p>
        )}
  
        {fraseCierre && (
          <p className="font-serif italic text-lg text-[#3D5A6C] text-center py-6">
            {fraseCierre}
          </p>
        )}
  
        <p className="text-xs text-[#8B6F47] italic text-center bg-[#EDE6D3] rounded-lg p-4 mt-4">
          Este es solo el comienzo de tu viaje. Vuelve a tu lectura cuando lo necesites.
        </p>
  
        <p className="text-[10px] text-[#5C5346] text-center leading-relaxed mt-8 pt-4 border-t border-[#C4B8A0]">
          Esta interpretación fue generada con asistencia de inteligencia artificial
          como guía simbólica de autoconocimiento. No constituye consejo profesional,
          médico, legal ni financiero. Para decisiones importantes de vida, consulta
          siempre con un profesional cualificado.
        </p>
      </div>
    )
  }
  
  export default Sintesis