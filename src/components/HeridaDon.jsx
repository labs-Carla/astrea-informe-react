/**
 * Capítulo X: Tu herida y tu don (Quirón). Prioriza el texto de la segunda
 * llamada a Claude (areas_de_vida.herida_y_don, enfocado en herida/sanación/
 * don), y si no existe, cae al texto general de Quirón de la primera llamada.
 */
function HeridaDon({ datos, onVolver }) {
    const quiron = datos?.planetas?.Quiron
    const textoEnfocado = datos?.areas_de_vida?.herida_y_don
  
    return (
      <div className="max-w-md mx-auto px-6 pt-10">
        <button onClick={onVolver} className="text-[#8B6F47] mb-4 text-sm">
          ← Volver
        </button>
  
        <div className="text-xs tracking-widest text-[#8B6F47] mb-1">CAPÍTULO X</div>
        <h1 className="font-serif text-2xl text-[#3D5A6C] mb-1">Tu Herida y Tu Don</h1>
        {quiron && (
          <p className="text-sm text-[#5C5346] mb-6">
            {quiron.signo} {quiron.grado_en_signo.toFixed(2)}° · Casa {quiron.casa}
          </p>
        )}
  
        {textoEnfocado ? (
          <p className="font-serif italic text-[#2B2620] leading-relaxed bg-[#EDE6D3] border-l-2 border-[#3D5A6C] px-5 py-5 rounded-r whitespace-pre-line">
            {textoEnfocado}
          </p>
        ) : quiron?.interpretacion ? (
          <p className="text-[#2B2620] leading-relaxed">{quiron.interpretacion}</p>
        ) : (
          <p className="text-[#5C5346] italic">Esta sección no está disponible todavía.</p>
        )}
      </div>
    )
  }
  
  export default HeridaDon