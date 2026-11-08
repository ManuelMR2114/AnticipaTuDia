import { useEffect, useState } from 'react';
import PanelLateral from './PanelLateral';
import BotonAccesibilidad from './BotonAccesibilidad';

const API_URL = 'http://localhost:3000/api';

interface InicioSesionClaseProps {
  onVolver: () => void;
}

// Aula tal y como la devuelve la API (GET /classrooms)
// ⚠️ Ajusta los nombres de campo a lo que devuelva el backend
interface Clase {
  id: string;
  name: string;
  group_name: string | null;
}

// Colores de las tarjetas (clases completas para que Tailwind las genere).
// Se asignan por posición, así la tabla no necesita una columna de color.
const COLORES_TARJETA = ['bg-amarillo-pastel', 'bg-azul-claro', 'bg-verde-agua', 'bg-salmon'];

// Inicial de la clase: "Aula Girasol" -> "G"
const obtenerInicial = (nombre: string): string =>
  nombre.replace(/^Aula\s+/i, '').charAt(0).toUpperCase();

export default function InicioSesionClase({ onVolver }: InicioSesionClaseProps) {
  const [clases, setClases] = useState<Clase[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Al abrir la pantalla, pide las aulas a la API
  useEffect(() => {
    // Permite cancelar la petición si el usuario sale de la pantalla antes de que termine
    const controlador = new AbortController();

    const cargarClases = async (): Promise<void> => {
      try {
        const respuesta = await fetch(`${API_URL}/classrooms`, { signal: controlador.signal });
        if (!respuesta.ok) throw new Error(`Error ${respuesta.status}`);

        const datos: Clase[] = await respuesta.json();
        setClases(datos);
      } catch (e) {
        // Una petición cancelada a propósito no es un error que mostrar
        if ((e as Error).name !== 'AbortError') {
          console.error('Error al cargar las clases:', e);
          setError('No se han podido cargar las clases. Inténtalo de nuevo.');
        }
      } finally {
        if (!controlador.signal.aborted) setCargando(false);
      }
    };

    cargarClases();
    return () => controlador.abort();
  }, []);

  const manejarAcceso = (clase: Clase): void => {
    console.log(`Accediendo a ${clase.name} (${clase.id})`);
    // Aquí irá el paso siguiente: elegir alumno / iniciar sesión en esta aula
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

          {/* Estados: cargando / error / sin clases */}
          {cargando && (
            <p role="status" className="text-subtitulo text-[#111]">
              Cargando clases…
            </p>
          )}
          {error && (
            <p role="alert" className="text-subtitulo text-[#111]">
              {error}
            </p>
          )}
          {!cargando && !error && clases.length === 0 && (
            <p className="text-subtitulo text-[#111]">Todavía no hay clases disponibles.</p>
          )}

          <div className="grid grid-cols-[repeat(2,minmax(0,332px))] justify-center gap-x-[7.8vw] gap-y-[7.9vh]">
            {clases.map((clase, indice) => (
              <button
                key={clase.id}
                className={`anillo-foco flex min-h-[clamp(110px,13vh,150px)] w-full items-center gap-[clamp(12px,1.2vw,24px)] rounded-3xl border-2 border-borde px-[clamp(12px,1vw,20px)] py-3 text-left transition-[transform,box-shadow] duration-200 ease-[ease] hover:-translate-y-1 hover:shadow-[0_6px_14px_rgba(0,0,0,0.15)] ${COLORES_TARJETA[indice % COLORES_TARJETA.length]}`}
                onClick={() => manejarAcceso(clase)}
                aria-label={`Acceder al ${clase.name}`}
              >
                <div className="flex size-[clamp(54px,3.8vw,74px)] shrink-0 items-center justify-center rounded-2xl border-2 border-borde bg-azul-oscuro text-avatar font-bold text-white">
                  {obtenerInicial(clase.name)}
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="mb-2 text-tarjeta font-bold text-black">{clase.name}</h3>
                  {clase.group_name && (
                    <p className="text-tarjeta-detalle leading-[1.15] text-[#111]">
                      {clase.group_name}
                    </p>
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
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}