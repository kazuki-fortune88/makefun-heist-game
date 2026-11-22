// Midnight Vault — canvas rendering.
//
// Draws everything the judge sees: the bank floor plan, the thief, guards
// with their vision cones, sweeping cameras, loot, the alarm meter and the
// title / caught / win screens. No assets are loaded; every shape is drawn
// with the canvas API so the game stays a handful of static files.

import {
  CAMERA_VISION_HALF_ANGLE,
  CAMERA_VISION_RANGE,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  COLORS,
  GUARD_VISION_HALF_ANGLE,
  GUARD_VISION_RANGE,
  HACK_CHANNEL_SECONDS,
  SMOKE_RADIUS,
} from './config.js';
import {
  COVER,
  GETAWAY_CAR,
  KEYCARD,
  ROOMS,
  TERMINAL,
  VAULT_DOOR,
  WALLS,
} from './world.js';
import { SCREENS } from './game.js';

function drawVisionCone(ctx, x, y, angle, range, halfAngle, fill, edge) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - halfAngle, angle + halfAngle);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawGuard(ctx, g) {
  drawVisionCone(ctx, g.x, g.y, g.angle, GUARD_VISION_RANGE, GUARD_VISION_HALF_ANGLE,
    COLORS.guardCone, COLORS.guardConeEdge);
  // Body: red circle, darker ring, facing tick.
  ctx.beginPath();
  ctx.arc(g.x, g.y, 15, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.guard;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#7a1f1f';
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(g.x, g.y);
  ctx.lineTo(g.x + Math.cos(g.angle) * 20, g.y + Math.sin(g.angle) * 20);
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#ffd7d7';
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(g.state === 'chase' ? '!' : g.name[0], g.x, g.y - 20);
}

function drawCamera(ctx, camera, angle, disabled) {
  if (!disabled) {
    drawVisionCone(ctx, camera.x, camera.y, angle, CAMERA_VISION_RANGE,
      CAMERA_VISION_HALF_ANGLE, COLORS.cameraCone, COLORS.cameraConeEdge);
  }
  // Wall mount + lens.
  ctx.beginPath();
  ctx.arc(camera.x, camera.y, 9, 0, Math.PI * 2);
  ctx.fillStyle = disabled ? '#5a6478' : COLORS.camera;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#20242e';
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(camera.x, camera.y);
  ctx.lineTo(camera.x + Math.cos(angle) * 14, camera.y + Math.sin(angle) * 14);
  ctx.lineWidth = 3;
  ctx.strokeStyle = disabled ? '#5a6478' : '#fff3c4';
  ctx.stroke();
  if (disabled) {
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('OFF', camera.x, camera.y - 14);
  }
}

function drawLoot(ctx, item, now) {
  const bob = Math.sin(now * 3 + item.x) * 2;
  const y = item.y + bob;
  // Glow ring so loot reads at a glance.
  ctx.beginPath();
  ctx.arc(item.x, y, 20, 0, Math.PI * 2);
  ctx.strokeStyle = COLORS.lootRing;
  ctx.lineWidth = 2;
  ctx.stroke();
  // Diamond gem.
  ctx.beginPath();
  ctx.moveTo(item.x, y - 11);
  ctx.lineTo(item.x + 9, y);
  ctx.lineTo(item.x, y + 11);
  ctx.lineTo(item.x - 9, y);
  ctx.closePath();
  ctx.fillStyle = COLORS.loot;
  ctx.fill();
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(item.label, item.x, y + 30);
  ctx.fillStyle = COLORS.loot;
  ctx.fillText(`$${item.value.toLocaleString('en-US')}`, item.x, y + 43);
}

function drawThief(ctx, thief) {
  ctx.beginPath();
  ctx.arc(thief.x, thief.y, 14, 0, Math.PI * 2);
  ctx.fillStyle = thief.sneaking ? COLORS.thiefSneak : COLORS.thief;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#12351d';
  ctx.stroke();
  // Facing tick + mask stripe.
  ctx.beginPath();
  ctx.moveTo(thief.x, thief.y);
  ctx.lineTo(thief.x + Math.cos(thief.angle) * 19, thief.y + Math.sin(thief.angle) * 19);
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#eafff0';
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(thief.x, thief.y, 6, 0, Math.PI * 2);
  ctx.fillStyle = '#12351d';
  ctx.fill();
  if (thief.sneaking) {
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SNEAK', thief.x, thief.y - 20);
  }
}

function drawHud(ctx, game) {
  const s = game.state;
  const minutes = Math.floor(s.timeLeft / 60);
  const seconds = Math.floor(s.timeLeft % 60).toString().padStart(2, '0');
  const label = game.alarmLabel();
  const color = game.alarmColor();

  ctx.fillStyle = COLORS.hudBack;
  ctx.fillRect(0, 0, CANVAS_WIDTH, 46);

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = COLORS.loot;
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(`LOOT  $${s.loot.toLocaleString('en-US')}`, 16, 31);

  ctx.fillStyle = s.timeLeft < 60 ? COLORS.alarmLockdown : COLORS.text;
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(`TIME  ${minutes}:${seconds}`, 250, 31);

  // Alarm meter: label + bar + percentage + status word.
  ctx.fillStyle = color;
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('ALARM', 430, 30);
  ctx.fillStyle = '#2a3040';
  ctx.fillRect(500, 14, 170, 18);
  ctx.fillStyle = color;
  ctx.fillRect(500, 14, 170 * (s.alarm / 100), 18);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(500, 14, 170, 18);
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText(`${Math.round(s.alarm)}`, 678, 30);
  ctx.fillStyle = color;
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText(label, 712, 30);

  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText(`SMOKE x${s.smokeLeft}`, 840, 30);
  ctx.fillText(s.hasKeycard ? 'KEYCARD ✓' : 'KEYCARD —', 960, 30);
  ctx.fillStyle = s.camerasHacked ? COLORS.keycard : COLORS.muted;
  ctx.fillText(s.camerasHacked ? 'CAMS OFF' : 'CAMS ON', 1120, 30);

  // Controls hint along the bottom.
  ctx.fillStyle = 'rgba(8, 10, 18, 0.75)';
  ctx.fillRect(0, CANVAS_HEIGHT - 24, CANVAS_WIDTH, 24);
  ctx.fillStyle = COLORS.muted;
  ctx.font = '13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(
    'WASD / arrows — move    SHIFT — sneak    SPACE / Q — smoke bomb (click to throw)    E — hack terminal    M — mute',
    CANVAS_WIDTH / 2, CANVAS_HEIGHT - 8,
  );
}

function drawWorld(ctx, game, now) {
  const s = game.state;

  // Floors.
  for (const room of ROOMS) {
    ctx.fillStyle = COLORS[room.fill];
    ctx.fillRect(room.x, room.y, room.w, room.h);
    ctx.fillStyle = 'rgba(238, 242, 255, 0.35)';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(room.name, room.x + 10, room.y + 20);
  }

  // Vault door: amber when open, steel when shut. (No text: the door is
  // only 12px wide; the VAULT room label already names the room.)
  ctx.fillStyle = game.vaultDoorOpen() ? COLORS.keycard : '#6b7686';
  ctx.fillRect(VAULT_DOOR.x, VAULT_DOOR.y, VAULT_DOOR.w, VAULT_DOOR.h);

  // Walls.
  for (const w of WALLS) {
    ctx.fillStyle = COLORS.wall;
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = COLORS.wallTop;
    ctx.fillRect(w.x, w.y, w.w, 3);
  }

  // Cover blocks.
  for (const block of COVER) {
    ctx.fillStyle = COLORS.cover;
    ctx.fillRect(block.x, block.y, block.w, block.h);
    ctx.fillStyle = COLORS.coverTop;
    ctx.fillRect(block.x, block.y, block.w, 4);
    ctx.fillStyle = 'rgba(238, 242, 255, 0.4)';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(block.label, block.x + block.w / 2, block.y + block.h / 2 + 4);
  }

  // Getaway car on the street.
  const car = GETAWAY_CAR;
  ctx.beginPath();
  ctx.arc(car.x, car.y, car.radius, 0, Math.PI * 2);
  ctx.strokeStyle = COLORS.car;
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 6]);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = COLORS.car;
  ctx.fillRect(car.x - 34, car.y - 15, 68, 30);
  ctx.fillStyle = COLORS.carGlass;
  ctx.fillRect(car.x - 8, car.y - 12, 18, 24);
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('GETAWAY', car.x, car.y - 60);

  // Keycard.
  if (!s.keycardTaken) {
    ctx.beginPath();
    ctx.arc(KEYCARD.x, KEYCARD.y, 12, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.keycard;
    ctx.fill();
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText('KEYCARD', KEYCARD.x, KEYCARD.y + 26);
  }

  // Hack terminal.
  ctx.fillStyle = s.camerasHacked ? '#3a4a44' : COLORS.terminal;
  ctx.fillRect(TERMINAL.x - 16, TERMINAL.y - 10, 32, 20);
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(s.camerasHacked ? 'HACKED' : 'TERMINAL (E)', TERMINAL.x, TERMINAL.y + 26);
  if (s.hackProgress > 0) {
    ctx.fillStyle = '#2a3040';
    ctx.fillRect(TERMINAL.x - 20, TERMINAL.y - 26, 40, 6);
    ctx.fillStyle = COLORS.keycard;
    ctx.fillRect(TERMINAL.x - 20, TERMINAL.y - 26, 40 * (s.hackProgress / HACK_CHANNEL_SECONDS), 6);
  }

  // Loot.
  for (const item of s.lootItems) {
    if (!item.taken) drawLoot(ctx, item, now);
  }

  // Smoke clouds.
  for (const smoke of s.smokes) {
    ctx.beginPath();
    ctx.arc(smoke.x, smoke.y, SMOKE_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.smoke;
    ctx.fill();
  }

  // Cameras (cones under the guards so cones never hide the thief).
  for (const camera of s.cameras) {
    const disabled = now < camera.disabledUntil;
    drawCamera(ctx, camera, game.cameraAngle(camera, now), disabled);
  }

  // Guards, then the thief on top.
  for (const g of s.guards) drawGuard(ctx, g);
  drawThief(ctx, s.thief);

  // Floating score labels.
  for (const f of s.flashes) {
    ctx.globalAlpha = Math.min(1, f.left);
    ctx.fillStyle = COLORS.loot;
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(f.text, f.x, f.y);
    ctx.globalAlpha = 1;
  }

  // "SEEN" warning + lockdown flash.
  if (s.seenNow && s.screen === SCREENS.PLAYING) {
    ctx.fillStyle = COLORS.alarmAlert;
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`SPOTTED BY ${s.seenBy}!`, CANVAS_WIDTH / 2, 84);
  }
  if (s.lockdownLeft > 0) {
    const blink = Math.floor(now * 4) % 2 === 0;
    if (blink) {
      ctx.fillStyle = 'rgba(255, 93, 93, 0.12)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }
    ctx.fillStyle = COLORS.alarmLockdown;
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`LOCKDOWN — ${Math.ceil(s.lockdownLeft)}s`, CANVAS_WIDTH / 2, 120);
  }
}

function drawTitle(ctx) {
  ctx.fillStyle = '#0b0e1a';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  // Decorative vault door.
  ctx.strokeStyle = '#39415e';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(CANVAS_WIDTH / 2, 300, 130, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(CANVAS_WIDTH / 2, 300, 100, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = COLORS.loot;
  ctx.beginPath();
  ctx.arc(CANVAS_WIDTH / 2, 300, 26, 0, Math.PI * 2);
  ctx.fill();

  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.loot;
  ctx.font = 'bold 64px sans-serif';
  ctx.fillText('MIDNIGHT VAULT', CANVAS_WIDTH / 2, 130);
  ctx.fillStyle = COLORS.text;
  ctx.font = '22px sans-serif';
  ctx.fillText('One thief. One bank. Five minutes to dawn.', CANVAS_WIDTH / 2, 175);
  ctx.fillStyle = COLORS.muted;
  ctx.font = '17px sans-serif';
  ctx.fillText('Grab the keycard, crack the vault, dodge the cones — and reach the getaway car.', CANVAS_WIDTH / 2, 480);
  ctx.fillText('Cameras can be hacked at the security terminal. Smoke bombs buy you seconds.', CANVAS_WIDTH / 2, 508);
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 19px sans-serif';
  ctx.fillText('WASD move · SHIFT sneak · SPACE smoke bomb · E hack · Click to throw smoke', CANVAS_WIDTH / 2, 560);
  ctx.fillStyle = COLORS.loot;
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText('Press ENTER or click to start the heist', CANVAS_WIDTH / 2, 620);
}

function drawCaught(ctx, game) {
  ctx.fillStyle = 'rgba(10, 4, 6, 0.78)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.alarmLockdown;
  ctx.font = 'bold 56px sans-serif';
  ctx.fillText('BUSTED!', CANVAS_WIDTH / 2, 300);
  ctx.fillStyle = COLORS.text;
  ctx.font = '22px sans-serif';
  ctx.fillText(game.state.caughtReason, CANVAS_WIDTH / 2, 350);
  ctx.fillStyle = COLORS.loot;
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText(`Loot carried: $${game.state.loot.toLocaleString('en-US')}`, CANVAS_WIDTH / 2, 400);
  ctx.fillStyle = COLORS.muted;
  ctx.font = '18px sans-serif';
  ctx.fillText('Press R to try again', CANVAS_WIDTH / 2, 460);
}

function drawWin(ctx, game) {
  ctx.fillStyle = 'rgba(4, 12, 8, 0.78)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.thief;
  ctx.font = 'bold 56px sans-serif';
  ctx.fillText('CLEAN GETAWAY!', CANVAS_WIDTH / 2, 280);
  ctx.fillStyle = COLORS.loot;
  ctx.font = 'bold 30px sans-serif';
  ctx.fillText(game.state.winRating, CANVAS_WIDTH / 2, 340);
  ctx.fillStyle = COLORS.text;
  ctx.font = '20px sans-serif';
  ctx.fillText(`Vaults cracked, cones dodged, dawn outrun. The crew eats tonight.`, CANVAS_WIDTH / 2, 390);
  ctx.fillStyle = COLORS.muted;
  ctx.font = '18px sans-serif';
  ctx.fillText('Press R to run it back', CANVAS_WIDTH / 2, 450);
}

export function render(ctx, game, now) {
  const s = game.state;
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  if (s.screen === SCREENS.TITLE) {
    drawTitle(ctx);
    return;
  }
  drawWorld(ctx, game, now);
  drawHud(ctx, game);
  if (s.screen === SCREENS.CAUGHT) drawCaught(ctx, game);
  if (s.screen === SCREENS.WIN) drawWin(ctx, game);
}
