'use client';
import { useEffect, useRef } from 'react';
import { obtenerCoords } from '@/lib/puzzleEngine';

interface PanelProps {
  idJugador: string;
  esLocal?: boolean;
  size: number;
  motor: any; 
}

export default function OrbitalPanel({ idJugador, esLocal = false, size, motor }: PanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const { 
    nodosRef, 
    seleccionadosRef, 
    skillsActivas: propSkills = {}, 
    debuffsEnemigos = {}, 
    procesarInteraccion, 
    score = 0 
  } = motor;

  // ============================================================================
  // FILTRO ARQUITECTÓNICO DE PRESENTACIÓN: Aislamiento estricto de efectos
  // ============================================================================
  const efectosVisibles: Record<string, boolean> = {};

  if (esLocal) {
    Object.keys(propSkills).forEach(id => { if (id.startsWith('b')) efectosVisibles[id] = true; });
    Object.keys(debuffsEnemigos).forEach(id => { efectosVisibles[id] = true; });
  } else {
    Object.keys(propSkills).forEach(id => { if (id.startsWith('b')) efectosVisibles[id] = true; });
    Object.keys(motor.skillsActivas || {}).forEach(id => { if (id.startsWith('d')) efectosVisibles[id] = true; });
    Object.keys(debuffsEnemigos).forEach(id => { efectosVisibles[id] = true; });
    Object.keys(propSkills).forEach(id => { if (id.startsWith('d')) delete efectosVisibles[id]; });
  }

  // --- MAPEO DE ESTADOS VISUALES ---
  const isCegado = efectosVisibles['d1'];
  const isInvertido = efectosVisibles['d2'];
  const isColapso = efectosVisibles['d3'];
  const isBloqueado = efectosVisibles['d4'];
  const isAcelerado = efectosVisibles['d5'];

  const isChronos = efectosVisibles['b1'];
  const isMagnetar = efectosVisibles['b2'];
  const isDouble = efectosVisibles['b3'];
  const isShield = efectosVisibles['b4'];
  const isRegen = efectosVisibles['b5'];

  // ============================================================================
  // MOTOR DE RENDERIZADO CANVAS (FÍSICAS, LÍNEAS Y TRANSPARENCIA AVANZADA)
  // ============================================================================
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const ratio = size / 600; 

    const renderFrame = () => {
      // TÉCNICA DE MOTION BLUR TRANSPARENTE: 
      // Borra el frame anterior progresivamente hacia la transparencia, no hacia el negro.
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)'; // El alfa controla la longitud de la estela
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Restaurar el modo de dibujo normal para las líneas y nodos
      ctx.globalCompositeOperation = 'source-over';
      
      const centerX = size / 2;
      const centerY = size / 2;

      const seleccionados = seleccionadosRef.current || [];
      if (seleccionados.length > 1) {
        ctx.beginPath();
        
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.8)';
        ctx.lineWidth = (esLocal ? 2.5 : 1.5) * ratio;
        ctx.shadowBlur = 10 * ratio;
        ctx.shadowColor = '#00e5ff';

        if (isInvertido) {
           ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)'; 
           ctx.shadowColor = '#ef4444';
        }

        seleccionados.forEach((n: any, i: number) => {
          const p = obtenerCoords(n, 0, 0); 
          const x = centerX + p.x * ratio;
          const y = centerY + p.y * ratio;
          if (i === 0) ctx.moveTo(x, y); 
          else ctx.lineTo(x, y);
        });

        if (seleccionados.length >= 3) ctx.closePath();
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      const nodos = nodosRef.current || [];
      nodos.forEach((nodo: any) => {
        const x = centerX + Math.cos(nodo.angulo) * nodo.anillo * ratio;
        const y = centerY + Math.sin(nodo.angulo) * nodo.anillo * ratio;
        
        ctx.beginPath();
        ctx.arc(x, y, (esLocal ? 5 : 3.5) * ratio, 0, Math.PI * 2);
        
        ctx.globalAlpha = isBloqueado ? 0.15 : 1;
        
        const colorNodo = nodo.color || '#6366f1';
        ctx.fillStyle = colorNodo;
        
        const estaSel = seleccionados.some((s: any) => s.id === nodo.id);
        if (estaSel) {
          ctx.shadowBlur = 15 * ratio;
          ctx.shadowColor = isInvertido ? '#ef4444' : '#00e5ff'; 
          ctx.fillStyle = '#ffffff'; 
        }

        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1; 
      });

      animationFrameId = requestAnimationFrame(renderFrame);
    };

    renderFrame();
    return () => cancelAnimationFrame(animationFrameId);
  }, [size, esLocal, isInvertido, isBloqueado]); 

  // ============================================================================
  // ESTRUCTURA DOM Y OVERLAYS (CAPAS)
  // ============================================================================
  return (
    <div className={`relative flex flex-col items-center transition-all duration-1000 
      ${esLocal ? 'z-10' : 'opacity-80 scale-95'}`}>
      
      {/* TELEMETRÍA SUPERIOR */}
      <div className="w-full flex justify-between mb-2 font-mono border-b border-zinc-900 pb-1 px-1">
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${esLocal ? 'bg-yellow-500' : 'bg-red-500'}`} />
          <span className={`text-[10px] uppercase font-bold tracking-tighter ${esLocal ? 'text-zinc-200' : 'text-zinc-400'}`}>
            {esLocal ? 'SYSTEM_LOCAL' : idJugador}
          </span>
        </div>
        <span className={`text-[10px] font-bold tabular-nums ${esLocal ? 'text-cyan-500' : 'text-zinc-500'}`}>
          {score.toLocaleString()} PTS
        </span>
      </div>

      {/* CONTENEDOR DEL RADAR Y FILTROS VISUALES */}
      <div className={`relative p-2 border-2 transition-all duration-500 rounded-full bg-black overflow-hidden
        ${esLocal ? 'border-zinc-800 shadow-[0_0_40px_rgba(0,0,0,0.8)]' : 'border-zinc-900/50'}
        ${isDouble ? 'border-yellow-500/50 shadow-[0_0_50px_rgba(234,179,8,0.2)]' : ''}
        ${isRegen ? 'border-pink-500/30' : ''}
      `}>
        
        {/* --- CAPA 0: FONDO DE ENTORNO (Radar/Grid/Espacio) --- */}
        <img 
          src="/bg.png" 
          alt="Entorno Orbital" 
          className="absolute inset-0 w-full h-full object-cover z-0 opacity-40 pointer-events-none mix-blend-screen"
        />

        {/* --- CAPA 10: NÚCLEO FÍSICO (CANVAS TRANSPARENTE) --- */}
        <canvas
          ref={canvasRef}
          width={size}
          height={size}
          onClick={(e) => {
            if (!esLocal || isBloqueado) return; 
            const rect = canvasRef.current!.getBoundingClientRect();
            procesarInteraccion(e.clientX - rect.left, e.clientY - rect.top, size / 2, size / 2);
          }}
          className={`rounded-full transition-opacity z-10 relative 
            ${esLocal && !isBloqueado ? 'cursor-crosshair' : 'cursor-not-allowed'}`}
        />
        
        {/* --- CAPA 20+: DEBUFFS ENEMIGOS (Armamento de Sabotaje) --- */}
        {isCegado && (
          <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none mix-blend-color-dodge opacity-80 transition-opacity">
            <img src="/skills/d1.png" alt="Ceguera" className="w-[80%] h-[80%] object-contain animate-pulse blur-sm" />
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          </div>
        )}
        {isColapso && (
          <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
            <img src="/skills/d3.png" alt="Colapso" className="w-1/2 h-1/2 object-contain mix-blend-screen animate-[spin_2s_linear_infinite]" />
          </div>
        )}
        {isBloqueado && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-red-900/20 backdrop-blur-[1px] pointer-events-none">
            <img src="/skills/d4.png" alt="Bloqueo" className="w-1/3 h-1/3 object-contain opacity-80 animate-bounce" />
          </div>
        )}
        {isAcelerado && (
          <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
            <img src="/skills/d5.png" alt="Caos" className="w-[90%] h-[90%] object-contain opacity-15 mix-blend-screen animate-[spin_1s_linear_infinite]" />
            <div className="absolute inset-0 border-[6px] border-orange-500 rounded-full animate-pulse opacity-50" />
          </div>
        )}

        {/* --- CAPA 20+: BUFFS ACTIVOS (Sistemas de Apoyo) --- */}
        {isChronos && (
          <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center opacity-10">
            <img src="/skills/b1.png" alt="Chronos" className="w-[80%] h-[80%] object-contain mix-blend-screen animate-[pulse_4s_ease-in-out_infinite]" />
          </div>
        )}
        {isMagnetar && (
          <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center opacity-15">
            <div className="absolute inset-0 border-2 border-blue-500 rounded-full animate-ping opacity-30" />
            <img src="/skills/b2.png" alt="Magnetar" className="w-[60%] h-[60%] object-contain mix-blend-screen animate-[spin_8s_linear_infinite_reverse]" />
          </div>
        )}
        {isDouble && (
          <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center opacity-15">
            <img src="/skills/b3.png" alt="Double" className="w-[70%] h-[70%] object-contain mix-blend-screen animate-pulse" />
          </div>
        )}
        {isShield && (
          <div className="absolute inset-0 z-20 pointer-events-none">
            <div className="absolute inset-0 border-4 border-purple-500 rounded-full animate-ping opacity-20" />
            <img src="/skills/b4.png" alt="Escudo" className="absolute inset-0 w-full h-full object-cover opacity-10 mix-blend-screen animate-[spin_10s_linear_infinite]" />
          </div>
        )}
        {isRegen && (
          <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center opacity-10">
            <img src="/skills/b5.png" alt="Regen" className="w-[80%] h-[80%] object-contain mix-blend-screen animate-bounce" />
            <div className="absolute inset-0 bg-pink-500/5 mix-blend-screen" />
          </div>
        )}

        {/* HUD BASE (Anillo exterior decorativo) */}
        <div className="absolute inset-0 border-[3px] border-white/5 rounded-full pointer-events-none scale-[1.02] z-30" />
      </div>

      {/* BARRA DE PROGRESO DE EXTRACCIÓN (Rivales) */}
      {!esLocal && (
        <div className="mt-3 w-full flex justify-center px-4">
          <div className="h-1 w-full bg-zinc-900 overflow-hidden shadow-[0_0_10px_rgba(0,0,0,0.5)]">
            <div 
              className="h-full bg-cyan-800 transition-all duration-1000" 
              style={{ width: `${Math.min((score / 10000) * 100, 100)}%` }} 
            />
          </div>
        </div>
      )}
    </div>
  );
}