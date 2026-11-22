// Midnight Vault — game state and update logic.
//
// Owns the whole simulation: the thief, the guards' patrols and chases, the
// sweeping cameras, the alarm meter and lockdowns, loot, the keycard, the
// camera hack, smoke bombs, the five-minute clock and the win / caught
// screens. Rendering lives in render.js; this file only moves numbers.

import {
  ALARM_CAMERA_RATE,
  ALARM_DECAY_RATE,
  ALARM_GUARD_RATE,
  ALARM_MAX,
  ALARM_SNEAK_FACTOR,
  CAMERA_DISABLED_SECONDS,
  CAMERA_SWEEP_SPEED,
  CAMERA_VISION_HALF_ANGLE,
  CAMERA_VISION_RANGE,
  COLORS,
  GUARD_CATCH_RADIUS,
  GUARD_CHASE_SPEED,
  GUARD_PATROL_SPEED,
  GUARD_VISION_HALF_ANGLE,
  GUARD_VISION_RANGE,
  HACK_CHANNEL_SECONDS,
  HACK_RANGE,
  LOCKDOWN_RESET_ALARM,
  LOCKDOWN_SECONDS,
  PLAYER_RADIUS,
  PLAYER_SNEAK_SPEED,
  PLAYER_WALK_SPEED,
  SMOKE_DURATION_SECONDS,
  SMOKE_RADIUS,
  SMOKE_START_COUNT,
  TIME_LIMIT_SECONDS,
  WIN_MIN_LOOT,
} from './config.js';
import {
  angleDifference,
  collidesWithWorld,
  distance,
  freshCameras,
  freshGuards,
  freshLoot,
  GETAWAY_CAR,
  hasLineOfSight,
  KEYCARD,
  TERMINAL,
  VAULT_DOOR,
} from './world.js';

export const SCREENS = {
  TITLE: 'title',
  PLAYING: 'playing',
  CAUGHT: 'caught',
  WIN: 'win',
};

export function createGame() {
  const state = {
    screen: SCREENS.TITLE,
    timeLeft: TIME_LIMIT_SECONDS,
    elapsed: 0,
    loot: 0,
    lootTaken: 0,
    alarm: 0,
    lockdownLeft: 0,
    smokeLeft: SMOKE_START_COUNT,
    hasKeycard: false,
    camerasHacked: false,
    hackProgress: 0,
    caughtReason: '',
    winRating: '',
    finalTime: 0,
    thief: { x: 620, y: 685, angle: -Math.PI / 2, sneaking: false, moving: false },
    guards: freshGuards(),
    cameras: freshCameras(),
    lootItems: freshLoot(),
    keycardTaken: false,
    smokes: [], // { x, y, left }
    flashes: [], // floating "+$1,200" labels: { x, y, text, left }
    alarmWasFull: false,
    seenNow: false,
    seenBy: '',
  };

  function reset() {
    state.screen = SCREENS.PLAYING;
    state.timeLeft = TIME_LIMIT_SECONDS;
    state.elapsed = 0;
    state.loot = 0;
    state.lootTaken = 0;
    state.alarm = 0;
    state.lockdownLeft = 0;
    state.smokeLeft = SMOKE_START_COUNT;
    state.hasKeycard = false;
    state.camerasHacked = false;
    state.hackProgress = 0;
    state.caughtReason = '';
    state.winRating = '';
    state.finalTime = 0;
    state.thief = { x: 620, y: 685, angle: -Math.PI / 2, sneaking: false, moving: false };
    state.guards = freshGuards();
    state.cameras = freshCameras();
    state.lootItems = freshLoot();
    state.keycardTaken = false;
    state.smokes = [];
    state.flashes = [];
    state.alarmWasFull = false;
    state.seenNow = false;
    state.seenBy = '';
  }

  function vaultDoorOpen() {
    return state.hasKeycard && state.lockdownLeft <= 0;
  }

  function inSmoke(x, y) {
    return state.smokes.some((s) => distance(x, y, s.x, s.y) < SMOKE_RADIUS);
  }

  // Can `watcher` at (wx, wy) facing `angle` see the thief?
  function canSee(wx, wy, angle, range, halfAngle) {
    const t = state.thief;
    const d = distance(wx, wy, t.x, t.y);
    if (d > range) return false;
    const toThief = Math.atan2(t.y - wy, t.x - wx);
    if (Math.abs(angleDifference(toThief, angle)) > halfAngle) return false;
    if (inSmoke(t.x, t.y)) return false;
    if (inSmoke(wx, wy)) return false;
    return hasLineOfSight(wx, wy, t.x, t.y);
  }

  function cameraAngle(camera, now) {
    return camera.baseAngle + Math.sin(now * CAMERA_SWEEP_SPEED + camera.phase) * camera.sweep;
  }

  function moveThief(move, dt) {
    const t = state.thief;
    const speed = t.sneaking ? PLAYER_SNEAK_SPEED : PLAYER_WALK_SPEED;
    const nx = t.x + move.x * speed * dt;
    const ny = t.y + move.y * speed * dt;
    // Move axis by axis so the thief slides along walls instead of sticking.
    if (!collidesWithWorld(nx, t.y, PLAYER_RADIUS) && !vaultDoorBlocks(nx, t.y)) t.x = nx;
    if (!collidesWithWorld(t.x, ny, PLAYER_RADIUS) && !vaultDoorBlocks(t.x, ny)) t.y = ny;
    t.x = Math.max(PLAYER_RADIUS + 2, Math.min(1280 - PLAYER_RADIUS - 2, t.x));
    t.y = Math.max(PLAYER_RADIUS + 2, Math.min(720 - PLAYER_RADIUS - 2, t.y));
    if (move.x !== 0 || move.y !== 0) {
      t.angle = Math.atan2(move.y, move.x);
      t.moving = true;
    } else {
      t.moving = false;
    }
  }

  // The vault door is a solid wall until the keycard opens it.
  function vaultDoorBlocks(x, y) {
    if (vaultDoorOpen()) return false;
    const r = PLAYER_RADIUS;
    const nx = Math.max(VAULT_DOOR.x, Math.min(x, VAULT_DOOR.x + VAULT_DOOR.w));
    const ny = Math.max(VAULT_DOOR.y, Math.min(y, VAULT_DOOR.y + VAULT_DOOR.h));
    return (x - nx) ** 2 + (y - ny) ** 2 < r * r;
  }

  function updateGuards(dt) {
    for (const g of state.guards) {
      const hunting = state.lockdownLeft > 0 || state.alarm > 70;
      if (hunting) {
        // Chase the thief's last known position: straight at them.
        g.state = 'chase';
        const dx = state.thief.x - g.x;
        const dy = state.thief.y - g.y;
        const d = Math.hypot(dx, dy) || 1;
        const step = GUARD_CHASE_SPEED * dt;
        const nx = g.x + (dx / d) * step;
        const ny = g.y + (dy / d) * step;
        if (!collidesWithWorld(nx, g.y, 15)) g.x = nx;
        if (!collidesWithWorld(g.x, ny, 15)) g.y = ny;
        g.angle = Math.atan2(dy, dx);
        continue;
      }
      g.state = 'patrol';
      if (g.pause > 0) {
        g.pause -= dt;
        continue;
      }
      const target = g.path[g.waypoint];
      const dx = target[0] - g.x;
      const dy = target[1] - g.y;
      const d = Math.hypot(dx, dy);
      if (d < 6) {
        g.waypoint = (g.waypoint + 1) % g.path.length;
        g.pause = 0.6; // look around at each corner
        continue;
      }
      const step = GUARD_PATROL_SPEED * dt;
      g.x += (dx / d) * step;
      g.y += (dy / d) * step;
      g.angle = Math.atan2(dy, dx);
    }
  }

  function updateAlarm(dt, audio) {
    let seen = false;
    let seenBy = '';
    for (const g of state.guards) {
      if (canSee(g.x, g.y, g.angle, GUARD_VISION_RANGE, GUARD_VISION_HALF_ANGLE)) {
        seen = true;
        seenBy = `GUARD ${g.name}`;
        break;
      }
    }
    if (!seen) {
      for (const c of state.cameras) {
        if (state.elapsed < c.disabledUntil) continue;
        if (canSee(c.x, c.y, cameraAngle(c, state.elapsed), CAMERA_VISION_RANGE, CAMERA_VISION_HALF_ANGLE)) {
          seen = true;
          seenBy = c.name;
          break;
        }
      }
    }
    state.seenNow = seen;
    state.seenBy = seenBy;

    if (state.lockdownLeft > 0) {
      state.lockdownLeft -= dt;
      if (state.lockdownLeft <= 0) {
        state.lockdownLeft = 0;
        state.alarm = LOCKDOWN_RESET_ALARM;
      }
      return;
    }

    if (seen) {
      const rate = seenBy.startsWith('GUARD') ? ALARM_GUARD_RATE : ALARM_CAMERA_RATE;
      const factor = state.thief.sneaking ? ALARM_SNEAK_FACTOR : 1;
      state.alarm += rate * factor * dt;
      if (state.alarm >= ALARM_MAX) {
        state.alarm = ALARM_MAX;
        state.lockdownLeft = LOCKDOWN_SECONDS;
        audio.alarm();
      }
    } else {
      state.alarm = Math.max(0, state.alarm - ALARM_DECAY_RATE * dt);
    }
  }

  function collectLoot(audio) {
    const t = state.thief;
    for (const item of state.lootItems) {
      if (item.taken) continue;
      if (distance(t.x, t.y, item.x, item.y) < 34) {
        item.taken = true;
        state.loot += item.value;
        state.lootTaken += 1;
        state.flashes.push({ x: item.x, y: item.y - 18, text: `+$${item.value.toLocaleString('en-US')}`, left: 1.4 });
        audio.pickup();
      }
    }
    if (!state.keycardTaken && distance(t.x, t.y, KEYCARD.x, KEYCARD.y) < 34) {
      state.keycardTaken = true;
      state.hasKeycard = true;
      state.flashes.push({ x: KEYCARD.x, y: KEYCARD.y - 18, text: 'KEYCARD!', left: 1.4 });
      audio.keycard();
    }
  }

  // Press E near the terminal to start the hack, then stand still for two
  // seconds while it runs. Walking away cancels the channel.
  function tryHack(dt, audio, interactPressed) {
    const t = state.thief;
    const nearTerminal = distance(t.x, t.y, TERMINAL.x, TERMINAL.y) < HACK_RANGE;
    if (state.camerasHacked) {
      state.hackProgress = 0;
      return;
    }
    if (interactPressed && nearTerminal && state.hackProgress === 0) {
      state.hackProgress = 0.001; // channel started
    }
    if (state.hackProgress > 0) {
      if (!nearTerminal) {
        state.hackProgress = 0; // walked away: channel cancelled
        return;
      }
      state.hackProgress += dt;
      if (state.hackProgress >= HACK_CHANNEL_SECONDS) {
        state.camerasHacked = true;
        state.hackProgress = 0;
        for (const c of state.cameras) c.disabledUntil = state.elapsed + CAMERA_DISABLED_SECONDS;
        state.flashes.push({ x: TERMINAL.x, y: TERMINAL.y - 18, text: 'CAMERAS OFF 25s', left: 1.8 });
        audio.hackDone();
      }
    }
  }

  function throwSmoke(input, audio) {
    if (state.smokeLeft <= 0) return;
    const mouse = input.mouse;
    let tx = mouse.x;
    let ty = mouse.y;
    if (!mouse.clicked) {
      // Keyboard throw: drop it at the thief's feet.
      tx = state.thief.x;
      ty = state.thief.y;
    }
    state.smokes.push({ x: tx, y: ty, left: SMOKE_DURATION_SECONDS });
    state.smokeLeft -= 1;
    audio.smoke();
  }

  function checkCaught(audio) {
    for (const g of state.guards) {
      if (distance(g.x, g.y, state.thief.x, state.thief.y) < GUARD_CATCH_RADIUS) {
        state.screen = SCREENS.CAUGHT;
        state.caughtReason = `Caught by ${g.name} — a guard got hands on you.`;
        audio.caught();
        return;
      }
    }
    if (state.timeLeft <= 0) {
      state.screen = SCREENS.CAUGHT;
      state.caughtReason = 'Out of time — the police arrived at dawn.';
      audio.caught();
    }
  }

  function checkWin(audio) {
    const t = state.thief;
    if (state.loot < WIN_MIN_LOOT) return;
    if (distance(t.x, t.y, GETAWAY_CAR.x, GETAWAY_CAR.y) < GETAWAY_CAR.radius) {
      state.screen = SCREENS.WIN;
      state.finalTime = TIME_LIMIT_SECONDS - state.timeLeft;
      const minutes = Math.floor(state.finalTime / 60);
      const seconds = Math.floor(state.finalTime % 60).toString().padStart(2, '0');
      state.winRating =
        state.loot >= 8000 ? `LEGENDARY — $${state.loot.toLocaleString('en-US')} in ${minutes}:${seconds}`
        : state.loot >= 4000 ? `CLEAN GETAWAY — $${state.loot.toLocaleString('en-US')} in ${minutes}:${seconds}`
        : `MADE IT OUT — $${state.loot.toLocaleString('en-US')} in ${minutes}:${seconds}`;
      audio.win();
    }
  }

  function update(dt, input, audio) {
    if (state.screen === SCREENS.TITLE) {
      if (input.wasPressed('confirm') || input.mouse.clicked) {
        audio.unlock();
        reset();
      }
      return;
    }
    if (state.screen === SCREENS.CAUGHT || state.screen === SCREENS.WIN) {
      if (input.wasPressed('restart') || input.wasPressed('confirm')) reset();
      return;
    }

    // --- Playing -------------------------------------------------------------
    state.elapsed += dt;
    state.timeLeft = Math.max(0, state.timeLeft - dt);
    if (input.wasPressed('mute')) audio.toggleMute();

    const move = input.moveVector();
    state.thief.sneaking = input.sneaking;
    moveThief(move, dt);

    if (input.wasPressed('smoke')) throwSmoke(input, audio);
    updateGuards(dt);
    updateAlarm(dt, audio);
    collectLoot(audio);
    tryHack(dt, audio, input.wasPressed('interact'));

    for (const s of state.smokes) s.left -= dt;
    state.smokes = state.smokes.filter((s) => s.left > 0);
    for (const f of state.flashes) f.left -= dt;
    state.flashes = state.flashes.filter((f) => f.left > 0);

    checkCaught(audio);
    if (state.screen === SCREENS.PLAYING) checkWin(audio);
  }

  return {
    state,
    reset,
    update,
    vaultDoorOpen,
    cameraAngle,
    canSee,
    inSmoke,
    alarmLabel() {
      if (state.lockdownLeft > 0) return 'LOCKDOWN';
      if (state.alarm > 70) return 'ALERT';
      if (state.alarm > 25) return 'SUSPICIOUS';
      return 'QUIET';
    },
    alarmColor() {
      if (state.lockdownLeft > 0) return COLORS.alarmLockdown;
      if (state.alarm > 70) return COLORS.alarmAlert;
      return COLORS.alarmQuiet;
    },
  };
}
