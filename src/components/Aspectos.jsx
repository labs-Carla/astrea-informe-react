/**
 * Capítulo VI: Aspectos. Prioriza los aspectos interpretados individualmente
 * por la segunda llamada a Claude (areas_de_vida.aspectos_interpretados);
 * si no existen, cae a la tabla simple de los top-10 aspectos por orbe.
 */
function Aspectos({ datos, onVolver }) {
  const aspectosInterpretados = datos?.areas_de_vida?.aspectos_interpretados
  const aspectos = datos?.aspectos || []

  return (
    <div className="max-w-md mx-auto px-6 pt-10">
      <button onClick={onVolver} className="text-[#8B6F47] mb-4 text-sm">
        ← Volver
      </button>

      <div className="text-xs tracking-widest text-[#8B6F47] mb-1">CAPÍTULO VI</div>
      <h1 className="font-serif text-2xl text-[#3D5A6C] mb-1">Aspectos</h1>
      <p className="text-sm text-[#5C5346] mb-6">
        Las conexiones entre los planetas revelan cómo fluye la energía en tu carta.
      </p>

      {aspectosInterpretados?.length ? (
        aspectosInterpretados.map((a, idx) => (
          <div key={idx} className="bg-[#EDE6D3] rounded-lg p-5 mb-3">
            <div className="text-xs text-[#8B6F47] mb-2">
              {a.punto_a} {a.aspecto} {a.punto_b}
            </div>
            <p className="text-sm text-[#2B2620]">{a.interpretacion}</p>
          </div>
        ))
      ) : aspectos.length ? (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-[#3D5A6C] uppercase border-b border-[#3D5A6C]">
              <th className="py-2">Punto A</th>
              <th className="py-2">Aspecto</th>
              <th className="py-2">Punto B</th>
              <th className="py-2 text-right">Orbe</th>
            </tr>
          </thead>
          <tbody>
            {aspectos.map((a, idx) => (
              <tr key={idx} className="border-b border-[#C4B8A0]">
                <td className="py-2 text-[#2B2620]">{a.punto_a}</td>
                <td className="py-2 text-[#2B2620]">{a.aspecto}</td>
                <td className="py-2 text-[#2B2620]">{a.punto_b}</td>
                <td className="py-2 text-right text-[#2B2620]">{a.orbe_usado}°</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-[#5C5346] italic">Información no disponible.</p>
      )}
    </div>
  )
}

export default Aspectos