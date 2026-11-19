import { useState } from 'react';
import type { AssignTaskRequest, SessionResponse } from '@agenda/shared';
import { asignarTarea } from '../../../lib/api/tasks';
import { useMisAlumnos } from '../hooks/useMisAlumnos';
import { TAREAS_CATALOGO } from '../hooks/tareasCatalogo';

interface AsignarTareasProps {
  // Sesión del tutor: su token se usa para llamar a POST /tasks/assign (HU-11)
  sesion: SessionResponse;
}

// Valor especial del selector para escribir una tarea que no está en el catálogo
const OTRA = 'otra';

const claseInput =
  'h-[clamp(44px,4.6vh,60px)] w-full rounded-xl border-[1.5px] border-borde bg-transparent px-5 text-[clamp(16px,1.1vw,22px)] text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-azul-oscuro disabled:opacity-50';
const claseLabel = 'mb-[1.2vh] block text-[clamp(18px,1.5vw,30px)] font-semibold text-black';
const claseOpcion =
  'flex cursor-pointer items-center gap-3 rounded-xl border-[1.5px] border-borde px-5 py-3 text-[clamp(16px,1.2vw,24px)] text-black has-[:checked]:bg-verde-agua/40';

function hoy(): string {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}

function mensajeError(status: number): string {
  if (status === 401) return 'Tu sesión ha caducado. Vuelve a entrar';
  if (status === 403) return 'No puedes asignar tareas a alguno de esos alumnos';
  if (status === 400) return 'Revisa los datos: alguno no es válido';
  if (status === 503) return 'Servicio no disponible';
  return 'No se pudo asignar la tarea';
}

export default function AsignarTareasTutor({ sesion }: AsignarTareasProps) {
  const { alumnos, cargando, error: errorCarga } = useMisAlumnos(sesion);

  const [seleccionados, setSeleccionados] = useState<string[]>([]);
  const [tareaId, setTareaId] = useState('');
  const [tituloOtra, setTituloOtra] = useState('');
  const [fecha, setFecha] = useState(hoy());
  const [hora, setHora] = useState('09:00');

  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  const todosMarcados = alumnos.length > 0 && seleccionados.length === alumnos.length;

  const alternarAlumno = (id: string) =>
    setSeleccionados((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const alternarTodos = () =>
    setSeleccionados(todosMarcados ? [] : alumnos.map((a) => a.studentId));

  const asignar = async (e: React.FormEvent) => {
    e.preventDefault();
    setExito('');

    if (seleccionados.length === 0) return setError('Elige al menos un alumno');
    if (!tareaId) return setError('Elige una tarea');
    if (tareaId === OTRA && !tituloOtra.trim()) return setError('Escribe el nombre de la tarea');
    if (!fecha) return setError('Elige el día de la tarea');
    if (!hora) return setError('Elige la hora de la tarea');

    const catalogo = TAREAS_CATALOGO.find((t) => t.id === tareaId);
    const titulo = tareaId === OTRA ? tituloOtra.trim() : catalogo?.titulo;
    if (!titulo) return setError('Elige una tarea');

    const cuerpo: AssignTaskRequest = {
      studentIds: seleccionados,
      title: titulo,
      // La hora se interpreta en la zona horaria del navegador y viaja en ISO 8601
      dueAt: new Date(`${fecha}T${hora}`).toISOString(),
      ...(catalogo?.descripcion ? { description: catalogo.descripcion } : {}),
      ...(catalogo?.pasos?.length ? { subtasks: catalogo.pasos } : {}),
    };

    setError('');
    setEnviando(true);
    try {
      const response = await asignarTarea(sesion.accessToken, cuerpo);
      if (!response.ok) {
        setError(mensajeError(response.status));
        return;
      }
      setExito(
        seleccionados.length === 1
          ? 'Tarea asignada correctamente a 1 alumno'
          : `Tarea asignada correctamente a ${seleccionados.length} alumnos`,
      );
      setSeleccionados([]);
      setTareaId('');
      setTituloOtra('');
    } catch {
      setError('No se pudo conectar con el servidor');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div>
      {/* Cabecera */}
      <div className="mb-[5.1vh] text-left">
        <h2 className="mb-[1.1vh] text-titulo font-bold leading-tight text-black">Asignar tareas</h2>
        <p className="text-subtitulo font-normal italic text-black">
          Elige a tus alumnos y decide qué tareas tienen que hacer durante el día
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

      <form onSubmit={asignar} noValidate aria-busy={enviando} className="flex max-w-[900px] flex-col gap-[3.2vh]">
        {/* 1. Alumnos */}
        <fieldset disabled={enviando}>
          <legend className={claseLabel}>Alumnos</legend>

          {cargando ? (
            <p role="status" className="text-subtitulo italic text-black">Cargando alumnos...</p>
          ) : errorCarga ? (
            <div role="alert" className="rounded-xl border border-red-400 bg-red-100 p-3 text-sm font-medium text-red-700">
              {errorCarga}
            </div>
          ) : alumnos.length === 0 ? (
            <p className="text-subtitulo italic text-black">Todavía no tienes alumnos asignados</p>
          ) : (
            <>
              <label className="mb-[1.4vh] flex cursor-pointer items-center gap-3 text-[clamp(14px,1vw,20px)] font-semibold text-black">
                <input type="checkbox" checked={todosMarcados} onChange={alternarTodos} className="size-5 accent-azul-oscuro" />
                Seleccionar todos
              </label>
              <ul className="grid grid-cols-1 gap-[1.4vh] sm:grid-cols-2">
                {alumnos.map((a) => (
                  <li key={a.studentId}>
                    <label className={claseOpcion}>
                      <input
                        type="checkbox"
                        checked={seleccionados.includes(a.studentId)}
                        onChange={() => alternarAlumno(a.studentId)}
                        className="size-5 accent-azul-oscuro"
                      />
                      <span className="font-semibold">{a.fullName}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </>
          )}
        </fieldset>

        {/* 2. Tarea: se elige de la lista */}
        <fieldset disabled={enviando}>
          <legend className={claseLabel}>Tarea</legend>
          <ul className="grid grid-cols-1 gap-[1.4vh] sm:grid-cols-2">
            {TAREAS_CATALOGO.map((t) => (
              <li key={t.id}>
                <label className={claseOpcion}>
                  <input
                    type="radio"
                    name="tarea"
                    value={t.id}
                    checked={tareaId === t.id}
                    onChange={() => setTareaId(t.id)}
                    className="size-5 accent-azul-oscuro"
                  />
                  <span className="font-semibold">{t.titulo}</span>
                </label>
              </li>
            ))}
            <li>
              <label className={claseOpcion}>
                <input
                  type="radio"
                  name="tarea"
                  value={OTRA}
                  checked={tareaId === OTRA}
                  onChange={() => setTareaId(OTRA)}
                  className="size-5 accent-azul-oscuro"
                />
                <span className="font-semibold">Otra tarea…</span>
              </label>
            </li>
          </ul>

          {tareaId === OTRA && (
            <div className="mt-[2vh]">
              <label htmlFor="titulo-otra" className={claseLabel}>Nombre de la tarea</label>
              <input
                id="titulo-otra"
                type="text"
                maxLength={200}
                autoComplete="off"
                value={tituloOtra}
                onChange={(e) => setTituloOtra(e.target.value)}
                className={claseInput}
              />
            </div>
          )}
        </fieldset>

        {/* 3. Día y hora libres */}
        <div className="grid grid-cols-1 gap-[3vw] sm:grid-cols-2">
          <div>
            <label htmlFor="fecha" className={claseLabel}>Día</label>
            <input
              id="fecha"
              type="date"
              min={hoy()}
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className={claseInput}
              disabled={enviando}
            />
          </div>

          <div>
            <label htmlFor="hora" className={claseLabel}>Hora</label>
            <input
              id="hora"
              type="time"
              value={hora}
              onChange={(e) => setHora(e.target.value)}
              className={claseInput}
              disabled={enviando}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={enviando || cargando || alumnos.length === 0}
          className="anillo-foco h-[clamp(44px,4.6vh,60px)] w-full max-w-[320px] rounded-xl border-[1.5px] border-azul-oscuro bg-azul-oscuro text-[clamp(16px,1.05vw,22px)] font-semibold text-white transition-transform hover:-translate-y-0.5 disabled:opacity-50"
        >
          {enviando ? 'Asignando...' : 'Asignar tarea'}
        </button>
      </form>
    </div>
  );
}