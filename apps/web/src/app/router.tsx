import { lazy, Suspense, type ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import type { SessionResponse } from '@agenda/shared';
import FlujoAcceso from './FlujoAcceso';
import RutaProtegida from '../features/auth/components/RutaProtegida';
import { leerSesion } from '../features/auth/session';
import AgendaEstudiantePage from '../features/agenda/pages/AgendaEstudiantePage';
import NuevaTareaPage from '../features/agenda/pages/NuevaTareaPage';
import ModificarTareaPage from '../features/agenda/pages/ModificarTareaPage';

// El panel de administración se carga solo cuando un admin entra en /admin.
const PanelAdmin = lazy(() => import('../features/admin/pages/PanelAdmin'));
const AltaUsuarioAdmin = lazy(() => import('../features/admin/pages/AltaUsuarioAdmin'));
const BajaUsuarioAdmin = lazy(() => import('../features/admin/pages/BajaUsuarioAdmin'));
const AsociacionesAdmin = lazy(() => import('../features/admin/pages/AsociacionesAdmin'));
const GestionRolesAdmin = lazy(
  () => import('../features/admin/pages/GestionRolesAdmin'),
);

// Igual con el panel del tutor: solo se descarga cuando entra en /tutor.
const PanelTutor = lazy(() => import('../features/tutor/pages/PanelTutor'));
const AsignarTareasTutor = lazy(() => import('../features/tutor/pages/AsignarTareasTutor'));
const EliminarTareasTutor = lazy(() => import('../features/tutor/pages/EliminarTareasTutor'));
const VisualizaAlumnosTutor = lazy(() => import('../features/tutor/pages/VisualizacionAlumnos'));


function ConSesion({ children }: { children: (sesion: SessionResponse) => ReactNode }) {
  const sesion = leerSesion();
  if (!sesion) return <Navigate to="/" replace />;
  return <>{children(sesion)}</>;
}

// Si ya hay sesión de admin o tutor, "/" lleva directamente a su panel.
function rutaPanel(sesion: SessionResponse | null): string | null {
  if (sesion?.user.role === 'admin') return '/admin';
  if (sesion?.user.role === 'tutor') return '/tutor';
  return null;
}

export default function AppRouter() {
  const panel = rutaPanel(leerSesion());

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
            <Route
              path="asociaciones"
              element={
                <ConSesion>{(sesion) => <AsociacionesAdmin sesion={sesion} />}</ConSesion>
              }
            />
          </Route>
        </Route>

        <Route path="/tutor" element={<RutaProtegida roles={['tutor']} />}>
          <Route element={<PanelTutor />}>
            <Route index element={<Navigate to="tareas/asignar" replace />} />
            <Route
              path="tareas/asignar"
              element={
                <ConSesion>{(sesion) => <AsignarTareasTutor sesion={sesion} />}</ConSesion>
              }
            />

            <Route
              path="tareas/eliminar"
              element={
                <ConSesion>{(sesion) => <EliminarTareasTutor sesion={sesion} />}</ConSesion>
              }
            />
            
            <Route index element={<Navigate to="alumnos" replace />} />
            <Route
              path="alumnos"
              element={
                <ConSesion>{(sesion) => <VisualizaAlumnosTutor sesion={sesion} />}</ConSesion>
              }
            />

          </Route>
        </Route>

        <Route path="/agenda/:estudianteId/nueva" element={<NuevaTareaPage />} />
        <Route path="/agenda/:estudianteId" element={<AgendaEstudiantePage />} />
        <Route path="/agenda/:estudianteId/modificar-tarea" element={<ModificarTareaPage />} />

        <Route
          path="/"
          element={panel ? <Navigate to={panel} replace /> : <FlujoAcceso />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}