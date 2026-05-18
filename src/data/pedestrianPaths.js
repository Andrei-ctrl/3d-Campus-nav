export const pedestrianPaths = [
    {
    id: "PATH_PER21_TO_MENSA",
    name: "Pedestrian path from PER21 to Mensa",
    width: 3,
    color: "#b8b8b8",
    points: [
        { x: 73, z: 35 },
        { x: 73, z: 25 },
        { x: 95, z: 25 },
        { x: 115, z: 25 }, // crossing node
        { x: 145, z: 30 }
    ]
    },
  {
    id: "PATH_AROUND_MENSA",
    name: "Pedestrian path around Mensa",
    width: 3,
    color: "#b8b8b8",
    points: [
      { x: 145, z: 30 },
      { x: 145, z: -18 },
      { x: 160, z: -18 },
      { x: 175, z: -18 }
    ]
  },
  {
    id: "PATH_MENSA_TO_PER17",
    name: "Pedestrian path from Mensa to PER17",
    width: 3,
    color: "#b8b8b8",
    points: [
      { x: 175, z: -18 },
      { x: 185, z: -35 },
      { x: 195, z: -40 },
      { x: 195, z: -25 }
    ]
  },
  {
    id: "PATH_PER17_FRONT",
    name: "Pedestrian path along PER17",
    width: 3,
    color: "#b8b8b8",
    points: [
      { x: 195, z: -40 },
      { x: 272, z: -40 },
      { x: 272, z: -25 }
    ]
  },
  {
    id: "PATH_PER21_BACK",
    name: "Pedestrian path behind PER21",
    width: 3,
    color: "#b8b8b8",
    points: [
      { x: 73, z: 77 },
      { x: 73, z: 85 },
      { x: -43, z: 85 },
      { x: -43, z: 77 }
    ]
  },
  {
    id: "PATH_PER22_ACCESS",
    name: "Pedestrian path to PER22",
    width: 3,
    color: "#b8b8b8",
    points: [
      { x: -43, z: 35 },
      { x: -48, z: 38 },
      { x: -48, z: 28 }
    ]
  },
  {
  id: "PATH_PER21_MAIN_TO_PER22",
  name: "Pedestrian path from PER21 Main Entrance to PER22",
  width: 3,
  color: "#b8b8b8",
  points: [
    { x: 73, z: 35 },  // PER21_MAIN_ENTRANCE
    { x: 73, z: 25 },   // around the benches in front of PER21
    { x: -48, z: 28 }   // PER22_ENTRANCE
  ]
}
];