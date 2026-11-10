import { useEffect, useState, type ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import type { UserRole } from '@agenda/shared';
import { leerSesion } from './sesion';

interface RutaProtegidaProps {
  // Roles que pueden entrar (por defecto, solo admin)
  roles?: UserRole[];
  // Opcional: si no se pasa, se pintan las rutas hijas (<Outlet />)
  children?: ReactNode;
}

// Cada cuánto se vuelve a comprobar si el token ha caducado (ms)
const REVISION_MS = 30_000;

/** Guardián de rutas: sin sesión válida (o con rol no permitido) redirige al login. */
export default function RutaProtegida({ roles = ['admin'], children }: RutaProtegidaProps) {
  const location = useLocation();
  // Solo sirve para forzar una nueva comprobación periódica (leerSesion borra el token caducado)
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), REVISION_MS);
    return () => clearInterval(id);
  }, []);

  const sesion = leerSesion();
  if (!sesion || !roles.includes(sesion.user.role)) {
    return <Navigate to="/" replace state={{ desde: location.pathname }} />;
  }

  return children ?? <Outlet />;
}