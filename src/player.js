import * as THREE from 'three';
import { TextureGenerator } from './textures.js';
import { sound } from './audio.js';

export class Player {
  constructor(scene) {
    this.scene = scene;

    // Movement & state variables
    this.lane = 0; // -1 (left), 0 (center), 1 (right)
    this.laneWidth = 2.4;
    this.targetX = 0;
    this.currentX = 0;

    // Jump & Slide
    this.isJumping = false;
    this.jumpVelocity = 0;
    this.gravity = -38;
    this.jumpForce = 13.5;
    this.y = 0;

    this.isSliding = false;
    this.slideTimer = 0;
    this.slideDuration = 0.75;

    // Orientation & Turning (0 = +Z/Forward, 1 = +X/Right, 2 = -Z/Back, 3 = -X/Left)
    this.headingAngle = 0; // in radians
    this.targetHeading = 0;
    this.position = new THREE.Vector3(0, 0, 0);

    // Stumble state (getting tripped by minor obstacles)
    this.isStumbling = false;
    this.stumbleTimer = 0;

    // Alive state
    this.isDead = false;
    this.deathReason = '';
    this.fallVelocity = 0;

    // Power-up states
    this.hasShield = false;
    this.shieldTimer = 0;
    this.hasMagnet = false;
    this.magnetTimer = 0;
    this.isBoosted = false;
    this.boostTimer = 0;
    this.scoreMultiplier = 1;

    // Animation timer
    this.runCycle = 0;

    // Build 3D Guy Dangerous character mesh
    this.createCharacterMesh();
    this.createPowerupEffects();
  }

  createCharacterMesh() {
    this.mesh = new THREE.Group();

    // Explorer materials
    const skinMat = new THREE.MeshLambertMaterial({ color: 0xdeb887 });
    const shirtMat = new THREE.MeshLambertMaterial({ color: 0xe0d6b3 }); // beige khaki safari shirt
    const vestMat = new THREE.MeshLambertMaterial({ color: 0x6e4720 }); // dark brown leather vest
    const pantsMat = new THREE.MeshLambertMaterial({ color: 0x4a4031 }); // khaki explorer pants
    const bootsMat = new THREE.MeshLambertMaterial({ color: 0x24180e }); // leather boots
    const hatMat = new THREE.MeshLambertMaterial({ color: 0x5a3d1c }); // fedora adventurer hat
    const idolMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 0.85,
      roughness: 0.2,
      emissive: 0x553300
    });

    // Root node for character
    this.bodyRoot = new THREE.Group();
    this.mesh.add(this.bodyRoot);

    // Torso / Chest
    const torsoGeo = new THREE.BoxGeometry(0.7, 0.9, 0.45);
    this.torso = new THREE.Mesh(torsoGeo, shirtMat);
    this.torso.position.y = 1.35;
    this.torso.castShadow = true;
    this.bodyRoot.add(this.torso);

    // Leather vest overlay
    const vestGeo = new THREE.BoxGeometry(0.74, 0.85, 0.48);
    const vest = new THREE.Mesh(vestGeo, vestMat);
    this.torso.add(vest);

    // Explorer Backpack on back
    const packGeo = new THREE.BoxGeometry(0.5, 0.6, 0.3);
    const packMat = new THREE.MeshLambertMaterial({ color: 0x3d2b1f });
    const pack = new THREE.Mesh(packGeo, packMat);
    pack.position.set(0, 0.05, -0.36);
    this.torso.add(pack);

    // Golden Cursed Idol sticking out of backpack!
    const idolGeo = new THREE.CylinderGeometry(0.12, 0.16, 0.35, 8);
    this.idol = new THREE.Mesh(idolGeo, idolMat);
    this.idol.position.set(0, 0.3, -0.38);
    this.idol.rotation.x = -0.3;
    this.torso.add(this.idol);

    // Head
    const headGeo = new THREE.BoxGeometry(0.4, 0.42, 0.4);
    this.head = new THREE.Mesh(headGeo, skinMat);
    this.head.position.set(0, 0.65, 0);
    this.torso.add(this.head);

    // Adventurer Fedora Hat
    const hatBrimGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.05, 16);
    const hatBrim = new THREE.Mesh(hatBrimGeo, hatMat);
    hatBrim.position.set(0, 0.22, 0);
    this.head.add(hatBrim);

    const hatCrownGeo = new THREE.CylinderGeometry(0.24, 0.3, 0.25, 16);
    const hatCrown = new THREE.Mesh(hatCrownGeo, hatMat);
    hatCrown.position.set(0, 0.35, 0);
    this.head.add(hatCrown);

    // Hat Band
    const bandGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.06, 16);
    const bandMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
    const hatBand = new THREE.Mesh(bandGeo, bandMat);
    hatBand.position.set(0, 0.26, 0);
    this.head.add(hatBand);

    // Limbs - Left Arm
    this.leftArm = new THREE.Group();
    this.leftArm.position.set(-0.48, 0.35, 0);
    const armGeo = new THREE.BoxGeometry(0.22, 0.7, 0.22);
    const leftArmMesh = new THREE.Mesh(armGeo, shirtMat);
    leftArmMesh.position.y = -0.32;
    this.leftArm.add(leftArmMesh);
    this.torso.add(this.leftArm);

    // Right Arm
    this.rightArm = new THREE.Group();
    this.rightArm.position.set(0.48, 0.35, 0);
    const rightArmMesh = new THREE.Mesh(armGeo, shirtMat);
    rightArmMesh.position.y = -0.32;
    this.rightArm.add(rightArmMesh);
    this.torso.add(this.rightArm);

    // Left Leg
    this.leftLeg = new THREE.Group();
    this.leftLeg.position.set(-0.2, 0.9, 0);
    const legGeo = new THREE.BoxGeometry(0.26, 0.85, 0.28);
    const leftLegMesh = new THREE.Mesh(legGeo, pantsMat);
    leftLegMesh.position.y = -0.38;
    this.leftLeg.add(leftLegMesh);

    // Left Boot
    const bootGeo = new THREE.BoxGeometry(0.27, 0.2, 0.38);
    const leftBoot = new THREE.Mesh(bootGeo, bootsMat);
    leftBoot.position.set(0, -0.75, 0.05);
    this.leftLeg.add(leftBoot);
    this.bodyRoot.add(this.leftLeg);

    // Right Leg
    this.rightLeg = new THREE.Group();
    this.rightLeg.position.set(0.2, 0.9, 0);
    const rightLegMesh = new THREE.Mesh(legGeo, pantsMat);
    rightLegMesh.position.y = -0.38;
    this.rightLeg.add(rightLegMesh);

    // Right Boot
    const rightBoot = new THREE.Mesh(bootGeo, bootsMat);
    rightBoot.position.set(0, -0.75, 0.05);
    this.rightLeg.add(rightBoot);
    this.bodyRoot.add(this.rightLeg);

    // Shadow blob projector under player
    const shadowGeo = new THREE.CircleGeometry(0.65, 16);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.45,
      depthWrite: false
    });
    this.shadow = new THREE.Mesh(shadowGeo, shadowMat);
    this.shadow.rotation.x = -Math.PI / 2;
    this.shadow.position.y = 0.03;
    this.mesh.add(this.shadow);

    this.scene.add(this.mesh);
  }

  createPowerupEffects() {
    // 1. Shield Energy Dome
    const shieldGeo = new THREE.SphereGeometry(1.3, 16, 16);
    const shieldMat = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.35,
      wireframe: true
    });
    this.shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
    this.shieldMesh.position.y = 1.2;
    this.shieldMesh.visible = false;
    this.mesh.add(this.shieldMesh);

    // 2. Magnet Halo
    const magnetGeo = new THREE.TorusGeometry(0.85, 0.06, 8, 24);
    const magnetMat = new THREE.MeshBasicMaterial({
      color: 0x3388ff,
      transparent: true,
      opacity: 0.7
    });
    this.magnetMesh = new THREE.Mesh(magnetGeo, magnetMat);
    this.magnetMesh.position.y = 2.1;
    this.magnetMesh.rotation.x = Math.PI / 2;
    this.magnetMesh.visible = false;
    this.mesh.add(this.magnetMesh);

    // 3. Boost Trail / Aura
    const boostGeo = new THREE.ConeGeometry(0.9, 2.2, 8);
    const boostMat = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 0.5,
      wireframe: true
    });
    this.boostMesh = new THREE.Mesh(boostGeo, boostMat);
    this.boostMesh.position.set(0, 1.0, -1.2);
    this.boostMesh.rotation.x = -Math.PI / 2;
    this.boostMesh.visible = false;
    this.mesh.add(this.boostMesh);
  }

  // Handle Lane Switching
  moveLeft() {
    if (this.isDead) return;
    if (this.lane > -1) {
      this.lane--;
      this.targetX = this.lane * this.laneWidth;
      sound.playTurn();
    }
  }

  moveRight() {
    if (this.isDead) return;
    if (this.lane < 1) {
      this.lane++;
      this.targetX = this.lane * this.laneWidth;
      sound.playTurn();
    }
  }

  // Handle Jump
  jump() {
    if (this.isDead) return;
    if (!this.isJumping && !this.isSliding) {
      this.isJumping = true;
      this.jumpVelocity = this.jumpForce;
      sound.playJump();
    }
  }

  // Handle Slide / Duck
  slide() {
    if (this.isDead) return;
    if (!this.isSliding) {
      this.isSliding = true;
      this.slideTimer = this.slideDuration;
      if (this.isJumping) {
        // Fast drop if pressed down during jump
        this.jumpVelocity = -20;
      }
      sound.playSlide();
    }
  }

  // Handle Stumble
  stumble() {
    if (this.isBoosted || this.hasShield) return;
    this.isStumbling = true;
    this.stumbleTimer = 1.6;
    sound.playStumble();
  }

  // Powerup activations
  activateShield(duration = 10) {
    this.hasShield = true;
    this.shieldTimer = duration;
    this.shieldMesh.visible = true;
    sound.playPowerup();
  }

  activateMagnet(duration = 12) {
    this.hasMagnet = true;
    this.magnetTimer = duration;
    this.magnetMesh.visible = true;
    sound.playPowerup();
  }

  activateBoost(duration = 6) {
    this.isBoosted = true;
    this.boostTimer = duration;
    this.boostMesh.visible = true;
    sound.playPowerup();
  }

  die(reason = 'Crashed into an obstacle!') {
    if (this.hasShield) {
      // Consume shield instead of dying!
      this.hasShield = false;
      this.shieldMesh.visible = false;
      this.stumble();
      return;
    }
    this.isDead = true;
    this.deathReason = reason;
    sound.playGameOver();
  }

  update(dt, speed, forwardVector) {
    if (this.isDead) {
      // Death tumble animation
      this.bodyRoot.rotation.x += dt * 5;
      this.bodyRoot.rotation.z += dt * 3;
      if (this.deathReason.includes('abyss') || this.deathReason.includes('cliff') || this.deathReason.includes('gap')) {
        this.fallVelocity += this.gravity * dt;
        this.mesh.position.y += this.fallVelocity * dt;
      }
      return;
    }

    // Powerup Timers
    if (this.hasShield) {
      this.shieldTimer -= dt;
      this.shieldMesh.rotation.y += dt * 2;
      if (this.shieldTimer <= 0) {
        this.hasShield = false;
        this.shieldMesh.visible = false;
      }
    }

    if (this.hasMagnet) {
      this.magnetTimer -= dt;
      this.magnetMesh.rotation.z += dt * 4;
      if (this.magnetTimer <= 0) {
        this.hasMagnet = false;
        this.magnetMesh.visible = false;
      }
    }

    if (this.isBoosted) {
      this.boostTimer -= dt;
      this.boostMesh.rotation.z += dt * 10;
      if (this.boostTimer <= 0) {
        this.isBoosted = false;
        this.boostMesh.visible = false;
      }
    }

    if (this.isStumbling) {
      this.stumbleTimer -= dt;
      if (this.stumbleTimer <= 0) {
        this.isStumbling = false;
      }
    }

    // Jump Physics
    if (this.isJumping) {
      this.jumpVelocity += this.gravity * dt;
      this.y += this.jumpVelocity * dt;
      if (this.y <= 0) {
        this.y = 0;
        this.isJumping = false;
        this.jumpVelocity = 0;
      }
    }

    // Slide Timer
    if (this.isSliding) {
      this.slideTimer -= dt;
      if (this.slideTimer <= 0) {
        this.isSliding = false;
      }
    }

    // Lane Lerp (smooth lateral movement)
    this.currentX += (this.targetX - this.currentX) * Math.min(1.0, dt * 14);

    // Smooth heading rotation
    this.headingAngle += (this.targetHeading - this.headingAngle) * Math.min(1.0, dt * 12);
    this.mesh.rotation.y = this.headingAngle;

    // Running Animation cycle
    const runRate = this.isBoosted ? 26 : (speed * 0.45);
    this.runCycle += dt * runRate;

    // Apply animation transforms to limbs
    if (this.isSliding) {
      // Slide pose: player leans back flat, legs stretched forward
      this.bodyRoot.position.y = -0.55;
      this.bodyRoot.rotation.x = -Math.PI / 2.8;
      this.leftLeg.rotation.x = -0.3;
      this.rightLeg.rotation.x = -0.3;
      this.leftArm.rotation.x = 0.8;
      this.rightArm.rotation.x = 0.8;
      this.head.rotation.x = 0.6;
    } else if (this.isJumping) {
      // Jump pose: legs tucked, arms outstretched
      this.bodyRoot.position.y = this.y;
      this.bodyRoot.rotation.x = 0.2;
      this.leftLeg.rotation.x = 0.7;
      this.rightLeg.rotation.x = 0.4;
      this.leftArm.rotation.x = -1.8;
      this.rightArm.rotation.x = -1.8;
      this.head.rotation.x = -0.2;
    } else if (this.isStumbling) {
      // Stumble pose: wobble, off-balance flail
      this.bodyRoot.position.y = 0;
      this.bodyRoot.rotation.x = 0.3 + Math.sin(this.runCycle * 2) * 0.2;
      this.bodyRoot.rotation.z = Math.sin(this.runCycle * 3) * 0.3;
      this.leftArm.rotation.x = Math.sin(this.runCycle * 2) * 1.5;
      this.rightArm.rotation.x = -Math.sin(this.runCycle * 2) * 1.5;
      this.leftLeg.rotation.x = Math.sin(this.runCycle) * 0.8;
      this.rightLeg.rotation.x = -Math.sin(this.runCycle) * 0.8;
    } else {
      // Natural athletic run cycle
      this.bodyRoot.position.y = Math.abs(Math.sin(this.runCycle)) * 0.14;
      this.bodyRoot.rotation.x = 0.16; // Slight forward lean
      this.bodyRoot.rotation.z = (this.targetX - this.currentX) * -0.15; // Lean into lane turns

      const legSwing = Math.sin(this.runCycle) * 0.95;
      this.leftLeg.rotation.x = legSwing;
      this.rightLeg.rotation.x = -legSwing;

      const armSwing = Math.sin(this.runCycle) * 0.95;
      this.leftArm.rotation.x = -armSwing;
      this.rightArm.rotation.x = armSwing;

      this.head.rotation.y = Math.sin(this.runCycle * 0.5) * 0.05;
      this.head.rotation.x = 0;
    }

    // Shadow opacity and scale depending on jump height
    const shadowScale = Math.max(0.3, 1.0 - this.y * 0.25);
    this.shadow.scale.set(shadowScale, shadowScale, 1);
    this.shadow.material.opacity = Math.max(0.1, 0.45 - this.y * 0.1);
  }

  // Get current bounding box for obstacle collision
  getBoundingBox() {
    const center = this.position.clone();
    let height = 1.9;
    let yPos = this.y + 0.95;

    if (this.isSliding) {
      height = 0.7;
      yPos = 0.35;
    }

    const min = new THREE.Vector3(center.x - 0.4, yPos - height / 2, center.z - 0.4);
    const max = new THREE.Vector3(center.x + 0.4, yPos + height / 2, center.z + 0.4);
    return new THREE.Box3(min, max);
  }
}
