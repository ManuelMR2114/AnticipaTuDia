import PanelLateral from './PanelLateral';
import BotonAccesibilidad from './BotonAccesibilidad';
import { useState } from 'react';
import type { SessionResponse, UserRole } from '@agenda/shared';

interface GestionRolesProps {
  // Sesión del administrador para obtener el token Bearer
  sesion: SessionResponse;
  onVolver: () => void;
}

// Roles asignables desde este módulo
type RolAsignable = Extract<UserRole, 'student' | 'tutor' | 'family' | 'specialist' | 'teacher' | 'admin'>;

const API_URL = 'http://localhost:3000/api';
const RUTA_USERS = '/users';

// Opciones del selector de nuevo rol
const ROLES: { valor: RolAsignable; etiqueta: string }[] = [
  { valor: 'student', etiqueta: 'Estudiante' },
  { valor: 'tutor', etiqueta: 'Tutor' },
  { valor: 'family', etiqueta: 'Familiar' },
  { valor: 'specialist', etiqueta: 'Especialista' },
  { valor: 'teacher', etiqueta: 'Profesor' },
  { valor: 'admin', etiqueta: 'Administrador' },
];

// Estilos idénticos a AltaUsuarioAdmin y BajaUsuarioAdmin para mantener la coherencia estética
const claseInput =
  'h-[clamp(44px,4.6vh,60px)] w-full rounded-xl border-[1.5px] border-borde bg-transparent px-5 text-[clamp(16px,1.1vw,22px)] text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-azul-oscuro disabled:opacity-50 [&>option]:bg-white [&>option]:text-black';
const claseLabel = 'mb-[1.2vh] block text-[clamp(18px,1.5vw,30px)] font-semibold text-black';

export default function GestionRolesAdmin({ sesion, onVolver }: GestionRolesProps) {
  // Estado del formulario
  const [userId, setUserId] = useState('');
  const [nuevoRol, setNuevoRol] = useState<RolAsignable>('tutor');

  // Mensajes de estado
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [enviando, setEnviando] = useState(false);

  const cambiarRol = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId.trim()) {
      setExito('');
      setError('El ID del usuario es obligatorio');
      return;
    }

    setError('');
    setExito('');
    setEnviando(true);

    try {
      const response = await fetch(`${API_URL}${RUTA_USERS}/${userId.trim()}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sesion.accessToken}`,
        },
        body: JSON.stringify({ role: nuevoRol }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError('Tu sesión ha caducado. Vuelve a entrar');
        } else if (response.status === 403) {
          setError('No tienes permiso para cambiar roles');
        } else if (response.status === 400) {
          // Captura la restricción del backend: autocambios o cruces entre estudiante y staff
          setError('No puedes cambiar tu propio rol ni convertir un estudiante en staff (o viceversa)');
        } else if (response.status === 404) {
          setError('No se ha encontrado ningún usuario con ese identificador');
        } else if (response.status === 503) {
          setError('Servicio no disponible');
        } else {
          setError('No se pudo actualizar el rol del usuario');
        }
        return;
      }

      const usuarioActualizado = await response.json();
      setExito(`Rol actualizado correctamente a "${nuevoRol}" para el usuario con ID ${usuarioActualizado.id}`);
      
      // Limpiamos el campo del ID tras completar la acción
      setUserId('');
    } catch {
      setError('No se pudo conectar con el servidor');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full">
      {/* Panel izquierdo */}
      <PanelLateral />

      {/* Zona derecha */}
      <main className="relative flex w-[62%] flex-col justify-center bg-crema">
        {/* Botón Volver */}
        <button
          className="anillo-foco absolute top-[5.6vh] left-[2.8vw] flex size-[clamp(56px,4.5vw,90px)] items-center justify-center rounded-full border-2 border-borde bg-transparent text-borde transition-[transform,background-color] duration-200 ease-[ease] hover:-translate-x-[3px] hover:bg-black/5"
          onClick={onVolver}
          aria-label="Volver atrás"
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

        {/* Bloque central del formulario */}
        <div className="relative pl-[9vw]">
          <div className="mb-[5.1vh] text-left">
            <h2 className="mb-[1.1vh] text-titulo font-bold leading-tight text-black">
              Gestión de roles
            </h2>
            <p className="text-subtitulo font-normal italic text-black">
              Asigna un nuevo rol a un usuario registrado en el sistema
            </p>
          </div>

          <form
            onSubmit={cambiarRol}
            noValidate
            aria-busy={enviando}
            className="grid w-[46vw] min-w-[560px] grid-cols-2 gap-x-[3vw] gap-y-[3.2vh]"
          >
            {/* ID del usuario */}
            <div>
              <label htmlFor="userId" className={claseLabel}>
                ID del usuario 
              </label>
              <input
                id="userId"
                type="text"
                autoComplete="off"
                placeholder="Ej: f47ac10b-58cc-4372-a567-0e02b2c3d479"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className={claseInput}
                disabled={enviando}
              />
            </div>

            {/* Selector de nuevo rol */}
            <div>
              <label htmlFor="nuevoRol" className={claseLabel}>
                Nuevo rol
              </label>
              <select
                id="nuevoRol"
                value={nuevoRol}
                onChange={(e) => setNuevoRol(e.target.value as RolAsignable)}
                className={claseInput}
                disabled={enviando}
              >
                {ROLES.map((r) => (
                  <option key={r.valor} value={r.valor}>
                    {r.etiqueta}
                  </option>
                ))}
              </select>
            </div>

            {/* Botón Guardar cambios */}
            <div className="col-span-2 self-end pt-2">
              <button
                type="submit"
                disabled={enviando}
                className="anillo-foco h-[clamp(44px,4.6vh,60px)] w-full rounded-xl border-[1.5px] border-azul-oscuro bg-azul-oscuro text-[clamp(16px,1.05vw,22px)] font-semibold text-white transition-transform hover:-translate-y-0.5 disabled:opacity-50"
              >
                {enviando ? 'Actualizando...' : 'Asignar rol'}
              </button>
            </div>
          </form>

          {/* Mensajes de error o éxito */}
          {error && (
            <div
              role="alert"
              className="absolute top-full left-[9vw] mt-[2vh] rounded-xl border border-red-400 bg-red-100 p-3 text-sm font-medium text-red-700"
            >
              {error}
            </div>
          )}
          {exito && (
            <div
              role="status"
              className="absolute top-full left-[9vw] mt-[2vh] rounded-xl border border-verde-agua bg-verde-agua/40 p-3 text-sm font-medium text-black"
            >
              {exito}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}