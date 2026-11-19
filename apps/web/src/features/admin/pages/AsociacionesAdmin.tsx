import { useState } from 'react';
import type { SessionResponse, UserSummary } from '@agenda/shared';
import ListaUsuarios from '../components/ListaUsuarios';
import AsociacionesEstudiante from '../components/AsociacionesEstudiante';
import { useUsuarios } from '../hooks/useUsuarios';

interface AsociacionesAdminProps {
  sesion: SessionResponse;
}

const claseBotonSecundario =
  'anillo-foco h-[clamp(36px,4vh,52px)] rounded-xl border-[1.5px] border-borde bg-transparent px-5 text-[clamp(14px,1vw,20px)] font-semibold text-black';


export default function AsociacionesAdmin({ sesion }: AsociacionesAdminProps) {

  const { usuarios, cargando, error } = useUsuarios(sesion);

  // Estudiante cuyas asociaciones se están gestionando (null = se ve la lista)

  const [estudiante, setEstudiante] = useState<UserSummary | null>(null);

  return (
    <div>
      {/* cabecera de la lista */}
      <div className="mb-[4vh] text-left">
        <h2 className="mb-[1.1vh] text-titulo font-bold leading-tight text-black">Asociaciones</h2>
        <p className="text-subtitulo font-normal italic text-black">
          {estudiante
            ? `Tutores y familiares de ${estudiante.fullName}`
            : 'Elige al estudiante cuyas asociaciones quieres gestionar'}
        </p>
      </div>

      {estudiante ? (
        <AsociacionesEstudiante
          sesion={sesion}
          estudiante={estudiante}
          usuarios={usuarios}
          onVolver={() => setEstudiante(null)}
        />
      ) : (

        // solo estudiantes activos 
        <ListaUsuarios
          usuarios={usuarios.filter((u) => u.role === 'student' && u.deactivatedAt === null)}
          cargando={cargando}
          error={error}
          renderAccion={(u) => (
            <button type="button" className={claseBotonSecundario} onClick={() => setEstudiante(u)}>
              Gestionar
            </button>
          )}
        />
      )}
    </div>
  );
}