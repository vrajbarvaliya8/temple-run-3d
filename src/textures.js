import * as THREE from 'three';

// Procedural texture generator to ensure 100% self-contained visuals without external assets
export class TextureGenerator {
  // Ancient carved stone path with cracks and moss
  static createStonePathTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Base stone color
    ctx.fillStyle = '#61584d';
    ctx.fillRect(0, 0, 512, 512);

    // Stone tile grid
    const cols = 4;
    const rows = 4;
    const w = 512 / cols;
    const h = 512 / rows;

    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const x = i * w;
        const y = j * h;
        
        // Random stone variation
        const lightness = 40 + Math.random() * 20;
        ctx.fillStyle = `hsl(38, 18%, ${lightness}%)`;
        ctx.fillRect(x + 2, y + 2, w - 4, h - 4);

        // Stone texture noise
        for (let n = 0; n < 300; n++) {
          const nx = x + 3 + Math.random() * (w - 6);
          const ny = y + 3 + Math.random() * (h - 6);
          const nSize = 1 + Math.random() * 3;
          ctx.fillStyle = Math.random() > 0.5 ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.12)';
          ctx.fillRect(nx, ny, nSize, nSize);
        }

        // Mortar lines
        ctx.strokeStyle = '#2b231a';
        ctx.lineWidth = 4;
        ctx.strokeRect(x, y, w, h);

        // Random cracks
        if (Math.random() > 0.4) {
          ctx.beginPath();
          ctx.strokeStyle = '#201a14';
          ctx.lineWidth = 1.5;
          let cx = x + 10 + Math.random() * (w - 20);
          let cy = y + 10 + Math.random() * (h - 20);
          ctx.moveTo(cx, cy);
          for (let k = 0; k < 3; k++) {
            cx += (Math.random() - 0.5) * 25;
            cy += (Math.random() - 0.5) * 25;
            ctx.lineTo(cx, cy);
          }
          ctx.stroke();
        }

        // Green moss patches in cracks
        if (Math.random() > 0.5) {
          ctx.fillStyle = 'rgba(54, 82, 38, 0.4)';
          ctx.beginPath();
          ctx.arc(x + Math.random() * w, y + Math.random() * h, 6 + Math.random() * 10, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  // Ancient temple wall with Aztec glyph carvings
  static createTempleWallTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#4a3f35';
    ctx.fillRect(0, 0, 512, 512);

    // Stone blocks
    const rows = 6;
    const h = 512 / rows;
    for (let r = 0; r < rows; r++) {
      const offset = (r % 2) * 64;
      for (let c = -1; c < 5; c++) {
        const x = c * 128 + offset;
        const y = r * h;

        ctx.fillStyle = `hsl(32, 22%, ${28 + Math.random() * 15}%)`;
        ctx.fillRect(x + 2, y + 2, 124, h - 4);

        // Carved face / skull / geometric glyph in block center
        ctx.strokeStyle = 'rgba(20, 15, 10, 0.7)';
        ctx.lineWidth = 3;
        const cx = x + 64;
        const cy = y + h / 2;

        if ((r + c) % 2 === 0) {
          // Temple Idol face carving
          ctx.strokeRect(cx - 24, cy - 24, 48, 48);
          ctx.beginPath();
          // Eyes
          ctx.fillStyle = '#1c150e';
          ctx.fillRect(cx - 16, cy - 12, 10, 8);
          ctx.fillRect(cx + 6, cy - 12, 10, 8);
          // Mouth
          ctx.fillRect(cx - 14, cy + 6, 28, 6);
          // Nose
          ctx.strokeRect(cx - 4, cy - 6, 8, 8);
        } else {
          // Aztec stepped diamond pattern
          ctx.beginPath();
          ctx.moveTo(cx, cy - 24);
          ctx.lineTo(cx + 24, cy);
          ctx.lineTo(cx, cy + 24);
          ctx.lineTo(cx - 24, cy);
          ctx.closePath();
          ctx.stroke();

          ctx.strokeRect(cx - 10, cy - 10, 20, 20);
        }

        // Weathering and moss
        ctx.fillStyle = 'rgba(40, 65, 30, 0.25)';
        ctx.fillRect(x, y + h - 8, 128, 8);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  // Wooden bridge planks with grain and iron rivets
  static createWoodTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#5c3a21';
    ctx.fillRect(0, 0, 256, 256);

    const planks = 4;
    const h = 256 / planks;
    for (let p = 0; p < planks; p++) {
      const y = p * h;
      ctx.fillStyle = `hsl(26, 48%, ${24 + Math.random() * 14}%)`;
      ctx.fillRect(0, y + 2, 256, h - 4);

      // Wood grain lines
      ctx.strokeStyle = 'rgba(40, 20, 10, 0.4)';
      ctx.lineWidth = 1.5;
      for (let g = 0; g < 8; g++) {
        ctx.beginPath();
        const gy = y + 5 + Math.random() * (h - 10);
        ctx.moveTo(0, gy);
        ctx.bezierCurveTo(80, gy + (Math.random() - 0.5) * 8, 160, gy + (Math.random() - 0.5) * 8, 256, gy);
        ctx.stroke();
      }

      // Iron nails / rivets
      ctx.fillStyle = '#222';
      ctx.beginPath();
      ctx.arc(20, y + h / 2, 4, 0, Math.PI * 2);
      ctx.arc(236, y + h / 2, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#555';
      ctx.beginPath();
      ctx.arc(19, y + h / 2 - 1, 1.5, 0, Math.PI * 2);
      ctx.arc(235, y + h / 2 - 1, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  // Gold coin texture with engraved skull/face and shiny rim
  static createGoldCoinTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    const cx = 128;
    const cy = 128;

    // Outer rim gradient
    const grad = ctx.createRadialGradient(cx, cy, 50, cx, cy, 120);
    grad.addColorStop(0, '#ffd700');
    grad.addColorStop(0.7, '#f5a623');
    grad.addColorStop(1, '#b37400');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, 120, 0, Math.PI * 2);
    ctx.fill();

    // Inner rim
    ctx.strokeStyle = '#fff3a8';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(cx, cy, 108, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#8a5900';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(cx, cy, 96, 0, Math.PI * 2);
    ctx.stroke();

    // Engraved Temple Idol Skull/Face in center
    ctx.fillStyle = '#9e6700';
    // Head
    ctx.beginPath();
    ctx.arc(cx, cy - 8, 42, 0, Math.PI * 2);
    ctx.fill();
    // Jaw
    ctx.fillRect(cx - 24, cy + 10, 48, 30);

    // Eyes cut out (gold shining through)
    ctx.fillStyle = '#ffeaa7';
    ctx.beginPath();
    ctx.arc(cx - 16, cy - 8, 12, 0, Math.PI * 2);
    ctx.arc(cx + 16, cy - 8, 12, 0, Math.PI * 2);
    ctx.fill();

    // Teeth marks
    ctx.strokeStyle = '#ffeaa7';
    ctx.lineWidth = 3;
    for (let t = -16; t <= 16; t += 8) {
      ctx.beginPath();
      ctx.moveTo(cx + t, cy + 18);
      ctx.lineTo(cx + t, cy + 34);
      ctx.stroke();
    }

    // Highlight sheen
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.ellipse(cx - 40, cy - 40, 30, 15, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();

    return new THREE.CanvasTexture(canvas);
  }

  // Fire flame particle texture
  static createFireTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 60);
    grad.addColorStop(0, 'rgba(255, 255, 220, 1)');
    grad.addColorStop(0.3, 'rgba(255, 180, 20, 0.9)');
    grad.addColorStop(0.7, 'rgba(240, 60, 10, 0.5)');
    grad.addColorStop(1, 'rgba(100, 10, 0, 0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);

    return new THREE.CanvasTexture(canvas);
  }

  // Golden Idol artifact texture
  static createIdolTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#e6a100';
    ctx.fillRect(0, 0, 256, 256);

    for (let i = 0; i < 200; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255, 230, 100, 0.15)' : 'rgba(120, 70, 0, 0.15)';
      ctx.fillRect(Math.random() * 256, Math.random() * 256, 8, 8);
    }

    return new THREE.CanvasTexture(canvas);
  }

  // Rough tree bark and roots
  static createBarkTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#382515';
    ctx.fillRect(0, 0, 256, 256);

    for (let i = 0; i < 60; i++) {
      ctx.fillStyle = `hsl(25, 30%, ${15 + Math.random() * 20}%)`;
      ctx.fillRect(Math.random() * 256, 0, 4 + Math.random() * 10, 256);
    }

    // Green moss on bark
    for (let m = 0; m < 25; m++) {
      ctx.fillStyle = 'rgba(40, 80, 20, 0.3)';
      ctx.beginPath();
      ctx.arc(Math.random() * 256, Math.random() * 256, 10 + Math.random() * 15, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }
}
