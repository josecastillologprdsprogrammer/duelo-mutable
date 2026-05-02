// ==========================================
// INTERFACES DEL MOTOR FÍSICO
// ==========================================
export interface Nodo {
  id: number;
  anillo: number;
  angulo: number;
  velocidad: number;
  color?: string; 
  estado?: string;
}

export interface Punto {
  x: number;
  y: number;
}

// ==========================================
// GENERADOR DE ARQUITECTURA ORBITAL (SEEDING)
// ==========================================
export const generarNivelBase = (anillos: number, puntosPorAnillo: number): Nodo[] => {
  const nodos: Nodo[] = [];
  let idCounter = 0;

  for (let i = 0; i < anillos; i++) {
    // Rotación alterna para efecto visual de "relojería"
    const direccion = i % 2 === 0 ? 1 : -1;
    const velocidadBase = (0.005 + Math.random() * 0.01) * direccion;

    for (let j = 0; j < puntosPorAnillo; j++) {
      nodos.push({
        id: idCounter++,
        anillo: (i + 1) * 80, // Espaciado radial entre órbitas
        angulo: (j * 2 * Math.PI) / puntosPorAnillo,
        velocidad: velocidadBase
      });
    }
  }
  return nodos;
};

// ==========================================
// LÓGICA DE GEOMETRÍA Y RESTRICCIONES ESPACIALES
// ==========================================

/**
 * Calcula la orientación de tres puntos ordenados usando el producto cruz.
 * @returns 0 (Colineales), 1 (Horario), 2 (Antihorario)
 */
const orientacion = (p: Punto, q: Punto, r: Punto): number => {
  const val = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
  if (val === 0) return 0; 
  return val > 0 ? 1 : 2; 
};

/**
 * Algoritmo de validación de intersección de segmentos.
 * Previene la formación de polígonos auto-intersecantes (complejos).
 */
export const seCruzan = (p1: Punto, q1: Punto, p2: Punto, q2: Punto): boolean => {
  const o1 = orientacion(p1, q1, p2);
  const o2 = orientacion(p1, q1, q2);
  const o3 = orientacion(p2, q2, p1);
  const o4 = orientacion(p2, q2, q1);

  // Si las orientaciones se alternan, los segmentos se cruzan
  if (o1 !== o2 && o3 !== o4) return true;
  return false; 
};

/**
 * Traducción de coordenadas polares a cartesianas.
 * Desacoplado del renderizado de React para maximizar el rendimiento.
 */
export const obtenerCoords = (nodo: Nodo, centerX: number, centerY: number): Punto => ({
  x: centerX + Math.cos(nodo.angulo) * nodo.anillo,
  y: centerY + Math.sin(nodo.angulo) * nodo.anillo
});

/**
 * Calcula la distancia euclidiana entre dos puntos.
 */
export const distancia = (p1: Punto, p2: Punto): number => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

/**
 * FILTRO DE CONVEXIDAD
 * Verifica que todos los ángulos internos giren hacia el mismo lado.
 * Evita figuras "hundidas" o con forma de flecha/Pac-Man.
 */
export const esConvexo = (vertices: Punto[]): boolean => {
  if (vertices.length < 3) return false;
  let signoGlobal = 0;

  for (let i = 0; i < vertices.length; i++) {
    const p1 = vertices[i];
    const p2 = vertices[(i + 1) % vertices.length];
    const p3 = vertices[(i + 2) % vertices.length];

    const o = orientacion(p1, p2, p3);
    if (o !== 0) {
      const signoActual = o === 1 ? 1 : -1;
      if (signoGlobal === 0) signoGlobal = signoActual;
      else if (signoGlobal !== signoActual) return false; // Cambió la dirección, es cóncavo
    }
  }
  return true;
};

/**
 * FILTRO DE PROPORCIONALIDAD
 * Evita figuras ridículamente estiradas comparando el lado más largo con el más corto.
 */
export const esProporcional = (vertices: Punto[], tolerancia: number = 2.5): boolean => {
  if (vertices.length < 3) return false;
  let minDist = Infinity;
  let maxDist = 0;

  for (let i = 0; i < vertices.length; i++) {
    const p1 = vertices[i];
    const p2 = vertices[(i + 1) % vertices.length];
    const d = distancia(p1, p2);
    if (d < minDist) minDist = d;
    if (d > maxDist) maxDist = d;
  }
  
  return (maxDist / minDist) <= tolerancia;
};

/**
 * ORDENAMIENTO POR CENTROIDE (Radial Sorting)
 * Ordena un conjunto de nodos en sentido horario basándose en su centro geométrico.
 * Esto garantiza que la figura siempre trace su perímetro exterior sin cruzarse,
 * sin importar el orden en que el usuario hizo clic.
 */
export const ordenarNodosCentroide = (nodos: Nodo[], centerX: number, centerY: number): Nodo[] => {
  if (nodos.length < 3) return nodos;

  // 1. Calcular el Centroide (Promedio de las coordenadas X e Y)
  let cx = 0, cy = 0;
  const puntos = nodos.map(n => {
    const p = obtenerCoords(n, centerX, centerY);
    cx += p.x;
    cy += p.y;
    return { nodo: n, p };
  });
  cx /= nodos.length;
  cy /= nodos.length;

  // 2. Ordenar por ángulo respecto al centroide usando arcotangente
  return puntos.sort((a, b) => {
    const angA = Math.atan2(a.p.y - cy, a.p.x - cx);
    const angB = Math.atan2(b.p.y - cy, b.p.x - cx);
    return angA - angB;
  }).map(item => item.nodo);
};