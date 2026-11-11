import { useState } from 'react';
import type { SessionResponse, UserRole, StudentLoginMethod, CreateUserRequest, StudentAccess, Usercreated } from '@agenda/shared';

interface AltaUsuarioProps {
  // Sesión del administrador que es el token que exige la API para crear usuarios
  sesion: SessionResponse;
}

// Métodos de acceso del alumnado
type MetodoAcceso = StudentLoginMethod;

// Roles que se pueden dar de alta desde esta pantalla
type RolAlta = Extract<UserRole, 'student' | 'tutor' | 'family' | 'specialist' | 'teacher'>;

const API_URL = 'http://localhost:3000/api';
const RUTA_ALTA_USUARIO = '/users';

// Definimos estas constantes para que si en el futuro a la API se le cambia o añade un nuevo rol o método de acceso, solo tengamos que modificar estas constantes
// Opciones del selector de rol. Donde el valor es el de la base de datos y la etiqueta lo que lee el administrador
const ROLES: { valor: RolAlta; etiqueta: string }[] = [
  { valor: 'student', etiqueta: 'Estudiante' },
  { valor: 'tutor', etiqueta: 'Tutor' },
  { valor: 'family', etiqueta: 'Familiar' },
  { valor: 'specialist', etiqueta: 'Especialista' },
  { valor: 'teacher', etiqueta: 'Profesor' },
];

// Opciones del selector de método de acceso para alumnos
const METODOS: { valor: MetodoAcceso; etiqueta: string }[] = [
  { valor: 'password', etiqueta: 'Contraseña' },
  { valor: 'pin', etiqueta: 'PIN' },
  { valor: 'pattern', etiqueta: 'Patrón' },
  { valor: 'pictograms', etiqueta: 'Pictogramas' },
];


// Estilos de los campos, iguales que en el inicio de sesión para mantener la estética
const claseInput =
  'h-[clamp(44px,4.6vh,60px)] w-full rounded-xl border-[1.5px] border-borde bg-transparent px-5 text-[clamp(16px,1.1vw,22px)] text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-azul-oscuro disabled:opacity-50 [&>option]:bg-white [&>option]:text-black';
const claseLabel = 'mb-[1.2vh] block text-[clamp(18px,1.5vw,30px)] font-semibold text-black';

export default function AltaUsuario({ sesion }: AltaUsuarioProps) {
  // Datos del formulario

  const [nombre, setNombre] = useState('');
  const [rol, setRol] = useState<RolAlta>('tutor');

  // Datos de tutor. familiar, profesor, especialista
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Datos para alumnos
  const [metodo, setMetodo] = useState<MetodoAcceso>('pin');
  const [pinAlumno, setPinAlumno] = useState('');
  const [patronAlumno, setPatronAlumno] = useState('');
  const [passwordAlumno, setPasswordAlumno] = useState('');
  const [pictogramas, setPictogramas] = useState('');

  // Mensajes: error o confirmación de que el usuario se ha creado
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  // Para evitar dar de alta dos veces bloqueamos el formulario, valiendo true mientras esperamos a la API
  const [enviando, setEnviando] = useState(false);

  const darDeAlta = async (e: React.FormEvent) => {

    e.preventDefault();

    // Comprobamos los campos son obligatorios
    if (!nombre.trim()) {

      setExito('');
      setError('El nombre completo es obligatorio');
      return;

    }

    if (rol === 'student') {

      if (metodo === 'pin' && !pinAlumno.trim()) {
        setError('El PIN es obligatorio para el estudiante');
        return;
      }

      if (metodo === 'password' && !passwordAlumno) {

        setError('La contraseña es obligatoria');
        return;

      }

      if (metodo === 'pictogram' && !pictogramas.trim()) {

        setError('Debes indicar los IDs de los pictogramas');
        return;

      }

      if (metodo === 'pattern' && !patronAlumno.trim()) {

        setError('El patrón de desbloqueo es obligatorio.');
        return;

      }

    } else {

      if (!email.trim() || !password) {

        setError('El correo electrónico y la contraseña son obligatorios');
        return;

      }

    }

    // Limpiamos los mensajes anteriores y bloqueamos el formulario mientras el usuario mete los campos 
    setError('');
    setExito('');
    setEnviando(true);

    let cuerpo_peticion: CreateUserRequest;

    if (rol === 'student') {

      let acceso: StudentAccess;

      switch (metodo) {
        case 'pin':
          acceso = { method: 'pin', pin: pinAlumno.trim() };
          break;
        case 'pattern':
          acceso = { method: 'pattern', pattern: patronAlumno.trim() };
          break;
        case 'password':
          acceso = { method: 'password', password: passwordAlumno };
          break;
        case 'pictograms':
          // Convertimos el texto separado por comas en un array de strings con los IDS. filter(Boolean) es para descartar posibles elementos vacíos.
          acceso = { method: 'pictograms', pictograms: pictogramas.split(',').map((id) => id.trim()).filter(Boolean) };
          break;
      }
  
      cuerpo_peticion = {
        fullName: nombre.trim(),
        role: 'student',
        acceso,
      };

    } else {

      cuerpo_peticion = {
        fullName: nombre.trim(),
        role: rol,
        email: email.trim(),
        password: password,
      };

    }

    try {
      // La API solo deja crear usuarios al administrador, por eso va el token de su sesión
      const response = await fetch(`${API_URL}${RUTA_ALTA_USUARIO}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sesion.accessToken}`,
        },
        body: JSON.stringify(cuerpo_peticion),
      });

      // Si la API responde con error, mostramos un mensaje según el código y paramos aquí
      if (!response.ok) {

        if (response.status === 401){
            setError('Tu sesión ha caducado. Vuelve a entrar');
        } else if (response.status === 403){

            setError('No tienes permiso para dar de alta usuarios');

        } else if (response.status === 409) {

            setError('Ya existe un usuario con ese correo');

        } else if (response.status === 400){

            setError('Revisa los datos: alguno no es válido');

        } else if (response.status === 503){

            setError('Servicio no disponible');

        } else {

            setError('No se pudo dar de alta al usuario');
        }

        return;

      }

      const creado: Usercreated = await response.json();
      setExito(`Usuario creado correctamente: ${creado.fullName}`);
      
      // Limpiamos los campos tras el éxito
      setNombre('');
      setEmail('');
      setPassword('');
      setPinAlumno('');
      setPatronAlumno('');
      setPasswordAlumno('');
      setPictogramas('');

    } catch {

      setError('No se pudo conectar con el servidor');

    } finally {

      // Da igual lo que pase, desbloqueamos el formulario
      setEnviando(false);

    }
  };

  return (
    <div className="relative">
      {/* Cabecera */}
      <div className="mb-[5.1vh] text-left">
        <h2 className="mb-[1.1vh] text-titulo font-bold leading-tight text-black">Alta de usuario</h2>
        <p className="text-subtitulo font-normal italic text-black">Introduce los datos de la persona que va a usar la aplicación</p>
      </div>

      {/* Formulario */}
      <form onSubmit={darDeAlta} noValidate aria-busy={enviando} className="grid w-[46vw] min-w-[560px] grid-cols-2 gap-x-[3vw] gap-y-[3.2vh]">
        {/* Nombre */}
        <div>
          <label htmlFor="nombre" className={claseLabel}>
            Nombre completo
          </label>
          <input
            id="nombre"
            type="text"
            autoComplete="off"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className={claseInput}
            disabled={enviando}
          />
        </div>

        {/* Correo es solo para el personal (Staff) y los alumnos entra con su método de acceso */}
        {rol !== 'student' && (
          <div>
            <label htmlFor="correo" className={claseLabel}>
              Correo electrónico
            </label>
            <input
              id="correo"
              type="email"
              autoComplete="off"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={claseInput}
              disabled={enviando}
            />
          </div>
        )}

        {/* Rol */}
        <div>
          <label htmlFor="rol" className={claseLabel}>
            Rol
          </label>
          <select id="rol" value={rol} onChange={(e) => setRol(e.target.value as RolAlta)} className={claseInput} disabled={enviando}>
            {ROLES.map((r) => (
              <option key={r.valor} value={r.valor}>
                {r.etiqueta}
              </option>
            ))}
          </select>
        </div>

        {/* Método de acceso */}
        {rol === 'student' && (
          <div>
            <label htmlFor="metodo" className={claseLabel}>
              Método de acceso
            </label>
            <select id="metodo" value={metodo} onChange={(e) => setMetodo(e.target.value as MetodoAcceso)} className={claseInput} disabled={enviando}>
              {METODOS.map((m) => (
                <option key={m.valor} value={m.valor}>
                  {m.etiqueta}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Contraseña inicial porque el administrador tiene que poder dársela a la persona. Para alumnos es la credencial de su método */}
        <div>
          <label htmlFor="credencial" className={claseLabel}>
            {rol === 'student' ? 'Credencial inicial' : 'Contraseña inicial'}
          </label>
          {rol !== 'student' ? (
            <input
              id="credencial"
              type="text"
              autoComplete="off"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={claseInput}
              disabled={enviando}
            />
          ) : (
            <>
              {metodo === 'pin' && (
                <input
                  id="credencial"
                  type="text"
                  maxLength={4}
                  placeholder="Ej: 1234"
                  value={pinAlumno}
                  onChange={(e) => setPinAlumno(e.target.value)}
                  className={claseInput}
                  disabled={enviando}
                />
              )}
              {metodo === 'pattern' && (
                <input
                  id="credencial"
                  type="text"
                  placeholder="Ej: 0-1-2-5"
                  value={patronAlumno}
                  onChange={(e) => setPatronAlumno(e.target.value)}
                  className={claseInput}
                  disabled={enviando}
                />
              )}
              {metodo === 'password' && (
                <input
                  id="credencial"
                  type="text"
                  value={passwordAlumno}
                  onChange={(e) => setPasswordAlumno(e.target.value)}
                  className={claseInput}
                  disabled={enviando}
                />
              )}
              {metodo === 'pictogram' && (
                <input
                  id="credencial"
                  type="text"
                  placeholder="uuid-1, uuid-2, uuid-3"
                  value={pictogramas}
                  onChange={(e) => setPictogramas(e.target.value)}
                  className={claseInput}
                  disabled={enviando}
                />
              )}
            </>
          )}
        </div>

        {/* Botón Dar de alta */}
        <div className="col-span-1 self-end">
          <button
            type="submit"
            disabled={enviando}
            className="anillo-foco h-[clamp(44px,4.6vh,60px)] w-full rounded-xl border-[1.5px] border-azul-oscuro bg-azul-oscuro text-[clamp(16px,1.05vw,22px)] font-semibold text-white transition-transform hover:-translate-y-0.5 disabled:opacity-50"
          >
            {enviando ? 'Creando...' : 'Dar de alta'}
          </button>
        </div>
      </form>

      {/* Mensajes de error y éxito */}
      {error && (
        <div
          role="alert"
          className="absolute top-full left-0 mt-[2vh] rounded-xl border border-red-400 bg-red-100 p-3 text-sm font-medium text-red-700"
        >
          {error}
        </div>
      )}
      {exito && (
        <div
          role="status"
          className="absolute top-full left-0 mt-[2vh] rounded-xl border border-verde-agua bg-verde-agua/40 p-3 text-sm font-medium text-black"
        >
          {exito}
        </div>
      )}
    </div>
  );
}