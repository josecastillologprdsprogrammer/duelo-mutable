'use client';

interface GuideModalProps {
  onClose: () => void;
}

export default function GuideModal({ onClose }: GuideModalProps) {
  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 select-none font-mono">
      
      {/* CHASIS DEL MANUAL */}
      <div className="relative w-full max-w-2xl bg-black border border-cyan-500/30 p-1 shadow-[0_0_100px_rgba(6,182,212,0.1)]">
        
        {/* Esquinas Reforzadas */}
        <div className="absolute -top-1 -left-1 w-6 h-6 border-t-2 border-l-2 border-cyan-400 z-10" />
        <div className="absolute -top-1 -right-1 w-6 h-6 border-t-2 border-r-2 border-cyan-400 z-10" />
        <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-2 border-l-2 border-cyan-400 z-10" />
        <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-2 border-r-2 border-cyan-400 z-10" />

        <div className="border border-cyan-900/50 p-8 bg-zinc-950/50">
          
          {/* HEADER */}
          <div className="flex justify-between items-center border-b border-cyan-900/50 pb-6 mb-8">
            <div>
              <h2 className="text-2xl font-bold text-cyan-400 tracking-tighter uppercase drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
                Manual de Operaciones Tácticas
              </h2>
              <p className="text-[9px] text-zinc-500 uppercase tracking-[0.3em] mt-1">Ref: Protocolo_Resonancia_A316</p>
            </div>
            <button 
              onClick={onClose}
              className="px-4 py-2 border border-red-900/50 text-red-500 text-[10px] uppercase hover:bg-red-500 hover:text-black transition-all"
            >
              [ Cerrar_X ]
            </button>
          </div>

          {/* CONTENIDO SCROLLABLE */}
          <div className="space-y-8 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar text-zinc-300">
            
            {/* SECCIÓN 1: OBJETIVO */}
            <section>
              <h3 className="text-xs font-bold text-cyan-500 uppercase mb-3 border-l-2 border-cyan-500 pl-3">01. Misión Principal</h3>
              <p className="text-xs leading-relaxed">
                Captura nodos de resonancia en el radar orbital para generar estructuras geométricas estables. 
                Cada figura validada extrae energía de la matriz y aumenta tu puntuación táctica.
              </p>
            </section>

            {/* SECCIÓN 2: CONTROLES DE SISTEMA */}
            <section>
              <h3 className="text-xs font-bold text-cyan-500 uppercase mb-3 border-l-2 border-cyan-500 pl-3">02. Mapeo de Interfaz</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-cyan-950/10 border border-cyan-900/30 p-3 rounded-sm">
                  <span className="text-[10px] text-cyan-400 font-bold block mb-2 underline">SISTEMAS (BUFFS)</span>
                  <ul className="text-[9px] space-y-1.5 opacity-80">
                    <li><b className="text-white">[1] CHRONOS:</b> Ralentiza el tiempo orbital.</li>
                    <li><b className="text-white">[2] MAGNETAR:</b> Atrae nodos cercanos.</li>
                    <li><b className="text-white">[3] DOUBLE:</b> Duplica la ganancia de PTS.</li>
                    <li><b className="text-white">[4] SHIELD:</b> Protege contra sabotajes.</li>
                    <li><b className="text-white">[5] REGEN:</b> Recupera energía (EMS).</li>
                  </ul>
                </div>
                <div className="bg-red-950/10 border border-red-900/30 p-3 rounded-sm">
                  <span className="text-[10px] text-red-400 font-bold block mb-2 underline">ARMAMENTO (DEBUFFS)</span>
                  <ul className="text-[9px] space-y-1.5 opacity-80">
                    <li><b className="text-white">[Q] FLARE:</b> Ciega el radar enemigo.</li>
                    <li><b className="text-white">[W] REVERSE:</b> Invierte controles rivales.</li>
                    <li><b className="text-white">[E] VOID:</b> Crea un agujero negro de nodos.</li>
                    <li><b className="text-white">[R] GHOST:</b> Bloquea clics del oponente.</li>
                    <li><b className="text-white">[T] OVERLOAD:</b> Acelera el caos orbital.</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* SECCIÓN 3: REGLAS GEOMÉTRICAS */}
            <section>
              <h3 className="text-xs font-bold text-cyan-500 uppercase mb-3 border-l-2 border-cyan-500 pl-3">03. Protocolos de Validación</h3>
              <div className="space-y-4">
                <div className="flex gap-4 items-start">
                  <div className="w-8 h-8 border border-cyan-500/30 flex items-center justify-center text-[10px] font-bold text-cyan-500 shrink-0">A</div>
                  <p className="text-[10px] leading-relaxed">
                    <span className="text-white font-bold">FILTRO DE CONVEXIDAD:</span> Las figuras no pueden tener ángulos hacia adentro. Todos los vértices deben apuntar hacia el exterior para mantener la integridad estructural.
                  </p>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="w-8 h-8 border border-cyan-500/30 flex items-center justify-center text-[10px] font-bold text-cyan-500 shrink-0">B</div>
                  <p className="text-[10px] leading-relaxed">
                    <span className="text-white font-bold">PROPORCIÓN TÁCTICA:</span> Los lados de la figura deben ser equilibrados. Una figura demasiado estirada (ratio {">"} 2.5) será rechazada por inestabilidad.
                  </p>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="w-8 h-8 border border-cyan-500/30 flex items-center justify-center text-[10px] font-bold text-cyan-500 shrink-0">C</div>
                  <p className="text-[10px] leading-relaxed">
                    <span className="text-white font-bold">ANTI-COLISIÓN:</span> Las líneas de conexión no pueden cruzarse entre sí. El algoritmo de centroide garantiza un perímetro limpio.
                  </p>
                </div>
              </div>
            </section>

          </div>

          {/* FOOTER */}
          <div className="mt-8 pt-6 border-t border-cyan-900/50 text-center">
            <p className="text-[10px] text-cyan-500/50 animate-pulse uppercase tracking-[0.5em]">
              Sincronizando Módulo de Aprendizaje...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}