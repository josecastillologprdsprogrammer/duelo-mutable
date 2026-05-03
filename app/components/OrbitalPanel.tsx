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
    skillsActivas = {}, 
    procesarInteraccion, 
    score = 0 
  } = motor;

  // VERIFICACIÓN CONSTANTE DEL MOTOR (Para depuración)
  // console.log(`[Panel ${idJugador}] Skills Activas:`, skillsActivas);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const ratio = size / 600; 

    const renderFrame = () => {
      // 1. Limpieza con rastro (Motion Blur)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'; // Ligeramente más oscuro
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const centerX = size / 2;
      const centerY = size / 2;

      // 2. Dibujo de Estructura Geométrica (Aristas)
      const seleccionados = seleccionadosRef.current || [];
      if (seleccionados.length > 1) {
        ctx.beginPath();
        
        // COLOR BASE DE LAS ARISTAS
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.8)';
        ctx.lineWidth = (esLocal ? 2.5 : 1.5) * ratio;
        ctx.shadowBlur = 10 * ratio;
        ctx.shadowColor = '#00e5ff';

        // ALTERACIÓN VISUAL: Si la Inversión Orbital (d2) está activa, las líneas se vuelven rojas
        if (skillsActivas['d2']) {
           ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)'; // Red-500
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

      // 3. Renderizado de Nodos (Mentes Orbitales)
      const nodos = nodosRef.current || [];
      nodos.forEach((nodo: any) => {
        const x = centerX + Math.cos(nodo.angulo) * nodo.anillo * ratio;
        const y = centerY + Math.sin(nodo.angulo) * nodo.anillo * ratio;
        
        ctx.beginPath();
        ctx.arc(x, y, (esLocal ? 5 : 3.5) * ratio, 0, Math.PI * 2);
        
        const colorNodo = nodo.color || '#6366f1';
        ctx.fillStyle = colorNodo;
        
        const estaSel = seleccionados.some((s: any) => s.id === nodo.id);
        
        if (estaSel) {
          ctx.shadowBlur = 15 * ratio;
          ctx.shadowColor = skillsActivas['d2'] ? '#ef4444' : '#00e5ff'; // Brillo rojo si está invertido
          ctx.fillStyle = '#ffffff'; 
        }

        ctx.fill();
        ctx.shadowBlur = 0;
      });

      animationFrameId = requestAnimationFrame(renderFrame);
    };

    renderFrame();
    return () => cancelAnimationFrame(animationFrameId);
  }, [size, idJugador, esLocal, skillsActivas]); // Añadimos skillsActivas a las dependencias para que el render reaccione

  // --- DEFINICIÓN DE CAPAS VISUALES (OVERLAYS) ---
  const isCegado = skillsActivas['d1'];
  const isEscudado = skillsActivas['b4'];
  const isColapso = skillsActivas['d3'];
  const isBloqueado = skillsActivas['d4'];
  const isAcelerado = skillsActivas['d5'];

  return (
    <div className={`relative flex flex-col items-center transition-all duration-1000 
      ${esLocal ? 'z-10' : 'opacity-80 scale-95'}`}>
      
      {/* HEADER DEL PANEL */}
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

      {/* CONTENEDOR DEL RADAR Y CAPAS */}
      <div className={`relative p-2 border-2 transition-all duration-500 rounded-full bg-[#030303] overflow-hidden
        ${esLocal ? 'border-zinc-800 shadow-[0_0_40px_rgba(0,0,0,0.8)]' : 'border-zinc-900/50'}`}>
        
        {/* EL CANVAS (El Juego Base) */}
        <canvas
          ref={canvasRef}
          width={size}
          height={size}
          onClick={(e) => {
            if (!esLocal || isBloqueado) return; // Si hay "Bloqueo Neural" (d4), no puede cliquear
            const rect = canvasRef.current!.getBoundingClientRect();
            procesarInteraccion(
              e.clientX - rect.left, 
              e.clientY - rect.top, 
              size / 2, 
              size / 2
            );
          }}
          className={`rounded-full transition-opacity z-10 relative 
            ${esLocal && !isBloqueado ? 'cursor-crosshair' : 'cursor-not-allowed'}`}
        />
        
        {/* === INYECCIÓN DE FEEDBACK VISUAL BASADO EN ASSETS === */}

        {/* OVERLAY: CEGUERA DE RED (d1) - Mancha de estática / Oscurecimiento */}
        {isCegado && (
          <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none mix-blend-color-dodge opacity-80 transition-opacity">
            <img src="/skills/d1.png" alt="Ceguera" className="w-[80%] h-[80%] object-contain animate-pulse blur-sm" />
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" /> {/* El verdadero efecto ceguera */}
          </div>
        )}

        {/* OVERLAY: ESCUDO ESTRUCTURAL (b4) - Campo de fuerza verde */}
        {isEscudado && (
          <div className="absolute inset-0 z-20 pointer-events-none">
            <div className="absolute inset-0 border-4 border-green-500 rounded-full animate-ping opacity-20" />
            <img src="/skills/b4.png" alt="Escudo" className="absolute inset-0 w-full h-full object-cover opacity-10 mix-blend-screen animate-[spin_10s_linear_infinite]" />
          </div>
        )}

        {/* OVERLAY: COLAPSO GRAVITATORIO (d3) - Agujero Negro Central */}
        {isColapso && (
          <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
            <img src="/skills/d3.png" alt="Colapso" className="w-1/2 h-1/2 object-contain mix-blend-screen animate-[spin_2s_linear_infinite]" />
          </div>
        )}

        {/* OVERLAY: BLOQUEO NEURAL (d4) - Candado Rojo / Fallo de Sistema */}
        {isBloqueado && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-red-900/20 backdrop-blur-[1px] pointer-events-none">
            <img src="/skills/d4.png" alt="Bloqueo" className="w-1/3 h-1/3 object-contain opacity-80 animate-bounce" />
          </div>
        )}

        {/* OVERLAY: CAOS CINÉTICO (d5) - Relámpagos de velocidad */}
        {isAcelerado && (
          <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
            <img src="/skills/d5.png" alt="Caos" className="w-[90%] h-[90%] object-contain opacity-15 mix-blend-screen animate-[spin_1s_linear_infinite]" />
            <div className="absolute inset-0 border-[6px] border-orange-500 rounded-full animate-pulse opacity-50" />
          </div>
        )}

        {/* Borde exterior decorativo constante */}
        <div className="absolute inset-0 border-[3px] border-white/5 rounded-full pointer-events-none scale-[1.02]" />
      </div>

      {/* BARRA DE PROGRESO INFERIOR (Solo para rivales) */}
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