'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import FeedbackModal from './FeedbackModal'; // <-- IMPORTACIÓN DEL MÓDULO DE TELEMETRÍA

interface AccessModalProps {
  onAccessGranted: (userData: { id: string; username: string; slot: number; roomCode: string }) => void;
}

const generarUUID = () => {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export default function AccessModal({ onAccessGranted }: AccessModalProps) {
  const [username, setUsername] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ESTADO PARA EL MODAL DE FEEDBACK
  const [showFeedback, setShowFeedback] = useState(false);

  // ESTADOS DEL HALL OF FAME
  const [ranking, setRanking] = useState<any[]>([]);
  const [filtro, setFiltro] = useState<'semanal' | 'mensual' | 'global'>('global');

  // LÓGICA DE EXTRACCIÓN DE TELEMETRÍA (RANKING)
  const fetchRanking = useCallback(async () => {
    let query = supabase
      .from('ranking_global')
      .select('username, score, created_at')
      .order('score', { ascending: false })
      .limit(5);

    const ahora = new Date();
    
    if (filtro === 'semanal') {
      const haceUnaSemana = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
      query = query.gte('created_at', haceUnaSemana.toISOString());
    } else if (filtro === 'mensual') {
      const haceUnMes = new Date(ahora.setMonth(ahora.getMonth() - 1));
      query = query.gte('created_at', haceUnMes.toISOString());
    }

    const { data, error } = await query;
    if (!error && data) setRanking(data);
  }, [filtro]);

  useEffect(() => {
    fetchRanking();
  }, [fetchRanking]);

  useEffect(() => {
    const sessionSaved = localStorage.getItem('A316_SESSION');
    if (sessionSaved) {
      try {
        const parsed = JSON.parse(sessionSaved);
        onAccessGranted(parsed);
      } catch (e) {
        localStorage.removeItem('A316_SESSION');
      }
    }
  }, [onAccessGranted]);

  const generarCodigoSala = () => Math.random().toString(36).substring(2, 8).toUpperCase();

  const handleAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = username.trim().toUpperCase();
    if (!cleanUsername) return;
    setLoading(true);
    setError(null);

    try {
      let finalCode = roomCode.trim().toUpperCase();
      const isCreating = !finalCode;
      if (isCreating) finalCode = generarCodigoSala();

      const { data: sala, error: fetchError } = await supabase
        .from('salas')
        .select('*')
        .eq('codigo_sala', finalCode)
        .maybeSingle();

      if (fetchError) throw fetchError;

      let myId = generarUUID();
      let mySlot = 1;
      let updatedJugadores = [];

      if (!sala) {
        mySlot = 1;
        updatedJugadores = [{ id: myId, username: cleanUsername, slot: mySlot, listo: false }];
        const { error: createError } = await supabase
          .from('salas')
          .insert([{ codigo_sala: finalCode, jugadores: updatedJugadores, estado: 'espera' }]);
        if (createError) throw createError;
      } else {
        const jugadoresActuales = sala.jugadores || [];
        const pilotoExistente = jugadoresActuales.find((p: any) => p.username.toUpperCase() === cleanUsername);
        if (pilotoExistente) {
          myId = pilotoExistente.id;
          mySlot = pilotoExistente.slot;
        } else {
          if (jugadoresActuales.length >= 4) throw new Error('SALA_LLENA');
          mySlot = jugadoresActuales.length + 1;
          updatedJugadores = [...jugadoresActuales, { id: myId, username: cleanUsername, slot: mySlot, listo: false }];
          const { error: updateError } = await supabase.from('salas').update({ jugadores: updatedJugadores }).eq('codigo_sala', finalCode);
          if (updateError) throw updateError;
        }
      }

      const sessionData = { id: myId, username: cleanUsername, slot: mySlot, roomCode: finalCode };
      localStorage.setItem('A316_SESSION', JSON.stringify(sessionData));
      onAccessGranted(sessionData);
    } catch (err: any) {
      setError(err.message === 'SALA_LLENA' ? 'SALA_AL_MÁXIMO_DE_CAPACIDAD' : 'ERROR_DE_ENLACE_RSD_V4');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-end pr-10 md:pr-[10%] overflow-hidden bg-black select-none font-mono">
      
      {/* BACKGROUND LOBBY */}
      <div className="absolute inset-0 z-0">
        <img src="/bg_lobby.png" className="w-full h-full object-cover opacity-70" alt="Lobby Matrix" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/80" />
      </div>

      {/* PANEL DE IDENTIFICACIÓN Y RANKING */}
      <div className="relative z-20 w-full max-w-[450px] p-1 bg-cyan-900/10 backdrop-blur-xl border border-cyan-500/20 shadow-[0_0_50px_rgba(0,0,0,0.8)]">
        
        {/* Esquinas Decorativas con Brillo Intenso */}
        <div className="absolute -top-1 -left-1 w-5 h-5 border-t-2 border-l-2 border-cyan-400 shadow-[0_0_15px_#22d3ee] z-30" />
        <div className="absolute -top-1 -right-1 w-5 h-5 border-t-2 border-r-2 border-cyan-400 shadow-[0_0_15px_#22d3ee] z-30" />
        <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-2 border-l-2 border-cyan-400 shadow-[0_0_15px_#22d3ee] z-30" />
        <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-2 border-r-2 border-cyan-400 shadow-[0_0_15px_#22d3ee] z-30" />

        <div className="relative border border-cyan-500/30 p-8 bg-black/75">
          
          {/* TÍTULO COMERCIAL DEL JUEGO */}
          <div className="relative mb-8 text-center">
            {/* Líneas laterales de diseño de interfaz */}
            <div className="absolute top-1/2 left-0 w-[15%] h-[1px] bg-gradient-to-r from-transparent to-cyan-500/80" />
            <div className="absolute top-1/2 right-0 w-[15%] h-[1px] bg-gradient-to-l from-transparent to-cyan-500/80" />
            
            <h1 className="text-[32px] font-black tracking-[0.15em] text-transparent bg-clip-text bg-gradient-to-b from-white via-cyan-200 to-cyan-500 drop-shadow-[0_0_15px_rgba(34,211,238,0.6)] uppercase italic leading-none">
            Geometry Crossroads
            </h1>
            <p className="text-[9px] text-cyan-400/80 mt-2 tracking-[0.4em] uppercase font-bold">
            SINCRONIZA LA ÓRBITA. DOMINA EL VACÍO
            </p>
          </div>

          {/* SECCIÓN: HALL OF FAME (TOP 5) */}
          <div className="mb-6 border-y border-zinc-800/80 py-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[10px] text-zinc-500 uppercase tracking-[0.3em] font-bold">Hall_of_Fame</h3>
              <div className="flex gap-2">
                {(['semanal', 'mensual', 'global'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFiltro(f)}
                    className={`text-[8px] px-2 py-0.5 border uppercase transition-all duration-300 ${filtro === f ? 'border-cyan-500 text-cyan-400 bg-cyan-500/10 shadow-[0_0_10px_rgba(6,182,212,0.2)]' : 'border-zinc-800 text-zinc-600 hover:text-zinc-400'}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 min-h-[105px]">
              {ranking.map((pilot, i) => (
                <div key={i} className="flex justify-between items-center bg-cyan-950/5 border-l-2 border-cyan-500/20 px-3 py-1.5 transition-all hover:bg-cyan-500/5">
                  <span className="text-[11px] text-zinc-400">
                    <span className="text-cyan-600 mr-2 font-bold">0{i+1}</span>
                    {pilot.username}
                  </span>
                  <span className="text-[11px] font-bold text-yellow-500 tabular-nums">
                    {pilot.score.toLocaleString()}
                  </span>
                </div>
              ))}
              {ranking.length === 0 && (
                <p className="text-[9px] text-zinc-700 uppercase mt-4 text-center tracking-widest italic">Esperando telemetría de red...</p>
              )}
            </div>
          </div>

          {/* SECCIÓN: IDENTIFICACIÓN */}
          <div className="mb-6 text-center">
            <h2 className="text-[20px] font-bold tracking-[0.1em] text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)] uppercase whitespace-nowrap">
              Identificación
            </h2>
            
            <div className="relative mt-5 flex items-center justify-center">
              <div className="w-full h-[1px] bg-zinc-800" />
              <div className="absolute bg-cyan-500 w-2 h-2 rotate-45 border border-black shadow-[0_0_8px_#22d3ee]" />
            </div>
          </div>

          <form onSubmit={handleAccess} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-[10px] text-zinc-600 uppercase tracking-widest ml-1">Nombre De Usuario</label>
              <input
                required
                autoFocus
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-black/40 border border-cyan-900/60 p-3.5 text-sm text-cyan-400 focus:outline-none focus:border-cyan-400 transition-all uppercase placeholder:text-zinc-500 shadow-inner"
                placeholder="ESCRIBE TU ALIAS..."
                maxLength={12}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] text-zinc-600 uppercase tracking-widest ml-1">Codigo De la Sala(Opcional)</label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                className="w-full bg-black/40 border border-cyan-900/40 p-3.5 text-sm text-cyan-400 focus:outline-none focus:border-cyan-400/50 transition-all uppercase placeholder:text-zinc-500 shadow-inner"
                placeholder="CÓDIGO PARA UNIRSE..."
                maxLength={6}
              />
            </div>

            {error && (
              <div className="py-2 border-l-2 border-red-500 bg-red-500/10">
                <p className="text-[10px] text-red-500 pl-3 uppercase tracking-tighter"> 
                  {">"} {error} 
                </p>
              </div>
            )}

            <button
              disabled={loading || !username}
              className="w-full py-4 mt-2 bg-cyan-500/10 border border-cyan-500/60 text-cyan-300 font-bold uppercase hover:bg-cyan-500 hover:text-black transition-all disabled:opacity-20 shadow-[0_0_20px_rgba(6,182,212,0.2)] group relative overflow-hidden"
            >
              <span className="relative z-10 tracking-[0.2em] drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]">
                {loading ? 'SINC_ENLACE...' : roomCode ? 'VINCULAR A ESCUADRA' : 'INICIAR NUEVA MATRIZ'}
              </span>
              <div className="absolute inset-0 bg-cyan-400 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
            </button>
          </form>

          {/* Decoración Inferior + Botón de Reporte */}
          <div className="mt-8 flex flex-col items-center gap-2">
            <button 
              type="button" 
              onClick={() => setShowFeedback(true)}
              className="text-[10px] font-bold text-cyan-400 hover:text-cyan-200 uppercase tracking-widest border-b border-cyan-900/50 hover:border-cyan-400 transition-all mb-1 drop-shadow-[0_0_5px_rgba(34,211,238,0.4)]"
            >
              [ Reporte de Experiencia ]
            </button>
            <div className="w-2 h-2 rounded-full border border-cyan-400 shadow-[0_0_10px_#22d3ee] opacity-70" />
            <div className="w-[1px] h-6 bg-gradient-to-b from-cyan-400 to-transparent opacity-70" />
          </div>
        </div>
      </div>

      {/* RENDERIZADO DEL MODAL DE FEEDBACK OCULTO */}
      {showFeedback && (
        <FeedbackModal 
          onClose={() => setShowFeedback(false)} 
          username={username || 'PILOTO_ANONIMO'} 
        />
      )}
    </div>
  );
}