import type { SessionResponse } from '@agenda/shared';

interface AsignarTareasProps {
  // Sesión del tutor: su token se usará para llamar a POST /tasks/assign (HU-11)
  sesion: SessionResponse;
}

// De momento solo está el apartado. Aquí irán después el selector de alumnos
// (GET /student-links/my-students), el formulario de la tarea y el momento del día.
export default function AsignarTareasTutor({ sesion }: AsignarTareasProps) {
  // Se leerá al conectar con la API; evita el aviso de parámetro sin usar
  void sesion;

  return (
    <div>
      {/* Cabecera */}
      <div className="mb-[5.1vh] text-left">
        <h2 className="mb-[1.1vh] text-titulo font-bold leading-tight text-black">Asignar tareas</h2>
        <p className="text-subtitulo font-normal italic text-black">
          Elige a tus alumnos y decide qué tareas tienen que hacer durante el día
        </p>
      </div>
    </div>
  );
}
