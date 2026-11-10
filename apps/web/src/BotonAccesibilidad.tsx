import { useAccesibilidad, type TamanoTexto } from './UseAccesibilidad';

const ETIQUETA_TEXTO: Record<TamanoTexto, string> = {
  normal: 'normal',
  grande: 'grande',
  'muy-grande': 'muy grande',
};

//cuadro accesibilidad de la esquina, tamaño de texto y alto contraste
interface BotonAccesibilidadProps {
  // Posición del cuadro. Por defecto, la esquina de las pantallas de login.
  className?: string;
}

export default function BotonAccesibilidad({
  className = 'absolute top-[7.8vh] right-[5.9vw]',
}: BotonAccesibilidadProps) {
  const { tamanoTexto, altoContraste, alternarTamanoTexto, alternarContraste } = useAccesibilidad();
  const textoAmpliado = tamanoTexto !== 'normal';

  return (
    <div
      role="group"
      aria-label="Opciones de accesibilidad"
      className={`${className} flex h-[58px] items-center gap-3.5 rounded-[16px] border border-borde bg-white pr-3.5 pl-4`}
    >
      <span className="text-[0.72rem] font-bold text-azul-oscuro">Accesibilidad</span>


      {/*tamaño de letra*/}
      <button
        type="button"
        onClick={alternarTamanoTexto}
        title="Cambiar tamaño del texto"
        aria-label={`Tamaño del texto: ${ETIQUETA_TEXTO[tamanoTexto]}. Pulsa para cambiarlo`}
        className={`anillo-foco relative flex h-7 w-6 items-end justify-center rounded-[4px] border pb-0.5 text-[0.85rem] leading-none before:absolute before:top-px before:left-[3px] before:text-[0.5rem] before:content-['A'] ${
          textoAmpliado
            ? 'border-azul-oscuro bg-azul-oscuro text-white before:text-white'
            : 'border-[#888] text-[#444] before:text-[#888]'
        }`}
      >
        A
      </button>



      {/*contraste*/}
      <button
        type="button"
        onClick={alternarContraste}
        aria-pressed={altoContraste}
        title="Alto contraste"
        aria-label="Alto contraste"
        className={`anillo-foco flex h-5 w-6 items-center justify-center rounded-md border after:block after:size-3 after:rounded-full after:border after:border-azul-oscuro after:bg-[linear-gradient(90deg,var(--color-azul-oscuro)_50%,#ffffff_50%)] after:content-[''] ${
          altoContraste ? 'border-azul-oscuro bg-azul-oscuro/15' : 'border-[#888]'
        }`}
      />




      {/*texto invisible que anuncia el cambio a los lectores de pantalla */}
      <span className="sr-only" role="status">
        {`Texto ${ETIQUETA_TEXTO[tamanoTexto]}. Contraste ${altoContraste ? 'alto' : 'normal'}.`}
      </span>
    </div>
  );
}