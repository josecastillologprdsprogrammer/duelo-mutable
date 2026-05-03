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
          .insert([{ 
            codigo_sala: finalCode, 
            jugadores: updatedJugadores, 
            estado: 'espera' 
          }]);
        if (createError) throw createError;
      } else {
        const jugadoresActuales = sala.jugadores || [];
        const pilotoExistente = jugadoresActuales.find(
          (p: any) => p.username.toUpperCase() === cleanUsername
        );

        if (pilotoExistente) {
          myId = pilotoExistente.id;
          mySlot = pilotoExistente.slot;
        } else {
          if (jugadoresActuales.length >= 4) throw new Error('SALA_LLENA');
          mySlot = jugadoresActuales.length + 1;
          updatedJugadores = [...jugadoresActuales, { id: myId, username: cleanUsername, slot: mySlot, listo: false }];
          const { error: updateError } = await supabase
            .from('salas')
            .update({ jugadores: updatedJugadores })
            .eq('codigo_sala', finalCode);
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
    <div className="fixed inset-0 z-[100] flex items-center justify-end pr-10 md:pr-[12%] overflow-hidden bg-black select-none">
      
      {/* CAPA DE FONDO: EXCLUSIVO LOBBY */}
      <div className="absolute inset-0 z-0">
        <img 
          src="/bg.png" 
          className="w-full h-full object-cover opacity-80" 
          alt="Lobby Matrix" 
        />
        {/* Overlay para suavizar la transición hacia el panel de la derecha */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/60" />
      </div>

      {/* PANEL DE IDENTIFICACIÓN (A LA DERECHA) */}
      <div className="relative z-20 w-full max-w-[380px] border border-cyan-500/30 bg-black/80 backdrop-blur-xl p-10 shadow-[0_0_80px_rgba(0,0,0,0.9)] rounded-sm">
        
        <div className="mb-10 text-center border-b border-zinc-800 pb-8">
          <h2 className="font-mono text-2xl font-bold tracking-tighter text-cyan-400 drop-shadow-[0_0_15px_rgba(6,182,212,0.4)] uppercase">
            Identificación de Piloto
          </h2>
          <p className="font-mono text-[10px] text-zinc-500 mt-2 tracking-[0.3em] uppercase">
            Sistema de Acceso Público A316
          </p>
        </div>

        <form onSubmit={handleAccess} className="space-y-8">
          <div className="space-y-2">
            <label className="block font-mono text-[10px] text-zinc-600 uppercase tracking-widest">User_ID</label>
            <input
              required
              autoFocus
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-zinc-950/90 border border-zinc-800 p-4 font-mono text-sm text-cyan-400 focus:outline-none focus:border-cyan-500/50 transition-all uppercase placeholder:text-zinc-800"
              placeholder="ESCRIBE TU ALIAS..."
              maxLength={12}
            />
          </div>

          <div className="space-y-2">
            <label className="block font-mono text-[10px] text-zinc-600 uppercase tracking-widest">Link_Code (Opcional)</label>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              className="w-full bg-zinc-950/90 border border-zinc-800 p-4 font-mono text-sm text-white focus:outline-none focus:border-zinc-700 transition-all uppercase placeholder:text-zinc-800"
              placeholder="CÓDIGO PARA UNIRSE..."
              maxLength={6}
            />
          </div>

          {error && (
            <div className="py-3 bg-red-950/20 border border-red-900/50">
              <p className="font-mono text-[11px] text-red-500 text-center uppercase tracking-tighter animate-pulse"> 
                {">"} {error} 
              </p>
            </div>
          )}

          <button
            disabled={loading || !username}
            className="w-full py-5 bg-zinc-900/40 border border-zinc-700 text-cyan-500 font-mono text-xs font-bold uppercase hover:bg-cyan-500 hover:text-black transition-all disabled:opacity-10 shadow-[0_0_20px_rgba(6,182,212,0.1)] hover:shadow-[0_0_40px_rgba(6,182,212,0.3)]"
          >
            {loading ? 'ESTABLECIENDO ENLACE...' : roomCode ? 'VINCULAR A ESCUADRA' : 'INICIAR NUEVA MATRIZ'}
          </button>
        </form>

        <div className="mt-10 flex justify-center gap-6 opacity-20">
          <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-ping" />
          <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-ping [animation-delay:0.3s]" />
          <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-ping [animation-delay:0.6s]" />
        </div>
      </div>
    </div>
  );
}