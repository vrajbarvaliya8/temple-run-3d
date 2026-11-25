import * as THREE from 'three';

export class TextureGenerator {
  // Authentic Ancient Temple Cobblestone walkway (Classic Temple Run 1 style)
  static createAncientStonePathTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Base earth stone tone
    ctx.fillStyle = '#4d4032';
    ctx.fillRect(0, 0, 1024, 1024);

    // Large carved stone flags / pavers
    const cols = 4;
    const rows = 8;
    const w = 1024 / cols;
    const h = 1024 / rows;

    for (let r = 0; r < rows; r++) {
      const rowOffset = (r % 2) * (w / 2);
      for (let c = -1; c <= cols; c++) {
        const x = c * w + rowOffset;
        const y = r * h;

        // Realistic variation between individual stones
        const stoneHue = 32 + (Math.random() - 0.5) * 8;
        const stoneSat = 18 + (Math.random() - 0.5) * 6;
        const stoneLight = 38 + (Math.random() - 0.5) * 14;
        
        ctx.fillStyle = `hsl(${stoneHue}, ${stoneSat}%, ${stoneLight}%)`;
        
        // Rounded worn cobblestone paver
        ctx.beginPath();
        const pad = 6;
        ctx.roundRect(x + pad, y + pad, w - pad * 2, h - pad * 2, 8);
        ctx.fill();

        // Stone grain & surface noise
        for (let n = 0; n < 400; n++) {
          const nx = x + pad + Math.random() * (w - pad * 2);
          const ny = y + pad + Math.random() * (h - pad * 2);
          const nRadius = 1 + Math.random() * 3.5;
          ctx.fillStyle = Math.random() > 0.5 ? 'rgba(0,0,0,0.18)' : 'rgba(255,240,200,0.1)';
          ctx.beginPath();
          ctx.arc(nx, ny, nRadius, 0, Math.PI * 2);
          ctx.fill();
        }

        // Deep stone cracks
        if (Math.random() > 0.4) {
          ctx.beginPath();
          ctx.strokeStyle = 'rgba(25, 18, 12, 0.85)';
          ctx.lineWidth = 2.5;
          let cx = x + 25 + Math.random() * (w - 50);
          let cy = y + 15 + Math.random() * (h - 30);
          ctx.moveTo(cx, cy);
          for (let k = 0; k < 4; k++) {
            cx += (Math.random() - 0.5) * 35;
            cy += (Math.random() - 0.5) * 35;
            ctx.lineTo(cx, cy);
          }
          ctx.stroke();
        }

        // Moss & Lichen creeping into stone crevices
        if (Math.random() > 0.35) {
          ctx.fillStyle = 'rgba(45, 75, 30, 0.45)';
          ctx.beginPath();
          ctx.arc(x + Math.random() * w, y + Math.random() * h, 14 + Math.random() * 22, 0, Math.PI * 2);
          ctx.fill();
        }

        // Outer Mortar Shadow
        ctx.strokeStyle = '#1e160e';
        ctx.lineWidth = 8;
        ctx.strokeRect(x, y, w, h);
      }
    }

    // Path edge moss borders (vines creeping on walkway sides)
    const edgeGradLeft = ctx.createLinearGradient(0, 0, 90, 0);
    edgeGradLeft.addColorStop(0, 'rgba(30, 60, 20, 0.7)');
    edgeGradLeft.addColorStop(1, 'rgba(30, 60, 20, 0)');
    ctx.fillStyle = edgeGradLeft;
    ctx.fillRect(0, 0, 90, 1024);

    const edgeGradRight = ctx.createLinearGradient(1024, 0, 934, 0);
    edgeGradRight.addColorStop(0, 'rgba(30, 60, 20, 0.7)');
    edgeGradRight.addColorStop(1, 'rgba(30, 60, 20, 0)');
    ctx.fillStyle = edgeGradRight;
    ctx.fillRect(934, 0, 90, 1024);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  // Stone Ramparts with carved Aztec temple relief motifs
  static createTempleRampartTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Ancient Sandstone base
    ctx.fillStyle = '#3a2e22';
    ctx.fillRect(0, 0, 512, 512);

    const rows = 4;
    const h = 512 / rows;
    for (let r = 0; r < rows; r++) {
      const offset = (r % 2) * 128;
      for (let c = -1; c < 5; c++) {
        const x = c * 256 + offset;
        const y = r * h;

        ctx.fillStyle = `hsl(28, 24%, ${26 + Math.random() * 12}%)`;
        ctx.fillRect(x + 3, y + 3, 250, h - 6);

        // Carved Aztec stepped pyramid / serpent head relief
        const cx = x + 128;
        const cy = y + h / 2;

        ctx.strokeStyle = 'rgba(15, 10, 6, 0.85)';
        ctx.lineWidth = 4;

        // Relief box
        ctx.strokeRect(cx - 50, cy - 35, 100, 70);

        // Aztec Serpent eye & diamond motif
        ctx.beginPath();
        ctx.moveTo(cx - 35, cy);
        ctx.lineTo(cx, cy - 25);
        ctx.lineTo(cx + 35, cy);
        ctx.lineTo(cx, cy + 25);
        ctx.closePath();
        ctx.stroke();

        ctx.fillStyle = '#1a1008';
        ctx.beginPath();
        ctx.arc(cx, cy, 10, 0, Math.PI * 2);
        ctx.fill();

        // Edge weathering & grime
        ctx.fillStyle = 'rgba(20, 40, 15, 0.35)';
        ctx.fillRect(x, y + h - 10, 256, 10);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  // Dark marsh swamp water with murky greenish depths
  static createSwampWaterTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 512, 512);
    grad.addColorStop(0, '#0c1a14');
    grad.addColorStop(0.5, '#12261b');
    grad.addColorStop(1, '#08120d');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    // Water wavelets and reflections
    for (let i = 0; i < 70; i++) {
      const y = Math.random() * 512;
      const x = Math.random() * 512;
      const len = 40 + Math.random() * 100;
      ctx.strokeStyle = Math.random() > 0.5 ? 'rgba(70, 120, 90, 0.22)' : 'rgba(10, 25, 18, 0.4)';
      ctx.lineWidth = 2 + Math.random() * 3;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.bezierCurveTo(x + len * 0.3, y - 4, x + len * 0.7, y + 4, x + len, y);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  // Authentic Temple Run Wooden Bridge Planks
  static createBridgePlankTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#422815';
    ctx.fillRect(0, 0, 512, 512);

    const planks = 8;
    const h = 512 / planks;
    for (let p = 0; p < planks; p++) {
      const y = p * h;
      ctx.fillStyle = `hsl(24, 38%, ${20 + Math.random() * 12}%)`;
      ctx.fillRect(0, y + 3, 512, h - 6);

      // Deep dark gap between planks
      ctx.fillStyle = '#120a05';
      ctx.fillRect(0, y, 512, 3);

      // Heavy wood grain lines
      ctx.strokeStyle = 'rgba(25, 12, 6, 0.5)';
      ctx.lineWidth = 2;
      for (let g = 0; g < 6; g++) {
        ctx.beginPath();
        const gy = y + 6 + Math.random() * (h - 12);
        ctx.moveTo(0, gy);
        ctx.bezierCurveTo(150, gy + (Math.random() - 0.5) * 6, 350, gy + (Math.random() - 0.5) * 6, 512, gy);
        ctx.stroke();
      }

      // Bound rope cords on left & right ends
      ctx.fillStyle = '#b38249';
      ctx.fillRect(25, y + 4, 18, h - 8);
      ctx.fillRect(469, y + 4, 18, h - 8);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  // Thick Authentic Aztec Gold Medallion Coin
  static createAuthenticCoinTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    const cx = 128;
    const cy = 128;

    // Glowing Aztec gold radial gradient
    const grad = ctx.createRadialGradient(cx, cy, 30, cx, cy, 122);
    grad.addColorStop(0, '#fff494');
    grad.addColorStop(0.3, '#ffcc00');
    grad.addColorStop(0.7, '#d48800');
    grad.addColorStop(1, '#804c00');

    ctx.fillStyle = grad;
    // Octagonal shape
    ctx.beginPath();
    const sides = 8;
    const r = 118;
    for (let i = 0; i < sides; i++) {
      const angle = (i * Math.PI * 2) / sides;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();

    // Raised rim border
    ctx.strokeStyle = '#fff8b3';
    ctx.lineWidth = 7;
    ctx.stroke();

    ctx.strokeStyle = '#6e3f00';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(cx, cy, 88, 0, Math.PI * 2);
    ctx.stroke();

    // Aztec Skull Idol Face in the coin center
    ctx.fillStyle = '#8a5200';
    // Skull forehead
    ctx.beginPath();
    ctx.arc(cx, cy - 8, 38, 0, Math.PI * 2);
    ctx.fill();
    // Square jaw
    ctx.fillRect(cx - 20, cy + 8, 40, 28);

    // Sunken eye sockets
    ctx.fillStyle = '#fff494';
    ctx.beginPath();
    ctx.arc(cx - 14, cy - 8, 10, 0, Math.PI * 2);
    ctx.arc(cx + 14, cy - 8, 10, 0, Math.PI * 2);
    ctx.fill();

    // Teeth grooves
    ctx.fillStyle = '#fff494';
    for (let t = -14; t <= 14; t += 7) {
      ctx.fillRect(cx + t - 2, cy + 18, 4, 14);
    }

    // Gleam shine highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.ellipse(cx - 35, cy - 35, 28, 12, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();

    return new THREE.CanvasTexture(canvas);
  }

  // Flame texture for fire traps & torches
  static createFireTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 60);
    grad.addColorStop(0, 'rgba(255, 255, 220, 1)');
    grad.addColorStop(0.25, 'rgba(255, 170, 20, 0.9)');
    grad.addColorStop(0.65, 'rgba(220, 50, 10, 0.6)');
    grad.addColorStop(1, 'rgba(80, 10, 0, 0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);

    return new THREE.CanvasTexture(canvas);
  }

  // Jungle Tree Bark with moss & vines
  static createJungleBarkTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#2b1c11';
    ctx.fillRect(0, 0, 256, 256);

    for (let i = 0; i < 80; i++) {
      ctx.fillStyle = `hsl(25, 30%, ${12 + Math.random() * 18}%)`;
      ctx.fillRect(Math.random() * 256, 0, 3 + Math.random() * 8, 256);
    }

    // Lush hanging moss
    for (let m = 0; m < 30; m++) {
      ctx.fillStyle = 'rgba(40, 85, 25, 0.4)';
      ctx.beginPath();
      ctx.arc(Math.random() * 256, Math.random() * 256, 12 + Math.random() * 18, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }
}
