import { useState } from 'react';
import PanelLateral from '../../../components/layout/PanelLateral';
import BotonAccesibilidad from '../../accessibility/BotonAccesibilidad';
import type { SessionResponse } from '@agenda/shared';
import { loginAlumno } from '../../../lib/api/auth';



interface InicioSesionCodigoProps {

  //alumno elegido en la pantalla de quien eres
  estudiante: {id: string};
  onVolver: () => void;

  //entrega a la sesion de la app para que tenga quien ha entrado
  onLoginExitoso: (sessionData: SessionResponse) => void;
}

const claseInput =
  'h-[clamp(44px,4.6vh,60px)] w-full rounded-xl border-[1.5px] border-borde bg-transparent px-5 text-[clamp(16px,1.1vw,22px)] text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-azul-oscuro disabled:opacity-50';
const claseLabel =
  'mb-[1.6vh] block text-[clamp(18px,1.5vw,30px)] font-semibold text-black';

export default function InicioSesionCodigo({
  estudiante,
  onVolver,
  onLoginExitoso,
}: InicioSesionCodigoProps) {
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState('');

  const [cargando, setCargando] = useState(false);

  const procesarLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const codigoLimpio = codigo.trim();
    if (!codigoLimpio) {
      setError('Por favor, escribe tu código.');
      return;
    }

    setError('');
    setCargando(true);

    //hacemos el post para ver que el codigo sea el correcto
    try {
      const respuesta = await loginAlumno(estudiante.id, codigoLimpio);

      if (!respuesta.ok) {

        if (respuesta.status === 401) setError('Código incorrecto. Inténtalo de nuevo.');
        else if (respuesta.status === 503) setError('Servicio no disponible');
        else setError('Error al iniciar sesión');
        return;

      }


      const sessionData: SessionResponse = await respuesta.json();
      onLoginExitoso(sessionData);

    } catch {

      setError('No se pudo conectar con el servidor');

    } finally {

      setCargando(false);
    }
  };



  return (
    <div className="flex min-h-screen w-full">
      
      <PanelLateral />

      <main className="relative flex w-[62%] flex-col justify-center bg-crema">
        <button
          className="anillo-foco absolute top-[5.6vh] left-[2.8vw] flex size-[clamp(56px,4.5vw,90px)] items-center justify-center rounded-full border-2 border-borde bg-transparent text-borde transition-[transform,background-color] duration-200 ease-[ease] hover:-translate-x-[3px] hover:bg-black/5"
          onClick={onVolver}
          aria-label="Volver a la selección de estudiante"
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
          <div className="mb-[10vh] text-left">
            <h2 className="mb-[1.1vh] text-titulo font-bold leading-tight text-black">
              Confirma que eres tú
            </h2>
            <p className="text-subtitulo font-normal italic text-black">
              Usa el método de acceso que te resulte más cómodo
            </p>
          </div>

          <form
            onSubmit={procesarLogin}
            noValidate
            aria-busy={cargando}
            className="flex w-[22.2vw] min-w-[300px] flex-col gap-[3.2vh]"
          >
            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-400 bg-red-100 p-3 text-sm font-medium text-red-700"
              >
                {error}
              </div>
            )}

            <div>
              <label htmlFor="codigo" className={claseLabel}>
                Código
              </label>
              <input
                id="codigo"
                type="password"
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                className={claseInput}
                disabled={cargando}
              />
            </div>

            <button
              type="submit"
              className="anillo-foco h-[clamp(44px,4.6vh,60px)] w-full rounded-xl border-[1.5px] border-azul-oscuro bg-azul-oscuro text-[clamp(16px,1.05vw,22px)] font-semibold text-white transition-transform hover:-translate-y-0.5"
              disabled={cargando}
            >
              {cargando ? 'Comprobando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}