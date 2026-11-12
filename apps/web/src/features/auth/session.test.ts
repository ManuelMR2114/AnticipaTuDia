import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SessionResponse } from '@agenda/shared';
import { borrarSesion, guardarSesion, leerSesion } from './session';

function jwt(expSegundos: number): string {
  const payload = btoa(JSON.stringify({ exp: expSegundos }))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return `cabecera.${payload}.firma`;
}

function sesionCon(expSegundos: number): SessionResponse {
  return {
    accessToken: jwt(expSegundos),
    refreshToken: 'refresh',
    user: { id: '1', fullName: 'Admin', role: 'admin' },
  };
}

describe('sesion', () => {
  beforeEach(() => {
    const datos = new Map<string, string>();
    const storage: Storage = {
      length: 0,
      clear: () => datos.clear(),
      getItem: (k) => datos.get(k) ?? null,
      key: () => null,
      removeItem: (k) => datos.delete(k),
      setItem: (k, v) => datos.set(k, v),
    };
    vi.stubGlobal('window', { sessionStorage: storage });
  });

  it('guarda y lee una sesión con token vigente', () => {
    const sesion = sesionCon(Math.floor(Date.now() / 1000) + 3600);
    guardarSesion(sesion);
    expect(leerSesion()).toEqual(sesion);
  });

  it('descarta y borra una sesión con token caducado', () => {
    guardarSesion(sesionCon(Math.floor(Date.now() / 1000) - 10));
    expect(leerSesion()).toBeNull();
    expect(leerSesion()).toBeNull();
  });

  it('descarta una sesión corrupta', () => {
    window.sessionStorage.setItem('agenda.sesion', '{no-es-json');
    expect(leerSesion()).toBeNull();
  });

  it('borrarSesion elimina la sesión guardada', () => {
    guardarSesion(sesionCon(Math.floor(Date.now() / 1000) + 3600));
    borrarSesion();
    expect(leerSesion()).toBeNull();
  });
});
