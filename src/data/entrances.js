// Entrance coordinates use the same convention as buildings.js:
// 1 Three.js unit is approximately 1 meter.
// x/z = horizontal map plane, y = height.
//
// This file is the single source of truth for entrance positions.
// Anchors, outdoor graph nodes, 3D markers, and indoor entrance nodes derive from here.
//
// `position` is on the building facade; `outwardOffset` pushes markers 3–4 m outside.

export const ENTRANCE_OUTWARD_OFFSET = 3.5;

export const entrances = [
  {
    id: "PER21_SIDE_ENTRANCE_1",
    buildingId: "PER21",
    name: "PER21 Side Entrance 1",
    description: "Side entrance of Perolles 21, mirrored from the measured sketch to match the PER22 end",
    position: { x: 67, y: 0, z: 37 },
    outwardOffset: { x: 0, z: -ENTRANCE_OUTWARD_OFFSET },
    isDefault: false
  },
  {
    id: "PER21_MAIN_ENTRANCE",
    buildingId: "PER21",
    name: "PER21 Main Entrance",
    description: "Main entrance of Perolles 21, 13 m from side entrance 1",
    position: { x: 54, y: 0, z: 37 },
    outwardOffset: { x: 0, z: -ENTRANCE_OUTWARD_OFFSET },
    isDefault: true
  },
  {
    id: "PER21_SIDE_ENTRANCE_2",
    buildingId: "PER21",
    name: "PER21 Side Entrance 2",
    description: "Side entrance of Perolles 21, 13 m from the main entrance",
    position: { x: 41, y: 0, z: 37 },
    outwardOffset: { x: 0, z: -ENTRANCE_OUTWARD_OFFSET },
    isDefault: false
  },
  {
    id: "PER21_SIDE_ENTRANCE_3",
    buildingId: "PER21",
    name: "PER21 Side Entrance 3",
    description: "Side entrance of Perolles 21, 36 m from side entrance 2",
    position: { x: 5, y: 0, z: 37 },
    outwardOffset: { x: 0, z: -ENTRANCE_OUTWARD_OFFSET },
    isDefault: false
  },
  {
    id: "PER21_END_SIDE_ENTRANCE",
    buildingId: "PER21",
    name: "PER21 End Side Entrance",
    description: "End side entrance of Perolles 21",
    position: { x: -30, y: 0, z: 37 },
    outwardOffset: { x: 0, z: -ENTRANCE_OUTWARD_OFFSET },
    isDefault: false
  },
  {
    id: "PER21_BACK_ENTRANCE",
    buildingId: "PER21",
    name: "PER21 Back Entrance",
    description: "Back entrance opposite side entrance 3",
    position: { x: 5, y: 0, z: 75 },
    outwardOffset: { x: 0, z: ENTRANCE_OUTWARD_OFFSET },
    isDefault: false
  },
  {
    id: "PER21_BACK_ENTRANCE_1",
    buildingId: "PER21",
    name: "PER21 Back Entrance 1",
    description: "Back entrance opposite side entrance 2",
    position: { x: 41, y: 0, z: 75 },
    outwardOffset: { x: 0, z: ENTRANCE_OUTWARD_OFFSET },
    isDefault: false
  },
  {
    id: "PER21_BACK_ENTRANCE_2",
    buildingId: "PER21",
    name: "PER21 Back Entrance 2",
    description: "Back entrance opposite side entrance 1",
    position: { x: 67, y: 0, z: 75 },
    outwardOffset: { x: 0, z: ENTRANCE_OUTWARD_OFFSET },
    isDefault: false
  },
  {
    id: "PER22_ENTRANCE",
    buildingId: "PER22",
    name: "PER22 Entrance",
    description: "Entrance of Perolles 22 / BP2 library block",
    position: { x: -30, y: 0, z: 28 },
    outwardOffset: { x: 0, z: -ENTRANCE_OUTWARD_OFFSET },
    isDefault: true
  },
  {
    id: "MENSA_ENTRANCE",
    buildingId: "MENSA",
    name: "Mensa Entrance",
    description: "Entrance of Mensa Perolles",
    position: { x: 145, y: 0, z: 30 },
    isDefault: true
  },
  {
    id: "MENSA_SIDE_ENTRANCE",
    buildingId: "MENSA",
    name: "Mensa Side Entrance",
    description: "Side entrance of Mensa Perolles",
    position: { x: 160, y: 0, z: -18 },
    isDefault: true
  },
  {
    id: "PER17_ENTRANCE",
    buildingId: "PER17",
    name: "PER17 Entrance",
    description: "Entrance of Perolles 17",
    position: { x: 195, y: 0, z: -25 },
    outwardOffset: { x: 0, z: -ENTRANCE_OUTWARD_OFFSET },
    isDefault: true
  },
  {
    id: "PER17_BACK_ENTRANCE",
    buildingId: "PER17",
    name: "PER17 Back Entrance",
    description: "Back Entrance of Perolles 17",
    position: { x: 272, y: 0, z: -25 },
    outwardOffset: { x: ENTRANCE_OUTWARD_OFFSET, z: 0 },
    isDefault: true
  }
];
