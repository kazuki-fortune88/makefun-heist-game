// Midnight Vault — keyboard and mouse input.
//
// Tracks the keys held down each frame plus edge-triggered presses (smoke
// bomb, interact, start/restart) and the mouse position for click-to-throw
// smoke bombs. The game polls this; it never listens to the DOM itself.

export function createInput(canvas) {
  const keys = new Set();
  const pressed = new Set();
  const mouse = { x: 0, y: 0, clicked: false, clickX: 0, clickY: 0 };

  const KEY_ALIASES = {
    ArrowUp: 'up', KeyW: 'up',
    ArrowDown: 'down', KeyS: 'down',
    ArrowLeft: 'left', KeyA: 'left',
    ArrowRight: 'right', KeyD: 'right',
    ShiftLeft: 'sneak', ShiftRight: 'sneak',
    Space: 'smoke', KeyQ: 'smoke',
    KeyE: 'interact',
    Enter: 'confirm',
    KeyR: 'restart',
    KeyM: 'mute',
  };

  function onKeyDown(event) {
    const action = KEY_ALIASES[event.code];
    if (!action) return;
    if (['up', 'down', 'left', 'right', 'smoke'].includes(action)) event.preventDefault();
    if (!event.repeat) pressed.add(action);
    keys.add(action);
  }

  function onKeyUp(event) {
    const action = KEY_ALIASES[event.code];
    if (action) keys.delete(action);
  }

  function onMouseMove(event) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = event.clientX - rect.left;
    mouse.y = event.clientY - rect.top;
  }

  function onMouseDown(event) {
    onMouseMove(event);
    mouse.clicked = true;
    mouse.clickX = mouse.x;
    mouse.clickY = mouse.y;
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mousedown', onMouseDown);

  return {
    // Held-down movement: { x, y } each in -1..1, already normalised.
    moveVector() {
      const x = (keys.has('right') ? 1 : 0) - (keys.has('left') ? 1 : 0);
      const y = (keys.has('down') ? 1 : 0) - (keys.has('up') ? 1 : 0);
      if (x === 0 && y === 0) return { x: 0, y: 0 };
      const len = Math.hypot(x, y);
      return { x: x / len, y: y / len };
    },
    get sneaking() { return keys.has('sneak'); },
    // True once per physical press; the game clears it every frame.
    wasPressed(action) { return pressed.has(action); },
    endFrame() {
      pressed.clear();
      mouse.clicked = false;
    },
    get mouse() { return mouse; },
  };
}
