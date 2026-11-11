import { useState } from 'react';
import type { SessionResponse, UserRole, UserList } from '@agenda/shared';
import ListaUsuarios from '../../Componentes/ui/ListaUsuarios';
import { useUsuarios } from '../../Hooks/UseUsuarios';

interface GestionRolesProps {
  // Sesión del administrador para obtener el token Bearer
  sesion: SessionResponse;
}

type Roles = Extract<UserRole, 'student' | 'tutor' | 'family' | 'specialist' | 'teacher' | 'admin' >;

const ROLES: { valor: Roles; etiqueta: string }[] = [
  { valor: 'student', etiqueta: 'Estudiante' },
  { valor: 'tutor', etiqueta: 'Tutor' },
  { valor: 'family', etiqueta: 'Familiar' },
  { valor: 'specialist', etiqueta: 'Especialista' },
  { valor: 'teacher', etiqueta: 'Profesor' },
  { valor: 'admin', etiqueta: 'Administrador' },
];

const API_URL = 'http://localhost:3000/api';
const RUTA_USERS = '/users';

// Selector y botón de cada fila de la lista
const claseSelect = 'h-[clamp(36px,4vh,52px)] rounded-xl border-[1.5px] border-borde bg-transparent px-3 text-[clamp(14px,1vw,20px)] text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-azul-oscuro disabled:opacity-50 [&>option]:bg-white [&>option]:text-black';
const claseBotonPrimario = 'anillo-foco h-[clamp(36px,4vh,52px)] rounded-xl border-[1.5px] border-azul-oscuro bg-azul-oscuro px-5 text-[clamp(14px,1vw,20px)] font-semibold text-white disabled:opacity-50';

export default function GestionRolesAdmin({ sesion }: GestionRolesProps) {

  // Representa la lista de usuarios con su id guardado
  const { usuarios, cargando, error: errorCarga, recargar } = useUsuarios(sesion);

  // Guardamos el rol elegido en el selector de cada fila, guardado por id de usuario
  // En el caso de que no se ha tocado el selector de un usuario, se establece su rol actual
  const [rolesElegidos, setRolesElegidos] = useState<Record<string, UserRole>>({});

  // Cuando el cambio de rol del usuario se está procesando, usamos esta varible para bloquear los botones para evitar envíos duplicados
  const [enviandoId, setEnviandoId] = useState<string | null>(null);

  // Mensajes de estado
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  const cambiarRol = async (usuario: UserList, nuevoRol: UserRole) => {

    // Limpiamos mensajes previos y bloqueamos los botones
    setError('');
    setExito('');
    setEnviandoId(usuario.id);

    try {

      // Se obtiene el id del usuario que el administrador ha elegido en la lista
      const response = await fetch(`${API_URL}${RUTA_USERS}/${usuario.id}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sesion.accessToken}`,
        },
        body: JSON.stringify({ role: nuevoRol }),
      });

      // Si la API responde con error, mostramos el mensaje según el código HTTP devuelto por el backend
      if (!response.ok) {
        if (response.status === 401) {

          setError('Tu sesión ha caducado. Vuelve a entrar');

        } else if (response.status === 403) {

          setError('No tienes permiso para cambiar los roles ');

        } else if (response.status === 400) {

          setError('No puedes dar de baja tu propio usuario');

        } else if (response.status === 404) {

          setError('No se ha encontrado ningún usuario con ese identificador');

        } else if (response.status === 503) {

          setError('Servicio no disponible');

        } else {

          setError('No se pudo completar la baja del usuario');

        }
        return;
      }

      // Buscamos el objeto del rol en el array
      const rolEncontrado = ROLES.find((rol) => rol.valor === nuevoRol);

      // Si lo encontramos, cogemos su etiqueta; si no, devolvemos el rol tal cual
      let etiqueta: string = nuevoRol;
      if (rolEncontrado) {

          etiqueta = rolEncontrado.etiqueta;
      }

      setExito(`${usuario.fullName} ahora es ${etiqueta}`);
      await recargar();

    } catch {

      setError('No se pudo conectar con el servidor');

    } finally {
      // Da igual lo que pase, desbloqueamos botones
     setEnviandoId(null);

    }
  };

  return (
     <div>
      {/* Cabecera */}
      <div className="mb-[4vh] text-left">
        <h2 className="mb-[1.1vh] text-titulo font-bold leading-tight text-black">Gestión de roles</h2>
        <p className="text-subtitulo font-normal italic text-black">
          Elige un usuario y asígnale su nuevo rol
        </p>
      </div>

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

      {/* Lista con solo los usuarios activos */}
      <ListaUsuarios
        usuarios={usuarios.filter((usuario) => usuario.deactivatedAt === null)}
        cargando={cargando}
        error={errorCarga}
        renderAccion={(usuario) => {
          
          // El administrador no puede cambiarse su propio rol
          if (usuario.id === sesion.user.id) {
            return <span className="text-[clamp(13px,0.9vw,18px)] italic text-black">Tu usuario</span>;
          }

          // Miramos si el administrador ya ha seleccionado algún rol nuevo en el desplegable para ese usuario específico
          // Si no es así, asignamos a elegido el rol que tiene el usuario actualmente
          const elegido = rolesElegidos[usuario.id] ?? usuario.role;

          return (
            <div className="flex items-center gap-3">
              <select
                aria-label={`Nuevo rol de ${usuario.fullName}`}
                value={elegido}
                onChange={(e) => setRolesElegidos({ ...rolesElegidos, [usuario.id]: e.target.value as UserRole })}
                className={claseSelect}
                disabled={enviandoId !== null}
              >
                {ROLES.map((rol) => ( // Listamos los roles que hay
                  <option key={rol.valor} value={rol.valor}>
                    {rol.etiqueta}
                  </option>
                ))}
              </select>

              {/* Solo se puede pulsar si el rol elegido es distinto del actual */}
              <button
                type="button"
                className={claseBotonPrimario}
                disabled={enviandoId !== null || elegido === usuario.role}
                onClick={() => cambiarRol(usuario, elegido)}
              >
                {enviandoId === usuario.id ? 'Guardando...' : 'Asignar rol'}
              </button>
            </div>
          );
        }}
      />
    </div>
  );
}