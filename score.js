// ─────────────────────────────────────────────────────────────
//  CALIFICACIÓN POR METACOMPETENCIAS Y COMPETENCIAS
//  pos: reactivos positivos (puntaje directo 1–5)
//  neg: reactivos negativos (se invierten: 5→1, 4→2, 3→3, 2→4, 1→5)
//  Cada competencia suma sus reactivos (ya invertidos donde aplica).
//  Cada metacompetencia suma sus competencias.
// ─────────────────────────────────────────────────────────────
import { interpretar } from './interpretaciones.js';

export const META = [
  {
    name: 'Metacompetencia intelectual',
    comps: [
      { name: 'Capacidad de análisis', pos: [1, 21, 41, 61, 81, 101, 121, 141] },
      { name: 'Capacidad para resolver problemas', pos: [2, 22, 42, 62, 82, 102, 122, 142] },
      { name: 'Proactividad', pos: [3, 23, 43, 63, 83, 103, 123, 143] }
    ]
  },
  {
    name: 'Metacompetencia emocional',
    comps: [
      { name: 'Autocontrol', neg: [4, 24, 44, 64, 84, 104, 124, 144] },
      { name: 'Capacidad para afrontar la presión', pos: [5, 25, 45, 65, 85, 145], neg: [105, 125] }
    ]
  },
  {
    name: 'Metacompetencia social',
    comps: [
      { name: 'Relaciones sociales', pos: [6, 26, 46, 66, 86, 106, 126, 146] },
      { name: 'Colaboración', pos: [7, 27, 47, 67, 87, 107, 127, 147] },
      { name: 'Comunicación eficaz', pos: [8, 28, 48, 68, 88, 108, 128, 148] }
    ]
  },
  {
    name: 'Metacompetencia ética',
    comps: [
      { name: 'Valores', pos: [29, 49, 69, 89, 109, 149], neg: [9, 129] },
      { name: 'Responsabilidad', pos: [10, 30, 50, 70, 90, 110, 130, 150] }
    ]
  },
  {
    name: 'Metacompetencia emprendedora',
    comps: [
      { name: 'Orientación al cambio', pos: [11, 31, 51, 71, 91, 111, 131], neg: [151] },
      { name: 'Emprendimiento', pos: [12, 32, 52, 72, 92, 112, 132, 152] },
      { name: 'Creatividad', pos: [13, 33, 53, 73, 93, 113, 133, 153] }
    ]
  },
  {
    name: 'Metacompetencia directiva',
    comps: [
      { name: 'Persuasión', pos: [14, 34, 54, 74, 94, 114, 134, 154] },
      { name: 'Liderazgo', pos: [15, 35, 55, 75, 95, 115, 135, 155] },
      { name: 'Trabajo en equipo', pos: [16, 36, 56, 76, 96, 116, 136, 156] }
    ]
  },
  {
    name: 'Metacompetencia administrativa',
    comps: [
      { name: 'Planificación y organización', pos: [17, 37, 57, 77, 97, 117, 137, 157] },
      { name: 'Capacidad de aprendizaje', pos: [18, 38, 58, 78, 98, 118, 138, 158] }
    ]
  },
  {
    name: 'Metacompetencia para el alto desempeño',
    comps: [
      { name: 'Orientación al logro', pos: [19, 39, 59, 79, 99, 119, 139, 159] },
      { name: 'Iniciativa', pos: [20, 40, 60, 80, 100, 120, 140, 160] }
    ]
  }
];

// Todos los reactivos negativos (para mostrar el puntaje ya corregido)
export const NEGATIVOS = new Set(META.flatMap((m) => m.comps.flatMap((c) => c.neg || [])));
export const POSITIVOS = new Set(META.flatMap((m) => m.comps.flatMap((c) => c.pos || [])));

// ─────────────────────────────────────────────────────────────
//  NIVELES (a partir del percentil)
//  1-9 → nivel 1 · 10-24 → 2 · 25-75 → 3 · 76-90 → 4 · 91-99 → 5
// ─────────────────────────────────────────────────────────────
export function nivelDePercentil(p) {
  if (p == null || Number.isNaN(Number(p))) return null;
  if (p <= 9) return 1;
  if (p <= 24) return 2;
  if (p <= 75) return 3;
  if (p <= 90) return 4;
  return 5;
}
export const LEYENDA_NIVELES = 'Niveles: 1 y 2 = relativamente bajo · 3 = intermedio · 4 y 5 = relativamente alto. La interpretación específica debe respetar la descripción de cada nivel del manual.';
export const NIVEL_TEXTO = {
  1: 'Nivel 1 (relativamente bajo)',
  2: 'Nivel 2 (relativamente bajo)',
  3: 'Nivel 3 (intermedio)',
  4: 'Nivel 4 (relativamente alto)',
  5: 'Nivel 5 (relativamente alto)'
};

// ─────────────────────────────────────────────────────────────
//  BAREMOS: puntaje directo → percentil (PENDIENTE: tomar del manual)
//  Los mismos 5 niveles se usan para las 20 competencias y las 8 metacompetencias.
//  Formato, por nombre de competencia o de metacompetencia:
//    'Capacidad de análisis': { 8: 1, 9: 1, 10: 2, ..., 40: 99 }
//    'Metacompetencia intelectual': { 24: 1, 25: 1, ..., 120: 99 }
//  Mientras no se llenen, la app muestra el puntaje sin percentil ni nivel.
// ─────────────────────────────────────────────────────────────
export const BAREMOS = {};

function conPercentil(nombre, sum) {
  const tabla = BAREMOS[nombre];
  const percentil = tabla && tabla[sum] != null ? tabla[sum] : null;
  const nivel = nivelDePercentil(percentil);
  return { percentil, nivel };
}

// ─────────────────────────────────────────────────────────────
//  ÍNDICES DE VALIDEZ
//  Inconsistencia: suma de diferencias absolutas de 10 pares de reactivos
//                  (PENDIENTE: indicar los 10 pares, ej. [[1, 41], [2, 42], ...])
//                  Inválida si la suma es 8 o más.
//  Impresión positiva: respuestas 5 en reactivos positivos + respuestas 1 en
//                  reactivos negativos. Inválida si es 83 o más.
//  Involucramiento: cantidad de respuestas 3. Inválida si es 41 o más.
// ─────────────────────────────────────────────────────────────
export const PARES_INCONSISTENCIA = [];

export const LIMITES = { inconsistencia: 8, impresion: 83, involucramiento: 41 };

export function indices(answers) {
  const vals = answers.map(Number);
  let impresion = 0;
  let involucramiento = 0;
  vals.forEach((v, i) => {
    const n = i + 1;
    if (v === 5 && POSITIVOS.has(n)) impresion++;
    if (v === 1 && NEGATIVOS.has(n)) impresion++;
    if (v === 3) involucramiento++;
  });

  const pares = PARES_INCONSISTENCIA;
  const inconfigurada = pares.length !== 10;
  const incon = inconfigurada
    ? null
    : pares.reduce((a, [x, y]) => a + Math.abs(vals[x - 1] - vals[y - 1]), 0);

  const res = {
    inconsistencia: { valor: incon, limite: LIMITES.inconsistencia, pendiente: inconfigurada, invalida: incon !== null && incon >= LIMITES.inconsistencia },
    impresion: { valor: impresion, limite: LIMITES.impresion, pendiente: false, invalida: impresion >= LIMITES.impresion },
    involucramiento: { valor: involucramiento, limite: LIMITES.involucramiento, pendiente: false, invalida: involucramiento >= LIMITES.involucramiento }
  };
  res.invalida = Object.values(res).some((x) => x.invalida);
  res.pendiente = res.inconsistencia.pendiente;
  return res;
}

export function calcular(answers) {
  const vals = answers.map(Number);
  const puntaje = (n, neg) => (neg ? 6 - vals[n - 1] : vals[n - 1]);

  const metas = META.map((m) => {
    const comps = m.comps.map((c) => {
      const pts = [
        ...(c.pos || []).map((n) => puntaje(n, false)),
        ...(c.neg || []).map((n) => puntaje(n, true))
      ];
      const sum = pts.reduce((a, b) => a + b, 0);
      return { name: c.name, sum, max: pts.length * 5, n: pts.length, avg: sum / pts.length, ...conPercentil(c.name, sum), ...interpretar(c.name, sum) };
    });
    const sum = comps.reduce((a, c) => a + c.sum, 0);
    const n = comps.reduce((a, c) => a + c.n, 0);
    return { name: m.name, comps, sum, max: n * 5, n, avg: sum / n, ...conPercentil(m.name, sum) };
  });

  const total = metas.reduce((a, m) => a + m.sum, 0);
  const n = metas.reduce((a, m) => a + m.n, 0);
  return { total, max: n * 5, avg: total / n, metas, indices: indices(vals) };
}
