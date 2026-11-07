import { useState } from 'react';
import SeleccionRol from './SeleccionRol';
import InicioSesionClase from './InicioSesionClase';
import InicioSesionTutorFamilia from './InicioSesionTutorFamilia';
import './index.css';

// Definimos los tipos de vistas posibles
type Vista = 'seleccion-rol' | 'inicio-clase'| 'login-tutor-familia';

export default function App() {
  const [vistaActual, setVistaActual] = useState<Vista>('seleccion-rol');
  const [rolSeleccionado, setRolSeleccionado] = useState<'tutor' | 'familia'>('tutor');

  return (
    <div className="app-container">
      {vistaActual === 'seleccion-rol' && (
        <SeleccionRol 
          onSeleccionarEstudiante={() => setVistaActual('inicio-clase')} 
          onSeleccionarTutor={() => {
            setRolSeleccionado('tutor');
            setVistaActual('login-tutor-familia');
          }}
          onSeleccionarFamilia={() => {
            setRolSeleccionado('familia');
            setVistaActual('login-tutor-familia');
          }}
        
        />
      )}
      
      {vistaActual === 'inicio-clase' && (
        <InicioSesionClase onVolver={() => setVistaActual('seleccion-rol')} />
      )}

      {vistaActual === 'login-tutor-familia' && (
        <InicioSesionTutorFamilia 
          rol={rolSeleccionado}
          onVolver={() => setVistaActual('seleccion-rol')}
          onLoginExitoso={() => {
            console.log(`Acceso completado como ${rolSeleccionado}`);
          }}
        />
      )}
    </div>
  );
}
