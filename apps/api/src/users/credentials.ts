import { createHmac } from 'node:crypto';

export type MetodoSecreto = 'pin' | 'pictogram' | 'password' | 'pattern';

/**
 * Contraseña larga que se guarda en Supabase Auth a partir del PIN o de la
 * secuencia de pictogramas. Se usa tanto en el alta como en el login: tiene
 * que ser idéntica en los dos sitios.
 * Esto es porque supabase pide como minimo 6 caracteres, pero un pin de 4 
 * digitos o una secuencia de pictogramas que sean 3 numeros no es suficiente
 * con HMAC se alarga y aporta tanto robustez como solventar ese problema del
 * minimo
 */
export function derivarPassword(
    pepper: string,
    userId: string,
    metodo: MetodoSecreto,
    valor: string,
): string {
    return createHmac('sha256', pepper)
        .update(`${metodo}:${userId}:${valor}`)
        .digest('base64url');
}
