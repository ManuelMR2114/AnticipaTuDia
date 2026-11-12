import { useNavigate } from 'react-router';
import { borrarSesion } from '../session';


//boton de cerrar sesion, se borra el token y se vuelve a la pantalla de inicio 

interface BotonCerrarSesionProps {
  className?: string;
  variante?: 'claro' | 'oscuro';
}


//dos colores variantes
const VARIANTES = {
  claro: 'border-azul-oscuro text-azul-oscuro hover:bg-azul-oscuro hover:text-white',
  oscuro: 'border-white text-white hover:bg-white hover:text-azul-oscuro',
};

export default function BotonCerrarSesion({ className = '', variante = 'claro' }: BotonCerrarSesionProps) {
  const navigate = useNavigate();

  // La API no tiene endpoint de logout; el token expira solo.
  const cerrarSesion = () => {
    borrarSesion();
    navigate('/', { replace: true });
  };

  return (
    <button
      type="button"
      onClick={cerrarSesion}
      className={`anillo-foco inline-flex items-center gap-3 rounded-xl border-[1.5px] bg-transparent px-5 py-2.5 text-[clamp(14px,1vw,18px)] font-semibold transition-colors ${VARIANTES[variante]} ${className}`}
    >
      <svg className="size-[1.2em]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
      </svg>
      Cerrar sesión
    </button>
  );
}