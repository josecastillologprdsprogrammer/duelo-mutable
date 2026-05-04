'use client';

interface GuideModalProps {
  onClose: () => void;
}

export default function GuideModal({ onClose }: GuideModalProps) {
  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 select-none font-mono">
      
      {/* CHASIS DEL MANUAL */}
      <div className="relative w-full max-w-3xl bg-black border border-cyan-500/30 p-1 shadow-[0_0_100px_rgba(6,182,212,0.1)]">
        
        {/* Esquinas Reforzadas */}
        <div className="absolute -top-1 -left-1 w-6 h-6 border-t-2 border-l-2 border-cyan-400 z-10" />
        <div className="absolute -top-1 -right-1 w-6 h-6 border-t-2 border-r-2 border-cyan-400 z-10" />
        <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-2 border-l-2 border-cyan-400 z-10" />
        <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-2 border-r-2 border-cyan-400 z-10" />

        <div className="border border-cyan-900/50 p-6 sm:p-8 bg-zinc-950/50">
          
          {/* HEADER */}
          <div className="flex justify-between items-center border-b border-cyan-900/50 pb-4 mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-cyan-400 tracking-tighter uppercase drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
                Guía Rápida de Juego
              </h2>
              <p className="text-[9px] text-zinc-500 uppercase tracking-[0.3em] mt-1">Reglas y Controles Básicos</p>
            </div>
            <button 
              onClick={onClose}
              className="px-4 py-2 border border-red-900/50 text-red-500 text-[10px] uppercase hover:bg-red-500 hover:text-black transition-all font-bold"
            >
              [ Cerrar_X ]
            </button>
          </div>

          {/* CONTENIDO SCROLLABLE */}
          <div className="space-y-8 max-h-[65vh] overflow-y-auto pr-4 custom-scrollbar text-zinc-300">
            
            {/* SECCIÓN 1: OBJETIVO */}
            <section>
              <h3 className="text-sm font-bold text-cyan-500 uppercase mb-3 border-l-2 border-cyan-500 pl-3">01. ¿Cómo se juega?</h3>
              <p className="text-xs leading-relaxed bg-cyan-950/20 p-4 border border-cyan-900/30 rounded-sm">
                Haz clic en los <b>puntos de colores</b> que giran en el radar para unirlos y formar figuras cerradas (como triángulos, cuadrados o pentágonos). 
                <br/><br/>
                Una vez que selecciones tus puntos, presiona la tecla <b>[ ESPACIO ]</b> para confirmar. Si la figura es correcta, ganarás puntos y energía para usar tus poderes.
              </p>
            </section>

            {/* SECCIÓN 2: PODERES */}
            <section>
              <h3 className="text-sm font-bold text-cyan-500 uppercase mb-3 border-l-2 border-cyan-500 pl-3">02. Poderes y Teclas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* BUFFS */}
                <div className="bg-cyan-950/10 border border-cyan-900/30 p-4 rounded-sm">
                  <span className="text-xs text-cyan-400 font-bold block mb-4 border-b border-cyan-900/50 pb-2">MEJORAS (Tus Poderes)</span>
                  <ul className="text-[10px] space-y-4 opacity-90">
                    <li className="flex items-center gap-3">
                      <img src="/skills/b1.png" alt="Tiempo Lento" className="w-8 h-8 object-cover border border-cyan-500/50 rounded-sm bg-black shrink-0" />
                      <div><b className="text-white text-xs">[1] TIEMPO LENTO:</b><br/>Hace que los puntos giren más despacio, ideal para apuntar.</div>
                    </li>
                    <li className="flex items-center gap-3">
                      <img src="/skills/b2.png" alt="Imán" className="w-8 h-8 object-cover border border-cyan-500/50 rounded-sm bg-black shrink-0" />
                      <div><b className="text-white text-xs">[2] IMÁN:</b><br/>Atrae los puntos hacia el centro de tu pantalla.</div>
                    </li>
                    <li className="flex items-center gap-3">
                      <img src="/skills/b3.png" alt="Puntos Dobles" className="w-8 h-8 object-cover border border-cyan-500/50 rounded-sm bg-black shrink-0" />
                      <div><b className="text-white text-xs">[3] PUNTOS x2:</b><br/>Ganas el doble de puntos por cada figura que armes.</div>
                    </li>
                    <li className="flex items-center gap-3">
                      <img src="/skills/b4.png" alt="Escudo" className="w-8 h-8 object-cover border border-cyan-500/50 rounded-sm bg-black shrink-0" />
                      <div><b className="text-white text-xs">[4] ESCUDO:</b><br/>Te protege de los ataques de los demás jugadores.</div>
                    </li>
                    <li className="flex items-center gap-3">
                      <img src="/skills/b5.png" alt="Batería" className="w-8 h-8 object-cover border border-cyan-500/50 rounded-sm bg-black shrink-0" />
                      <div><b className="text-white text-xs">[5] BATERÍA:</b><br/>Recuperas tu energía mucho más rápido.</div>
                    </li>
                  </ul>
                </div>

                {/* DEBUFFS */}
                <div className="bg-red-950/10 border border-red-900/30 p-4 rounded-sm">
                  <span className="text-xs text-red-400 font-bold block mb-4 border-b border-red-900/50 pb-2">ATAQUES (Contra rivales)</span>
                  <ul className="text-[10px] space-y-4 opacity-90">
                    <li className="flex items-center gap-3">
                      <img src="/skills/d1.png" alt="Ceguera" className="w-8 h-8 object-cover border border-red-500/50 rounded-sm bg-black shrink-0" />
                      <div><b className="text-white text-xs">[Q] CEGUERA:</b><br/>Mancha la pantalla de tus rivales para que no puedan ver.</div>
                    </li>
                    <li className="flex items-center gap-3">
                      <img src="/skills/d2.png" alt="Controles Locos" className="w-8 h-8 object-cover border border-red-500/50 rounded-sm bg-black shrink-0" />
                      <div><b className="text-white text-xs">[W] CONTROLES LOCOS:</b><br/>Hace que los puntos de tus enemigos giren al revés.</div>
                    </li>
                    <li className="flex items-center gap-3">
                      <img src="/skills/d3.png" alt="Agujero Negro" className="w-8 h-8 object-cover border border-red-500/50 rounded-sm bg-black shrink-0" />
                      <div><b className="text-white text-xs">[E] AGUJERO NEGRO:</b><br/>Achica el radar de los rivales haciéndolo muy pequeño.</div>
                    </li>
                    <li className="flex items-center gap-3">
                      <img src="/skills/d4.png" alt="Bloqueo" className="w-8 h-8 object-cover border border-red-500/50 rounded-sm bg-black shrink-0" />
                      <div><b className="text-white text-xs">[R] BLOQUEO:</b><br/>Congela a los enemigos, impidiendo que hagan clic en sus puntos.</div>
                    </li>
                    <li className="flex items-center gap-3">
                      <img src="/skills/d5.png" alt="Caos" className="w-8 h-8 object-cover border border-red-500/50 rounded-sm bg-black shrink-0" />
                      <div><b className="text-white text-xs">[T] CAOS TOTAL:</b><br/>Hace que los puntos enemigos giren a una velocidad loca.</div>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* SECCIÓN 3: REGLAS GEOMÉTRICAS */}
            <section>
              <h3 className="text-sm font-bold text-cyan-500 uppercase mb-4 border-l-2 border-cyan-500 pl-3">03. Reglas para armar figuras</h3>
              <div className="space-y-4 bg-black/40 p-4 border border-zinc-800 rounded-sm">
                
                <div className="flex gap-4 items-center">
                  <div className="w-10 h-10 border border-cyan-500/50 flex items-center justify-center text-sm font-bold text-cyan-500 shrink-0 bg-cyan-950/20">1</div>
                  <p className="text-[11px] leading-relaxed">
                    <span className="text-white font-bold block mb-1">Sin puntas hacia adentro:</span> 
                    Las figuras siempre deben ser "gorditas" o planas. No puedes armar formas de estrella, ni figuras que se parezcan a un "Pac-Man" con la boca abierta.
                  </p>
                </div>
                
                <div className="flex gap-4 items-center border-t border-zinc-800/50 pt-4">
                  <div className="w-10 h-10 border border-cyan-500/50 flex items-center justify-center text-sm font-bold text-cyan-500 shrink-0 bg-cyan-950/20">2</div>
                  <p className="text-[11px] leading-relaxed">
                    <span className="text-white font-bold block mb-1">Que no queden muy estiradas:</span> 
                    Intenta que los lados de tu figura sean parecidos. Si unes puntos que están muy, muy lejos y formas una línea súper flaca y estirada, el juego la rechazará.
                  </p>
                </div>
                
                <div className="flex gap-4 items-center border-t border-zinc-800/50 pt-4">
                  <div className="w-10 h-10 border border-cyan-500/50 flex items-center justify-center text-sm font-bold text-cyan-500 shrink-0 bg-cyan-950/20">3</div>
                  <p className="text-[11px] leading-relaxed">
                    <span className="text-white font-bold block mb-1">No cruzar las líneas:</span> 
                    El borde de tu figura no puede cruzarse sobre sí mismo. No intentes hacer formas como un número "8" o un moño de zapatos.
                  </p>
                </div>

              </div>
            </section>

          </div>

          {/* FOOTER */}
          <div className="mt-6 pt-4 border-t border-cyan-900/50 text-center">
            <p className="text-[10px] text-cyan-500/50 animate-pulse uppercase tracking-[0.5em] font-bold">
              ESTÁS LISTO PARA JUGAR
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}