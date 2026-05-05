'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface FeedbackModalProps {
  onClose: () => void;
  username: string;
}

export default function FeedbackModal({ onClose, username }: FeedbackModalProps) {
  const [evaluacion, setEvaluacion] = useState<'POSITIVA' | 'NEGATIVA' | null>(null);
  const [comentario, setComentario] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [completado, setCompletado] = useState(false);

  const enviarReporte = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evaluacion) return;
    
    setEnviando(true);

    try {
      const { error } = await supabase
        .from('telemetria_feedback')
        .insert([{ 
          username, 
          evaluacion, 
          comentario: comentario.trim() || 'SIN_COMENTARIOS' 
        }]);

      if (error) throw error;
      
      setCompletado(true);
      setTimeout(onClose, 2500); // Cierra automáticamente tras el éxito
    } catch (err) {
      console.error("> Error al enviar telemetría:", err);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[700] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 select-none font-mono">
      <div className="relative w-full max-w-md bg-black border border-cyan-500/30 p-1 shadow-[0_0_50px_rgba(6,182,212,0.15)]">
        
        {/* Esquinas */}
        <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-cyan-400" />
        <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-cyan-400" />
        <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-cyan-400" />
        <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-cyan-400" />

        <div className="border border-cyan-900/50 p-6 bg-zinc-950/80">
          
          <div className="flex justify-between items-start mb-6 border-b border-cyan-900/50 pb-4">
            <div>
              <h2 className="text-xl font-bold text-cyan-400 uppercase tracking-widest drop-shadow-md">
                Reporte de Enlace
              </h2>
              <p className="text-[9px] text-zinc-500 uppercase tracking-[0.2em] mt-1">
                Transmisión directa al núcleo
              </p>
            </div>
            {!completado && (
              <button onClick={onClose} className="text-[10px] text-red-500 border border-red-900/50 px-2 py-1 hover:bg-red-500 hover:text-black transition-colors">
                [ X ]
              </button>
            )}
          </div>

          {completado ? (
            <div className="py-10 text-center animate-pulse">
              <span className="text-green-500 text-2xl mb-2 block">✓</span>
              <p className="text-cyan-400 text-xs tracking-widest uppercase">Paquete de datos encriptado y transmitido.</p>
            </div>
          ) : (
            <form onSubmit={enviarReporte} className="space-y-6">
              
              {/* Selector Binario */}
              <div className="space-y-2">
                <label className="block text-[10px] text-zinc-400 uppercase tracking-widest">Estabilidad de la experiencia</label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setEvaluacion('POSITIVA')}
                    className={`flex-1 py-3 border text-xs font-bold tracking-widest uppercase transition-all ${
                      evaluacion === 'POSITIVA' ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.3)]' : 'bg-black/50 border-zinc-800 text-zinc-600 hover:border-cyan-900'
                    }`}
                  >
                    ÓPTIMA
                  </button>
                  <button
                    type="button"
                    onClick={() => setEvaluacion('NEGATIVA')}
                    className={`flex-1 py-3 border text-xs font-bold tracking-widest uppercase transition-all ${
                      evaluacion === 'NEGATIVA' ? 'bg-red-500/20 border-red-500 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'bg-black/50 border-zinc-800 text-zinc-600 hover:border-red-900'
                    }`}
                  >
                    INESTABLE
                  </button>
                </div>
              </div>

              {/* Área de Texto */}
              <div className="space-y-2">
                <label className="block text-[10px] text-zinc-400 uppercase tracking-widest">Registros adicionales (Opcional)</label>
                <textarea
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  maxLength={150}
                  rows={3}
                  className="w-full bg-black/40 border border-cyan-900/40 p-3 text-xs text-zinc-300 focus:outline-none focus:border-cyan-500/80 transition-all resize-none custom-scrollbar"
                  placeholder="ANOMALÍAS DETECTADAS, SUGERENCIAS..."
                />
                <div className="text-right text-[9px] text-zinc-600">
                  {comentario.length}/150
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={!evaluacion || enviando}
                className="w-full py-3 bg-cyan-500/10 border border-cyan-500/60 text-cyan-300 text-[11px] font-bold tracking-[0.3em] uppercase hover:bg-cyan-500 hover:text-black transition-all disabled:opacity-30 disabled:hover:bg-cyan-500/10 disabled:hover:text-cyan-300"
              >
                {enviando ? 'TRANSMITIENDO...' : '[ ENVIAR REPORTE AL NÚCLEO ]'}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}