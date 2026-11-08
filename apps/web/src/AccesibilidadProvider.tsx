import { useEffect, useState, type ReactNode } from 'react';
import { ContextoAccesibilidad, type TamanoTexto } from './UseAccesibilidad';


//clave con las que se guardan las preferencias en el navegador 
const CLAVE_ALMACENAMIENTO = 'anticipatudia:accesibilidad';

//orden en el que cambia el tamaño de texto 
const CICLO_TEXTO: TamanoTexto[] = ['normal', 'grande', 'muy-grande'];

interface Preferencias {
  tamanoTexto: TamanoTexto;
  altoContraste: boolean;
}

//lee las preferencias guardadas */
function leerPreferencias(): Preferencias {

  //valores por defecto 
  const porDefecto: Preferencias = {
    tamanoTexto: 'normal',
    altoContraste: window.matchMedia?.('(prefers-contrast: more)').matches ?? false,
  };


  try {
    const guardado = localStorage.getItem(CLAVE_ALMACENAMIENTO);
    if (!guardado) return porDefecto;

    const datos = JSON.parse(guardado) as Partial<Preferencias>;
    return {
      tamanoTexto: CICLO_TEXTO.includes(datos.tamanoTexto as TamanoTexto)
        ? (datos.tamanoTexto as TamanoTexto)
        : porDefecto.tamanoTexto,
      altoContraste:
        typeof datos.altoContraste === 'boolean' ? datos.altoContraste : porDefecto.altoContraste,
    };
  } catch {
    return porDefecto;
  }
}




export default function AccesibilidadProvider({ children }: { children: ReactNode }) {

  //se pasa la funcion para que solo lea el almacenamiento una vez, al arrancar   
  const [preferencias, setPreferencias] = useState<Preferencias>(leerPreferencias);

  //cada vez que se cambian las preferencias se aplican al html y las guarda
  useEffect(() => {
    const raiz = document.documentElement;

    //el index.css escucha estos atributos y escala el texto  o cambia los colores 
    raiz.dataset.texto = preferencias.tamanoTexto;
    raiz.dataset.contraste = preferencias.altoContraste ? 'alto' : 'normal';

    try {
      localStorage.setItem(CLAVE_ALMACENAMIENTO, JSON.stringify(preferencias));
    } catch {
      
    }
  }, [preferencias]);

  //avanza al siguienten nivel de texto 
  const alternarTamanoTexto = (): void =>
    setPreferencias((previas) => ({
      ...previas,
      tamanoTexto: CICLO_TEXTO[(CICLO_TEXTO.indexOf(previas.tamanoTexto) + 1) % CICLO_TEXTO.length],
    }));


  //invierte el estado del alto contraste
  const alternarContraste = (): void =>
    setPreferencias((previas) => ({ ...previas, altoContraste: !previas.altoContraste }));


  return (
    <ContextoAccesibilidad.Provider
      value={{ ...preferencias, alternarTamanoTexto, alternarContraste }}
    >
      {children}
    </ContextoAccesibilidad.Provider>
  );

  
}