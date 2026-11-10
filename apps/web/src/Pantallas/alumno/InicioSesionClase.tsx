import { useEffect, useState } from 'react';
import PanelLateral from '../../Componentes/layout/PanelLateral';
import BotonAccesibilidad from '../../Componentes/accesibilidad/BotonAccesibilidad';
import TarjetaSeleccion from '../../Componetes/ui/TarjetaSeleccion';
import type { Classroom } from '@agenda/shared';

const API_URL = 'http://localhost:3000/api';

interface InicioSesionClaseProps {
  onVolver: () => void;
  // Avisa a App de qué aula ha elegido el alumno
  onSeleccionarClase: (aula: Classroom) => void;
}

// Colores de las tarjetas (clases completas para que Tailwind las genere).
// Se asignan por posición, así la tabla no necesita una columna de color.
const COLORES_TARJETA = ['bg-amarillo-pastel', 'bg-azul-claro', 'bg-verde-agua', 'bg-salmon'];

// Inicial de la clase: "Aula Girasol" -> "G"
const obtenerInicial = (nombre: string): string =>
  nombre.replace(/^Aula\s+/i, '').charAt(0).toUpperCase();

export default function InicioSesionClase({ onVolver, onSeleccionarClase }: InicioSesionClaseProps) {
  const [clases, setClases] = useState<Classroom[]>([]);
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

        const datos: Classroom[] = await respuesta.json();
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
              <TarjetaSeleccion
                key={clase.id}
                color={COLORES_TARJETA[indice % COLORES_TARJETA.length]}
                inicial={obtenerInicial(clase.name)}
                titulo={clase.name}
                subtitulo={clase.groupName}
                ariaLabel={`Acceder al ${clase.name}`}
                onClick={() => onSeleccionarClase(clase)}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}