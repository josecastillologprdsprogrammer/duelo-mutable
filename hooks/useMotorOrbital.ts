// hooks/useMotorOrbital.ts
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Nodo, obtenerCoords, esConvexo, esProporcional, ordenarNodosCentroide 
} from '@/lib/puzzleEngine';
import { SKILLS_CATALOGO } from '@/lib/skillsEngine';

const PALETA_COLORES = ['#ef4444', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'];
const COLOR_CONGELADO = '#00e5ff';
const TIEMPO_PARTIDA = 300; 

const OBTENER_DURACION = (skillId: string) => {
  if (skillId === 'd3' || skillId === 'd4') return 5000; 
  return 10000; 
};

export const useMotorOrbital = (userSession: any) => {
  const nodosRef = useRef<Nodo[]>([]);
  const seleccionadosRef = useRef<Nodo[]>([]);
  const canalRef = useRef<any>(null);
  
  const anillosBaseRef = useRef<{ [key: number]: number }>({});
  const scoreRef = useRef(0);
  const skillsActivasRef = useRef<{ [key: string]: number }>({});

  const [jugadores, setJugadores] = useState<any[]>([]);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [telemetriaRivales, setTelemetriaRivales] = useState<{ [key: number]: any }>({});
  
  const [estadoPartida, setEstadoPartida] = useState<'espera' | 'cuenta_atras' | 'jugando' | 'terminado'>('espera');
  
  const estadoPartidaRef = useRef(estadoPartida);
  useEffect(() => { estadoPartidaRef.current = estadoPartida; }, [estadoPartida]);

  // === NUEVO: CANDADO DE ARRANQUE ANTI-RACE CONDITION ===
  const lockArranque = useRef(false);

  const [tiempo, setTiempo] = useState(TIEMPO_PARTIDA);
  const [score, setScore] = useState(0);
  const [energia, setEnergia] = useState(3000); 
  const [alerta, setAlerta] = useState<string | null>(null);

  const [skillsDesbloqueadas, setSkillsDesbloqueadas] = useState<string[]>([]);
  const [ultimaSkillRecibida, setUltimaSkillRecibida] = useState<string | null>(null);
  
  const [skillsActivas, setSkillsActivas] = useState<{ [key: string]: number }>({}); 
  const [debuffsEnemigos, setDebuffsEnemigos] = useState<{ [key: string]: boolean }>({}); 

  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { skillsActivasRef.current = skillsActivas; }, [skillsActivas]);

  // --- 1. CAPA DE RED ---
  const transmitirSync = useCallback((nodos: string[], scoreValue: number, skills: any) => {
    if (canalRef.current && userSession) {
      canalRef.current.send({
        type: 'broadcast',
        event: 'movimiento',
        payload: { slot: userSession.slot, nodos, score: scoreValue, skills }
      });
    }
  }, [userSession]);

  // --- 2. GARBAGE COLLECTOR ---
  useEffect(() => {
    if (estadoPartida !== 'jugando') return;
    const gcInterval = setInterval(() => {
      const ahora = Date.now();
      setSkillsActivas(prev => {
        let requiereSync = false;
        const estadoLimpio = { ...prev };
        Object.entries(estadoLimpio).forEach(([id, expireAt]) => {
          if (ahora >= expireAt) {
            delete estadoLimpio[id];
            requiereSync = true;
          }
        });
        if (requiereSync) {
          transmitirSync(seleccionadosRef.current.map(n => String(n.id)), scoreRef.current, estadoLimpio);
        }
        return requiereSync ? estadoLimpio : prev;
      });
    }, 500); 
    return () => clearInterval(gcInterval);
  }, [estadoPartida, transmitirSync]);

  // --- 3. ACTIVACIÓN MANUAL ---
  const activarSkillManualmente = useCallback((skillId: string) => {
    if (estadoPartida !== 'jugando') return;
    const skill = SKILLS_CATALOGO.find(s => s.id === skillId);
    if (skill && skillsDesbloqueadas.includes(skill.id) && energia >= skill.costo && !skillsActivas[skill.id]) {
      const expireAt = Date.now() + OBTENER_DURACION(skill.id); 
      const nuevasSkills = { ...skillsActivas, [skill.id]: expireAt };
      setEnergia(prev => prev - skill.costo);
      setSkillsActivas(nuevasSkills);
      setAlerta(`${skill.nombre} EN LÍNEA`);
      transmitirSync(seleccionadosRef.current.map(n => String(n.id)), scoreRef.current, nuevasSkills);
    }
  }, [estadoPartida, energia, skillsDesbloqueadas, skillsActivas, transmitirSync]);

  // --- 4. SISTEMA DE DROPS ---
  useEffect(() => {
    if (estadoPartida !== 'jugando') return;
    const intervalDrop = setInterval(() => {
      setSkillsDesbloqueadas(prev => {
        const bloqueadas = SKILLS_CATALOGO.filter(s => !prev.includes(s.id));
        if (bloqueadas.length === 0) return prev; 
        const skillMisteriosa = bloqueadas[Math.floor(Math.random() * bloqueadas.length)];
        const nuevoInventario = [...prev, skillMisteriosa.id];
        setUltimaSkillRecibida(skillMisteriosa.id);
        setAlerta(`NUEVA SKILL: ${skillMisteriosa.nombre}`);
        setTimeout(() => setUltimaSkillRecibida(null), 4000);
        return nuevoInventario;
      });
    }, 30000); 
    return () => clearInterval(intervalDrop);
  }, [estadoPartida]);

  // --- 5. DETECCIÓN DE IMPACTO ---
  useEffect(() => {
    const debuffsActivos: { [key: string]: boolean } = {};
    const ahora = Date.now();
    Object.values(telemetriaRivales).forEach((rival: any) => {
      if (rival.skills) {
        Object.entries(rival.skills).forEach(([id, expireAt]) => {
          const s = SKILLS_CATALOGO.find(sk => sk.id === id);
          if (s?.tipo === 'debuff' && ahora < (expireAt as number)) {
            debuffsActivos[id] = true;
          }
        });
      }
    });
    setDebuffsEnemigos(debuffsActivos);
  }, [telemetriaRivales]);

  // --- 6. MOTOR FÍSICO ---
  useEffect(() => {
    let animationFrameId: number;
    const tick = () => {
      if (estadoPartida === 'jugando') {
        let multVelocidad = 1.4; 
        let direccion = 1;
        if (skillsActivas['b1']) multVelocidad *= 0.3; 
        if (debuffsEnemigos['d5']) multVelocidad *= 3.0; 
        if (debuffsEnemigos['d2']) direccion = -1; 

        nodosRef.current = nodosRef.current.map(n => {
          const anilloOriginal = anillosBaseRef.current[n.id] || n.anillo;
          let anilloActual = n.anillo;
          if (debuffsEnemigos['d3']) {
            anilloActual = Math.max(anilloActual - 3, 20); 
          } else if (skillsActivas['b2']) {
            anilloActual = Math.max(anilloActual - 1.5, anilloOriginal * 0.65);
          } else if (anilloActual < anilloOriginal) {
            anilloActual = Math.min(anilloActual + 2, anilloOriginal);
          }
          return {
            ...n,
            anillo: anilloActual,
            angulo: n.angulo + (n.velocidad * multVelocidad * direccion)
          };
        });
      }
      animationFrameId = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(animationFrameId);
  }, [estadoPartida, skillsActivas, debuffsEnemigos]);

  // --- REGENERACIÓN PASIVA (b5) ---
  useEffect(() => {
    if (skillsActivas['b5'] && estadoPartida === 'jugando') {
      const interval = setInterval(() => {
        setEnergia(prev => Math.min(prev + 10, 3000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [skillsActivas, estadoPartida]);

  // --- 7. OPERACIONES DE NODOS ---
  const marcarListo = async () => {
    if (!userSession) return;
    const { data: sala } = await supabase.from('salas').select('jugadores').eq('codigo_sala', userSession.roomCode).single();
    if (!sala) return;
    const nuevosJugadores = sala.jugadores.map((p: any) => p.id === userSession.id ? { ...p, listo: true } : p);
    await supabase.from('salas').update({ jugadores: nuevosJugadores }).eq('codigo_sala', userSession.roomCode);
  };

  const liberarNodos = async (resetCompleto: boolean = false, scoreEnv: number) => {
    const nodosALiberar = resetCompleto ? nodosRef.current : [...seleccionadosRef.current];
    seleccionadosRef.current = [];
    nodosALiberar.forEach(n => {
      const idx = nodosRef.current.findIndex(loc => loc.id === n.id);
      if (idx !== -1) {
        nodosRef.current[idx].velocidad = (Math.random() * 0.02 - 0.01);
        nodosRef.current[idx].color = PALETA_COLORES[Math.floor(Math.random() * PALETA_COLORES.length)];
      }
    });
    transmitirSync([], scoreEnv, skillsActivasRef.current);
  };

  // --- 8. EVENTOS DE TECLADO ---
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (estadoPartida !== 'jugando') return;
      const skill = SKILLS_CATALOGO.find(s => s.tecla === e.code);
      if (skill) activarSkillManualmente(skill.id);

      if (e.code === 'Space') {
        e.preventDefault();
        const sel = seleccionadosRef.current;
        if (sel.length < 3) return;
        const coords = sel.map(n => obtenerCoords(n, 0, 0));
        const shieldActivo = skillsActivas['b4']; 

        if (!esConvexo(coords)) {
          setAlerta("ERROR: ESTRUCTURA CÓNCAVA");
          await liberarNodos(false, scoreRef.current);
          return;
        }
        if (!shieldActivo && !esProporcional(coords, 4.0)) {
          setAlerta("ERROR: FALLO DE PROPORCIÓN");
          await liberarNodos(false, scoreRef.current);
          return;
        }

        let puntos = sel.length * 100;
        if (skillsActivas['b3']) puntos *= 2; 
        const nuevoTotal = scoreRef.current + puntos;
        setScore(nuevoTotal);
        setEnergia(prev => Math.min(prev + puntos * 0.4, 3000));
        setAlerta(`+${puntos} PTS`);
        await liberarNodos(false, nuevoTotal);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [estadoPartida, skillsActivas, activarSkillManualmente]);

  // --- 9. LIFECYCLE DE SALA Y CONEXIÓN ---
  const resetearMotorLocal = useCallback(() => {
    // Activamos el candado por 1.5 segundos para ignorar ecos de la base de datos
    lockArranque.current = true;
    setTimeout(() => { lockArranque.current = false; }, 1500);

    setEstadoPartida('espera');
    setJugadores(prev => prev.map(p => ({ ...p, listo: false }))); 
    setTiempo(TIEMPO_PARTIDA);
    setScore(0);
    setEnergia(1000);
    setSkillsDesbloqueadas([]);
    setSkillsActivas({});
    setDebuffsEnemigos({});
    setTelemetriaRivales({});
    setAlerta(null);
    seleccionadosRef.current = [];
    scoreRef.current = 0;
    skillsActivasRef.current = {};
    
    nodosRef.current = nodosRef.current.map(n => ({
      ...n, velocidad: 0, anillo: anillosBaseRef.current[n.id] || n.anillo
    }));
  }, []);

  useEffect(() => {
    if (!userSession) return;
    const canal = supabase.channel(`telemetria:${userSession.roomCode}`, { config: { broadcast: { self: false } } });
    canalRef.current = canal;
    canal.on('broadcast', { event: 'movimiento' }, ({ payload }) => {
      setTelemetriaRivales(prev => ({ ...prev, [payload.slot]: payload }));
    }).subscribe();

    const canalDB = supabase.channel('cambios-sala').on('postgres_changes', { 
      event: 'UPDATE', schema: 'public', table: 'salas', filter: `codigo_sala=eq.${userSession.roomCode}` 
    }, (payload) => {
      setJugadores(payload.new.jugadores);
      
      if (payload.new.estado === 'terminado') {
        setEstadoPartida('terminado');
      } else if (payload.new.estado === 'espera' && estadoPartidaRef.current === 'terminado') {
        resetearMotorLocal();
      }
    }).subscribe();

    return () => { canal.unsubscribe(); canalDB.unsubscribe(); };
  }, [userSession, resetearMotorLocal]);

  const reiniciarSala = async () => {
    if (!userSession) return;
    
    // Capturamos el array limpio antes de enviarlo, para no depender del .select()
    const jugadoresActuales = [...jugadores];
    
    // UI Responde de inmediato y bloquea el auto-arranque
    resetearMotorLocal();

    try {
      const jugadoresReset = jugadoresActuales.map((p: any) => ({ ...p, listo: false }));
      // Inyección directa a DB sin consultas lentas
      await supabase.from('salas').update({ 
        estado: 'espera', 
        jugadores: jugadoresReset 
      }).eq('codigo_sala', userSession.roomCode);
    } catch (e) {
      console.error("> Error de red al reiniciar:", e);
    }
  };

  useEffect(() => {
    if (jugadores.length === 0) return;
    const escuadraCompleta = jugadores.length === 4;
    const todosListos = jugadores.every(p => p.listo === true);
    
    // === EL CANDADO EN ACCIÓN ===
    // Si lockArranque.current es true, ignoramos la señal aunque parezcan estar listos
    if (escuadraCompleta && todosListos && estadoPartida === 'espera' && !lockArranque.current) {
      setEstadoPartida('cuenta_atras');
      setCountdown(10);
    }
  }, [jugadores, estadoPartida]);

  useEffect(() => {
    if (estadoPartida === 'cuenta_atras' && countdown !== null) {
      if (countdown > 0) {
        const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        setEstadoPartida('jugando');
        setCountdown(null);
        liberarNodos(true, 0);
      }
    }
  }, [estadoPartida, countdown]);

  useEffect(() => {
    if (estadoPartida === 'jugando' && tiempo > 0) {
      const timer = setInterval(() => setTiempo(t => t - 1), 1000);
      return () => clearInterval(timer);
    } else if (tiempo === 0 && estadoPartida === 'jugando') {
      setEstadoPartida('terminado');
      if (userSession.slot === 1) {
        supabase.from('salas').update({ estado: 'terminado' }).eq('codigo_sala', userSession.roomCode).then();
      }
    }
  }, [estadoPartida, tiempo, userSession]);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.from('mentes').select('*').order('id');
      if (data) {
        nodosRef.current = data;
        const baseRings: { [key: number]: number } = {};
        data.forEach(n => { baseRings[n.id] = n.anillo; });
        anillosBaseRef.current = baseRings;
      }
    };
    init();
  }, []);

  const efectosLocales = useMemo(() => {
    const buffsPropios = Object.keys(skillsActivas).reduce((acc, id) => {
      if (id.startsWith('b')) acc[id] = skillsActivas[id];
      return acc;
    }, {} as Record<string, number>);
    return { ...buffsPropios, ...debuffsEnemigos };
  }, [skillsActivas, debuffsEnemigos]);

  return {
    nodosRef, seleccionadosRef, estadoPartida, tiempo, score, energia, alerta, 
    skillsDesbloqueadas, ultimaSkillRecibida, skillsActivas, debuffsEnemigos,
    efectosLocales,
    jugadores, countdown, telemetriaRivales,
    marcarListo, 
    activarSkillManualmente,
    reiniciarSala,
    procesarInteraccion: (mouseX: number, mouseY: number, centerX: number, centerY: number) => {
      if (estadoPartida !== 'jugando') return;
      const idx = nodosRef.current.findIndex(n => Math.sqrt(Math.pow(mouseX - obtenerCoords(n, centerX, centerY).x, 2) + Math.pow(mouseY - obtenerCoords(n, centerX, centerY).y, 2)) < 25);
      if (idx === -1 || seleccionadosRef.current.some(s => s.id === nodosRef.current[idx].id)) return;
      const n = { ...nodosRef.current[idx], velocidad: 0, color: COLOR_CONGELADO };
      nodosRef.current[idx] = n;
      seleccionadosRef.current = ordenarNodosCentroide([...seleccionadosRef.current, n], centerX, centerY);
      transmitirSync(seleccionadosRef.current.map(s => String(s.id)), scoreRef.current, skillsActivasRef.current);
    }, 
    liberarNodos,
    iniciarPartida: () => setEstadoPartida('jugando')
  };
};