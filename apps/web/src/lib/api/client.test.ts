import { describe, expect, it, vi } from 'vitest';
import { API_URL, apiFetch } from './client';

describe('apiFetch', () => {
  it('usa la URL base por defecto y añade token y JSON', async () => {
    const fetchFalso = vi.fn(async () => new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchFalso);

    await apiFetch('/users', { method: 'POST', token: 'tok', body: { a: 1 } });

    expect(fetchFalso).toHaveBeenCalledTimes(1);
    const [url, init] = fetchFalso.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(`${API_URL}/users`);
    expect(API_URL).toBe('http://localhost:3000/api');
    expect(init.method).toBe('POST');
    expect(init.body).toBe(JSON.stringify({ a: 1 }));
    expect(init.headers).toMatchObject({
      'Content-Type': 'application/json',
      Authorization: 'Bearer tok',
    });
  });

  it('sin token ni body no añade cabeceras', async () => {
    const fetchFalso = vi.fn(async () => new Response('[]', { status: 200 }));
    vi.stubGlobal('fetch', fetchFalso);

    await apiFetch('/classrooms');

    const [, init] = fetchFalso.mock.calls[0] as unknown as [string, RequestInit];
    expect(init.headers).toEqual({});
    expect(init.body).toBeUndefined();
  });
});
