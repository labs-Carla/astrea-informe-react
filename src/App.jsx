import { useState } from 'react'
import { useCartaNatal } from './hooks/useCartaNatal'
import Inicio from './components/Inicio'
import Capitulos from './components/Capitulos'
import VisionGeneral from './components/VisionGeneral'
import BarraInferior from './components/BarraInferior'
import ElementosDignidades from './components/ElementosDignidades'
function App() {
  const { datos, cargando, error } = useCartaNatal()
  const [vista, setVista] = useState('inicio')

  let contenido

  if (cargando) {
    contenido = (
      <div className="flex-1 flex items-center justify-center">
        <p className="font-serif italic text-[#5C5346]">Preparando tu lectura...</p>
      </div>
    )
  } else if (error) {
    contenido = (
      <div className="flex-1 flex items-center justify-center px-6 text-center">
        <p className="text-[#5C5346]">{error}</p>
      </div>
    )
  } else {
    contenido = (
      <div className="flex-1 overflow-y-auto">
        {vista === 'inicio' && (
          <Inicio datos={datos} onComenzar={() => setVista('capitulos')} />
        )}
        {vista === 'capitulos' && (
          <Capitulos onSeleccionar={(nuevaVista) => setVista(nuevaVista)} />
        )}
        {vista === 'vision-general' && (
          <VisionGeneral datos={datos} onVolver={() => setVista('capitulos')} />
        )}
        {vista === 'elementos' && (
        <ElementosDignidades datos={datos} onVolver={() => setVista('capitulos')} />
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#EDE6D3] sm:py-10 sm:px-4">
      <div className="w-full h-screen sm:h-[844px] sm:max-w-[420px] sm:rounded-[2.5rem] sm:shadow-2xl sm:border sm:border-[#C4B8A0] bg-[#F7F3E9] overflow-hidden flex flex-col">
        {contenido}
        {!cargando && !error && vista !== 'inicio' && (
          <BarraInferior vistaActual={vista} onNavegar={setVista} />
        )}
        
        
      </div>
    </div>
  )
}

export default App