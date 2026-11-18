import { useState } from 'react';
import BotonAccesibilidad from '../../accessibility/BotonAccesibilidad';

export interface TareaAgenda {
  id: string;
  titulo: string;
  diaTiempo: string; // Ej: "Hoy - 10:00"
}

interface VistaAgendaProps {
  nombreAlumno: string;
  tareas: TareaAgenda[];
  onVolver: () => void;
  onIniciarTarea: (tareaId: string) => void;
  onVerDetalleTarea: (tareaId: string) => void;
}

const COLORES_TARJETA = [
  'bg-[#6D9DC5] border-[#4A779D]', // Azul
  'bg-[#95C2B2] border-[#6A9988]', // Verde agua
  'bg-[#F2B08A] border-[#C9855E]', // Salmón
];

const TAREAS_POR_PAGINA = 3;

export function VistaAgenda({
  nombreAlumno,
  tareas,
  onVolver,
  onIniciarTarea,
  onVerDetalleTarea,
}: VistaAgendaProps) {
  const [periodo, setPeriodo] = useState<'hoy' | 'semana' | 'mes'>('hoy');
  const [paginaActual, setPaginaActual] = useState(0);

  const totalPaginas = Math.ceil(tareas.length / TAREAS_POR_PAGINA);
  const inicio = paginaActual * TAREAS_POR_PAGINA;
  const tareasVisibles = tareas.slice(inicio, inicio + TAREAS_POR_PAGINA);

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#F7F4E9] flex flex-col justify-between p-6 select-none">
      
      {/* CABECERA: Solo el logo PNG más grande a la izquierda + Nombre del alumno */}
      <header className="flex items-center justify-between w-full">
        <div className="flex items-center gap-6">
          {/* Logo transparente y más grande, sin fondo blanco ni texto */}
          <img 
            src="/logo-app-sin-fondo.png" 
            alt="AnticipaTuDía" 
            className="w-30 h-30 object-contain" 
          />
          <h1 className="text-4xl font-bold text-gray-900">{nombreAlumno}</h1>
        </div>

        <BotonAccesibilidad />
      </header>

      {/* ZONA CENTRAL */}
      <main className="flex-1 flex flex-col items-center justify-center max-w-3xl w-full mx-auto">
        
        {/* Barra superior de la lista */}
        <div className="w-full flex items-center justify-between mb-6 px-2">
          <h2 className="text-3xl font-bold text-gray-900">Tareas:</h2>

          {/* Selector de período mediante botones grandes y accesibles */}
          <div className="flex gap-2">
            {(['hoy', 'semana', 'mes'] as const).map((p) => (
              <button
                key={p}
                onClick={() => {
                  setPeriodo(p);
                  setPaginaActual(0);
                }}
                className={`px-4 py-2 rounded-xl font-bold text-base transition cursor-pointer border-2 ${
                  periodo === p
                    ? 'bg-[#1B365D] text-white border-[#1B365D]'
                    : 'bg-white text-gray-800 border-gray-400 hover:bg-gray-100'
                }`}
              >
                {p === 'hoy' ? 'Hoy' : p === 'semana' ? 'Esta semana' : 'Este mes'}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de tareas (sin scroll, máximo 3) */}
        <div className="w-full flex flex-col gap-5">
          {tareasVisibles.length === 0 ? (
            <div className="bg-white/80 border-2 border-dashed border-gray-300 rounded-2xl p-10 text-center">
              <p className="text-2xl font-medium text-gray-600">
                No hay tareas previstas para este intervalo.
              </p>
            </div>
          ) : (
            tareasVisibles.map((tarea, index) => {
              const colorClase = COLORES_TARJETA[index % COLORES_TARJETA.length];
              return (
                <div key={tarea.id} className="flex items-center gap-4">
                  {/* Botón oscuro "Iniciar" a la izquierda */}
                  <button
                    onClick={() => onIniciarTarea(tarea.id)}
                    className="px-8 py-6 bg-[#1B365D] hover:bg-[#132744] active:scale-95 text-white text-2xl font-bold rounded-2xl shadow-md transition cursor-pointer"
                  >
                    Iniciar
                  </button>

                  {/* Tarjeta de tarea coloreada */}
                  <button
                    onClick={() => onVerDetalleTarea(tarea.id)}
                    className={`flex-1 flex items-center justify-between px-6 py-4 rounded-2xl border-2 text-left shadow-sm hover:brightness-95 active:scale-[0.99] transition cursor-pointer ${colorClase}`}
                  >
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{tarea.titulo}</p>
                      <p className="text-lg font-medium text-gray-800">{tarea.diaTiempo}</p>
                    </div>

                    <span className="w-10 h-10 rounded-full border-2 border-gray-900 flex items-center justify-center text-xl font-bold text-gray-900">
                      →
                    </span>
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Paginación limpia: solo muestra los botones que se pueden pulsar */}
        {totalPaginas > 1 && (
          <div className="flex items-center gap-6 mt-6">
            {paginaActual > 0 && (
              <button
                onClick={() => setPaginaActual((p) => Math.max(0, p - 1))}
                className="px-5 py-2 rounded-xl bg-white border-2 border-gray-800 font-bold text-lg hover:bg-gray-100 cursor-pointer"
              >
                ← Anteriores
              </button>
            )}

            <span className="text-lg font-semibold text-gray-700">
              Página {paginaActual + 1} de {totalPaginas}
            </span>

            {paginaActual < totalPaginas - 1 && (
              <button
                onClick={() => setPaginaActual((p) => Math.min(totalPaginas - 1, p + 1))}
                className="px-5 py-2 rounded-xl bg-white border-2 border-gray-800 font-bold text-lg hover:bg-gray-100 cursor-pointer"
              >
                Siguientes →
              </button>
            )}
          </div>
        )}
      </main>

      {/* PIE: Botón circular de volver atrás */}
      <footer className="flex items-center justify-between">
        <button
          onClick={onVolver}
          aria-label="Volver atrás"
          className="w-14 h-14 rounded-full border-2 border-gray-900 bg-white hover:bg-gray-100 flex items-center justify-center text-2xl font-bold shadow-sm transition cursor-pointer"
        >
          ←
        </button>
      </footer>
    </div>
  );
}