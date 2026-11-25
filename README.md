# 🗿 TEMPLE RUN: IDOL ESCAPE 3D

An authentic 3D endless runner game inspired by the classic **Temple Run**, built with **Three.js** and procedural WebGL rendering.

🎮 **[Play Live Game Here](https://vrajbarvaliya8.github.io/temple-run-3d/)**

---

## ✨ Features

- **Iconic 3D Temple Environment**:
  - Suspended stone walkways, mossy ancient ruins, and rickety rope bridges over a misty jungle abyss.
  - Temple columns with flickering torch braziers and atmospheric fog.
- **Guy Dangerous Explorer Character**:
  - Full 3D modeled adventurer with fedora, backpack, running, jumping, sliding, and stumble animations.
- **Menacing Demon Beast**:
  - Fanged demon chaser hot on your heels that lunges forward when you stumble and pounces on game over!
- **Core Temple Run Mechanics**:
  - 3-Lane switching (`A` / `D` or `Left` / `Right`).
  - Jump over fire pits, flame grates, and low jungle roots (`W` or `Up`).
  - Slide duck under ancient stone archways and blade gates (`S` or `Down`).
  - **90-Degree Corner Turns**: Flash warnings approach; turn left/right at junctions or plunge into the abyss!
  - Stumble mechanic: clip an obstacle and the demon beast snaps at your heels!
- **Collectibles & Power-Ups**:
  - Streams of spinning 3D gold coins.
  - 🛡️ **Shield**: Grants invulnerability against 1 obstacle hit.
  - 🧲 **Coin Magnet**: Attracts all coins from all lanes.
  - ⚡ **Speed Boost**: Blazing speed dash with invincibility.
  - 💎 **2X Score Multiplier**: Doubles score accumulation.
- **Dynamic Procedural Audio (Web Audio API)**:
  - Accelerating tribal percussion beat that matches your running speed.
  - Sparkling coin chimes, jump/slide whooshes, demon growls, and crash sounds.
- **Full Mobile & Touch Support**:
  - Responsive swipe gestures (Up/Down/Left/Right).
  - On-screen touch D-pad buttons for tablets and phones.
  - High score and best distance saved in `localStorage`.

---

## 🕹️ Controls

| Action | Desktop Keyboard | Mobile / Touch |
|---|---|---|
| **Move Left / Turn Left** | `A` or `←` | Swipe Left or Tap `◀` |
| **Move Right / Turn Right** | `D` or `→` | Swipe Right or Tap `▶` |
| **Jump** | `W` or `↑` or `Space` | Swipe Up or Tap `▲` |
| **Slide / Duck** | `S` or `↓` | Swipe Down or Tap `▼` |
| **Pause Game** | `P` or `Esc` | Tap `⏸️` button |

---

## 🚀 Local Development

1. Clone repository:
   ```bash
   git clone https://github.com/vrajbarvaliya8/temple-run-3d.git
   cd temple-run-3d
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run dev server:
   ```bash
   npm run dev
   ```
4. Build for production:
   ```bash
   npm run build
   ```
