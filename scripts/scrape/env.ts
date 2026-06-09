// Minimal .env loader for the standalone scraper (tsx doesn't auto-load env).
// Reads .env.local then .env, setting any keys not already in process.env.
import { readFileSync } from "node:fs";
import path from "node:path";

function loadFile(file: string) {
  let text: string;
  try { text = readFileSync(file, "utf8"); } catch { return; }
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (!m) continue;
    const key = m[1];
    let val = m[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}

export function loadEnv() {
  const root = process.cwd();
  loadFile(path.join(root, ".env.local"));
  loadFile(path.join(root, ".env"));
}
