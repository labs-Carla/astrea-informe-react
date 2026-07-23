import BarraElemento from './BarraElemento'

/**
 * Capítulo II: Elementos y Dignidades. Muestra las barras de conteo de
 * elementos y modalidades, más el texto interpretativo del patrón.
 */
function ElementosDignidades({ datos, onVolver }) {
  const elementos = datos?.elementos_y_modalidades
  const lectura = datos?.interpretacion?.lectura_elementos_dignidades

  const coloresElemento = {
    Fuego: '#C97064',
    Tierra: '#8B6F47',
    Aire: '#3D5A6C',
    Agua: '#5C8A8A',
  }

  return (
    <div className="max-w-md mx-auto px-6 pt-10">
      <button onClick={onVolver} className="text-[#8B6F47] mb-4 text-sm">
        ← Volver
      </button>

      <div className="text-xs tracking-widest text-[#8B6F47] mb-1">CAPÍTULO II</div>
      <h1 className="font-serif text-2xl text-[#3D5A6C] mb-6">Elementos y Dignidades</h1>

      {elementos ? (
        <>
          <div className="text-xs tracking-widest text-[#8B6F47] mb-3">ELEMENTOS</div>
          {Object.entries(elementos.conteo_elementos).map(([nombre, valor]) => (
            <BarraElemento
              key={nombre}
              etiqueta={nombre}
              valor={valor}
              maximo={Math.max(1, ...Object.values(elementos.conteo_elementos))}
              color={coloresElemento[nombre] || '#3D5A6C'}
            />
          ))}

          <div className="text-xs tracking-widest text-[#8B6F47] mb-3 mt-6">MODALIDADES</div>
          {Object.entries(elementos.conteo_modalidades).map(([nombre, valor]) => (
            <BarraElemento
              key={nombre}
              etiqueta={nombre}
              valor={valor}
              maximo={Math.max(1, ...Object.values(elementos.conteo_modalidades))}
              color="#8B6F47"
            />
          ))}
        </>
      ) : (
        <p className="text-[#5C5346] italic">Información no disponible.</p>
      )}

      {lectura && (
        <p className="font-serif italic text-[#2B2620] leading-relaxed bg-[#EDE6D3] border-l-2 border-[#3D5A6C] px-5 py-5 rounded-r mt-6">
          {lectura}
        </p>
      )}
    </div>
  )
}

export default ElementosDignidades