import { useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import BotonAccesibilidad from '../../accessibility/BotonAccesibilidad';

export interface TareaAgenda {
  id: string;
  titulo: string;
  diaTiempo: string; // Ej: "Hoy - 10:00"
}

interface LocationStateAgenda {
  nombreAlumno?: string;
}

interface VistaAgendaProps {
  nombreAlumno?: string;
  tareas: TareaAgenda[];
  onVolver: () => void;
  onIniciarTarea: (tareaId: string) => void;
  onVerDetalleTarea?: (tarea: TareaAgenda) => void;
  onAnadirTarea?: () => void;
  onCambiarPeriodo?: (periodo: 'hoy' | 'semana' | 'mes') => void;
  onSeleccionarDia?: (valor: string | number) => void;
}

const COLORES_TARJETA = [
  'bg-[#6D9DC5] border-[#4A779D]', // Azul
  'bg-[#95C2B2] border-[#6A9988]', // Verde agua
  'bg-[#F2B08A] border-[#C9855E]', // Salmón
];

const DIAS_SEMANA_CONFIG = [
  { label: 'Lunes', shortLabel: 'Lun', dayIndex: 1 },
  { label: 'Martes', shortLabel: 'Mar', dayIndex: 2 },
  { label: 'Miércoles', shortLabel: 'Mié', dayIndex: 3 },
  { label: 'Jueves', shortLabel: 'Jue', dayIndex: 4 },
  { label: 'Viernes', shortLabel: 'Vie', dayIndex: 5 },
  { label: 'Sábado', shortLabel: 'Sáb', dayIndex: 6 },
  { label: 'Domingo', shortLabel: 'Dom', dayIndex: 0 },
] as const;

const NOMBRES_DIA_CAPITALIZADOS = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
] as const;

const TAREAS_POR_PAGINA = 3;

function esMismaFechaCalendario(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function obtenerFechaDeDiaSemanaActual(dayIndex: number): Date {
  const hoy = new Date();
  const base = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const diaActualSemana = base.getDay();
  const offsetLunesActual = diaActualSemana === 0 ? -6 : 1 - diaActualSemana;
  const lunesActual = new Date(
    base.getFullYear(),
    base.getMonth(),
    base.getDate() + offsetLunesActual,
  );
  const offsetDiaElegido = dayIndex === 0 ? 6 : dayIndex - 1;
  return new Date(
    lunesActual.getFullYear(),
    lunesActual.getMonth(),
    lunesActual.getDate() + offsetDiaElegido,
  );
}

function obtenerFechaDeDiaMesActual(diaMes: number): Date {
  const hoy = new Date();
  return new Date(hoy.getFullYear(), hoy.getMonth(), diaMes);
}

function formatearEtiquetaDia(fecha: Date, forzarHoy = false): string {
  const hoy = new Date();
  const baseHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const manana = new Date(baseHoy.getFullYear(), baseHoy.getMonth(), baseHoy.getDate() + 1);

  const nombreDia = NOMBRES_DIA_CAPITALIZADOS[fecha.getDay()];
  const numeroDia = fecha.getDate();
  const baseDia = `${nombreDia} ${numeroDia}`;

  if (forzarHoy || esMismaFechaCalendario(fecha, baseHoy)) {
    return `Hoy - ${baseDia}`;
  }
  if (esMismaFechaCalendario(fecha, manana)) {
    return `Mañana - ${baseDia}`;
  }
  return baseDia;
}

function obtenerSemanasCalendarioMesActual(): (number | null)[][] {
  const ahora = new Date();
  const year = ahora.getFullYear();
  const month = ahora.getMonth();

  const primerDiaSemana = new Date(year, month, 1).getDay();
  const offsetInicio = primerDiaSemana === 0 ? 6 : primerDiaSemana - 1;
  const ultimoDia = new Date(year, month + 1, 0).getDate();

  const celdas: (number | null)[] = [
    ...Array.from({ length: offsetInicio }, () => null),
    ...Array.from({ length: ultimoDia }, (_, i) => i + 1),
  ];

  while (celdas.length % 7 !== 0) {
    celdas.push(null);
  }

  const semanas: (number | null)[][] = [];
  for (let i = 0; i < celdas.length; i += 7) {
    semanas.push(celdas.slice(i, i + 7));
  }
  return semanas;
}

function obtenerClaseBotonDia({
  esHoy,
  estaSeleccionado,
  tamano,
}: {
  esHoy: boolean;
  estaSeleccionado: boolean;
  tamano: 'semana' | 'mes';
}): string {
  const baseTamano =
    tamano === 'semana'
      ? 'px-6 py-4 rounded-2xl font-bold text-2xl'
      : 'w-16 h-11 rounded-xl font-bold text-2xl';

  if (estaSeleccionado && esHoy) {
    return `${baseTamano} bg-[#1B365D] text-white border-4 border-[#C69738] ring-2 ring-[#FBE7B4]`;
  }
  if (estaSeleccionado) {
    return `${baseTamano} bg-[#1B365D] text-white border-2 border-[#1B365D]`;
  }
  if (esHoy) {
    return `${baseTamano} bg-[#FBE7B4] text-gray-950 border-2 border-[#C69738] hover:bg-[#F5DC9B]`;
  }
  return `${baseTamano} bg-white text-gray-900 border-2 border-gray-500 hover:bg-gray-100`;
}

export function VistaAgenda({
  nombreAlumno,
  tareas,
  onVolver,
  onIniciarTarea,
  onVerDetalleTarea,
  onAnadirTarea,
  onCambiarPeriodo,
  onSeleccionarDia,
}: VistaAgendaProps) {
  const { estudianteId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationStateAgenda | null;

  const [periodo, setPeriodo] = useState<'hoy' | 'semana' | 'mes'>('hoy');
  const [modoSelectorDias, setModoSelectorDias] = useState<boolean>(false);
  const [diaSemanaSeleccionado, setDiaSemanaSeleccionado] = useState<string | null>(null);
  const [diaMesSeleccionado, setDiaMesSeleccionado] = useState<number | null>(null);
  const [paginaActual, setPaginaActual] = useState(0);

  const hoy = useMemo(() => {
    const ahora = new Date();
    return new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  }, []);

  const semanasMes = useMemo(() => obtenerSemanasCalendarioMesActual(), []);

  const totalPaginas = Math.max(1, Math.ceil(tareas.length / TAREAS_POR_PAGINA));
  const paginaSegura = Math.min(paginaActual, totalPaginas - 1);
  const inicio = paginaSegura * TAREAS_POR_PAGINA;
  const tareasVisibles = tareas.slice(inicio, inicio + TAREAS_POR_PAGINA);
  const filasFijas = Array.from({ length: TAREAS_POR_PAGINA }, (_, i) => tareasVisibles[i] ?? null);

  const manejarCambioPeriodo = (nuevoPeriodo: 'hoy' | 'semana' | 'mes') => {
    setPeriodo(nuevoPeriodo);
    setPaginaActual(0);
    if (nuevoPeriodo === 'hoy') {
      setModoSelectorDias(false);
      setDiaSemanaSeleccionado(null);
      setDiaMesSeleccionado(null);
    } else if (nuevoPeriodo === 'semana') {
      setDiaSemanaSeleccionado(null);
      setModoSelectorDias(true);
    } else {
      setDiaMesSeleccionado(null);
      setModoSelectorDias(true);
    }
    onCambiarPeriodo?.(nuevoPeriodo);
  };

  const manejarElegirDiaSemana = (diaLabel: string) => {
    setDiaSemanaSeleccionado(diaLabel);
    setModoSelectorDias(false);
    setPaginaActual(0);
    onSeleccionarDia?.(diaLabel);
  };

  const manejarElegirDiaMes = (dia: number) => {
    setDiaMesSeleccionado(dia);
    setModoSelectorDias(false);
    setPaginaActual(0);
    onSeleccionarDia?.(dia);
  };

  const manejarVerTarea = (tarea: TareaAgenda) => {
    onVerDetalleTarea?.(tarea);
    navigate(`/agenda/${estudianteId ?? ''}/modificar-tarea`, {
      state: {
        nombreAlumno: nombreAlumno ?? state?.nombreAlumno,
        tarea,
      },
    });
  };

  const etiquetaDiaActual = useMemo(() => {
    if (periodo === 'hoy') {
      return formatearEtiquetaDia(new Date(), true);
    }
    if (periodo === 'semana') {
      if (!diaSemanaSeleccionado) {
        return formatearEtiquetaDia(new Date(), true);
      }
      const config = DIAS_SEMANA_CONFIG.find((d) => d.label === diaSemanaSeleccionado);
      const fechaSemana = obtenerFechaDeDiaSemanaActual(config?.dayIndex ?? 1);
      return formatearEtiquetaDia(fechaSemana);
    }
    if (diaMesSeleccionado === null) {
      return formatearEtiquetaDia(new Date(), true);
    }
    const fechaMes = obtenerFechaDeDiaMesActual(diaMesSeleccionado);
    return formatearEtiquetaDia(fechaMes);
  }, [periodo, diaSemanaSeleccionado, diaMesSeleccionado]);

  const manejarAnadirTarea = () => {
    if (onAnadirTarea) {
      onAnadirTarea();
      return;
    }
    navigate(`/agenda/${estudianteId ?? ''}/nueva-tarea`, {
      state: {
        nombreAlumno: nombreAlumno ?? state?.nombreAlumno,
      },
    });
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#F7F4E9] flex flex-col justify-between p-6 select-none">
      <header className="flex items-center justify-between w-full shrink-0 h-28">
        <div className="flex items-center gap-6">
          <img
            src="/logo-app-sin-fondo.png"
            alt="AnticipaTuDía"
            className="w-24 h-24 object-contain shrink-0"
          />
          <h1 className="text-5xl font-bold text-gray-900">Tareas</h1>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <img
            src="/girl.png"
            alt="Avatar"
            className="w-20 h-20 rounded-2xl object-cover border-2 border-gray-800 bg-white shrink-0 shadow-xs"
          />
          <BotonAccesibilidad />
        </div>
      </header>

      <main className="flex-1 min-h-0 flex flex-col justify-between max-w-4xl w-full mx-auto py-2">
        <div className="w-full flex items-center justify-between gap-4 shrink-0 min-h-[60px] px-2 mb-2">
          <div className="min-w-0">
            {!modoSelectorDias && (
              <h2 className="text-3xl font-bold text-gray-900 truncate">{etiquetaDiaActual}</h2>
            )}
          </div>

          <div className="flex gap-2 shrink-0">
            {(['hoy', 'semana', 'mes'] as const).map((p) => {
              const estaActivo = periodo === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => manejarCambioPeriodo(p)}
                  className={`px-4 py-2 rounded-xl font-bold text-base transition cursor-pointer border-2 ${
                    estaActivo
                      ? 'bg-[#1B365D] text-white border-[#1B365D]'
                      : 'bg-white text-gray-800 border-gray-400 hover:bg-gray-100'
                  }`}
                >
                  {p === 'hoy' ? 'Hoy' : p === 'semana' ? 'Esta semana' : 'Este mes'}
                </button>
              );
            })}
          </div>
        </div>

        <div className="w-full flex-1 min-h-0 flex flex-col justify-between gap-4 my-1">
          {modoSelectorDias && periodo === 'semana' ? (
            <div className="h-full flex flex-col items-center justify-center gap-4 px-2">
              <div className="flex flex-wrap items-center justify-center gap-3.5 max-w-3xl">
                {DIAS_SEMANA_CONFIG.map((dia) => {
                  const fechaDia = obtenerFechaDeDiaSemanaActual(dia.dayIndex);
                  const esHoy = esMismaFechaCalendario(fechaDia, hoy);
                  const activo = diaSemanaSeleccionado === dia.label;
                  return (
                    <button
                      key={dia.label}
                      type="button"
                      onClick={() => manejarElegirDiaSemana(dia.label)}
                      className={`transition cursor-pointer shadow-sm ${obtenerClaseBotonDia({
                        esHoy,
                        estaSeleccionado: activo,
                        tamano: 'semana',
                      })}`}
                    >
                      {dia.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : modoSelectorDias && periodo === 'mes' ? (
            <div className="h-full flex flex-col items-center justify-center gap-2.5 px-2">
              <div className="grid grid-cols-7 gap-3 w-full max-w-2xl mb-1">
                {DIAS_SEMANA_CONFIG.map((dia) => (
                  <div
                    key={dia.label}
                    className="text-center font-bold text-lg text-gray-800 select-none"
                  >
                    {dia.shortLabel}
                  </div>
                ))}
              </div>

              {semanasMes.map((semana, indiceSemana) => (
                <div
                  key={indiceSemana}
                  className="grid grid-cols-7 gap-3 w-full max-w-2xl justify-items-center"
                >
                  {semana.map((dia, indiceColumna) => {
                    if (!dia) {
                      return (
                        <div
                          key={`vacio-${indiceSemana}-${indiceColumna}`}
                          aria-hidden="true"
                          className="w-16 h-11 rounded-xl invisible pointer-events-none"
                        />
                      );
                    }

                    const fechaCelda = obtenerFechaDeDiaMesActual(dia);
                    const esHoy = esMismaFechaCalendario(fechaCelda, hoy);
                    const activo = diaMesSeleccionado === dia;

                    return (
                      <button
                        key={dia}
                        type="button"
                        onClick={() => manejarElegirDiaMes(dia)}
                        aria-label={`Día ${dia}`}
                        className={`transition cursor-pointer flex items-center justify-center shadow-sm ${obtenerClaseBotonDia({
                          esHoy,
                          estaSeleccionado: activo,
                          tamano: 'mes',
                        })}`}
                      >
                        {dia}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          ) : tareas.length === 0 ? (
            <div className="h-full bg-white/80 border-2 border-dashed border-gray-300 rounded-2xl p-8 flex items-center justify-center text-center">
              <p className="text-2xl font-medium text-gray-600">
                No hay tareas previstas para este intervalo.
              </p>
            </div>
          ) : (
            filasFijas.map((tarea, index) => {
              const colorClase = COLORES_TARJETA[index % COLORES_TARJETA.length];

              if (!tarea) {
                return (
                  <div
                    key={`hueco-${index}`}
                    aria-hidden="true"
                    className="flex-1 min-h-0 flex items-center gap-4 invisible pointer-events-none"
                  >
                    <div className="flex-1 h-full px-6 py-3 rounded-2xl border-2" />
                    <div className="h-full px-8 py-4 rounded-2xl text-2xl font-bold">
                      Iniciar
                    </div>
                  </div>
                );
              }

              return (
                <div key={tarea.id} className="flex-1 min-h-0 flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => manejarVerTarea(tarea)}
                    className={`flex-1 h-full flex items-center justify-between px-6 py-3 rounded-2xl border-2 text-left shadow-sm hover:brightness-95 active:scale-[0.99] transition cursor-pointer ${colorClase}`}
                  >
                    <div className="min-w-0 pr-4">
                      <p className="text-2xl font-bold text-gray-900 truncate">{tarea.titulo}</p>
                      <p className="text-lg font-medium text-gray-800 truncate">{tarea.diaTiempo}</p>
                    </div>

                    <span className="shrink-0 inline-flex items-center gap-2.5 px-5 py-3 rounded-2xl border-2 border-gray-900 bg-white/90 text-gray-900 font-bold text-xl shadow-xs">
                      <span>Ver</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-7 h-7"
                        aria-hidden="true"
                      >
                        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onIniciarTarea(tarea.id)}
                    className="h-full px-8 py-4 bg-[#1B365D] hover:bg-[#132744] active:scale-95 text-white text-2xl font-bold rounded-2xl shadow-md transition cursor-pointer shrink-0 flex items-center justify-center"
                  >
                    Iniciar
                  </button>
                </div>
              );
            })
          )}
        </div>

        <div className="h-14 shrink-0 flex items-center justify-center">
          {!modoSelectorDias && totalPaginas > 1 && (
            <div className="flex items-center gap-6">
              <div className="w-40 flex justify-end">
                {paginaSegura > 0 && (
                  <button
                    type="button"
                    onClick={() => setPaginaActual((p) => Math.max(0, p - 1))}
                    className="px-5 py-2 rounded-xl bg-white border-2 border-gray-800 font-bold text-lg hover:bg-gray-100 cursor-pointer"
                  >
                    ← Anteriores
                  </button>
                )}
              </div>

              <span className="text-lg font-semibold text-gray-700 whitespace-nowrap">
                Página {paginaSegura + 1} de {totalPaginas}
              </span>

              <div className="w-40 flex justify-start">
                {paginaSegura < totalPaginas - 1 && (
                  <button
                    type="button"
                    onClick={() => setPaginaActual((p) => Math.min(totalPaginas - 1, p + 1))}
                    className="px-5 py-2 rounded-xl bg-white border-2 border-gray-800 font-bold text-lg hover:bg-gray-100 cursor-pointer"
                  >
                    Siguientes →
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="relative flex items-center justify-between shrink-0 h-16">
        <button
          type="button"
          onClick={() => {
            if (modoSelectorDias) {
              setModoSelectorDias(false);
              setPeriodo('hoy');
            } else {
              onVolver();
            }
          }}
          aria-label="Ir al inicio"
          className="w-14 h-14 rounded-full border-2 border-gray-900 bg-white hover:bg-gray-100 flex items-center justify-center text-gray-900 shadow-sm transition cursor-pointer"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-7 h-7"
            aria-hidden="true"
          >
            <path d="M3 10.5 12 3l9 7.5" />
            <path d="M5 9.5V20h14V9.5" />
            <path d="M10 20v-6h4v6" />
          </svg>
        </button>

        <div className="absolute left-1/2 -translate-x-1/2">
          <button
            type="button"
            onClick={manejarAnadirTarea}
            className="inline-flex items-center gap-3 px-8 py-3 rounded-2xl bg-[#1B365D] hover:bg-[#132744] active:scale-[0.98] text-white text-2xl font-extrabold border-2 border-[#C69738] ring-4 ring-[#FBE7B4] shadow-lg transition cursor-pointer"
          >
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-[#FBE7B4] text-[#1B365D] text-3xl font-black leading-none">
              +
            </span>
            <span>Añadir tarea</span>
          </button>
        </div>

        <div className="w-14 shrink-0" aria-hidden="true" />
      </footer>
    </div>
  );
}