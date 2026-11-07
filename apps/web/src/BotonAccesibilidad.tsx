/** Cuadro "Accesibilidad" de la esquina superior derecha. */
export default function BotonAccesibilidad() {
    return (
      <header className="absolute top-[7.8vh] right-[5.9vw]">
        <button
          className="anillo-foco flex h-[58px] items-center gap-3.5 rounded-[16px] border border-borde bg-white pr-3.5 pl-4"
          aria-label="Opciones de accesibilidad"
        >
          <span className="text-[0.72rem] font-bold text-azul-oscuro">
            Accesibilidad
          </span>
  
          {/* Icono tamaño de letra: una "A" grande y otra pequeña en la esquina */}
          <span
            className="relative flex h-7 w-6 items-end justify-center rounded-[4px] border border-[#888] pb-0.5 text-[0.85rem] leading-none text-[#444] before:absolute before:top-px before:left-[3px] before:text-[0.5rem] before:text-[#888] before:content-['A']"
            aria-hidden="true"
          >
            A
          </span>
  
          {/* Icono contraste: círculo mitad oscuro, mitad claro */}
          <span
            className="flex h-5 w-6 items-center justify-center rounded-md border border-[#888] after:block after:size-3 after:rounded-full after:border after:border-azul-oscuro after:bg-[linear-gradient(90deg,var(--color-azul-oscuro)_50%,#ffffff_50%)] after:content-['']"
            aria-hidden="true"
          />
        </button>
      </header>
    );
  }