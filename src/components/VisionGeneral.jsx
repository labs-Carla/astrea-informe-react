/**
 * Capítulo I: Visión general. Recibe el texto ya calculado (interpretacion.overview)
 * y una función `onVolver` para regresar al índice de capítulos.
 */
function VisionGeneral({ datos, onVolver }) {
    const overview = datos?.interpretacion?.overview
  
    return (
      <div className="max-w-md mx-auto px-6 pt-10">
        <button onClick={onVolver} className="text-[#8B6F47] mb-4 text-sm">
          ← Volver
        </button>
  
        <div className="text-xs tracking-widest text-[#8B6F47] mb-1">CAPÍTULO I</div>
        <h1 className="font-serif text-2xl text-[#3D5A6C] mb-6">Visión General</h1>
  
        {overview ? (
          <p className="font-serif italic text-[#2B2620] leading-relaxed bg-[#EDE6D3] border-l-2 border-[#3D5A6C] px-5 py-5 rounded-r whitespace-pre-line">
            {overview}
          </p>
        ) : (
          <p className="text-[#5C5346] italic">Esta sección no está disponible todavía.</p>
        )}
      </div>
    )
  }
  
  export default VisionGeneral