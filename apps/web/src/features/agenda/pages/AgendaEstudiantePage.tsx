import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import { VistaAgenda, type TareaAgenda } from './VistaAgenda';

interface LocationState {
  nombreAlumno?: string;
}

export default function AgendaEstudiantePage() {
  const { estudianteId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;

  const [tareas, setTareas] = useState<TareaAgenda[]>([]);
  const [periodo, setPeriodo] = useState<'hoy' | 'semana' | 'mes'>('hoy');
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | number | null>(null);

  useEffect(() => {
    if (!estudianteId) return;

    // Aquí conectará la consulta real de tareas por estudianteId, periodo y diaSeleccionado.
    // Mientras tanto, genera tareas de prueba asociadas al estudianteId elegido.
    setTareas([
      {
        id: `${estudianteId}-1`,
        titulo: 'Preparar materiales',
        diaTiempo: `${periodo} - 09:00`,
      },
      {
        id: `${estudianteId}-2`,
        titulo: 'Desayuno saludable',
        diaTiempo: 'Hoy - 10:30',
      },
      {
        id: `${estudianteId}-3`,
        titulo: 'Taller de autonomía',
        diaTiempo: 'Hoy - 12:00',
      },
    ]);
  }, [estudianteId, periodo, diaSeleccionado]);

  return (
    <VistaAgenda
      nombreAlumno={state?.nombreAlumno}
      tareas={tareas}
      onVolver={() => navigate(-1)}
      onCambiarPeriodo={(nuevoPeriodo) => {
        setPeriodo(nuevoPeriodo);
        setDiaSeleccionado(null);
      }}
      onSeleccionarDia={(valorDia) => {
        setDiaSeleccionado(valorDia);
      }}
      onIniciarTarea={(tareaId) => {
        console.log('Iniciar tarea:', tareaId, 'estudiante:', estudianteId);
      }}
      onVerDetalleTarea={(tareaId) => {
        console.log('Ver detalle tarea:', tareaId, 'estudiante:', estudianteId);
      }}
    />
  );
}