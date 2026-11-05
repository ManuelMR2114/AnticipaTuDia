import './App.css';

function App() {
  const handleSelectRole = (role: string) => {
    alert(`Has seleccionado entrar como: ${role}`);
    // Más adelante aquí programaremos el cambio a la pantalla correspondiente
  };

  return (
    <div className="login-container">
      {/* Lateral Izquierdo */}
      <aside className="sidebar">
        <div className="brand-logo">
          <div className="logo-icon">🗓️</div>
          <span className="logo-text">AnticipaTuDía</span>
        </div>

        <div className="sidebar-content">
          <p className="tagline">TU AGENDA, TU MANERA</p>
          <h1 className="sidebar-title">
            Organiza tu día.<br />Avanza a tu ritmo.
          </h1>
          <p className="sidebar-description">
            Una agenda accesible y personal para acompañarte en cada paso.
          </p>
        </div>
      </aside>

      {/* Panel Principal Derecho */}
      <main className="main-content">
        {/* Barra accesibilidad superior */}
        <div className="accessibility-bar">
          <button className="acc-btn">🔊 Escuchar</button>
          <button className="acc-btn">👁️ Contraste</button>
        </div>

        {/* Sección de Selección */}
        <section className="welcome-section">
          <span className="sub-welcome">BIENVENIDO A ANTICIPA TU DÍA</span>
          <h2 className="main-question">¿Cómo quieres entrar?</h2>

          <div className="cards-grid">
            {/* Botón Estudiante */}
            <button 
              className="role-card estudiante" 
              onClick={() => handleSelectRole('Estudiante')}
            >
              <h3 className="card-title">Estudiante</h3>
              <span className="card-subtitle">Acceso ocupando</span>
            </button>

            {/* Botón Tutor */}
            <button 
              className="role-card tutor" 
              onClick={() => handleSelectRole('Tutor')}
            >
              <h3 className="card-title">Tutor</h3>
              <span className="card-subtitle">Acompaña y organiza</span>
            </button>

            {/* Botón Familia */}
            <button 
              className="role-card familia" 
              onClick={() => handleSelectRole('Familia')}
            >
              <h3 className="card-title">Familia</h3>
              <span className="card-subtitle">Conecta e infórmate</span>
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;