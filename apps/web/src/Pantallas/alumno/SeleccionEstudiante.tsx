import { useEffect, useState } from 'react';
import PanelLateral from '../../Componentes/layout/PanelLateral';
import BotonAccesibilidad from '../../Componentes/accesibilidad/BotonAccesibilidad';
import TarjetaSeleccion from '../../Componentes/ui/TarjetaSeleccion';
import type { Classroom } from '@agenda/shared';
import type { EstudianteConMetodo } from '../../Tipos/metodoLogin';

const API_URL = 'http://localhost:3000/api';

interface SeleccionEstudianteProps {
  // Aula elegida en la pantalla anterior
  aula: Classroom;
  onVolver: () => void;
  // Mensaje si el alumno elegido no puede entrar todavía
  aviso?: string | null;
  // Avisa a App de qué alumno se ha elegido
  onSeleccionarEstudiante: (estudiante: EstudianteConMetodo) => void;
}

// Colores en el orden del diseño: rosa, azul, verde, salmón
const COLORES_TARJETA = ['bg-rosa-palo', 'bg-azul-claro', 'bg-verde-agua', 'bg-salmon'];

// Dos letras del nombre: "Lucía Martín" -> "LM", "Noa" -> "N"
const obtenerIniciales = (nombreCompleto: string): string =>
  nombreCompleto
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((palabra) => palabra.charAt(0).toUpperCase())
    .join('');

export default function SeleccionEstudiante({
  aula,
  onVolver,
  aviso,
  onSeleccionarEstudiante,
}: SeleccionEstudianteProps) {
  const [estudiantes, setEstudiantes] = useState<EstudianteConMetodo[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Al abrir la pantalla, pide los alumnos del aula elegida
  useEffect(() => {
    const controlador = new AbortController();

    const cargarEstudiantes = async (): Promise<void> => {
      try {
        const respuesta = await fetch(`${API_URL}/classrooms/${aula.id}/students`, {
          signal: controlador.signal,
        });
        if (!respuesta.ok) throw new Error(`Error ${respuesta.status}`);

        const datos: EstudianteConMetodo[] = await respuesta.json();
        setEstudiantes(datos);
      } catch (e) {
        if ((e as Error).name !== 'AbortError') {
          console.error('Error al cargar los estudiantes:', e);
          setError('No se han podido cargar los nombres. Inténtalo de nuevo.');
        }
      } finally {
        if (!controlador.signal.aborted) setCargando(false);
      }
    };

    cargarEstudiantes();
    return () => controlador.abort();
  }, [aula.id]);

  return (
    <div className="flex min-h-screen w-full">
      <PanelLateral />

      <main className="relative flex w-[62%] flex-col items-center justify-center bg-crema">
        <button
          className="anillo-foco absolute top-[7vh] left-[4.9vw] flex size-[clamp(56px,4.5vw,90px)] items-center justify-center rounded-full border-2 border-borde bg-transparent text-borde transition-[transform,background-color] duration-200 ease-[ease] hover:-translate-x-[3px] hover:bg-black/5"
          onClick={onVolver}
          aria-label="Volver a la selección de clase"
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
          <h2 className="mb-[7vh] text-titulo font-bold text-black">¿Quien eres?</h2>
          <p className="mb-[7vh] text-subtitulo font-normal text-[#111] italic">
            Busca tu nombre y toca tu tarjeta
          </p>

          {/* Estados: cargando / error / sin alumnos */}
          {cargando && (
            <p role="status" className="text-subtitulo text-[#111]">
              Cargando nombres…
            </p>
          )}
          {error && (
            <p role="alert" className="text-subtitulo text-[#111]">
              {error}
            </p>
          )}
          {aviso && (
            <p role="alert" className="mb-[4vh] text-subtitulo font-semibold text-[#111]">
              {aviso}
            </p>
          )}
          {!cargando && !error && estudiantes.length === 0 && (
            <p className="text-subtitulo text-[#111]">Todavía no hay estudiantes en esta clase.</p>
          )}

          <div className="grid grid-cols-[repeat(2,minmax(0,332px))] justify-center gap-x-[7.8vw] gap-y-[7.9vh]">
            {estudiantes.map((estudiante, indice) => (
              <TarjetaSeleccion
                key={estudiante.id}
                color={COLORES_TARJETA[indice % COLORES_TARJETA.length]}
                inicial={obtenerIniciales(estudiante.fullName)}
                titulo={estudiante.fullName}
                subtitulo="Estudiante"
                ariaLabel={`Entrar como ${estudiante.fullName}`}
                onClick={() => onSeleccionarEstudiante(estudiante)}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}