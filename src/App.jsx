import PanelAdmin from './components/admin/PanelAdmin'
import AppReporte from './AppReporte'

/**
 * Punto de entrada que decide entre dos experiencias completamente
 * separadas: el panel de administracion (/admin) o el reporte normal
 * para el cliente (todo lo demas, incluyendo /r/:token).
 * Cada rama es su propio componente para que los hooks (como
 * useCartaNatal) solo se ejecuten cuando realmente corresponde.
 */
function App() {
  const esAdmin = window.location.pathname === '/admin'
  return esAdmin ? <PanelAdmin /> : <AppReporte />
}

export default App