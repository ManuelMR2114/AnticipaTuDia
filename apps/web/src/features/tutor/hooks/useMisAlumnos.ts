import { useEffect, useState } from 'react';
import type { MyStudent, SessionResponse } from '@agenda/shared';
import { listarMisAlumnos } from '../../../lib/api/studentLinks';

type ResultadoAlumnos =
  | { ok: true; datos: MyStudent[] }
  | { ok: false; mensaje: string };

async function pedirAlumnos(token: string): Promise<ResultadoAlumnos> {
  try {

    const response = await listarMisAlumnos(token);

    if (!response.ok) {

      if (response.status === 401) return { ok: false, mensaje: 'Tu sesión ha caducado. Vuelve a entrar' };
      if (response.status === 403) return { ok: false, mensaje: 'No tienes permiso para ver tus alumnos' };
      if (response.status === 503) return { ok: false, mensaje: 'Servicio no disponible' };

      return { ok: false, mensaje: 'No se pudo cargar la lista de alumnos' };

    }

    const datos: unknown = await response.json();
    
    /** Para evitar que si la api devuelva un formato que no sea una lista se rompa la pantalla */
    if (!Array.isArray(datos)) return { ok: false, mensaje: 'La API ha devuelto un formato inesperado' };

    return { ok: true, datos: datos as MyStudent[] };
    
  } catch {

    return { ok: false, mensaje: 'No se pudo conectar con el servidor' };

  }
}

/** Alumnos asignados a quien tiene la sesión (HU-10). */
export function useMisAlumnos(sesion: SessionResponse) {

  const [alumnos, setAlumnos] = useState<MyStudent[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {

    let cancelada = false;
    pedirAlumnos(sesion.accessToken).then((r) => {

        if (cancelada) return;

        if ('datos' in r) {

          setAlumnos(r.datos);
          setError('');

        } else {

        setError(r.mensaje);

        }

        setCargando(false);

    });
    return () => {

        cancelada = true;
    };
    }, [sesion.accessToken]);

  return { alumnos, cargando, error };
}