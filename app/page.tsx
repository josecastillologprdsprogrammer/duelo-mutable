'use client';

import { useState, useEffect } from 'react';
import OrbitalPanel from './components/OrbitalPanel'; 
import AccessModal from './components/AccessModal';
import { useMotorOrbital } from '../hooks/useMotorOrbital';
import { SKILLS_CATALOGO } from '../lib/skillsEngine';
import ResultsModal from './components/ResultsModal';

/**
 * COMPONENTE: SLOT DE HABILIDAD (REFACTORIZADO)
 * Hitbox ampliada, integración de assets gráficos y feedback de estado mejorado.
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
      {/* CAPA 1: ASSET GRÁFICO (Siempre renderizado) */}
      <img 
        src={`/skills/${skill.id}.png`} 
        alt={skill.nombre}
        className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 
          ${activa ? 'opacity-100 mix-blend-screen' : 'opacity-60'}
        `}
        onError={(e) => { 
          e.currentTarget.style.display = 'none'; 
        }}
      />

      {/* CAPA 2: OVERLAY DE DATOS Y FEEDBACK */}
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

      {/* CAPA 3: INDICADOR DE EJECUCIÓN */}
      {activa && (
        <div className="absolute inset-x-0 bottom-0 h-1.5 bg-cyan-400 animate-pulse z-20 shadow-[0_0_15px_cyan]" />
      )}
    </div>
  );
}

/**
 * DASHBOARD A316 - NÚCLEO DE OPERACIONES
 */
export default function Home() {
  const [userSession, setUserSession] = useState<{ id: string; username: string; slot: number; roomCode: string } | null>(null);
  const [mostrarInstrucciones, setMostrarInstrucciones] = useState(false); 
  
  // Hook de lógica de juego (Motor de Resonancia)
  const motor = useMotorOrbital(userSession);

  const { 
    estadoPartida, tiempo, energia, score, alerta,
    skillsDesbloqueadas, skillsActivas, debuffsEnemigos, efectosLocales, ultimaSkillRecibida,
    jugadores, countdown, telemetriaRivales, marcarListo, activarSkillManualmente
  } = motor;

  // Persistencia de sesión local para reconexión rápida
  useEffect(() => {
    const saved = localStorage.getItem('A316_SESSION');
    if (saved) {
      try {
        setUserSession(JSON.parse(saved));
      } catch (e) {
        console.error("Error recuperando sesión:", e);
      }
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

  // GATEKEEPER: Si no hay sesión, mostramos el modal de acceso (Público/Guest)
  if (!userSession) {
    return <AccessModal onAccessGranted={(data) => setUserSession(data)} />;
  }

  const SLOTS_TOTALES = [1, 2, 3, 4];
  const slotsOponentes = SLOTS_TOTALES.filter(s => s !== userSession.slot);
  const yoEstoyListo = jugadores.find(p => p.id === userSession.id)?.listo;

  const scoreEscuadra = Object.values(telemetriaRivales).reduce((acc: number, r: any) => acc + (r.score || 0), score);

  return (
    <main className="relative min-h-screen w-full bg-[#050505] overflow-hidden select-none font-mono">
      
      {/* CAPA 0: EL BACKGROUND (La Consola A316) */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img 
          src="/bg.png" 
          className="w-full h-full object-cover opacity-80" 
          alt="Consola de Mando" 
        />
        <div className="absolute inset-0 bg-radial-gradient from-transparent to-black/60 pointer-events-none" />
      </div>

      {/* CAPA 10: LA INTERFAZ (HUD) */}
      <div className="relative z-10 flex min-h-screen p-6 gap-8">
        
        {/* ⚡ MODAL DE RESULTADOS (GAME OVER) */}
        {estadoPartida === 'terminado' && (
          <ResultsModal 
            scoreLocal={score}
            telemetriaRivales={telemetriaRivales}
            jugadores={jugadores}
            userSession={userSession}
          />
        )}

        {/* MANUAL DE OPERACIÓN (OVERLAY) */}
        {mostrarInstrucciones && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
            <div className="bg-[#0a0a0a] border border-zinc-800 max-w-2xl w-full p-8 shadow-[0_0_40px_rgba(6,182,212,0.1)]">
              <div className="flex justify-between items-end mb-6 border-b border-zinc-800 pb-4">
                <div>
                  <h2 className="text-cyan-500 font-mono text-xl uppercase tracking-widest font-bold">Protocolo A316</h2>
                  <p className="text-[10px] font-mono text-zinc-500 uppercase">Manual de Operación de Resonancia</p>
                </div>
                <button onClick={() => setMostrarInstrucciones(false)} className="text-[10px] font-mono text-zinc-500 hover:text-white border border-zinc-800 px-3 py-1 hover:bg-zinc-900 transition-colors uppercase">
                  [ CERRAR_LOG ]
                </button>
              </div>
              <div className="space-y-4 font-mono text-sm text-zinc-300">
                <div className="bg-zinc-900/30 p-3 border-l-2 border-cyan-500">
                  <p className="text-cyan-400 font-bold mb-1 text-xs">OBJETIVO PRIMARIO</p>
                  <p className="text-xs">Extraer <span className="text-white font-bold">Puntos de Resonancia</span> mediante vinculación geométrica antes de que el Sync_Clock llegue a cero.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-yellow-500 font-bold mb-1 text-xs">1. EXTRACCIÓN (CLIC)</p>
                    <p className="text-[11px] text-zinc-400">Congela nodos en tu matriz. Mínimo 3 nodos para operar.</p>
                  </div>
                  <div>
                    <p className="text-yellow-500 font-bold mb-1 text-xs">2. VALIDACIÓN</p>
                    <p className="text-[11px] text-zinc-400">La figura debe ser un <span className="text-white">polígono convexo</span> equilibrado.</p>
                  </div>
                  <div>
                    <p className="text-yellow-500 font-bold mb-1 text-xs">3. COLAPSO (ESPACIO)</p>
                    <p className="text-[11px] text-zinc-400">Presiona <span className="text-white border border-zinc-700 px-1 rounded bg-zinc-900">ESPACIO</span> para validar.</p>
                  </div>
                  <div>
                    <p className="text-yellow-500 font-bold mb-1 text-xs">4. SKILLS</p>
                    <p className="text-[11px] text-zinc-400">Usa el <span className="text-white">TECLADO (1-5, Q-T)</span> para activar ventajas o sabotajes.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* OVERLAY DE INICIO */}
        {estadoPartida === 'cuenta_atras' && (
          <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/70 backdrop-blur-2xl">
            <span className="font-mono text-[160px] font-bold text-white animate-pulse drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]">
              {countdown}
            </span>
            <p className="font-mono text-cyan-500 tracking-[1.5em] uppercase text-sm mt-4">Sincronizando Enlace Escuadra</p>
          </div>
        )}

        {/* ÁREA DE OPERACIONES LOCAL */}
        <div className="flex-[2.5] flex flex-col items-center justify-center border-r border-zinc-900/30 pr-8">
          
          <div className="mb-6 w-full max-w-[600px] flex justify-between items-end">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-4">
                <h1 className="text-2xl font-bold tracking-tighter text-white uppercase font-mono">
                  SALA_{userSession.roomCode}
                </h1>
                <button onClick={abortarEnlace} className="text-[9px] font-mono text-zinc-700 hover:text-red-500 transition-colors uppercase border border-zinc-800 px-2 py-0.5 rounded-sm">
                  [ ABORTAR_ENLACE ]
                </button>
              </div>
              <div className="flex gap-1.5 mt-1">
                {SLOTS_TOTALES.map(s => {
                  const p = jugadores.find(j => j.slot === s);
                  return (
                    <div key={s} className={`w-2 h-2 rounded-full ${p ? (p.listo ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-yellow-500 animate-pulse') : 'bg-zinc-900'}`} title={p?.username || 'VACÍO'} />
                  );
                })}
                <span className="text-[8px] font-mono text-zinc-600 uppercase ml-2 leading-none">Net_Status</span>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <div className="w-48 h-1 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                  <div className="h-full bg-yellow-500 transition-all duration-500 shadow-[0_0_10px_#eab308]" style={{ width: `${(energia / 3000) * 100}%` }} />
                </div>
                <span className="text-[9px] font-mono text-yellow-500 uppercase font-bold">EMS: {Math.floor(energia)}u</span>
              </div>
              <p className="text-[10px] text-cyan-500 font-mono uppercase tracking-widest">
                PILOTO: {userSession.username} | SLOT_ID: {userSession.slot}
              </p>
            </div>
            <div className="text-right flex flex-col items-end gap-2">
              <button onClick={() => setMostrarInstrucciones(true)} className="text-[9px] font-mono text-zinc-500 hover:text-cyan-400 transition-colors uppercase border border-zinc-800 hover:border-cyan-500 px-2 py-1 rounded-sm bg-zinc-950">
                [ DATA_LOG : GUÍA ]
              </button>
              <div>
                <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block mb-1">Sync_Clock</span>
                <p className={`text-3xl font-mono font-bold leading-none ${tiempo <= 30 ? 'text-red-500 animate-pulse' : 'text-zinc-300'}`}>
                  {formatearTiempo(tiempo)}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-8 items-center">
            <div className="flex flex-col gap-3">
              <span className="text-[9px] font-mono text-cyan-500 uppercase text-center tracking-widest">Sistemas</span>
              {SKILLS_CATALOGO.filter(s => s.tipo === 'buff').map(skill => (
                <SkillSlot key={skill.id} skill={skill} desbloqueada={skillsDesbloqueadas.includes(skill.id)} activa={skillsActivas[skill.id]} esNueva={ultimaSkillRecibida === skill.id} energia={energia} onActivar={activarSkillManualmente} />
              ))}
            </div>
            <OrbitalPanel 
              idJugador={userSession.username} 
              esLocal={true} 
              size={540} 
              motor={{ ...motor, skillsActivas: efectosLocales }} 
            />
            <div className="flex flex-col gap-3">
              <span className="text-[9px] font-mono text-red-500 uppercase text-center tracking-widest">Armamento</span>
              {SKILLS_CATALOGO.filter(s => s.tipo === 'debuff').map(skill => (
                <SkillSlot key={skill.id} skill={skill} desbloqueada={skillsDesbloqueadas.includes(skill.id)} activa={skillsActivas[skill.id]} esNueva={ultimaSkillRecibida === skill.id} energia={energia} onActivar={activarSkillManualmente} />
              ))}
            </div>
          </div>

          <div className="mt-8 h-20 flex flex-col items-center justify-center text-center">
            {estadoPartida === 'espera' ? (
              <button onClick={marcarListo} disabled={yoEstoyListo} className={`px-14 py-4 font-mono text-xs uppercase transition-all border shadow-lg ${yoEstoyListo ? 'border-green-900 text-green-900 cursor-wait bg-green-950/10' : 'border-cyan-500 text-cyan-500 hover:bg-cyan-500 hover:text-black shadow-[0_0_20px_rgba(6,182,212,0.2)]'}`}>
                {yoEstoyListo ? 'Confirmado: Esperando Escuadra...' : 'Establecer Enlace (LISTO)'}
              </button>
            ) : (
              <p className={`font-mono text-[12px] uppercase font-bold tracking-tight ${alerta?.includes("ERROR") ? 'text-red-500 animate-pulse' : 'text-cyan-400'}`}>
                {alerta || `> PROCESANDO_DATA: ${score} PUNTOS_DE_RESONANCIA`}
              </p>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-6 justify-center">
          <div className="flex justify-between items-center border-b border-zinc-900 pb-2 px-1">
            <h2 className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">Telemetría_Escuadra</h2>
            <span className="text-[10px] font-mono text-cyan-500 font-bold tabular-nums">{scoreEscuadra} TOTAL_PTS</span>
          </div>
          {slotsOponentes.map((slotId) => {
            const datosRival = telemetriaRivales[slotId];
            const infoJugador = jugadores.find(j => j.slot === slotId);
            const debuffsRival = Object.keys(datosRival?.skills || {}).filter(skillId => {
              const s = SKILLS_CATALOGO.find(cat => cat.id === skillId);
              return s && s.tipo === 'debuff';
            });
            return (
              <div key={slotId} className="flex flex-col gap-2 bg-zinc-950/50 p-2 border border-zinc-900/50 rounded-sm">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-mono text-zinc-400 uppercase">{infoJugador?.username || `Slot_0${slotId}`}</span>
                  <span className="text-[9px] font-mono text-yellow-500">{datosRival?.score || 0} PTS</span>
                </div>
                <div className="flex gap-4 items-center">
                  <OrbitalPanel 
                    idJugador={infoJugador?.username || `Slot_0${slotId}`} 
                    size={180} 
                    esLocal={false} 
                    motor={{ 
                      ...motor, 
                      score: datosRival?.score || 0, 
                      skillsActivas: datosRival?.skills || {}, 
                      seleccionadosRef: { current: motor.nodosRef.current.filter(n => datosRival?.nodos?.includes(n.id)) } 
                    }} 
                  />
                  <div className="flex flex-col gap-1">
                    {debuffsRival.map(skillId => {
                      const skill = SKILLS_CATALOGO.find(s => s.id === skillId);
                      return skill ? (
                        <div key={skillId} className="w-8 h-8 relative border border-red-500 rounded-sm overflow-hidden" title={`Sufriendo: ${skill.nombre}`}>
                          <img src={`/skills/${skill.id}.png`} alt={skill.nombre} className="absolute inset-0 w-full h-full object-cover mix-blend-screen" />
                          <div className="absolute inset-x-0 bottom-0 h-0.5 bg-red-500 animate-pulse" />
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              </div>
            );
          })}
          <div className="mt-2 p-3 bg-zinc-900/10 border border-zinc-900/50 rounded-sm">
             <p className="text-[8px] font-mono text-zinc-700 uppercase leading-tight">
               Protocol: Resonancia_A316<br/>
               Status: {estadoPartida === 'jugando' ? 'ENLACE_ACTIVO' : 'SINCRONIZANDO'}<br/>
               Net_Buffer: Optimizando_Broadcast
             </p>
          </div>
        </div>
      </div>
    </main>
  );
}