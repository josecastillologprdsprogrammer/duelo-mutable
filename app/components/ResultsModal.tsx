'use client';

interface ResultsModalProps {
  scoreLocal: number;
  telemetriaRivales: any;
  jugadores: any[];
  userSession: any;
}

export default function ResultsModal({ scoreLocal, telemetriaRivales, jugadores, userSession }: ResultsModalProps) {
  
  // 1. Procesar y unificar la data de toda la escuadra
  const ranking = jugadores.map(jugador => {
    if (jugador.id === userSession.id) {
      return { ...jugador, finalScore: scoreLocal, esLocal: true };
    }
    const dataRival = telemetriaRivales[jugador.slot];
    return { ...jugador, finalScore: dataRival?.score || 0, esLocal: false };
  }).sort((a, b) => b.finalScore - a.finalScore); // Orden descendente

  const ganador = ranking[0];
  const esVictoria = ganador?.id === userSession.id;

  const cerrarConexion = () => {
    // Para la V1, un reinicio forzado limpia la RAM y reinicia la conexión de Supabase
    window.location.reload(); 
  };

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/90 backdrop-blur-md select-none p-4">
      <div className="w-full max-w-2xl border-2 border-zinc-800 bg-[#050505] shadow-[0_0_50px_rgba(6,182,212,0.1)] flex flex-col">
        
        {/* HEADER: Estado de la Misión */}
        <div className={`p-6 border-b-2 text-center ${esVictoria ? 'border-cyan-500 bg-cyan-950/20' : 'border-red-900 bg-red-950/20'}`}>
          <h2 className={`font-mono text-4xl font-bold tracking-[0.2em] uppercase drop-shadow-md
            ${esVictoria ? 'text-cyan-400' : 'text-red-500'}`}>
            {esVictoria ? 'EXTRACCIÓN EXITOSA' : 'ENLACE PERDIDO'}
          </h2>
          <p className="font-mono text-[10px] text-zinc-400 tracking-widest mt-2 uppercase">
            Sync_Clock: 00:00 | Operación Finalizada
          </p>
        </div>

        {/* TABLA DE CLASIFICACIÓN (LEADERBOARD) */}
        <div className="p-8 flex flex-col gap-3">
          <div className="flex justify-between text-[9px] font-mono text-zinc-600 uppercase border-b border-zinc-800 pb-2 mb-2 px-2">
            <span>Rango / Piloto</span>
            <span>Puntos de Resonancia</span>
          </div>

          {ranking.map((piloto, index) => {
            const esGanador = index === 0;
            return (
              <div 
                key={piloto.id}
                className={`flex justify-between items-center p-3 font-mono border transition-all
                  ${piloto.esLocal ? 'border-zinc-500 bg-zinc-900/50' : 'border-zinc-800 bg-black/40'}
                  ${esGanador ? 'border-l-4 border-l-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.1)]' : 'border-l-4 border-l-transparent'}
                `}
              >
                <div className="flex items-center gap-4">
                  <span className={`text-lg font-bold ${esGanador ? 'text-yellow-500' : 'text-zinc-600'}`}>
                    0{index + 1}
                  </span>
                  <div className="flex flex-col">
                    <span className={`text-sm uppercase tracking-wider font-bold ${piloto.esLocal ? 'text-white' : 'text-zinc-400'}`}>
                      {piloto.username} {piloto.esLocal && '(TÚ)'}
                    </span>
                    <span className="text-[8px] text-zinc-500">SLOT_{piloto.slot}</span>
                  </div>
                </div>
                
                <span className={`text-xl font-bold tabular-nums tracking-tighter
                  ${esGanador ? 'text-yellow-500' : 'text-cyan-500'}`}>
                  {piloto.finalScore.toLocaleString()} PTS
                </span>
              </div>
            );
          })}
        </div>

        {/* FOOTER: Acciones */}
        <div className="p-6 border-t border-zinc-800 flex justify-center bg-black/40">
          <button 
            onClick={cerrarConexion}
            className="px-12 py-4 bg-zinc-900 border border-zinc-700 text-white font-mono text-xs tracking-widest uppercase hover:bg-cyan-500 hover:text-black hover:border-cyan-400 transition-all shadow-lg"
          >
            [ DESCONECTAR Y VOLVER A LA BASE ]
          </button>
        </div>

      </div>
    </div>
  );
}