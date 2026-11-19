import { useCallback, useEffect, useState } from 'react';
import type { SessionResponse } from '@agenda/shared';


import { listarAsociaciones, type Asociacion } from '../../../lib/api/studentLinks';


type ResultadoAsociaciones =
  | { ok: true; datos: Asociacion[] }
  | { ok: false; mensaje: string };


async function pedirAsociaciones(
  accessToken: string,
  estudianteId: string,
): Promise<ResultadoAsociaciones> {

  try {
    const response = await listarAsociaciones(accessToken, estudianteId);


    // Si la API responde con error, devolvemos un mensaje según el código
    if (!response.ok) {
      if (response.status === 401){

        return { ok: false, mensaje: 'Tu sesión ha caducado. Vuelve a entrar' };

      } 

      if (response.status === 403) {
        
        return { ok: false, mensaje: 'No tienes permiso para ver las asociaciones' };

      }

      if (response.status === 503) {
        return { ok: false, mensaje: 'Servicio no disponible' };

      }

      return { ok: false, mensaje: 'No se pudieron cargar las asociaciones' };
    }

    const datos: Asociacion[] = await response.json();
    return { ok: true, datos };

  } catch {

    return { ok: false, mensaje: 'No se pudo conectar con el servidor' };

  }
}

// Carga las asociaciones del estudiante elegido. Se vuelve a pedir con recargar() tras alta, modificación o baja.
export function useAsociaciones(sesion: SessionResponse, estudianteId: string) {

  const [asociaciones, setAsociaciones] = useState<Asociacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const aplicarResultado = useCallback((resultado: ResultadoAsociaciones) => {

    if ('datos' in resultado) {
      setAsociaciones(resultado.datos);
      setError('');
    } else {
      setError(resultado.mensaje);
    }
    setCargando(false);
  }, []);

  const recargar = useCallback(async () => {

    aplicarResultado(await pedirAsociaciones(sesion.accessToken, estudianteId));
  }, [sesion.accessToken, estudianteId, aplicarResultado]);

  
  useEffect(() => {
    let cancelada = false;
    pedirAsociaciones(sesion.accessToken, estudianteId).then((resultado) => {
      if (!cancelada) aplicarResultado(resultado);
    });
    return () => {
      cancelada = true;
    };
  }, [sesion.accessToken, estudianteId, aplicarResultado]);

  return { asociaciones, cargando, error, recargar };
}