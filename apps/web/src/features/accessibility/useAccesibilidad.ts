import { createContext, useContext } from 'react';


//niveles posibles de tamaño (escala 1, 1.15 y 1.3)
export type TamanoTexto = 'normal' | 'grande' | 'muy-grande';


//expone el contexto a a cualquier componente de la app
export interface AccesibilidadContexto {

  tamanoTexto: TamanoTexto;
  altoContraste: boolean;

  /*pasa de normal a grande a muy grande a normal */
  alternarTamanoTexto: () => void;
  alternarContraste: () => void;
}

//context compartido 
export const ContextoAccesibilidad = createContext<AccesibilidadContexto | null>(null);

//para poder leer y cambiar las preferencias desde cualquier componente 
export function useAccesibilidad(): AccesibilidadContexto {
  const contexto = useContext(ContextoAccesibilidad);

  //si se usa fuera del provider avisamos para facilitar ver el error 
  if (!contexto) {
    throw new Error('useAccesibilidad debe usarse dentro de <AccesibilidadProvider>');
  }
  return contexto;
}