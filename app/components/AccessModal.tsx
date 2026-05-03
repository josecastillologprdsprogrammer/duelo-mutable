'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface AccessModalProps {
  onAccessGranted: (userData: { id: string; username: string; slot: number; roomCode: string }) => void;
}

// --- UTILIDAD: GENERACIÓN DE IDENTIFICADOR ÚNICO DE SESIÓN ---
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

  // Verificación de sesión persistente para reconexión automática
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

      // 1. Intentar localizar la sala en la red de Supabase
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
        // CASO A: CREAR NUEVA MATRIZ (SALA)
        mySlot = 1;
        // CORRECCIÓN ARQUITECTÓNICA: Estado pasivo por defecto
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
        // CASO B: UNIRSE A ENLACE EXISTENTE
        const jugadoresActuales = sala.jugadores || [];
        
        // Verificar si el piloto ya estaba en esta sala (reconexión)
        const pilotoExistente = jugadoresActuales.find(
          (p: any) => p.username.toUpperCase() === cleanUsername
        );

        if (pilotoExistente) {
          myId = pilotoExistente.id;
          mySlot = pilotoExistente.slot;
        } else {
          // Validar capacidad de la escuadra
          if (jugadoresActuales.length >= 4) {
            throw new Error('SALA_LLENA');
          }
          
          mySlot = jugadoresActuales.length + 1;
          // CORRECCIÓN ARQUITECTÓNICA: Estado pasivo por defecto
          updatedJugadores = [...jugadoresActuales, { id: myId, username: cleanUsername, slot: mySlot, listo: false }];

          const { error: updateError } = await supabase
            .from('salas')
            .update({ jugadores: updatedJugadores })
            .eq('codigo_sala', finalCode);

          if (updateError) throw updateError;
        }
      }

      // 2. Establecer sesión local y conceder acceso
      const sessionData = { id: myId, username: cleanUsername, slot: mySlot, roomCode: finalCode };
      localStorage.setItem('A316_SESSION', JSON.stringify(sessionData));
      onAccessGranted(sessionData);

    } catch (err: any) {
      console.error("Fallo de enlace neural:", err);
      if (err.message === 'SALA_LLENA') {
        setError('SALA_AL_MÁXIMO_DE_CAPACIDAD');
      } else {
        setError('ERROR_DE_ENLACE_RSD_V4');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[#050505] text-white select-none">
      
      {/* FONDO ESTRUCTURAL */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-black via-zinc-950 to-cyan-950/20" />
      <div className="absolute inset-0 z-10 bg-black/40 backdrop-blur-[1px]" />

      {/* PANEL DE CONTROL */}
      <div className="relative z-20 w-full max-w-sm border border-zinc-800 bg-black/60 backdrop-blur-md p-8 shadow-[0_0_50px_rgba(6,182,212,0.1)]">
        
        <div className="mb-8 text-center border-b border-zinc-800 pb-6">
          <h2 className="font-mono text-xl font-bold tracking-tighter text-cyan-500 drop-shadow-[0_0_10px_rgba(6,182,212,0.5)] uppercase">
            Identificación de Piloto
          </h2>
          <p className="font-mono text-[9px] text-zinc-400 mt-2 tracking-widest uppercase">
            Sistema de Acceso Público A316
          </p>
        </div>

        <form onSubmit={handleAccess} className="space-y-6">
          <div className="space-y-2">
            <label className="block font-mono text-[9px] text-zinc-500 uppercase tracking-widest">User_ID</label>
            <input
              required
              autoFocus
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-zinc-950/80 border border-zinc-800 p-3 font-mono text-sm text-cyan-400 focus:outline-none focus:border-cyan-500/50 transition-colors uppercase"
              placeholder="Escribe tu alias..."
              maxLength={12}
            />
          </div>

          <div className="space-y-2">
            <label className="block font-mono text-[9px] text-zinc-500 uppercase tracking-widest">Link_Code (Opcional)</label>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              className="w-full bg-zinc-950/80 border border-zinc-800 p-3 font-mono text-sm text-white focus:outline-none focus:border-zinc-700 transition-colors uppercase"
              placeholder="Código para unirse..."
              maxLength={6}
            />
          </div>

          {error && (
            <div className="py-2 bg-red-900/10 border border-red-900/50">
              <p className="font-mono text-[10px] text-red-500 text-center uppercase tracking-tighter animate-pulse"> 
                {">"} {error} 
              </p>
            </div>
          )}

          <button
            disabled={loading || !username}
            className="w-full py-4 bg-zinc-900/80 border border-zinc-700 text-cyan-500 font-mono text-xs font-bold uppercase hover:bg-cyan-500 hover:text-black transition-all disabled:opacity-20 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(6,182,212,0.1)] hover:shadow-[0_0_20px_rgba(6,182,212,0.4)]"
          >
            {loading ? 'ESTABLECIENDO ENLACE...' : roomCode ? 'VINCULAR A ESCUADRA' : 'INICIAR NUEVA MATRIZ'}
          </button>
        </form>

        <div className="mt-6 flex justify-center gap-4 opacity-30">
          <div className="w-1 h-1 bg-cyan-500 rounded-full animate-ping" />
          <div className="w-1 h-1 bg-cyan-500 rounded-full animate-ping [animation-delay:0.2s]" />
          <div className="w-1 h-1 bg-cyan-500 rounded-full animate-ping [animation-delay:0.4s]" />
        </div>
      </div>
    </div>
  );
}