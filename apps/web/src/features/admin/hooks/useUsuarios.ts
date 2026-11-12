import { useCallback, useEffect, useState } from 'react';
import type { SessionResponse, UserSummary } from '@agenda/shared';
import { listarUsuarios } from '../../../lib/api/users';

// Resultado de pedir la lista: o los usuarios, o el mensaje de error a mostrar
type ResultadoUsuarios =
  | { ok: true; datos: UserSummary[] }
  | { ok: false; mensaje: string };

// Pide la lista de usuarios a la API y traduce los códigos HTTP a mensajes
async function pedirUsuarios(accessToken: string): Promise<ResultadoUsuarios> {
  try {
    const response = await listarUsuarios(accessToken);

    // Si la API responde con error, devolvemos un mensaje según el código
    if (!response.ok) {
      if (response.status === 401) {
        return { ok: false, mensaje: 'Tu sesión ha caducado. Vuelve a entrar' };
      }
      if (response.status === 403) {
        return { ok: false, mensaje: 'No tienes permiso para ver los usuarios' };
      }
      if (response.status === 503) {
        return { ok: false, mensaje: 'Servicio no disponible' };
      }
      return { ok: false, mensaje: 'No se pudo cargar la lista de usuarios' };
    }

    const datos: UserSummary[] = await response.json();
    return { ok: true, datos };
  } catch {
    return { ok: false, mensaje: 'No se pudo conectar con el servidor' };
  }
}

// Cargamos la lista de usuarios para el admin
// El id de cada usuario se queda guardado aquí pero no se muestra por pantalla. Es necesario para dar de baja y cambiar roles para identificar al usuario que queremos realizarle la baja o el cambio.
export function useUsuarios(sesion: SessionResponse) {

  // Definimos los usuarios tal como los devuelve la API
  const [usuarios, setUsuarios] = useState<UserSummary[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  // Pasa el resultado de la petición al estado y deja de mostrar "Cargando"
  const aplicarResultado = useCallback((resultado: ResultadoUsuarios) => {
    if (resultado.ok) {
      // Guardamos los usuarios con su ID y quitamos cualquier error anterior
      setUsuarios(resultado.datos);
      setError('');
    } else {
      setError(resultado.mensaje);
    }
    setCargando(false);
  }, []);

  // Usamos useCallback para poder recargar tras una baja o un cambio de rol sin que se repita la accion
  const recargar = useCallback(async () => {
    aplicarResultado(await pedirUsuarios(sesion.accessToken));
  }, [sesion.accessToken, aplicarResultado]);

  // Usamos el useEffect para que al abrir la pantalla pida la lista el admin.
  // Si la pantalla se cierra antes de que llegue la respuesta, la ignoramos.
  useEffect(() => {
    let cancelada = false;
    pedirUsuarios(sesion.accessToken).then((resultado) => {
      if (!cancelada) {
        aplicarResultado(resultado);
      }
    });
    return () => {
      cancelada = true;
    };
  }, [sesion.accessToken, aplicarResultado]);

  return { usuarios, cargando, error, recargar };
}
