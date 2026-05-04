'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface ResultsModalProps {
  scoreLocal: number;
  telemetriaRivales: Record<number, any>;
  jugadores: any[];
  userSession: { id: string; username: string; roomCode: string } | null;
  onReplay: () => void; // <-- INYECCIÓN DE DEPENDENCIA PARA EL BUCLE DE JUEGO
}

export default function ResultsModal({ scoreLocal, telemetriaRivales, jugadores, userSession, onReplay }: ResultsModalProps) {
  const [guardado, setGuardado] = useState(false);

  // 1. Lógica de Persistencia (Guardar en Supabase)
  useEffect(() => {
    const registrarRecord = async () => {
      if (scoreLocal <= 0 || !userSession?.username) return;

      const { error } = await supabase
        .from('ranking_global')
        .insert([{ 
          username: userSession.username, 
          score: scoreLocal 
        }]);

      if (!error) {
        setGuardado(true);
        console.log("Telemetría sincronizada con el Hall of Fame.");
      }
    };
    registrarRecord();
  }, [scoreLocal, userSession?.username]);

  // 2. Procesar y unificar el Ranking de la Escuadra
  const ranking = jugadores.map(jugador => {
    if (jugador.id === userSession?.id) {
      return { ...jugador, finalScore: scoreLocal, esLocal: true };
    }
    const dataRival = telemetriaRivales[jugador.slot];
    return { ...jugador, finalScore: dataRival?.score || 0, esLocal: false };
  }).sort((a, b) => b.finalScore - a.finalScore);

  const ganador = ranking[0];
  const esVictoria = ganador?.id === userSession?.id;

  // 3. Cálculo de puntos totales de la escuadra
  const totalEscuadra = Object.values(telemetriaRivales).reduce(
    (acc: number, r: any): number => acc + (Number(r.score) || 0), 
    scoreLocal
  );

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 select-none font-mono">
      
      <div className="w-full max-w-2xl border border-cyan-500/30 bg-black shadow-[0_0_80px_rgba(6,182,212,0.15)] flex flex-col relative">
        
        {/* Esquinas Decorativas */}
        <div className="absolute -top-1 -left-1 w-8 h-8 border-t-2 border-l-2 border-cyan-400" />
        <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-2 border-r-2 border-cyan-400" />

        {/* HEADER: Estado de la Misión */}
        <div className={`p-6 border-b border-cyan-900/50 text-center ${esVictoria ? 'bg-cyan-950/20' : 'bg-red-950/10'}`}>
          <h2 className={`text-4xl font-bold tracking-[0.2em] uppercase drop-shadow-md ${esVictoria ? 'text-cyan-400' : 'text-red-500'}`}>
            {esVictoria ? 'EXTRACCIÓN EXITOSA' : 'ENLACE PERDIDO'}
          </h2>
          <div className="flex justify-center gap-6 mt-2">
            <p className="text-[9px] text-zinc-500 tracking-widest uppercase">Operación: A316_FINAL</p>
            <p className="text-[9px] text-zinc-500 tracking-widest uppercase">Status: {guardado ? 'SINC_DATA_OK' : 'SINC_DATA_PENDING'}</p>
          </div>
        </div>

        {/* CONTENIDO: Leaderboard y Totales */}
        <div className="p-8 space-y-6">
          
          {/* Totales Rápidos */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-cyan-950/10 border border-cyan-500/20 p-3 text-center">
              <span className="text-[8px] text-zinc-500 uppercase block">Mi Resonancia</span>
              <span className="text-2xl font-bold text-cyan-400 tabular-nums">{scoreLocal.toLocaleString()}</span>
            </div>
            <div className="bg-yellow-500/5 border border-yellow-500/20 p-3 text-center">
              <span className="text-[8px] text-zinc-500 uppercase block">Total Escuadra</span>
              <span className="text-2xl font-bold text-yellow-500 tabular-nums">{totalEscuadra.toLocaleString()}</span>
            </div>
          </div>

          {/* Leaderboard de la Sesión */}
          <div className="space-y-2">
            <div className="flex justify-between text-[9px] text-zinc-600 uppercase px-2">
              <span>Rango / Piloto</span>
              <span>Puntos</span>
            </div>
            {ranking.map((piloto, index) => (
              <div 
                key={piloto.id}
                className={`flex justify-between items-center p-3 border transition-all ${
                  piloto.esLocal ? 'border-cyan-500/50 bg-cyan-500/5' : 'border-zinc-900 bg-black/40'
                } ${index === 0 ? 'border-l-4 border-l-yellow-500' : 'border-l-4 border-l-transparent'}`}
              >
                <div className="flex items-center gap-4">
                  <span className={`text-lg font-bold ${index === 0 ? 'text-yellow-500' : 'text-zinc-700'}`}>0{index + 1}</span>
                  <div className="flex flex-col text-left">
                    <span className={`text-xs font-bold uppercase ${piloto.esLocal ? 'text-white' : 'text-zinc-400'}`}>
                      {piloto.username} {piloto.esLocal && '(TÚ)'}
                    </span>
                    <span className="text-[8px] text-zinc-600">SLOT_0{piloto.slot}</span>
                  </div>
                </div>
                <span className={`text-lg font-bold tabular-nums ${index === 0 ? 'text-yellow-500' : 'text-cyan-600'}`}>
                  {piloto.finalScore.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* FOOTER: Acciones de Arquitectura */}
        <div className="p-6 border-t border-cyan-900/50 bg-black/40 text-center flex flex-col gap-3">
          
          {/* BOTÓN PRIMARIO: Mantiene la conexión, reinicia la máquina de estados */}
          <button 
            onClick={onReplay}
            className="w-full py-4 bg-cyan-500/10 border border-cyan-500 text-cyan-400 text-xs font-bold tracking-[0.3em] uppercase hover:bg-cyan-500 hover:text-black transition-all shadow-[0_0_15px_rgba(6,182,212,0.2)]"
          >
            [ INICIAR NUEVA SECUENCIA ]
          </button>

          {/* BOTÓN SECUNDARIO: Hard Reset (Expulsa del lobby) */}
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-2 bg-transparent border border-zinc-800 text-zinc-500 text-[10px] font-bold tracking-[0.2em] uppercase hover:bg-red-900/20 hover:text-red-400 hover:border-red-900/50 transition-all"
          >
            [ ABORTAR ENLACE Y DESCONECTAR ]
          </button>

          {guardado && (
            <p className="mt-2 text-[8px] text-green-500 animate-pulse uppercase tracking-widest font-bold">
              ✓ Telemetría guardada en la matriz global
            </p>
          )}
        </div>

      </div>
    </div>
  );
}