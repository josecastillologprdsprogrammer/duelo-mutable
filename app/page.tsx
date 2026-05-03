'use client';

import { useState, useEffect } from 'react';
import OrbitalPanel from './components/OrbitalPanel'; 
import AccessModal from './components/AccessModal';
import { useMotorOrbital } from '../hooks/useMotorOrbital';
import { SKILLS_CATALOGO } from '../lib/skillsEngine';
import ResultsModal from './components/ResultsModal';

/**
 * COMPONENTE: SLOT DE HABILIDAD
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
  const [copiado, setCopiado] = useState(false);
  
  const motor = useMotorOrbital(userSession);

  const { 
    estadoPartida, tiempo, energia, score, alerta,
    skillsDesbloqueadas, skillsActivas, efectosLocales, ultimaSkillRecibida,
    jugadores, countdown, telemetriaRivales, marcarListo, activarSkillManualmente
  } = motor;

  useEffect(() => {
    const saved = localStorage.getItem('A316_SESSION');
    if (saved) {
      try { setUserSession(JSON.parse(saved)); } catch (e) { console.error(e); }
    }
  }, []);

  const copiarCodigo = () => {
    if (!userSession) return;
    navigator.clipboard.writeText(userSession.roomCode);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

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
      
      {/* CAPA 0: EL BACKGROUND (Consola A316) */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img 
          src="/bg.png" 
          className="w-full h-full object-cover opacity-90" 
          alt="Consola de Mando" 
        />
        <div className="absolute inset-0 bg-radial-gradient from-transparent to-black/60 pointer-events-none" />
      </div>

      {/* CAPA 10: INTERFAZ CALIBRADA */}
      <div className="relative z-10 w-full h-full">
        
        {/* MODAL DE RESULTADOS */}
        {estadoPartida === 'terminado' && (
          <ResultsModal scoreLocal={score} telemetriaRivales={telemetriaRivales} jugadores={jugadores} userSession={userSession} />
        )}

        {/* --- [A] BLOQUE DE SALA (TOP LEFT) --- */}
        <div className="absolute top-10 left-10 flex flex-col gap-3">
          <div className="flex items-end gap-4">
            <div className="flex items-center gap-2 group cursor-pointer" onClick={copiarCodigo} title="Copiar código de sala">
              <h1 className="text-3xl font-bold tracking-tighter text-white uppercase drop-shadow-md">
                SALA_{userSession.roomCode}
              </h1>
              <svg className={`w-4 h-4 transition-colors ${copiado ? 'text-green-500' : 'text-zinc-600 group-hover:text-cyan-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 002-2h2a2 2 0 002-2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
            </div>
            <button onClick={abortarEnlace} className="text-[9px] text-zinc-500 hover:text-red-500 border border-zinc-800 px-3 py-1 rounded-sm uppercase transition-all bg-black/20 hover:bg-red-500/10">
              [ ABORTAR_ENLACE ]
            </button>
          </div>
          
          <div className="flex gap-1.5 items-center">
            {SLOTS_TOTALES.map(s => {
              const p = jugadores.find(j => j.slot === s);
              return (
                <div key={s} className={`w-2 h-2 rounded-full ${p ? (p.listo ? 'bg-green-500 shadow-[0_0_5px_green]' : 'bg-yellow-500 animate-pulse') : 'bg-zinc-900'}`} />
              );
            })}
            <span className="text-[8px] text-zinc-600 uppercase ml-2 tracking-widest font-bold">Net_Status</span>
          </div>

          <div className="flex flex-col gap-1.5 mt-1">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-yellow-500 uppercase min-w-[75px]">EMS: {Math.floor(energia)}U</span>
              <div className="w-48 h-1.5 bg-zinc-900 border border-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-500 shadow-[0_0_10px_#eab308] transition-all duration-300" style={{ width: `${(energia / 3000) * 100}%` }} />
              </div>
            </div>
            <p className="text-[11px] text-cyan-500 uppercase tracking-[0.2em] font-bold">
              Piloto: {userSession.username} | Slot_ID: {userSession.slot}
            </p>
          </div>
        </div>

        {/* --- [B] BLOQUE DE TIEMPO (TOP CENTER) --- */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 flex flex-col items-center">
          <span className="text-[10px] text-zinc-500 uppercase tracking-[0.5em] mb-1">Sync_Clock</span>
          <p className={`text-6xl font-bold font-mono leading-none drop-shadow-2xl ${tiempo <= 30 ? 'text-red-500 animate-pulse' : 'text-zinc-200'}`}>
            {formatearTiempo(tiempo)}
          </p>
          <div className="mt-2 text-[12px] font-bold text-cyan-500 tracking-widest bg-black/40 px-4 py-0.5 border border-cyan-500/20">
            {score.toLocaleString()} PTS
          </div>
        </div>

        {/* --- [C] NÚCLEO CENTRAL --- */}
        <div className="absolute top-[48%] left-1/2 -translate-x-1/2 -translate-y-1/2">
          <OrbitalPanel 
            idJugador={userSession.username} 
            esLocal={true} 
            size={560} 
            motor={{ ...motor, skillsActivas: efectosLocales }} 
          />
        </div>

        {/* --- [D] COLUMNAS DE SKILLS --- */}
        <div className="absolute left-[12%] top-[55%] -translate-y-1/2 flex flex-col gap-4 items-center">
          <span className="text-[10px] font-bold text-cyan-500 uppercase tracking-[0.3em] mb-2">Sistemas</span>
          {SKILLS_CATALOGO.filter(s => s.tipo === 'buff').map(skill => (
            <SkillSlot key={skill.id} skill={skill} desbloqueada={skillsDesbloqueadas.includes(skill.id)} activa={skillsActivas[skill.id]} esNueva={ultimaSkillRecibida === skill.id} energia={energia} onActivar={activarSkillManualmente} />
          ))}
        </div>

        <div className="absolute right-[28%] top-[55%] -translate-y-1/2 flex flex-col gap-4 items-center">
          <span className="text-[10px] font-bold text-red-500 uppercase tracking-[0.3em] mb-2">Armamento</span>
          {SKILLS_CATALOGO.filter(s => s.tipo === 'debuff').map(skill => (
            <SkillSlot key={skill.id} skill={skill} desbloqueada={skillsDesbloqueadas.includes(skill.id)} activa={skillsActivas[skill.id]} esNueva={ultimaSkillRecibida === skill.id} energia={energia} onActivar={activarSkillManualmente} />
          ))}
        </div>

        {/* --- [E] BOTÓN DE ACCIÓN (BOTTOM CENTER) --- */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2">
          {estadoPartida === 'espera' ? (
            <button onClick={marcarListo} disabled={yoEstoyListo} className={`px-20 py-4 border-2 text-[12px] font-bold tracking-[0.4em] uppercase transition-all shadow-[0_0_30px_rgba(0,0,0,0.5)] ${yoEstoyListo ? 'border-green-900 text-green-700 bg-green-950/20' : 'border-cyan-500 text-cyan-500 hover:bg-cyan-500 hover:text-black shadow-[0_0_30px_rgba(6,182,212,0.2)]'}`}>
              {yoEstoyListo ? 'Sincronizado' : 'Establecer Enlace (LISTO)'}
            </button>
          ) : (
            <div className="bg-black/60 px-10 py-3 border border-cyan-500/30 backdrop-blur-md">
              <p className={`text-[13px] font-bold uppercase tracking-[0.2em] ${alerta?.includes("ERROR") ? 'text-red-500 animate-pulse' : 'text-cyan-400'}`}>
                {alerta || `> Enlace de Resonancia Estable`}
              </p>
            </div>
          )}
        </div>

        {/* --- [F] TELEMETRÍA (FAR RIGHT) --- */}
        <div className="absolute right-6 top-[10%] bottom-[10%] w-[22%] flex flex-col gap-5">
          <div className="flex justify-between items-center border-b border-zinc-900 pb-2 px-1">
            <h2 className="text-[11px] text-zinc-500 uppercase tracking-widest font-bold">Escuadra</h2>
            <span className="text-[11px] text-cyan-500 font-bold tabular-nums">{scoreEscuadra.toLocaleString()} PTS</span>
          </div>
          <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
            {slotsOponentes.map((slotId) => {
              const datosRival = telemetriaRivales[slotId];
              const infoJugador = jugadores.find(j => j.slot === slotId);
              return (
                <div key={slotId} className="bg-zinc-950/30 border border-zinc-900/50 p-2 rounded-sm shadow-inner">
                  <div className="flex justify-between items-center mb-2 px-1">
                    <span className="text-[9px] text-zinc-400 uppercase font-bold">{infoJugador?.username || `SLOT_0${slotId}`}</span>
                    <span className="text-[10px] text-yellow-500 font-bold">{(datosRival?.score || 0).toLocaleString()}</span>
                  </div>
                  <OrbitalPanel idJugador={infoJugador?.username || `SLOT_0${slotId}`} size={165} esLocal={false} motor={{ ...motor, score: datosRival?.score || 0, skillsActivas: datosRival?.skills || {}, seleccionadosRef: { current: motor.nodosRef.current.filter(n => datosRival?.nodos?.includes(n.id)) } }} />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* OVERLAY DE CUENTA ATRÁS */}
      {estadoPartida === 'cuenta_atras' && (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/85 backdrop-blur-3xl">
          <span className="font-mono text-[180px] font-bold text-white animate-pulse drop-shadow-[0_0_50px_rgba(255,255,255,0.2)]">
            {countdown}
          </span>
          <p className="font-mono text-cyan-500 tracking-[1.5em] uppercase text-sm mt-4">Sincronizando Enlace Escuadra</p>
        </div>
      )}
    </main>
  );
}