// Midnight Vault — tiny synthesised sound effects.
//
// No audio files: every blip is an oscillator through the Web Audio API, so
// the game still ships zero network requests and zero assets. Sound starts
// only after the first user gesture (the browser's autoplay rule).

export function createAudio() {
  let ctx = null;
  let muted = false;

  function ensureContext() {
    if (ctx) {
      if (ctx.state === 'suspended') void ctx.resume();
      return ctx;
    }
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    ctx = new AudioContextClass();
    return ctx;
  }

  function beep(freq, seconds, type, gainValue, when = 0) {
    if (muted) return;
    const audio = ensureContext();
    if (!audio) return;
    const start = audio.currentTime + when;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(gainValue, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
    osc.connect(gain).connect(audio.destination);
    osc.start(start);
    osc.stop(start + seconds);
  }

  return {
    unlock() { ensureContext(); },
    toggleMute() { muted = !muted; return muted; },
    get muted() { return muted; },
    pickup() { beep(880, 0.12, 'sine', 0.12); beep(1318, 0.14, 'sine', 0.10, 0.07); },
    keycard() { beep(659, 0.1, 'triangle', 0.12); beep(988, 0.16, 'triangle', 0.12, 0.08); },
    hackDone() { beep(523, 0.1, 'square', 0.06); beep(784, 0.1, 'square', 0.06, 0.09); beep(1046, 0.18, 'square', 0.06, 0.18); },
    smoke() { beep(220, 0.3, 'sawtooth', 0.05); },
    alarm() { beep(440, 0.16, 'square', 0.07); beep(349, 0.16, 'square', 0.07, 0.18); },
    caught() { beep(196, 0.5, 'sawtooth', 0.10); beep(147, 0.7, 'sawtooth', 0.10, 0.25); },
    win() {
      [523, 659, 784, 1046].forEach((f, i) => beep(f, 0.22, 'triangle', 0.12, i * 0.11));
    },
  };
}
