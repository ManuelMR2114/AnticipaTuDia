import { useState } from 'react';
import type { SessionResponse } from '@agenda/shared';

import SeleccionRol from './SeleccionRol';
import InicioSesionClase from './InicioSesionClase';
import InicioSesionTutorFamilia, { type RolPersonal } from './InicioSesionTutorFamilia';

//provider para guardar el tamaño de texto y el contraste praa todas las pantallas 
import AccesibilidadProvider from './AccesibilidadProvider';
import './index.css';



//tipos de vistas posibles
type Vista = 'seleccion-rol' | 'inicio-clase' | 'login-tutor-familia-administrador';

export default function App() {

  //pantalla qeu se muestra ahora mismo
  const [vistaActual, setVistaActual] = useState<Vista>('seleccion-rol');

  //rolSeleccionado se le pasa a el login de tutor/familia/administrador para saber diferencia con valor inicial tutor
  const [rolSeleccionado, setRolSeleccionado] = useState<RolPersonal>('tutor');

  // Guarda la sesion que devuelve la API al entrar.
  // Empieza en null haciendo referencia a que nadie ha entrado y tras un iniciar sesion correctamente, guarda la sesion
  // [, setSesion] es asi porque no vamos a leer el valor que trae useState, solo nos interesa la funcion setSesion para guardar la sesion. useState devuelve el par [valor, funcion]
  const [, setSesion] = useState<SessionResponse | null>(null);

  // Como tutor, familia y administrador hacecn lo mismo y es poner lo mismo pero cambiando el rol pues uso esta funcion y  abro el login con el rol elegido y no repito código.
  const abrirLogin = (rol: RolPersonal) => {
    setRolSeleccionado(rol);
    setVistaActual('login-tutor-familia-administrador');
  };
  
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
            onSeleccionarTutor={() => abrirLogin('tutor')}
            onSeleccionarFamilia={() => abrirLogin('family')}
            onSeleccionarAdmin={() => abrirLogin('admin')}
          />

        )}
        {/*-------------------PANTALLA SELECCION ROL-----------------------------*/} 




        {/*---------------------PANTALLA INICIO CLASE----------------------------*/} 
        {vistaActual === 'inicio-clase' && (
          <InicioSesionClase onVolver={() => setVistaActual('seleccion-rol')} />
        )}
        {/*---------------------PANTALLA INICIO CLASE----------------------------*/} 





        {/*---------------------PANTALLA LOGIN TUTOR/FAMILIA----------------------------*/} 
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
        {/*---------------------PANTALLA LOGIN TUTOR/FAMILIA----------------------------*/} 




      </div>
    </AccesibilidadProvider>

  );
}