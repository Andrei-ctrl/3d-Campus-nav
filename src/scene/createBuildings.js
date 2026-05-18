import * as THREE from 'three';

function degToRad(deg) {
  return (deg * Math.PI) / 180;
}

function directionFromAngle(deg) {
  const rad = degToRad(deg);

  return {
    x: Math.cos(rad),
    z: Math.sin(rad)
  };
}

function getLength(building) {
  return building.size.length ?? building.size.width;
}

function getWidth(building) {
  return building.size.width ?? building.size.depth;
}

function getHeight(building) {
  return building.size.height;
}

function getRotationDeg(building) {
  return building.rotationDeg ?? building.rotation ?? 0;
}

function setRotationDeg(building, rotationDeg) {
  building.rotationDeg = rotationDeg;
  building.rotation = rotationDeg;
}

function createBuildingMesh(building) {
  const length = getLength(building);
  const width = getWidth(building);
  const height = getHeight(building);

  const geometry = new THREE.BoxGeometry(length, height, width);
  const material = new THREE.MeshStandardMaterial({
    color: building.color,
    roughness: 0.8,
    metalness: building.isBridge ? 0.15 : 0.05
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  mesh.position.set(
    building.position.x,
    building.position.y + height / 2,
    building.position.z
  );

  mesh.rotation.y = -degToRad(getRotationDeg(building));

  mesh.userData = {
    type: building.isBridge ? 'bridge' : 'building',
    category: building.type,
    id: building.id,
    name: building.name,
    description: building.description
  };

  return mesh;
}

function calculateAttachedBuildings(buildings) {
  const per21 = buildings.find((b) => b.id === 'PER21');
  const per22 = buildings.find((b) => b.id === 'PER22');
  const bridge = buildings.find((b) => b.id === 'BRIDGE_PER21_PER22');

  if (!per21 || !per22) {
    return buildings;
  }

  const per21RotationDeg = getRotationDeg(per21);
  const per21Dir = directionFromAngle(per21RotationDeg);
  const per22RotationDeg = per21RotationDeg + 180;
  const per22Dir = directionFromAngle(per22RotationDeg);
  const attachMultiplier = per22.attachToEnd === 'start' ? -1 : 1;

  const per21HalfLength = getLength(per21) / 2;
  const bridgeLength = bridge ? getLength(bridge) : per22.attachmentGap ?? 0;
  const per22HalfLength = getLength(per22) / 2;
  const per21HalfWidth = getWidth(per21) / 2;
  const per22HalfWidth = getWidth(per22) / 2;

  const per21EndX = per21.position.x + per21Dir.x * per21HalfLength * attachMultiplier;
  const per21EndZ = per21.position.z + per21Dir.z * per21HalfLength * attachMultiplier;

  if (bridge) {
    bridge.position.x = per21EndX + per21Dir.x * (bridgeLength / 2) * attachMultiplier;
    bridge.position.z = per21EndZ + per21Dir.z * (bridgeLength / 2) * attachMultiplier;
    setRotationDeg(bridge, per21RotationDeg);
  }

  if (per22.attachMode === 'sideAtEnd') {
    const sideDir = per22.attachSide === 'left'
      ? { x: -per21Dir.z, z: per21Dir.x }
      : { x: per21Dir.z, z: -per21Dir.x };
    const alongInset = per22.sideInset ?? per22HalfLength;
    const sideGap = per22.sideGap ?? 0;
    const sideOffset = per21HalfWidth + per22HalfWidth + sideGap;

    per22.position.x = per21EndX + per21Dir.x * alongInset * -attachMultiplier + sideDir.x * sideOffset;
    per22.position.z = per21EndZ + per21Dir.z * alongInset * -attachMultiplier + sideDir.z * sideOffset;
  } else {
    const per22ConnectionFaceX = per21EndX + per21Dir.x * bridgeLength * attachMultiplier;
    const per22ConnectionFaceZ = per21EndZ + per21Dir.z * bridgeLength * attachMultiplier;

    per22.position.x = per22ConnectionFaceX + per22Dir.x * per22HalfLength;
    per22.position.z = per22ConnectionFaceZ + per22Dir.z * per22HalfLength;
  }
  setRotationDeg(per22, per22RotationDeg);

  return buildings;
}

function addBuildingEdges(scene, buildingMesh) {
  const edgeGeometry = new THREE.EdgesGeometry(buildingMesh.geometry);
  const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x333333 });
  const line = new THREE.LineSegments(edgeGeometry, edgeMaterial);
  line.position.copy(buildingMesh.position);
  line.rotation.copy(buildingMesh.rotation);
  scene.add(line);
}

export function createCampusBuildings(scene, buildings) {
  const buildingMeshes = {};
  const calculatedBuildings = calculateAttachedBuildings(buildings);

  calculatedBuildings.forEach((building) => {
    const mesh = createBuildingMesh(building);
    scene.add(mesh);
    buildingMeshes[building.id] = mesh;
    addBuildingEdges(scene, mesh);
  });

  return buildingMeshes;
}
