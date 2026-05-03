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
  // FILTRO DE PRESENTACIÓN: Aislamiento de Buffs (Propios) y Debuffs (Recibidos)
  // ============================================================================
  const efectosVisibles: Record<string, boolean> = {};

  if (esLocal) {
    // Mi Panel: Buffs que yo lancé + Debuffs que otros me lanzaron
    Object.keys(propSkills).forEach(id => { if (id.startsWith('b')) efectosVisibles[id] = true; });
    Object.keys(debuffsEnemigos).forEach(id => { efectosVisibles[id] = true; });
  } else {
    // Panel Rival: Sus Buffs + Debuffs que sufren (enviados por mí u otros)
    Object.keys(propSkills).forEach(id => { if (id.startsWith('b')) efectosVisibles[id] = true; });
    Object.keys(motor.skillsActivas || {}).forEach(id => { if (id.startsWith('d')) efectosVisibles[id] = true; });
    Object.keys(debuffsEnemigos).forEach(id => { efectosVisibles[id] = true; });
    // Limpiamos sabotajes que ellos lanzaron (fuego amigo visual)
    Object.keys(propSkills).forEach(id => { if (id.startsWith('d')) delete efectosVisibles[id]; });
  }

  // Mapeo de estados para renderizado condicional
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
  // MOTOR CANVAS: Renderizado con Transparencia Progresiva
  // ============================================================================
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const ratio = size / 600; 

    const renderFrame = () => {
      // TÉCNICA AVANZADA: Borramos hacia la transparencia para ver el bg.png
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)'; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Volvemos a modo normal para dibujar líneas y nodos
      ctx.globalCompositeOperation = 'source-over';
      
      const centerX = size / 2;
      const centerY = size / 2;

      // 1. Dibujo de Conexiones (Polígonos)
      const seleccionados = seleccionadosRef.current || [];
      if (seleccionados.length > 1) {
        ctx.beginPath();
        ctx.strokeStyle = isInvertido ? 'rgba(239, 68, 68, 0.8)' : 'rgba(0, 229, 255, 0.8)';
        ctx.lineWidth = (esLocal ? 2.5 : 1.5) * ratio;
        ctx.shadowBlur = 10 * ratio;
        ctx.shadowColor = isInvertido ? '#ef4444' : '#00e5ff';

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

      // 2. Dibujo de Nodos
      const nodos = nodosRef.current || [];
      nodos.forEach((nodo: any) => {
        const x = centerX + Math.cos(nodo.angulo) * nodo.anillo * ratio;
        const y = centerY + Math.sin(nodo.angulo) * nodo.anillo * ratio;
        
        ctx.beginPath();
        ctx.arc(x, y, (esLocal ? 5 : 3.5) * ratio, 0, Math.PI * 2);
        
        // Efecto GHOST/Bloqueo
        ctx.globalAlpha = isBloqueado ? 0.2 : 1;
        
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
  }, [size, esLocal, isInvertido, isBloqueado, seleccionadosRef]); 

  // ============================================================================
  // ESTRUCTURA VISUAL (DOM + OVERLAYS)
  // ============================================================================
  return (
    <div className={`relative flex flex-col items-center transition-all duration-1000 
      ${esLocal ? 'z-10' : 'opacity-80 scale-95'}`}>
      
      {/* Telemetría Superior */}
      <div className="w-full flex justify-between mb-2 font-mono border-b border-zinc-900 pb-1 px-1">
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${esLocal ? 'bg-yellow-500' : 'bg-red-500'}`} />
          <span className={`text-[10px] uppercase font-bold tracking-tighter ${esLocal ? 'text-zinc-200' : 'text-zinc-400'}`}>
            {esLocal ? 'Puntaje Total' : idJugador}
          </span>
        </div>
        <span className={`text-[10px] font-bold tabular-nums ${esLocal ? 'text-cyan-500' : 'text-zinc-500'}`}>
          {score.toLocaleString()} PTS
        </span>
      </div>

      {/* Contenedor del Radar (Fondo transparente para ver bg.png de page.tsx) */}
      <div className={`relative p-2 border-2 transition-all duration-500 rounded-full bg-transparent overflow-hidden
        ${esLocal ? 'border-zinc-800 shadow-[0_0_40px_rgba(0,0,0,0.8)]' : 'border-zinc-900/50'}
        ${isDouble ? 'border-yellow-500/50 shadow-[0_0_50px_rgba(234,179,8,0.2)]' : ''}
        ${isRegen ? 'border-pink-500/30' : ''}
      `}>
        
        {/* Canvas de Juego */}
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
          style={{ backgroundColor: 'transparent' }}
        />
        
        {/* --- CAPA DE DEBUFFS --- */}
        {isCegado && (
          <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none mix-blend-color-dodge opacity-80 transition-opacity">
            <img src="/skills/d1.png" alt="" className="w-[80%] h-[80%] object-contain animate-pulse blur-sm" />
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          </div>
        )}
        {isColapso && (
          <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
            <img src="/skills/d3.png" alt="" className="w-1/2 h-1/2 object-contain mix-blend-screen animate-[spin_2s_linear_infinite]" />
          </div>
        )}
        {isBloqueado && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-red-900/20 backdrop-blur-[1px] pointer-events-none">
            <img src="/skills/d4.png" alt="" className="w-1/3 h-1/3 object-contain opacity-80 animate-bounce" />
          </div>
        )}
        {isAcelerado && (
          <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
            <img src="/skills/d5.png" alt="" className="w-[90%] h-[90%] object-contain opacity-15 mix-blend-screen animate-[spin_1s_linear_infinite]" />
            <div className="absolute inset-0 border-[6px] border-orange-500 rounded-full animate-pulse opacity-50" />
          </div>
        )}

        {/* --- CAPA DE BUFFS --- */}
        {isChronos && (
          <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center opacity-10">
            <img src="/skills/b1.png" alt="" className="w-[80%] h-[80%] object-contain mix-blend-screen animate-[pulse_4s_ease-in-out_infinite]" />
          </div>
        )}
        {isMagnetar && (
          <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center opacity-15">
            <div className="absolute inset-0 border-2 border-blue-500 rounded-full animate-ping opacity-30" />
            <img src="/skills/b2.png" alt="" className="w-[60%] h-[60%] object-contain mix-blend-screen animate-[spin_8s_linear_infinite_reverse]" />
          </div>
        )}
        {isDouble && (
          <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center opacity-15">
            <img src="/skills/b3.png" alt="" className="w-[70%] h-[70%] object-contain mix-blend-screen animate-pulse" />
          </div>
        )}
        {isShield && (
          <div className="absolute inset-0 z-20 pointer-events-none">
            <div className="absolute inset-0 border-4 border-purple-500 rounded-full animate-ping opacity-20" />
            <img src="/skills/b4.png" alt="" className="absolute inset-0 w-full h-full object-cover opacity-10 mix-blend-screen animate-[spin_10s_linear_infinite]" />
          </div>
        )}
        {isRegen && (
          <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center opacity-10">
            <img src="/skills/b5.png" alt="" className="w-[80%] h-[80%] object-contain mix-blend-screen animate-bounce" />
          </div>
        )}

        {/* Decoración HUD Base */}
        <div className="absolute inset-0 border-[3px] border-white/5 rounded-full pointer-events-none scale-[1.02] z-30" />
      </div>

      {/* Barra de Progreso (Rivales) */}
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