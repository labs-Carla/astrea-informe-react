import { createContext, useContext } from 'react'

/** Avisos (toasts) y confirmaciones del panel; los proveedores viven en ui.jsx. */
export const ContextoAvisos = createContext(() => {})
export const useAviso = () => useContext(ContextoAvisos)

export const ContextoConfirmar = createContext(async () => false)
export const useConfirmar = () => useContext(ContextoConfirmar)
