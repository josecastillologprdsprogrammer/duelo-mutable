'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

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
        <img src="/bg.png" className="w-full h-full object-cover opacity-70" alt="Lobby Matrix" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/80" />
      </div>

      {/* PANEL DE IDENTIFICACIÓN */}
      <div className="relative z-20 w-full max-w-[450px] p-1 bg-cyan-900/10 backdrop-blur-xl border border-cyan-500/20 shadow-[0_0_50px_rgba(0,0,0,0.8)]">
        
        {/* Esquinas Decorativas con Brillo Intenso */}
        <div className="absolute -top-1 -left-1 w-5 h-5 border-t-2 border-l-2 border-cyan-400 shadow-[0_0_15px_#22d3ee] z-30" />
        <div className="absolute -top-1 -right-1 w-5 h-5 border-t-2 border-r-2 border-cyan-400 shadow-[0_0_15px_#22d3ee] z-30" />
        <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-2 border-l-2 border-cyan-400 shadow-[0_0_15px_#22d3ee] z-30" />
        <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-2 border-r-2 border-cyan-400 shadow-[0_0_15px_#22d3ee] z-30" />

        <div className="relative border border-cyan-500/30 p-10 bg-black/75">
          
          <div className="mb-10 text-center">
            <h2 className="text-[24px] font-bold tracking-[0.1em] text-cyan-400 drop-shadow-[0_0_12px_rgba(34,211,238,0.8)] uppercase whitespace-nowrap">
              Identificación de Piloto
            </h2>
            <p className="text-[10px] text-zinc-500 mt-2 tracking-[0.2em] uppercase">
              Sistema de Acceso Público A316
            </p>
            
            <div className="relative mt-8 flex items-center justify-center">
              <div className="w-full h-[1px] bg-zinc-800" />
              <div className="absolute bg-cyan-500 w-2.5 h-2.5 rotate-45 border border-black shadow-[0_0_8px_#22d3ee]" />
            </div>
          </div>

          <form onSubmit={handleAccess} className="space-y-8">
            <div className="space-y-3">
              <label className="block text-[10px] text-zinc-600 uppercase tracking-widest ml-1">User_ID</label>
              <input
                required
                autoFocus
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-black/40 border border-cyan-900/60 p-4 text-sm text-cyan-400 focus:outline-none focus:border-cyan-400 transition-all uppercase placeholder:text-zinc-800 shadow-inner"
                placeholder="ESCRIBE TU ALIAS..."
                maxLength={12}
              />
            </div>

            <div className="space-y-3">
              <label className="block text-[10px] text-zinc-600 uppercase tracking-widest ml-1">Link_Code (Opcional)</label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                className="w-full bg-black/40 border border-cyan-900/40 p-4 text-sm text-zinc-300 focus:outline-none focus:border-cyan-400/50 transition-all uppercase placeholder:text-zinc-800 shadow-inner"
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

            {/* BOTÓN CALIBRADO PARA MÁXIMA VISIBILIDAD */}
            <button
              disabled={loading || !username}
              className="w-full py-5 bg-cyan-500/10 border border-cyan-500/60 text-cyan-300 font-bold uppercase hover:bg-cyan-500 hover:text-black transition-all disabled:opacity-20 shadow-[0_0_20px_rgba(6,182,212,0.2)] group relative overflow-hidden"
            >
              <span className="relative z-10 tracking-[0.2em] drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]">
                {loading ? 'SINC_ENLACE...' : roomCode ? 'VINCULAR A ESCUADRA' : 'INICIAR NUEVA MATRIZ'}
              </span>
              <div className="absolute inset-0 bg-cyan-400 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
            </button>
          </form>

          {/* Decoración Inferior */}
          <div className="mt-12 flex flex-col items-center gap-2 opacity-70">
            <div className="w-2.5 h-2.5 rounded-full border border-cyan-400 shadow-[0_0_10px_#22d3ee]" />
            <div className="w-[1px] h-6 bg-gradient-to-b from-cyan-400 to-transparent" />
          </div>
        </div>
      </div>
    </div>
  );
}