import { useState } from 'react';
import type { SessionResponse, UserList } from '@agenda/shared';
import ListaUsuarios from '../../Componentes/ui/ListaUsuarios';
import { useUsuarios } from '../../Hooks/UseUsuarios';

interface BajaUsuarioProps {
  // Sesión del administrador que es el token que exige la API para dar de baja
  sesion: SessionResponse;
}

const API_URL = 'http://localhost:3000/api';
const RUTA_BAJA_USUARIO = '/users';

const claseInput = 'h-[clamp(44px,4.6vh,60px)] w-full rounded-xl border-[1.5px] border-borde bg-transparent px-5 text-[clamp(16px,1.1vw,22px)] text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-azul-oscuro disabled:opacity-50';
const claseLabel = 'mb-[1.2vh] block text-[clamp(18px,1.5vw,30px)] font-semibold text-black';

// Botones de cada fila de la lista
const claseBotonPrimario = 'anillo-foco h-[clamp(36px,4vh,52px)] rounded-xl border-[1.5px] border-azul-oscuro bg-azul-oscuro px-5 text-[clamp(14px,1vw,20px)] font-semibold text-white disabled:opacity-50';
const claseBotonSecundario = 'anillo-foco h-[clamp(36px,4vh,52px)] rounded-xl border-[1.5px] border-borde bg-transparent px-5 text-[clamp(14px,1vw,20px)] font-semibold text-black disabled:opacity-50';

export default function BajaUsuarioAdmin({ sesion }: BajaUsuarioProps) {

  // Representa la lista de usuarios con su id guardado
  const { usuarios, cargando, error: errorCarga, recargar } = useUsuarios(sesion);

  // Para evitar fallos de dar de baja a un usuario sin querer, definimos esta variable para mostrar los botones de doble verificación, es decir, confirmar o cancelar. Así prevenimos el error.
  const [confirmandoId, setConfirmandoId] = useState<string | null>(null);
  
  // Cuando la baja del usuario se está procesando, usamos esta varible para bloquear los botones para evitar envíos duplicados
  const [enviandoId, setEnviandoId] = useState<string | null>(null);

  // Mensajes de error o confirmación de la baja
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  const darDeBaja = async (usuario: UserList) => {

    // Limpiamos mensajes previos y bloqueamos los botones
    setError('');
    setExito('');
    setEnviandoId(usuario.id);

    try {
      
      // Se obtiene el id del usuario que el administrador ha elegido en la lista

      const response = await fetch(`${API_URL}${RUTA_BAJA_USUARIO}/${usuario.id}/deactivate`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sesion.accessToken}`,
        },
      });

      // Si la API responde con error, mostramos el mensaje según el código HTTP devuelto por el backend
      if (!response.ok) {
        if (response.status === 401) {

          setError('Tu sesión ha caducado. Vuelve a entrar');

        } else if (response.status === 403) {

          setError('No tienes permiso para dar de baja usuarios');

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

      setExito(`${usuario.fullName} se ha dado de baja correctamente`);
      
      // Recargamos la lista para que desaparezca con la funcion cargar definida en UseUsuarios a traves de recargar
      await recargar();

    } catch {

      setError('No se pudo conectar con el servidor');

    } finally {

      // Da igual lo que pase, desbloqueamos los botones y cerramos la confirmación
      setEnviandoId(null);
      setConfirmandoId(null);
    }
  };

  return (
    <div>
      {/* Cabecera */}
      <div className="mb-[4vh] text-left">
        <h2 className="mb-[1.1vh] text-titulo font-bold leading-tight text-black">Baja de usuario</h2>
        <p className="text-subtitulo font-normal italic text-black">
          Elige al usuario que deseas desactivar
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
        usuarios={usuarios.filter((usuario) => u.deactivatedAt === null)}
        cargando={cargando}
        error={errorCarga}
        renderAccion={(usuario) => {
          
          // El administrador no puede darse de baja a sí mismo 
          if (u.id === sesion.user.id) {
            return <span className="text-[clamp(13px,0.9vw,18px)] italic text-black">Tu usuario</span>;
          }

          // Confirmar o cancelar
          if (confirmandoId === u.id) {
            return (
              <div className="flex gap-3">
                <button type="button" className={claseBotonPrimario} disabled={enviandoId !== null} onClick={() => darDeBaja(u)}>
                  {enviandoId === u.id ? 'Procesando...' : 'Confirmar baja'}
                </button>
                <button type="button" className={claseBotonSecundario} disabled={enviandoId !== null} onClick={() => setConfirmandoId(null)}>
                  Cancelar
                </button>
              </div>
            );
          }

          // Pedir la baja
          return (
            <button type="button" className={claseBotonSecundario} disabled={enviandoId !== null} onClick={() => setConfirmandoId(u.id)}>
              Dar de baja
            </button>
          );
        }}
      />
    </div>
    
  );
}