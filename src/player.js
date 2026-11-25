import * as THREE from 'three';
import { sound } from './audio.js';

export class Player {
  constructor(scene) {
    this.scene = scene;

    // Movement & state variables
    this.lane = 0; // -1 (left), 0 (center), 1 (right)
    this.laneWidth = 2.4;
    this.targetX = 0;
    this.currentX = 0;

    // Jump & Slide Physics
    this.isJumping = false;
    this.jumpVelocity = 0;
    this.gravity = -40;
    this.jumpForce = 14.5;
    this.y = 0;

    this.isSliding = false;
    this.slideTimer = 0;
    this.slideDuration = 0.8;

    // Orientation & Turning (radians)
    this.headingAngle = 0;
    this.targetHeading = 0;
    this.position = new THREE.Vector3(0, 0, 0);

    // Stumble
    this.isStumbling = false;
    this.stumbleTimer = 0;

    // Life State
    this.isDead = false;
    this.deathReason = '';
    this.fallVelocity = 0;

    // Power-ups
    this.hasShield = false;
    this.shieldTimer = 0;
    this.hasMagnet = false;
    this.magnetTimer = 0;
    this.isBoosted = false;
    this.boostTimer = 0;
    this.scoreMultiplier = 1;

    // Animation cycle
    this.runCycle = 0;

    // Build Authentic Guy Dangerous 3D Model
    this.createCharacterMesh();
    this.createPowerupEffects();
  }

  createCharacterMesh() {
    this.mesh = new THREE.Group();

    // Authentic materials
    const skinMat = new THREE.MeshLambertMaterial({ color: 0xdeb887 });
    const hairMat = new THREE.MeshLambertMaterial({ color: 0x4a2e18 });
    const jacketMat = new THREE.MeshLambertMaterial({ color: 0x5c3818 }); // Brown leather bomber jacket
    const shirtMat = new THREE.MeshLambertMaterial({ color: 0xf0ebd8 }); // White explorer shirt
    const pantsMat = new THREE.MeshLambertMaterial({ color: 0x8a7b62 }); // Khaki cargo trousers
    const bootsMat = new THREE.MeshLambertMaterial({ color: 0x2b1c10 }); // Dark leather combat boots
    const beltMat = new THREE.MeshLambertMaterial({ color: 0x1f140a }); // Leather utility belt
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 0.9,
      roughness: 0.2,
      emissive: 0x442e00
    });

    this.bodyRoot = new THREE.Group();
    this.mesh.add(this.bodyRoot);

    // Pelvis / Hips
    const hipGeo = new THREE.BoxGeometry(0.68, 0.35, 0.42);
    this.hips = new THREE.Mesh(hipGeo, pantsMat);
    this.hips.position.y = 1.05;
    this.bodyRoot.add(this.hips);

    // Utility belt & gold buckle
    const beltGeo = new THREE.BoxGeometry(0.72, 0.12, 0.46);
    const belt = new THREE.Mesh(beltGeo, beltMat);
    this.hips.add(belt);

    const buckleGeo = new THREE.BoxGeometry(0.18, 0.14, 0.48);
    const buckle = new THREE.Mesh(buckleGeo, goldMat);
    this.hips.add(buckle);

    // Explorer Canteen & Gun Holster on hips
    const holsterGeo = new THREE.BoxGeometry(0.14, 0.3, 0.22);
    const holster = new THREE.Mesh(holsterGeo, beltMat);
    holster.position.set(0.38, -0.05, 0);
    this.hips.add(holster);

    const canteenGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.22, 8);
    const canteen = new THREE.Mesh(canteenGeo, new THREE.MeshLambertMaterial({ color: 0x556b2f }));
    canteen.position.set(-0.38, 0, 0);
    canteen.rotation.z = Math.PI / 2;
    this.hips.add(canteen);

    // Torso (Spine & Chest)
    const torsoGeo = new THREE.BoxGeometry(0.72, 0.78, 0.44);
    this.torso = new THREE.Mesh(torsoGeo, jacketMat);
    this.torso.position.y = 0.55;
    this.hips.add(this.torso);

    // Open jacket showing explorer undershirt
    const shirtGeo = new THREE.BoxGeometry(0.32, 0.72, 0.46);
    const innerShirt = new THREE.Mesh(shirtGeo, shirtMat);
    this.torso.add(innerShirt);

    // Leather Backpack on back holding the Golden Cursed Idol!
    const packGeo = new THREE.BoxGeometry(0.52, 0.58, 0.28);
    const pack = new THREE.Mesh(packGeo, new THREE.MeshLambertMaterial({ color: 0x3d2612 }));
    pack.position.set(0, 0.05, -0.34);
    this.torso.add(pack);

    // Golden Cursed Idol sticking out of backpack!
    const idolGeo = new THREE.CylinderGeometry(0.12, 0.16, 0.38, 8);
    this.idol = new THREE.Mesh(idolGeo, goldMat);
    this.idol.position.set(0, 0.32, -0.34);
    this.idol.rotation.x = -0.28;
    this.torso.add(this.idol);

    // Head & Neck
    const neckGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.16, 8);
    const neck = new THREE.Mesh(neckGeo, skinMat);
    neck.position.y = 0.45;
    this.torso.add(neck);

    const headGeo = new THREE.BoxGeometry(0.38, 0.4, 0.38);
    this.head = new THREE.Mesh(headGeo, skinMat);
    this.head.position.y = 0.25;
    neck.add(this.head);

    // Hair
    const hairGeo = new THREE.BoxGeometry(0.42, 0.16, 0.42);
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.y = 0.18;
    this.head.add(hair);

    // Explorer Aviator Goggles on forehead
    const goggleBandGeo = new THREE.BoxGeometry(0.42, 0.08, 0.42);
    const goggleBand = new THREE.Mesh(goggleBandGeo, beltMat);
    goggleBand.position.y = 0.08;
    this.head.add(goggleBand);

    const lensGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.06, 12);
    const lensMat = new THREE.MeshStandardMaterial({ color: 0x113344, roughness: 0.1, metalness: 0.9 });
    const leftLens = new THREE.Mesh(lensGeo, lensMat);
    leftLens.rotation.x = Math.PI / 2;
    leftLens.position.set(-0.12, 0.08, 0.2);
    this.head.add(leftLens);

    const rightLens = new THREE.Mesh(lensGeo, lensMat);
    rightLens.rotation.x = Math.PI / 2;
    rightLens.position.set(0.12, 0.08, 0.2);
    this.head.add(rightLens);

    // Arms (Shoulders + Forearms)
    const armGeo = new THREE.BoxGeometry(0.22, 0.65, 0.22);

    this.leftArm = new THREE.Group();
    this.leftArm.position.set(-0.48, 0.32, 0);
    const leftArmMesh = new THREE.Mesh(armGeo, jacketMat);
    leftArmMesh.position.y = -0.28;
    this.leftArm.add(leftArmMesh);
    this.torso.add(this.leftArm);

    this.rightArm = new THREE.Group();
    this.rightArm.position.set(0.48, 0.32, 0);
    const rightArmMesh = new THREE.Mesh(armGeo, jacketMat);
    rightArmMesh.position.y = -0.28;
    this.rightArm.add(rightArmMesh);
    this.torso.add(this.rightArm);

    // Legs & Combat Boots
    const legGeo = new THREE.BoxGeometry(0.26, 0.75, 0.26);

    this.leftLeg = new THREE.Group();
    this.leftLeg.position.set(-0.2, 0, 0);
    const leftLegMesh = new THREE.Mesh(legGeo, pantsMat);
    leftLegMesh.position.y = -0.35;
    this.leftLeg.add(leftLegMesh);

    const leftBoot = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.22, 0.38), bootsMat);
    leftBoot.position.set(0, -0.72, 0.05);
    this.leftLeg.add(leftBoot);
    this.hips.add(this.leftLeg);

    this.rightLeg = new THREE.Group();
    this.rightLeg.position.set(0.2, 0, 0);
    const rightLegMesh = new THREE.Mesh(legGeo, pantsMat);
    rightLegMesh.position.y = -0.35;
    this.rightLeg.add(rightLegMesh);

    const rightBoot = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.22, 0.38), bootsMat);
    rightBoot.position.set(0, -0.72, 0.05);
    this.rightLeg.add(rightBoot);
    this.hips.add(this.rightLeg);

    // Shadow blob projector
    const shadowGeo = new THREE.CircleGeometry(0.7, 16);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.5,
      depthWrite: false
    });
    this.shadow = new THREE.Mesh(shadowGeo, shadowMat);
    this.shadow.rotation.x = -Math.PI / 2;
    this.shadow.position.y = 0.04;
    this.mesh.add(this.shadow);

    this.scene.add(this.mesh);
  }

  createPowerupEffects() {
    // 1. Shield Energy Dome
    const shieldGeo = new THREE.SphereGeometry(1.35, 16, 16);
    const shieldMat = new THREE.MeshBasicMaterial({
      color: 0x00ffcc,
      transparent: true,
      opacity: 0.38,
      wireframe: true
    });
    this.shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
    this.shieldMesh.position.y = 1.2;
    this.shieldMesh.visible = false;
    this.mesh.add(this.shieldMesh);

    // 2. Magnet Ring
    const magnetGeo = new THREE.TorusGeometry(0.9, 0.07, 8, 24);
    const magnetMat = new THREE.MeshBasicMaterial({
      color: 0x3388ff,
      transparent: true,
      opacity: 0.75
    });
    this.magnetMesh = new THREE.Mesh(magnetGeo, magnetMat);
    this.magnetMesh.position.y = 2.1;
    this.magnetMesh.rotation.x = Math.PI / 2;
    this.magnetMesh.visible = false;
    this.mesh.add(this.magnetMesh);

    // 3. Boost Trail
    const boostGeo = new THREE.ConeGeometry(1.0, 2.5, 8);
    const boostMat = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 0.55,
      wireframe: true
    });
    this.boostMesh = new THREE.Mesh(boostGeo, boostMat);
    this.boostMesh.position.set(0, 1.1, -1.3);
    this.boostMesh.rotation.x = -Math.PI / 2;
    this.boostMesh.visible = false;
    this.mesh.add(this.boostMesh);
  }

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

  jump() {
    if (this.isDead) return;
    if (!this.isJumping && !this.isSliding) {
      this.isJumping = true;
      this.jumpVelocity = this.jumpForce;
      sound.playJump();
    }
  }

  slide() {
    if (this.isDead) return;
    if (!this.isSliding) {
      this.isSliding = true;
      this.slideTimer = this.slideDuration;
      if (this.isJumping) {
        this.jumpVelocity = -22; // Fast drop
      }
      sound.playSlide();
    }
  }

  stumble() {
    if (this.isBoosted || this.hasShield) return;
    this.isStumbling = true;
    this.stumbleTimer = 1.8;
    sound.playStumble();
  }

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
      this.hasShield = false;
      this.shieldMesh.visible = false;
      this.stumble();
      return;
    }
    this.isDead = true;
    this.deathReason = reason;
    sound.playGameOver();
  }

  update(dt, speed) {
    if (this.isDead) {
      this.bodyRoot.rotation.x += dt * 5;
      this.bodyRoot.rotation.z += dt * 3;
      if (this.deathReason.includes('abyss') || this.deathReason.includes('cliff') || this.deathReason.includes('gap') || this.deathReason.includes('water')) {
        this.fallVelocity += this.gravity * dt;
        this.mesh.position.y += this.fallVelocity * dt;
      }
      return;
    }

    // Powerup Timers
    if (this.hasShield) {
      this.shieldTimer -= dt;
      this.shieldMesh.rotation.y += dt * 2.5;
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

    // Lane Lerp (smooth lateral change)
    this.currentX += (this.targetX - this.currentX) * Math.min(1.0, dt * 15);

    // Smooth heading rotation
    this.headingAngle += (this.targetHeading - this.headingAngle) * Math.min(1.0, dt * 14);
    this.mesh.rotation.y = this.headingAngle;

    // Running rate
    const runRate = this.isBoosted ? 28 : (speed * 0.48);
    this.runCycle += dt * runRate;

    // Temple Run Authentic Body Poses
    if (this.isSliding) {
      // Classic Slide Pose: Guy leans back, legs extend flat on the pavers
      this.bodyRoot.position.y = -0.58;
      this.bodyRoot.rotation.x = -Math.PI / 2.7;
      this.leftLeg.rotation.x = -0.3;
      this.rightLeg.rotation.x = -0.3;
      this.leftArm.rotation.x = 0.85;
      this.rightArm.rotation.x = 0.85;
      this.head.rotation.x = 0.65;
    } else if (this.isJumping) {
      // Classic Jump Pose: Athletic parabolic leap, knees tucked high, arms raised
      this.bodyRoot.position.y = this.y;
      this.bodyRoot.rotation.x = 0.25;
      this.leftLeg.rotation.x = 0.85;
      this.rightLeg.rotation.x = 0.55;
      this.leftArm.rotation.x = -1.9;
      this.rightArm.rotation.x = -1.9;
      this.head.rotation.x = -0.2;
    } else if (this.isStumbling) {
      // Classic Stumble: Tripping forward, arms windmilling
      this.bodyRoot.position.y = 0;
      this.bodyRoot.rotation.x = 0.35 + Math.sin(this.runCycle * 2) * 0.25;
      this.bodyRoot.rotation.z = Math.sin(this.runCycle * 3) * 0.35;
      this.leftArm.rotation.x = Math.sin(this.runCycle * 2) * 1.6;
      this.rightArm.rotation.x = -Math.sin(this.runCycle * 2) * 1.6;
      this.leftLeg.rotation.x = Math.sin(this.runCycle) * 0.8;
      this.rightLeg.rotation.x = -Math.sin(this.runCycle) * 0.8;
    } else {
      // Athletic Sprint: Pelvis bounce, leg swing, rhythmic arm drive, lane banking
      this.bodyRoot.position.y = Math.abs(Math.sin(this.runCycle)) * 0.16;
      this.bodyRoot.rotation.x = 0.18; // Athletic forward drive
      this.bodyRoot.rotation.z = (this.targetX - this.currentX) * -0.16; // Lean into lane turns

      const legSwing = Math.sin(this.runCycle) * 1.05;
      this.leftLeg.rotation.x = legSwing;
      this.rightLeg.rotation.x = -legSwing;

      const armSwing = Math.sin(this.runCycle) * 1.05;
      this.leftArm.rotation.x = -armSwing;
      this.rightArm.rotation.x = armSwing;

      this.head.rotation.y = Math.sin(this.runCycle * 0.5) * 0.05;
      this.head.rotation.x = 0;
    }

    // Shadow scaling
    const shadowScale = Math.max(0.25, 1.0 - this.y * 0.25);
    this.shadow.scale.set(shadowScale, shadowScale, 1);
    this.shadow.material.opacity = Math.max(0.08, 0.5 - this.y * 0.12);
  }
}
