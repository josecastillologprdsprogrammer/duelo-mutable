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
  
  // Extraemos lo necesario. Usamos referencias del motor para que el render sea fluido
  const { 
    nodosRef, 
    seleccionadosRef, 
    skillsActivas = {}, // Valor por defecto para evitar errores de undefined
    procesarInteraccion, 
    score = 0 
  } = motor;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const ratio = size / 600; 

    const renderFrame = () => {
      // 1. Limpieza con rastro (Motion Blur)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const centerX = size / 2;
      const centerY = size / 2;

      // 2. Dibujo de Estructura Geométrica (Aristas)
      const seleccionados = seleccionadosRef.current || [];
      if (seleccionados.length > 1) {
        ctx.beginPath();
        
        // Efecto visual: Si la skill FLARE (d1) está activa, las líneas se vuelven casi invisibles
        ctx.strokeStyle = skillsActivas['d1'] ? 'rgba(255,255,255,0.05)' : 'rgba(0, 229, 255, 0.8)';
        ctx.lineWidth = (esLocal ? 2.5 : 1.5) * ratio;
        
        // Brillo de las líneas
        ctx.shadowBlur = skillsActivas['d1'] ? 0 : 10 * ratio;
        ctx.shadowColor = '#00e5ff';

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

      // 3. Renderizado de Nodos (Mentes Orbitales)
      const nodos = nodosRef.current || [];
      nodos.forEach((nodo: any) => {
        const x = centerX + Math.cos(nodo.angulo) * nodo.anillo * ratio;
        const y = centerY + Math.sin(nodo.angulo) * nodo.anillo * ratio;
        
        ctx.beginPath();
        ctx.arc(x, y, (esLocal ? 5 : 3.5) * ratio, 0, Math.PI * 2);
        
        // Mecánica GHOST (d4): Los nodos se vuelven semi-transparentes
        const opacidadBase = skillsActivas['d4'] ? 0.15 : 1;
        ctx.globalAlpha = opacidadBase;
        
        const colorNodo = nodo.color || '#6366f1';
        ctx.fillStyle = colorNodo;
        
        const estaSel = seleccionados.some((s: any) => s.id === nodo.id);
        
        if (estaSel) {
          ctx.shadowBlur = 15 * ratio;
          ctx.shadowColor = '#00e5ff';
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
    
    // IMPORTANTE: Mantenemos las dependencias estables. 
    // Usamos idJugador como "llave" para que React no se confunda entre paneles.
  }, [size, idJugador, esLocal]); 

  return (
    <div className={`relative flex flex-col items-center transition-all duration-1000 
      ${esLocal ? 'z-10' : 'opacity-70 grayscale-[0.3] scale-95'}`}>
      
      <div className="w-full flex justify-between mb-1 font-mono border-b border-zinc-900 pb-1 px-1">
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${esLocal ? 'bg-yellow-500' : 'bg-zinc-600'}`} />
          <span className={`text-[9px] uppercase font-bold tracking-tighter ${esLocal ? 'text-zinc-200' : 'text-zinc-500'}`}>
            {esLocal ? 'SYSTEM_LOCAL' : idJugador}
          </span>
        </div>
        <span className="text-[9px] text-cyan-500 font-bold tabular-nums">
          {score.toLocaleString()} PTS
        </span>
      </div>

      <div className={`relative p-1 border transition-all duration-500 rounded-full
        ${esLocal ? 'border-zinc-700 bg-zinc-900/10 shadow-[0_0_30px_rgba(0,0,0,0.5)]' : 'border-zinc-900 bg-black/40'}`}>
        
        <canvas
          ref={canvasRef}
          width={size}
          height={size}
          onClick={(e) => {
            if (!esLocal) return;
            const rect = canvasRef.current!.getBoundingClientRect();
            procesarInteraccion(
              e.clientX - rect.left, 
              e.clientY - rect.top, 
              size / 2, 
              size / 2
            );
          }}
          className={`rounded-full transition-opacity ${esLocal ? 'cursor-crosshair' : 'cursor-default'}`}
          style={{ backgroundColor: '#030303' }}
        />
        
        {skillsActivas['d1'] && (
          <div className="absolute inset-0 bg-white/30 rounded-full animate-pulse pointer-events-none backdrop-blur-[1px]" />
        )}

        <div className="absolute inset-0 border border-white/5 rounded-full pointer-events-none scale-105" />
      </div>

      {!esLocal && (
        <div className="mt-1 w-full flex justify-center gap-4 px-2">
          <div className="h-0.5 w-full bg-zinc-900 rounded-full overflow-hidden">
            <div 
              className="h-full bg-cyan-900 transition-all duration-1000" 
              style={{ width: `${Math.min((score / 10000) * 100, 100)}%` }} 
            />
          </div>
        </div>
      )}
    </div>
  );
}