# AR-assisted Pérolles Campus Navigation Prototype

A Three.js/WebAR application for navigating between Pérolles buildings PER21, PER22, and PER17.

## Project Structure

```
perolles-ar-nav/
├── index.html
├── package.json
├── vite.config.js
├── README.md
└── src/
    ├── main.js
    ├── style.css
    ├── data/
    │   ├── buildings.js
    │   ├── rooms.js
    │   ├── anchors.js
    │   └── graph.js
    ├── scene/
    │   ├── createScene.js
    │   ├── createBuildings.js
    │   └── createLabels.js
    ├── navigation/
    │   ├── dijkstra.js
    │   └── routeRenderer.js
    ├── ui/
    │   ├── controls.js
    │   ├── infoPanel.js
    │   └── commandInput.js
    ├── ar/
    │   └── cameraBackground.js
    └── llm/
        └── resolveDestination.js
```

## Setup

### Prerequisites
- Node.js 16+
- npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

This will start the Vite dev server and open the application in your browser.

### Build for Production

```bash
npm run build
```

## Features (Milestone 1)

✅ Three.js campus scene
✅ Three buildings (PER21, PER22, PER17) with labels
✅ Building entrances marked with cone indicators
✅ 6 sample rooms inside buildings
✅ OrbitControls for camera navigation
✅ Click interaction to select buildings and rooms
✅ Info panel showing selected object metadata

## Usage

- **Rotate:** Middle mouse button + drag
- **Zoom:** Mouse wheel
- **Select:** Left click on buildings or rooms
- **Info:** Selected object info appears at bottom-left

## Next Phases

1. **Phase 3:** Add navigation graph
2. **Phase 4:** Implement shortest-path algorithm
3. **Phase 5:** Add green route visualization
4. **Phase 6:** Build UI controls for destination selection
5. **Phase 7:** Add natural language command parser
6. **Phase 8:** Add camera/AR background
