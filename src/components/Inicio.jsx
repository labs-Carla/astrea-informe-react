/**
 * Pantalla de bienvenida. Recibe los datos ya cargados (para el saludo con
 * el nombre) y una función `onComenzar` que el componente padre (App.jsx)
 * usa para cambiar a la vista de Capítulos cuando se toca el botón.
 */
function Inicio({ datos, onComenzar }) {
    const primerNombre = datos?.metadata?.nombre?.split(' ')[0] || ''
  
    return (
      <div className="max-w-md mx-auto px-6 pt-10 pb-6">
        <div className="flex items-center gap-2 mb-8">
          <span className="text-xl">✦</span>
          <div className="font-serif tracking-widest text-sm">
            ASTREA
            <span className="block text-[9px] tracking-[0.3em] text-[#8B6F47]">CHARTS</span>
          </div>
        </div>
  
        <h1 className="font-serif text-4xl text-[#2B2620] mb-3">
          Hola, {primerNombre}. ✦
        </h1>
  
        <p className="text-[#5C5346] mb-1">Hace años el cielo dibujó un mapa.</p>
        <p className="font-serif italic text-[#5C5346] mb-8">
          Hoy comienza el viaje para entenderlo.
        </p>
  
        <button
          onClick={onComenzar}
          className="w-full bg-[#2B2620] text-[#F7F3E9] rounded-lg py-4 font-medium flex items-center justify-center gap-2"
        >
          Comenzar mi lectura
          <span>→</span>
        </button>
      </div>
    )
  }
  
  export default Inicio