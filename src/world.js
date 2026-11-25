import * as THREE from 'three';
import { TextureGenerator } from './textures.js';
import { sound } from './audio.js';

export class WorldManager {
  constructor(scene, particleSystem) {
    this.scene = scene;
    this.particles = particleSystem;

    // Load authentic procedural textures
    this.stonePathTex = TextureGenerator.createAncientStonePathTexture();
    this.stoneWallTex = TextureGenerator.createTempleRampartTexture();
    this.woodTex = TextureGenerator.createBridgePlankTexture();
    this.coinTex = TextureGenerator.createAuthenticCoinTexture();
    this.barkTex = TextureGenerator.createJungleBarkTexture();
    this.waterTex = TextureGenerator.createSwampWaterTexture();
    this.fireTex = TextureGenerator.createFireTexture();

    // Materials
    this.stoneFloorMat = new THREE.MeshLambertMaterial({
      map: this.stonePathTex,
      roughness: 0.8
    });
    this.stoneWallMat = new THREE.MeshLambertMaterial({
      map: this.stoneWallTex
    });
    this.woodMat = new THREE.MeshLambertMaterial({
      map: this.woodTex
    });
    this.barkMat = new THREE.MeshLambertMaterial({
      map: this.barkTex
    });

    // Water Material for Swamp Canal below the temple walkway
    this.waterMat = new THREE.MeshLambertMaterial({
      map: this.waterTex,
      transparent: true,
      opacity: 0.92
    });

    // Authentic Gold Coin Material
    this.coinMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 0.92,
      roughness: 0.15,
      emissive: 0x553800,
      map: this.coinTex
    });

    this.fireGrateMat = new THREE.MeshLambertMaterial({ color: 0x1a1510 });

    // Track state
    this.chunks = [];
    this.obstacles = [];
    this.coins = [];
    this.powerups = [];
    this.torches = [];

    // Vast Swamp Water Plane under the entire temple
    this.createSwampPlane();

    // Cursor for procedural track building
    this.cursorPos = new THREE.Vector3(0, 0, -12);
    this.cursorDir = new THREE.Vector3(0, 0, 1);
    this.currentHeading = 0;
    this.straightStreak = 0;

    // Initialize track
    this.initStartingPath();
  }

  createSwampPlane() {
    const waterGeo = new THREE.PlaneGeometry(800, 800);
    this.waterPlane = new THREE.Mesh(waterGeo, this.waterMat);
    this.waterPlane.rotation.x = -Math.PI / 2;
    this.waterPlane.position.y = -6.5; // 6.5 units below the stone rampart
    this.scene.add(this.waterPlane);
  }

  initStartingPath() {
    // Initial safe runway
    for (let i = 0; i < 4; i++) {
      this.spawnStraightChunk(false);
    }
    // Obstacle chunks
    for (let i = 0; i < 9; i++) {
      this.spawnNextChunk();
    }
  }

  spawnNextChunk() {
    if (this.straightStreak >= 5 && Math.random() < 0.38) {
      const turnType = Math.random() > 0.5 ? 'left' : 'right';
      this.spawnTurnChunk(turnType);
      this.straightStreak = 0;
    } else {
      const isBridge = Math.random() < 0.28;
      if (isBridge) {
        this.spawnBridgeChunk(true);
      } else {
        this.spawnStraightChunk(true);
      }
      this.straightStreak++;
    }
  }

  // Classic Temple Rampart Walkway
  spawnStraightChunk(hasObstacles = true) {
    const length = 32;
    const width = 8.0;
    const chunkGroup = new THREE.Group();

    // 1. Stone Pathway Slab
    const floorGeo = new THREE.BoxGeometry(width, 1.4, length);
    const floorMesh = new THREE.Mesh(floorGeo, this.stoneFloorMat);
    floorMesh.position.set(0, -0.7, length / 2);
    floorMesh.receiveShadow = true;
    chunkGroup.add(floorMesh);

    // 2. Foundation Stone Piers dropping down into the water
    const pierGeo = new THREE.BoxGeometry(width * 0.9, 6.0, 4.0);
    for (let z = 6; z < length; z += 14) {
      const pier = new THREE.Mesh(pierGeo, this.stoneWallMat);
      pier.position.set(0, -4.2, z);
      chunkGroup.add(pier);
    }

    // 3. Side Parapet Battlements (Crenelated ancient stone railings)
    const battlementLength = 3.6;
    const battlementGap = 1.4;
    for (let z = 0; z < length; z += battlementLength + battlementGap) {
      const bLen = Math.min(battlementLength, length - z);
      const bGeo = new THREE.BoxGeometry(0.75, 1.1, bLen);

      const leftB = new THREE.Mesh(bGeo, this.stoneWallMat);
      leftB.position.set(-width / 2 + 0.38, 0.45, z + bLen / 2);
      chunkGroup.add(leftB);

      const rightB = new THREE.Mesh(bGeo, this.stoneWallMat);
      rightB.position.set(width / 2 - 0.38, 0.45, z + bLen / 2);
      chunkGroup.add(rightB);
    }

    // 4. Carved Temple Columns with Flaming Torches
    for (let z = 6; z < length; z += 15) {
      this.createPillarWithTorch(chunkGroup, -width / 2 + 0.38, z);
      this.createPillarWithTorch(chunkGroup, width / 2 - 0.38, z);
    }

    chunkGroup.position.copy(this.cursorPos);
    chunkGroup.rotation.y = this.currentHeading;
    this.scene.add(chunkGroup);

    const chunkData = {
      group: chunkGroup,
      start: this.cursorPos.clone(),
      dir: this.cursorDir.clone(),
      length: length,
      heading: this.currentHeading,
      isTurn: false
    };
    this.chunks.push(chunkData);

    if (hasObstacles) {
      this.populateChunkContent(this.cursorPos, this.cursorDir, length, this.currentHeading, 'stone');
    }

    this.cursorPos.add(this.cursorDir.clone().multiplyScalar(length));
  }

  // Authentic Temple Run Wooden Rope Bridge
  spawnBridgeChunk(hasObstacles = true) {
    const length = 28;
    const width = 7.4;
    const chunkGroup = new THREE.Group();

    // Wood bridge plank deck
    const deckGeo = new THREE.BoxGeometry(width, 0.35, length);
    const deckMesh = new THREE.Mesh(deckGeo, this.woodMat);
    deckMesh.position.set(0, -0.18, length / 2);
    chunkGroup.add(deckMesh);

    // Thick rope railings
    const ropeGeo = new THREE.CylinderGeometry(0.08, 0.08, length, 6);
    const ropeMat = new THREE.MeshLambertMaterial({ color: 0x9e733b });

    const leftRope = new THREE.Mesh(ropeGeo, ropeMat);
    leftRope.rotation.x = Math.PI / 2;
    leftRope.position.set(-width / 2 + 0.3, 0.95, length / 2);
    chunkGroup.add(leftRope);

    const rightRope = new THREE.Mesh(ropeGeo, ropeMat);
    rightRope.rotation.x = Math.PI / 2;
    rightRope.position.set(width / 2 - 0.3, 0.95, length / 2);
    chunkGroup.add(rightRope);

    // Upright wooden posts with rope wraps
    const postGeo = new THREE.CylinderGeometry(0.14, 0.16, 1.3, 6);
    for (let z = 2; z < length; z += 5) {
      const leftPost = new THREE.Mesh(postGeo, this.woodMat);
      leftPost.position.set(-width / 2 + 0.3, 0.55, z);
      chunkGroup.add(leftPost);

      const rightPost = new THREE.Mesh(postGeo, this.woodMat);
      rightPost.position.set(width / 2 - 0.3, 0.55, z);
      chunkGroup.add(rightPost);
    }

    chunkGroup.position.copy(this.cursorPos);
    chunkGroup.rotation.y = this.currentHeading;
    this.scene.add(chunkGroup);

    const chunkData = {
      group: chunkGroup,
      start: this.cursorPos.clone(),
      dir: this.cursorDir.clone(),
      length: length,
      heading: this.currentHeading,
      isTurn: false
    };
    this.chunks.push(chunkData);

    if (hasObstacles) {
      this.populateChunkContent(this.cursorPos, this.cursorDir, length, this.currentHeading, 'bridge');
    }

    this.cursorPos.add(this.cursorDir.clone().multiplyScalar(length));
  }

  // Authentic 90-degree Corner Platform
  spawnTurnChunk(turnType) {
    const size = 11;
    const chunkGroup = new THREE.Group();

    // Wide junction floor
    const junctionGeo = new THREE.BoxGeometry(size, 1.4, size);
    const junctionMesh = new THREE.Mesh(junctionGeo, this.stoneFloorMat);
    junctionMesh.position.set(0, -0.7, size / 2);
    chunkGroup.add(junctionMesh);

    // Outer dead-end barrier wall with carved Aztec idols
    const backWallGeo = new THREE.BoxGeometry(size + 1.6, 5.0, 1.4);
    const backWall = new THREE.Mesh(backWallGeo, this.stoneWallMat);
    backWall.position.set(0, 1.8, size + 0.7);
    chunkGroup.add(backWall);

    // Glowing Aztec Warning Turn Arrow Sign!
    const arrowCanvas = document.createElement('canvas');
    arrowCanvas.width = 512;
    arrowCanvas.height = 256;
    const actx = arrowCanvas.getContext('2d');
    actx.fillStyle = '#1a1006';
    actx.fillRect(0, 0, 512, 256);
    actx.strokeStyle = '#ffd700';
    actx.lineWidth = 10;
    actx.strokeRect(10, 10, 492, 236);

    actx.fillStyle = '#ffbb00';
    actx.font = '900 80px sans-serif';
    actx.textAlign = 'center';
    actx.textBaseline = 'middle';
    actx.fillText(turnType === 'left' ? '◀ TURN' : 'TURN ▶', 256, 128);

    const arrowTex = new THREE.CanvasTexture(arrowCanvas);
    const arrowGeo = new THREE.PlaneGeometry(6.5, 3.2);
    const arrowMat = new THREE.MeshBasicMaterial({ map: arrowTex });
    const arrowMesh = new THREE.Mesh(arrowGeo, arrowMat);
    arrowMesh.position.set(0, 2.2, size - 0.02);
    arrowMesh.rotation.y = Math.PI;
    chunkGroup.add(arrowMesh);

    // Side wall on non-turn side
    const sideWallGeo = new THREE.BoxGeometry(1.4, 5.0, size);
    const sideWall = new THREE.Mesh(sideWallGeo, this.stoneWallMat);
    if (turnType === 'left') {
      sideWall.position.set(size / 2 + 0.7, 1.8, size / 2);
    } else {
      sideWall.position.set(-size / 2 - 0.7, 1.8, size / 2);
    }
    chunkGroup.add(sideWall);

    // Torches
    this.createPillarWithTorch(chunkGroup, turnType === 'left' ? size / 2 : -size / 2, 2.5);
    this.createPillarWithTorch(chunkGroup, 0, size - 1.2);

    chunkGroup.position.copy(this.cursorPos);
    chunkGroup.rotation.y = this.currentHeading;
    this.scene.add(chunkGroup);

    const pivotWorld = this.cursorPos.clone().add(this.cursorDir.clone().multiplyScalar(size / 2));

    const chunkData = {
      group: chunkGroup,
      start: this.cursorPos.clone(),
      dir: this.cursorDir.clone(),
      length: size,
      heading: this.currentHeading,
      isTurn: true,
      turnType: turnType,
      pivot: pivotWorld,
      passed: false
    };
    this.chunks.push(chunkData);

    this.cursorPos.add(this.cursorDir.clone().multiplyScalar(size / 2));

    const angleDelta = turnType === 'left' ? Math.PI / 2 : -Math.PI / 2;
    this.currentHeading += angleDelta;
    this.cursorDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), angleDelta).round();

    this.cursorPos.add(this.cursorDir.clone().multiplyScalar(size / 2));
  }

  createPillarWithTorch(parent, x, z) {
    const pillarGeo = new THREE.CylinderGeometry(0.4, 0.5, 3.4, 8);
    const pillar = new THREE.Mesh(pillarGeo, this.stoneWallMat);
    pillar.position.set(x, 1.7, z);
    parent.add(pillar);

    // Stone fire bowl
    const bowlGeo = new THREE.CylinderGeometry(0.4, 0.18, 0.4, 8);
    const bowl = new THREE.Mesh(bowlGeo, this.fireGrateMat);
    bowl.position.set(x, 3.5, z);
    parent.add(bowl);

    // Point Light for torch
    const torchLight = new THREE.PointLight(0xff8811, 1.4, 12);
    torchLight.position.set(x, 3.8, z);
    parent.add(torchLight);

    this.torches.push({
      light: torchLight,
      baseIntensity: 1.4
    });
  }

  // Populate Chunk with Authentic Temple Run Obstacles & Coins
  populateChunkContent(chunkStart, chunkDir, length, heading, type) {
    const lanes = [-2.4, 0, 2.4];
    const rightVec = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), heading);

    // 1. OBSTACLES
    const obstacleCount = Math.random() < 0.65 ? 1 : 2;
    const zOffsets = obstacleCount === 1 ? [length * 0.5] : [length * 0.32, length * 0.74];

    for (const zOff of zOffsets) {
      const obstacleTypes = ['GARGOYLE_FIRE', 'TREE_LOG', 'TEMPLE_ARCH', 'BROKEN_PATH', 'COLLAPSED_LANE'];
      const chosenType = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
      const obsCenter = chunkStart.clone().add(chunkDir.clone().multiplyScalar(zOff));

      if (chosenType === 'GARGOYLE_FIRE') {
        // Authentic Temple Run Gargoyle Fire Trap:
        // Stone dragon/serpent heads mounted on left & right parapets spewing fire across!
        const trapGroup = new THREE.Group();

        // Left gargoyle head
        const headGeo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
        const leftHead = new THREE.Mesh(headGeo, this.stoneWallMat);
        leftHead.position.set(-3.6, 0.6, 0);
        trapGroup.add(leftHead);

        // Right gargoyle head
        const rightHead = new THREE.Mesh(headGeo, this.stoneWallMat);
        rightHead.position.set(3.6, 0.6, 0);
        trapGroup.add(rightHead);

        // Blazing Fire stream across the walkway
        const fireGeo = new THREE.PlaneGeometry(6.6, 1.6);
        const fireMat = new THREE.MeshBasicMaterial({
          map: this.fireTex,
          transparent: true,
          blending: THREE.AdditiveBlending,
          side: THREE.DoubleSide
        });
        const fireMesh = new THREE.Mesh(fireGeo, fireMat);
        fireMesh.position.set(0, 0.8, 0);
        fireMesh.rotation.x = -Math.PI / 10;
        trapGroup.add(fireMesh);

        trapGroup.position.copy(obsCenter);
        trapGroup.rotation.y = heading;
        this.scene.add(trapGroup);

        this.obstacles.push({
          type: 'FIRE',
          center: obsCenter,
          radius: 1.8,
          needsJump: true,
          mesh: trapGroup
        });

      } else if (chosenType === 'TREE_LOG') {
        // Massive mossy fallen tree trunk across the stone path (Jump)
        const logGeo = new THREE.CylinderGeometry(0.42, 0.46, 7.2, 8);
        const log = new THREE.Mesh(logGeo, this.barkMat);
        log.position.copy(obsCenter);
        log.position.y = 0.45;
        log.rotation.y = heading;
        log.rotation.z = Math.PI / 2;
        this.scene.add(log);

        this.obstacles.push({
          type: 'JUMP',
          center: obsCenter,
          radius: 1.5,
          needsJump: true,
          mesh: log
        });

      } else if (chosenType === 'TEMPLE_ARCH') {
        // Ancient carved stone archway / lintel beam with skull carving (Slide)
        const archGroup = new THREE.Group();

        const lintelGeo = new THREE.BoxGeometry(7.4, 1.5, 1.4);
        const lintel = new THREE.Mesh(lintelGeo, this.stoneWallMat);
        lintel.position.y = 2.0;
        archGroup.add(lintel);

        const leftPost = new THREE.Mesh(new THREE.BoxGeometry(1.0, 2.8, 1.4), this.stoneWallMat);
        leftPost.position.set(-3.3, 1.4, 0);
        archGroup.add(leftPost);

        const rightPost = new THREE.Mesh(new THREE.BoxGeometry(1.0, 2.8, 1.4), this.stoneWallMat);
        rightPost.position.set(3.3, 1.4, 0);
        archGroup.add(rightPost);

        archGroup.position.copy(obsCenter);
        archGroup.rotation.y = heading;
        this.scene.add(archGroup);

        this.obstacles.push({
          type: 'SLIDE',
          center: obsCenter,
          radius: 1.6,
          needsSlide: true,
          mesh: archGroup
        });

      } else if (chosenType === 'BROKEN_PATH') {
        // Broken stone section gap (Jump)
        const gapGeo = new THREE.BoxGeometry(7.0, 0.2, 3.2);
        const gapMat = new THREE.MeshBasicMaterial({ color: 0x050c08, transparent: true, opacity: 0.85 });
        const gapMesh = new THREE.Mesh(gapGeo, gapMat);
        gapMesh.position.copy(obsCenter);
        gapMesh.position.y = 0.05;
        gapMesh.rotation.y = heading;
        this.scene.add(gapMesh);

        this.obstacles.push({
          type: 'GAP',
          center: obsCenter,
          radius: 2.0,
          needsJump: true,
          mesh: gapMesh
        });

      } else if (chosenType === 'COLLAPSED_LANE') {
        // Collapsed temple debris / giant stone block on 1 lane (Steer)
        const blockedLaneIndex = Math.floor(Math.random() * 3);
        const laneOffset = lanes[blockedLaneIndex];
        const rockCenter = obsCenter.clone().add(rightVec.clone().multiplyScalar(laneOffset));

        const blockGeo = new THREE.DodecahedronGeometry(1.35, 1);
        const block = new THREE.Mesh(blockGeo, this.stoneWallMat);
        block.position.copy(rockCenter);
        block.position.y = 1.15;
        this.scene.add(block);

        this.obstacles.push({
          type: 'BLOCK',
          center: rockCenter,
          lane: blockedLaneIndex - 1,
          radius: 1.3,
          mesh: block
        });
      }
    }

    // 2. GOLD COINS
    const coinLaneIndex = Math.floor(Math.random() * 3);
    const coinLaneOffset = lanes[coinLaneIndex];
    const coinStartZ = length * 0.16;
    const coinCount = 6;

    for (let c = 0; c < coinCount; c++) {
      const cz = coinStartZ + c * 2.2;
      const coinPos = chunkStart.clone()
        .add(chunkDir.clone().multiplyScalar(cz))
        .add(rightVec.clone().multiplyScalar(coinLaneOffset));

      const coinGeo = new THREE.CylinderGeometry(0.44, 0.44, 0.12, 16);
      const coinMesh = new THREE.Mesh(coinGeo, this.coinMat);
      coinMesh.position.copy(coinPos);
      coinMesh.position.y = 0.85;
      coinMesh.rotation.x = Math.PI / 2;
      this.scene.add(coinMesh);

      this.coins.push({
        mesh: coinMesh,
        pos: coinPos,
        baseY: 0.85,
        collected: false
      });
    }

    // 3. POWER-UPS
    if (Math.random() < 0.24) {
      const ptypes = ['SHIELD', 'MAGNET', 'BOOST', 'MULTIPLIER'];
      const ptype = ptypes[Math.floor(Math.random() * ptypes.length)];
      const pLane = lanes[Math.floor(Math.random() * 3)];
      const pPos = chunkStart.clone()
        .add(chunkDir.clone().multiplyScalar(length * 0.88))
        .add(rightVec.clone().multiplyScalar(pLane));

      const powerMesh = this.createPowerupMesh(ptype);
      powerMesh.position.copy(pPos);
      powerMesh.position.y = 1.25;
      this.scene.add(powerMesh);

      this.powerups.push({
        type: ptype,
        mesh: powerMesh,
        pos: pPos,
        collected: false
      });
    }
  }

  createPowerupMesh(type) {
    const group = new THREE.Group();
    if (type === 'MAGNET') {
      const mat = new THREE.MeshStandardMaterial({ color: 0x2288ff, metalness: 0.8 });
      const geom = new THREE.TorusGeometry(0.5, 0.15, 8, 16, Math.PI);
      const m = new THREE.Mesh(geom, mat);
      group.add(m);
    } else if (type === 'SHIELD') {
      const mat = new THREE.MeshStandardMaterial({ color: 0x00ffcc, metalness: 0.8, emissive: 0x004433 });
      const geom = new THREE.OctahedronGeometry(0.55);
      const m = new THREE.Mesh(geom, mat);
      group.add(m);
    } else if (type === 'BOOST') {
      const mat = new THREE.MeshStandardMaterial({ color: 0xff3300, emissive: 0xaa2200 });
      const geom = new THREE.ConeGeometry(0.4, 0.9, 6);
      const m = new THREE.Mesh(geom, mat);
      group.add(m);
    } else {
      const mat = new THREE.MeshStandardMaterial({ color: 0xaa00ff, metalness: 0.9, emissive: 0x440066 });
      const geom = new THREE.IcosahedronGeometry(0.5);
      const m = new THREE.Mesh(geom, mat);
      group.add(m);
    }
    return group;
  }

  update(dt, player) {
    const time = performance.now() * 0.005;

    // Torch flicker
    for (const torch of this.torches) {
      torch.light.intensity = torch.baseIntensity + Math.sin(time + Math.random()) * 0.35;
    }

    // Keep swamp water plane centered near player
    if (this.waterPlane) {
      this.waterPlane.position.x = player.position.x;
      this.waterPlane.position.z = player.position.z;
    }

    // Spin and bob coins
    for (const c of this.coins) {
      if (!c.collected) {
        c.mesh.rotation.z += dt * 3.6;
        c.mesh.position.y = c.baseY + Math.sin(time * 3 + c.pos.x) * 0.14;

        // Magnet attraction
        if (player.hasMagnet || player.isBoosted) {
          const dist = player.position.distanceTo(c.mesh.position);
          if (dist < 14) {
            c.mesh.position.lerp(player.position.clone().add(new THREE.Vector3(0, 1.0, 0)), dt * 9);
          }
        }
      }
    }

    // Spin powerups
    for (const p of this.powerups) {
      if (!p.collected) {
        p.mesh.rotation.y += dt * 2.5;
        p.mesh.position.y = 1.25 + Math.sin(time * 2.5) * 0.18;
      }
    }

    this.recycleOldChunks(player.position);
  }

  recycleOldChunks(playerPos) {
    while (this.chunks.length > 0) {
      const firstChunk = this.chunks[0];
      const dist = playerPos.distanceTo(firstChunk.start);

      if (dist > 55 && this.chunks.length > 6) {
        this.scene.remove(firstChunk.group);
        this.chunks.shift();
        this.spawnNextChunk();
      } else {
        break;
      }
    }
  }

  getUpcomingTurn(playerPos) {
    for (const chunk of this.chunks) {
      if (chunk.isTurn && !chunk.passed) {
        const dist = playerPos.distanceTo(chunk.pivot);
        if (dist < 18) {
          return {
            chunk: chunk,
            turnType: chunk.turnType,
            dist: dist
          };
        }
      }
    }
    return null;
  }
}
