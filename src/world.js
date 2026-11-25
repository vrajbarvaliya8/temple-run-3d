import * as THREE from 'three';
import { TextureGenerator } from './textures.js';
import { sound } from './audio.js';

export class WorldManager {
  constructor(scene, particleSystem) {
    this.scene = scene;
    this.particles = particleSystem;

    // Materials
    this.stonePathTex = TextureGenerator.createStonePathTexture();
    this.stoneWallTex = TextureGenerator.createTempleWallTexture();
    this.woodTex = TextureGenerator.createWoodTexture();
    this.coinTex = TextureGenerator.createGoldCoinTexture();
    this.barkTex = TextureGenerator.createBarkTexture();

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

    // Gold Coin Material
    this.coinMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 0.9,
      roughness: 0.15,
      emissive: 0x664400,
      bumpMap: this.coinTex,
      bumpScale: 0.08
    });

    // Fire Trap Material
    this.fireGrateMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    this.lavaMat = new THREE.MeshBasicMaterial({ color: 0xff4400 });

    // Track state
    this.chunks = [];
    this.obstacles = [];
    this.coins = [];
    this.powerups = [];
    this.torches = [];

    // Current chunk builder cursor
    this.cursorPos = new THREE.Vector3(0, 0, -10);
    this.cursorDir = new THREE.Vector3(0, 0, 1); // 0=North(+Z), 1=East(+X), 2=South(-Z), 3=West(-X)
    this.currentHeading = 0; // in radians
    this.straightStreak = 0;

    // Corner turn indicator
    this.activeTurn = null; // { pos, type: 'left'|'right', turned: false, triggerDist: 5 }

    // Init first few safe segments
    this.initStartingPath();
  }

  initStartingPath() {
    // Generate initial straight runway without dangerous obstacles so player can prepare
    for (let i = 0; i < 4; i++) {
      this.spawnStraightChunk(false);
    }
    // Generate remaining active chunks with obstacles
    for (let i = 0; i < 8; i++) {
      this.spawnNextChunk();
    }
  }

  spawnNextChunk() {
    // Determine whether to spawn a Turn or a Straight/Bridge chunk
    // Guarantee at least 4 straight chunks before offering a turn
    if (this.straightStreak >= 5 && Math.random() < 0.38) {
      const turnType = Math.random() > 0.5 ? 'left' : 'right';
      this.spawnTurnChunk(turnType);
      this.straightStreak = 0;
    } else {
      const isBridge = Math.random() < 0.25;
      if (isBridge) {
        this.spawnBridgeChunk(true);
      } else {
        this.spawnStraightChunk(true);
      }
      this.straightStreak++;
    }
  }

  // Straight Stone Runway
  spawnStraightChunk(hasObstacles = true) {
    const length = 30;
    const width = 8.0;
    const chunkGroup = new THREE.Group();

    // Floor
    const floorGeo = new THREE.BoxGeometry(width, 1.5, length);
    const floorMesh = new THREE.Mesh(floorGeo, this.stoneFloorMat);
    floorMesh.position.set(0, -0.75, length / 2);
    floorMesh.receiveShadow = true;
    chunkGroup.add(floorMesh);

    // Stone Border Railings & Pillars
    const borderGeo = new THREE.BoxGeometry(0.8, 1.0, length);
    const leftBorder = new THREE.Mesh(borderGeo, this.stoneWallMat);
    leftBorder.position.set(-width / 2 + 0.4, 0.4, length / 2);
    chunkGroup.add(leftBorder);

    const rightBorder = new THREE.Mesh(borderGeo, this.stoneWallMat);
    rightBorder.position.set(width / 2 - 0.4, 0.4, length / 2);
    chunkGroup.add(rightBorder);

    // Temple Columns and Torches along the chunk
    for (let z = 5; z < length; z += 12) {
      this.createPillarWithTorch(chunkGroup, -width / 2 + 0.4, z);
      this.createPillarWithTorch(chunkGroup, width / 2 - 0.4, z);
    }

    // Orient and position chunk along current cursor
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

    // Spawn obstacles and coins in world space
    if (hasObstacles) {
      this.populateChunkContent(this.cursorPos, this.cursorDir, length, this.currentHeading, 'stone');
    }

    // Advance cursor forward
    this.cursorPos.add(this.cursorDir.clone().multiplyScalar(length));
  }

  // Rickety Wooden Bridge Chunk
  spawnBridgeChunk(hasObstacles = true) {
    const length = 28;
    const width = 7.2;
    const chunkGroup = new THREE.Group();

    // Wood floor planks
    const plankGeo = new THREE.BoxGeometry(width, 0.4, length);
    const bridgeMesh = new THREE.Mesh(plankGeo, this.woodMat);
    bridgeMesh.position.set(0, -0.2, length / 2);
    chunkGroup.add(bridgeMesh);

    // Rope bridge railings
    const postGeo = new THREE.CylinderGeometry(0.12, 0.12, 1.2, 6);
    const ropeGeo = new THREE.CylinderGeometry(0.06, 0.06, length, 6);
    const ropeMat = new THREE.MeshLambertMaterial({ color: 0x8a6237 });

    const leftRope = new THREE.Mesh(ropeGeo, ropeMat);
    leftRope.rotation.x = Math.PI / 2;
    leftRope.position.set(-width / 2 + 0.3, 0.9, length / 2);
    chunkGroup.add(leftRope);

    const rightRope = new THREE.Mesh(ropeGeo, ropeMat);
    rightRope.rotation.x = Math.PI / 2;
    rightRope.position.set(width / 2 - 0.3, 0.9, length / 2);
    chunkGroup.add(rightRope);

    for (let z = 2; z < length; z += 5) {
      const leftPost = new THREE.Mesh(postGeo, this.woodMat);
      leftPost.position.set(-width / 2 + 0.3, 0.5, z);
      chunkGroup.add(leftPost);

      const rightPost = new THREE.Mesh(postGeo, this.woodMat);
      rightPost.position.set(width / 2 - 0.3, 0.5, z);
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

  // 90-degree Corner Turn (Left or Right)
  spawnTurnChunk(turnType) {
    const size = 10;
    const chunkGroup = new THREE.Group();

    // Center junction floor
    const junctionGeo = new THREE.BoxGeometry(size, 1.5, size);
    const junctionMesh = new THREE.Mesh(junctionGeo, this.stoneFloorMat);
    junctionMesh.position.set(0, -0.75, size / 2);
    chunkGroup.add(junctionMesh);

    // Outer dead-end barrier wall with ancient warning idols
    const backWallGeo = new THREE.BoxGeometry(size + 1.2, 4.0, 1.2);
    const backWall = new THREE.Mesh(backWallGeo, this.stoneWallMat);
    backWall.position.set(0, 1.5, size + 0.6);
    chunkGroup.add(backWall);

    // Glowing Turn Arrow Sign on the dead-end wall!
    const arrowCanvas = document.createElement('canvas');
    arrowCanvas.width = 256;
    arrowCanvas.height = 128;
    const actx = arrowCanvas.getContext('2d');
    actx.fillStyle = '#ffbb00';
    actx.font = 'bold 54px sans-serif';
    actx.textAlign = 'center';
    actx.textBaseline = 'middle';
    actx.fillText(turnType === 'left' ? '◀ TURN' : 'TURN ▶', 128, 64);

    const arrowTex = new THREE.CanvasTexture(arrowCanvas);
    const arrowGeo = new THREE.PlaneGeometry(5, 2.5);
    const arrowMat = new THREE.MeshBasicMaterial({ map: arrowTex, transparent: true });
    const arrowMesh = new THREE.Mesh(arrowGeo, arrowMat);
    arrowMesh.position.set(0, 2.0, size - 0.01);
    arrowMesh.rotation.y = Math.PI;
    chunkGroup.add(arrowMesh);

    // Side wall on non-turn side
    const sideWallGeo = new THREE.BoxGeometry(1.2, 4.0, size);
    const sideWall = new THREE.Mesh(sideWallGeo, this.stoneWallMat);
    if (turnType === 'left') {
      sideWall.position.set(size / 2 + 0.6, 1.5, size / 2);
    } else {
      sideWall.position.set(-size / 2 - 0.6, 1.5, size / 2);
    }
    chunkGroup.add(sideWall);

    // Pillars with torches at corners
    this.createPillarWithTorch(chunkGroup, turnType === 'left' ? size / 2 : -size / 2, 2);
    this.createPillarWithTorch(chunkGroup, 0, size - 1);

    chunkGroup.position.copy(this.cursorPos);
    chunkGroup.rotation.y = this.currentHeading;
    this.scene.add(chunkGroup);

    // Pivot point in world coordinates where turn triggers
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

    // Advance cursor to junction center and rotate direction
    this.cursorPos.add(this.cursorDir.clone().multiplyScalar(size / 2));

    const angleDelta = turnType === 'left' ? Math.PI / 2 : -Math.PI / 2;
    this.currentHeading += angleDelta;
    this.cursorDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), angleDelta).round();

    // Advance cursor out of junction along new direction
    this.cursorPos.add(this.cursorDir.clone().multiplyScalar(size / 2));
  }

  createPillarWithTorch(parent, x, z) {
    const pillarGeo = new THREE.CylinderGeometry(0.35, 0.45, 3.2, 8);
    const pillar = new THREE.Mesh(pillarGeo, this.stoneWallMat);
    pillar.position.set(x, 1.6, z);
    parent.add(pillar);

    // Torch brazier bowl
    const bowlGeo = new THREE.CylinderGeometry(0.35, 0.15, 0.35, 8);
    const bowl = new THREE.Mesh(bowlGeo, this.fireGrateMat);
    bowl.position.set(x, 3.3, z);
    parent.add(bowl);

    // Flame light
    const torchLight = new THREE.PointLight(0xff7700, 1.2, 10);
    torchLight.position.set(x, 3.6, z);
    parent.add(torchLight);

    this.torches.push({
      light: torchLight,
      baseIntensity: 1.2,
      worldPos: null // compute when needed
    });
  }

  // Populate chunk with obstacles, coins, and powerups
  populateChunkContent(chunkStart, chunkDir, length, heading, type) {
    const lanes = [-2.4, 0, 2.4];
    const rightVec = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), heading);

    // 1. OBSTACLES
    // Place 1 or 2 obstacles per chunk
    const obstacleCount = Math.random() < 0.65 ? 1 : 2;
    const zOffsets = obstacleCount === 1 ? [length * 0.5] : [length * 0.3, length * 0.75];

    for (const zOff of zOffsets) {
      const obstacleTypes = ['FIRE_TRAP', 'FALLEN_TREE', 'STONE_ARCH', 'BROKEN_PATH', 'BLOCKED_LANE'];
      const chosenType = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];

      const obsCenter = chunkStart.clone().add(chunkDir.clone().multiplyScalar(zOff));

      if (chosenType === 'FIRE_TRAP') {
        // Flaming grate across path (Jump obstacle)
        const grateGeo = new THREE.BoxGeometry(6.5, 0.15, 2.5);
        const grate = new THREE.Mesh(grateGeo, this.fireGrateMat);
        grate.position.copy(obsCenter);
        grate.position.y = 0.08;
        grate.rotation.y = heading;
        this.scene.add(grate);

        // Glowing fire mesh
        const fireMesh = new THREE.Mesh(new THREE.PlaneGeometry(6.0, 1.8), new THREE.MeshBasicMaterial({
          map: TextureGenerator.createFireTexture(),
          transparent: true,
          blending: THREE.AdditiveBlending,
          side: THREE.DoubleSide
        }));
        fireMesh.position.copy(obsCenter);
        fireMesh.position.y = 0.9;
        fireMesh.rotation.y = heading;
        this.scene.add(fireMesh);

        this.obstacles.push({
          type: 'FIRE',
          center: obsCenter,
          radius: 1.8,
          minY: 0,
          maxY: 1.6,
          needsJump: true,
          mesh: grate,
          fx: fireMesh
        });

      } else if (chosenType === 'FALLEN_TREE') {
        // Low tree trunk (Jump obstacle)
        const trunkGeo = new THREE.CylinderGeometry(0.35, 0.4, 7.0, 8);
        const trunk = new THREE.Mesh(trunkGeo, this.barkMat);
        trunk.position.copy(obsCenter);
        trunk.position.y = 0.4;
        trunk.rotation.y = heading;
        trunk.rotation.z = Math.PI / 2;
        this.scene.add(trunk);

        this.obstacles.push({
          type: 'JUMP',
          center: obsCenter,
          radius: 1.5,
          minY: 0,
          maxY: 0.85,
          needsJump: true,
          mesh: trunk
        });

      } else if (chosenType === 'STONE_ARCH') {
        // Low stone archway / spiked barrier (Slide obstacle)
        const archGroup = new THREE.Group();

        // Top heavy lintel stone
        const topGeo = new THREE.BoxGeometry(7.2, 1.4, 1.2);
        const topMesh = new THREE.Mesh(topGeo, this.stoneWallMat);
        topMesh.position.y = 1.9;
        archGroup.add(topMesh);

        // Side posts
        const postGeo = new THREE.BoxGeometry(1.0, 2.6, 1.2);
        const leftPost = new THREE.Mesh(postGeo, this.stoneWallMat);
        leftPost.position.set(-3.2, 1.3, 0);
        archGroup.add(leftPost);

        const rightPost = new THREE.Mesh(postGeo, this.stoneWallMat);
        rightPost.position.set(3.2, 1.3, 0);
        archGroup.add(rightPost);

        archGroup.position.copy(obsCenter);
        archGroup.rotation.y = heading;
        this.scene.add(archGroup);

        this.obstacles.push({
          type: 'SLIDE',
          center: obsCenter,
          radius: 1.6,
          minY: 1.0,
          maxY: 2.8,
          needsSlide: true,
          mesh: archGroup
        });

      } else if (chosenType === 'BLOCKED_LANE') {
        // Huge temple boulder blocking 1 or 2 lanes (Steer obstacle)
        const blockedLaneIndex = Math.floor(Math.random() * 3);
        const laneOffset = lanes[blockedLaneIndex];
        const rockCenter = obsCenter.clone().add(rightVec.clone().multiplyScalar(laneOffset));

        const rockGeo = new THREE.DodecahedronGeometry(1.3, 1);
        const rock = new THREE.Mesh(rockGeo, this.stoneWallMat);
        rock.position.copy(rockCenter);
        rock.position.y = 1.1;
        this.scene.add(rock);

        this.obstacles.push({
          type: 'BLOCK',
          center: rockCenter,
          lane: blockedLaneIndex - 1,
          radius: 1.25,
          minY: 0,
          maxY: 2.5,
          mesh: rock
        });
      }
    }

    // 2. GOLD COINS
    // Spawn lines of 5-8 spinning gold coins
    const coinLaneIndex = Math.floor(Math.random() * 3);
    const coinLaneOffset = lanes[coinLaneIndex];
    const coinStartZ = length * 0.15;
    const coinCount = 6;

    for (let c = 0; c < coinCount; c++) {
      const cz = coinStartZ + c * 2.2;
      const coinPos = chunkStart.clone()
        .add(chunkDir.clone().multiplyScalar(cz))
        .add(rightVec.clone().multiplyScalar(coinLaneOffset));

      const coinGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.1, 16);
      const coinMesh = new THREE.Mesh(coinGeo, this.coinMat);
      coinMesh.position.copy(coinPos);
      coinMesh.position.y = 0.8;
      coinMesh.rotation.x = Math.PI / 2;
      this.scene.add(coinMesh);

      this.coins.push({
        mesh: coinMesh,
        pos: coinPos,
        baseY: 0.8,
        collected: false
      });
    }

    // 3. POWER-UPS (Random rare spawn)
    if (Math.random() < 0.22) {
      const ptypes = ['SHIELD', 'MAGNET', 'BOOST', 'MULTIPLIER'];
      const ptype = ptypes[Math.floor(Math.random() * ptypes.length)];
      const pLane = lanes[Math.floor(Math.random() * 3)];
      const pPos = chunkStart.clone()
        .add(chunkDir.clone().multiplyScalar(length * 0.88))
        .add(rightVec.clone().multiplyScalar(pLane));

      const powerMesh = this.createPowerupMesh(ptype);
      powerMesh.position.copy(pPos);
      powerMesh.position.y = 1.2;
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
      // Blue Horseshoe Magnet
      const mat = new THREE.MeshStandardMaterial({ color: 0x2288ff, metalness: 0.8 });
      const geom = new THREE.TorusGeometry(0.5, 0.15, 8, 16, Math.PI);
      const m = new THREE.Mesh(geom, mat);
      group.add(m);
    } else if (type === 'SHIELD') {
      // Emerald Protection Shield Medallion
      const mat = new THREE.MeshStandardMaterial({ color: 0x00ffcc, metalness: 0.7, emissive: 0x004433 });
      const geom = new THREE.OctahedronGeometry(0.55);
      const m = new THREE.Mesh(geom, mat);
      group.add(m);
    } else if (type === 'BOOST') {
      // Blazing Fire Wing / Speed Boost
      const mat = new THREE.MeshStandardMaterial({ color: 0xff3300, emissive: 0xaa2200 });
      const geom = new THREE.ConeGeometry(0.4, 0.9, 6);
      const m = new THREE.Mesh(geom, mat);
      group.add(m);
    } else {
      // Golden 2X Diamond Multiplier
      const mat = new THREE.MeshStandardMaterial({ color: 0xaa00ff, metalness: 0.9, emissive: 0x440066 });
      const geom = new THREE.IcosahedronGeometry(0.5);
      const m = new THREE.Mesh(geom, mat);
      group.add(m);
    }
    return group;
  }

  // Update animated objects (coins rotation, torch flicker, powerup bobbing)
  update(dt, player) {
    // Flickering torch lights
    const time = performance.now() * 0.005;
    for (const torch of this.torches) {
      torch.light.intensity = torch.baseIntensity + Math.sin(time + Math.random()) * 0.35;
    }

    // Spin coins & bobbing
    for (const c of this.coins) {
      if (!c.collected) {
        c.mesh.rotation.z += dt * 3.5;
        c.mesh.position.y = c.baseY + Math.sin(time * 3 + c.pos.x) * 0.15;

        // Magnet attraction effect
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
        p.mesh.position.y = 1.2 + Math.sin(time * 2.5) * 0.2;
      }
    }

    // Check cleanup of old chunks far behind player
    this.recycleOldChunks(player.position);
  }

  // Remove passed chunks and generate new ones ahead
  recycleOldChunks(playerPos) {
    while (this.chunks.length > 0) {
      const firstChunk = this.chunks[0];
      const dist = playerPos.distanceTo(firstChunk.start);

      // If chunk is over 50 units behind and we have enough ahead
      if (dist > 55 && this.chunks.length > 6) {
        this.scene.remove(firstChunk.group);
        this.chunks.shift();

        // Spawn a new chunk ahead
        this.spawnNextChunk();
      } else {
        break;
      }
    }
  }

  // Check upcoming turn prompt for UI
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
