# 🕹️ Arcade

Welcome to the retro arcade collection!

---

## 🐕 Featured Game: Shiba Pac-Man (Yuki vs The Squirrels)

An authentic retro arcade game inspired by Pac-Man, featuring a fluffy **White Shiba Inu** named Yuki and a mischievous gang of **4 Squirrels** in place of the classic ghosts!

---

## 🎮 Features

- **Hero Yuki (White Shiba Inu)**:
  - Custom procedural canvas art with perky ears, curly tail, collar bell, trot animations, and direction-aware chomping mouth.
  - **Zoomies Mode**: Activated by eating Golden Acorns (Energizers). Yuki gets a golden glowing aura, fluttering superhero cape, speed boost, and the power to chase and catch squirrels!
- **The 4 Mischievous Squirrels**:
  - **Nutty (Red / Blinky)**: The persistent chaser targeting Yuki directly. Gains a speed surge ("Cruise Elroy") when treats run low!
  - **Chippy (Pink / Pinky)**: The ambush strategist targeting 4 tiles ahead in Yuki's path.
  - **Squeaky (Cyan / Inky)**: The tactical flanker coordinating with Nutty.
  - **Rusty (Orange / Clyde)**: The cowardly wanderer who flees when Yuki gets too close.
  - Full authentic state machine: **Chase**, **Scatter**, **Frightened** (panicked blue shivering with sweat drops), and **Eaten** (frantic scampering paws zipping back to the tree hollow).
- **Classic Arcade Maze**:
  - Iconic 28x31 grid layout with side wrap-around tunnels, cornering buffer, and center tree hollow.
  - 2 Selectable visual themes: **Neon Arcade** (electric cyan/blue) and **Sakura Park** (lush green hedges and garden path).
- **Procedural 8-Bit Audio (Web Audio API)**:
  - 100% synthesized sound effects: Waka-waka chomp, start fanfare melody, Zoomies power chime, squirrel catch cascade, death whimper, and 1UP chime.
  - Zero external MP3/WAV files required.
- **Controls & Accessibility**:
  - **Keyboard**: Arrow keys or WASD.
  - **Touch / Mobile**: Virtual on-screen D-Pad and canvas swipe gestures.
  - **Arcade Bezel & CRT Filter**: Nostalgic scanlines and curvature toggle.
  - **High Score**: Persisted in `localStorage`.

---

## 🚀 How to Run

1. Open `index.html` directly in any web browser (Chrome, Edge, Firefox, Safari).
2. Or open `standalone.html` for the single-file bundled edition.
3. Or serve using any local static server:
   ```bash
   npx serve .
   ```

---

## 🕹️ Controls

| Action | Keyboard | Touch / Mouse |
|---|---|---|
| Move Up | `↑` or `W` | Swipe Up / D-Pad ▲ |
| Move Down | `↓` or `S` | Swipe Down / D-Pad ▼ |
| Move Left | `←` or `A` | Swipe Left / D-Pad ◀ |
| Move Right | `→` or `D` | Swipe Right / D-Pad ▶ |
| Start / Play Again | `Space` | Click "START" button |
| Pause / Resume | `P` or `Space` | Click "PAUSE" button |
| Mute / Unmute Audio | `M` | Click "SOUND" button |
