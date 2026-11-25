import * as THREE from 'three';
import { Player } from './player.js';
import { WorldManager } from './world.js';
import { DemonMonkeyPack } from './demonMonkey.js';
import { ParticleSystem } from './particles.js';
import { sound } from './audio.js';

class Game {
  constructor() {
    this.container = document.getElementById('game-container');
    this.state = 'START'; // 'START' | 'PLAYING' | 'PAUSED' | 'GAMEOVER'

    // Stats
    this.score = 0;
    this.coins = 0;
    this.distance = 0;
    this.baseSpeed = 25.0;
    this.speed = this.baseSpeed;
    this.maxSpeed = 56.0;

    // Adrenaline Meter (0 to 100%)
    this.adrenaline = 0;

    // Camera screen shake
    this.shakeAmount = 0;

    // High scores
    this.highScore = parseInt(localStorage.getItem('temple_run_highscore') || '0', 10);
    this.bestDist = parseInt(localStorage.getItem('temple_run_bestdist') || '0', 10);

    // Three.js Core
    this.clock = new THREE.Clock();
    this.initThree();

    // Game Systems
    this.particles = new ParticleSystem(this.scene);
    this.player = new Player(this.scene);
    this.world = new WorldManager(this.scene, this.particles);
    this.monkeys = new DemonMonkeyPack(this.scene);

    // Motion tracking
    this.currentDirection = new THREE.Vector3(0, 0, 1);
    this.currentHeading = 0;

    // UI & Controls
    this.initUI();
    this.initControls();

    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  initThree() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0e1a14);
    // Authentic atmospheric jungle fog
    this.scene.fog = new THREE.FogExp2(0x0e1a14, 0.015);

    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(65, aspect, 0.1, 160);
    this.camera.position.set(0, 4.2, -7.5);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // Lighting (Warm golden sunset jungle ambient)
    const ambientLight = new THREE.AmbientLight(0xffeedb, 0.75);
    this.scene.add(ambientLight);

    this.sunLight = new THREE.DirectionalLight(0xfff0d0, 1.5);
    this.sunLight.position.set(25, 45, 20);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 1024;
    this.sunLight.shadow.mapSize.height = 1024;
    this.scene.add(this.sunLight);

    // Under-canal mystic water reflection light
    const canalLight = new THREE.DirectionalLight(0x184228, 0.7);
    canalLight.position.set(0, -25, 0);
    this.scene.add(canalLight);

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  initUI() {
    this.hudScore = document.getElementById('hud-score');
    this.hudCoins = document.getElementById('hud-coins');
    this.hudDist = document.getElementById('hud-distance');
    this.hudMult = document.getElementById('hud-mult');
    this.powerupBadges = document.getElementById('powerup-badges');
    this.turnBanner = document.getElementById('turn-banner');
    this.adrenalineFill = document.getElementById('adrenaline-fill');
    this.adrenalineText = document.getElementById('adrenaline-text');

    this.startModal = document.getElementById('start-modal');
    this.gameoverModal = document.getElementById('gameover-modal');
    this.pauseModal = document.getElementById('pause-modal');

    document.getElementById('start-high-score').textContent = this.highScore.toLocaleString();
    document.getElementById('start-best-dist').textContent = `${this.bestDist} m`;

    document.getElementById('btn-start').addEventListener('click', () => this.startGame());
    document.getElementById('btn-restart').addEventListener('click', () => this.restartGame());
    document.getElementById('btn-pause-restart').addEventListener('click', () => {
      this.pauseModal.classList.add('hidden');
      this.restartGame();
    });

    document.getElementById('btn-pause').addEventListener('click', () => this.togglePause());
    document.getElementById('btn-resume').addEventListener('click', () => this.togglePause());

    // Sound toggle
    const soundBtn = document.getElementById('btn-sound');
    soundBtn.addEventListener('click', () => {
      const enabled = sound.toggleSound();
      soundBtn.textContent = enabled ? '🔊' : '🔇';
    });

    // Tap Adrenaline Bar for Boost when full
    document.getElementById('adrenaline-container').addEventListener('click', () => {
      if (this.adrenaline >= 100 && this.state === 'PLAYING') {
        this.triggerAdrenalineBoost();
      }
    });
  }

  initControls() {
    window.addEventListener('keydown', (e) => {
      if (this.state === 'START' && (e.code === 'Space' || e.code === 'Enter')) {
        this.startGame();
        return;
      }
      if (this.state === 'GAMEOVER' && (e.code === 'Space' || e.code === 'Enter')) {
        this.restartGame();
        return;
      }
      if (e.code === 'KeyP' || e.code === 'Escape') {
        this.togglePause();
        return;
      }
      if (this.state !== 'PLAYING') return;

      switch (e.code) {
        case 'ArrowLeft':
        case 'KeyA':
          this.handleLeft();
          break;
        case 'ArrowRight':
        case 'KeyD':
          this.handleRight();
          break;
        case 'ArrowUp':
        case 'KeyW':
          this.player.jump();
          break;
        case 'ArrowDown':
        case 'KeyS':
          this.player.slide();
          break;
        case 'Space':
          if (this.adrenaline >= 100) {
            this.triggerAdrenalineBoost();
          } else {
            this.player.jump();
          }
          break;
      }
    });

    // Touch Swipe Gestures
    let touchStartX = 0;
    let touchStartY = 0;

    window.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    }, { passive: true });

    window.addEventListener('touchend', (e) => {
      if (this.state !== 'PLAYING') return;
      if (e.changedTouches.length === 0) return;

      const deltaX = e.changedTouches[0].clientX - touchStartX;
      const deltaY = e.changedTouches[0].clientY - touchStartY;
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      if (Math.max(absX, absY) > 22) {
        if (absX > absY) {
          if (deltaX < 0) this.handleLeft();
          else this.handleRight();
        } else {
          if (deltaY < 0) this.player.jump();
          else this.player.slide();
        }
      }
    }, { passive: true });

    // On-Screen Touch Buttons
    document.getElementById('btn-left').addEventListener('click', () => this.handleLeft());
    document.getElementById('btn-right').addEventListener('click', () => this.handleRight());
    document.getElementById('btn-jump').addEventListener('click', () => this.player.jump());
    document.getElementById('btn-slide').addEventListener('click', () => this.player.slide());
  }

  handleLeft() {
    if (this.state !== 'PLAYING') return;
    const upcomingTurn = this.world.getUpcomingTurn(this.player.position);
    if (upcomingTurn && upcomingTurn.turnType === 'left' && upcomingTurn.dist < 6.8) {
      this.executeTurn('left', upcomingTurn.chunk);
    } else {
      this.player.moveLeft();
    }
  }

  handleRight() {
    if (this.state !== 'PLAYING') return;
    const upcomingTurn = this.world.getUpcomingTurn(this.player.position);
    if (upcomingTurn && upcomingTurn.turnType === 'right' && upcomingTurn.dist < 6.8) {
      this.executeTurn('right', upcomingTurn.chunk);
    } else {
      this.player.moveRight();
    }
  }

  executeTurn(turnType, chunk) {
    chunk.passed = true;
    this.turnBanner.classList.add('hidden');

    const angleDelta = turnType === 'left' ? Math.PI / 2 : -Math.PI / 2;
    this.currentHeading += angleDelta;
    this.currentDirection.applyAxisAngle(new THREE.Vector3(0, 1, 0), angleDelta).round();

    this.player.position.copy(chunk.pivot);
    this.player.targetHeading = this.currentHeading;
    this.player.lane = 0;
    this.player.targetX = 0;
    this.player.currentX = 0;

    this.shakeAmount = 0.25;
    sound.playTurn();
  }

  triggerAdrenalineBoost() {
    this.adrenaline = 0;
    this.player.activateBoost(7);
    this.shakeAmount = 0.4;
  }

  startGame() {
    this.startModal.classList.add('hidden');
    this.state = 'PLAYING';
    sound.startMusic();
  }

  togglePause() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      this.pauseModal.classList.remove('hidden');
      sound.stopMusic();
    } else if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      this.pauseModal.classList.add('hidden');
      sound.startMusic();
    }
  }

  restartGame() {
    this.gameoverModal.classList.add('hidden');
    this.pauseModal.classList.add('hidden');
    this.startModal.classList.add('hidden');

    this.score = 0;
    this.coins = 0;
    this.distance = 0;
    this.adrenaline = 0;
    this.speed = this.baseSpeed;
    this.currentHeading = 0;
    this.currentDirection.set(0, 0, 1);
    this.shakeAmount = 0;

    // Clear world
    for (const chunk of this.world.chunks) {
      this.scene.remove(chunk.group);
    }
    for (const obs of this.world.obstacles) {
      this.scene.remove(obs.mesh);
    }
    for (const c of this.world.coins) {
      this.scene.remove(c.mesh);
    }
    for (const p of this.world.powerups) {
      this.scene.remove(p.mesh);
    }
    if (this.world.waterPlane) {
      this.scene.remove(this.world.waterPlane);
    }

    this.scene.remove(this.player.mesh);
    this.monkeys.destroy();

    this.player = new Player(this.scene);
    this.monkeys = new DemonMonkeyPack(this.scene);
    this.world = new WorldManager(this.scene, this.particles);

    this.state = 'PLAYING';
    sound.startMusic();
  }

  gameOver(reason) {
    if (this.state === 'GAMEOVER') return;
    this.state = 'GAMEOVER';
    this.player.die(reason);
    this.monkeys.attackPlayer(this.player.position);
    this.shakeAmount = 0.6;

    if (this.score > this.highScore) {
      this.highScore = Math.floor(this.score);
      localStorage.setItem('temple_run_highscore', this.highScore.toString());
    }
    if (this.distance > this.bestDist) {
      this.bestDist = Math.floor(this.distance);
      localStorage.setItem('temple_run_bestdist', this.bestDist.toString());
    }

    document.getElementById('death-reason').textContent = reason;
    document.getElementById('final-score').textContent = Math.floor(this.score).toLocaleString();
    document.getElementById('final-high-score').textContent = this.highScore.toLocaleString();
    document.getElementById('final-distance').textContent = `${Math.floor(this.distance)} m`;
    document.getElementById('final-coins').textContent = this.coins.toLocaleString();

    setTimeout(() => {
      this.gameoverModal.classList.remove('hidden');
    }, 1100);
  }

  update(dt) {
    if (this.state !== 'PLAYING') {
      if (this.state === 'GAMEOVER') {
        this.player.update(dt, this.speed);
      }
      return;
    }

    // Speed progression
    if (this.player.isBoosted) {
      this.speed = 48.0;
    } else {
      this.speed = Math.min(this.maxSpeed, this.baseSpeed + (this.distance / 120) * 1.8);
    }
    sound.setSpeed(this.speed / this.baseSpeed);

    // Score & Distance progression
    const distDelta = this.speed * dt;
    this.distance += distDelta;

    const mult = (this.player.scoreMultiplier || 1) * (this.player.isBoosted ? 2 : 1);
    this.score += distDelta * 2.5 * mult;

    // Advance forward
    this.player.position.add(this.currentDirection.clone().multiplyScalar(distDelta));

    // Lateral right vector
    const rightVec = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.currentHeading);
    const actualPlayerPos = this.player.position.clone().add(rightVec.clone().multiplyScalar(this.player.currentX));
    actualPlayerPos.y = this.player.y;

    this.player.mesh.position.copy(actualPlayerPos);
    this.player.update(dt, this.speed);

    // Update Monkey Pack
    this.monkeys.update(dt, actualPlayerPos, this.currentHeading, this.player.isStumbling, this.speed);

    // Update World & Particles
    this.world.update(dt, this.player);
    this.particles.update(dt);

    // Approaching Turn Check
    const upcomingTurn = this.world.getUpcomingTurn(this.player.position);
    if (upcomingTurn) {
      this.turnBanner.classList.remove('hidden');
      this.turnBanner.textContent = upcomingTurn.turnType === 'left' ? '◀ TURN LEFT!' : 'TURN RIGHT! ▶';

      // Check if missed turn and ran off edge!
      const distPastPivot = this.player.position.clone().sub(upcomingTurn.chunk.pivot).dot(upcomingTurn.chunk.dir);
      if (distPastPivot > 3.4 && !upcomingTurn.chunk.passed) {
        this.turnBanner.classList.add('hidden');
        this.gameOver('Plunged off the temple rampart into the swamp!');
        return;
      }
    } else {
      this.turnBanner.classList.add('hidden');
    }

    // Collision Detection: Obstacles
    for (const obs of this.world.obstacles) {
      if (obs.passed) continue;

      const dist = actualPlayerPos.distanceTo(obs.center);
      if (dist < obs.radius + 0.6) {
        let safe = false;

        if (obs.type === 'FIRE' || obs.type === 'JUMP' || obs.type === 'GAP') {
          if (this.player.y > 0.52 || this.player.isJumping) {
            safe = true;
          }
        } else if (obs.type === 'SLIDE') {
          if (this.player.isSliding) {
            safe = true;
          }
        } else if (obs.type === 'BLOCK') {
          if (this.player.lane !== obs.lane) {
            safe = true;
          }
        }

        if (this.player.isBoosted) {
          safe = true;
        }

        if (!safe) {
          obs.passed = true;
          if (this.player.hasShield) {
            this.player.hasShield = false;
            this.player.shieldMesh.visible = false;
            this.player.stumble();
            this.shakeAmount = 0.35;
            this.particles.burstDust(actualPlayerPos.x, actualPlayerPos.y, actualPlayerPos.z, 20);
          } else {
            const reasons = {
              'FIRE': 'Incinerated by the gargoyle flame trap!',
              'JUMP': 'Tripped over a fallen jungle log!',
              'GAP': 'Fell through a broken section into the marsh!',
              'SLIDE': 'Smashed into the low stone temple arch!',
              'BLOCK': 'Crashed into a collapsed temple boulder!'
            };
            this.gameOver(reasons[obs.type] || 'Crushed by temple obstacle!');
            return;
          }
        }
      }

      if (actualPlayerPos.distanceTo(obs.center) > 8 && actualPlayerPos.clone().sub(obs.center).dot(this.currentDirection) > 0) {
        obs.passed = true;
      }
    }

    // Collision Detection: Coins
    for (const coin of this.world.coins) {
      if (!coin.collected) {
        const coinPos = coin.mesh.position;
        const dist = actualPlayerPos.distanceTo(coinPos);
        if (dist < 1.6) {
          coin.collected = true;
          this.scene.remove(coin.mesh);

          this.coins++;
          this.score += 50 * mult;
          sound.playCoin();
          this.particles.burstCoins(coinPos.x, coinPos.y, coinPos.z, 14);

          // Fill Adrenaline Meter
          if (this.adrenaline < 100) {
            this.adrenaline = Math.min(100, this.adrenaline + 2.5);
          }
        }
      }
    }

    // Collision Detection: Power-ups
    for (const pow of this.world.powerups) {
      if (!pow.collected) {
        const dist = actualPlayerPos.distanceTo(pow.pos);
        if (dist < 1.8) {
          pow.collected = true;
          this.scene.remove(pow.mesh);

          if (pow.type === 'SHIELD') this.player.activateShield(10);
          else if (pow.type === 'MAGNET') this.player.activateMagnet(12);
          else if (pow.type === 'BOOST') this.player.activateBoost(6);
          else if (pow.type === 'MULTIPLIER') {
            this.player.scoreMultiplier = 2;
            setTimeout(() => { this.player.scoreMultiplier = 1; }, 10000);
            sound.playPowerup();
          }

          this.particles.burstCoins(pow.pos.x, pow.pos.y, pow.pos.z, 24);
        }
      }
    }

    // Update HUD
    this.updateHUD();

    // Camera follow behind player
    const camOffset = this.currentDirection.clone().multiplyScalar(-6.8);
    camOffset.y = 3.6;
    const camRight = rightVec.clone().multiplyScalar(this.player.currentX * 0.4);

    const targetCamPos = this.player.position.clone().add(camOffset).add(camRight);

    // Apply Screen Shake
    if (this.shakeAmount > 0) {
      targetCamPos.x += (Math.random() - 0.5) * this.shakeAmount;
      targetCamPos.y += (Math.random() - 0.5) * this.shakeAmount;
      this.shakeAmount = Math.max(0, this.shakeAmount - dt * 1.5);
    }

    this.camera.position.lerp(targetCamPos, Math.min(1.0, dt * 10));

    const lookTarget = this.player.position.clone().add(this.currentDirection.clone().multiplyScalar(9.0));
    lookTarget.y = 1.3;
    this.camera.lookAt(lookTarget);

    // Sun follows player
    this.sunLight.position.copy(this.player.position).add(new THREE.Vector3(25, 45, 20));
    this.sunLight.target.position.copy(this.player.position);
    this.sunLight.target.updateMatrixWorld();
  }

  updateHUD() {
    this.hudScore.textContent = Math.floor(this.score).toLocaleString();
    this.hudCoins.textContent = this.coins.toLocaleString();
    this.hudDist.textContent = `${Math.floor(this.distance)} m`;
    const mult = (this.player.scoreMultiplier || 1) * (this.player.isBoosted ? 2 : 1);
    this.hudMult.textContent = `${mult}X`;

    // Adrenaline Bar
    this.adrenalineFill.style.width = `${this.adrenaline}%`;
    if (this.adrenaline >= 100) {
      this.adrenalineText.textContent = 'BOOST!';
      this.adrenalineText.style.color = '#fef08a';
      this.adrenalineFill.style.background = 'linear-gradient(90deg, #f59e0b, #fbbf24, #fef08a)';
    } else {
      this.adrenalineText.textContent = `${Math.floor(this.adrenaline)}%`;
      this.adrenalineText.style.color = '#34d399';
      this.adrenalineFill.style.background = 'linear-gradient(90deg, #10b981, #34d399, #6ee7b7)';
    }

    // Powerup Badges
    let badgeHtml = '';
    if (this.player.hasShield) {
      badgeHtml += `<div class="powerup-pill shield">🛡️ Shield ${Math.ceil(this.player.shieldTimer)}s</div>`;
    }
    if (this.player.hasMagnet) {
      badgeHtml += `<div class="powerup-pill magnet">🧲 Magnet ${Math.ceil(this.player.magnetTimer)}s</div>`;
    }
    if (this.player.isBoosted) {
      badgeHtml += `<div class="powerup-pill boost">⚡ Boost ${Math.ceil(this.player.boostTimer)}s</div>`;
    }
    if (this.player.scoreMultiplier > 1) {
      badgeHtml += `<div class="powerup-pill mult">💎 2x Score</div>`;
    }
    this.powerupBadges.innerHTML = badgeHtml;
  }

  animate() {
    requestAnimationFrame(this.animate);
    const dt = Math.min(0.1, this.clock.getDelta());
    this.update(dt);
    this.renderer.render(this.scene, this.camera);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new Game();
});
