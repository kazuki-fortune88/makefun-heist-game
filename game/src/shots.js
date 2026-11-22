// Midnight Vault — staged screenshot scenes.
//
// `?shot=start|play|alarm|end` freezes the game in a hand-placed moment so
// the four screenshots are reproducible: the title, a mid-heist frame with
// the thief, a guard cone, a camera, a loot target and the alarm meter all
// visible at once, an alarm moment, and the getaway. Nothing here is used
// during normal play.

import { SCREENS } from './game.js';

function placeGuard(state, index, x, y, angle) {
  const g = state.guards[index];
  g.x = x;
  g.y = y;
  g.angle = angle;
  g.pause = 999; // hold still for the photo
  g.state = 'patrol';
}

function takeLoot(state, ids) {
  for (const item of state.lootItems) {
    if (ids.includes(item.id)) {
      item.taken = true;
      state.loot += item.value;
      state.lootTaken += 1;
    }
  }
}

export function stageShot(game, shot) {
  const s = game.state;
  if (shot === 'start') {
    s.screen = SCREENS.TITLE;
    return;
  }

  game.reset();
  s.screen = SCREENS.PLAYING;

  if (shot === 'play') {
    // Mid-heist in the main hall: the thief slips between desks toward the
    // art piece while Rocco's cone sweeps past and a camera watches.
    s.thief.x = 640;
    s.thief.y = 385;
    s.thief.angle = Math.PI / 4;
    s.thief.sneaking = true;
    s.timeLeft = 222; // 3:42 left
    s.elapsed = 78;
    s.alarm = 35;
    s.smokeLeft = 2;
    s.hasKeycard = true;
    s.keycardTaken = true;
    takeLoot(s, ['register', 'jewelry', 'cashCart']); // $2,500 banked
    placeGuard(s, 0, 420, 430, Math.PI / 2); // Rocco, cone sweeping down past the thief
    placeGuard(s, 1, 980, 300, Math.PI); // Mara, cone sweeping left
    placeGuard(s, 2, 700, 290, Math.PI / 2); // Vince, cone sweeping down
    s.cameras[0].phase = 0.4;
    s.cameras[1].phase = 1.2;
    s.cameras[2].phase = 2.6;
  }

  if (shot === 'alarm') {
    // Spotted in the main hall: alarm at 96, Mara closing in, red alert.
    s.thief.x = 760;
    s.thief.y = 420;
    s.thief.angle = -Math.PI / 2;
    s.timeLeft = 135; // 2:15 left
    s.elapsed = 165;
    s.alarm = 96;
    s.smokeLeft = 1;
    takeLoot(s, ['register', 'jewelry']); // $1,700 banked
    placeGuard(s, 0, 500, 540, 0);
    placeGuard(s, 1, 820, 380, Math.PI / 4); // Mara bearing down on the thief
    placeGuard(s, 2, 500, 300, Math.PI / 2);
    s.smokes.push({ x: 700, y: 470, left: 4 }); // one smoke cloud already down
    s.seenNow = true;
    s.seenBy = 'GUARD MARA';
  }

  if (shot === 'end') {
    // The getaway: vault emptied, thief at the car, win screen up.
    s.thief.x = 1120;
    s.thief.y = 652;
    s.thief.angle = 0;
    s.timeLeft = 143; // finished with 2:23 to spare
    s.elapsed = 157;
    s.alarm = 12;
    s.smokeLeft = 1;
    s.hasKeycard = true;
    s.keycardTaken = true;
    s.camerasHacked = true;
    for (const c of s.cameras) c.disabledUntil = 999;
    takeLoot(s, ['register', 'jewelry', 'cashCart', 'managerSafe', 'goldBars', 'vaultCash']);
    // $11,000 banked.
    s.screen = SCREENS.WIN;
    s.finalTime = 157;
    s.winRating = 'LEGENDARY — $11,000 in 2:37';
  }

  // Freeze the staged frame so the screenshot never catches a mid-step pose.
  s.frozen = true;
}

// A short state summary for the page title, so a headless run can confirm
// the scene loaded without reading pixels.
export function shotSummary(game) {
  const s = game.state;
  return `${s.screen} loot=${s.loot} alarm=${Math.round(s.alarm)} time=${Math.round(s.timeLeft)} smoke=${s.smokeLeft}`;
}
