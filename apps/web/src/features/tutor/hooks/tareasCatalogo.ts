export interface TareaCatalogo {
  id: string;
  titulo: string;
  descripcion?: string;
  /** Pasos de la tarea, en orden (HU-17). */
  pasos?: string[];
}

// Tareas disponibles para asignar. Editar esta lista basta para añadir o quitar opciones.
// Cuando exista un endpoint de catálogo, se sustituye por una llamada a la API.
export const TAREAS_CATALOGO: TareaCatalogo[] = [
  {
    id: 'dientes',
    titulo: 'Lavarse los dientes',
    pasos: ['Poner pasta en el cepillo', 'Cepillar los dientes', 'Enjuagarse la boca'],
  },
  {
    id: 'manos',
    titulo: 'Lavarse las manos',
    pasos: ['Mojar las manos', 'Poner jabón', 'Frotar las manos', 'Aclarar', 'Secar'],
  },
  {
    id: 'deberes',
    titulo: 'Hacer los deberes',
    pasos: ['Abrir la mochila', 'Sacar el cuaderno', 'Hacer los ejercicios'],
  },
  { id: 'mochila', titulo: 'Preparar la mochila' },
  { id: 'comer', titulo: 'Comer' },
  { id: 'vestirse', titulo: 'Vestirse' },
  { id: 'recoger', titulo: 'Recoger los juguetes' },
  { id: 'banyo', titulo: 'Ir al baño' },
];