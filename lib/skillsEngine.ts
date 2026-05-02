export type SkillType = 'buff' | 'debuff';

export interface Skill {
  id: string;
  nombre: string;
  tipo: SkillType;
  tecla: string;
  costo: number;
  descripcion: string;
  color: string;
}

export const SKILLS_CATALOGO: Skill[] = [
  // --- BUFFS (Teclas 1 - 5) ---
  { id: 'b1', nombre: 'CHRONOS', tipo: 'buff', tecla: 'Digit1', costo: 400, color: '#fbbf24', descripcion: 'Tiempo al 30%' },
  { id: 'b2', nombre: 'MAGNETAR', tipo: 'buff', tecla: 'Digit2', costo: 600, color: '#60a5fa', descripcion: 'Atracción de nodos' },
  { id: 'b3', nombre: 'DOUBLE', tipo: 'buff', tecla: 'Digit3', costo: 1000, color: '#4ade80', descripcion: 'X2 Puntos' },
  { id: 'b4', nombre: 'SHIELD', tipo: 'buff', tecla: 'Digit4', costo: 800, color: '#a78bfa', descripcion: 'Sin error de forma' },
  { id: 'b5', nombre: 'REGEN', tipo: 'buff', tecla: 'Digit5', costo: 500, color: '#f472b6', descripcion: '+10 Energía/seg' },

  // --- DEBUFFS / RIESGOS (Teclas Q - T) ---
  { id: 'd1', nombre: 'FLARE', tipo: 'debuff', tecla: 'KeyQ', costo: 300, color: '#f87171', descripcion: 'Cegado visual' },
  { id: 'd2', nombre: 'REVERSE', tipo: 'debuff', tecla: 'KeyW', costo: 500, color: '#fb923c', descripcion: 'Giro invertido' },
  { id: 'd3', nombre: 'VOID', tipo: 'debuff', tecla: 'KeyE', costo: 700, color: '#94a3b8', descripcion: 'Succión al centro' },
  { id: 'd4', nombre: 'GHOST', tipo: 'debuff', tecla: 'KeyR', costo: 600, color: '#2dd4bf', descripcion: 'Nodos invisibles' },
  { id: 'd5', nombre: 'OVER', tipo: 'debuff', tecla: 'KeyT', costo: 1200, color: '#dc2626', descripcion: 'Velocidad x3' },
];