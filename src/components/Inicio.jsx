import { calcularEdad } from '../utils/fecha'
import portadaVentana from '../assets/astrea-portada.png'

/**
 * Pantalla de bienvenida. Estructura en columna que llena toda la altura
 * disponible (h-full) sin generar scroll: encabezado y texto arriba,
 * imagen ocupando el espacio restante, botón fijo abajo.
 */
function Inicio({ datos, onComenzar }) {
  const primerNombre = datos?.metadata?.nombre?.split(' ')[0] || ''
  const fechaNacimiento = datos?.metadata?.fecha_hora_local
  const edad = fechaNacimiento ? calcularEdad(fechaNacimiento) : null

  return (
    <div className="h-full flex flex-col px-6 pt-8 pb-6">
      <div className="flex items-center gap-2 mb-6 shrink-0">
        <span className="text-xl">✦</span>
        <div className="font-serif tracking-widest text-sm">
          ASTREA
          <span className="block text-[9px] tracking-[0.3em] text-[#8B6F47]">CHARTS</span>
        </div>
      </div>

      <h1 className="font-serif text-3xl text-[#2B2620] mb-2 shrink-0">
        Hola, {primerNombre}. ✦
      </h1>

      <p className="text-sm text-[#5C5346] mb-0.5 shrink-0">
        {edad !== null
          ? `Hace ${edad} años el cielo dibujó un mapa.`
          : 'El cielo dibujó un mapa el día de tu nacimiento.'}
      </p>
      <p className="font-serif italic text-sm text-[#5C5346] mb-4 shrink-0">
        Hoy comienza el viaje para entenderlo.
      </p>

      <div className="flex-1 min-h-0 mb-4">
  <img
    src={portadaVentana}
    alt="Silueta observando el cielo estrellado"
    className="w-full h-full rounded-2xl object-contain"
  />
</div>

      <button
        onClick={onComenzar}
        className="w-full bg-[#2B2620] text-[#F7F3E9] rounded-lg py-4 font-medium flex items-center justify-center gap-2 shrink-0"
      >
        Comenzar mi lectura
        <span>→</span>
      </button>
    </div>
  )
}

export default Inicio