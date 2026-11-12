//panel lateral de la izquierda, repetimos este componente en todas las pantallas de inicio
export default function PanelLateral() {

    return (
      <aside className="flex w-[38%] flex-col justify-between bg-azul-oscuro px-[3.5vw] pt-[8.8vh] pb-0 text-white">

        {/*logo*/}
        <div>
          <img
            src="/logo-app-sin-fondo.png"
            alt="Logo AnticipaTuDía"
            className="-ml-[83px] block h-auto w-[340px]"
          />
        </div>
  

  
        {/*frases*/}
        <div className="mb-[23vh]">
          <p className="mb-[4.5vh] text-lateral-sub font-normal italic">
            TU AGENDA, TU MANERA
          </p>
  
          <h1 className="mb-[5vh] text-titulo leading-[1.15] font-bold">
            Organiza tu día
            <br />
            Avanza a tu ritmo
          </h1>
  
          <p className="text-lateral-desc leading-[1.1] font-normal">
            Una agenda accesible y personal
            <br />
            para acompañarte en cada paso
          </p>
        </div>



      </aside>
    );
  }