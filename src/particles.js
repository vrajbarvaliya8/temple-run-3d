import * as THREE from 'three';
import { TextureGenerator } from './textures.js';

export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
    this.fireTexture = TextureGenerator.createFireTexture();

    // Material for gold sparks
    this.sparkGeo = new THREE.BufferGeometry();
    const count = 300;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    this.sparkGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.sparkGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    this.sparkMat = new THREE.PointsMaterial({
      size: 0.28,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending
    });

    this.sparkPoints = new THREE.Points(this.sparkGeo, this.sparkMat);
    this.scene.add(this.sparkPoints);
    this.activeSparks = [];
  }

  // Golden explosion when collecting a coin
  burstCoins(x, y, z, count = 16) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2.5 + Math.random() * 4.5;
      this.activeSparks.push({
        x: x,
        y: y + 0.5,
        z: z,
        vx: Math.cos(angle) * speed,
        vy: 2.0 + Math.random() * 4.5,
        vz: Math.sin(angle) * speed,
        life: 0.6 + Math.random() * 0.4,
        maxLife: 1.0,
        r: 1.0,
        g: 0.8 + Math.random() * 0.2,
        b: 0.1
      });
    }
  }

  // Dust puff when landing or sliding
  burstDust(x, y, z, count = 8) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.8 + Math.random() * 1.5;
      this.activeSparks.push({
        x: x + (Math.random() - 0.5) * 0.4,
        y: y + 0.1,
        z: z + (Math.random() - 0.5) * 0.4,
        vx: Math.cos(angle) * speed,
        vy: 0.5 + Math.random() * 1.5,
        vz: Math.sin(angle) * speed,
        life: 0.4 + Math.random() * 0.3,
        maxLife: 0.7,
        r: 0.6,
        g: 0.55,
        b: 0.45
      });
    }
  }

  // Fire torch ember emission
  spawnEmber(x, y, z) {
    this.activeSparks.push({
      x: x + (Math.random() - 0.5) * 0.2,
      y: y,
      z: z + (Math.random() - 0.5) * 0.2,
      vx: (Math.random() - 0.5) * 0.5,
      vy: 1.5 + Math.random() * 1.5,
      vz: (Math.random() - 0.5) * 0.5,
      life: 0.5 + Math.random() * 0.5,
      maxLife: 1.0,
      r: 1.0,
      g: 0.4 + Math.random() * 0.4,
      b: 0.05
    });
  }

  update(dt) {
    const pos = this.sparkGeo.attributes.position.array;
    const col = this.sparkGeo.attributes.color.array;

    for (let i = this.activeSparks.length - 1; i >= 0; i--) {
      const p = this.activeSparks[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.activeSparks.splice(i, 1);
        continue;
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      p.vy -= 8.0 * dt; // gravity

      const idx = i * 3;
      if (idx + 2 < pos.length) {
        pos[idx] = p.x;
        pos[idx + 1] = p.y;
        pos[idx + 2] = p.z;

        const alpha = p.life / p.maxLife;
        col[idx] = p.r * alpha;
        col[idx + 1] = p.g * alpha;
        col[idx + 2] = p.b * alpha;
      }
    }

    // Zero out unused slots
    for (let i = this.activeSparks.length; i < 100; i++) {
      const idx = i * 3;
      if (idx + 2 < pos.length) {
        pos[idx] = 0;
        pos[idx + 1] = -999;
        pos[idx + 2] = 0;
      }
    }

    this.sparkGeo.attributes.position.needsUpdate = true;
    this.sparkGeo.attributes.color.needsUpdate = true;
  }
}
