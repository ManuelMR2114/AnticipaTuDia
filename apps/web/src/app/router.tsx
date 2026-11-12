import { lazy, Suspense, type ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import type { SessionResponse } from '@agenda/shared';
import FlujoAcceso from './FlujoAcceso';
import RutaProtegida from '../features/auth/components/RutaProtegida';
import { leerSesion } from '../features/auth/session';

// El panel de administración se carga solo cuando un admin entra en /admin.
const PanelAdmin = lazy(() => import('../features/admin/pages/PanelAdmin'));
const AltaUsuarioAdmin = lazy(() => import('../features/admin/pages/AltaUsuarioAdmin'));
const BajaUsuarioAdmin = lazy(() => import('../features/admin/pages/BajaUsuarioAdmin'));
const GestionRolesAdmin = lazy(
  () => import('../features/admin/pages/GestionRolesAdmin'),
);

function ConSesion({ children }: { children: (sesion: SessionResponse) => ReactNode }) {
  const sesion = leerSesion();
  if (!sesion) return <Navigate to="/" replace />;
  return <>{children(sesion)}</>;
}

export default function AppRouter() {
  return (
    <Suspense
      fallback={
        <p role="status" className="p-8 text-subtitulo italic text-black">
          Cargando…
        </p>
      }
    >
      <Routes>
        <Route path="/admin" element={<RutaProtegida roles={['admin']} />}>
          <Route element={<PanelAdmin />}>
            <Route index element={<Navigate to="usuarios/alta" replace />} />
            <Route
              path="usuarios/alta"
              element={
                <ConSesion>{(sesion) => <AltaUsuarioAdmin sesion={sesion} />}</ConSesion>
              }
            />
            <Route
              path="usuarios/baja"
              element={
                <ConSesion>{(sesion) => <BajaUsuarioAdmin sesion={sesion} />}</ConSesion>
              }
            />
            <Route
              path="usuarios/roles"
              element={
                <ConSesion>
                  {(sesion) => <GestionRolesAdmin sesion={sesion} />}
                </ConSesion>
              }
            />
          </Route>
        </Route>

        <Route
          path="/"
          element={
            leerSesion()?.user.role === 'admin' ? (
              <Navigate to="/admin" replace />
            ) : (
              <FlujoAcceso />
            )
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
