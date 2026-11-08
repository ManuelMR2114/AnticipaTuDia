import { useState } from 'react';

import SeleccionRol from './SeleccionRol';
import InicioSesionClase from './InicioSesionClase';
import InicioSesionTutorFamilia from './InicioSesionTutorFamilia';

//provider para guardar el tamaño de texto y el contraste praa todas las pantallas 
import AccesibilidadProvider from './AccesibilidadProvider';
import './index.css';



//tipos de vistas posibles
type Vista = 'seleccion-rol' | 'inicio-clase' | 'login-tutor-familia';

export default function App() {

  //pantalla qeu se muestra ahora mismo
  const [vistaActual, setVistaActual] = useState<Vista>('seleccion-rol');

  //rol seleecionado se le pasa a el login de tutor/familia para  saber diferencia 
  const [rolSeleccionado, setRolSeleccionado] = useState<'tutor' | 'familia'>('tutor');

  return (

    //debe envolver todas las pantallas, de esta forma el boton de accesibilidad
    //funciona en cualquiera de ellas y mantiene su estado aunque se cambie de vista 
    <AccesibilidadProvider>
      
      <div className="app-container">




        {/*-------------------PANTALLA SELECCION ROL-----------------------------*/} 
        {vistaActual === 'seleccion-rol' && (

          <SeleccionRol
            //si se selecciona estudiante nos vamos a la de clases 
            onSeleccionarEstudiante={() => setVistaActual('inicio-clase')}

            //aqui vanos a la misma pantalla pero diferenciando entre roles
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
        {/*-------------------PANTALLA SELECCION ROL-----------------------------*/} 




        {/*---------------------PANTALLA INICIO CLASE----------------------------*/} 
        {vistaActual === 'inicio-clase' && (
          <InicioSesionClase onVolver={() => setVistaActual('seleccion-rol')} />
        )}
        {/*---------------------PANTALLA INICIO CLASE----------------------------*/} 





        {/*---------------------PANTALLA LOGIN TUTOR/FAMILIA----------------------------*/} 
        {vistaActual === 'login-tutor-familia' && (
          <InicioSesionTutorFamilia
            rol={rolSeleccionado}
            onVolver={() => setVistaActual('seleccion-rol')}
            onLoginExitoso={() => {
              console.log(`Acceso completado como ${rolSeleccionado}`);
            }}
          />
        )}
        {/*---------------------PANTALLA LOGIN TUTOR/FAMILIA----------------------------*/} 




      </div>
    </AccesibilidadProvider>

  );
}