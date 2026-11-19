import { useEffect, useState, type ReactNode } from 'react';
import { NavLink, Outlet } from 'react-router';
import BotonAccesibilidad from '../../accessibility/BotonAccesibilidad';
import BotonCerrarSesion from '../../auth/components/BotonCerrarSesion';
import { leerSesion } from '../../auth/session';

interface ElementoMenu {
  to: string;
  etiqueta: string;
  icono: ReactNode;
}

const claseIcono = 'size-[1.3em] shrink-0';
const propsIcono = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  className: claseIcono,
};

// Secciones del panel. Para añadir una nueva basta con una entrada aquí + su <Route> en app/router.tsx
const MENU: ElementoMenu[] = [
  {
    to: '/tutor/tareas/asignar',
    etiqueta: 'Asignar tareas',
    icono: (
      <svg {...propsIcono}>
        <path d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
];

/** Layout del panel del tutor: barra lateral + cabecera + contenedor de vistas (<Outlet />). */
export default function PanelTutor() {
  // Solo afecta a pantallas pequeñas, donde la barra lateral es un menú desplegable
  const [menuAbierto, setMenuAbierto] = useState(false);
  const nombre = leerSesion()?.user.fullName ?? '';

  // Escape cierra el menú desplegable
  useEffect(() => {
    if (!menuAbierto) return;
    const alPulsar = (e: KeyboardEvent) => e.key === 'Escape' && setMenuAbierto(false);
    window.addEventListener('keydown', alPulsar);
    return () => window.removeEventListener('keydown', alPulsar);
  }, [menuAbierto]);

  return (
    <div className="flex min-h-screen w-full bg-crema">
      {/* Fondo oscuro tras el menú desplegable (solo móvil/tablet) */}
      {menuAbierto && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={() => setMenuAbierto(false)}
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
        />
      )}

      {/* ---------- Barra lateral ---------- */}
      <aside
        id="menu-tutor"
        className={`fixed inset-y-0 left-0 z-40 flex w-[280px] flex-col bg-azul-oscuro px-6 py-8 text-white transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:w-[clamp(240px,19vw,340px)] lg:shrink-0 lg:translate-x-0 ${
          menuAbierto ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <img
          src="/logo-app-sin-fondo.png"
          alt="Logo AnticipaTuDía"
          className="-ml-[58px] mb-8 block h-auto w-[240px] max-w-none"
        />

        <p className="mb-3 text-tarjeta-detalle font-bold tracking-wider text-white/70 uppercase">
          Tutoría
        </p>

        <nav aria-label="Navegación del panel del tutor" className="flex flex-1 flex-col gap-1">
          {MENU.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMenuAbierto(false)}
              className={({ isActive }) =>
                `anillo-foco flex items-center gap-3 rounded-xl px-4 py-3 text-nav transition-colors ${
                  isActive ? 'bg-white/20 font-bold' : 'font-normal hover:bg-white/10'
                }`
              }
            >
              {item.icono}
              {item.etiqueta}
            </NavLink>
          ))}
        </nav>

        <BotonCerrarSesion variante="oscuro" className="w-full justify-center" />
      </aside>

      {/* ---------- Zona principal ---------- */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Cabecera: botón de menú (solo móvil) a la izquierda; usuario y accesibilidad a la derecha */}
        <header className="flex items-center justify-between gap-4 px-[clamp(16px,3vw,48px)] pt-[clamp(16px,3vh,40px)]">
          <button
            type="button"
            onClick={() => setMenuAbierto(true)}
            aria-label="Abrir menú"
            aria-expanded={menuAbierto}
            aria-controls="menu-tutor"
            className="anillo-foco flex size-12 items-center justify-center rounded-xl border-[1.5px] border-azul-oscuro text-azul-oscuro lg:hidden"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="size-6" aria-hidden="true">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="ml-auto flex items-center gap-5">
            {nombre && (
              <span className="hidden text-nav font-semibold text-azul-oscuro sm:inline">{nombre}</span>
            )}
            <BotonAccesibilidad className="relative" />
          </div>
        </header>

        {/* Contenedor de vistas: aquí se pinta cada sección */}
        <main className="flex-1 px-[clamp(16px,3vw,48px)] py-[clamp(16px,3vh,40px)]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
