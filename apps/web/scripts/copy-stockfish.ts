import { cpSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

/**
 * Copies the Stockfish WASM build into /public so the browser can load it as a
 * Web Worker. "lite-single" (~1.6MB) needs no special COOP/COEP headers.
 */
const FLAVOR = "stockfish-19-lite-single";

const src = join(process.cwd(), "node_modules", "stockfish", "bin");
const dest = join(process.cwd(), "public", "stockfish");

if (!existsSync(src)) {
    console.warn("[copy-stockfish] stockfish package not found, skipping");
    process.exit(0);
}

mkdirSync(dest, { recursive: true });
for (const ext of ["js", "wasm"]) {
    cpSync(join(src, `${FLAVOR}.${ext}`), join(dest, `${FLAVOR}.${ext}`));
}
console.log(`[copy-stockfish] copied ${FLAVOR} to public/stockfish`);
