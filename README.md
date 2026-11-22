# Midnight Vault

[![make.fun](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/kazuki-fortune88/makefun-heist-game/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/kazuki-fortune88/makefun-heist-game/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)

A top-down heist game for [make.fun](https://make.fun/bounty/best-heist-game-20261122-0559): one thief, one bank, five minutes to dawn. Built as plain static files — no build step, no network request, no library.

## The heist

You start on the street outside the Meridian Bank. Slip in through the lobby, grab the **keycard** from the manager's office, crack the **vault** for the gold bars ($4,000) and the vault cash ($2,500), then get back out to the **getaway car** before the five-minute clock runs out.

- **3 guards** patrol the lobby, the main hall and the vault approach, each with a sweeping vision cone. Get caught in a cone and the alarm meter climbs; get touched and you're busted.
- **3 cameras** sweep the hall, the lobby and the vault door. Hack them from the security-room terminal (press **E**, stand still for 2 seconds) and they go dark for 25 seconds.
- **Alarm meter 0–100**: at 100 the bank locks down for 12 seconds — guards hunt you and the vault door seals.
- **Smoke bombs (x3)**: press **Space** / **Q** to drop one at your feet, or click anywhere to throw it there. Guards and cameras can't see through smoke.
- **Sneak** (hold **Shift**): move slower, fill the alarm half as fast.
- **Loot** from $500 (the register) to $4,000 (the gold bars) — $12,400 in the building. Escape with at least $500 to make the run count.

## Play

```sh
node serve.ts
# open http://localhost:8080
```

Controls: **WASD / arrows** move · **Shift** sneak · **Space / Q** smoke bomb · **E** hack terminal · **M** mute.

## Files

- `game/index.html` + `game/style.css` — the page.
- `game/src/config.js` — every tuning number in one place.
- `game/src/world.js` — the bank floor plan: rooms, walls, loot, patrols, cameras, collision and line of sight.
- `game/src/input.js` — keyboard and mouse.
- `game/src/audio.js` — synthesised sound effects (Web Audio, no audio files).
- `game/src/game.js` — the simulation: guards, cameras, alarm, lockdown, loot, hack, smoke, win / caught.
- `game/src/render.js` — all canvas drawing, including the HUD and screens.
- `game/src/shots.js` — staged `?shot=` scenes for the screenshots.
- `game/src/main.js` — bootstrap and frame loop.
- `main.ts` — the make.fun hand-in program: copies `game/` and `screenshots/` to `/output` and writes `dossier.json`.

## Screenshots

`1-title.jpg` title · `2-play.jpg` mid-heist (thief, guard cones, camera, loot, alarm meter in one frame) · `3-alarm.jpg` spotted, alarm at 96 · `4-getaway.jpg` clean getaway, $11,000 banked.

## License

MIT — see [LICENSE](LICENSE).
