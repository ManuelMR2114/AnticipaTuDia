import type { ReactNode } from 'react';
import PanelLateral from '../../Componentes/layout/PanelLateral';
import BotonAccesibilidad from '../../Componentes/accesibilidad/BotonAccesibilidad';

interface SeleccionRolProps {
  onSeleccionarEstudiante: () => void;
  onSeleccionarTutor: () => void;
  onSeleccionarFamilia: () => void;
  onSeleccionarAdmin: () => void;

}

interface Rol {
  id: string;
  nombre: string;
  descripcion: ReactNode;
  /** Clase completa (Tailwind necesita ver el nombre entero para generarla). */
  color: string;
  onClick?: () => void;
}

const CLASE_TARJETA =
  'anillo-foco flex h-[clamp(110px,13vh,150px)] max-w-[340px] min-w-[240px] flex-[1_1_0] items-center rounded-[28px] border border-borde px-[clamp(16px,1.9vw,38px)] text-left transition-[transform,box-shadow] duration-200 ease-[ease] hover:-translate-y-1 hover:shadow-[0_6px_14px_rgba(0,0,0,0.15)]';

export default function SeleccionRol({ onSeleccionarEstudiante,onSeleccionarTutor,onSeleccionarFamilia,onSeleccionarAdmin }: SeleccionRolProps) {
  const roles: Rol[] = [
    {
      id: 'estudiante',
      nombre: 'Estudiante',
      descripcion: 'Accede a tu agenda',
      color: 'bg-azul-claro',
      onClick: onSeleccionarEstudiante,
    },
    {
      id: 'tutor',
      nombre: 'Tutor',
      descripcion: (
        <>
          Acompaña y<br />
          Organiza
        </>
      ),
      color: 'bg-verde-agua',
      onClick: onSeleccionarTutor,
    },
    {
      id: 'familia',
      nombre: 'Familia',
      descripcion: 'Consulta y da apoyo',
      color: 'bg-salmon',
      onClick: onSeleccionarFamilia,
    },
    {
      id: 'admin',
      nombre: 'Administrador',
      descripcion: 'Gestión del Sistema',
      color: 'bg-amarillo-pastel',
      onClick: onSeleccionarAdmin,
    },


  ];

  return (
    <div className="flex min-h-screen w-full">
      <PanelLateral />

      {/* Parte derecha */}
      <main className="relative flex w-[62%] flex-col items-center justify-center bg-crema">
        <BotonAccesibilidad />

        <div className="w-full px-[2.5vw] text-center">
          <h2 className="mb-[4.5vh] text-subtitulo font-normal text-[#111] italic">
            BIENVENIDO A ANTICIPA TU DIA
          </h2>
          <h3 className="mb-[7vh] text-titulo font-bold text-black">
            ¿Como quieres entrar?
          </h3>

          <div className="flex flex-wrap justify-center gap-[3.2vw]">
            {roles.map((rol) => (
              <button
                key={rol.id}
                className={`${CLASE_TARJETA} ${rol.color}`}
                onClick={rol.onClick}
              >
                <div className="size-[clamp(54px,3.8vw,74px)] shrink-0 rounded-2xl bg-white" />
                <div className="min-w-0 flex-1 pl-3 text-center">
                  <h4 className="mb-1.5 text-tarjeta font-bold text-black">
                    {rol.nombre}
                  </h4>
                  <p className="text-tarjeta-detalle leading-[1.15] text-[#111]">
                    {rol.descripcion}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}