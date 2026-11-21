import { useMemo, useState, type FormEvent } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import BotonAccesibilidad from '../../accessibility/BotonAccesibilidad';
import type { TareaAgenda } from './VistaAgenda';

type RecurrenciaTipo = 'puntual' | 'diaria' | 'semanal' | 'mensual';

export interface SubtareaDraft {
  id: string;
  titulo: string;
  descripcion?: string;
  pictogramaId?: string;
}

interface LocationStateModificar {
  nombreAlumno?: string;
  fechaInicial?: string;
  tarea?: TareaAgenda;
  tareaExistente?: TareaAgenda;
  subtareasIniciales?: SubtareaDraft[];
}

const COLORES_SUBTAREA = [
  'bg-[#6D9DC5] border-[#4A779D]', // Azul
  'bg-[#95C2B2] border-[#6A9988]', // Verde agua
  'bg-[#F2B08A] border-[#C9855E]', // Salmón
];

// Pictogramas temporales hasta conectar con la BD
const PICTOGRAMAS_DISPONIBLES = [
  { id: 'mochila', nombre: 'Mochila', emoji: '🎒' },
  { id: 'desayuno', nombre: 'Desayuno', emoji: '🥣' },
  { id: 'dientes', nombre: 'Higiene', emoji: '🪥' },
  { id: 'estudio', nombre: 'Estudiar', emoji: '📚' },
  { id: 'paseo', nombre: 'Paseo', emoji: '🚶' },
  { id: 'descanso', nombre: 'Descanso', emoji: '⭐' },
] as const;

const SUBTAREAS_POR_PAGINA = 5;

function obtenerFechaHoyIso(): string {
  const hoy = new Date();
  const y = hoy.getFullYear();
  const m = String(hoy.getMonth() + 1).padStart(2, '0');
  const d = String(hoy.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parsearDatosInicialesTarea(
  tarea: TareaAgenda | undefined,
  fechaInicial?: string,
): {
  titulo: string;
  recurrencia: RecurrenciaTipo;
  fecha: string;
  horaInicio: string;
  horaFin: string;
} {
  const fechaPorDefecto = fechaInicial || obtenerFechaHoyIso();
  if (!tarea) {
    return {
      titulo: '',
      recurrencia: 'puntual',
      fecha: fechaPorDefecto,
      horaInicio: '09:00',
      horaFin: '10:00',
    };
  }

  let recurrencia: RecurrenciaTipo = 'puntual';
  let fecha = fechaPorDefecto;
  let horaInicio = '09:00';
  let horaFin = '10:00';

  const partes = tarea.diaTiempo.split('·').map((p) => p.trim());
  const parteFechaORec = partes[0] ?? '';
  const parteHoras = partes[1] ?? partes[0] ?? '';

  if (/cada d[ií]a/i.test(parteFechaORec)) {
    recurrencia = 'diaria';
  } else if (/cada semana/i.test(parteFechaORec)) {
    recurrencia = 'semanal';
  } else if (/cada mes/i.test(parteFechaORec)) {
    recurrencia = 'mensual';
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(parteFechaORec)) {
    fecha = parteFechaORec;
  }

  const horasMatch = parteHoras.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
  if (horasMatch) {
    horaInicio = horasMatch[1].padStart(5, '0');
    horaFin = horasMatch[2].padStart(5, '0');
  } else {
    const horaSimpleMatch = parteHoras.match(/(\d{1,2}:\d{2})/);
    if (horaSimpleMatch) {
      horaInicio = horaSimpleMatch[1].padStart(5, '0');
    }
  }

  return {
    titulo: tarea.titulo,
    recurrencia,
    fecha,
    horaInicio,
    horaFin,
  };
}

export default function ModificarTareaPage() {
  const { estudianteId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationStateModificar | null;

  const tareaOriginal = state?.tarea ?? state?.tareaExistente;
  const iniciales = useMemo(
    () => parsearDatosInicialesTarea(tareaOriginal, state?.fechaInicial),
    [tareaOriginal, state?.fechaInicial],
  );

  // Pantalla principal ('tarea') o pantalla dedicada a crear/ver subtarea ('subtarea')
  const [pantalla, setPantalla] = useState<'tarea' | 'subtarea'>('tarea');
  const [subtareaEditandoId, setSubtareaEditandoId] = useState<string | null>(null);

  // Campos de la tarea (mitad izquierda)
  const [titulo, setTitulo] = useState(iniciales.titulo);
  const [pictogramaTareaId, setPictogramaTareaId] = useState<string | null>(null);
  const [mostrarSelectorPictogramaTarea, setMostrarSelectorPictogramaTarea] = useState(false);
  const [recurrencia, setRecurrencia] = useState<RecurrenciaTipo>(iniciales.recurrencia);
  const [fecha, setFecha] = useState<string>(iniciales.fecha);
  const [horaInicio, setHoraInicio] = useState(iniciales.horaInicio);
  const [horaFin, setHoraFin] = useState(iniciales.horaFin);
  const [descripcion, setDescripcion] = useState('');

  // Subtareas (mitad derecha)
  const [subtareas, setSubtareas] = useState<SubtareaDraft[]>(state?.subtareasIniciales ?? []);
  const [paginaSubtareas, setPaginaSubtareas] = useState(0);

  // Campos de la pantalla de crear/ver subtarea
  const [tituloSubtarea, setTituloSubtarea] = useState('');
  const [descripcionSubtarea, setDescripcionSubtarea] = useState('');
  const [pictogramaSubtareaId, setPictogramaSubtareaId] = useState<string | null>(null);

  const [errorForm, setErrorForm] = useState<string | null>(null);

  const totalPaginasSubtareas = Math.max(1, Math.ceil(subtareas.length / SUBTAREAS_POR_PAGINA));
  const paginaSegura = Math.min(paginaSubtareas, totalPaginasSubtareas - 1);

  const filasFijasSubtareas = useMemo(() => {
    const inicio = paginaSegura * SUBTAREAS_POR_PAGINA;
    const visibles = subtareas.slice(inicio, inicio + SUBTAREAS_POR_PAGINA);
    return Array.from({ length: SUBTAREAS_POR_PAGINA }, (_, i) => {
      const item = visibles[i] ?? null;
      return item ? { subtarea: item, indiceGlobal: inicio + i } : null;
    });
  }, [subtareas, paginaSegura]);

  const alternarRecurrencia = (tipo: Exclude<RecurrenciaTipo, 'puntual'>) => {
    setRecurrencia((actual) => (actual === tipo ? 'puntual' : tipo));
  };

  const abrirPantallaCrearSubtarea = () => {
    setSubtareaEditandoId(null);
    setTituloSubtarea('');
    setDescripcionSubtarea('');
    setPictogramaSubtareaId(null);
    setErrorForm(null);
    setPantalla('subtarea');
  };

  const abrirPantallaVerSubtarea = (subtarea: SubtareaDraft) => {
    setSubtareaEditandoId(subtarea.id);
    setTituloSubtarea(subtarea.titulo);
    setDescripcionSubtarea(subtarea.descripcion ?? '');
    setPictogramaSubtareaId(subtarea.pictogramaId ?? null);
    setErrorForm(null);
    setPantalla('subtarea');
  };

  const guardarSubtarea = (e: FormEvent) => {
    e.preventDefault();
    const limpio = tituloSubtarea.trim();
    if (!limpio) {
      setErrorForm('Escribe el nombre de la subtarea.');
      return;
    }

    if (subtareaEditandoId) {
      setSubtareas((prev) =>
        prev.map((item) =>
          item.id === subtareaEditandoId
            ? {
                ...item,
                titulo: limpio,
                descripcion: descripcionSubtarea.trim() || undefined,
                pictogramaId: pictogramaSubtareaId ?? undefined,
              }
            : item,
        ),
      );
    } else {
      const creada: SubtareaDraft = {
        id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        titulo: limpio,
        descripcion: descripcionSubtarea.trim() || undefined,
        pictogramaId: pictogramaSubtareaId ?? undefined,
      };

      setSubtareas((prev) => {
        const siguiente = [...prev, creada];
        const nuevaUltimaPagina = Math.max(0, Math.ceil(siguiente.length / SUBTAREAS_POR_PAGINA) - 1);
        setPaginaSubtareas(nuevaUltimaPagina);
        return siguiente;
      });
    }

    setSubtareaEditandoId(null);
    setErrorForm(null);
    setPantalla('tarea');
  };

  const borrarSubtareaActual = () => {
    if (!subtareaEditandoId) return;

    setSubtareas((prev) => {
      const siguiente = prev.filter((item) => item.id !== subtareaEditandoId);
      const maxPagina = Math.max(0, Math.ceil(siguiente.length / SUBTAREAS_POR_PAGINA) - 1);
      setPaginaSubtareas((p) => Math.min(p, maxPagina));
      return siguiente;
    });

    setSubtareaEditandoId(null);
    setErrorForm(null);
    setPantalla('tarea');
  };

  // Flechas en orden accesible: primero subir (↑), después bajar (↓)
  const moverSubtareaArriba = (indice: number) => {
    if (indice <= 0) return;
    setSubtareas((prev) => {
      const copia = [...prev];
      const temp = copia[indice - 1];
      copia[indice - 1] = copia[indice];
      copia[indice] = temp;
      return copia;
    });
  };

  const moverSubtareaAbajo = (indice: number) => {
    if (indice >= subtareas.length - 1) return;
    setSubtareas((prev) => {
      const copia = [...prev];
      const temp = copia[indice + 1];
      copia[indice + 1] = copia[indice];
      copia[indice] = temp;
      return copia;
    });
  };

  // Espacio reservado para la funcionalidad de borrar hecha por tu compañero
  const manejarBorrarTarea = () => {
    // TODO: Funcionalidad de borrar tarea hecha por el compañero
  };

  const guardarCambiosTarea = (e: FormEvent) => {
    e.preventDefault();
    const tituloLimpio = titulo.trim();
    if (!tituloLimpio) {
      setErrorForm('Escribe un nombre para la tarea.');
      return;
    }

    const etiquetaRecurrencia =
      recurrencia === 'diaria'
        ? 'Cada día'
        : recurrencia === 'semanal'
          ? 'Cada semana'
          : recurrencia === 'mensual'
            ? 'Cada mes'
            : fecha;

    const tareaModificada: TareaAgenda = {
      id: tareaOriginal?.id ?? `tarea-${Date.now()}`,
      titulo: tituloLimpio,
      diaTiempo: `${etiquetaRecurrencia} · ${horaInicio} - ${horaFin}`,
    };

    navigate(`/agenda/${estudianteId ?? ''}`, {
      state: {
        nombreAlumno: state?.nombreAlumno,
        tareaModificada,
        subtareasModificadas: subtareas,
      },
    });
  };

  const pictogramaTareaSeleccionado = PICTOGRAMAS_DISPONIBLES.find(
    (p) => p.id === pictogramaTareaId,
  );

  // PANTALLA DEDICADA PARA CREAR O VER/MODIFICAR SUBTAREA
  if (pantalla === 'subtarea') {
    const esEdicionSub = subtareaEditandoId !== null;

    return (
      <div className="h-screen w-screen overflow-hidden bg-[#F7F4E9] flex flex-col justify-between px-6 py-4 select-none">
        <header className="flex items-center justify-between w-full shrink-0 h-24">
          <div className="flex items-center gap-5">
            <img
              src="/logo-app-sin-fondo.png"
              alt="AnticipaTuDía"
              className="w-20 h-20 object-contain shrink-0"
            />
            <h1 className="text-[42px] font-bold text-gray-900">
              {esEdicionSub ? 'Detalle de subtarea' : 'Nueva subtarea'}
            </h1>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <img
              src="/girl.png"
              alt="Avatar"
              className="w-16 h-16 rounded-2xl object-cover border-2 border-gray-800 bg-white shrink-0"
            />
            <BotonAccesibilidad />
          </div>
        </header>

        <form
          onSubmit={guardarSubtarea}
          className="flex-1 min-h-0 max-w-3xl w-full mx-auto flex flex-col justify-center gap-5 py-2"
        >
          <div>
            <label
              htmlFor="nombre-subtarea"
              className="block text-2xl font-bold text-gray-900 mb-2"
            >
              Nombre de la subtarea
            </label>
            <input
              id="nombre-subtarea"
              type="text"
              autoFocus
              value={tituloSubtarea}
              onChange={(e) => {
                setTituloSubtarea(e.target.value);
                if (errorForm) setErrorForm(null);
              }}
              placeholder="Ej: Coger el cepillo de dientes"
              className="w-full rounded-2xl border-2 border-gray-800 bg-white px-4 py-3 text-2xl text-gray-900 focus:outline-none focus:ring-4 focus:ring-[#FBE7B4]"
            />
          </div>

          <div>
            <label
              htmlFor="descripcion-subtarea"
              className="block text-2xl font-bold text-gray-900 mb-2"
            >
              Descripción (opcional)
            </label>
            <textarea
              id="descripcion-subtarea"
              rows={2}
              value={descripcionSubtarea}
              onChange={(e) => setDescripcionSubtarea(e.target.value)}
              placeholder="Pasos o ayuda visual para esta subtarea..."
              className="w-full rounded-2xl border-2 border-gray-800 bg-white px-4 py-2.5 text-xl text-gray-900 resize-none focus:outline-none focus:ring-4 focus:ring-[#FBE7B4]"
            />
          </div>

          <div>
            <p className="block text-2xl font-bold text-gray-900 mb-2">
              Elegir pictograma
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {PICTOGRAMAS_DISPONIBLES.map((pic) => {
                const seleccionada = pictogramaSubtareaId === pic.id;
                return (
                  <button
                    key={pic.id}
                    type="button"
                    onClick={() =>
                      setPictogramaSubtareaId((actual) => (actual === pic.id ? null : pic.id))
                    }
                    className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-2xl border-2 transition cursor-pointer ${
                      seleccionada
                        ? 'bg-[#1B365D] text-white border-[#1B365D]'
                        : 'bg-white text-gray-900 border-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-3xl leading-none mb-1" aria-hidden="true">
                      {pic.emoji}
                    </span>
                    <span className="text-base font-bold truncate max-w-full">{pic.nombre}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {errorForm && (
            <p role="alert" className="text-xl font-bold text-red-700">
              {errorForm}
            </p>
          )}

          <div className="flex items-center justify-between gap-4 pt-2">
            <div>
              {esEdicionSub && (
                <button
                  type="button"
                  onClick={borrarSubtareaActual}
                  className="px-6 py-3 rounded-2xl border-2 border-red-700 bg-red-600 hover:bg-red-700 text-white text-2xl font-bold shadow-sm transition cursor-pointer"
                >
                  Borrar
                </button>
              )}
            </div>

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => {
                  setSubtareaEditandoId(null);
                  setErrorForm(null);
                  setPantalla('tarea');
                }}
                className="px-6 py-3 rounded-2xl border-2 border-[#1B365D] bg-white hover:bg-[#F7F4E9] text-[#1B365D] text-2xl font-bold transition cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="px-7 py-3 rounded-2xl border-2 border-[#1B365D] bg-[#1B365D] hover:bg-[#132744] text-white text-2xl font-bold shadow-sm transition cursor-pointer"
              >
                {esEdicionSub ? 'Guardar cambios' : 'Añadir subtarea'}
              </button>
            </div>
          </div>
        </form>

        <footer className="flex items-center shrink-0 h-14">
          <button
            type="button"
            onClick={() =>
              navigate(`/agenda/${estudianteId ?? ''}`, {
                state: { nombreAlumno: state?.nombreAlumno },
              })
            }
            aria-label="Ir al inicio de la agenda"
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
        </footer>
      </div>
    );
  }

  // PANTALLA PRINCIPAL DE MODIFICAR TAREA (DIVIDIDA EN DOS MITADES)
  return (
    <div className="min-h-screen h-screen w-screen overflow-hidden bg-[#F7F4E9] flex flex-col justify-between px-6 py-3 select-none">
      {/* CABECERA */}
      <header className="flex items-center justify-between w-full shrink-0 h-20">
        <div className="flex items-center gap-5">
          <img
            src="/logo-app-sin-fondo.png"
            alt="AnticipaTuDía"
            className="w-16 h-16 object-contain shrink-0"
          />
          <h1 className="text-[40px] font-bold text-gray-900">Modificar tarea</h1>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <img
            src="/girl.png"
            alt="Avatar"
            className="w-14 h-14 rounded-2xl object-cover border-2 border-gray-800 bg-white shrink-0"
          />
          <BotonAccesibilidad />
        </div>
      </header>

      {/* CUERPO DIVIDIDO EN DOS MITADES */}
      <form
        id="form-modificar-tarea"
        onSubmit={guardarCambiosTarea}
        className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl w-full mx-auto py-1"
      >
        {/* MITAD IZQUIERDA: DATOS DE LA TAREA */}
        <section
          aria-label="Datos de la tarea"
          className="min-h-0 flex flex-col justify-between gap-2.5 pr-1"
        >
          {/* Título + Elegir pictograma */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="titulo-tarea"
                className="block text-xl font-bold text-gray-900 mb-1"
              >
                Nombre de la tarea
              </label>
              <input
                id="titulo-tarea"
                type="text"
                value={titulo}
                onChange={(e) => {
                  setTitulo(e.target.value);
                  if (errorForm) setErrorForm(null);
                }}
                placeholder="Ej: Preparar mochila"
                className="w-full rounded-xl border-2 border-gray-800 bg-white px-3.5 py-2 text-xl text-gray-900 focus:outline-none focus:ring-4 focus:ring-[#FBE7B4]"
              />
            </div>

            <div className="relative">
              <span className="block text-xl font-bold text-gray-900 mb-1">
                Elegir pictograma
              </span>
              <button
                type="button"
                onClick={() => setMostrarSelectorPictogramaTarea((v) => !v)}
                className="w-full rounded-xl border-2 border-gray-800 bg-white hover:bg-gray-100 px-3.5 py-2 text-xl font-bold text-gray-900 flex items-center justify-between cursor-pointer"
              >
                <span className="truncate">
                  {pictogramaTareaSeleccionado
                    ? `${pictogramaTareaSeleccionado.emoji} ${pictogramaTareaSeleccionado.nombre}`
                    : 'Seleccionar pictograma'}
                </span>
                <span aria-hidden="true">▾</span>
              </button>

              {mostrarSelectorPictogramaTarea && (
                <div className="absolute z-20 mt-1.5 w-full rounded-2xl border-2 border-gray-900 bg-white p-2.5 shadow-xl grid grid-cols-3 gap-2">
                  {PICTOGRAMAS_DISPONIBLES.map((pic) => (
                    <button
                      key={pic.id}
                      type="button"
                      onClick={() => {
                        setPictogramaTareaId((actual) => (actual === pic.id ? null : pic.id));
                        setMostrarSelectorPictogramaTarea(false);
                      }}
                      className={`flex flex-col items-center py-1.5 px-1 rounded-xl border text-sm font-bold cursor-pointer ${
                        pictogramaTareaId === pic.id
                          ? 'bg-[#1B365D] text-white border-[#1B365D]'
                          : 'bg-[#F7F4E9] text-gray-900 border-gray-400 hover:bg-gray-100'
                      }`}
                    >
                      <span className="text-2xl" aria-hidden="true">
                        {pic.emoji}
                      </span>
                      <span className="truncate max-w-full">{pic.nombre}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recurrencia (cuadrados a la izquierda) + Fecha (a la derecha) */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            <div className="sm:col-span-7">
              <span className="block text-xl font-bold text-gray-900 mb-1">
                Recurrencia
              </span>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { id: 'diaria', etiqueta: 'Cada día' },
                    { id: 'semanal', etiqueta: 'Cada semana' },
                    { id: 'mensual', etiqueta: 'Cada mes' },
                  ] as const
                ).map((item) => {
                  const activa = recurrencia === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => alternarRecurrencia(item.id)}
                      className={`h-12 px-2 rounded-xl border-2 font-bold text-base leading-tight flex items-center justify-center text-center transition cursor-pointer ${
                        activa
                          ? 'bg-[#1B365D] text-white border-[#1B365D]'
                          : 'bg-white text-gray-900 border-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {item.etiqueta}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="sm:col-span-5">
              <label
                htmlFor="fecha-tarea"
                className="block text-xl font-bold text-gray-900 mb-1"
              >
                Fecha
              </label>
              <input
                id="fecha-tarea"
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full h-12 rounded-xl border-2 border-gray-800 bg-white px-3 text-lg font-bold text-gray-900 focus:outline-none focus:ring-4 focus:ring-[#FBE7B4]"
              />
            </div>
          </div>

          {/* Hora inicio y Hora fin */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="hora-inicio"
                className="block text-xl font-bold text-gray-900 mb-1"
              >
                Hora inicio
              </label>
              <input
                id="hora-inicio"
                type="time"
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
                className="w-full rounded-xl border-2 border-gray-800 bg-white px-3.5 py-2 text-xl font-bold text-gray-900 focus:outline-none focus:ring-4 focus:ring-[#FBE7B4]"
              />
            </div>

            <div>
              <label
                htmlFor="hora-fin"
                className="block text-xl font-bold text-gray-900 mb-1"
              >
                Hora fin
              </label>
              <input
                id="hora-fin"
                type="time"
                value={horaFin}
                onChange={(e) => setHoraFin(e.target.value)}
                className="w-full rounded-xl border-2 border-gray-800 bg-white px-3.5 py-2 text-xl font-bold text-gray-900 focus:outline-none focus:ring-4 focus:ring-[#FBE7B4]"
              />
            </div>
          </div>

          {/* Descripción (opcional) */}
          <div className="flex-1 min-h-0 flex flex-col">
            <label
              htmlFor="descripcion-tarea"
              className="block text-xl font-bold text-gray-900 mb-1"
            >
              Descripción (opcional)
            </label>
            <textarea
              id="descripcion-tarea"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Añade detalles o apoyos si hace falta..."
              className="flex-1 min-h-[68px] w-full rounded-xl border-2 border-gray-800 bg-white px-3.5 py-2 text-lg text-gray-900 resize-none focus:outline-none focus:ring-4 focus:ring-[#FBE7B4]"
            />
          </div>

          {errorForm && (
            <p role="alert" className="text-lg font-bold text-red-700">
              {errorForm}
            </p>
          )}
        </section>

        {/* MITAD DERECHA: SUBTAREAS */}
        <section
          aria-label="Subtareas"
          className="min-h-0 flex flex-col justify-between gap-2.5 pl-1"
        >
          <div className="w-full flex items-center justify-between shrink-0">
            <h2 className="text-[28px] font-bold text-gray-900">Subtareas</h2>
            <button
              type="button"
              onClick={abrirPantallaCrearSubtarea}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1B365D] hover:bg-[#132744] text-white font-bold text-lg shadow-sm transition cursor-pointer"
            >
              <span className="text-2xl leading-none font-black">+</span>
              <span>Añadir subtarea</span>
            </button>
          </div>

          <div className="w-full flex-1 min-h-0 flex flex-col justify-between gap-2">
            {subtareas.length === 0 ? (
              <div className="h-full bg-white/80 border-2 border-dashed border-gray-300 rounded-2xl p-6 flex items-center justify-center text-center">
                <p className="text-2xl font-medium text-gray-600">
                  Aún no hay subtareas. Pulsa «+ Añadir subtarea» arriba.
                </p>
              </div>
            ) : (
              filasFijasSubtareas.map((fila, idx) => {
                if (!fila) {
                  return (
                    <div
                      key={`hueco-sub-${idx}`}
                      aria-hidden="true"
                      className="flex-1 min-h-0 px-5 py-2 rounded-2xl border-2 invisible pointer-events-none"
                    />
                  );
                }

                const { subtarea, indiceGlobal } = fila;
                const colorClase = COLORES_SUBTAREA[indiceGlobal % COLORES_SUBTAREA.length];
                const puedeSubir = indiceGlobal > 0;
                const puedeBajar = indiceGlobal < subtareas.length - 1;

                return (
                  <div
                    key={subtarea.id}
                    className={`flex-1 min-h-0 flex items-center justify-between gap-3 px-5 py-2 rounded-2xl border-2 shadow-xs ${colorClase}`}
                  >
                    <p className="min-w-0 flex-1 text-2xl font-bold text-gray-900 truncate">
                      {indiceGlobal + 1} {subtarea.titulo}
                    </p>

                    <div className="flex items-center gap-2 shrink-0">
                      {puedeSubir && (
                        <button
                          type="button"
                          onClick={() => moverSubtareaArriba(indiceGlobal)}
                          aria-label={`Subir ${indiceGlobal + 1} ${subtarea.titulo}`}
                          className="w-12 h-10 rounded-xl border-2 border-gray-900 bg-white/95 hover:bg-white flex items-center justify-center font-extrabold text-2xl text-gray-900 shadow-2xs transition cursor-pointer"
                        >
                          ↑
                        </button>
                      )}
                      {puedeBajar && (
                        <button
                          type="button"
                          onClick={() => moverSubtareaAbajo(indiceGlobal)}
                          aria-label={`Bajar ${indiceGlobal + 1} ${subtarea.titulo}`}
                          className="w-12 h-10 rounded-xl border-2 border-gray-900 bg-white/95 hover:bg-white flex items-center justify-center font-extrabold text-2xl text-gray-900 shadow-2xs transition cursor-pointer"
                        >
                          ↓
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => abrirPantallaVerSubtarea(subtarea)}
                        aria-label={`Ver ${indiceGlobal + 1} ${subtarea.titulo}`}
                        className="h-10 px-3.5 rounded-xl border-2 border-gray-900 bg-white/95 hover:bg-white flex items-center gap-1.5 font-bold text-lg text-gray-900 shadow-2xs transition cursor-pointer"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="w-5 h-5 shrink-0"
                          aria-hidden="true"
                        >
                          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                        <span>Ver</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="h-10 shrink-0 flex items-center justify-center">
            {totalPaginasSubtareas > 1 && (
              <div className="flex items-center gap-6">
                <div className="w-40 flex justify-end">
                  {paginaSegura > 0 && (
                    <button
                      type="button"
                      onClick={() => setPaginaSubtareas((p) => Math.max(0, p - 1))}
                      className="px-4 py-1.5 rounded-xl bg-white border-2 border-gray-800 font-bold text-lg hover:bg-gray-100 cursor-pointer"
                    >
                      ← Anteriores
                    </button>
                  )}
                </div>

                <span className="text-lg font-semibold text-gray-700 whitespace-nowrap">
                  Página {paginaSegura + 1} de {totalPaginasSubtareas}
                </span>

                <div className="w-40 flex justify-start">
                  {paginaSegura < totalPaginasSubtareas - 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setPaginaSubtareas((p) => Math.min(totalPaginasSubtareas - 1, p + 1))
                      }
                      className="px-4 py-1.5 rounded-xl bg-white border-2 border-gray-800 font-bold text-lg hover:bg-gray-100 cursor-pointer"
                    >
                      Siguientes →
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      </form>

      {/* PIE: Casa y Borrar rojo abajo a la izquierda + Cancelar y Guardar cambios a la derecha */}
      <footer className="flex items-center justify-between shrink-0 min-h-[68px] pt-2 pb-1 z-10">
        <div className="flex items-center gap-4 shrink-0">
          <button
            type="button"
            onClick={() =>
              navigate(`/agenda/${estudianteId ?? ''}`, {
                state: { nombreAlumno: state?.nombreAlumno },
              })
            }
            aria-label="Ir al inicio de la agenda"
            className="w-14 h-14 rounded-full border-2 border-gray-900 bg-white hover:bg-gray-100 flex items-center justify-center text-gray-900 shadow-sm transition cursor-pointer shrink-0"
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

          <button
            type="button"
            onClick={manejarBorrarTarea}
            className="px-6 py-3 rounded-2xl border-2 border-red-800 bg-red-600 hover:bg-red-700 text-white text-2xl font-bold shadow-sm transition cursor-pointer shrink-0"
          >
            Borrar
          </button>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-3 rounded-2xl border-2 border-[#1B365D] bg-white hover:bg-[#F7F4E9] text-[#1B365D] text-2xl font-bold transition cursor-pointer shrink-0"
          >
            Cancelar
          </button>

          <button
            type="submit"
            form="form-modificar-tarea"
            className="px-7 py-3 rounded-2xl border-2 border-[#1B365D] bg-[#1B365D] hover:bg-[#132744] text-white text-2xl font-bold shadow-md transition cursor-pointer shrink-0"
          >
            Guardar cambios
          </button>
        </div>
      </footer>
    </div>
  );
}