// Entrance coordinates use the same convention as buildings.js:
// 1 Three.js unit ≈ 1 meter
// x/z = horizontal map plane
// y = height

export const entrances = [
  {
    id: "PER21_MAIN_ENTRANCE",
    buildingId: "PER21",
    name: "PER21 Main Entrance",
    description: "Main entrance of Pérolles 21 facing the campus road",
    position: { x: 73, y: 0, z: 35 },
    isDefault: true
  },
  {
    id: "PER21_SIDE_ENTRANCE",
    buildingId: "PER21",
    name: "PER21 Side Entrance",
    description: "Secondary entrance of Pérolles 21",
    position: { x: -43, y: 0, z: 35 },
    isDefault: false
  },
  {
    id: "PER21_BACK_ENTRANCE",
    buildingId: "PER21",
    name: "PER21 Back Entrance",
    description: "Back-side entrance of Pérolles 21 near Chemin des Fougères side",
    position: { x: 73, y: 0, z: 77 },
    isDefault: false
  },
   {
    id: "PER21_BACK_ENTRANCE_2",
    buildingId: "PER21",
    name: "PER21 Back Entrance 2",
    description: "Back-side entrance of Pérolles 21 near Chemin des Fougères side",
    position: { x: -43, y: 0, z: 77 },
    isDefault: false
  },
  {
    id: "PER22_ENTRANCE",
    buildingId: "PER22",
    name: "PER22 Entrance",
    description: "Entrance of Pérolles 22 / BP2 library block",
    position: { x: -48, y: 0, z: 28 },
    isDefault: true
  },
  {
    id: "MENSA_ENTRANCE",
    buildingId: "MENSA",
    name: "Mensa Entrance",
    description: "Entrance of Mensa Pérolles",
    position: { x: 145, y: 0, z: 30 },
    isDefault: true
  },
  {
    id: "MENSA_SIDE_ENTRANCE",
    buildingId: "MENSA",
    name: "Mensa Side Entrance",
    description: "Side entrance of Mensa Pérolles",
    position: { x: 160, y: 0, z: -18 },
    isDefault: true
  },
  {
    id: "PER17_ENTRANCE",
    buildingId: "PER17",
    name: "PER17 Entrance",
    description: "Entrance of Pérolles 17",
    position: { x: 195, y: 0, z: -25 },
    isDefault: true
  },
   {
    id: "PER17_BACK_ENTRANCE",
    buildingId: "PER17",
    name: "PER17 Back Entrance",
    description: "Back Entrance of Pérolles 17",
    position: { x: 272, y: 0, z: -25 },
    isDefault: true
  }
];