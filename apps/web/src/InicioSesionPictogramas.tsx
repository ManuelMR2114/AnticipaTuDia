import PanelLateral from './PanelLateral';
import BotonAccesibilidad from './BotonAccesibilidad';
import { useState, useEffect } from 'react';
import type { SessionResponse, Pictogram } from '@agenda/shared';

interface InicioSesionPictogramasProps {
  // Alumno elegido en "¿Quién eres?"
  estudiante: EstudianteConMetodo;
  onVolver: () => void;
  onLoginExitoso: (sessionData: SessionResponse) => void;
}

const API_URL = 'http://localhost:3000/api';
// Login de alumno con PICTOGRAMA (login_method = 'pictogram').
const RUTA_LOGIN_PICTOGRAMA = '/auth/student/pictogramas';

// Numero de pictogramas que se muestran y que forman la contraseña. De momento, establecemos 3 fijos.
const Numero_Pictogramas_contrasena = 3;

export default function InicioSesionPictogramas({
  estudiante,
  onVolver,
  onLoginExitoso,
}: InicioSesionPictogramasProps) {

  // Pictogramas que se pintan en pantalla
  const [pictogramas, setPictogramas] = useState<Pictogram[]>([]);
  // Ids en el orden en que el alumno los va seleccionando
  const [seleccion, setSeleccion] = useState<string[]>([]);
  // Mensaje de error
  const [error, setError] = useState('');
  // Esperamos a la API a que carge los pictogramas, esto es si es toma valor true.
  const [cargando_pictogramas, setCargando_pictogramas] = useState(true);
  // Bloquea los botones para evitar envíos dobles, toma el valor true mientras la API comprueba la contraseña metida de pictogramas.
  const [verificando, setVerificando] = useState(false);
  
  const cargarPictogramas = async () => {
    try {
        const response = await fetch(`${API_URL}/pictograms`);

        // Si la API falla, avisamos y salimos
        if (!response.ok) {

          setError('No se pudieron cargar los pictogramas');
          return;

        }
        // Obtenemos los pictogramas de la respuesta
        const data: Pictogram[] = await response.json();

        // La API ya los devuelve ordenados por sort_order y de momento nos quedamos con los 3 primeros recortando la respuesta con slice indicando desdee donde a donde.
        // Guardandolos en pictogramas gracias a la función setPictogramas
        setPictogramas(data.slice(0, Numero_Pictogramas_contrasena));

      } catch {

        setError('No se pudo conectar con el servidor');

      } finally {
        // Da igual lo que pase, dejamos de mostrar "Cargando" poniendo a false
        setCargando_pictogramas(false);
      }

  };
 // Usamos useEffect para que la primera vez que se carga la pantalla, se cargen los pictogramas.

  useEffect(() => {
    cargarPictogramas();
  }, []);
  
  const elegirPictograma = async (id: string) => {
    // Si ya está elegido o se está comprobando, lo ignoramos
    if (verificando || seleccion.includes(id)){
        return;
    }

    // Quitamos el error anterior y guardamos el pictograma en el orden en que se toca
    setError('');

    // Usamos este array para gestionar el orden en el que el estudiante va seleccionando los pictogramas.
    // Copia todos los pictogramas que el alumno ya había seleccionado antes y añade al final el id del pictograma que el alumno acaba de seleccionar ahora mismo.
    // Esto es gracias a la funcion concat que realiza el concatenamiento y devuelve un nuevo array.
    const nuevaSeleccion = seleccion.concat(id);
    setSeleccion(nuevaSeleccion);

    // Mientras falten pictogramas, solo guardamos el orden y esperamos al siguiente
    if (nuevaSeleccion.length < Numero_Pictogramas_contrasena){
        return;
    } 

    // Una vez este la contrasena completa (no se sabe si esta bien o mal solo que se han marcado 3 pictogramas), se manda a la API para verificar.
    setVerificando(true);
    try {

        const response = await fetch(`${API_URL}${RUTA_LOGIN_PICTOGRAMA}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentId: estudiante.id, pictogramas: nuevaSeleccion }),
        });

      if (!response.ok) {
        if (response.status === 401) {
            
            setError('Secuencia incorrecta');

        } else if (response.status === 503){ 
            
            setError('Servicio no disponible');

        } else {

            setError('Error al iniciar sesión');
        }

        // Vaciamos la selección para que pueda volver a intentarlo desde cero
        setSeleccion([]);
        return;
      }

      // Su el login es correcto entonces avisamos a App con la sesión para cambiar de pantalla
      const sessionData: SessionResponse = await response.json();
      onLoginExitoso(sessionData);

    } catch {

      setError('No se pudo conectar con el servidor');
      setSeleccion([]);

    } finally {

      // Da igual lo que pase, desbloqueamos los botones poniendo false
      setVerificando(false);
    }
  };

  // Vaciamos la selección para empezar la secuencia de nuevo
  const borrarSeleccion = () => {
    setSeleccion([]);
    setError('');
  };

  return (
    <div className="flex min-h-screen w-full">
      {/* Panel izquierda */}
      <PanelLateral />

      {/* Zona derecha */}
      <main className="relative flex w-[62%] flex-col justify-center bg-crema">
        {/* Botón Volver */}
        <button
          className="anillo-foco absolute top-[6.3vh] left-[4vw] flex size-[clamp(56px,4.5vw,90px)] items-center justify-center rounded-full border-2 border-borde bg-transparent text-borde transition-[transform,background-color] duration-200 ease-[ease] hover:-translate-x-[3px] hover:bg-black/5"
          onClick={onVolver}
          aria-label="Volver a la selección de rol"
        >
          <svg
            className="size-[52%]"
            viewBox="0 0 48 48"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M40 24H8M20 12L8 24l12 12" />
          </svg>
        </button>

        <BotonAccesibilidad />

        {/* Bloque central: pl alinea con el HIFI y pt lo baja un poco respecto al centro, como en el HIFI */}
        <div className="relative pl-[9.2vw] pt-[8.9vh]">
          {/* Cabecera: text-titulo y text-subtitulo escalan con el botón de accesibilidad */}
          <div className="mb-[4.9vh] text-left">
            <h2 className="mb-[1.1vh] text-titulo font-bold leading-tight text-black">
              Confirma que eres tú
            </h2>
            <p className="text-subtitulo font-normal italic text-black">
              Usa el método de acceso que te resulte más cómodo
            </p>
          </div>

          {/* Pictogramas */}
          {cargando_pictogramas ? (
            <p className="text-subtitulo italic text-black">Cargando pictogramas...</p>
          ) : (
            <div className="ml-[1.2vw] flex gap-[4.5vw]">
              {pictogramas.map((pic) => {
                
                // Posición en la que el alumno lo ha tocado y se pone -1 si todavía no lo ha tocado
                const indice = seleccion.indexOf(pic.id);

                const orden = indice !== -1 ? indice + 1 : null;

                return (
                  <div key={pic.id} className="flex flex-col items-center">
                    {/* Número de orden encima del pictograma */}
                    <div
                      className="mb-[0.5vh] flex h-[3.4vh] items-end text-subtitulo font-normal leading-none text-black"
                      aria-hidden="true"
                    >
                      {orden}
                    </div>

                    <button
                      type="button"
                      onClick={() => elegirPictograma(pic.id)}
                      disabled={verificando}
                      aria-pressed={indice !== -1}
                      aria-label={orden ? `${pic.name}, elegido en posición ${orden}` : pic.name}
                      className="anillo-foco flex size-[clamp(140px,11.3vw,230px)] items-center justify-center border border-borde bg-transparent p-[4%] disabled:cursor-wait"
                    >
                      {pic.imageUrl ? (
                        <img src={pic.imageUrl} alt="" className="size-full object-contain" />
                      ) : (
                        // Si la API no trae imagen, mostramos el nombre para que no quede vacío
                        <span className="text-subtitulo font-bold text-black">{pic.name}</span>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Borrar selección o el aviso de comprobación */}
          <div className="ml-[0.5vw] mt-[4.1vh] h-[4vh]">
            {seleccion.length > 0 && !verificando && (
              <button
                type="button"
                onClick={borrarSeleccion}
                className="anillo-foco text-[clamp(13px,0.85vw,17px)] text-azul-oscuro underline"
              >
                Borrar selección
              </button>
            )}
            {verificando && (
              <p role="status" className="text-[clamp(13px,0.85vw,17px)] text-black">
                Comprobando secuencia...
              </p>
            )}
          </div>

          {/* Error */}
          {error && (
            <div
              role="alert"
              className="absolute top-full left-[9.2vw] mt-[2vh] rounded-xl border border-red-400 bg-red-100 p-3 text-sm font-medium text-red-700"
            >
              {error}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}