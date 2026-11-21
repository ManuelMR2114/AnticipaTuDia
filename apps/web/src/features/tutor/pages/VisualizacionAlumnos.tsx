import type { SessionResponse } from '@agenda/shared';
import { useMisAlumnos } from '../hooks/useMisAlumnos';
/* Es para el enlace para acceder a la agenda de cada alumno*/
import { Link } from 'react-router';

interface VisualizacionAlumnosProps {
  // Sesión del tutor
  sesion: SessionResponse;
}

const claseBoton = 'anillo-foco inline-flex shrink-0 items-center justify-center whitespace-nowrap h-[clamp(36px,4vh,52px)] rounded-xl border-[1.5px] border-azul-oscuro bg-azul-oscuro px-5 text-[clamp(14px,1vw,20px)] font-semibold text-white disabled:opacity-50';

export default function VisualizacionAlumnos({ sesion }: VisualizacionAlumnosProps) {

  // Alumnos del tutor
  const { alumnos, cargando, error } = useMisAlumnos(sesion);

  // Ordenamos alfabéticamente por nombre porque la API no lo da ordenado. 
  // Para ello, copiamos los alumnos obtenido en nuevo array alumnos_ordenados y lo ordenamos comparando por parejas los nombres completos (fullName) usando las reglas del español ('es')
  const alumnos_ordenados = [...alumnos].sort((a, b) => a.fullName.localeCompare(b.fullName, 'es'));

  return (
    <div>
      {/* Cabecera */}
      <div className="mb-[4vh] text-left">
        <h2 className="mb-[1.1vh] text-titulo font-bold leading-tight text-black">Mis alumnos</h2>
        <p className="text-subtitulo font-normal italic text-black">Elige un alumno para ver su agenda</p>
      </div>

      {/* Se define los estados que puede tener la pantalla: cargando los alumnos, si hay un error, si no hay alumnos o la lista de alumnos asociados al tutor */}
      {cargando && (
        <p role="status" className="text-subtitulo italic text-black">
          Cargando alumnos...
        </p>
      )}

      {!cargando && error && (
        <div role="alert" className="rounded-xl border border-red-400 bg-red-100 p-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {!cargando && !error && alumnos_ordenados.length === 0 && (
        <p className="text-subtitulo italic text-black"> Todavía no tienes alumnos asignados </p>
      )}

      {!cargando && !error && alumnos_ordenados.length > 0 && (
        <ul className="flex flex-col gap-[1.4vh]">
          {alumnos_ordenados.map((alumno) => (
            <li
              key={alumno.studentId}
              className="flex items-center justify-between gap-4 rounded-xl border-[1.5px] border-borde px-5 py-4"
            >
              {/* Nombre del alumno */}
              <div className="min-w-0">
                <p className="truncate text-[clamp(16px,1.2vw,24px)] font-semibold text-black">{alumno.fullName}</p>
              </div>

              {/* Acceso a su agenda a través de un enlace */}
                <Link
                
                    to={`/agenda/${alumno.studentId}`}
                    state={{ nombreAlumno: alumno.fullName }}
                    className={claseBoton}
                    aria-label={`Ver la agenda de ${alumno.fullName}`}
                >
                    Ver agenda

                </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
