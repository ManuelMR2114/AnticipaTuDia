import { useEffect, useState } from 'react';
import type { SessionResponse, Task } from '@agenda/shared';
import { eliminarTarea, listarAgenda } from '../../../lib/api/tasks';
import { useMisAlumnos } from '../hooks/useMisAlumnos';

interface EliminarTareasProps {
  sesion: SessionResponse;
}

const claseInput =
  'h-[clamp(44px,4.6vh,60px)] w-full rounded-xl border-[1.5px] border-borde bg-transparent px-5 text-[clamp(16px,1.1vw,22px)] text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-azul-oscuro disabled:opacity-50 [&>option]:bg-white [&>option]:text-black';
const claseLabel = 'mb-[1.2vh] block text-[clamp(18px,1.5vw,30px)] font-semibold text-black';
const claseBotonPrimario =
  'anillo-foco h-[clamp(36px,4vh,52px)] rounded-xl border-[1.5px] border-azul-oscuro bg-azul-oscuro px-5 text-[clamp(14px,1vw,20px)] font-semibold text-white disabled:opacity-50';
const claseBotonSecundario =
  'anillo-foco h-[clamp(36px,4vh,52px)] rounded-xl border-[1.5px] border-borde bg-transparent px-5 text-[clamp(14px,1vw,20px)] font-semibold text-black disabled:opacity-50';

const ESTADOS: Record<Task['status'], string> = {
  pending: 'Pendiente',
  started: 'Empezada',
  completed: 'Terminada',
};

function hoy(): string {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}

// Inicio del día elegido y del siguiente (hora local del navegador), en ISO 8601
function rangoDelDia(dia: string): { from: string; to: string } {
  const inicio = new Date(`${dia}T00:00`);
  const fin = new Date(inicio);
  fin.setDate(fin.getDate() + 1);
  return { from: inicio.toISOString(), to: fin.toISOString() };
}

function mensajeErrorCarga(status: number): string {
  if (status === 401) return 'Tu sesión ha caducado. Vuelve a entrar';
  if (status === 403) return 'No tienes permiso para ver las tareas de ese alumno';
  if (status === 503) return 'Servicio no disponible';
  return 'No se pudieron cargar las tareas';
}

function mensajeErrorBorrado(status: number): string {
  if (status === 401) return 'Tu sesión ha caducado. Vuelve a entrar';
  if (status === 403) return 'Solo puedes eliminar las tareas que tú has asignado';
  if (status === 404) return 'La tarea ya no existe';
  if (status === 503) return 'Servicio no disponible';
  return 'No se pudo eliminar la tarea';
}

export default function EliminarTareasTutor({ sesion }: EliminarTareasProps) {
  const { alumnos, cargando: cargandoAlumnos, error: errorAlumnos } = useMisAlumnos(sesion);

  const [alumnoId, setAlumnoId] = useState('');
  const [dia, setDia] = useState(hoy());

  const [tareas, setTareas] = useState<Task[]>([]);
  const [cargando, setCargando] = useState(false);
  const [errorCarga, setErrorCarga] = useState('');
  // Se incrementa para volver a pedir la lista tras eliminar
  const [version, setVersion] = useState(0);

  // Doble verificación y bloqueo mientras se elimina
  const [confirmandoId, setConfirmandoId] = useState<string | null>(null);
  const [eliminandoId, setEliminandoId] = useState<string | null>(null);

  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  useEffect(() => {
    if (!alumnoId || !dia) return;

    let cancelada = false;
    const { from, to } = rangoDelDia(dia);
    setCargando(true);

    listarAgenda(sesion.accessToken, alumnoId, from, to)
      .then(async (response) => {
        if (cancelada) return;
        if (!response.ok) {
          setErrorCarga(mensajeErrorCarga(response.status));
          setTareas([]);
          return;
        }
        const datos = (await response.json()) as Task[];
        if (cancelada) return;
        // Las tareas personales del alumno no las puede borrar el adulto
        setTareas(datos.filter((t) => t.origin === 'assigned'));
        setErrorCarga('');
      })
      .catch(() => {
        if (!cancelada) {
          setErrorCarga('No se pudo conectar con el servidor');
          setTareas([]);
        }
      })
      .finally(() => {
        if (!cancelada) setCargando(false);
      });

    return () => {
      cancelada = true;
    };
  }, [sesion.accessToken, alumnoId, dia, version]);

  const elegirAlumno = (id: string) => {
    setAlumnoId(id);
    setTareas([]);
    setErrorCarga('');
    setConfirmandoId(null);
    setError('');
    setExito('');
  };

  const eliminar = async (tarea: Task) => {
    setError('');
    setExito('');
    setEliminandoId(tarea.id);
    try {
      const response = await eliminarTarea(sesion.accessToken, tarea.id);
      if (!response.ok) {
        setError(mensajeErrorBorrado(response.status));
        return;
      }
      setExito(`La tarea «${tarea.title}» se ha eliminado correctamente`);
      setVersion((v) => v + 1);
    } catch {
      setError('No se pudo conectar con el servidor');
    } finally {
      setEliminandoId(null);
      setConfirmandoId(null);
    }
  };

  const ocupado = eliminandoId !== null;

  return (
    <div>
      {/* Cabecera */}
      <div className="mb-[4vh] text-left">
        <h2 className="mb-[1.1vh] text-titulo font-bold leading-tight text-black">Eliminar tareas</h2>
        <p className="text-subtitulo font-normal italic text-black">
          Quita las tareas que sobren para que tus alumnos no se agobien
        </p>
      </div>

      {error && (
        <div role="alert" className="mb-[2vh] rounded-xl border border-red-400 bg-red-100 p-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}
      {exito && (
        <div role="status" className="mb-[2vh] rounded-xl border border-verde-agua bg-verde-agua/40 p-3 text-sm font-medium text-black">
          {exito}
        </div>
      )}

      {/* Alumno y día */}
      <div className="mb-[3vh] grid max-w-[900px] grid-cols-1 gap-[3vw] sm:grid-cols-2">
        <div>
          <label htmlFor="alumno" className={claseLabel}>Alumno</label>
          {errorAlumnos ? (
            <div role="alert" className="rounded-xl border border-red-400 bg-red-100 p-3 text-sm font-medium text-red-700">
              {errorAlumnos}
            </div>
          ) : (
            <select
              id="alumno"
              value={alumnoId}
              onChange={(e) => elegirAlumno(e.target.value)}
              className={claseInput}
              disabled={cargandoAlumnos || ocupado}
            >
              <option value="">
                {cargandoAlumnos
                  ? 'Cargando alumnos...'
                  : alumnos.length === 0
                    ? 'No tienes alumnos asignados'
                    : 'Selecciona un alumno'}
              </option>
              {alumnos.map((a) => (
                <option key={a.studentId} value={a.studentId}>
                  {a.fullName}
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label htmlFor="dia" className={claseLabel}>Día</label>
          <input
            id="dia"
            type="date"
            value={dia}
            onChange={(e) => {
              setDia(e.target.value);
              setConfirmandoId(null);
            }}
            className={claseInput}
            disabled={ocupado}
          />
        </div>
      </div>

      {/* Lista de tareas */}
      {!alumnoId ? (
        <p className="text-subtitulo italic text-black">Elige un alumno para ver sus tareas</p>
      ) : cargando ? (
        <p role="status" className="text-subtitulo italic text-black">Cargando tareas...</p>
      ) : errorCarga ? (
        <div role="alert" className="rounded-xl border border-red-400 bg-red-100 p-3 text-sm font-medium text-red-700">
          {errorCarga}
        </div>
      ) : tareas.length === 0 ? (
        <p className="text-subtitulo italic text-black">No hay tareas asignadas para ese día</p>
      ) : (
        <ul className="flex max-w-[900px] flex-col gap-[1.4vh]">
          {tareas.map((t) => (
            <li
              key={t.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl border-[1.5px] border-borde px-5 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-[clamp(16px,1.2vw,24px)] font-semibold text-black">{t.title}</p>
                <p className="text-[clamp(13px,0.9vw,18px)] text-black">
                  {t.dueAt
                    ? new Date(t.dueAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
                    : 'Sin hora'}
                  {' · '}
                  {ESTADOS[t.status]}
                </p>
              </div>

              {confirmandoId === t.id ? (
                <div className="flex items-center gap-3">
                  <span className="text-[clamp(13px,0.9vw,18px)] font-semibold text-black">¿Seguro?</span>
                  <button type="button" className={claseBotonPrimario} disabled={ocupado} onClick={() => eliminar(t)}>
                    {eliminandoId === t.id ? 'Eliminando...' : 'Confirmar'}
                  </button>
                  <button type="button" className={claseBotonSecundario} disabled={ocupado} onClick={() => setConfirmandoId(null)}>
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className={claseBotonSecundario}
                  disabled={ocupado}
                  aria-label={`Eliminar la tarea ${t.title}`}
                  onClick={() => setConfirmandoId(t.id)}
                >
                  Eliminar
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}