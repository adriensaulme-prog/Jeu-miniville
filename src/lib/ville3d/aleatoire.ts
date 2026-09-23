/**
 * Hasard déterministe : même graine => même ville, toujours. Porté
 * depuis docs/prototypes/prototype-ville-3d.html (hashStr/rngFrom).
 * Pur, testable : deux appels avec la même graine produisent exactement
 * la même suite de nombres.
 */

export function hashStr(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export type RNG = () => number;

export function rngFrom(s: string): RNG {
  let a = hashStr(s);
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick<T>(r: RNG, arr: readonly T[]): T {
  return arr[Math.floor(r() * arr.length) % arr.length];
}

export function rr(r: RNG, a: number, b: number): number {
  return a + (b - a) * r();
}
