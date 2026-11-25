import * as THREE from 'three';
import { sound } from './audio.js';

export class DemonMonkey {
  constructor(scene) {
    this.scene = scene;
    this.distance = 10.0; // Distance behind player
    this.targetDistance = 10.0;
    this.runCycle = 0;
    this.growlTimer = 3.0;

    this.createDemonMesh();
  }

  createDemonMesh() {
    this.mesh = new THREE.Group();

    // Dark demonic fur & skull materials
    const furMat = new THREE.MeshLambertMaterial({ color: 0x1a120b }); // Dark beast fur
    const chestMat = new THREE.MeshLambertMaterial({ color: 0x2e1a12 }); // Tough leathery chest
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0022 }); // Glowing menacing red eyes
    const hornMat = new THREE.MeshLambertMaterial({ color: 0x0a0705 }); // Jet black horns
    const fangMat = new THREE.MeshLambertMaterial({ color: 0xeeeedd }); // Sharp bone fangs

    this.bodyRoot = new THREE.Group();
    this.mesh.add(this.bodyRoot);

    // Massive Muscular Torso (Gorilla / Demon ape)
    const torsoGeo = new THREE.BoxGeometry(1.4, 1.2, 1.0);
    this.torso = new THREE.Mesh(torsoGeo, furMat);
    this.torso.position.y = 1.2;
    this.bodyRoot.add(this.torso);

    // Muscular chest plate
    const chestGeo = new THREE.BoxGeometry(1.1, 0.8, 0.4);
    const chest = new THREE.Mesh(chestGeo, chestMat);
    chest.position.set(0, 0.1, 0.4);
    this.torso.add(chest);

    // Demon Head with Snapping Jaw
    const headGeo = new THREE.BoxGeometry(0.85, 0.8, 0.8);
    this.head = new THREE.Mesh(headGeo, furMat);
    this.head.position.set(0, 0.8, 0.35);
    this.torso.add(this.head);

    // Glowing Red Eyes
    const eyeGeo = new THREE.SphereGeometry(0.1, 8, 8);
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.25, 0.1, 0.42);
    this.head.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.25, 0.1, 0.42);
    this.head.add(rightEye);

    // Demon Horns
    const hornGeo = new THREE.ConeGeometry(0.12, 0.6, 6);
    const leftHorn = new THREE.Mesh(hornGeo, hornMat);
    leftHorn.position.set(-0.35, 0.5, 0);
    leftHorn.rotation.z = 0.5;
    leftHorn.rotation.x = -0.3;
    this.head.add(leftHorn);

    const rightHorn = new THREE.Mesh(hornGeo, hornMat);
    rightHorn.position.set(0.35, 0.5, 0);
    rightHorn.rotation.z = -0.5;
    rightHorn.rotation.x = -0.3;
    this.head.add(rightHorn);

    // Snapping Jaw & Fangs
    this.jaw = new THREE.Group();
    this.jaw.position.set(0, -0.3, 0.25);
    const jawMesh = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.25, 0.6), furMat);
    this.jaw.add(jawMesh);

    // Upper & Lower Fangs
    const fangGeo = new THREE.ConeGeometry(0.06, 0.22, 4);
    for (let f = -0.22; f <= 0.22; f += 0.14) {
      const topFang = new THREE.Mesh(fangGeo, fangMat);
      topFang.position.set(f, -0.15, 0.45);
      topFang.rotation.x = Math.PI;
      this.head.add(topFang);

      const botFang = new THREE.Mesh(fangGeo, fangMat);
      botFang.position.set(f, 0.12, 0.25);
      this.jaw.add(botFang);
    }
    this.head.add(this.jaw);

    // Massive Gorilla Arms (runs on all fours)
    const armGeo = new THREE.BoxGeometry(0.4, 1.3, 0.4);

    this.leftArm = new THREE.Group();
    this.leftArm.position.set(-0.95, 0.35, 0.2);
    const leftArmMesh = new THREE.Mesh(armGeo, furMat);
    leftArmMesh.position.y = -0.55;
    this.leftArm.add(leftArmMesh);
    this.torso.add(this.leftArm);

    this.rightArm = new THREE.Group();
    this.rightArm.position.set(0.95, 0.35, 0.2);
    const rightArmMesh = new THREE.Mesh(armGeo, furMat);
    rightArmMesh.position.y = -0.55;
    this.rightArm.add(rightArmMesh);
    this.torso.add(this.rightArm);

    // Hind Legs
    const legGeo = new THREE.BoxGeometry(0.45, 0.9, 0.45);

    this.leftLeg = new THREE.Group();
    this.leftLeg.position.set(-0.45, 0.7, -0.2);
    const leftLegMesh = new THREE.Mesh(legGeo, furMat);
    leftLegMesh.position.y = -0.4;
    this.leftLeg.add(leftLegMesh);
    this.bodyRoot.add(this.leftLeg);

    this.rightLeg = new THREE.Group();
    this.rightLeg.position.set(0.45, 0.7, -0.2);
    const rightLegMesh = new THREE.Mesh(legGeo, furMat);
    rightLegMesh.position.y = -0.4;
    this.rightLeg.add(rightLegMesh);
    this.bodyRoot.add(this.rightLeg);

    this.scene.add(this.mesh);
  }

  update(dt, playerPosition, playerHeading, isPlayerStumbling, speed) {
    // When player stumbles, demon lunges forward to snap right at their heels!
    if (isPlayerStumbling) {
      this.targetDistance = 3.6;
    } else {
      this.targetDistance = 9.5;
    }

    this.distance += (this.targetDistance - this.distance) * Math.min(1.0, dt * 4);

    // Position demon behind player along the player's orientation
    const backwardVector = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), playerHeading);
    const targetPos = playerPosition.clone().add(backwardVector.clone().multiplyScalar(this.distance));

    this.mesh.position.lerp(targetPos, Math.min(1.0, dt * 10));
    this.mesh.rotation.y = playerHeading;

    // Snarl & Growl sound timer
    this.growlTimer -= dt;
    if (this.growlTimer <= 0) {
      if (this.distance < 6.0) {
        sound.playDemonGrowl();
      }
      this.growlTimer = 4.0 + Math.random() * 3.0;
    }

    // Heavy quadrupedal gallop animation
    this.runCycle += dt * (speed * 0.5);
    const gallop = Math.sin(this.runCycle);

    this.bodyRoot.position.y = Math.abs(gallop) * 0.25;
    this.bodyRoot.rotation.x = 0.25 + gallop * 0.1;

    // Slamming front arms
    this.leftArm.rotation.x = gallop * 1.1;
    this.rightArm.rotation.x = -gallop * 1.1;

    // Pumping hind legs
    this.leftLeg.rotation.x = -gallop * 0.9;
    this.rightLeg.rotation.x = gallop * 0.9;

    // Snapping fanged jaw
    this.jaw.rotation.x = 0.15 + Math.abs(Math.sin(this.runCycle * 1.5)) * 0.35;
  }

  // Attack pounce when game over
  attackPlayer(playerPosition) {
    this.mesh.position.lerp(playerPosition, 0.4);
    this.leftArm.rotation.x = -1.6;
    this.rightArm.rotation.x = -1.6;
    this.jaw.rotation.x = 0.6;
    sound.playDemonGrowl();
  }
}
