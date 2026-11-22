// Midnight Vault — shared tuning constants.
//
// One place for every number the game balances on, so a balance change never
// means hunting through the update or render code. All distances are canvas
// pixels on a 1280 x 720 floor plan; all times are seconds.

export const CANVAS_WIDTH = 1280;
export const CANVAS_HEIGHT = 720;

export const PLAYER_RADIUS = 14;
export const PLAYER_WALK_SPEED = 150;
export const PLAYER_SNEAK_SPEED = 72;

export const GUARD_RADIUS = 15;
export const GUARD_PATROL_SPEED = 58;
export const GUARD_CHASE_SPEED = 102;
export const GUARD_CATCH_RADIUS = 26;
export const GUARD_VISION_RANGE = 205;
export const GUARD_VISION_HALF_ANGLE = Math.PI / 4.8; // ~37.5 degrees each side

export const CAMERA_VISION_RANGE = 195;
export const CAMERA_VISION_HALF_ANGLE = Math.PI / 6.5; // ~27.7 degrees each side
export const CAMERA_SWEEP_SPEED = 0.55; // radians per second
export const CAMERA_DISABLED_SECONDS = 25;

export const ALARM_MAX = 100;
export const ALARM_GUARD_RATE = 46; // points per second while a guard sees the thief
export const ALARM_CAMERA_RATE = 30; // points per second while a camera sees the thief
export const ALARM_DECAY_RATE = 10; // points per second while nobody sees the thief
export const ALARM_SNEAK_FACTOR = 0.5; // sneaking halves how fast the alarm fills
export const LOCKDOWN_SECONDS = 12;
export const LOCKDOWN_RESET_ALARM = 35; // alarm level when a lockdown ends

export const TIME_LIMIT_SECONDS = 300; // five minutes on the clock

export const SMOKE_START_COUNT = 3;
export const SMOKE_RADIUS = 95;
export const SMOKE_DURATION_SECONDS = 6;

export const HACK_CHANNEL_SECONDS = 2; // hold E at the terminal this long
export const HACK_RANGE = 70;

export const WIN_MIN_LOOT = 500; // need at least this much to make the run count

export const LOOT_VALUES = {
  register: 500,
  jewelry: 1200,
  cashCart: 800,
  artPiece: 1500,
  managerSafe: 2000,
  evidenceLocker: 900,
  goldBars: 4000,
  vaultCash: 2500,
};

// Palette: midnight blues for the bank, warm amber for loot, red for danger.
export const COLORS = {
  floorLobby: '#1d2436',
  floorHall: '#202a40',
  floorVault: '#2a2438',
  floorSecurity: '#1c2a2e',
  floorOffice: '#262238',
  floorStreet: '#14161d',
  wall: '#0d1020',
  wallTop: '#39415e',
  cover: '#31405f',
  coverTop: '#46587f',
  loot: '#f5b942',
  lootRing: '#ffe9a8',
  keycard: '#58e6c8',
  terminal: '#58e6c8',
  car: '#e5484d',
  carGlass: '#9fd8ff',
  guard: '#ff5d5d',
  guardCone: 'rgba(255, 93, 93, 0.20)',
  guardConeEdge: 'rgba(255, 93, 93, 0.45)',
  camera: '#ffcf4d',
  cameraCone: 'rgba(255, 207, 77, 0.16)',
  cameraConeEdge: 'rgba(255, 207, 77, 0.40)',
  thief: '#7ee787',
  thiefSneak: '#4cc38a',
  smoke: 'rgba(200, 205, 220, 0.45)',
  hudBack: 'rgba(8, 10, 18, 0.82)',
  text: '#eef2ff',
  muted: '#9aa5c4',
  alarmQuiet: '#7ee787',
  alarmAlert: '#ffb224',
  alarmLockdown: '#ff5d5d',
};
