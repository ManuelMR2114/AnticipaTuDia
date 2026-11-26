import { useState } from 'react';
import type { LinkRelation, SessionResponse, StudentLink, UserRole, UserSummary } from '@agenda/shared';
import { useAsociaciones } from '../hooks/useAsociaciones';
import { crearAsociacion, eliminarAsociacion } from '../../../lib/api/studentLinks';

interface Props {
  sesion: SessionResponse;
  estudiante: UserSummary;
  // Todos los usuarios, de ahí salen los candidatos de cada relación
  usuarios: UserSummary[];
  onVolver: () => void;
}

// "rol" es el rol que debe tener el usuario para poder asociarse con esa relación.
// Si StaffRole del shared tiene más valores, añade aquí una entrada por cada uno.
const RELACIONES: { valor: LinkRelation; etiqueta: string; plural: string; rol: UserRole }[] = [
  { valor: 'tutor', etiqueta: 'Tutor', plural: 'Tutores', rol: 'tutor' },
  { valor: 'family', etiqueta: 'Familiar', plural: 'Familiares', rol: 'family' },
  { valor: 'teacher', etiqueta: 'Profesor', plural: 'Profesores', rol: 'teacher' },
  { valor: 'specialist', etiqueta: 'Especialista', plural: 'Especialistas', rol: 'specialist' },
];

const claseSelect =
  'h-[clamp(36px,4vh,52px)] rounded-xl border-[1.5px] border-borde bg-transparent px-3 text-[clamp(14px,1vw,20px)] text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-azul-oscuro disabled:opacity-50 [&>option]:bg-white [&>option]:text-black';
const claseLabel = 'mb-[1.2vh] block text-[clamp(18px,1.5vw,30px)] font-semibold text-black';
const claseBotonPrimario =
  'anillo-foco h-[clamp(36px,4vh,52px)] rounded-xl border-[1.5px] border-azul-oscuro bg-azul-oscuro px-5 text-[clamp(14px,1vw,20px)] font-semibold text-white disabled:opacity-50';
const claseBotonSecundario =
  'anillo-foco h-[clamp(36px,4vh,52px)] rounded-xl border-[1.5px] border-borde bg-transparent px-5 text-[clamp(14px,1vw,20px)] font-semibold text-black disabled:opacity-50';

// Traduce el código HTTP del backend a un mensaje para el administrador
function mensajeError(status: number, accion: string): string {
  if (status === 401) return 'Tu sesión ha caducado. Vuelve a entrar';
  if (status === 403) return 'No tienes permiso para gestionar asociaciones';
  if (status === 404) return 'No se ha encontrado el estudiante, el usuario o la asociación';
  if (status === 409) return 'Esa asociación ya existe';
  if (status === 400) return 'Revisa los datos: la asociación no es válida';
  if (status === 503) return 'Servicio no disponible';
  return `No se pudo ${accion}`;
}

export default function AsociacionesEstudiante({ sesion, estudiante, usuarios, onVolver }: Props) {
  const { asociaciones, cargando, error: errorCarga, recargar } = useAsociaciones(sesion, estudiante.id);

  // Alta: relación y usuario elegidos en el formulario
  const [relacionNueva, setRelacionNueva] = useState<LinkRelation>('tutor');
  const [usuarioNuevoId, setUsuarioNuevoId] = useState('');

  // Modificación: usuario elegido en el selector de cada fila, guardado por id de asociación
  const [elegidos, setElegidos] = useState<Record<string, string>>({});

  // Baja con doble verificación
  const [confirmandoId, setConfirmandoId] = useState<string | null>(null);

  // Bloquea botones mientras hay una petición en curso ('alta' o el id de la asociación)
  const [enviando, setEnviando] = useState<string | null>(null);

  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  // Usuarios activos con el rol de la relación que aún no están asociados a este estudiante.
  // "actualId" deja incluido al usuario actual de una fila para poder mostrarlo en su selector.
  const candidatos = (relacion: LinkRelation, actualId?: string): UserSummary[] => {
    const rol = RELACIONES.find((r) => r.valor === relacion)?.rol;
    const yaAsociados = new Set(
      asociaciones.filter((a) => a.relation === relacion).map((a) => a.linkedUser.id),
    );
    return usuarios.filter(
      (u) =>
        u.role === rol &&
        u.deactivatedAt === null &&
        (u.id === actualId || !yaAsociados.has(u.id)),
    );
  };

  // Ejecuta una acción de la API gestionando mensajes y bloqueo de botones
  const ejecutar = async (
    clave: string,
    accion: string,
    peticion: () => Promise<Response>,
    mensajeExito: string,
  ): Promise<boolean> => {
    setError('');
    setExito('');
    setEnviando(clave);
    try {
      const response = await peticion();
      if (!response.ok) {
        setError(mensajeError(response.status, accion));
        return false;
      }
      setExito(mensajeExito);
      await recargar();
      return true;
    } catch {
      setError('No se pudo conectar con el servidor');
      return false;
    } finally {
      setEnviando(null);
      setConfirmandoId(null);
    }
  };

  const crear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuarioNuevoId) {
      setExito('');
      setError('Elige a la persona que quieres asociar');
      return;
    }
    const ok = await ejecutar(
      'alta',
      'crear la asociación',
      () =>
        crearAsociacion(sesion.accessToken, {
          studentId: estudiante.id,
          linkedUserId: usuarioNuevoId,
        }),
      'Asociación creada correctamente',
    );
    if (ok) setUsuarioNuevoId('');
  };

  // El back no tiene PATCH: primero se crea la nueva y, si sale bien, se quita la antigua.
  // Así, si algo falla a mitad, queda una asociación de más y no se pierde ninguna.
  const modificar = (a: StudentLink, nuevoUsuarioId: string) =>
    ejecutar(
      a.id,
      'modificar la asociación',
      async () => {
        const creada = await crearAsociacion(sesion.accessToken, {
          studentId: estudiante.id,
          linkedUserId: nuevoUsuarioId,
        });
        if (!creada.ok) return creada;
        return eliminarAsociacion(sesion.accessToken, estudiante.id, a.linkedUser.id);
      },
      'Asociación modificada correctamente',
    );

  const quitar = (a: StudentLink) =>
    ejecutar(
      a.id,
      'eliminar la asociación',
      () => eliminarAsociacion(sesion.accessToken, estudiante.id, a.linkedUser.id),
      `${a.linkedUser.fullName} ya no está asociado a ${estudiante.fullName}`,
    );

  const ocupado = enviando !== null;
  const opcionesNuevo = candidatos(relacionNueva);

  return (
    <div>
      <button type="button" className={`${claseBotonSecundario} mb-[3vh]`} onClick={onVolver}>
        ← Volver a la lista
      </button>

      {/* Mensajes de error y éxito */}
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

      {/* ---------- Asociaciones actuales, agrupadas por relación ---------- */}
      {cargando ? (
        <p role="status" className="text-subtitulo italic text-black">Cargando asociaciones...</p>
      ) : errorCarga ? (
        <div role="alert" className="rounded-xl border border-red-400 bg-red-100 p-3 text-sm font-medium text-red-700">
          {errorCarga}
        </div>
      ) : (
        RELACIONES.map((rel) => {
          const delaRelacion = asociaciones.filter((a) => a.relation === rel.valor);
          return (
            <section key={rel.valor} className="mb-[4vh]" aria-labelledby={`titulo-${rel.valor}`}>
              <h3 id={`titulo-${rel.valor}`} className={claseLabel}>
                {rel.plural}
              </h3>

              {delaRelacion.length === 0 ? (
                <p className="text-[clamp(14px,1vw,20px)] italic text-black">Sin {rel.plural.toLowerCase()} asociados</p>
              ) : (
                <ul className="flex flex-col gap-[1.4vh]">
                  {delaRelacion.map((a) => {
                    const elegido = elegidos[a.id] ?? a.linkedUser.id;
                    const opciones = candidatos(rel.valor, a.linkedUser.id);
                    // Si el usuario actual está dado de baja no sale en candidatos: lo añadimos para que el selector no quede vacío
                    const incluyeActual = opciones.some((u) => u.id === a.linkedUser.id);
                    return (
                      <li key={a.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border-[1.5px] border-borde px-5 py-3">
                        <select
                          aria-label={`${rel.etiqueta} de ${estudiante.fullName}`}
                          value={elegido}
                          disabled={ocupado}
                          onChange={(e) => setElegidos((prev) => ({ ...prev, [a.id]: e.target.value }))}
                          className={`${claseSelect} min-w-[220px]`}
                        >
                          {!incluyeActual && <option value={a.linkedUser.id}>{a.linkedUser.fullName}</option>}
                          {opciones.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.fullName}
                            </option>
                          ))}
                        </select>

                        <div className="flex gap-3">
                          <button
                            type="button"
                            className={claseBotonPrimario}
                            disabled={ocupado || elegido === a.linkedUser.id}
                            onClick={() => modificar(a, elegido)}
                          >
                            {enviando === a.id ? 'Procesando...' : 'Guardar cambio'}
                          </button>

                          {confirmandoId === a.id ? (
                            <>
                              <button type="button" className={claseBotonPrimario} disabled={ocupado} onClick={() => quitar(a)}>
                                Confirmar
                              </button>
                              <button type="button" className={claseBotonSecundario} disabled={ocupado} onClick={() => setConfirmandoId(null)}>
                                Cancelar
                              </button>
                            </>
                          ) : (
                            <button type="button" className={claseBotonSecundario} disabled={ocupado} onClick={() => setConfirmandoId(a.id)}>
                              Quitar
                            </button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          );
        })
      )}

      {/* ---------- Nueva asociación ---------- */}
      <form onSubmit={crear} noValidate aria-busy={enviando === 'alta'} className="grid w-[46vw] min-w-[560px] grid-cols-2 gap-x-[3vw] gap-y-[3.2vh]">
        <div>
          <label htmlFor="relacion-nueva" className={claseLabel}>Relación</label>
          <select
            id="relacion-nueva"
            value={relacionNueva}
            disabled={ocupado}
            onChange={(e) => {
              setRelacionNueva(e.target.value as LinkRelation);
              setUsuarioNuevoId(''); // los candidatos cambian con la relación
            }}
            className={`${claseSelect} w-full`}
          >
            {RELACIONES.map((r) => (
              <option key={r.valor} value={r.valor}>{r.etiqueta}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="usuario-nuevo" className={claseLabel}>Persona</label>
          <select
            id="usuario-nuevo"
            value={usuarioNuevoId}
            disabled={ocupado || opcionesNuevo.length === 0}
            onChange={(e) => setUsuarioNuevoId(e.target.value)}
            className={`${claseSelect} w-full`}
          >
            <option value="">
              {opcionesNuevo.length === 0 ? 'No hay usuarios disponibles' : 'Selecciona una persona'}
            </option>
            {opcionesNuevo.map((u) => (
              <option key={u.id} value={u.id}>{u.fullName}</option>
            ))}
          </select>
        </div>

        <div className="col-span-1">
          <button
            type="submit"
            disabled={ocupado}
            className="anillo-foco h-[clamp(44px,4.6vh,60px)] w-full rounded-xl border-[1.5px] border-azul-oscuro bg-azul-oscuro text-[clamp(16px,1.05vw,22px)] font-semibold text-white transition-transform hover:-translate-y-0.5 disabled:opacity-50"
          >
            {enviando === 'alta' ? 'Asociando...' : 'Asociar'}
          </button>
        </div>
      </form>
    </div>
  );
}