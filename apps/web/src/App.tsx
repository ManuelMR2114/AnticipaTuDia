//enrutador, en lugar de usar urls distintas para cada paso del inicio de sesion, maneja el flujo
//de acceso seleecion rol, clase, alumno y login, intercambiando componentes segun el estado
//de vista actual . Ademas se configura react route para proteger el area de admin´

//se envuelve toda la app con accesibilidadprovider para qeu los ajustes persistean en
//todas las pantallas

import { useState } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router';
import type { Classroom, SessionResponse } from '@agenda/shared';


//importacion de las distinta pantallas que forman el flujo del login 
import SeleccionRol from './Pantallas/acceso/SeleccionRol';
import InicioSesionClase from './Pantallas/alumno/InicioSesionClase';
import SeleccionEstudiante from './Pantallas/alumno/SeleccionEstudiante';
import InicioSesionCodigo from './Pantallas/alumno/InicioSesionCodigo';
import InicioSesionPictogramas from './Pantallas/alumno/InicioSesionPictogramas';
import InicioSesionPatron from './Pantallas/alumno/InicioSesionPatron';
import AltaUsuarioAdmin from './Pantallas/admin/AltaUsuarioAdmin';
import BajaUsuarioAdmin from './Pantallas/admin/BajaUsuarioAdmin';
import GestionRolesAdmin from './Pantallas/admin/GestionRolesAdmin';
import type { EstudianteConMetodo } from './Tipos/metodoLogin';
import InicioSesionTutorFamilia, { type RolPersonal } from './Pantallas/acceso/InicioSesionTutorFamilia';


import RutaProtegida from './Componentes/sesion/RutaProtegida';
import PanelAdmin from './Pantallas/admin/PanelAdmin';
import { guardarSesion, leerSesion } from './Utilidades/sesion';

//provider para guardar el tamaño de texto y el contraste para todas las pantallas
import AccesibilidadProvider from './Contextos/AccesibilidadProvider';
import './index.css';



//tipos de vista tipados para evitar fallos al escribirlas 
type Vista =
  | 'seleccion-rol'
  | 'inicio-clase'
  | 'seleccion-estudiante'
  | 'login-estudiante-codigo'
  | 'login-estudiante-pictograma'
  | 'login-estudiante-patron'
  | 'login-tutor-familia-administrador';

// Flujo de acceso (selección de rol y logins). Vive en "/"

//componente qque encapsula todo el proceso de autenticacion 
function FlujoAcceso() {
  const navigate = useNavigate();

  //pantalla que se muestra ahora mismo
  const [vistaActual, setVistaActual] = useState<Vista>('seleccion-rol');

  //rol que se le pasa al login de tutor/familia/administrador 
  const [rolSeleccionado, setRolSeleccionado] = useState<RolPersonal>('tutor');

  //aula que ha elegido el alumno, se necesita en la pantalla ¿Quién eres? para pedir sus compañeros
  const [aulaSeleccionada, setAulaSeleccionada] = useState<Classroom | null>(null);

  //guarda el objeto completo del estudiante para saber como debe loguearse (patron,pin..)
  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState<EstudianteConMetodo | null>(null);

  //aviso cuando el alumno no puede entrar porque no se le ha asignado metodo 
  const [avisoLogin, setAvisoLogin] = useState<string | null>(null);

  
  //almacena la sesion devuelta por el backend tras un login correcto
  const [, setSesion] = useState<SessionResponse | null>(null);

  //funcion auxiliar para centrarlizar los roles tutor/familia... porque usan
  //la misma pantalla
  const abrirLogin = (rol: RolPersonal) => {
    setRolSeleccionado(rol);
    setVistaActual('login-tutor-familia-administrador');
  };

  return (
    <div className="app-container">



        {/*-------------------PANTALLA SELECCIÓN ROL-----------------------------*/}
        {vistaActual === 'seleccion-rol' && (
          <SeleccionRol
            //estudiante, elige su clase
            onSeleccionarEstudiante={() => setVistaActual('inicio-clase')}
            //Tutor/familia/admin mismo login con rol distinto
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
        {/*doble validacion de que se este en la pantalla y tener el aula seleccionada ya*/}
        {vistaActual === 'seleccion-estudiante' && aulaSeleccionada && (
          <SeleccionEstudiante
            aula={aulaSeleccionada}
            onVolver={() => setVistaActual('inicio-clase')}
            aviso={avisoLogin}
            onSeleccionarEstudiante={(estudiante: EstudianteConMetodo) => {
              setAvisoLogin(null);
              setEstudianteSeleccionado(estudiante);
              //cada alumno entra con su metodo
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
                  setAvisoLogin('Este método de acceso aún no está disponible.');
              }
            }}
          />
        )}
        {/*---------------------PANTALLA ¿QUIÉN ERES?----------------------------*/}



        {/*---------------------PANTALLA LOGIN ALUMNO (CÓDIGO)----------------------------*/}
        {/*tb doble validacion*/}
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
              //guardamos la sesion 
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
    
    //accesibilidadprovider tiene que envolver todo porque asi el boton de accesibilidad
    //funciona en cualquiera de ellas y mantiene su estado si camiba de vista
    <AccesibilidadProvider>
      <Routes>

        {/*-------RUTA-PROTEGIDA------*/}

        {/* ruta /admin envuelve todas las rutas hijas con el componente rutaprotegida
            si el usuario no tiene el rol admin este componetne no permite el paso */}
        <Route path="/admin" element={<RutaProtegida roles={['admin']} />}>
          <Route element={<PanelAdmin />}>
            {/* Al entrar a /admin, redirige directamente al formulario de alta */}
            <Route index element={<Navigate to="usuarios/alta" replace />} />
            
            {/* Rutas reales de gestión de usuarios */}
            <Route 
              path="usuarios/alta" 
              element={<AltaUsuarioAdmin sesion={leerSesion()!} onVolver={() => window.history.back()} />} 
            />
            <Route 
              path="usuarios/baja" 
              element={<BajaUsuarioAdmin sesion={leerSesion()!} onVolver={() => window.history.back()} />} 
            />
            <Route 
              path="usuarios/roles" 
              element={<GestionRolesAdmin sesion={leerSesion()!} onVolver={() => window.history.back()} />} 
            />

          </Route>
        </Route>



        {/*-------RUTA-PUBLICA /LOGIN------*/}

        {/*un admin con sesion activa no necesita ver el login */}
        <Route
          path="/"
          element={leerSesion()?.user.role === 'admin' ? <Navigate to="/admin" replace /> : <FlujoAcceso />}
        />

        {/*Las rutas no encontras se van al inicio*/}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>

    </AccesibilidadProvider>
  );
}