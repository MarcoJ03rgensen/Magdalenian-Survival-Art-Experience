// ========================================
// MAGDALENIAN SURVIVAL - THREE.JS GAME
// Upper Paleolithic First-Person Experience
// ========================================

console.log('🎮 Magdalenian Survival - Initializing...');

// Game State
const gameState = {
  health: 100,
  hunger: 100,
  thirst: 100,
  stamina: 100,
  temperature: 15,
  time: 6, // Hours (0-24)
  weather: 'clear',
  inventory: {},
  hotbar: [null, null, null, null, null],
  selectedSlot: 0,
  position: { x: 0, y: 1.6, z: 0 },
  isRunning: false,
  inCave: false,
  hasLight: false,
  paintingMode: false,
  paints: [],
  selectedPaint: null,
  selectedTool: 'finger',
  nearPaintableWall: false,
  paintStrokes: []
};

// Three.js Core
let scene, camera, renderer, clock;
let terrain, sky, sun, moon;
let controls = { forward: false, backward: false, left: false, right: false, jump: false, run: false };
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();
let raycaster = new THREE.Raycaster();
let interactableObject = null;

// Game Objects
let trees = [];
let resources = [];
let animals = [];
let fires = [];
let cave = null;
let paintableWalls = [];

// Cave Painting System
let paintingCanvas = null;
let paintingContext = null;
let isPainting = false;
let lastPaintPos = null;

// Grinding & Mixing State
let grindingProgress = 0;
let mixingProgress = 0;
let currentGrindingItem = null;
let lastGrindPos = null;

// Materials Database
const materials = {
  wood: { name: 'Wood', icon: '🪵', color: '#8B4513' },
  stone: { name: 'Stone', icon: '🪨', color: '#808080' },
  flint: { name: 'Flint', icon: '⚡', color: '#696969' },
  redOchre: { name: 'Red Ochre', icon: '🔴', color: '#8B4513' },
  yellowOchre: { name: 'Yellow Ochre', icon: '🟡', color: '#DAA520' },
  charcoal: { name: 'Charcoal', icon: '⚫', color: '#1C1C1C' },
  meat: { name: 'Meat', icon: '🍖', color: '#8B4513' },
  hide: { name: 'Hide', icon: '🦌', color: '#D2691E' },
  bone: { name: 'Bone', icon: '🦴', color: '#F5DEB3' },
  animalFat: { name: 'Animal Fat', icon: '🥩', color: '#F5DEB3' },
  grindingStone: { name: 'Grinding Stone', icon: '⚒️', color: '#808080' },
  mixingShell: { name: 'Mixing Shell', icon: '🐚', color: '#F5DEB3' },
  groundRedOchre: { name: 'Ground Red Ochre', icon: '🔴', color: '#8B4513' },
  groundYellowOchre: { name: 'Ground Yellow Ochre', icon: '🟡', color: '#DAA520' },
  groundCharcoal: { name: 'Ground Charcoal', icon: '⚫', color: '#1C1C1C' },
  redPaint: { name: 'Red Paint', icon: '🎨', color: '#8B4513' },
  yellowPaint: { name: 'Yellow Paint', icon: '🎨', color: '#DAA520' },
  blackPaint: { name: 'Black Paint', icon: '🎨', color: '#1C1C1C' },
  brush: { name: 'Brush', icon: '🖌️', color: '#8B7355' },
  sprayTube: { name: 'Spray Tube', icon: '💨', color: '#F5DEB3' },
  animalHair: { name: 'Animal Hair', icon: '🦴', color: '#8B7355' },
  sinew: { name: 'Sinew', icon: '🧵', color: '#D2691E' },
  hollowBone: { name: 'Hollow Bone', icon: '🦴', color: '#F5DEB3' }
};

// Crafting Recipes
const recipes = {
  torch: {
    name: 'Torch',
    icon: '🔥',
    requires: { wood: 2, animalFat: 1 },
    produces: 'torch',
    isLight: true
  },
  spear: {
    name: 'Spear',
    icon: '🗡️',
    requires: { wood: 2, flint: 1 },
    produces: 'spear'
  },
  stoneKnife: {
    name: 'Stone Knife',
    icon: '🔪',
    requires: { flint: 2, wood: 1 },
    produces: 'stoneKnife'
  },
  stoneLamp: {
    name: 'Stone Lamp',
    icon: '🪔',
    requires: { stone: 1, animalFat: 2 },
    produces: 'stoneLamp',
    isLight: true
  },
  grindingStone: {
    name: 'Grinding Stone',
    icon: '⚒️',
    requires: { stone: 2 },
    produces: 'grindingStone'
  },
  mixingShell: {
    name: 'Mixing Shell',
    icon: '🐚',
    requires: { stone: 1 },
    produces: 'mixingShell'
  },
  brush: {
    name: 'Brush',
    icon: '🖌️',
    requires: { wood: 1, animalHair: 1, sinew: 1 },
    produces: 'brush'
  },
  sprayTube: {
    name: 'Spray Tube',
    icon: '💨',
    requires: { hollowBone: 1, flint: 1 },
    produces: 'sprayTube'
  }
};

// ========================================
// INITIALIZATION
// ========================================

function init() {
  console.log('⚙️ Initializing Three.js scene...');
  
  // Scene Setup
  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x87CEEB, 50, 500);
  
  // Camera
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 1.6, 0);
  
  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.getElementById('game-container').appendChild(renderer.domElement);
  
  // Clock
  clock = new THREE.Clock();
  
  // Lights
  setupLighting();
  
  // Environment
  createTerrain();
  createSky();
  createTrees();
  createResources();
  createAnimals();
  createCave();
  
  // Event Listeners
  setupEventListeners();
  
  // UI
  updateUI();
  
  console.log('✅ Initialization complete!');
  
  // Show start button
  document.getElementById('start-game-btn').style.display = 'block';
  document.querySelector('.loading-text').textContent = 'Ready to begin!';
}

function setupLighting() {
  // Ambient Light
  const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
  scene.add(ambientLight);
  
  // Directional Light (Sun)
  sun = new THREE.DirectionalLight(0xffffff, 1.2);
  sun.position.set(50, 100, 50);
  sun.castShadow = true;
  sun.shadow.mapSize.width = 2048;
  sun.shadow.mapSize.height = 2048;
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 500;
  sun.shadow.camera.left = -100;
  sun.shadow.camera.right = 100;
  sun.shadow.camera.top = 100;
  sun.shadow.camera.bottom = -100;
  scene.add(sun);
}

function createTerrain() {
  // Ground
  const groundGeometry = new THREE.PlaneGeometry(1000, 1000, 50, 50);
  const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0x5C4033,
    roughness: 0.9,
    metalness: 0.1
  });
  
  // Add height variation
  const vertices = groundGeometry.attributes.position.array;
  for (let i = 0; i < vertices.length; i += 3) {
    vertices[i + 2] = Math.sin(vertices[i] * 0.05) * Math.cos(vertices[i + 1] * 0.05) * 8;
  }
  groundGeometry.attributes.position.needsUpdate = true;
  groundGeometry.computeVertexNormals();
  
  terrain = new THREE.Mesh(groundGeometry, groundMaterial);
  terrain.rotation.x = -Math.PI / 2;
  terrain.receiveShadow = true;
  scene.add(terrain);
  
  // River
  const riverGeometry = new THREE.PlaneGeometry(20, 200);
  const riverMaterial = new THREE.MeshStandardMaterial({
    color: 0x4682B4,
    roughness: 0.2,
    metalness: 0.3,
    transparent: true,
    opacity: 0.7
  });
  const river = new THREE.Mesh(riverGeometry, riverMaterial);
  river.rotation.x = -Math.PI / 2;
  river.position.set(50, 0.1, 0);
  scene.add(river);
}

function createSky() {
  // Try to load an HDR equirectangular sky if available (sky.hdr in project root)
  // Falls back to a simple colored sphere if loading fails or loader not present.
  function fallbackSky() {
    const skyGeometry = new THREE.SphereGeometry(500, 32, 32);
    const skyMaterial = new THREE.MeshBasicMaterial({
      color: 0x87CEEB,
      side: THREE.BackSide
    });
    sky = new THREE.Mesh(skyGeometry, skyMaterial);
    scene.add(sky);
  }

  // We'll try multiple candidates: prefer EXR (if available), then HDR.
  // Prefer a 4k prefiltered file if present, then EXR, then hdr
  const candidates = ['kloppenheim_06_puresky_4k.hdr', 'sky_4k.hdr', 'sky_4k.exr', 'sky.exr', 'sky.hdr'];
  const MAX_BYTES = 30 * 1024 * 1024; // 30 MB threshold — increased for large 8k HDRs

  const tryNext = (index) => {
    if (index >= candidates.length) {
      console.warn('⚠️ No environment map loaded. Using fallback sky.');
      console.groupCollapsed('createSky: candidates tried');
      candidates.forEach((c, i) => console.log(`#${i + 1}: ${c}`));
      console.groupEnd();
      fallbackSky();
      return;
    }

    const url = candidates[index];
    console.log(`🔎 Trying environment candidate #${index + 1}/${candidates.length}: ${url}`);
    const ext = url.split('.').pop().toLowerCase();

    // Helper to apply a texture (equirectangular) to the scene
    const applyEnv = (texture) => {
      try {
        const pmremGenerator = new THREE.PMREMGenerator(renderer);
        pmremGenerator.compileEquirectangularShader();
        const envMap = pmremGenerator.fromEquirectangular(texture).texture;

        scene.environment = envMap;
        scene.background = envMap;

        texture.dispose && texture.dispose();
        pmremGenerator.dispose();

        console.log(`✅ ${url} loaded and applied as environment map`);
      } catch (e) {
        console.warn('⚠️ Error applying environment map, trying next candidate:', e);
        tryNext(index + 1);
      }
    };

    // Try EXR first
    if (ext === 'exr') {
      if (typeof THREE.EXRLoader === 'undefined') {
        console.warn(`createSky: EXR candidate ${url} skipped — THREE.EXRLoader not present.`);
        tryNext(index + 1);
        return;
      }
      console.log('🔧 EXRLoader found, attempting to load', url);
      const loader = new THREE.EXRLoader();
      loader.load(url, (tex) => {
        applyEnv(tex);
      }, (xhr) => {
        if (xhr && xhr.loaded && xhr.total) console.log(`📥 ${url} loading: ${Math.round((xhr.loaded/xhr.total)*100)}%`);
      }, (err) => {
        console.warn(`⚠️ Failed to load ${url} with EXRLoader, trying next candidate. Error:`, err);
        tryNext(index + 1);
      });
      return;
    }

    // HDR (RGBE) handling
    if (ext === 'hdr') {
      if (typeof THREE.RGBELoader === 'undefined') {
        console.warn(`createSky: HDR candidate ${url} skipped — THREE.RGBELoader not present.`);
        tryNext(index + 1);
        return;
      }
      console.log('🔧 RGBELoader found, attempting to load', url);
      const hdrUrl = url;

      // First try HEAD to check size (may fail due to CORS or file://)
      fetch(hdrUrl, { method: 'HEAD' }).then(headResp => {
        console.log(`HEAD ${hdrUrl} -> ${headResp.status} ${headResp.statusText}`);
        if (headResp.ok) {
          const len = headResp.headers.get('content-length');
          if (len && parseInt(len) > MAX_BYTES) {
            const sizeMB = Math.round(parseInt(len) / 1024 / 1024);
            console.warn(`⚠️ Detected ${url} size ${sizeMB} MB — very large. Prompting user before loading.`);

            // Create a simple confirmation prompt in the page
            const existing = document.getElementById('hdr-load-prompt');
            if (existing) existing.remove();

            const prompt = document.createElement('div');
            prompt.id = 'hdr-load-prompt';
            prompt.style.position = 'fixed';
            prompt.style.left = '50%';
            prompt.style.top = '20%';
            prompt.style.transform = 'translateX(-50%)';
            prompt.style.background = 'rgba(10,10,10,0.95)';
            prompt.style.color = '#fff';
            prompt.style.padding = '1.2rem 1.6rem';
            prompt.style.border = '2px solid #1FB8CD';
            prompt.style.borderRadius = '8px';
            prompt.style.zIndex = 20000;
            prompt.style.maxWidth = '90%';
            prompt.innerHTML = `
              <div style="font-weight:bold;margin-bottom:8px">Large environment file detected</div>
              <div style="margin-bottom:10px">${url} is approximately ${sizeMB} MB. Loading it may be slow or crash the browser. Do you want to load it now?</div>
              <div style="display:flex;gap:8px;justify-content:flex-end">
                <button class="btn-cancel" style="padding:8px 12px;border-radius:6px;background:#8B7355;border:none;color:white;">Cancel</button>
                <button class="btn-load" style="padding:8px 12px;border-radius:6px;background:#1FB8CD;border:none;color:#041014;">Load ${sizeMB} MB file</button>
              </div>
            `;
            document.body.appendChild(prompt);

            // Attach handlers
            prompt.querySelector('.btn-cancel').onclick = () => {
              prompt.remove();
              tryNext(index + 1);
            };

            prompt.querySelector('.btn-load').onclick = () => {
              prompt.remove();

              // Proceed to fetch+parse the large HDR (same code as below)
              const loader = new THREE.RGBELoader();
              loader.setDataType(THREE.UnsignedByteType);

              fetch(hdrUrl).then(resp => resp.arrayBuffer()).then(buffer => {
                try {
                  const tex = loader.parse(buffer);
                  applyEnv(tex);
                } catch (e) {
                  console.warn('⚠️ RGBE parse failed for', hdrUrl, 'falling back to loader.load or next candidate. Error:', e);
                  loader.load(hdrUrl, (texture) => {
                    applyEnv(texture);
                  }, (xhr) => {
                    if (xhr && xhr.loaded && xhr.total) console.log(`📥 ${hdrUrl} loading: ${Math.round((xhr.loaded/xhr.total)*100)}%`);
                  }, (err) => {
                    console.warn('⚠️ Failed to load HDR using loader.load, trying next candidate. Error:', err);
                    tryNext(index + 1);
                  });
                }
              }).catch(err => {
                console.warn(`⚠️ Failed to fetch ${hdrUrl}, trying next candidate. Error:`, err);
                tryNext(index + 1);
              });
            };

            return; // wait for user action
          }
        }

        // If file is not too large (or HEAD unavailable), proceed normally
        const loader = new THREE.RGBELoader();
        loader.setDataType(THREE.UnsignedByteType);

        fetch(hdrUrl).then(resp => resp.arrayBuffer()).then(buffer => {
          try {
            // parse returns a DataTexture
            const tex = loader.parse(buffer);
            applyEnv(tex);
          } catch (e) {
            console.warn('⚠️ RGBE parse failed for', hdrUrl, 'falling back to loader.load or next candidate. Error:', e);
            // last resort: try loader.load (may also fail)
            loader.load(hdrUrl, (texture) => {
              applyEnv(texture);
            }, (xhr) => {
              if (xhr && xhr.loaded && xhr.total) console.log(`📥 ${hdrUrl} loading: ${Math.round((xhr.loaded/xhr.total)*100)}%`);
            }, (err) => {
              console.warn('⚠️ Failed to load HDR using loader.load, trying next candidate. Error:', err);
              tryNext(index + 1);
            });
          }
        }).catch(err => {
          console.warn(`⚠️ Failed to fetch ${hdrUrl}, trying next candidate. Error:`, err);
          tryNext(index + 1);
        });
      }).catch(() => {
        // HEAD failed (CORS or file://). Try fetch+parse directly
        const loader = new THREE.RGBELoader();
        loader.setDataType(THREE.UnsignedByteType);
        fetch(hdrUrl).then(resp => resp.arrayBuffer()).then(buffer => {
          try {
            const tex = loader.parse(buffer);
            applyEnv(tex);
          } catch (e) {
            console.warn('⚠️ RGBE parse failed for', hdrUrl, 'falling back to loader.load or next candidate. Error:', e);
            loader.load(hdrUrl, (texture) => { applyEnv(texture); }, undefined, (err) => { console.warn('⚠️ Failed to load HDR:', err); tryNext(index+1); });
          }
        }).catch(err => { console.warn('⚠️ Failed to fetch HDR:', err); tryNext(index+1); });
      });
      return;
    }

    // No suitable loader for this extension, move to next
    tryNext(index + 1);
  };

  // Start trying candidates
  tryNext(0);
}

function createTrees() {
  const treePositions = [
    [-20, 0, -30], [25, 0, -40], [-35, 0, -50],
    [40, 0, -60], [-15, 0, -70], [30, 0, -80],
    [-40, 0, 35], [20, 0, 45], [-25, 0, 55],
    [35, 0, 65], [-30, 0, 75], [45, 0, 85]
  ];
  
  treePositions.forEach(pos => {
    const tree = createTree(pos[0], pos[1], pos[2]);
    trees.push(tree);
    scene.add(tree);
  });
}

function createTree(x, y, z) {
  const treeGroup = new THREE.Group();
  
  // Trunk
  const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.7, 5, 8);
  const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x4A3526 });
  const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
  trunk.position.y = 2.5;
  trunk.castShadow = true;
  treeGroup.add(trunk);
  
  // Canopy
  const canopyGeometry = new THREE.ConeGeometry(3, 5, 8);
  const canopyMaterial = new THREE.MeshStandardMaterial({ color: 0x2d5016 });
  const canopy = new THREE.Mesh(canopyGeometry, canopyMaterial);
  canopy.position.y = 6;
  canopy.castShadow = true;
  treeGroup.add(canopy);
  
  treeGroup.position.set(x, y, z);
  treeGroup.userData = { type: 'tree', interactable: true };
  
  return treeGroup;
}

function createResources() {
  // Scattered resources
  const resourceTypes = [
    { type: 'stone', icon: '🪨', color: 0x808080, positions: [[10, 0, -20], [-15, 0, -25], [20, 0, 30]] },
    { type: 'flint', icon: '⚡', color: 0x696969, positions: [[-8, 0, -15], [15, 0, -35], [-20, 0, 40]] },
    { type: 'redOchre', icon: '🔴', color: 0x8B4513, positions: [[45, 0, -10], [48, 0, 5]] },
    { type: 'yellowOchre', icon: '🟡', color: 0xDAA520, positions: [[42, 0, 15], [46, 0, 20]] }
  ];
  
  resourceTypes.forEach(res => {
    res.positions.forEach(pos => {
      const resource = createResource(res.type, res.color, pos[0], pos[1], pos[2]);
      resources.push(resource);
      scene.add(resource);
    });
  });
}

function createResource(type, color, x, y, z) {
  const geometry = new THREE.SphereGeometry(0.5, 8, 8);
  const material = new THREE.MeshStandardMaterial({
    color: color,
    emissive: color,
    emissiveIntensity: 0.2
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y + 0.5, z);
  mesh.userData = { type: 'resource', resourceType: type, interactable: true };
  
  // Glow animation
  mesh.userData.glowPhase = Math.random() * Math.PI * 2;
  
  return mesh;
}

function createAnimals() {
  const animalPositions = [
    [-30, 0, -40], [35, 0, -50], [-25, 0, 60]
  ];
  
  animalPositions.forEach(pos => {
    const animal = createAnimal(pos[0], pos[1], pos[2]);
    animals.push(animal);
    scene.add(animal);
  });
}

function createCave() {
  // Simple cave back wall with a canvas texture so painting can occur
  cave = new THREE.Group();

  // Create a canvas for the wall texture (used by the painting system)
  const wallCanvas = document.createElement('canvas');
  wallCanvas.width = 1024;
  wallCanvas.height = 1024;
  const wallCtx = wallCanvas.getContext('2d');
  // Base rock color
  wallCtx.fillStyle = '#3C3020';
  wallCtx.fillRect(0, 0, wallCanvas.width, wallCanvas.height);
  // Add some subtle speckle for texture
  for (let i = 0; i < 800; i++) {
    wallCtx.fillStyle = `rgba(${Math.floor(Math.random() * 40 + 30)}, ${Math.floor(Math.random() * 40 + 20)}, ${Math.floor(Math.random() * 30 + 20)}, ${Math.random() * 0.25 + 0.05})`;
    wallCtx.fillRect(Math.random() * wallCanvas.width, Math.random() * wallCanvas.height, 2, 2);
  }

  const wallTexture = new THREE.CanvasTexture(wallCanvas);
  wallTexture.needsUpdate = true;

  const wallGeom = new THREE.PlaneGeometry(40, 20);
  const wallMat = new THREE.MeshStandardMaterial({ map: wallTexture, side: THREE.FrontSide });
  const wallMesh = new THREE.Mesh(wallGeom, wallMat);
  wallMesh.position.set(0, 10, -60);
  wallMesh.receiveShadow = true;
  wallMesh.userData = { type: 'paintableWall', interactable: false, canvas: wallCanvas, texture: wallTexture };

  cave.add(wallMesh);

  // Add some simple rock geometry for entrance visuals
  const rockGeo = new THREE.SphereGeometry(6, 12, 12);
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x4b3a2b, roughness: 1 });
  const rock = new THREE.Mesh(rockGeo, rockMat);
  rock.position.set(-12, 4, -55);
  rock.castShadow = true;
  cave.add(rock);

  const rock2 = rock.clone();
  rock2.position.set(12, 3.5, -55);
  cave.add(rock2);

  scene.add(cave);

  // Register paintable wall(s)
  paintableWalls.push(wallMesh);
}

function createAnimal(x, y, z) {
  const animalGroup = new THREE.Group();
  
  // Body
  const bodyGeometry = new THREE.BoxGeometry(1.5, 1, 2);
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x8B7355 });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.y = 1;
  body.castShadow = true;
  animalGroup.add(body);
  
  // Head
  const headGeometry = new THREE.SphereGeometry(0.5, 8, 8);
  const head = new THREE.Mesh(headGeometry, bodyMaterial);
  head.position.set(0, 1, 1.2);
  head.castShadow = true;
  animalGroup.add(head);
  
  animalGroup.position.set(x, y, z);
  animalGroup.userData = {
    type: 'animal',
    species: 'deer',
    interactable: true,
    health: 50,
    moveSpeed: 0.02,
    wanderAngle: Math.random() * Math.PI * 2
  };
  
  return animalGroup;
}

// ========================================
// EVENT LISTENERS
// ========================================

function setupEventListeners() {
  // Keyboard
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);
  
  // Mouse
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('click', onClick);
  
  // Window
  window.addEventListener('resize', onWindowResize);
  
  // Start button
  document.getElementById('start-game-btn').addEventListener('click', startGame);
}

let isPointerLocked = false;
let rotationX = 0;
let rotationY = 0;

function onKeyDown(event) {
  if (!isPointerLocked) return;
  
  switch(event.code) {
    case 'KeyW': case 'ArrowUp': controls.forward = true; break;
    case 'KeyS': case 'ArrowDown': controls.backward = true; break;
    case 'KeyA': case 'ArrowLeft': controls.left = true; break;
    case 'KeyD': case 'ArrowRight': controls.right = true; break;
    case 'Space': controls.jump = true; event.preventDefault(); break;
    case 'ShiftLeft': controls.run = true; break;
    case 'KeyE': interact(); break;
    case 'KeyC': toggleCrafting(); break;
    case 'KeyG': openGrinding(); break;
    case 'KeyM': openMixing(); break;
    case 'KeyP': togglePainting(); break;
    case 'KeyH': openHelp(); break;
    case 'KeyT': if(gameState.paintingMode) addTemplate(); break;
    case 'KeyZ': if(gameState.paintingMode) undoPaintStroke(); break;
    case 'KeyQ': if(gameState.paintingMode) cyclePaintColor(-1); break;
    case 'Tab': toggleInventory(); event.preventDefault(); break;
    case 'Digit1': selectHotbarSlot(0); break;
    case 'Digit2': selectHotbarSlot(1); break;
    case 'Digit3': gameState.paintingMode ? selectPaintTool(2) : selectHotbarSlot(2); break;
    case 'Digit4': gameState.paintingMode ? selectPaintTool(3) : selectHotbarSlot(3); break;
    case 'Digit5': gameState.paintingMode ? selectPaintTool(4) : selectHotbarSlot(4); break;
  }
}

function onKeyUp(event) {
  switch(event.code) {
    case 'KeyW': case 'ArrowUp': controls.forward = false; break;
    case 'KeyS': case 'ArrowDown': controls.backward = false; break;
    case 'KeyA': case 'ArrowLeft': controls.left = false; break;
    case 'KeyD': case 'ArrowRight': controls.right = false; break;
    case 'Space': controls.jump = false; break;
    case 'ShiftLeft': controls.run = false; break;
  }
}

function onMouseMove(event) {
  if (!isPointerLocked) return;
  
  const sensitivity = 0.002;
  rotationY -= event.movementX * sensitivity;
  rotationX -= event.movementY * sensitivity;
  rotationX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rotationX));
}

function onClick() {
  if (!isPointerLocked) {
    renderer.domElement.requestPointerLock();
  }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

document.addEventListener('pointerlockchange', () => {
  isPointerLocked = document.pointerLockElement === renderer.domElement;
});

// ========================================
// GAME LOGIC
// ========================================

function startGame() {
  document.getElementById('loading-screen').classList.remove('active');
  document.getElementById('hud').style.display = 'block';
  renderer.domElement.requestPointerLock();
  showNotification('Welcome to 17,000 BCE! Survive the Magdalenian wilderness.', 3000);
  animate();
}

function animate() {
  requestAnimationFrame(animate);
  
  const delta = clock.getDelta();
  
  updatePlayer(delta);
  updateEnvironment(delta);
  updateAnimals(delta);
  updateResources(delta);
  checkInteractables();
  checkPaintableWall();
  updateSurvivalStats(delta);
  
  renderer.render(scene, camera);
}

function updatePlayer(delta) {
  if (!isPointerLocked) return;
  
  // Apply rotation
  camera.rotation.set(rotationX, rotationY, 0, 'YXZ');
  
  // Movement
  const moveSpeed = controls.run ? 8 : 5;
  velocity.set(0, 0, 0);
  
  direction.set(0, 0, 0);
  if (controls.forward) direction.z -= 1;
  if (controls.backward) direction.z += 1;
  if (controls.left) direction.x -= 1;
  if (controls.right) direction.x += 1;
  
  direction.normalize();
  direction.applyEuler(new THREE.Euler(0, rotationY, 0));
  
  velocity.x = direction.x * moveSpeed * delta;
  velocity.z = direction.z * moveSpeed * delta;
  
  camera.position.add(velocity);
  
  // Keep on terrain
  camera.position.y = 1.6;
  
  // Boundary
  camera.position.x = Math.max(-480, Math.min(480, camera.position.x));
  camera.position.z = Math.max(-480, Math.min(480, camera.position.z));
  
  gameState.position = { x: camera.position.x, y: camera.position.y, z: camera.position.z };
  
  // Stamina
  if (controls.run && direction.length() > 0) {
    gameState.stamina = Math.max(0, gameState.stamina - 10 * delta);
  } else {
    gameState.stamina = Math.min(100, gameState.stamina + 5 * delta);
  }
}

function updateEnvironment(delta) {
  // Time progression
  gameState.time += delta / 60; // 1 minute = 60 seconds
  if (gameState.time >= 24) gameState.time = 0;
  
  // Update lighting based on time
  const hour = gameState.time;
  let lightIntensity, skyColor;
  
  if (hour >= 6 && hour < 8) { // Dawn
    const t = (hour - 6) / 2;
    lightIntensity = 0.3 + t * 0.9;
    skyColor = new THREE.Color().lerpColors(new THREE.Color(0x191970), new THREE.Color(0x87CEEB), t);
  } else if (hour >= 8 && hour < 18) { // Day
    lightIntensity = 1.2;
    skyColor = new THREE.Color(0x87CEEB);
  } else if (hour >= 18 && hour < 20) { // Dusk
    const t = (hour - 18) / 2;
    lightIntensity = 1.2 - t * 0.9;
    skyColor = new THREE.Color().lerpColors(new THREE.Color(0x87CEEB), new THREE.Color(0xFF8C00), t);
  } else { // Night
    lightIntensity = 0.2;
    skyColor = new THREE.Color(0x191970);
  }
  
  sun.intensity = lightIntensity;
  sky.material.color = skyColor;
  scene.fog.color = skyColor;
  
  // Update sun position
  const sunAngle = (hour / 24) * Math.PI * 2 - Math.PI / 2;
  sun.position.x = Math.cos(sunAngle) * 100;
  sun.position.y = Math.sin(sunAngle) * 100;
}

function updateAnimals(delta) {
  animals.forEach(animal => {
    // Simple wandering AI
    animal.userData.wanderAngle += (Math.random() - 0.5) * 0.1;
    const moveX = Math.cos(animal.userData.wanderAngle) * animal.userData.moveSpeed;
    const moveZ = Math.sin(animal.userData.wanderAngle) * animal.userData.moveSpeed;
    
    animal.position.x += moveX;
    animal.position.z += moveZ;
    
    // Keep in bounds
    animal.position.x = Math.max(-450, Math.min(450, animal.position.x));
    animal.position.z = Math.max(-450, Math.min(450, animal.position.z));
    
    // Face movement direction
    animal.rotation.y = animal.userData.wanderAngle;
  });
}

function updateResources(delta) {
  resources.forEach(resource => {
    // Glow animation
    resource.userData.glowPhase += delta * 2;
    const glow = Math.sin(resource.userData.glowPhase) * 0.3 + 0.5;
    resource.material.emissiveIntensity = glow * 0.3;
  });
}

function checkPaintableWall() {
  if (!isPointerLocked) return;
  
  // Check distance to paintable walls
  let nearWall = false;
  paintableWalls.forEach(wall => {
    const distance = camera.position.distanceTo(wall.position);
    if (distance < 5) {
      nearWall = true;
      gameState.nearPaintableWall = true;
      if (!gameState.paintingMode) {
        showInteractionPrompt('paintableWall');
      }
    }
  });
  
  if (!nearWall && gameState.nearPaintableWall && !gameState.paintingMode) {
    gameState.nearPaintableWall = false;
    hideInteractionPrompt();
  }
}

function checkInteractables() {
  if (gameState.paintingMode) return;
  if (gameState.nearPaintableWall) return; // Wall prompt takes priority
  
  raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
  raycaster.far = 5;
  
  const allObjects = [...trees, ...resources, ...animals];
  const intersects = raycaster.intersectObjects(allObjects, true);
  
  if (intersects.length > 0) {
    let obj = intersects[0].object;
    while (obj.parent && !obj.userData.interactable) {
      obj = obj.parent;
    }
    
    if (obj.userData && obj.userData.interactable) {
      interactableObject = obj;
      showInteractionPrompt(obj.userData.type);
      return;
    }
  }
  
  interactableObject = null;
  hideInteractionPrompt();
}

function showInteractionPrompt(type) {
  const prompt = document.getElementById('interaction-prompt');
  const text = document.getElementById('interaction-text');
  
  switch(type) {
    case 'tree':
      text.textContent = 'Press E to gather Wood';
      break;
    case 'resource':
      text.textContent = 'Press E to gather';
      break;
    case 'animal':
      text.textContent = 'Press E to hunt (requires Spear)';
      break;
    case 'paintableWall':
      text.textContent = 'Press P to Paint on this wall';
      break;
    default:
      text.textContent = 'Press E to interact';
  }
  
  prompt.style.display = 'block';
}

function hideInteractionPrompt() {
  document.getElementById('interaction-prompt').style.display = 'none';
}

function interact() {
  if (!interactableObject) return;
  
  const userData = interactableObject.userData;
  
  switch(userData.type) {
    case 'tree':
      gatherResource('wood', 2);
      break;
    case 'resource':
      gatherResource(userData.resourceType, 1);
      scene.remove(interactableObject);
      resources = resources.filter(r => r !== interactableObject);
      break;
    case 'animal':
      huntAnimal(interactableObject);
      break;
  }
}

function gatherResource(type, amount) {
  if (!gameState.inventory[type]) {
    gameState.inventory[type] = 0;
  }
  gameState.inventory[type] += amount;
  
  // Extra resources from hunting
  if (type === 'hide') {
    // Chance to get hair and sinew
    if (Math.random() > 0.5) {
      if (!gameState.inventory['animalHair']) gameState.inventory['animalHair'] = 0;
      gameState.inventory['animalHair'] += 1;
    }
    if (Math.random() > 0.5) {
      if (!gameState.inventory['sinew']) gameState.inventory['sinew'] = 0;
      gameState.inventory['sinew'] += 1;
    }
  }
  
  if (type === 'bone') {
    // Chance to get hollow bone
    if (Math.random() > 0.6) {
      if (!gameState.inventory['hollowBone']) gameState.inventory['hollowBone'] = 0;
      gameState.inventory['hollowBone'] += 1;
    }
  }
  
  const mat = materials[type];
  showNotification(`Gathered ${amount}x ${mat.name}`, 2000);
  updateUI();
  
  // Decrease stamina
  gameState.stamina = Math.max(0, gameState.stamina - 5);
}

function huntAnimal(animal) {
  // Check for spear
  const hasSpear = gameState.hotbar.some(item => item === 'spear');
  
  if (!hasSpear) {
    showNotification('You need a Spear to hunt!', 2000);
    return;
  }
  
  // Hunt success
  gatherResource('meat', 3);
  gatherResource('hide', 2);
  gatherResource('bone', 2);
  gatherResource('animalFat', 1);
  
  scene.remove(animal);
  animals = animals.filter(a => a !== animal);
  
  showNotification('Hunt successful! Gained meat, hide, bones, and fat.', 3000);
  gameState.stamina = Math.max(0, gameState.stamina - 20);
}

function updateSurvivalStats(delta) {
  // Hunger decreases
  gameState.hunger = Math.max(0, gameState.hunger - 0.5 * delta);
  
  // Thirst decreases faster
  gameState.thirst = Math.max(0, gameState.thirst - 1 * delta);
  
  // Health effects
  if (gameState.hunger < 20) {
    gameState.health = Math.max(0, gameState.health - 0.5 * delta);
  }
  if (gameState.thirst < 20) {
    gameState.health = Math.max(0, gameState.health - 1 * delta);
  }
  
  // Temperature effects
  const hour = gameState.time;
  if (hour < 6 || hour > 20) {
    gameState.temperature = 5; // Cold at night
    if (!gameState.hasLight) {
      gameState.health = Math.max(0, gameState.health - 0.3 * delta);
    }
  } else {
    gameState.temperature = 15; // Moderate during day
  }
  
  updateUI();
  
  // Death
  if (gameState.health <= 0) {
    showNotification('You have perished in the wilderness...', 5000);
    setTimeout(() => location.reload(), 5000);
  }
}

// ========================================
// UI FUNCTIONS
// ========================================

function updateUI() {
  // Stats
  updateStatBar('health', gameState.health);
  updateStatBar('hunger', gameState.hunger);
  updateStatBar('thirst', gameState.thirst);
  updateStatBar('stamina', gameState.stamina);
  
  // Time
  const hour = Math.floor(gameState.time);
  const minute = Math.floor((gameState.time % 1) * 60);
  const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  
  let timeLabel, timeIcon;
  if (hour >= 6 && hour < 8) {
    timeLabel = 'Dawn';
    timeIcon = '🌅';
  } else if (hour >= 8 && hour < 18) {
    timeLabel = 'Day';
    timeIcon = '☀️';
  } else if (hour >= 18 && hour < 20) {
    timeLabel = 'Dusk';
    timeIcon = '🌇';
  } else {
    timeLabel = 'Night';
    timeIcon = '🌙';
  }
  
  document.getElementById('time-display').textContent = `${timeLabel} - ${timeString}`;
  document.getElementById('time-icon').textContent = timeIcon;
  document.getElementById('temp-display').textContent = `${gameState.temperature}°C`;
  
  // Inventory
  updateInventoryDisplay();
  updateHotbar();
}

function updateStatBar(stat, value) {
  const bar = document.getElementById(`${stat}-bar`);
  const valueEl = document.getElementById(`${stat}-value`);
  
  bar.style.width = value + '%';
  valueEl.textContent = Math.floor(value);
  
  // Color warning
  if (value < 30) {
    bar.style.filter = 'brightness(0.7)';
  } else {
    bar.style.filter = 'brightness(1)';
  }
}

function updateInventoryDisplay() {
  const grid = document.getElementById('inventory-grid');
  grid.innerHTML = '';
  
  Object.entries(gameState.inventory).forEach(([key, count]) => {
    if (count > 0) {
      const mat = materials[key];
      const slot = document.createElement('div');
      slot.className = 'item-slot';
      slot.innerHTML = `
        ${mat.icon}
        <span class="item-count">${count}</span>
      `;
      slot.title = mat.name;
      slot.addEventListener('click', () => addToHotbar(key));
      grid.appendChild(slot);
    }
  });
}

function updateHotbar() {
  const slots = document.querySelectorAll('.hotbar-slot');
  slots.forEach((slot, i) => {
    const item = gameState.hotbar[i];
    slot.innerHTML = `<span class="slot-number">${i + 1}</span>`;
    
    if (item) {
      const mat = materials[item] || { icon: recipes[item]?.icon || '?' };
      slot.innerHTML += mat.icon;
    }
    
    slot.classList.toggle('active', i === gameState.selectedSlot);
  });
}

function addToHotbar(item) {
  const emptySlot = gameState.hotbar.findIndex(slot => slot === null);
  if (emptySlot !== -1) {
    gameState.hotbar[emptySlot] = item;
    showNotification(`${materials[item].name} added to hotbar`, 1500);
    updateHotbar();
  } else {
    showNotification('Hotbar is full!', 1500);
  }
}

function selectHotbarSlot(index) {
  gameState.selectedSlot = index;
  const item = gameState.hotbar[index];
  
  if (item) {
    // Use item
    if (item === 'meat') {
      gameState.hunger = Math.min(100, gameState.hunger + 30);
      gameState.inventory[item]--;
      gameState.hotbar[index] = null;
      showNotification('Ate meat. Hunger restored!', 2000);
    } else if (item === 'torch' || item === 'stoneLamp') {
      gameState.hasLight = true;
      showNotification('Light source active!', 2000);
    }
  }
  
  updateUI();
}

function toggleCrafting() {
  const panel = document.getElementById('crafting-panel');
  const isVisible = panel.style.display === 'block';
  
  if (!isVisible) {
    renderCraftingRecipes();
    panel.style.display = 'block';
    document.exitPointerLock();
  } else {
    panel.style.display = 'none';
    renderer.domElement.requestPointerLock();
  }
}

function renderCraftingRecipes() {
  const container = document.getElementById('crafting-recipes');
  container.innerHTML = '';
  
  Object.entries(recipes).forEach(([key, recipe]) => {
    const card = document.createElement('div');
    card.className = 'recipe-card';
    
    const canCraft = checkRecipeRequirements(recipe.requires);
    if (!canCraft) card.classList.add('disabled');
    
    const reqText = Object.entries(recipe.requires)
      .map(([mat, count]) => `${materials[mat].icon}×${count}`)
      .join(' ');
    
    card.innerHTML = `
      <div class="recipe-icon">${recipe.icon}</div>
      <div class="recipe-name">${recipe.name}</div>
      <div class="recipe-requirements">${reqText}</div>
    `;
    
    if (canCraft) {
      card.addEventListener('click', () => craftItem(recipe));
    }
    
    container.appendChild(card);
  });
}

function checkRecipeRequirements(requires) {
  return Object.entries(requires).every(([mat, count]) => {
    return gameState.inventory[mat] && gameState.inventory[mat] >= count;
  });
}

function craftItem(recipe) {
  // Consume materials
  Object.entries(recipe.requires).forEach(([mat, count]) => {
    gameState.inventory[mat] -= count;
  });
  
  // Add to inventory
  const product = recipe.produces;
  if (!gameState.inventory[product]) {
    gameState.inventory[product] = 0;
  }
  gameState.inventory[product]++;
  
  if (recipe.isLight) {
    gameState.hasLight = true;
  }
  
  showNotification(`Crafted ${recipe.name}!`, 2000);
  renderCraftingRecipes();
  updateUI();
}

function toggleInventory() {
  // Already visible in bottom-left
  showNotification('Inventory visible in bottom-left panel', 1500);
}

window.closeCrafting = function() {
  document.getElementById('crafting-panel').style.display = 'none';
  renderer.domElement.requestPointerLock();
};

window.closePainting = function() {
  exitPaintingMode();
};

window.closeGrinding = function() {
  document.getElementById('grinding-panel').style.display = 'none';
  grindingProgress = 0;
  currentGrindingItem = null;
  renderer.domElement.requestPointerLock();
};

window.closeMixing = function() {
  document.getElementById('mixing-panel').style.display = 'none';
  mixingProgress = 0;
  renderer.domElement.requestPointerLock();
};

window.closeHelp = function() {
  document.getElementById('help-screen').style.display = 'none';
  if (isPointerLocked) {
    renderer.domElement.requestPointerLock();
  }
};

window.openHelp = function() {
  document.getElementById('help-screen').style.display = 'block';
  document.exitPointerLock();
};

window.undoPaintStroke = function() {
  if (gameState.paintStrokes.length > 0) {
    gameState.paintStrokes.pop();
    repaintCanvas();
    showNotification('Stroke undone', 1000);
  }
};

window.addTemplate = function() {
  showNotification('Template feature coming soon!', 2000);
};



// ========================================
// CAVE ART PREPARATION SYSTEMS
// ========================================

function openGrinding() {
  // Check for raw pigments
  const rawPigments = ['redOchre', 'yellowOchre', 'charcoal'];
  const availablePigment = rawPigments.find(p => gameState.inventory[p] > 0);
  
  if (!availablePigment) {
    showNotification('You need raw pigments (Red Ochre, Yellow Ochre, or Charcoal)', 3000);
    return;
  }
  
  if (!gameState.inventory['grindingStone'] || gameState.inventory['grindingStone'] < 1) {
    showNotification('You need a Grinding Stone! Craft it first.', 3000);
    return;
  }
  
  currentGrindingItem = availablePigment;
  grindingProgress = 0;
  document.getElementById('grinding-progress').style.width = '0%';
  document.getElementById('grinding-percent').textContent = '0%';
  document.getElementById('grinding-panel').style.display = 'block';
  document.exitPointerLock();
  
  // Setup grinding interaction
  const visual = document.getElementById('grinding-visual');
  visual.onmousedown = startGrinding;
}

function startGrinding(e) {
  const visual = document.getElementById('grinding-visual');
  lastGrindPos = { x: e.clientX, y: e.clientY };
  
  const onMove = (e) => {
    if (!lastGrindPos) return;
    
    const dx = e.clientX - lastGrindPos.x;
    const dy = e.clientY - lastGrindPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 5) {
      grindingProgress += distance * 0.1;
      grindingProgress = Math.min(100, grindingProgress);
      
      document.getElementById('grinding-progress').style.width = grindingProgress + '%';
      document.getElementById('grinding-percent').textContent = Math.floor(grindingProgress) + '%';
      
      if (grindingProgress >= 100) {
        completeGrinding();
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      }
      
      lastGrindPos = { x: e.clientX, y: e.clientY };
    }
  };
  
  const onUp = () => {
    lastGrindPos = null;
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
  };
  
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
}

function completeGrinding() {
  const groundType = currentGrindingItem === 'redOchre' ? 'groundRedOchre' :
                     currentGrindingItem === 'yellowOchre' ? 'groundYellowOchre' : 'groundCharcoal';
  
  gameState.inventory[currentGrindingItem]--;
  if (!gameState.inventory[groundType]) gameState.inventory[groundType] = 0;
  gameState.inventory[groundType]++;
  
  showNotification(`✅ Grinding complete! Created ${materials[groundType].name}`, 3000);
  window.closeGrinding();
  updateUI();
}

function openMixing() {
  // Check for ground pigments and binder
  const groundPigments = ['groundRedOchre', 'groundYellowOchre', 'groundCharcoal'];
  const hasGroundPigment = groundPigments.some(p => gameState.inventory[p] > 0);
  
  if (!hasGroundPigment) {
    showNotification('You need ground pigments! Press G to grind raw pigments first.', 3000);
    return;
  }
  
  if (!gameState.inventory['animalFat'] || gameState.inventory['animalFat'] < 1) {
    showNotification('You need Animal Fat as a binder! Hunt animals to get it.', 3000);
    return;
  }
  
  // Populate pigment select
  const select = document.getElementById('pigment-select');
  select.innerHTML = '';
  
  if (gameState.inventory['groundRedOchre'] > 0) {
    select.innerHTML += '<option value="groundRedOchre">Ground Red Ochre 🔴</option>';
  }
  if (gameState.inventory['groundYellowOchre'] > 0) {
    select.innerHTML += '<option value="groundYellowOchre">Ground Yellow Ochre 🟡</option>';
  }
  if (gameState.inventory['groundCharcoal'] > 0) {
    select.innerHTML += '<option value="groundCharcoal">Ground Charcoal ⚫</option>';
  }
  
  // Update color preview
  updateMixingPreview();
  select.onchange = updateMixingPreview;
  
  mixingProgress = 0;
  document.getElementById('mixing-progress').style.width = '0%';
  document.getElementById('mixing-percent').textContent = '0%';
  document.getElementById('mixing-panel').style.display = 'block';
  document.exitPointerLock();
  
  // Setup mixing interaction
  const shell = document.getElementById('mixing-shell');
  shell.onmousedown = startMixing;
}

function updateMixingPreview() {
  const pigmentType = document.getElementById('pigment-select').value;
  const preview = document.getElementById('color-preview');
  
  const colorMap = {
    'groundRedOchre': '#8B4513',
    'groundYellowOchre': '#DAA520',
    'groundCharcoal': '#1C1C1C'
  };
  
  preview.style.background = colorMap[pigmentType] || '#8B4513';
}

function startMixing(e) {
  lastGrindPos = { x: e.clientX, y: e.clientY };
  
  const onMove = (e) => {
    if (!lastGrindPos) return;
    
    const dx = e.clientX - lastGrindPos.x;
    const dy = e.clientY - lastGrindPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 5) {
      mixingProgress += distance * 0.15;
      mixingProgress = Math.min(100, mixingProgress);
      
      document.getElementById('mixing-progress').style.width = mixingProgress + '%';
      document.getElementById('mixing-percent').textContent = Math.floor(mixingProgress) + '%';
      
      if (mixingProgress >= 100) {
        completeMixing();
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      }
      
      lastGrindPos = { x: e.clientX, y: e.clientY };
    }
  };
  
  const onUp = () => {
    lastGrindPos = null;
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
  };
  
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
}

function completeMixing() {
  const pigmentType = document.getElementById('pigment-select').value;
  const paintType = pigmentType === 'groundRedOchre' ? 'redPaint' :
                    pigmentType === 'groundYellowOchre' ? 'yellowPaint' : 'blackPaint';
  
  gameState.inventory[pigmentType]--;
  gameState.inventory['animalFat']--;
  
  if (!gameState.inventory[paintType]) gameState.inventory[paintType] = 0;
  gameState.inventory[paintType]++;
  
  // Add to paints array
  if (!gameState.paints.includes(paintType)) {
    gameState.paints.push(paintType);
  }
  if (!gameState.selectedPaint) {
    gameState.selectedPaint = paintType;
  }
  
  showNotification(`✅ Mixing complete! Created ${materials[paintType].name}`, 3000);
  window.closeMixing();
  updateUI();
}

// ========================================
// CAVE PAINTING MECHANICS
// ========================================

function togglePainting() {
  if (gameState.paintingMode) {
    exitPaintingMode();
  } else {
    enterPaintingMode();
  }
}

function enterPaintingMode() {
  if (!gameState.nearPaintableWall) {
    showNotification('You need to be near a cave wall to paint!', 2000);
    return;
  }
  
  if (gameState.paints.length === 0) {
    showNotification('You need paint! Press M to mix paint from ground pigments.', 3000);
    return;
  }
  
  gameState.paintingMode = true;
  document.getElementById('painting-panel').style.display = 'block';
  document.exitPointerLock();
  
  // Setup painting canvas
  paintingCanvas = document.getElementById('painting-canvas');
  paintingContext = paintingCanvas.getContext('2d');
  
  // Draw cave wall texture
  paintingContext.fillStyle = '#3C3020';
  paintingContext.fillRect(0, 0, paintingCanvas.width, paintingCanvas.height);
  
  // Add texture
  for (let i = 0; i < 500; i++) {
    paintingContext.fillStyle = `rgba(${Math.random() * 50 + 40}, ${Math.random() * 40 + 30}, ${Math.random() * 30 + 20}, 0.3)`;
    paintingContext.fillRect(Math.random() * paintingCanvas.width, Math.random() * paintingCanvas.height, 2, 2);
  }
  
  // Render existing strokes
  repaintCanvas();
  
  // Update paint UI
  updatePaintUI();
  
  // Setup painting events
  paintingCanvas.onmousedown = startPainting;
  paintingCanvas.onmousemove = paint;
  paintingCanvas.onmouseup = stopPainting;
  paintingCanvas.onmouseleave = stopPainting;
  
  showNotification('🎨 Painting Mode Active! Use tools (1-5) and colors (Q/E)', 3000);
}

function exitPaintingMode() {
  gameState.paintingMode = false;
  document.getElementById('painting-panel').style.display = 'none';
  
  // Save painting to wall texture
  if (paintableWalls.length > 0 && paintingCanvas) {
    const wall = paintableWalls[0];
    const wallCanvas = wall.userData.canvas;
    const wallCtx = wallCanvas.getContext('2d');
    
    // Copy painting to wall
    wallCtx.drawImage(paintingCanvas, 0, 0, wallCanvas.width, wallCanvas.height);
    wall.userData.texture.needsUpdate = true;
  }
  
  if (isPointerLocked) {
    renderer.domElement.requestPointerLock();
  }
}

function updatePaintUI() {
  // Update paint colors
  const colorsContainer = document.getElementById('paint-colors');
  colorsContainer.innerHTML = '';
  
  const colorMap = {
    'redPaint': '#8B4513',
    'yellowPaint': '#DAA520',
    'blackPaint': '#1C1C1C'
  };
  
  gameState.paints.forEach(paint => {
    const swatch = document.createElement('div');
    swatch.className = 'color-swatch';
    swatch.style.background = colorMap[paint];
    swatch.title = materials[paint].name;
    if (paint === gameState.selectedPaint) {
      swatch.classList.add('active');
    }
    swatch.onclick = () => {
      gameState.selectedPaint = paint;
      updatePaintUI();
    };
    colorsContainer.appendChild(swatch);
  });
  
  // Update tool buttons
  document.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tool === gameState.selectedTool);
    btn.onclick = () => {
      gameState.selectedTool = btn.dataset.tool;
      updatePaintUI();
    };
  });
}

function startPainting(e) {
  isPainting = true;
  const rect = paintingCanvas.getBoundingClientRect();
  lastPaintPos = {
    x: (e.clientX - rect.left) * (paintingCanvas.width / rect.width),
    y: (e.clientY - rect.top) * (paintingCanvas.height / rect.height)
  };
}

function paint(e) {
  if (!isPainting) return;
  
  const rect = paintingCanvas.getBoundingClientRect();
  const pos = {
    x: (e.clientX - rect.left) * (paintingCanvas.width / rect.width),
    y: (e.clientY - rect.top) * (paintingCanvas.height / rect.height)
  };
  
  const colorMap = {
    'redPaint': '#8B4513',
    'yellowPaint': '#DAA520',
    'blackPaint': '#1C1C1C'
  };
  
  const color = colorMap[gameState.selectedPaint] || '#8B4513';
  
  // Tool settings
  const toolSettings = {
    finger: { size: 15, opacity: 0.7 },
    brush: { size: 5, opacity: 1.0 },
    spray: { size: 25, opacity: 0.3 },
    charcoal: { size: 5, opacity: 0.9 },
    stencil: { size: 50, opacity: 0.5 }
  };
  
  const tool = toolSettings[gameState.selectedTool] || toolSettings.finger;
  
  paintingContext.strokeStyle = color;
  paintingContext.fillStyle = color;
  paintingContext.globalAlpha = tool.opacity;
  paintingContext.lineWidth = tool.size;
  paintingContext.lineCap = 'round';
  paintingContext.lineJoin = 'round';
  
  if (gameState.selectedTool === 'spray') {
    // Spray effect
    for (let i = 0; i < 5; i++) {
      const offsetX = (Math.random() - 0.5) * tool.size;
      const offsetY = (Math.random() - 0.5) * tool.size;
      paintingContext.fillRect(pos.x + offsetX, pos.y + offsetY, 2, 2);
    }
  } else {
    // Regular stroke
    paintingContext.beginPath();
    paintingContext.moveTo(lastPaintPos.x, lastPaintPos.y);
    paintingContext.lineTo(pos.x, pos.y);
    paintingContext.stroke();
  }
  
  lastPaintPos = pos;
  
  // Save stroke
  gameState.paintStrokes.push({
    tool: gameState.selectedTool,
    color: color,
    from: lastPaintPos,
    to: pos
  });
}

function stopPainting() {
  isPainting = false;
  lastPaintPos = null;
}

function repaintCanvas() {
  // Clear and redraw background
  paintingContext.fillStyle = '#3C3020';
  paintingContext.fillRect(0, 0, paintingCanvas.width, paintingCanvas.height);
  
  for (let i = 0; i < 500; i++) {
    paintingContext.fillStyle = `rgba(${Math.random() * 50 + 40}, ${Math.random() * 40 + 30}, ${Math.random() * 30 + 20}, 0.3)`;
    paintingContext.fillRect(Math.random() * paintingCanvas.width, Math.random() * paintingCanvas.height, 2, 2);
  }
  
  // Redraw all strokes
  // (Simplified - full implementation would replay all strokes)
}

function cyclePaintColor(direction) {
  const currentIndex = gameState.paints.indexOf(gameState.selectedPaint);
  let newIndex = currentIndex + direction;
  if (newIndex < 0) newIndex = gameState.paints.length - 1;
  if (newIndex >= gameState.paints.length) newIndex = 0;
  gameState.selectedPaint = gameState.paints[newIndex];
  updatePaintUI();
  showNotification(`Selected: ${materials[gameState.selectedPaint].name}`, 1000);
}

function selectPaintTool(toolIndex) {
  const tools = ['finger', 'brush', 'spray', 'charcoal', 'stencil'];
  gameState.selectedTool = tools[toolIndex];
  updatePaintUI();
  showNotification(`Tool: ${gameState.selectedTool}`, 1000);
}

function showNotification(message, duration = 2000) {
  const notification = document.getElementById('notification');
  notification.textContent = message;
  notification.classList.add('show');
  
  setTimeout(() => {
    notification.classList.remove('show');
  }, duration);
}

// ========================================
// START
// ========================================

window.addEventListener('load', () => {
  console.log('🌍 Starting Magdalenian Survival...');
  init();
});

// Helper function to open help screen
function openHelp() {
  document.getElementById('help-screen').style.display = 'block';
  document.exitPointerLock();
}

console.log('\n🎮 ========================================');
console.log('   MAGDALENIAN SURVIVAL');
console.log('   Upper Paleolithic Experience');
console.log('========================================');
console.log('\n✨ Features:');
console.log('  • Full 3D First-Person Environment');
console.log('  • Survival Mechanics (Health, Hunger, Thirst, Stamina)');
console.log('  • Resource Gathering & Hunting');
console.log('  • Crafting System');
console.log('  • PIGMENT GRINDING SYSTEM (Press G)');
console.log('  • PAINT MIXING SYSTEM (Press M)');
console.log('  • 3D CAVE PAINTING (Press P near walls)');
console.log('  • Day/Night Cycle');
console.log('  • Dynamic Weather & Lighting');
console.log('  • 3D Cave with Paintable Walls');
console.log('  • Comprehensive Controls (Press H)');
console.log('\n🎯 Objective: Create cave art in 17,000 BCE!');
console.log('========================================\n');
