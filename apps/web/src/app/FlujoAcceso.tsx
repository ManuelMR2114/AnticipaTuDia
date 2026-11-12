import { useState } from 'react';
import { useNavigate } from 'react-router';
import type { Classroom, ClassroomStudent, SessionResponse } from '@agenda/shared';
import SeleccionRol from '../features/auth/pages/SeleccionRol';
import InicioSesionTutorFamilia, {
  type RolPersonal,
} from '../features/auth/pages/InicioSesionTutorFamilia';
import { guardarSesion } from '../features/auth/session';
import InicioSesionClase from '../features/student-login/pages/InicioSesionClase';
import SeleccionEstudiante from '../features/student-login/pages/SeleccionEstudiante';
import InicioSesionCodigo from '../features/student-login/pages/InicioSesionCodigo';
import InicioSesionPictogramas from '../features/student-login/pages/InicioSesionPictogramas';
import InicioSesionPatron from '../features/student-login/pages/InicioSesionPatron';

type Vista =
  | 'seleccion-rol'
  | 'inicio-clase'
  | 'seleccion-estudiante'
  | 'login-estudiante-codigo'
  | 'login-estudiante-pictograma'
  | 'login-estudiante-patron'
  | 'login-tutor-familia-administrador';

/** Flujo de acceso en `/`: selección de rol, clase, alumno y login según el método. */
export default function FlujoAcceso() {
  const navigate = useNavigate();
  const [vistaActual, setVistaActual] = useState<Vista>('seleccion-rol');
  const [rolSeleccionado, setRolSeleccionado] = useState<RolPersonal>('tutor');
  const [aulaSeleccionada, setAulaSeleccionada] = useState<Classroom | null>(null);
  const [estudianteSeleccionado, setEstudianteSeleccionado] =
    useState<ClassroomStudent | null>(null);
  const [avisoLogin, setAvisoLogin] = useState<string | null>(null);
  const [, setSesion] = useState<SessionResponse | null>(null);

  const abrirLogin = (rol: RolPersonal) => {
    setRolSeleccionado(rol);
    setVistaActual('login-tutor-familia-administrador');
  };

  const alEntrar = (sessionData: SessionResponse) => {
    setSesion(sessionData);
    console.log(`Acceso completado como ${sessionData.user.role}`);
  };

  return (
    <div>
      {vistaActual === 'seleccion-rol' && (
        <SeleccionRol
          onSeleccionarEstudiante={() => setVistaActual('inicio-clase')}
          onSeleccionarTutor={() => abrirLogin('tutor')}
          onSeleccionarFamilia={() => abrirLogin('family')}
          onSeleccionarAdmin={() => abrirLogin('admin')}
        />
      )}

      {vistaActual === 'inicio-clase' && (
        <InicioSesionClase
          onVolver={() => setVistaActual('seleccion-rol')}
          onSeleccionarClase={(aula) => {
            setAulaSeleccionada(aula);
            setVistaActual('seleccion-estudiante');
          }}
        />
      )}

      {vistaActual === 'seleccion-estudiante' && aulaSeleccionada && (
        <SeleccionEstudiante
          aula={aulaSeleccionada}
          onVolver={() => setVistaActual('inicio-clase')}
          aviso={avisoLogin}
          onSeleccionarEstudiante={(estudiante: ClassroomStudent) => {
            setAvisoLogin(null);
            setEstudianteSeleccionado(estudiante);
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
              case 'password':
                setAvisoLogin('Este método de acceso aún no está disponible.');
                break;
              case null:
              case undefined:
                setAvisoLogin(
                  `${estudiante.fullName} aún no tiene método de acceso. Pide ayuda a tu tutor.`,
                );
                break;
              default:
                setAvisoLogin('Este método de acceso aún no está disponible.');
            }
          }}
        />
      )}

      {vistaActual === 'login-estudiante-codigo' && estudianteSeleccionado && (
        <InicioSesionCodigo
          estudiante={estudianteSeleccionado}
          onVolver={() => setVistaActual('seleccion-estudiante')}
          onLoginExitoso={alEntrar}
        />
      )}

      {vistaActual === 'login-estudiante-pictograma' && estudianteSeleccionado && (
        <InicioSesionPictogramas
          estudiante={estudianteSeleccionado}
          onVolver={() => setVistaActual('seleccion-estudiante')}
          onLoginExitoso={alEntrar}
        />
      )}

      {vistaActual === 'login-estudiante-patron' && estudianteSeleccionado && (
        <InicioSesionPatron
          estudiante={estudianteSeleccionado}
          onVolver={() => setVistaActual('seleccion-estudiante')}
          onLoginExitoso={alEntrar}
        />
      )}

      {vistaActual === 'login-tutor-familia-administrador' && (
        <InicioSesionTutorFamilia
          rol={rolSeleccionado}
          onVolver={() => setVistaActual('seleccion-rol')}
          onLoginExitoso={(sessionData) => {
            guardarSesion(sessionData);
            alEntrar(sessionData);
            if (sessionData.user.role === 'admin') navigate('/admin', { replace: true });
          }}
        />
      )}
    </div>
  );
}
