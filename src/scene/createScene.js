import * as THREE from 'three';

export function createScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf7f7f4);
  scene.fog = new THREE.Fog(0xf7f7f4, 360, 620);
  
  return scene;
}

export function createCamera(width, height) {
  const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 10000);

  camera.position.set(70, 260, 300);
  camera.lookAt(70, 0, -10);

  return camera;
}

export function createRenderer(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true
  });

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  renderer.xr.enabled = true;

  return renderer;
}

export function createLighting(scene) {
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.75);
  directionalLight.position.set(-90, 170, 120);
  directionalLight.castShadow = true;

  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  directionalLight.shadow.camera.far = 500;
  directionalLight.shadow.camera.left = -250;
  directionalLight.shadow.camera.right = 250;
  directionalLight.shadow.camera.top = 250;
  directionalLight.shadow.camera.bottom = -250;

  scene.add(directionalLight);

  return { ambientLight, directionalLight };
}

export function createGround(scene) {
  const groundGeometry = new THREE.PlaneGeometry(720, 480);
  const groundMaterial = new THREE.MeshBasicMaterial({
    color: 0xfbfbf8
  });

  const ground = new THREE.Mesh(groundGeometry, groundMaterial);

  ground.rotation.x = -Math.PI / 2;
  ground.position.set(70, -0.1, -10);

  scene.add(ground);

  return ground;
}

export function createOrbitControls(camera, renderer) {
  const target = { x: 70, y: 0, z: -10 };

  const initialX = camera.position.x - target.x;
  const initialY = camera.position.y - target.y;
  const initialZ = camera.position.z - target.z;

  const initialRadius = Math.sqrt(
    initialX * initialX +
    initialY * initialY +
    initialZ * initialZ
  );

  const initialPhi = Math.acos(initialY / initialRadius);
  const initialTheta = Math.atan2(initialZ, initialX);

  const controls = {
    autoRotate: false,
    autoRotateSpeed: 2,
    enableDamping: true,
    dampingFactor: 0.05,
    enableZoom: true,
    zoomSpeed: 1,
    enableRotate: true,
    rotateSpeed: 0.005,
    minDistance: 40,
    maxDistance: 900,
    _phi: initialPhi,
    _theta: initialTheta,
    _radius: initialRadius,
    _targetX: target.x,
    _targetY: target.y,
    _targetZ: target.z,

    update() {
      if (this.autoRotate) {
        this._theta += this.autoRotateSpeed * 0.01;
      }

      const x = this._radius * Math.sin(this._phi) * Math.cos(this._theta);
      const y = this._radius * Math.cos(this._phi);
      const z = this._radius * Math.sin(this._phi) * Math.sin(this._theta);

      camera.position.x += (this._targetX + x - camera.position.x) * this.dampingFactor;
      camera.position.y += (this._targetY + y - camera.position.y) * this.dampingFactor;
      camera.position.z += (this._targetZ + z - camera.position.z) * this.dampingFactor;

      camera.lookAt(this._targetX, this._targetY, this._targetZ);
    }
  };

  let isDragging = false;
  let previousMousePosition = { x: 0, y: 0 };

  renderer.domElement.addEventListener('mousedown', (e) => {
    if (e.button === 1) {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    }
  });

  renderer.domElement.addEventListener('mousemove', (e) => {
    if (isDragging) {
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      controls._theta -= deltaX * controls.rotateSpeed;
      controls._phi += deltaY * controls.rotateSpeed;

      controls._phi = Math.max(0.1, Math.min(Math.PI - 0.1, controls._phi));

      previousMousePosition = { x: e.clientX, y: e.clientY };
    }
  });

  renderer.domElement.addEventListener('mouseup', () => {
    isDragging = false;
  });

  renderer.domElement.addEventListener('mouseleave', () => {
    isDragging = false;
  });

  renderer.domElement.addEventListener('wheel', (e) => {
    e.preventDefault();

    controls._radius += e.deltaY * controls.zoomSpeed * 0.01;
    controls._radius = Math.max(
      controls.minDistance,
      Math.min(controls.maxDistance, controls._radius)
    );
  }, { passive: false });

  return controls;
}