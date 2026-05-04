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
  // FILTRO DE PRESENTACIÓN Y CORTAFUEGOS (SHIELD BLOCKER)
  // ============================================================================
  const efectosVisibles: Record<string, boolean> = {};
  
  // Verificamos si el jugador actual (local o rival) tiene el escudo activo
  const tieneEscudo = !!propSkills['b4'] || !!motor.skillsActivas?.['b4'];

  if (esLocal) {
    // 1. Mis Buffos siempre se muestran
    Object.keys(propSkills).forEach(id => { if (id.startsWith('b')) efectosVisibles[id] = true; });

    // 2. Si NO tengo el escudo, sufro los Debuffos
    if (!tieneEscudo) {
      Object.keys(debuffsEnemigos).forEach(id => { efectosVisibles[id] = true; });
      Object.keys(propSkills).forEach(id => { if (id.startsWith('d')) efectosVisibles[id] = true; });
    }
  } else {
    // 1. Buffos del Rival siempre se muestran
    Object.keys(propSkills).forEach(id => { if (id.startsWith('b')) efectosVisibles[id] = true; });
    Object.keys(motor.skillsActivas || {}).forEach(id => { if (id.startsWith('b')) efectosVisibles[id] = true; });

    // 2. Si el Rival NO tiene escudo, sufre los Debuffos
    if (!tieneEscudo) {
      Object.keys(motor.skillsActivas || {}).forEach(id => { if (id.startsWith('d')) efectosVisibles[id] = true; });
      Object.keys(debuffsEnemigos).forEach(id => { efectosVisibles[id] = true; });
      // Limpiamos sabotajes que ellos lanzaron (fuego amigo visual)
      Object.keys(propSkills).forEach(id => { if (id.startsWith('d')) delete efectosVisibles[id]; });
    }
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
          <>
            {/* Neblina Pesada y Pulsante */}
            <div className="absolute inset-0 z-40 bg-zinc-400/20 backdrop-blur-lg rounded-full animate-[pulse_2s_ease-in-out_infinite] pointer-events-none" />
            {/* Ojo Transparente */}
            <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none mix-blend-screen">
              <img src="/skills/d1.png" alt="Flare" className="w-[80%] h-[80%] object-contain animate-pulse opacity-80" />
            </div>
          </>
        )}
        {isColapso && (
          <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none mix-blend-screen">
            <img src="/skills/d3.png" alt="Void" className="w-1/2 h-1/2 object-contain animate-[spin_2s_linear_infinite]" />
          </div>
        )}
        {isBloqueado && (
          <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none mix-blend-screen">
            <div className="absolute inset-0 bg-red-900/20 backdrop-blur-[1px] mix-blend-normal" />
            <img src="/skills/d4.png" alt="Ghost" className="w-1/3 h-1/3 object-contain opacity-80 animate-bounce" />
          </div>
        )}
        {isAcelerado && (
          <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none mix-blend-screen">
            <div className="absolute inset-0 border-[6px] border-orange-500 rounded-full animate-pulse opacity-50 mix-blend-normal" />
            <img src="/skills/d5.png" alt="Overload" className="w-[90%] h-[90%] object-contain opacity-40 animate-[spin_1s_linear_infinite]" />
          </div>
        )}

        {/* --- CAPA DE BUFFS --- */}
        {isChronos && (
          <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none mix-blend-screen opacity-30">
            <img src="/skills/b1.png" alt="Chronos" className="w-[80%] h-[80%] object-contain animate-[pulse_4s_ease-in-out_infinite]" />
          </div>
        )}
        {isMagnetar && (
          <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none mix-blend-screen opacity-40">
            <div className="absolute inset-0 border-2 border-blue-500 rounded-full animate-ping opacity-30 mix-blend-normal" />
            <img src="/skills/b2.png" alt="Magnetar" className="w-[60%] h-[60%] object-contain animate-[spin_8s_linear_infinite_reverse]" />
          </div>
        )}
        {isDouble && (
          <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none mix-blend-screen opacity-40">
            <img src="/skills/b3.png" alt="Double" className="w-[70%] h-[70%] object-contain animate-pulse" />
          </div>
        )}
        {isShield && (
          <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none mix-blend-screen">
            <div className="absolute inset-0 border-4 border-purple-500 rounded-full animate-ping opacity-20 mix-blend-normal" />
            <img src="/skills/b4.png" alt="Shield" className="absolute inset-0 w-full h-full object-cover opacity-20 animate-[spin_10s_linear_infinite]" />
          </div>
        )}
        {isRegen && (
          <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none mix-blend-screen opacity-30">
            <img src="/skills/b5.png" alt="Regen" className="w-[80%] h-[80%] object-contain animate-bounce" />
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