import { useState } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router';
import type { Classroom, SessionResponse } from '@agenda/shared';

import SeleccionRol from './SeleccionRol';
import InicioSesionClase from './InicioSesionClase';
import SeleccionEstudiante from './SeleccionEstudiante';
import InicioSesionCodigo from './InicioSesionCodigo';
import InicioSesionPictogramas from './InicioSesionPictogramas';
import InicioSesionPatron from './InicioSesionPatron';
import type { EstudianteConMetodo } from './metodoLogin';
import InicioSesionTutorFamilia, { type RolPersonal } from './InicioSesionTutorFamilia';
import RutaProtegida from './RutaProtegida';
import PanelAdmin from './PanelAdmin';
import { guardarSesion, leerSesion } from './sesion';

// Provider para guardar el tamaño de texto y el contraste para todas las pantallas
import AccesibilidadProvider from './AccesibilidadProvider';
import './index.css';

// Tipos de vistas posibles
type Vista =
  | 'seleccion-rol'
  | 'inicio-clase'
  | 'seleccion-estudiante'
  | 'login-estudiante-codigo'
  | 'login-estudiante-pictograma'
  | 'login-estudiante-patron'
  | 'login-tutor-familia-administrador';

// Flujo de acceso (selección de rol y logins). Vive en "/"
function FlujoAcceso() {
  const navigate = useNavigate();

  // Pantalla que se muestra ahora mismo
  const [vistaActual, setVistaActual] = useState<Vista>('seleccion-rol');

  // Rol que se le pasa al login de tutor/familia/administrador (valor inicial: tutor)
  const [rolSeleccionado, setRolSeleccionado] = useState<RolPersonal>('tutor');

  // Aula que ha elegido el alumno (Classroom); la necesita la pantalla "¿Quién eres?" para pedir sus compañeros
  const [aulaSeleccionada, setAulaSeleccionada] = useState<Classroom | null>(null);

  // Alumno que ha elegido en "¿Quién eres?"; lo necesita su pantalla de login
  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState<EstudianteConMetodo | null>(null);

  // Aviso cuando el alumno no puede entrar todavía (sin método o método sin pantalla)
  const [avisoLogin, setAvisoLogin] = useState<string | null>(null);

  // Guarda la sesión que devuelve la API al entrar.
  // [, setSesion]: no leemos el valor todavía, solo necesitamos la función para guardarlo.
  const [, setSesion] = useState<SessionResponse | null>(null);

  // Tutor, familia y administrador usan la misma pantalla cambiando solo el rol
  const abrirLogin = (rol: RolPersonal) => {
    setRolSeleccionado(rol);
    setVistaActual('login-tutor-familia-administrador');
  };

  return (
    <div className="app-container">



        {/*-------------------PANTALLA SELECCIÓN ROL-----------------------------*/}
        {vistaActual === 'seleccion-rol' && (
          <SeleccionRol
            // Estudiante -> elige su clase
            onSeleccionarEstudiante={() => setVistaActual('inicio-clase')}
            // Tutor, familia y admin -> mismo login, con rol distinto
            onSeleccionarTutor={() => abrirLogin('tutor')}
            onSeleccionarFamilia={() => abrirLogin('family')}
            onSeleccionarAdmin={() => abrirLogin('admin')}
          />
        )}
        {/*-------------------PANTALLA SELECCIÓN ROL-----------------------------*/}



        {/*---------------------PANTALLA ELIGE TU CLASE----------------------------*/}
        {vistaActual === 'inicio-clase' && (
          <InicioSesionClase
            onVolver={() => setVistaActual('seleccion-rol')}
            onSeleccionarClase={(aula) => {
              setAulaSeleccionada(aula);
              setVistaActual('seleccion-estudiante');
            }}
          />
        )}
        {/*---------------------PANTALLA ELIGE TU CLASE----------------------------*/}




        {/*---------------------PANTALLA ¿QUIÉN ERES?----------------------------*/}
        {vistaActual === 'seleccion-estudiante' && aulaSeleccionada && (
          <SeleccionEstudiante
            aula={aulaSeleccionada}
            onVolver={() => setVistaActual('inicio-clase')}
            aviso={avisoLogin}
            onSeleccionarEstudiante={(estudiante: EstudianteConMetodo) => {
              setAvisoLogin(null);
              setEstudianteSeleccionado(estudiante);
              // Cada alumno entra con su método (profiles.login_method)
              switch (estudiante.loginMethod) {
                case 'pin':
                  setVistaActual('login-estudiante-codigo');
                  break;
                case 'pictogram':
                  setVistaActual('login-estudiante-pictograma');
                  break;
                case 'pattern':
                  setVistaActual('login-estudiante-patron');
                  break;
                case null:
                  setAvisoLogin(`${estudiante.fullName} aún no tiene método de acceso. Pide ayuda a tu tutor.`);
                  break;
                default:
                  // password: pantalla pendiente
                  setAvisoLogin('Este método de acceso aún no está disponible.');
              }
            }}
          />
        )}
        {/*---------------------PANTALLA ¿QUIÉN ERES?----------------------------*/}



        {/*---------------------PANTALLA LOGIN ALUMNO (CÓDIGO)----------------------------*/}
        {vistaActual === 'login-estudiante-codigo' && estudianteSeleccionado && (
          <InicioSesionCodigo
            estudiante={estudianteSeleccionado}
            onVolver={() => setVistaActual('seleccion-estudiante')}
            onLoginExitoso={(sessionData) => {
              setSesion(sessionData);
              console.log(`Acceso completado como ${sessionData.user.role}`);
            }}
          />
        )}
        {/*---------------------PANTALLA LOGIN ALUMNO (CÓDIGO)----------------------------*/}

         {/*---------------------PANTALLA LOGIN ALUMNO (PICTOGRAMA)----------------------------*/}
        {vistaActual === 'login-estudiante-pictograma' && estudianteSeleccionado && (
          <InicioSesionPictogramas
            estudiante={estudianteSeleccionado}
            onVolver={() => setVistaActual('seleccion-estudiante')}
            onLoginExitoso={(sessionData) => {
              setSesion(sessionData);
              console.log(`Acceso completado como ${sessionData.user.role}`);
            }}
          />
        )}
        {/*---------------------PANTALLA LOGIN ALUMNO (PICTOGRAMA)----------------------------*/}



        {/*---------------------PANTALLA LOGIN ALUMNO (PATRÓN)----------------------------*/}
        {vistaActual === 'login-estudiante-patron' && estudianteSeleccionado && (
          <InicioSesionPatron
            estudiante={estudianteSeleccionado}
            onVolver={() => setVistaActual('seleccion-estudiante')}
            onLoginExitoso={(sessionData) => {
              setSesion(sessionData);
              console.log(`Acceso completado como ${sessionData.user.role}`);
            }}
          />
        )}
        {/*---------------------PANTALLA LOGIN ALUMNO (PATRÓN)----------------------------*/}



        {/*---------------------PANTALLA LOGIN TUTOR/FAMILIA/ADMIN----------------------------*/}
        {vistaActual === 'login-tutor-familia-administrador' && (
          <InicioSesionTutorFamilia
            rol={rolSeleccionado}
            onVolver={() => setVistaActual('seleccion-rol')}
            onLoginExitoso={(sessionData) => {
              // Guardamos la sesión (estado + navegador)
              guardarSesion(sessionData);
              setSesion(sessionData);
              if (sessionData.user.role === 'admin') navigate('/admin', { replace: true });
              console.log(`Acceso completado como ${sessionData.user.role}`);
            }}
          />
        )}
        {/*---------------------PANTALLA LOGIN TUTOR/FAMILIA/ADMIN----------------------------*/}




    </div>
  );
}

export default function App() {
  return (
    // Debe envolver todas las pantallas, así el botón de accesibilidad
    // funciona en cualquiera de ellas y mantiene su estado al cambiar de vista
    <AccesibilidadProvider>
      <Routes>
        {/* Zona de administración: solo con sesión válida de admin */}
        <Route path="/admin" element={<RutaProtegida roles={['admin']} />}>
          <Route element={<PanelAdmin />}>
            <Route index element={<Navigate to="usuarios" replace />} />
            {/* Tarea 3: sustituir por el listado de usuarios */}
            <Route path="usuarios" element={<h1 className="text-titulo font-bold text-black">Usuarios</h1>} />
            {/* Tarea 4: <Route path="usuarios/:id" ... /> */}
          </Route>
        </Route>

        {/* Un admin con sesión activa no necesita ver el login */}
        <Route
          path="/"
          element={leerSesion()?.user.role === 'admin' ? <Navigate to="/admin" replace /> : <FlujoAcceso />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AccesibilidadProvider>
  );
}