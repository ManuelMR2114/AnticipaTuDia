import { useState } from 'react';
import type { Classroom, SessionResponse } from '@agenda/shared';

import SeleccionRol from './SeleccionRol';
import InicioSesionClase from './InicioSesionClase';
import SeleccionEstudiante from './SeleccionEstudiante';
import InicioSesionTutorFamilia, { type RolPersonal } from './InicioSesionTutorFamilia';

// Provider para guardar el tamaño de texto y el contraste para todas las pantallas
import AccesibilidadProvider from './AccesibilidadProvider';
import './index.css';

// Tipos de vistas posibles
type Vista =
  | 'seleccion-rol'
  | 'inicio-clase'
  | 'seleccion-estudiante'
  | 'login-tutor-familia-administrador';

export default function App() {
  // Pantalla que se muestra ahora mismo
  const [vistaActual, setVistaActual] = useState<Vista>('seleccion-rol');

  // Rol que se le pasa al login de tutor/familia/administrador (valor inicial: tutor)
  const [rolSeleccionado, setRolSeleccionado] = useState<RolPersonal>('tutor');

  // Aula que ha elegido el alumno (Classroom); la necesita la pantalla "¿Quién eres?" para pedir sus compañeros
  const [aulaSeleccionada, setAulaSeleccionada] = useState<Classroom | null>(null);

  // Guarda la sesión que devuelve la API al entrar.
  // [, setSesion]: no leemos el valor todavía, solo necesitamos la función para guardarlo.
  const [, setSesion] = useState<SessionResponse | null>(null);

  // Tutor, familia y administrador usan la misma pantalla cambiando solo el rol
  const abrirLogin = (rol: RolPersonal) => {
    setRolSeleccionado(rol);
    setVistaActual('login-tutor-familia-administrador');
  };

  return (
    // Debe envolver todas las pantallas, así el botón de accesibilidad
    // funciona en cualquiera de ellas y mantiene su estado al cambiar de vista
    <AccesibilidadProvider>
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
            onSeleccionarEstudiante={(estudiante) => {
              // TODO: siguiente paso del login del alumno (pictogramas)
              console.log(`Alumno elegido: ${estudiante.fullName} (${estudiante.id})`);
            }}
          />
        )}
        {/*---------------------PANTALLA ¿QUIÉN ERES?----------------------------*/}




        {/*---------------------PANTALLA LOGIN TUTOR/FAMILIA/ADMIN----------------------------*/}
        {vistaActual === 'login-tutor-familia-administrador' && (
          <InicioSesionTutorFamilia
            rol={rolSeleccionado}
            onVolver={() => setVistaActual('seleccion-rol')}
            onLoginExitoso={(sessionData) => {
              // Guardamos la sesión
              setSesion(sessionData);
              console.log(`Acceso completado como ${sessionData.user.role}`);
            }}
          />
        )}
        {/*---------------------PANTALLA LOGIN TUTOR/FAMILIA/ADMIN----------------------------*/}



      </div>
    </AccesibilidadProvider>
  );
}