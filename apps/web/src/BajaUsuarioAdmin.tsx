import PanelLateral from './PanelLateral';
import BotonAccesibilidad from './BotonAccesibilidad';
import { useState } from 'react';
import type { SessionResponse } from '@agenda/shared';

interface BajaUsuarioProps {
  // Sesión del administrador que es el token que exige la API para dar de baja
  sesion: SessionResponse;
  onVolver: () => void;
}

const API_URL = 'http://localhost:3000/api';
const RUTA_BAJA_USUARIO = '/users';

const claseInput = 'h-[clamp(44px,4.6vh,60px)] w-full rounded-xl border-[1.5px] border-borde bg-transparent px-5 text-[clamp(16px,1.1vw,22px)] text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-azul-oscuro disabled:opacity-50';
const claseLabel = 'mb-[1.2vh] block text-[clamp(18px,1.5vw,30px)] font-semibold text-black';

export default function BajaUsuarioAdmin({ sesion, onVolver }: BajaUsuarioProps) {
  // Datos del formulario
  const [userId, setUserId] = useState('');

  // Mensajes: error o confirmación de la baja
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  
  // Para evitar envíos duplicados bloqueamos el formulario mientras esperamos a la API
  const [enviando, setEnviando] = useState(false);

  const darDeBaja = async (e: React.FormEvent) => {
    e.preventDefault();

    // Comprobación de que el ID no esté vacío
    if (!userId.trim()) {
      setExito('');
      setError('El identificador del usuario es obligatorio');
      return;
    }

    // Limpiamos mensajes previos y bloqueamos el formulario
    setError('');
    setExito('');
    setEnviando(true);

    try {
      
      const response = await fetch(`${API_URL}${RUTA_BAJA_USUARIO}/${userId.trim()}/deactivate`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sesion.accessToken}`,
        },
      });

      // Si la API responde con error, mostramos el mensaje según el código HTTP devuelto por el backend
      if (!response.ok) {
        if (response.status === 401) {
          setError('Tu sesión ha caducado. Vuelve a entrar');
        } else if (response.status === 403) {
          setError('No tienes permiso para dar de baja usuarios');
        } else if (response.status === 400) {
          setError('No puedes dar de baja tu propio usuario');
        } else if (response.status === 404) {
          setError('No se ha encontrado ningún usuario con ese identificador');
        } else if (response.status === 503) {
          setError('Servicio no disponible');
        } else {
          setError('No se pudo completar la baja del usuario');
        }
        return;
      }

      setExito(`Usuario dado de baja correctamente`);
      
      // Limpiamos el campo tras el éxito
      setUserId('');

    } catch {
      setError('No se pudo conectar con el servidor');
    } finally {
      // Desbloqueamos el formulario pase lo que pase
      setEnviando(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full">
      {/* Panel izquierda */}
      <PanelLateral />

      {/* Zona derecha */}
      <main className="relative flex w-[62%] flex-col justify-center bg-crema">
        {/* Botón Volver */}
        <button
          className="anillo-foco absolute top-[5.6vh] left-[2.8vw] flex size-[clamp(56px,4.5vw,90px)] items-center justify-center rounded-full border-2 border-borde bg-transparent text-borde transition-[transform,background-color] duration-200 ease-[ease] hover:-translate-x-[3px] hover:bg-black/5"
          onClick={onVolver}
          aria-label="Volver atrás"
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

        {/* Bloque central */}
        <div className="relative pl-[9vw]">
          {/* Cabecera */}
          <div className="mb-[5.1vh] text-left">
            <h2 className="mb-[1.1vh] text-titulo font-bold leading-tight text-black">
              Baja de usuario
            </h2>
            <p className="text-subtitulo font-normal italic text-black">
              Introduce el identificador del usuario que deseas desactivar
            </p>
          </div>

          {/* Formulario */}
          <form
            onSubmit={darDeBaja}
            noValidate
            aria-busy={enviando}
            className="grid w-[46vw] min-w-[560px] grid-cols-2 gap-x-[3vw] gap-y-[3.2vh]"
          >
            {/* ID de usuario (ocupa las dos columnas para dar espacio al UUID) */}
            <div className="col-span-2">
              <label htmlFor="userId" className={claseLabel}>
                ID del usuario (UUID)
              </label>
              <input
                id="userId"
                type="text"
                autoComplete="off"
                placeholder="Ej: f47ac10b-58cc-4372-a567-0e02b2c3d479"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className={claseInput}
                disabled={enviando}
              />
            </div>

            {/* Botón Dar de baja */}
            <div className="col-span-2 self-end pt-2">
              <button
                type="submit"
                disabled={enviando}
                className="anillo-foco h-[clamp(44px,4.6vh,60px)] w-full rounded-xl border-[1.5px] border-azul-oscuro bg-azul-oscuro text-[clamp(16px,1.05vw,22px)] font-semibold text-white transition-transform hover:-translate-y-0.5 disabled:opacity-50"
              >
                {enviando ? 'Procesando baja...' : 'Dar de baja'}
              </button>
            </div>
          </form>

          {/* Mensajes de error y éxito */}
          {error && (
            <div
              role="alert"
              className="absolute top-full left-[9vw] mt-[2vh] rounded-xl border border-red-400 bg-red-100 p-3 text-sm font-medium text-red-700"
            >
              {error}
            </div>
          )}
          {exito && (
            <div
              role="status"
              className="absolute top-full left-[9vw] mt-[2vh] rounded-xl border border-verde-agua bg-verde-agua/40 p-3 text-sm font-medium text-black"
            >
              {exito}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}