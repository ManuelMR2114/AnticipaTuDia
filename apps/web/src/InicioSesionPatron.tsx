import { useRef, useState } from 'react';
import PanelLateral from './PanelLateral';
import BotonAccesibilidad from './BotonAccesibilidad';
import type { SessionResponse } from '@agenda/shared';
import type { EstudianteConMetodo } from './metodoLogin';

const API_URL = 'http://localhost:3000/api';
// Login de alumno con patrón (login_method = 'pattern'). TODO: confirmar la ruta real de la API
const RUTA_LOGIN_ALUMNO = '/auth/student/login';
// Mínimo de puntos para que el patrón sea válido
const MIN_PUNTOS = 4;

// Rejilla 3x3 dibujada en un lienzo de 100x100. Los puntos se numeran 0..8 (fila a fila).
const CENTROS = [16.67, 50, 83.33];
const PUNTOS = Array.from({ length: 9 }, (_, i) => ({
  indice: i,
  fila: Math.floor(i / 3),
  col: i % 3,
  x: CENTROS[i % 3],
  y: CENTROS[Math.floor(i / 3)],
}));
// Radio (en unidades del lienzo) en el que el dedo "engancha" un punto
const RADIO_ENGANCHE = 15;

interface InicioSesionPatronProps {
  estudiante: EstudianteConMetodo;
  onVolver: () => void;
  onLoginExitoso: (sessionData: SessionResponse) => void;
}

export default function InicioSesionPatron({
  estudiante,
  onVolver,
  onLoginExitoso,
}: InicioSesionPatronProps) {
  // Puntos tocados, en orden
  const [patron, setPatron] = useState<number[]>([]);
  // Posición actual del dedo, para dibujar la línea que sigue al puntero
  const [puntero, setPuntero] = useState<{ x: number; y: number } | null>(null);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const dibujando = useRef(false);
  const lienzo = useRef<HTMLDivElement>(null);

  // Añade un punto; si el trazo salta por encima de un punto sin marcar, lo marca también
  const anadirPunto = (actual: number[], indice: number): number[] => {
    if (actual.includes(indice)) return actual;
    if (actual.length === 0) return [indice];
    const a = PUNTOS[actual[actual.length - 1]];
    const b = PUNTOS[indice];
    const salto = (b.fila - a.fila) % 2 === 0 && (b.col - a.col) % 2 === 0;
    const medio = salto ? (a.fila + b.fila) / 2 * 3 + (a.col + b.col) / 2 : -1;
    if (medio >= 0 && medio !== a.indice && medio !== b.indice && !actual.includes(medio)) {
      return [...actual, medio, indice];
    }
    return [...actual, indice];
  };

  // Convierte la posición del puntero a coordenadas del lienzo (0-100)
  const aCoordenadas = (e: React.PointerEvent) => {
    const caja = lienzo.current!.getBoundingClientRect();
    return {
      x: ((e.clientX - caja.left) / caja.width) * 100,
      y: ((e.clientY - caja.top) / caja.height) * 100,
    };
  };

  const puntoCercano = (x: number, y: number): number | null => {
    const p = PUNTOS.find((pt) => Math.hypot(pt.x - x, pt.y - y) <= RADIO_ENGANCHE);
    return p ? p.indice : null;
  };

  const enviar = async (secuencia: number[]) => {
    if (secuencia.length < MIN_PUNTOS) {
      setError(`Une al menos ${MIN_PUNTOS} puntos.`);
      setPatron([]);
      return;
    }

    setError('');
    setCargando(true);
    try {
      const respuesta = await fetch(`${API_URL}${RUTA_LOGIN_ALUMNO}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: estudiante.id, password: secuencia.join(',') }),
      });

      if (!respuesta.ok) {
        if (respuesta.status === 401) setError('Patrón incorrecto. Inténtalo de nuevo.');
        else if (respuesta.status === 429) setError('Demasiados intentos. Espera un momento.');
        else if (respuesta.status === 503) setError('Servicio no disponible');
        else setError('Error al iniciar sesión');
        setPatron([]);
        return;
      }

      const sessionData: SessionResponse = await respuesta.json();
      onLoginExitoso(sessionData);
    } catch {
      setError('No se pudo conectar con el servidor');
      setPatron([]);
    } finally {
      setCargando(false);
    }
  };

  // ---- Ratón / dedo ----
  const alPulsar = (e: React.PointerEvent) => {
    if (cargando) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dibujando.current = true;
    setError('');
    const { x, y } = aCoordenadas(e);
    setPuntero({ x, y });
    const p = puntoCercano(x, y);
    setPatron(p === null ? [] : [p]);
  };

  const alMover = (e: React.PointerEvent) => {
    if (!dibujando.current) return;
    const { x, y } = aCoordenadas(e);
    setPuntero({ x, y });
    const p = puntoCercano(x, y);
    if (p !== null) setPatron((actual) => anadirPunto(actual, p));
  };

  const alSoltar = () => {
    if (!dibujando.current) return;
    dibujando.current = false;
    setPuntero(null);
    enviar(patron);
  };

  // ---- Teclado: Intro/Espacio marca el punto; Intro sobre el último punto envía; Escape borra ----
  const alTeclearPunto = (e: React.KeyboardEvent, indice: number) => {
    if (cargando) return;
    if (e.key === 'Escape') {
      setPatron([]);
      setError('');
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (patron[patron.length - 1] === indice) enviar(patron);
      else setPatron((actual) => anadirPunto(actual, indice));
    }
  };

  const lineas = patron.map((i) => PUNTOS[i]);

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
          <div className="mb-[6vh] text-left">
            <h2 className="mb-[1.1vh] text-titulo font-bold leading-tight text-black">
              Confirma que eres tú
            </h2>
            <p className="text-subtitulo font-normal italic text-black">
              Usa el método de acceso que te resulte más cómodo
            </p>
          </div>

          {/* Zona de mensajes con altura fija para que la rejilla no salte */}
          <div className="mb-[2vh] min-h-[48px] w-[32vw] min-w-[300px]">
            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-400 bg-red-100 p-3 text-center text-sm font-medium text-red-700"
              >
                {error}
              </div>
            )}
            {cargando && (
              <p role="status" className="text-center text-subtitulo text-black">
                Comprobando...
              </p>
            )}
          </div>

          <div className="flex w-[32vw] min-w-[300px] justify-center">
            <div
              ref={lienzo}
              role="group"
              aria-label="Dibuja tu patrón uniendo los puntos"
              aria-busy={cargando}
              onPointerDown={alPulsar}
              onPointerMove={alMover}
              onPointerUp={alSoltar}
              onPointerCancel={alSoltar}
              className={`relative aspect-square w-[clamp(260px,32vh,360px)] touch-none select-none ${
                cargando ? 'opacity-50' : ''
              }`}
            >
              {/* Líneas del trazo */}
              <svg
                className="pointer-events-none absolute inset-0 size-full"
                viewBox="0 0 100 100"
                aria-hidden="true"
              >
                {lineas.length > 1 && (
                  <polyline
                    points={lineas.map((p) => `${p.x},${p.y}`).join(' ')}
                    fill="none"
                    stroke="var(--color-azul-oscuro)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
                {puntero && lineas.length > 0 && (
                  <line
                    x1={lineas[lineas.length - 1].x}
                    y1={lineas[lineas.length - 1].y}
                    x2={puntero.x}
                    y2={puntero.y}
                    stroke="var(--color-azul-oscuro)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                )}
              </svg>

              {/* Puntos: botones para poder usarlos con teclado */}
              {PUNTOS.map((p) => {
                const marcado = patron.includes(p.indice);
                return (
                  <button
                    key={p.indice}
                    type="button"
                    tabIndex={0}
                    disabled={cargando}
                    aria-label={`Punto ${p.indice + 1}${marcado ? ', marcado' : ''}`}
                    onKeyDown={(e) => alTeclearPunto(e, p.indice)}
                    style={{ left: `${p.x}%`, top: `${p.y}%` }}
                    className="anillo-foco absolute flex size-[22%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full"
                  >
                    <span
                      className={`block rounded-full bg-black transition-all duration-150 ${
                        marcado ? 'size-[40%] ring-4 ring-azul-oscuro/40' : 'size-[22%]'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}