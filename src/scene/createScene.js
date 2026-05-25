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
    rightDragMoveSpeed: 0.18,
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

  let dragMode = null;
  let activePointerId = null;
  let previousPointerPosition = { x: 0, y: 0 };
  let dragMoved = false;
  let isPinching = false;
  let pinchStartDistance = 0;
  let pinchStartRadius = 0;

  const domElement = renderer.domElement;
  domElement.style.touchAction = 'none';

  function moveTargetFromRightDrag(deltaX, deltaY) {
    const scale = controls.rightDragMoveSpeed * Math.max(0.45, controls._radius / 280);
    const forward = {
      x: -Math.cos(controls._theta),
      z: -Math.sin(controls._theta)
    };
    const right = {
      x: -forward.z,
      z: forward.x
    };

    const strafe = deltaX * scale;
    const advance = -deltaY * scale;

    controls._targetX += right.x * strafe + forward.x * advance;
    controls._targetZ += right.z * strafe + forward.z * advance;
  }

  function applyRotate(deltaX, deltaY) {
    controls._theta -= deltaX * controls.rotateSpeed;
    controls._phi += deltaY * controls.rotateSpeed;
    controls._phi = Math.max(0.1, Math.min(Math.PI - 0.1, controls._phi));
  }

  function applyDragDelta(deltaX, deltaY) {
    if (Math.abs(deltaX) + Math.abs(deltaY) > 0) {
      dragMoved = true;
    }

    if (dragMode === 'rotate') {
      applyRotate(deltaX, deltaY);
    } else if (dragMode === 'move') {
      moveTargetFromRightDrag(deltaX, deltaY);
    }
  }

  function getTouchDistance(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.hypot(dx, dy);
  }

  function stopPointerDrag(event) {
    if (event.pointerId !== activePointerId) {
      return;
    }

    dragMode = null;
    activePointerId = null;

    if (domElement.hasPointerCapture(event.pointerId)) {
      domElement.releasePointerCapture(event.pointerId);
    }
  }

  domElement.addEventListener('contextmenu', (event) => {
    event.preventDefault();
  });

  domElement.addEventListener('touchstart', (event) => {
    if (event.touches.length === 2) {
      isPinching = true;
      dragMode = null;
      activePointerId = null;
      pinchStartDistance = getTouchDistance(event.touches);
      pinchStartRadius = controls._radius;
      event.preventDefault();
    }
  }, { passive: false });

  domElement.addEventListener('touchmove', (event) => {
    if (!isPinching || event.touches.length !== 2) {
      return;
    }

    const distance = getTouchDistance(event.touches);

    if (pinchStartDistance > 0) {
      const scale = pinchStartDistance / distance;
      controls._radius = Math.max(
        controls.minDistance,
        Math.min(controls.maxDistance, pinchStartRadius * scale)
      );
      dragMoved = true;
    }

    event.preventDefault();
  }, { passive: false });

  domElement.addEventListener('touchend', (event) => {
    if (event.touches.length < 2) {
      isPinching = false;
      pinchStartDistance = 0;
    }
  });

  domElement.addEventListener('pointerdown', (event) => {
    if (isPinching || activePointerId !== null) {
      return;
    }

    if (event.button === 0 || event.button === 2) {
      event.preventDefault();
      dragMode = event.button === 0 ? 'rotate' : 'move';
      activePointerId = event.pointerId;
      previousPointerPosition = { x: event.clientX, y: event.clientY };
      dragMoved = false;
      domElement.setPointerCapture(event.pointerId);
    }
  });

  domElement.addEventListener('pointermove', (event) => {
    if (isPinching || event.pointerId !== activePointerId || !dragMode) {
      return;
    }

    const deltaX = event.clientX - previousPointerPosition.x;
    const deltaY = event.clientY - previousPointerPosition.y;

    applyDragDelta(deltaX, deltaY);
    previousPointerPosition = { x: event.clientX, y: event.clientY };
  });

  domElement.addEventListener('pointerup', stopPointerDrag);
  domElement.addEventListener('pointercancel', stopPointerDrag);

  domElement.addEventListener('wheel', (event) => {
    event.preventDefault();

    controls._radius += event.deltaY * controls.zoomSpeed * 0.01;
    controls._radius = Math.max(
      controls.minDistance,
      Math.min(controls.maxDistance, controls._radius)
    );
  }, { passive: false });

  controls.consumeClickSuppression = () => {
    const suppress = dragMoved;
    dragMoved = false;
    return suppress;
  };

  return controls;
}
