import { useState, type ReactNode } from 'react';
import type { UserList, UserRole } from '@agenda/shared';

type RolLista = Extract<UserRole, 'student' | 'tutor' | 'family' | 'specialist' | 'teacher' | 'admin' >;

// Etiqueta en español de cada rol, para mostrarla junto al nombre del usuario
const ROLES: Record<RolLista, string> = {
  student: 'Estudiante',
  tutor: 'Tutor',
  family: 'Familiar',
  specialist: 'Especialista',
  teacher: 'Profesor',
  admin: 'Administrador',
};

interface ListaUsuariosProps {
  usuarios: UserList[];
  cargando: boolean;
  error: string;

  // Usamos renderAccion para que aparezca a la derecha de cada usuario lo que se necesite para la acción determinada ya sea un boton para la baja o un selector.
  // Gracias a esto hacemos que ListaUsuarios sea reutilizable, solo se encarga de pintar la lista de usuarios y gestionar la lista sin saber la acción que se va a realizar.
  renderAccion: (usuario: UserList) => ReactNode;

}

export default function ListaUsuarios({ usuarios, cargando, error, renderAccion }: ListaUsuariosProps) {

  // Para buscar al usuario por el nombre en la lista
  const [busqueda, setBusqueda] = useState('');

  // Añadimos a la pantalla el mensaje de cargando usuarios
  if (cargando) {

    return <p role="status" className="text-subtitulo italic text-black">Cargando usuarios...</p>;

  }

  // Si hay error, se añade a la pantalla-
  if (error) {
    return (
      <div role="alert" className="rounded-xl border border-red-400 bg-red-100 p-3 text-sm font-medium text-red-700">
        {error}
      </div>
    );
  }

  // Filtramos por nombre sin distinguir mayúsculas
  const filtrados = usuarios.filter((usuario) =>
    usuario.fullName.toLowerCase().includes(busqueda.trim().toLowerCase()),
  );

  return (
    <div>
      {/* Buscador */}
      <label htmlFor="buscar-usuario" className="mb-[1.2vh] block text-[clamp(18px,1.5vw,30px)] font-semibold text-black">
        Buscar por nombre
      </label>
      <input
        id="buscar-usuario"
        type="search"
        autoComplete="off"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        className="mb-[3vh] h-[clamp(44px,4.6vh,60px)] w-full max-w-[520px] rounded-xl border-[1.5px] border-borde bg-transparent px-5 text-[clamp(16px,1.1vw,22px)] text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-azul-oscuro"
      />

      {filtrados.length === 0 ? (
        <p className="text-subtitulo italic text-black">No hay usuarios que mostrar</p>
      ) : (
        <ul className="flex flex-col gap-[1.4vh]">
          {filtrados.map((usuario) => ( // Se usa de clave el id pero no se escribe en pantalla
            
            <li
              key={usuario.id}
              className="flex items-center justify-between gap-4 rounded-xl border-[1.5px] border-borde px-5 py-3"
            >
              {/* Parte Izquierda que identifica al usuario */}
              <div className="min-w-0">
                <p className="truncate text-[clamp(16px,1.2vw,24px)] font-semibold text-black">{usuario.fullName}</p>
                <p className="truncate text-[clamp(13px,0.9vw,18px)] text-black">
                  {ROLES[usuario.role]}
                  {usuario.email ? ` · ${usuario.email}` : ''}
                </p>
              </div>

              {/* Parte Derecha que especifica las acciones sobre ese usuario */}
              <div className="shrink-0">{renderAccion(usuario)}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}