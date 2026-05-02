'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface AccessModalProps {
  onAccessGranted: (userData: { id: string; username: string; slot: number; roomCode: string }) => void;
}

// --- UTILIDAD: GENERACIÓN DE IDENTIFICADOR SEGURO ---
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
      onAccessGranted(JSON.parse(sessionSaved));
    }
  }, [onAccessGranted]);

  const generarCodigo = () => Math.random().toString(36).substring(2, 8).toUpperCase();

  const handleAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) return;
    setLoading(true);
    setError(null);

    try {
      let finalCode = roomCode.trim().toUpperCase();
      let isCreating = !finalCode;

      if (isCreating) finalCode = generarCodigo();

      const { data: sala, error: fetchError } = await supabase
        .from('salas')
        .select('*')
        .eq('codigo_sala', finalCode)
        .maybeSingle();

      if (fetchError) throw fetchError;

      let myId = generarUUID();
      let updatedJugadores = [];
      let mySlot = 1;

      if (!sala) {
        mySlot = 1;
        updatedJugadores = [{ id: myId, username, slot: mySlot, listo: true }];
        
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
          (p: any) => p.username.toLowerCase() === username.toLowerCase()
        );

        if (pilotoExistente) {
          myId = pilotoExistente.id;
          mySlot = pilotoExistente.slot;
          updatedJugadores = jugadoresActuales;
        } else {
          if (jugadoresActuales.length >= 4) throw new Error('SALA_COMPLETA');
          
          mySlot = jugadoresActuales.length + 1;
          updatedJugadores = [...jugadoresActuales, { id: myId, username, slot: mySlot, listo: true }];

          const { error: updateError } = await supabase
            .from('salas')
            .update({ jugadores: updatedJugadores })
            .eq('codigo_sala', finalCode);

          if (updateError) throw updateError;
        }
      }

      const sessionData = { id: myId, username, slot: mySlot, roomCode: finalCode };
      localStorage.setItem('A316_SESSION', JSON.stringify(sessionData));
      onAccessGranted(sessionData);

    } catch (err: any) {
      console.error("Fallo de enlace:", err);
      setError(err.message === 'SALA_COMPLETA' ? 'SALA_LLENA_CAPACIDAD_MAX' : 'ERROR_DE_ENLACE_RSD');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[#050505] text-white select-none">
      
      {/* --- CAPA 1: FONDO ESTRUCTURAL (REEMPLAZO DE VIDEO) --- */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-black via-zinc-950 to-cyan-950/20" />

      {/* --- CAPA 2: OVERLAY DE CONTRASTE --- */}
      <div className="absolute inset-0 z-10 bg-black/40 backdrop-blur-[1px]" />

      {/* --- CAPA 3: PANEL DE AUTENTICACIÓN --- */}
      <div className="relative z-20 w-full max-w-sm border border-zinc-800 bg-black/60 backdrop-blur-md p-8 shadow-[0_0_50px_rgba(6,182,212,0.1)]">
        
        <div className="mb-8 text-center border-b border-zinc-800 pb-6">
          <h2 className="font-mono text-xl font-bold tracking-tighter text-cyan-500 drop-shadow-[0_0_10px_rgba(6,182,212,0.5)] uppercase">
            Ingreso de Piloto
          </h2>
          <p className="font-mono text-[9px] text-zinc-400 mt-2 tracking-widest uppercase">
            Protocolo de Acceso Neural A316
          </p>
        </div>

        <form onSubmit={handleAccess} className="space-y-6">
          <div>
            <label className="block font-mono text-[9px] text-zinc-500 mb-2 uppercase">Identificador_Piloto</label>
            <input
              required
              autoFocus
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-zinc-950/80 border border-zinc-800 p-3 font-mono text-sm text-cyan-400 focus:outline-none focus:border-cyan-500/50 transition-colors"
              placeholder="USUARIO"
            />
          </div>

          <div>
            <label className="block font-mono text-[9px] text-zinc-500 mb-2 uppercase">Código_De_Enlace (Opcional)</label>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              className="w-full bg-zinc-950/80 border border-zinc-800 p-3 font-mono text-sm text-white focus:outline-none focus:border-zinc-700 transition-colors uppercase"
              placeholder="VACÍO PARA CREAR"
            />
          </div>

          {error && (
            <div className="h-6">
              <p className="font-mono text-[10px] text-red-500 text-center uppercase tracking-tighter animate-pulse"> 
                {">"} {error} 
              </p>
            </div>
          )}

          <button
            disabled={loading || !username}
            className="w-full py-4 bg-zinc-900/80 border border-zinc-700 text-cyan-500 font-mono text-xs font-bold uppercase hover:bg-cyan-500 hover:text-black transition-all disabled:opacity-20 disabled:hover:bg-zinc-900/80 disabled:hover:text-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.1)] hover:shadow-[0_0_20px_rgba(6,182,212,0.4)]"
          >
            {loading ? 'ESTABLECIENDO...' : roomCode ? 'UNIRSE A SALA' : 'CREAR NUEVA SALA'}
          </button>
        </form>

      </div>
    </div>
  );
}