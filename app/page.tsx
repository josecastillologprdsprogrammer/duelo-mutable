'use client';

import { useState, useEffect } from 'react';
import OrbitalPanel from './components/OrbitalPanel'; 
import AccessModal from './components/AccessModal';
import { useMotorOrbital } from '../hooks/useMotorOrbital';
import { SKILLS_CATALOGO } from '../lib/skillsEngine';
import ResultsModal from './components/ResultsModal';

/**
 * COMPONENTE: SLOT DE HABILIDAD
 * Integración de assets gráficos y feedback de estado.
 */
function SkillSlot({ skill, desbloqueada, activa, esNueva, energia, onActivar }: any) {
  const puedePagar = energia >= skill.costo;
  const clickeable = desbloqueada && puedePagar && !activa;
  
  return (
    <div 
      onClick={() => clickeable && onActivar(skill.id)}
      className={`
        relative flex flex-col items-center justify-center w-20 h-20 border-2 transition-all duration-300 rounded-sm overflow-hidden bg-black
        ${desbloqueada ? 'opacity-100 scale-100' : 'opacity-40 scale-95 grayscale blur-[0.5px]'}
        ${esNueva ? 'animate-bounce border-white shadow-[0_0_20px_white] z-10' : 'border-zinc-800'}
        ${activa ? 'border-cyan-400 shadow-[0_0_15px_cyan]' : ''}
        ${clickeable ? 'cursor-pointer hover:border-cyan-500 hover:shadow-[0_0_10px_rgba(6,182,212,0.3)]' : 'cursor-default'}
      `}
    >
      <img 
        src={`/skills/${skill.id}.png`} 
        alt={skill.nombre}
        className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 
          ${activa ? 'opacity-100 mix-blend-screen' : 'opacity-60'}
        `}
      />
      <div className="absolute inset-0 z-10 flex flex-col justify-between p-1 bg-gradient-to-t from-black/90 via-black/20 to-black/70">
        <div className="flex justify-between w-full">
          <span className={`text-[10px] font-bold font-mono leading-none drop-shadow-md ${activa ? 'text-cyan-400' : 'text-white'}`}>
            [{skill.tecla.replace('Digit', '').replace('Key', '')}]
          </span>
          {desbloqueada && !activa && (
            <span className={`text-[10px] font-mono leading-none font-bold drop-shadow-md ${puedePagar ? 'text-yellow-500' : 'text-red-500'}`}>
              {skill.costo}E
            </span>
          )}
        </div>
        <span className={`text-[8px] uppercase text-center font-bold tracking-tighter leading-none mt-auto drop-shadow-md
          ${activa ? 'text-cyan-400' : 'text-zinc-300'}`}>
          {skill.nombre}
        </span>
      </div>
      {activa && (
        <div className="absolute inset-x-0 bottom-0 h-1.5 bg-cyan-400 animate-pulse z-20 shadow-[0_0_15px_cyan]" />
      )}
    </div>
  );
}

export default function Home() {
  const [userSession, setUserSession] = useState<{ id: string; username: string; slot: number; roomCode: string } | null>(null);
  const [mostrarInstrucciones, setMostrarInstrucciones] = useState(false); 
  
  const motor = useMotorOrbital(userSession);

  const { 
    estadoPartida, tiempo, energia, score, alerta,
    skillsDesbloqueadas, skillsActivas, debuffsEnemigos, efectosLocales, ultimaSkillRecibida,
    jugadores, countdown, telemetriaRivales, marcarListo, activarSkillManualmente
  } = motor;

  useEffect(() => {
    const saved = localStorage.getItem('A316_SESSION');
    if (saved) {
      try { setUserSession(JSON.parse(saved)); } catch (e) { console.error(e); }
    }
  }, []);

  const abortarEnlace = () => {
    localStorage.removeItem('A316_SESSION');
    setUserSession(null);
    window.location.reload();
  };

  const formatearTiempo = (segundos: number) => {
    const m = Math.floor(segundos / 60).toString().padStart(2, '0');
    const s = (segundos % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (!userSession) return <AccessModal onAccessGranted={(data) => setUserSession(data)} />;

  const SLOTS_TOTALES = [1, 2, 3, 4];
  const slotsOponentes = SLOTS_TOTALES.filter(s => s !== userSession.slot);
  const yoEstoyListo = jugadores.find(p => p.id === userSession.id)?.listo;
  const scoreEscuadra = Object.values(telemetriaRivales).reduce((acc: number, r: any) => acc + (r.score || 0), score);

  return (
    <main className="relative h-screen w-screen bg-[#050505] overflow-hidden select-none font-mono">
      
      {/* CAPA 0: EL BACKGROUND (La Consola A316) */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img 
          src="/bg.png" 
          className="w-full h-full object-cover opacity-90" 
          alt="Consola de Mando" 
        />
        <div className="absolute inset-0 bg-radial-gradient from-transparent to-black/60 pointer-events-none" />
      </div>

      {/* CAPA 10: HUD POSICIONADO ABSOLUTAMENTE */}
      <div className="relative z-10 w-full h-full">
        
        {/* ⚡ MODAL DE RESULTADOS */}
        {estadoPartida === 'terminado' && (
          <ResultsModal scoreLocal={score} telemetriaRivales={telemetriaRivales} jugadores={jugadores} userSession={userSession} />
        )}

        {/* 1. SECCIÓN CENTRAL: NÚCLEO ORBITAL (Ajustado al centro del círculo del BG) */}
        <div className="absolute top-[48%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
          
          <div className="mb-4 flex flex-col items-center text-center">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold tracking-[0.2em] text-white uppercase font-mono drop-shadow-md">
                SALA_{userSession.roomCode}
              </h1>
              <button onClick={abortarEnlace} className="text-[8px] font-mono text-zinc-600 hover:text-red-500 transition-colors uppercase border border-zinc-800 px-2 py-0.5 rounded-sm">
                [ ABORTAR_ENLACE ]
              </button>
            </div>
            
            <div className="flex gap-1.5 mt-2">
              {SLOTS_TOTALES.map(s => {
                const p = jugadores.find(j => j.slot === s);
                return (
                  <div key={s} className={`w-1.5 h-1.5 rounded-full ${p ? (p.listo ? 'bg-green-500 shadow-[0_0_5px_green]' : 'bg-yellow-500 animate-pulse') : 'bg-zinc-900'}`} />
                );
              })}
              <span className="text-[7px] text-zinc-600 uppercase ml-2 leading-none">Net_Status</span>
            </div>

            <p className={`text-4xl font-mono font-bold mt-2 leading-none drop-shadow-lg ${tiempo <= 30 ? 'text-red-500 animate-pulse' : 'text-zinc-300'}`}>
              {formatearTiempo(tiempo)}
            </p>
          </div>

          <OrbitalPanel 
            idJugador={userSession.username} 
            esLocal={true} 
            size={560} 
            motor={{ ...motor, skillsActivas: efectosLocales }} 
          />

          <div className="mt-6 h-16 flex flex-col items-center">
            {estadoPartida === 'espera' ? (
              <button onClick={marcarListo} disabled={yoEstoyListo} className={`px-10 py-3 border text-[10px] tracking-widest uppercase transition-all ${yoEstoyListo ? 'border-green-900 text-green-700 cursor-wait bg-green-950/10' : 'border-cyan-500 text-cyan-500 hover:bg-cyan-500/10'}`}>
                {yoEstoyListo ? 'Sincronizando Escuadra...' : 'Establecer Enlace (LISTO)'}
              </button>
            ) : (
              <div className="flex flex-col items-center gap-1">
                 <p className={`text-[11px] font-bold tracking-tighter uppercase drop-shadow-md ${alerta?.includes("ERROR") ? 'text-red-500 animate-pulse' : 'text-cyan-400'}`}>
                  {alerta || `> PROCESANDO_RESONANCIA: ${score} PTS`}
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-0.5 bg-zinc-900 border border-zinc-800">
                    <div className="h-full bg-yellow-500 shadow-[0_0_8px_#eab308]" style={{ width: `${(energia / 3000) * 100}%` }} />
                  </div>
                  <span className="text-[8px] font-bold text-yellow-500 uppercase">{Math.floor(energia)}u</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 2. LATERAL IZQUIERDO: SISTEMAS (BUFFS) */}
        <div className="absolute left-[12%] top-1/2 -translate-y-1/2 flex flex-col gap-4 items-center">
          <span className="text-[9px] font-bold text-cyan-500 uppercase tracking-[0.3em] mb-2 opacity-50">Sistemas</span>
          {SKILLS_CATALOGO.filter(s => s.tipo === 'buff').map(skill => (
            <SkillSlot key={skill.id} skill={skill} desbloqueada={skillsDesbloqueadas.includes(skill.id)} activa={skillsActivas[skill.id]} esNueva={ultimaSkillRecibida === skill.id} energia={energia} onActivar={activarSkillManualmente} />
          ))}
        </div>

        {/* 3. LATERAL DERECHO: ARMAMENTO (DEBUFFS) */}
        <div className="absolute right-[28%] top-1/2 -translate-y-1/2 flex flex-col gap-4 items-center">
          <span className="text-[9px] font-bold text-red-500 uppercase tracking-[0.3em] mb-2 opacity-50">Armamento</span>
          {SKILLS_CATALOGO.filter(s => s.tipo === 'debuff').map(skill => (
            <SkillSlot key={skill.id} skill={skill} desbloqueada={skillsDesbloqueadas.includes(skill.id)} activa={skillsActivas[skill.id]} esNueva={ultimaSkillRecibida === skill.id} energia={energia} onActivar={activarSkillManualmente} />
          ))}
        </div>

        {/* 4. TELEMETRÍA REMOTA (Columna derecha) */}
        <div className="absolute right-[2%] top-[10%] bottom-[10%] w-[22%] border-l border-zinc-900/30 pl-4 flex flex-col gap-4 bg-black/10">
          <div className="flex justify-between items-center border-b border-zinc-900 pb-2 px-1">
            <h2 className="text-[10px] text-zinc-600 uppercase tracking-widest">Escuadra</h2>
            <span className="text-[10px] text-cyan-500 font-bold tabular-nums">{scoreEscuadra} PTS</span>
          </div>
          
          <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
            {slotsOponentes.map((slotId) => {
              const datosRival = telemetriaRivales[slotId];
              const infoJugador = jugadores.find(j => j.slot === slotId);
              return (
                <div key={slotId} className="bg-zinc-950/30 border border-zinc-900/50 p-2 rounded-sm shadow-inner">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[8px] text-zinc-500 uppercase">{infoJugador?.username || `SLOT_0${slotId}`}</span>
                    <span className="text-[8px] text-yellow-500 font-bold tabular-nums">{datosRival?.score || 0}</span>
                  </div>
                  <OrbitalPanel 
                    idJugador={infoJugador?.username || `SLOT_0${slotId}`} 
                    size={160} 
                    esLocal={false} 
                    motor={{ 
                      ...motor, 
                      score: datosRival?.score || 0, 
                      skillsActivas: datosRival?.skills || {}, 
                      seleccionadosRef: { current: motor.nodosRef.current.filter(n => datosRival?.nodos?.includes(n.id)) } 
                    }} 
                  />
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-zinc-900/10 border border-zinc-900/50 rounded-sm">
             <p className="text-[8px] text-zinc-700 uppercase leading-tight font-mono">
               Protocol: Resonancia_A316<br/>
               Status: {estadoPartida === 'jugando' ? 'ENLACE_ACTIVO' : 'SINCRONIZANDO'}<br/>
               Pilot: {userSession.username}
             </p>
          </div>
        </div>

      </div>

      {/* OVERLAYS GLOBALES */}
      {estadoPartida === 'cuenta_atras' && (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/80 backdrop-blur-3xl">
          <span className="font-mono text-[160px] font-bold text-white animate-pulse">{countdown}</span>
          <p className="font-mono text-cyan-500 tracking-[1.5em] uppercase text-xs mt-4">Sincronizando Enlace</p>
        </div>
      )}

      {mostrarInstrucciones && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4" onClick={() => setMostrarInstrucciones(false)}>
          <div className="bg-[#050505] border border-zinc-800 max-w-lg w-full p-8 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-cyan-500 uppercase tracking-widest font-bold mb-4 border-b border-zinc-800 pb-2">Manual de Operación</h2>
            <div className="space-y-4 text-[11px] text-zinc-400 font-mono">
              <p className="flex justify-between"><span>[1-5]</span> <span className="text-zinc-200">Activar Buffs</span></p>
              <p className="flex justify-between"><span>[Q-T]</span> <span className="text-zinc-200">Protocolos Debuff</span></p>
              <p className="flex justify-between"><span>[CLIC]</span> <span className="text-zinc-200">Capturar Nodos</span></p>
              <p className="flex justify-between"><span>[ESPACIO]</span> <span className="text-zinc-200">Validar Geometría</span></p>
            </div>
            <button className="mt-8 w-full py-2 border border-zinc-800 hover:bg-zinc-900 text-[10px] text-zinc-500 uppercase">Cerrar_Manual</button>
          </div>
        </div>
      )}
    </main>
  );
}