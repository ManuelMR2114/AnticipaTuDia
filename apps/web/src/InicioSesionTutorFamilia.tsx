import PanelLateral from './PanelLateral';
import BotonAccesibilidad from './BotonAccesibilidad';
import { useState } from 'react';

interface InicioSesionTutorFamiliaProps {
  rol: 'tutor' | 'familia';
  onVolver: () => void;
  onLoginExitoso: () => void;
}

// Los dos campos (correo y contraseña) tienen exactamente el mismo estilo. Se definen estas constantes para no repetir.
const claseInput = 'h-[clamp(44px,4.6vh,60px)] w-full rounded-xl border-[1.5px] border-borde bg-transparent px-5 text-[clamp(16px,1.1vw,22px)] text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-azul-oscuro';

const claseLabel = 'mb-[1.6vh] block text-[clamp(18px,1.5vw,30px)] font-semibold text-black';

export default function InicioSesionTutorFamilia({
  rol,
  onVolver,
  onLoginExitoso,
}: InicioSesionTutorFamiliaProps) {
  // Estado de los campos
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Mensaje de error
  const [error, setError] = useState('');

  const procesarLogin = (e: React.FormEvent) => {
    // Evita que el navegador recargue la página al enviar el formulario
    e.preventDefault();

    // Validamos campos 
    if (!email || !password) {
      setError('Por favor, introduce tu correo y contraseña.');
      return;
    }

    // Limpiamos el error anterior para que no se quede visible tras corregirlo
    setError('');

    // AQUI LLAMADA AL BACKEND
    console.log(`Iniciando sesión como ${rol}`, { email });

    // Avisamos para cambiar de pantalla
    onLoginExitoso();
  };

  return (
    <div className="flex min-h-screen w-full">
      {/* Panel izquierda */}
      <PanelLateral />

      {/* Zona derecha*/}
      <main className="relative flex w-[62%] flex-col justify-center bg-crema">
        {/* Botón Volver  */}
        <button
          className="anillo-foco absolute top-[5.6vh] left-[2.8vw] flex size-[clamp(56px,4.5vw,90px)] items-center justify-center rounded-full border-2 border-borde bg-transparent text-borde transition-[transform,background-color] duration-200 ease-[ease] hover:-translate-x-[3px] hover:bg-black/5"
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

        <div className="pl-[9vw]">
          
          <div className="mb-[5.1vh] text-left">
            <h2 className="mb-[1.1vh] text-titulo font-bold leading-tight text-black">
              Te damos la bienvenida
            </h2>
            <p className="text-subtitulo font-normal italic text-black">
              Introduce tus datos para entrar en tu espacio
            </p>
          </div>

          {/* Formulario  */}
          <form
            onSubmit={procesarLogin}
            noValidate
            className="flex w-[22.2vw] min-w-[300px] flex-col gap-[4.2vh]"
          >
            {/* Error  al fallar la validación  */}
            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-400 bg-red-100 p-3 text-sm font-medium text-red-700"
              >
                {error}
              </div>
            )}

            { /* Correo*/}
            <div>
              <label htmlFor="correo" className={claseLabel}>
                Correo Electronico
              </label>
              <input
                id="correo"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={claseInput}
              />
            </div>

            { /* Contraseña y enlace de recuperación */}
            <div>
              <label htmlFor="password" className={claseLabel}>
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={claseInput}
              />
              <a
                href="#"
                onClick={(e) => {
                  // Evita saltar a "#" mientras no exista esa pantalla
                  e.preventDefault();
                  alert('Función de recuperación de contraseña');
                }}
                className="mt-[2.9vh] inline-block text-[clamp(13px,0.85vw,17px)] text-azul-oscuro underline"
              >
                He olvidado mi contraseña
              </a>
            </div>

            {
            /* Botón Entrar */}
            <button
              type="submit"
              className="anillo-foco h-[clamp(44px,4.6vh,60px)] w-full rounded-xl border-[1.5px] border-azul-oscuro bg-azul-oscuro text-[clamp(16px,1.05vw,22px)] font-semibold text-white transition-transform hover:-translate-y-0.5"
            >
              Entrar
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}