// Deterministic spin-text engine.
//
// Cold-email teams generate thousands of unique variants from one skeleton using
// "spintax": {a|b|c} markers that each expand to one option. We do the same, but
// drive the choices with a SEEDED pseudo-random generator. That makes output
// stable per job (the same job always yields the same email — no surprises when a
// draft is previewed then sent) while still being richly varied across jobs.

/** FNV-1a string hash → 32-bit unsigned seed. */
export function hashSeed(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** mulberry32 — tiny, fast, well-distributed deterministic PRNG. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type RNG = () => number;

/** Pick one element from a non-empty array using the seeded RNG. */
export function pick<T>(arr: readonly T[], rng: RNG): T {
  return arr[Math.floor(rng() * arr.length) % arr.length];
}

/**
 * Resolve a spintax template. Handles arbitrary nesting by repeatedly collapsing
 * the innermost {…|…} group (which, by definition, contains no braces) until none
 * remain. Each expansion consumes exactly one RNG draw, so a given seed maps to a
 * single deterministic output.
 */
export function spin(template: string, rng: RNG): string {
  const innermost = /\{([^{}]*)\}/;
  let out = template;
  let guard = 0;
  while (innermost.test(out) && guard++ < 10000) {
    out = out.replace(innermost, (_m, inner: string) => {
      const opts = inner.split("|");
      return opts[Math.floor(rng() * opts.length) % opts.length];
    });
  }
  // Tidy any double spaces / spaces before punctuation introduced by empty options.
  return out.replace(/[ \t]{2,}/g, " ").replace(/\s+([,.!?;:])/g, "$1").trim();
}
