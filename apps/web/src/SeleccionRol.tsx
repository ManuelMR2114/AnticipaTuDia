interface SeleccionRolProps {
  onSeleccionarEstudiante: () => void;
}

export default function SeleccionRol({ onSeleccionarEstudiante }: SeleccionRolProps) {
  return (

    <div className="contenedor-inicio">
      {/*P izq*/}
      <aside className="panel-lateral">

        <div className="contenedor-logo">
          <img src="/logo-app-sin-fondo.png" alt="Logo AnticipaTuDía" className="logo" />
        </div>

        <div className="texto-lateral">

          <p className="subtitulo-lateral">TU AGENDA, TU MANERA</p>

          <h1 className="titulo-lateral">
            Organiza tu día<br />
            Avanza a tu ritmo
          </h1>

          <p className="descripcion-lateral">
            Una agenda accesible y personal<br />
            para acompañarte en cada paso
          </p>

        </div>

      </aside>

      {/* Parte der*/}
      <main className="panel-principal">

        <header className="cabecera-principal">
          
          <button className="btn-accesibilidad" aria-label="Opciones de accesibilidad">
            <span className="texto-acc">Accesibilidad</span>
            <span className="icono-acc-a" aria-hidden="true">A</span>
            <span className="contraste-acc" aria-hidden="true"></span>
          </button>
          
        </header>

        <div className="contenido-principal">
          <h2 className="texto-bienvenida">BIENVENIDO A ANTICIPA TU DIA</h2>
          <h3 className="texto-pregunta">¿Como quieres entrar?</h3>

          <div className="contenedor-roles">
            <button className="btn-rol btn-estudiante" onClick={onSeleccionarEstudiante}>
              <div className="espacio-icono"></div>
              <div className="info-rol">
                <h4>Estudiante</h4>
                <p>Accede a tu agenda</p>
              </div>
            </button>

            <button className="btn-rol btn-tutor">
              <div className="espacio-icono"></div>
              <div className="info-rol">
                <h4>Tutor</h4>
                <p>Acompaña y<br />Organiza</p>
              </div>
            </button>

            <button className="btn-rol btn-familia">
              <div className="espacio-icono"></div>
              <div className="info-rol">
                <h4>Familia</h4>
                <p>Consulta y da apoyo</p>
              </div>
            </button>
            
          </div>

        </div>

      </main>

    </div>
  );
}