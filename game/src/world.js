// Midnight Vault — the bank floor plan.
//
// Everything placed on the map lives here: walls, rooms, cover, loot, the
// keycard, the hack terminal, the guards' patrols, the cameras and the
// getaway car. Geometry helpers (circle-vs-wall collision and line of
// sight) live here too, so the game logic never hand-rolls them.

import { CANVAS_HEIGHT, CANVAS_WIDTH, LOOT_VALUES } from './config.js';

const WALL = 12; // wall thickness in pixels

// --- Walls -----------------------------------------------------------------
// Each wall is { x, y, w, h }. Gaps in a wall are the doors.
export const WALLS = [
  // Outer shell.
  { x: 0, y: 0, w: CANVAS_WIDTH, h: WALL },
  { x: 0, y: CANVAS_HEIGHT - WALL, w: CANVAS_WIDTH, h: WALL },
  { x: 0, y: 0, w: WALL, h: CANVAS_HEIGHT },
  { x: CANVAS_WIDTH - WALL, y: 0, w: WALL, h: CANVAS_HEIGHT },
  // Divider between the top rooms and the main hall (y = 240), with doors
  // into the security room and the manager office.
  { x: WALL, y: 240, w: 158, h: WALL },
  { x: 230, y: 240, w: 330, h: WALL },
  { x: 620, y: 240, w: 260, h: WALL },
  // Divider between the main hall and the lobby (y = 470), two routes through.
  { x: WALL, y: 470, w: 288, h: WALL },
  { x: 360, y: 470, w: 560, h: WALL },
  { x: 980, y: 470, w: 288, h: WALL },
  // Divider between the lobby and the street (y = 620), one front door.
  { x: WALL, y: 620, w: 548, h: WALL },
  { x: 680, y: 620, w: 588, h: WALL },
  // Security room | manager office divider (x = 348).
  { x: 348, y: WALL, w: WALL, h: 228 },
  // Manager office | vault divider (x = 828).
  { x: 828, y: WALL, w: WALL, h: 228 },
  // Vault west wall (x = 868) with the vault door gap (y 130..170).
  { x: 868, y: WALL, w: WALL, h: 118 },
  { x: 868, y: 170, w: WALL, h: 70 },
];

// The vault door itself: a gap in the vault west wall that stays shut until
// the thief carries the keycard (and is not in lockdown).
export const VAULT_DOOR = { x: 868, y: 130, w: WALL, h: 40 };

// --- Rooms (floor tints) ----------------------------------------------------
export const ROOMS = [
  { name: 'SECURITY', x: WALL, y: WALL, w: 336, h: 228, fill: 'floorSecurity' },
  { name: 'MANAGER OFFICE', x: 360, y: WALL, w: 468, h: 228, fill: 'floorOffice' },
  { name: 'VAULT', x: 880, y: WALL, w: 388, h: 228, fill: 'floorVault' },
  { name: 'MAIN HALL', x: WALL, y: 252, w: 1256, h: 218, fill: 'floorHall' },
  { name: 'LOBBY', x: WALL, y: 482, w: 1256, h: 138, fill: 'floorLobby' },
  { name: 'STREET', x: WALL, y: 632, w: 1256, h: 76, fill: 'floorStreet' },
];

// --- Cover: desks and pillars that block movement and sight -----------------
export const COVER = [
  { x: 180, y: 300, w: 130, h: 42, label: 'DESK' },
  { x: 690, y: 320, w: 150, h: 42, label: 'DESK' },
  { x: 950, y: 380, w: 110, h: 42, label: 'DESK' },
  { x: 500, y: 300, w: 42, h: 42, label: 'PILLAR' },
  { x: 500, y: 400, w: 42, h: 42, label: 'PILLAR' },
  { x: 150, y: 400, w: 42, h: 42, label: 'PILLAR' },
  { x: 1120, y: 300, w: 42, h: 42, label: 'PILLAR' },
  { x: 60, y: 540, w: 120, h: 36, label: 'SOFA' },
  { x: 1080, y: 540, w: 120, h: 36, label: 'SOFA' },
];

// --- Loot --------------------------------------------------------------------
export function freshLoot() {
  return [
    { id: 'register', x: 700, y: 545, value: LOOT_VALUES.register, label: 'REGISTER', taken: false },
    { id: 'jewelry', x: 245, y: 321, value: LOOT_VALUES.jewelry, label: 'JEWELRY', taken: false },
    { id: 'cashCart', x: 765, y: 341, value: LOOT_VALUES.cashCart, label: 'CASH CART', taken: false },
    { id: 'artPiece', x: 1005, y: 401, value: LOOT_VALUES.artPiece, label: 'ART', taken: false },
    { id: 'managerSafe', x: 640, y: 80, value: LOOT_VALUES.managerSafe, label: 'OFFICE SAFE', taken: false },
    { id: 'evidenceLocker', x: 200, y: 90, value: LOOT_VALUES.evidenceLocker, label: 'EVIDENCE', taken: false },
    { id: 'goldBars', x: 1070, y: 100, value: LOOT_VALUES.goldBars, label: 'GOLD BARS', taken: false },
    { id: 'vaultCash', x: 1150, y: 185, value: LOOT_VALUES.vaultCash, label: 'VAULT CASH', taken: false },
  ];
}

// --- Keycard and terminal ------------------------------------------------------
export const KEYCARD = { x: 480, y: 80, label: 'KEYCARD' };
export const TERMINAL = { x: 120, y: 60, label: 'CAMERA TERMINAL' };

// --- Getaway car ---------------------------------------------------------------
export const GETAWAY_CAR = { x: 1120, y: 652, radius: 52 };

// --- Guards --------------------------------------------------------------------
export function freshGuards() {
  return [
    {
      name: 'ROCCO', x: 200, y: 545, angle: 0, waypoint: 0,
      path: [[200, 545], [640, 545], [640, 400], [200, 400]],
      pause: 0, state: 'patrol',
    },
    {
      name: 'MARA', x: 900, y: 300, angle: Math.PI, waypoint: 0,
      path: [[900, 300], [1120, 300], [1120, 430], [900, 430]],
      pause: 0, state: 'patrol',
    },
    {
      name: 'VINCE', x: 400, y: 290, angle: 0, waypoint: 0,
      path: [[400, 290], [900, 290], [900, 350], [400, 350]],
      pause: 0, state: 'patrol',
    },
  ];
}

// --- Cameras -------------------------------------------------------------------
export function freshCameras() {
  return [
    // Main hall camera, mounted under the top divider, sweeping the hall.
    { name: 'CAM 1', x: 640, y: 258, baseAngle: Math.PI / 2, sweep: 1.05, phase: 0, disabledUntil: 0 },
    // Lobby camera, mounted under the hall divider, sweeping the lobby.
    { name: 'CAM 2', x: 200, y: 488, baseAngle: Math.PI / 2, sweep: 0.9, phase: 2.1, disabledUntil: 0 },
    // Vault camera, mounted on the vault west wall, sweeping the vault door.
    { name: 'CAM 3', x: 884, y: 150, baseAngle: 0, sweep: 0.8, phase: 4.0, disabledUntil: 0 },
  ];
}

// --- Geometry helpers ----------------------------------------------------------
export function circleHitsRect(cx, cy, r, rect) {
  const nx = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const ny = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  const dx = cx - nx;
  const dy = cy - ny;
  return dx * dx + dy * dy < r * r;
}

export function collidesWithWorld(x, y, r) {
  for (const wall of WALLS) if (circleHitsRect(x, y, r, wall)) return true;
  for (const block of COVER) if (circleHitsRect(x, y, r, block)) return true;
  return false;
}

// True when the segment (x1,y1)-(x2,y2) is not cut by any wall or cover block.
export function hasLineOfSight(x1, y1, x2, y2) {
  const obstacles = WALLS.concat(COVER);
  for (const o of obstacles) {
    if (segmentHitsRect(x1, y1, x2, y2, o)) return false;
  }
  return true;
}

function segmentHitsRect(x1, y1, x2, y2, rect) {
  // Slab test: walk the segment through the rectangle's x/y ranges.
  const dx = x2 - x1;
  const dy = y2 - y1;
  let tMin = 0;
  let tMax = 1;
  const axes = [
    [dx, x1, rect.x, rect.x + rect.w],
    [dy, y1, rect.y, rect.y + rect.h],
  ];
  for (const [d, start, lo, hi] of axes) {
    if (Math.abs(d) < 1e-9) {
      if (start < lo || start > hi) return false;
    } else {
      let t1 = (lo - start) / d;
      let t2 = (hi - start) / d;
      if (t1 > t2) [t1, t2] = [t2, t1];
      tMin = Math.max(tMin, t1);
      tMax = Math.min(tMax, t2);
      if (tMin > tMax) return false;
    }
  }
  return true;
}

export function angleDifference(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export function distance(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}
