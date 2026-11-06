import { PictogramsService } from './pictogramas.service.js';

function chain(result: { data: unknown; error: unknown }) {
  const query = {
    select: () => query,
    eq: () => query,
    order: () => Promise.resolve(result),
  };
  return query;
}

function serviceWith(data: unknown) {
  const supabaseService = {
    admin: { from: () => chain({ data, error: null }) },
  };
  return new PictogramsService(supabaseService as never);
}

describe('PictogramsService', () => {
  it('mapea el catálogo con la URL de imagen de ARASAAC', async () => {
    const service = serviceWith([
      {
        id: 'pictograma-gato',
        name: 'Gato',
        description: '',
        active: true,
        sort_order: 1,
        arasaac_id: 7114,
      },
      {
        id: 'pictograma-sol',
        name: 'Sol',
        description: '',
        active: true,
        sort_order: 4,
        arasaac_id: null,
      },
    ]);

    await expect(service.findAll()).resolves.toEqual([
      {
        id: 'pictograma-gato',
        name: 'Gato',
        description: '',
        imageUrl:
          'https://static.arasaac.org/pictograms/7114/7114_500.png',
        sortOrder: 1,
      },
      {
        id: 'pictograma-sol',
        name: 'Sol',
        description: '',
        imageUrl: null,
        sortOrder: 4,
      },
    ]);
  });
});
