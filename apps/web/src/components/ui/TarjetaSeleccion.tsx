interface TarjetaSeleccionProps {
    /** Clase completa de Tailwind (bg-...), para que Tailwind la genere */
    color: string;
    /** Texto del cuadro azul: "G" para un aula, "LM" para un alumno */
    inicial: string;
    titulo: string;
    subtitulo?: string | null;
    ariaLabel: string;
    onClick: () => void;
  }
  
  /** Tarjeta con cuadro de inicial, título, subtítulo y flecha. La usan "Elige tu clase" y "¿Quién eres?". */
  export default function TarjetaSeleccion({
    color,
    inicial,
    titulo,
    subtitulo,
    ariaLabel,
    onClick,
  }: TarjetaSeleccionProps) {
    return (
      <button
        className={`anillo-foco flex min-h-[clamp(110px,13vh,150px)] w-full items-center gap-[clamp(12px,1.2vw,24px)] rounded-3xl border-2 border-borde px-[clamp(12px,1vw,20px)] py-3 text-left transition-[transform,box-shadow] duration-200 ease-[ease] hover:-translate-y-1 hover:shadow-[0_6px_14px_rgba(0,0,0,0.15)] ${color}`}
        onClick={onClick}
        aria-label={ariaLabel}
      >
        <div className="flex size-[clamp(54px,3.8vw,74px)] shrink-0 items-center justify-center rounded-2xl border-2 border-borde bg-azul-oscuro text-avatar font-bold text-white">
          {inicial}
        </div>
  
        <div className="min-w-0 flex-1">
          <h3 className="mb-2 text-tarjeta font-bold text-black">{titulo}</h3>
          {subtitulo && (
            <p className="text-tarjeta-detalle leading-[1.15] text-[#111]">{subtitulo}</p>
          )}
        </div>
  
        <svg
          className="size-[clamp(34px,2.4vw,48px)] shrink-0 text-borde"
          viewBox="0 0 48 48"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="24" cy="24" r="22" />
          <path d="M14 24h20M26 15l9 9-9 9" />
        </svg>
      </button>
    );
  }