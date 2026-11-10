import type { SessionResponse } from '@agenda/shared';

// Clave bajo la que se guarda la sesión en el navegador
const CLAVE = 'agenda.sesion';

// sessionStorage: se borra al cerrar la pestaña (más seguro para un panel de admin).
// Si quieres que sobreviva al cerrar el navegador, cambia a localStorage.
function almacen(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null; // modo privado / almacenamiento bloqueado
  }
}

// Lee la fecha de caducidad (exp, en segundos) del JWT. Si no se puede leer, lo damos por caducado.
function tokenCaducado(token: string): boolean {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const { exp } = JSON.parse(atob(payload)) as { exp?: number };
    return typeof exp !== 'number' || exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

export function guardarSesion(sesion: SessionResponse): void {
  almacen()?.setItem(CLAVE, JSON.stringify(sesion));
}

export function borrarSesion(): void {
  almacen()?.removeItem(CLAVE);
}

/** Devuelve la sesión guardada, o null si no hay, está corrupta o el token ha caducado. */
export function leerSesion(): SessionResponse | null {
  const crudo = almacen()?.getItem(CLAVE);
  if (!crudo) return null;

  try {
    const sesion = JSON.parse(crudo) as SessionResponse;
    if (!sesion?.accessToken || !sesion.user?.role || tokenCaducado(sesion.accessToken)) {
      borrarSesion();
      return null;
    }
    return sesion;
  } catch {
    borrarSesion();
    return null;
  }
}