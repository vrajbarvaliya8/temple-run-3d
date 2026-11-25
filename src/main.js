import * as THREE from 'three';
import { Player } from './player.js';
import { WorldManager } from './world.js';
import { DemonMonkey } from './demonMonkey.js';
import { ParticleSystem } from './particles.js';
import { sound } from './audio.js';

class Game {
  constructor() {
    this.container = document.getElementById('game-container');
    this.state = 'START'; // 'START' | 'PLAYING' | 'PAUSED' | 'GAMEOVER'

    // Game stats
    this.score = 0;
    this.coins = 0;
    this.distance = 0;
    this.baseSpeed = 24.0;
    this.speed = this.baseSpeed;
    this.maxSpeed = 55.0;
    this.scoreMultiplier = 1;

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
    this.demon = new DemonMonkey(this.scene);

    // Forward motion tracking
    this.currentDirection = new THREE.Vector3(0, 0, 1);
    this.currentHeading = 0; // 0, PI/2, PI, 3PI/2

    // UI elements
    this.initUI();
    this.initControls();

    // Start render loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  initThree() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0e1711);
    this.scene.fog = new THREE.FogExp2(0x0e1711, 0.016);

    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(65, aspect, 0.1, 150);
    this.camera.position.set(0, 4, -7);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffeedd, 0.7);
    this.scene.add(ambientLight);

    this.sunLight = new THREE.DirectionalLight(0xfffaed, 1.4);
    this.sunLight.position.set(20, 40, 20);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 1024;
    this.sunLight.shadow.mapSize.height = 1024;
    this.scene.add(this.sunLight);

    // Ancient bottom chasm glow
    const chasmLight = new THREE.DirectionalLight(0x1a452a, 0.6);
    chasmLight.position.set(0, -20, 0);
    this.scene.add(chasmLight);

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

    this.startModal = document.getElementById('start-modal');
    this.gameoverModal = document.getElementById('gameover-modal');
    this.pauseModal = document.getElementById('pause-modal');

    document.getElementById('start-high-score').textContent = this.highScore.toLocaleString();
    document.getElementById('start-best-dist').textContent = `${this.bestDist} m`;

    // Start Button
    document.getElementById('btn-start').addEventListener('click', () => this.startGame());

    // Restart Buttons
    document.getElementById('btn-restart').addEventListener('click', () => this.restartGame());
    document.getElementById('btn-pause-restart').addEventListener('click', () => {
      this.pauseModal.classList.add('hidden');
      this.restartGame();
    });

    // Pause / Resume
    document.getElementById('btn-pause').addEventListener('click', () => this.togglePause());
    document.getElementById('btn-resume').addEventListener('click', () => this.togglePause());

    // Sound toggle
    const soundBtn = document.getElementById('btn-sound');
    soundBtn.addEventListener('click', () => {
      const enabled = sound.toggleSound();
      soundBtn.textContent = enabled ? '🔊' : '🔇';
    });
  }

  initControls() {
    // Keyboard inputs
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
        case 'Space':
          this.player.jump();
          break;
        case 'ArrowDown':
        case 'KeyS':
          this.player.slide();
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

      if (Math.max(absX, absY) > 25) {
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

  // Handle Left Action (Checks if at Corner Turn first, else Lane Shift)
  handleLeft() {
    if (this.state !== 'PLAYING') return;
    const upcomingTurn = this.world.getUpcomingTurn(this.player.position);
    if (upcomingTurn && upcomingTurn.turnType === 'left' && upcomingTurn.dist < 6.5) {
      this.executeTurn('left', upcomingTurn.chunk);
    } else {
      this.player.moveLeft();
    }
  }

  // Handle Right Action (Checks if at Corner Turn first, else Lane Shift)
  handleRight() {
    if (this.state !== 'PLAYING') return;
    const upcomingTurn = this.world.getUpcomingTurn(this.player.position);
    if (upcomingTurn && upcomingTurn.turnType === 'right' && upcomingTurn.dist < 6.5) {
      this.executeTurn('right', upcomingTurn.chunk);
    } else {
      this.player.moveRight();
    }
  }

  // 90-degree Corner Turn Execution
  executeTurn(turnType, chunk) {
    chunk.passed = true;
    this.turnBanner.classList.add('hidden');

    const angleDelta = turnType === 'left' ? Math.PI / 2 : -Math.PI / 2;
    this.currentHeading += angleDelta;
    this.currentDirection.applyAxisAngle(new THREE.Vector3(0, 1, 0), angleDelta).round();

    // Snap player position onto the junction pivot
    this.player.position.copy(chunk.pivot);
    this.player.targetHeading = this.currentHeading;
    this.player.lane = 0;
    this.player.targetX = 0;
    this.player.currentX = 0;

    sound.playTurn();
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
    // Hide modals
    this.gameoverModal.classList.add('hidden');
    this.pauseModal.classList.add('hidden');
    this.startModal.classList.add('hidden');

    // Reset stats
    this.score = 0;
    this.coins = 0;
    this.distance = 0;
    this.speed = this.baseSpeed;
    this.scoreMultiplier = 1;
    this.currentHeading = 0;
    this.currentDirection.set(0, 0, 1);

    // Clear and rebuild world & player
    for (const chunk of this.world.chunks) {
      this.scene.remove(chunk.group);
    }
    for (const obs of this.world.obstacles) {
      this.scene.remove(obs.mesh);
      if (obs.fx) this.scene.remove(obs.fx);
    }
    for (const c of this.world.coins) {
      this.scene.remove(c.mesh);
    }
    for (const p of this.world.powerups) {
      this.scene.remove(p.mesh);
    }

    this.scene.remove(this.player.mesh);
    this.scene.remove(this.demon.mesh);

    this.player = new Player(this.scene);
    this.demon = new DemonMonkey(this.scene);
    this.world = new WorldManager(this.scene, this.particles);

    this.state = 'PLAYING';
    sound.startMusic();
  }

  gameOver(reason) {
    if (this.state === 'GAMEOVER') return;
    this.state = 'GAMEOVER';
    this.player.die(reason);
    this.demon.attackPlayer(this.player.position);

    // Update High Scores in localStorage
    if (this.score > this.highScore) {
      this.highScore = Math.floor(this.score);
      localStorage.setItem('temple_run_highscore', this.highScore.toString());
    }
    if (this.distance > this.bestDist) {
      this.bestDist = Math.floor(this.distance);
      localStorage.setItem('temple_run_bestdist', this.bestDist.toString());
    }

    // Populate Game Over Modal
    document.getElementById('death-reason').textContent = reason;
    document.getElementById('final-score').textContent = Math.floor(this.score).toLocaleString();
    document.getElementById('final-high-score').textContent = this.highScore.toLocaleString();
    document.getElementById('final-distance').textContent = `${Math.floor(this.distance)} m`;
    document.getElementById('final-coins').textContent = this.coins.toLocaleString();

    // Show modal after brief dramatic delay
    setTimeout(() => {
      this.gameoverModal.classList.remove('hidden');
    }, 1100);
  }

  update(dt) {
    if (this.state !== 'PLAYING') {
      if (this.state === 'GAMEOVER') {
        this.player.update(dt, this.speed, this.currentDirection);
      }
      return;
    }

    // Speed progression
    if (this.player.isBoosted) {
      this.speed = 46.0;
    } else {
      this.speed = Math.min(this.maxSpeed, this.baseSpeed + (this.distance / 120) * 1.8);
    }
    sound.setSpeed(this.speed / this.baseSpeed);

    // Score & Distance progression
    const distDelta = this.speed * dt;
    this.distance += distDelta;

    const mult = (this.player.scoreMultiplier || 1) * (this.player.isBoosted ? 2 : 1);
    this.score += distDelta * 2.5 * mult;

    // Advance player forward along current corridor
    this.player.position.add(this.currentDirection.clone().multiplyScalar(distDelta));

    // Calculate lateral right vector for lane offset
    const rightVec = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.currentHeading);
    const actualPlayerPos = this.player.position.clone().add(rightVec.clone().multiplyScalar(this.player.currentX));
    actualPlayerPos.y = this.player.y;

    this.player.mesh.position.copy(actualPlayerPos);
    this.player.update(dt, this.speed, this.currentDirection);

    // Update Demon Monkey
    this.demon.update(dt, actualPlayerPos, this.currentHeading, this.player.isStumbling, this.speed);

    // Update World & Particles
    this.world.update(dt, this.player);
    this.particles.update(dt);

    // Check Upcoming Turn Warning
    const upcomingTurn = this.world.getUpcomingTurn(this.player.position);
    if (upcomingTurn) {
      this.turnBanner.classList.remove('hidden');
      this.turnBanner.textContent = upcomingTurn.turnType === 'left' ? '◀ TURN LEFT!' : 'TURN RIGHT! ▶';

      // Check if player missed the turn and ran straight off the cliff!
      const distPastPivot = this.player.position.clone().sub(upcomingTurn.chunk.pivot).dot(upcomingTurn.chunk.dir);
      if (distPastPivot > 3.2 && !upcomingTurn.chunk.passed) {
        this.turnBanner.classList.add('hidden');
        this.gameOver('Plunged off the cliff into the abyss!');
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
        // Player is at obstacle location!
        let safe = false;

        if (obs.type === 'FIRE' || obs.type === 'JUMP') {
          // Requires jumping high enough
          if (this.player.y > 0.55 || this.player.isJumping) {
            safe = true;
          }
        } else if (obs.type === 'SLIDE') {
          // Requires sliding under
          if (this.player.isSliding) {
            safe = true;
          }
        } else if (obs.type === 'BLOCK') {
          // Safe if player is in a different lane
          if (this.player.lane !== obs.lane) {
            safe = true;
          }
        }

        if (this.player.isBoosted) {
          safe = true; // Invincible during boost
        }

        if (!safe) {
          obs.passed = true;
          if (this.player.hasShield) {
            this.player.hasShield = false;
            this.player.shieldMesh.visible = false;
            this.player.stumble();
            this.particles.burstDust(actualPlayerPos.x, actualPlayerPos.y, actualPlayerPos.z, 20);
          } else {
            const reasons = {
              'FIRE': 'Incinerated in the temple fire trap!',
              'JUMP': 'Tripped over ancient jungle roots!',
              'SLIDE': 'Smashed into the low stone arch!',
              'BLOCK': 'Crashed into a collapsed temple boulder!'
            };
            this.gameOver(reasons[obs.type] || 'Crushed by temple obstacle!');
            return;
          }
        }
      }

      // Mark passed if far behind
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

    // Camera follow smoothly behind player
    const camOffset = this.currentDirection.clone().multiplyScalar(-6.8);
    camOffset.y = 3.6;
    // Add subtle camera tilt based on lane change
    const camRight = rightVec.clone().multiplyScalar(this.player.currentX * 0.4);

    const targetCamPos = this.player.position.clone().add(camOffset).add(camRight);
    this.camera.position.lerp(targetCamPos, Math.min(1.0, dt * 10));

    // Camera look ahead along corridor
    const lookTarget = this.player.position.clone().add(this.currentDirection.clone().multiplyScalar(9.0));
    lookTarget.y = 1.3;
    this.camera.lookAt(lookTarget);

    // Directional sunlight follow player
    this.sunLight.position.copy(this.player.position).add(new THREE.Vector3(20, 35, 15));
    this.sunLight.target.position.copy(this.player.position);
    this.sunLight.target.updateMatrixWorld();
  }

  updateHUD() {
    this.hudScore.textContent = Math.floor(this.score).toLocaleString();
    this.hudCoins.textContent = this.coins.toLocaleString();
    this.hudDist.textContent = `${Math.floor(this.distance)} m`;
    const mult = (this.player.scoreMultiplier || 1) * (this.player.isBoosted ? 2 : 1);
    this.hudMult.textContent = `${mult}X`;

    // Update powerup badges
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

// Start Game Instance
window.addEventListener('DOMContentLoaded', () => {
  new Game();
});
