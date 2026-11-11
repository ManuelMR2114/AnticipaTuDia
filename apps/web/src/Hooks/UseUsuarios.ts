import { useCallback, useEffect, useState } from 'react';
import type { SessionResponse, UserList } from '@agenda/shared';

const API_URL = 'http://localhost:3000/api';

// Cargamos la lista de usuarios para el admin
// El id de cada usuario se queda guardado aquí pero no se muestra por pantalla. Es necesario para dar de baja y cambiar roles para identificar al usuario que queremos realizarle la baja o el cambio.
export function useUsuarios(sesion: SessionResponse) {

  // Definimos los usuarios tal como los devuelve la API
  const [usuarios, setUsuarios] = useState<UserList[]>([]);
 

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  // Usamos useCallback para poder recargar tras una baja o un cambio de rol sin que se repita la accion
  const cargar = useCallback(async () => {

    try {

      const response = await fetch(`${API_URL}/users`, {
        headers: { Authorization: `Bearer ${sesion.accessToken}` },
      });

      // Si la API responde con error, mostramos un mensaje según el código y paramos aquí
      if (!response.ok) {

        if (response.status === 401){

            setError('Tu sesión ha caducado. Vuelve a entrar');

        } else if (response.status === 403) { 

            setError('No tienes permiso para ver los usuarios');

        } else if (response.status === 503) {

             setError('Servicio no disponible');
        
        } else {

            setError('No se pudo cargar la lista de usuarios');
        }

        return;
      }

      // Guardamos los usuarios con su ID y quitamos cualquier error anterior
      const datos: UserList[] = await response.json();
      setUsuarios(datos);
      setError('');

    } catch {

      setError('No se pudo conectar con el servidor');

    } finally {

      // Da igual lo que pase, dejamos de mostrar "Cargando"
      setCargando(false);

    }

  }, [sesion.accessToken]);

  // Usamos el useEffect para que al abrir la pantalla pida la lista el admin
  useEffect(() => {
    cargar();
  }, [cargar]);

  return { usuarios, cargando, error, recargar: cargar };
}