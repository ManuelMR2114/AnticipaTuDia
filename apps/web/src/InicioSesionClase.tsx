import PanelLateral from './PanelLateral';
import BotonAccesibilidad from './BotonAccesibilidad';

interface InicioSesionClaseProps {
  onVolver: () => void;
}

interface Clase {
  id: number;
  nombre: string;
  grupo: string;
  /** Clase completa de Tailwind (bg-...), definida en @theme dentro de index.css */
  color: string;
}

const CLASES: Clase[] = [
  { id: 1, nombre: 'Aula Girasol', grupo: 'PTVAL - Grupo 1', color: 'bg-amarillo-pastel' },
  { id: 2, nombre: 'Aula Delfín', grupo: 'PTVAL - Grupo 2', color: 'bg-azul-claro' },
  { id: 3, nombre: 'Aula Bosque', grupo: 'PTVAL - Grupo 3', color: 'bg-verde-agua' },
  { id: 4, nombre: 'Aula Volcán', grupo: 'PTVAL - Grupo 4', color: 'bg-salmon' },
];

// Inicial de la clase: "Aula Girasol" -> "G"
const obtenerInicial = (nombre: string): string =>
  nombre.replace(/^Aula\s+/i, '').charAt(0).toUpperCase();

export default function InicioSesionClase({ onVolver }: InicioSesionClaseProps) {
  const manejarAcceso = (nombreClase: string): void => {
    console.log(`Accediendo a ${nombreClase}`);
    // Aquí irá la conexión con NestJS / Supabase
  };

  return (
    <div className="flex min-h-screen w-full">
      <PanelLateral />

      <main className="relative flex w-[62%] flex-col items-center justify-center bg-crema">
        <button
          className="anillo-foco absolute top-[7vh] left-[4.9vw] flex size-[clamp(56px,4.5vw,90px)] items-center justify-center rounded-full border-2 border-borde bg-transparent text-borde transition-[transform,background-color] duration-200 ease-[ease] hover:-translate-x-[3px] hover:bg-black/5"
          onClick={onVolver}
          aria-label="Volver a la selección de rol"
        >
          <svg
            className="size-[52%]"
            viewBox="0 0 48 48"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M40 24H8M20 12L8 24l12 12" />
          </svg>
        </button>

        <BotonAccesibilidad />

        <div className="w-full px-[2.5vw] text-center">
          <h2 className="mb-[7vh] text-titulo font-bold text-black">Elige tu clase</h2>
          <p className="mb-[7vh] text-subtitulo font-normal text-[#111] italic">
            Selecciona el aula a la que perteneces
          </p>

          <div className="grid grid-cols-[repeat(2,minmax(0,332px))] justify-center gap-x-[7.8vw] gap-y-[7.9vh]">
            {CLASES.map((clase) => (
              <button
                key={clase.id}
                className={`anillo-foco flex h-[clamp(110px,13vh,150px)] w-full items-center gap-[clamp(12px,1.2vw,24px)] rounded-3xl border-2 border-borde px-[clamp(12px,1vw,20px)] text-left transition-[transform,box-shadow] duration-200 ease-[ease] hover:-translate-y-1 hover:shadow-[0_6px_14px_rgba(0,0,0,0.15)] ${clase.color}`}
                onClick={() => manejarAcceso(clase.nombre)}
                aria-label={`Acceder al ${clase.nombre}`}
              >
                <div className="flex size-[clamp(54px,3.8vw,74px)] shrink-0 items-center justify-center rounded-2xl border-2 border-borde bg-azul-oscuro text-avatar font-bold text-white">
                  {obtenerInicial(clase.nombre)}
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="mb-2 text-tarjeta font-bold text-black">{clase.nombre}</h3>
                  <p className="text-tarjeta-detalle leading-[1.15] text-[#111]">{clase.grupo}</p>
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
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}