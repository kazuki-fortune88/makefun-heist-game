// Midnight Vault — bootstrap and frame loop.
//
// Wires the canvas, input, audio, game state and renderer together, runs the
// fixed-step update loop, and stages `?shot=` scenes for screenshots. The
// whole game is static files: no network request is ever made.

import { CANVAS_HEIGHT, CANVAS_WIDTH } from './config.js';
import { createAudio } from './audio.js';
import { createGame } from './game.js';
import { createInput } from './input.js';
import { render } from './render.js';
import { shotSummary, stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

const input = createInput(canvas);
const audio = createAudio();
const game = createGame();

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
if (shot) {
  stageShot(game, shot);
  document.title = `Midnight Vault — ${shotSummary(game)}`;
}

let last = performance.now();

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  // A staged screenshot scene stays frozen; live play advances normally.
  if (!game.state.frozen) {
    game.update(dt, input, audio);
  }
  render(ctx, game, now / 1000);
  input.endFrame();
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
