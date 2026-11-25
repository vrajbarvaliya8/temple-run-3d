import * as THREE from 'three';
import { sound } from './audio.js';

// Single Demon Monkey mesh generator
function createDemonMonkeyMesh(scale = 1.0) {
  const root = new THREE.Group();

  const furMat = new THREE.MeshLambertMaterial({ color: 0x16100a }); // jet dark demon fur
  const skinMat = new THREE.MeshLambertMaterial({ color: 0x24180f }); // dark leathery chest
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff1100 }); // glowing red demon eyes
  const fangMat = new THREE.MeshLambertMaterial({ color: 0xffffff }); // sharp white fangs
  const hornMat = new THREE.MeshLambertMaterial({ color: 0x050403 });

  // Body container
  const body = new THREE.Group();
  root.add(body);

  // Heavy hunched ape torso
  const torsoGeo = new THREE.BoxGeometry(1.2 * scale, 1.1 * scale, 0.9 * scale);
  const torso = new THREE.Mesh(torsoGeo, furMat);
  torso.position.y = 1.1 * scale;
  body.add(torso);

  // Muscular chest
  const chestGeo = new THREE.BoxGeometry(0.95 * scale, 0.8 * scale, 0.35 * scale);
  const chest = new THREE.Mesh(chestGeo, skinMat);
  chest.position.set(0, 0.1 * scale, 0.35 * scale);
  torso.add(chest);

  // Demonic Head
  const headGeo = new THREE.BoxGeometry(0.75 * scale, 0.7 * scale, 0.75 * scale);
  const head = new THREE.Mesh(headGeo, furMat);
  head.position.set(0, 0.75 * scale, 0.35 * scale);
  torso.add(head);

  // Glowing Eyes
  const eyeGeo = new THREE.SphereGeometry(0.09 * scale, 8, 8);
  const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
  leftEye.position.set(-0.22 * scale, 0.1 * scale, 0.4 * scale);
  head.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
  rightEye.position.set(0.22 * scale, 0.1 * scale, 0.4 * scale);
  head.add(rightEye);

  // Curved Demonic Horns
  const hornGeo = new THREE.ConeGeometry(0.1 * scale, 0.5 * scale, 6);
  const leftHorn = new THREE.Mesh(hornGeo, hornMat);
  leftHorn.position.set(-0.3 * scale, 0.45 * scale, 0);
  leftHorn.rotation.z = 0.55;
  leftHorn.rotation.x = -0.25;
  head.add(leftHorn);

  const rightHorn = new THREE.Mesh(hornGeo, hornMat);
  rightHorn.position.set(0.3 * scale, 0.45 * scale, 0);
  rightHorn.rotation.z = -0.55;
  rightHorn.rotation.x = -0.25;
  head.add(rightHorn);

  // Snapping Jaw & Fangs
  const jaw = new THREE.Group();
  jaw.position.set(0, -0.25 * scale, 0.25 * scale);
  const jawMesh = new THREE.Mesh(new THREE.BoxGeometry(0.6 * scale, 0.22 * scale, 0.5 * scale), furMat);
  jaw.add(jawMesh);

  // Fangs
  const fangGeo = new THREE.ConeGeometry(0.05 * scale, 0.2 * scale, 4);
  for (let f = -0.18 * scale; f <= 0.18 * scale; f += 0.12 * scale) {
    const topFang = new THREE.Mesh(fangGeo, fangMat);
    topFang.position.set(f, -0.12 * scale, 0.4 * scale);
    topFang.rotation.x = Math.PI;
    head.add(topFang);

    const botFang = new THREE.Mesh(fangGeo, fangMat);
    botFang.position.set(f, 0.1 * scale, 0.22 * scale);
    jaw.add(botFang);
  }
  head.add(jaw);

  // Gorilla Front Arms
  const armGeo = new THREE.BoxGeometry(0.35 * scale, 1.2 * scale, 0.35 * scale);

  const leftArm = new THREE.Group();
  leftArm.position.set(-0.8 * scale, 0.35 * scale, 0.2 * scale);
  const leftArmMesh = new THREE.Mesh(armGeo, furMat);
  leftArmMesh.position.y = -0.5 * scale;
  leftArm.add(leftArmMesh);
  torso.add(leftArm);

  const rightArm = new THREE.Group();
  rightArm.position.set(0.8 * scale, 0.35 * scale, 0.2 * scale);
  const rightArmMesh = new THREE.Mesh(armGeo, furMat);
  rightArmMesh.position.y = -0.5 * scale;
  rightArm.add(rightArmMesh);
  torso.add(rightArm);

  // Hind Legs
  const legGeo = new THREE.BoxGeometry(0.38 * scale, 0.85 * scale, 0.38 * scale);

  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.4 * scale, 0.65 * scale, -0.2 * scale);
  const leftLegMesh = new THREE.Mesh(legGeo, furMat);
  leftLegMesh.position.y = -0.38 * scale;
  leftLeg.add(leftLegMesh);
  body.add(leftLeg);

  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.4 * scale, 0.65 * scale, -0.2 * scale);
  const rightLegMesh = new THREE.Mesh(legGeo, furMat);
  rightLegMesh.position.y = -0.38 * scale;
  rightLeg.add(rightLegMesh);
  body.add(rightLeg);

  return {
    root,
    body,
    torso,
    head,
    jaw,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    scale
  };
}

// Authentic Temple Run: Pack of 3 Evil Demon Monkeys
export class DemonMonkeyPack {
  constructor(scene) {
    this.scene = scene;
    this.distance = 9.5;
    this.targetDistance = 9.5;
    this.runCycle = 0;
    this.growlTimer = 2.5;

    this.group = new THREE.Group();
    this.scene.add(this.group);

    // 1. Giant Alpha Leader (Center)
    this.alpha = createDemonMonkeyMesh(1.25);
    this.group.add(this.alpha.root);

    // 2. Left Pack Hunter
    this.leftHunter = createDemonMonkeyMesh(0.95);
    this.leftHunter.root.position.set(-1.8, 0, -1.2);
    this.group.add(this.leftHunter.root);

    // 3. Right Pack Hunter
    this.rightHunter = createDemonMonkeyMesh(0.95);
    this.rightHunter.root.position.set(1.8, 0, -1.2);
    this.group.add(this.rightHunter.root);

    this.monkeys = [this.alpha, this.leftHunter, this.rightHunter];
  }

  update(dt, playerPosition, playerHeading, isPlayerStumbling, speed) {
    // When player stumbles, the entire pack lunges forward to snap at Guy's heels!
    if (isPlayerStumbling) {
      this.targetDistance = 3.2;
    } else {
      this.targetDistance = 9.2;
    }

    this.distance += (this.targetDistance - this.distance) * Math.min(1.0, dt * 4.5);

    // Position monkey pack behind player along orientation vector
    const backwardVector = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), playerHeading);
    const targetPos = playerPosition.clone().add(backwardVector.clone().multiplyScalar(this.distance));

    this.group.position.lerp(targetPos, Math.min(1.0, dt * 10));
    this.group.rotation.y = playerHeading;

    // Snarl / Growl sound timer
    this.growlTimer -= dt;
    if (this.growlTimer <= 0) {
      if (this.distance < 6.5) {
        sound.playDemonGrowl();
      }
      this.growlTimer = 3.5 + Math.random() * 2.5;
    }

    // Heavy quadrupedal gallop animation cycle
    this.runCycle += dt * (speed * 0.52);

    this.monkeys.forEach((m, idx) => {
      const phase = this.runCycle + idx * 0.8;
      const gallop = Math.sin(phase);

      m.body.position.y = Math.abs(gallop) * (0.24 * m.scale);
      m.body.rotation.x = 0.22 + gallop * 0.08;

      // Pounding front arms
      m.leftArm.rotation.x = gallop * 1.15;
      m.rightArm.rotation.x = -gallop * 1.15;

      // Galloping hind legs
      m.leftLeg.rotation.x = -gallop * 0.95;
      m.rightLeg.rotation.x = gallop * 0.95;

      // Snapping jaws
      m.jaw.rotation.x = 0.12 + Math.abs(Math.sin(phase * 1.6)) * 0.38;
    });
  }

  attackPlayer(playerPosition) {
    this.group.position.lerp(playerPosition, 0.5);
    this.monkeys.forEach(m => {
      m.leftArm.rotation.x = -1.6;
      m.rightArm.rotation.x = -1.6;
      m.jaw.rotation.x = 0.7;
    });
    sound.playDemonGrowl();
  }

  destroy() {
    this.scene.remove(this.group);
  }
}
