'use client';
import { useState, useEffect } from 'react';
import OrbitalPanel from './components/OrbitalPanel'; 
import AccessModal from './components/AccessModal';
import { useMotorOrbital } from '@/hooks/useMotorOrbital';
import { SKILLS_CATALOGO } from '@/lib/skillsEngine';
import ResultsModal from './components/ResultsModal';

// ==========================================
// COMPONENTE: SLOT DE HABILIDAD
// ==========================================
function SkillSlot({ skill, desbloqueada, activa, esNueva, energia, onActivar }: any) {
  const puedePagar = energia >= skill.costo;
  const clickeable = desbloqueada && puedePagar && !activa;
  
  return (
    <div 
      onClick={() => clickeable && onActivar(skill.id)}
      className={`
      relative flex flex-col items-center justify-center w-14 h-14 border-2 transition-all duration-500 rounded-sm
      ${desbloqueada ? 'opacity-100 scale-100' : 'opacity-10 scale-90 grayscale'}
      ${esNueva ? 'animate-bounce border-white shadow-[0_0_20px_white] z-10' : 'border-zinc-800'}
      ${activa ? 'bg-white text-black shadow-[0_0_15px_white]' : 'bg-transparent'}
      ${clickeable ? 'cursor-pointer hover:border-cyan-500' : 'cursor-default'}
    `}>
      <span className={`text-[9px] font-bold font-mono ${activa ? 'text-black' : 'text-zinc-400'}`}>
        {skill.tecla.replace('Digit', '').replace('Key', '')}
      </span>
      <div className="w-full h-[1px] my-1" style={{ backgroundColor: desbloqueada ? skill.color : '#333' }} />
      <span className={`text-[7px] uppercase text-center leading-none font-bold tracking-tighter
        ${activa ? 'text-black' : 'text-zinc-300'}`}>
        {skill.nombre.substring(0, 6)}
      </span>
      {desbloqueada && !activa && (
        <span className={`text-[7px] mt-1 font-mono ${puedePagar ? 'text-yellow-500' : 'text-zinc-600'}`}>
          {skill.costo}
        </span>
      )}
      <div className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: skill.color }} />
    </div>
  );
}

// ==========================================
// COMPONENTE PRINCIPAL: DASHBOARD A316
// ==========================================
export default function Home() {
  const [userSession, setUserSession] = useState<{ id: string; username: string; slot: number; roomCode: string } | null>(null);
  const [mostrarInstrucciones, setMostrarInstrucciones] = useState(false); 
  
  const motor = useMotorOrbital(userSession);

  const { 
    estadoPartida, tiempo, energia, score, alerta,
    skillsDesbloqueadas, skillsActivas, debuffsEnemigos, ultimaSkillRecibida,
    jugadores, countdown, telemetriaRivales, marcarListo, activarSkillManualmente
  } = motor;

  useEffect(() => {
    const saved = localStorage.getItem('A316_SESSION');
    if (saved) setUserSession(JSON.parse(saved));
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
    <main className="flex min-h-screen bg-[#050505] p-6 gap-8 overflow-hidden select-none">
      
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
                <p className="text-xs">Extraer <span className="text-white font-bold">Puntos de Resonancia</span> mediante la vinculación geométrica de mentes (nodos) antes de que el Sync_Clock llegue a cero.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-yellow-500 font-bold mb-1 text-xs">1. EXTRACCIÓN (CLIC)</p>
                  <p className="text-[11px] text-zinc-400">Haz clic sobre los nodos en movimiento para congelarlos en tu matriz local. Requiere un mínimo de 3 nodos para operar.</p>
                </div>
                <div>
                  <p className="text-yellow-500 font-bold mb-1 text-xs">2. VALIDACIÓN ESPACIAL</p>
                  <p className="text-[11px] text-zinc-400">La figura formada debe ser estrictamente un <span className="text-white">polígono convexo</span> y mantener una <span className="text-white">proporción estructural</span> equilibrada.</p>
                </div>
                <div>
                  <p className="text-yellow-500 font-bold mb-1 text-xs">3. COLAPSO (ESPACIO)</p>
                  <p className="text-[11px] text-zinc-400">Presiona la barra <span className="text-white border border-zinc-700 px-1 rounded bg-zinc-900">ESPACIO</span> para validar la geometría. Si es correcta, ganarás puntos y Energía EMS.</p>
                </div>
                <div>
                  <p className="text-yellow-500 font-bold mb-1 text-xs">4. GUERRA ELECTRÓNICA</p>
                  <p className="text-[11px] text-zinc-400">Cada 30s recibirás nuevas Skills. Paga su costo de EMS usando el <span className="text-white">TECLADO</span> o haciendo <span className="text-white">CLIC</span> en los paneles laterales.</p>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-800 flex gap-8">
                <div>
                  <p className="text-[10px] text-green-400 mb-1">BUFFS (Teclas 1-5)</p>
                  <p className="text-[10px] text-zinc-500">Alteran la física a tu favor.</p>
                </div>
                <div>
                  <p className="text-[10px] text-red-400 mb-1">DEBUFFS (Teclas Q-T)</p>
                  <p className="text-[10px] text-zinc-500">Sabotean la matriz de tu escuadra.</p>
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
          <p className="font-mono text-cyan-500 tracking-[1.5em] uppercase text-sm mt-4">
            Sincronizando Enlace Escuadra
          </p>
        </div>
      )}

      {/* ÁREA LOCAL */}
      <div className="flex-[2.5] flex flex-col items-center justify-center border-r border-zinc-900 pr-8">
        
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

          {/* TIMER Y BOTÓN DE INSTRUCCIONES */}
          <div className="text-right flex flex-col items-end gap-2">
            <button 
              onClick={() => setMostrarInstrucciones(true)}
              className="text-[9px] font-mono text-zinc-500 hover:text-cyan-400 transition-colors uppercase border border-zinc-800 hover:border-cyan-500 px-2 py-1 rounded-sm bg-zinc-950"
            >
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

        {/* HUD COMBATE */}
        <div className="flex gap-6 items-center">
          <div className="flex flex-col gap-2">
            <span className="text-[8px] font-mono text-zinc-600 uppercase text-center mb-1">Buffs</span>
            {SKILLS_CATALOGO.filter(s => s.tipo === 'buff').map(skill => (
              <SkillSlot key={skill.id} skill={skill} desbloqueada={skillsDesbloqueadas.includes(skill.id)} activa={skillsActivas[skill.id]} esNueva={ultimaSkillRecibida === skill.id} energia={energia} onActivar={activarSkillManualmente} />
            ))}
          </div>

          <OrbitalPanel idJugador={userSession.username} esLocal={true} size={540} motor={{ ...motor, skillsActivas: { ...motor.skillsActivas, ...motor.debuffsEnemigos } }} />

          <div className="flex flex-col gap-2">
            <span className="text-[8px] font-mono text-zinc-600 uppercase text-center mb-1">Debuffs</span>
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

      {/* TELEMETRÍA RIVAL */}
      <div className="flex-1 flex flex-col gap-6 justify-center">
        <div className="flex justify-between items-center border-b border-zinc-900 pb-2 px-1">
          <h2 className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">Telemetría_Escuadra</h2>
          <span className="text-[10px] font-mono text-zinc-300 font-bold tabular-nums">{scoreEscuadra} TOTAL_PTS</span>
        </div>
        
        {slotsOponentes.map((slotId) => {
          const datosRival = telemetriaRivales[slotId];
          const infoJugador = jugadores.find(j => j.slot === slotId);

          return (
            <OrbitalPanel key={slotId} idJugador={infoJugador?.username || `Slot_0${slotId}`} size={200} esLocal={false} motor={{ ...motor, score: datosRival?.score || 0, skillsActivas: datosRival?.skills || {}, seleccionadosRef: { current: motor.nodosRef.current.filter(n => datosRival?.nodos.includes(n.id)) } }} />
          );
        })}

        <div className="mt-2 p-3 bg-zinc-900/10 border border-zinc-900/50 rounded-sm">
           <p className="text-[8px] font-mono text-zinc-700 uppercase leading-tight">
             Protocolo: Resonancia_A316<br/>
             Status: {estadoPartida === 'jugando' ? 'ENLACE_ACTIVO' : 'SINCRONIZANDO'}<br/>
             Net_Buffer: Optimizando_Broadcast
           </p>
        </div>
      </div>
    </main>
  );
}