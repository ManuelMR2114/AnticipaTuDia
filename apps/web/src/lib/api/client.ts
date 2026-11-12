// Cliente HTTP único de la web: base URL, token y cabeceras en un solo sitio.
// Las pantallas siguen traduciendo cada código HTTP a su mensaje, por eso
// devolvemos la Response tal cual en lugar de lanzar errores aquí.
// No hay refresh de token: el backend no expone endpoint de refresh, así que
// cuando el accessToken caduca `leerSesion` lo descarta y se vuelve al login.

export const API_URL: string =
  import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

export interface ApiOptions extends Omit<RequestInit, 'body'> {
  token?: string;
  body?: unknown;
}

export function apiFetch(path: string, options: ApiOptions = {}): Promise<Response> {
  const { token, body, headers, ...init } = options;
  return fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}
