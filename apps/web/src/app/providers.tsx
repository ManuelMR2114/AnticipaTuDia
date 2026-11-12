import type { ReactNode } from 'react';
import AccesibilidadProvider from '../features/accessibility/AccesibilidadProvider';

/** Providers globales de la app. Aquí irán los futuros (sesión, datos, etc.). */
export default function Providers({ children }: { children: ReactNode }) {
  return <AccesibilidadProvider>{children}</AccesibilidadProvider>;
}
