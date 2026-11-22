/**
 * Midnight Vault — make.fun hand-in program (Node 22, standard library only).
 *
 * The game itself is plain static files under game/ (game/index.html plus
 * its ES modules, no build step, no network request). This program is the
 * entrypoint the grader runs: it copies game/ and screenshots/ from beside
 * this file into the output directory and writes /output/dossier.json, the
 * summary the judge reads, using the vendored make.fun library.
 *
 * Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
 *
 *   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
 *
 * The run is deterministic: the same repository always produces the same
 * bytes, so the grader's two runs agree byte for byte.
 */

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// --- Named limits -----------------------------------------------------------
// These mirror the gate's caps (see the kit's RULES.txt): the dossier text
// budget, at most four screenshots, and the game folder's file/size caps.
const DOSSIER_TEXT_MAX_BYTES = 163840;
const SCREENSHOTS_MAX_COUNT = 4;
const SCREENSHOT_MAX_BYTES = 262144;
const GAME_MAX_FILES = 993;
const GAME_MAX_BYTES = 50331648;
const GAME_PATH_MAX_BYTES = 1000;

// --- Paths -------------------------------------------------------------------
const REPO_ROOT = fileURLToPath(new URL('.', import.meta.url));
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const GAME_DIR = join(REPO_ROOT, 'game');
const SCREENSHOTS_DIR = join(REPO_ROOT, 'screenshots');

// --- Guards ------------------------------------------------------------------
// Fail loudly, before copying anything, when the entry is incomplete.
function requireDirectory(path, label) {
  if (!existsSync(path) || !statSync(path).isDirectory()) {
    throw new Error(`Midnight Vault hand-in refused: ${label} is missing at ${path}`);
  }
}

function requireFile(path, label) {
  if (!existsSync(path) || !statSync(path).isFile()) {
    throw new Error(`Midnight Vault hand-in refused: ${label} is missing at ${path}`);
  }
}

function countGameFiles(dir) {
  let files = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files += countGameFiles(path);
    else if (entry.isFile()) files += 1;
  }
  return files;
}

requireDirectory(GAME_DIR, 'game/');
requireFile(join(GAME_DIR, 'index.html'), 'game/index.html');
requireDirectory(SCREENSHOTS_DIR, 'screenshots/');
const shotCount = readdirSync(SCREENSHOTS_DIR).filter((name) => !name.startsWith('.')).length;
if (shotCount < 3 || shotCount > SCREENSHOTS_MAX_COUNT) {
  throw new Error(`Midnight Vault hand-in refused: expected 3-4 screenshots, found ${shotCount}`);
}
if (countGameFiles(GAME_DIR) > GAME_MAX_FILES) {
  throw new Error('Midnight Vault hand-in refused: game/ holds more than 993 files');
}

// --- Copy and write the dossier ----------------------------------------------
mkdirSync(OUTPUT_DIR, { recursive: true });
cpSync(GAME_DIR, join(OUTPUT_DIR, 'game'), { recursive: true });
mkdirSync(join(OUTPUT_DIR, 'screenshots'), { recursive: true });
cpSync(SCREENSHOTS_DIR, join(OUTPUT_DIR, 'screenshots'), { recursive: true });

const dossierPath = join(OUTPUT_DIR, 'dossier.json');
writeFileSync(
  dossierPath,
  buildDossier(OUTPUT_DIR, {
    text_max_bytes: DOSSIER_TEXT_MAX_BYTES,
    screenshots: { max: SCREENSHOTS_MAX_COUNT, max_bytes: SCREENSHOT_MAX_BYTES },
    game_max_files: GAME_MAX_FILES,
    game_max_bytes: GAME_MAX_BYTES,
    game_path_max_bytes: GAME_PATH_MAX_BYTES,
  }),
);

// --- Post-write verification ---------------------------------------------------
// The grader runs this program twice and demands byte-identical output, so
// confirm the dossier actually landed before reporting success.
const dossierBytes = statSync(dossierPath).size;
if (dossierBytes === 0) {
  throw new Error('Midnight Vault hand-in refused: dossier.json was written empty');
}
const gameFileCount = countGameFiles(join(OUTPUT_DIR, 'game'));
console.log(
  `Midnight Vault handed in: ${gameFileCount} game files, ${shotCount} screenshots, ` +
  `dossier.json ${dossierBytes} bytes -> ${OUTPUT_DIR}`,
);
