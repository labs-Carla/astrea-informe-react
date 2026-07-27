import { useState } from 'react'
import { useCartaNatal } from './hooks/useCartaNatal'
import Inicio from './components/Inicio'
import Capitulos from './components/Capitulos'
import VisionGeneral from './components/VisionGeneral'
import ElementosDignidades from './components/ElementosDignidades'
import PuntosAngulares from './components/PuntosAngulares'
import Planetas from './components/Planetas'
import PlanetaDetalle from './components/PlanetaDetalle'
import BarraInferior from './components/BarraInferior'
import Casas from './components/Casas'
import Aspectos from './components/Aspectos'
import Vocacion from './components/Vocacion'
import Dinero from './components/Dinero'
import Amor from './components/Amor'
import HeridaDon from './components/HeridaDon'
import CieloHoy from './components/CieloHoy'
import ProximosMeses from './components/ProximosMeses'
import PlanAccion from './components/PlanAccion'
import Brujula from './components/Brujula'
import Sintesis from './components/Sintesis'

function AppReporte() {
  const { datos, cargando, error } = useCartaNatal()
  const [vista, setVista] = useState('inicio')
  const [planetaSeleccionado, setPlanetaSeleccionado] = useState(null)

  function irADetallePlaneta(nombre) {
    setPlanetaSeleccionado(nombre)
    setVista('planeta-detalle')
  }

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
        {vista === 'puntos-angulares' && (
          <PuntosAngulares datos={datos} onVolver={() => setVista('capitulos')} />
        )}
        {vista === 'planetas' && (
          <Planetas
            datos={datos}
            onSeleccionar={irADetallePlaneta}
            onVolver={() => setVista('capitulos')}
          />
        )}
        {vista === 'planeta-detalle' && (
          <PlanetaDetalle
            datos={datos}
            nombrePlaneta={planetaSeleccionado}
            onVolver={() => setVista('planetas')}
          />
        )}
        {vista === 'casas' && (
          <Casas datos={datos} onVolver={() => setVista('capitulos')} />
        )}
        {vista === 'aspectos' && (
          <Aspectos datos={datos} onVolver={() => setVista('capitulos')} />
        )}
        {vista === 'vocacion' && (
          <Vocacion datos={datos} onVolver={() => setVista('capitulos')} />
        )}
        {vista === 'dinero' && (
          <Dinero datos={datos} onVolver={() => setVista('capitulos')} />
        )}
        {vista === 'amor' && (
          <Amor datos={datos} onVolver={() => setVista('capitulos')} />
        )}
        {vista === 'herida-don' && (
          <HeridaDon datos={datos} onVolver={() => setVista('capitulos')} />
        )}
        {vista === 'cielo-hoy' && (
          <CieloHoy datos={datos} onVolver={() => setVista('capitulos')} />
        )}
        {vista === 'proximos-meses' && (
          <ProximosMeses datos={datos} onVolver={() => setVista('capitulos')} />
        )}
        {vista === 'plan-accion' && (
          <PlanAccion datos={datos} onVolver={() => setVista('capitulos')} />
        )}
        {vista === 'brujula' && (
          <Brujula datos={datos} onVolver={() => setVista('capitulos')} />
        )}
        {vista === 'sintesis' && (
          <Sintesis datos={datos} onVolver={() => setVista('capitulos')} />
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

export default AppReporte