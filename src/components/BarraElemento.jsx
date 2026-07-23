/**
 * Barra horizontal reutilizable para mostrar un conteo (elemento o modalidad)
 * como proporción visual respecto al valor máximo del grupo.
 */
function BarraElemento({ etiqueta, valor, maximo, color }) {
    const pct = (valor / maximo) * 100
  
    return (
      <div className="flex items-center gap-3 mb-2.5">
        <span className="text-xs text-[#5C5346] w-16">{etiqueta}</span>
        <div className="flex-1 h-2 bg-[#EDE6D3] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{ width: `${pct}%`, backgroundColor: color }}
          />
        </div>
        <span className="text-xs text-[#5C5346] w-5 text-right">{valor}</span>
      </div>
    )
  }
  
  export default BarraElemento