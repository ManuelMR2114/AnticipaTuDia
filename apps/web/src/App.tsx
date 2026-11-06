import { useState } from 'react';
import SeleccionRol from './SeleccionRol';
import InicioSesionClase from './InicioSesionClase';
import './index.css';

// Definimos los tipos de vistas posibles
type Vista = 'seleccion-rol' | 'inicio-clase';

export default function App() {
  const [vistaActual, setVistaActual] = useState<Vista>('seleccion-rol');

  return (
    <main className="app-container">
      {vistaActual === 'seleccion-rol' && (
        <SeleccionRol onSeleccionarEstudiante={() => setVistaActual('inicio-clase')} />
      )}
      
      {vistaActual === 'inicio-clase' && (
        <InicioSesionClase onVolver={() => setVistaActual('seleccion-rol')} />
      )}
    </main>
  );
}