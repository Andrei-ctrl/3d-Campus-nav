# AR-assisted Pérolles Campus Navigation

A Three.js / WebXR prototype for navigating the HEIA-FR Pérolles campus (Fribourg). It combines a 3D campus map, outdoor GPS tracking, indoor pathfinding, timetable-driven course search, voice commands, and WebXR augmented reality for classroom navigation.

**Status:** Academic / research prototype — functional demo, not production-ready campus-wide navigation without on-site calibration.

**Live build:** GitHub Pages at base path `/3d-Campus-nav/` (build output: `docs/`).

---

## Table of Contents

- [How Features Work](#how-features-work)
- [What Is Implemented](#what-is-implemented)
- [Typical User Flows](#typical-user-flows)
- [Recent Updates](#recent-updates)
- [Limitations](#limitations)
- [Setup](#setup)
- [Project Structure](#project-structure)
- [Architecture Notes](#architecture-notes)
- [Updating the Timetable](#updating-the-timetable)

---

## How Features Work

### 1. Map routing (desktop / 3D view)

**Purpose:** Show the shortest walking route on the campus model before you go outside or enter AR.

**Flow:**
1. You pick a **current location** (entrance anchor) and a **destination** (building or room).
2. `campusRoute.js` plans the trip:
   - Same building → indoor graph only.
   - Different buildings → exit indoors → outdoor graph → re-enter indoors.
   - PER22 ↔ PER21 can use an **indoor bridge** if that path is shorter than going outside.
3. `dijkstra.js` finds the shortest path on each graph.
4. **Blue lines** = outdoor segments (`routeRenderer.js`).
5. **Green lines** = indoor segments (`indoorRouteRenderer.js`), drawn above buildings for visibility.

**Important:** This is a **simplified graph model**, not a scanned map of real corridors. Node positions are approximate metres on a flat campus plane.

---

### 2. Outdoor GPS tracking

**Purpose:** Track your real movement outdoors and advance route progress toward the next path node.

**Why GPS outdoors?** GPS works in open spaces. It fails indoors, so indoor navigation uses WebXR instead (see below).

**How it works:**

```
Phone GPS (lat/lon)
    ↓
convertGpsToLocalPosition()  — flat-earth conversion from origin
    ↓
Campus X/Z coordinates (metres)
    ↓
Compare distance to next outdoor route node
    ↓
Advance node when within ~6 m threshold
```

**Key files:**
- `src/navigation/outdoorRouteProgress.js` — `watchPosition`, progress logic, blue user marker
- `src/data/outdoorGpsOrigin.js` — reference point at PER21 main entrance (`46.79307, 7.15258`)

**Behaviour:**
- Starts **automatically** when you calculate a route with an outdoor leg.
- Updates: distance to next point, remaining distance, GPS accuracy, instruction text.
- **Blue sphere** on the 3D map = your estimated GPS position (does not move the camera).
- **6 m threshold** — larger than indoor AR (~1.5 m) because consumer GPS is typically ±5–15 m.
- Stops when you **Clear Route** or switch to a route without an outdoor leg.
- At a building entrance with an indoor leg, shows a message to start indoor AR.

**Requirements:** HTTPS (or localhost), location permission, phone with real GPS (desktop often gives poor or no GPS).

**Calibration:** If the blue marker is offset on the map, adjust latitude/longitude in `outdoorGpsOrigin.js` on site at PER21 main entrance.

---

### 3. Timetable & course search

**Purpose:** Navigate by **course name** from the official HEIA-FR timetable export, not hardcoded aliases.

**How it works:**
1. At startup, `timetableLoader.js` loads `src/timetable_en_24-05-2026_23-52-48.xlsx` via the `xlsx` library.
2. For each course row, it reads **Long title**, **excel.code**, and **Schedule**.
3. Schedule locations are parsed with regex: `(PER 21, Room G230)` / `(PER 17, Salle 001)`.
4. Room strings are mapped to app destination IDs (e.g. `PER21_G230`, `PER22_AUDITORIUM_JOSEPH_DEISS` for Room 002).
5. Course titles and codes become **search aliases** on those rooms in `destinations.js`.
6. `navigationAgent.js` matches your text/voice command against all aliases.

**Route panel** shows: `Course timetable: 14/18 courses mapped (4 unmapped)`.

**Unmapped courses** occur when:
- Schedule has no room location.
- Room exists in Excel but not in the 3D campus model (e.g. A120, E130).
- Schedule format does not match the parser regex.

Courses **not in the Excel file** (e.g. a removed or unlisted course) will **not** match any destination.

---

### 4. Voice & text commands

**Purpose:** Set destination without using dropdowns.

**How it works:**
- **Text:** type in Route Navigation → **Run Command**.
- **Voice:** **Speak** button → Web Speech API (`en-US`, single utterance) → same parser.
- `navigationAgent.js` normalizes text (accents, spacing, patterns like `PER 21 G230` → `per21 g230`).
- Scores matches against destination names, room aliases, and timetable course aliases.
- Supports `from X to Y`, `take me to …`, spoken “I am at … go to …” patterns.

**Note:** Despite the `llm/` folder name, parsing is **rule-based**, not a large language model.

---

### 5. WebXR AR mode

**Purpose:** See navigation overlays in the phone camera view while walking.

**How it works:**
1. Calculate a route first.
2. Tap **Start AR** → `arSession.js` requests an `immersive-ar` session (`local-floor`).
3. Camera feed replaces the desktop view; campus mesh may be repositioned via scene calibration.
4. Two AR route modes:
   - **Outdoor-only routes:** legacy scaled route via `arRouteRenderer.js` (heavily compressed, `arScale` ~0.05).
   - **Indoor classroom routes:** new system via `indoorRouteProgress.js` (metre-scale, see below).

**Requirements:** Android Chrome + ARCore, HTTPS, user permission for camera/motion.

---

### 6. Indoor AR route progress

**Purpose:** Fixed green path on the floor in AR; progress as you physically walk.

**Why WebXR camera indoors?** Phone AR tracking (VIO) works inside buildings; GPS does not.

**How it works:**

```
Indoor graph path (room → corridor → stairs → room)
    ↓
Convert nodes to metre offsets from entrance anchor
    ↓
Create green cylinder segments (NOT LineBasicMaterial — mobile-safe)
    ↓
User stands at entrance, taps "Align AR Route"
    ↓
Route group placed at camera X/Z, rotated to match phone heading
    ↓
Route stays FIXED in AR world space
    ↓
Each frame: compare WebXR camera position to next node
    ↓
Advance when within ~1.5 m; update turn instructions
```

**Align step (critical):**
- Uses **one-shot** position + heading at the entrance.
- Does **not** scan the real building or detect floors/stairs automatically.
- Green line follows the **3D graph**, not LiDAR geometry — it will not perfectly sit on real stairs unless the model matches reality.

**Instructions:** Go straight / Turn left / Turn right / Take stairs or elevator / Go to room X.

**Key files:** `src/ar/indoorRouteProgress.js`, `src/ui/arRouteProgressPanel.js`.

---

### 7. Scene calibration

**Purpose:** Dev/demo tuning when the 3D map or AR overlay does not match physical space.

- Global and per-group scale (buildings, PER21/22/17 interior, paths, routes).
- AR offset X/Y/Z and AR scale for outdoor AR prototype mode.
- Saved to `localStorage`.
- Does **not** replace on-site GPS or AR entrance alignment for production use.

---

### 8. UI & widgets

- All panels are **draggable** (header bar) and **minimizable**.
- **Show/Hide** (bottom-right) toggles visibility of every panel (`opacity: 0`, non-interactive) except itself.
- Outdoor GPS panel is toggled like other widgets (visible when UI is shown).

---

## What Is Implemented

### 3D campus scene
- PER21, PER22, PER17, Mensa — buildings, roads, pedestrian paths, entrances
- PER21 detailed interior (corridors, lift/stair cores at side entrances, classrooms)
- PER22 / PER17 simplified interiors
- Layer toggles, click-to-inspect, Show/Hide, draggable widgets

### Outdoor navigation
- Dijkstra routing on campus graph + cross-building planner
- PER17: Mensa → **main entrance** path (not under-building shortcut to back entrance)
- PER22 ↔ PER21 indoor bridge when shorter
- Blue outdoor route + route info panel

### Outdoor GPS progress
- Auto-start, blue GPS marker, distances, accuracy, entrance handoff message

### Indoor navigation (map)
- PER21 full room graph; PER17 three rooms + back entrance; PER22 auditorium + library
- Green indoor routes, room markers

### Timetable, voice, AR
- Excel-driven course → room mapping
- Voice + text commands
- WebXR AR + indoor align + progress
- Scene calibration panel

---

## Typical User Flows

### Find a classroom by course name
1. Select current location → type/speak course name → **Show Route**
2. Follow blue (outdoor) then green (indoor) lines on the map

### Outdoor GPS walk
1. Show cross-building route → GPS auto-starts
2. Use **Outdoor GPS Tracking** panel (Show/Hide to reveal UI)
3. Walk; blue marker and distances update
4. At building entrance → **Start AR** for indoor leg

### Indoor AR navigation
1. Show route to classroom → **Start AR** at entrance
2. Point along corridor → **Align AR Route**
3. Walk; green route stays fixed; instructions update per node

---

## Recent Updates

Summary of major changes during prototype development:

| Area | Update |
|------|--------|
| **PER17 paths** | Removed duplicate back→main graph edge; Mensa routes to **PER17 main entrance** via east path, not under-building line to back entrance; removed orphan `PATH_PER17_APPROACH` visual path |
| **PER17 indoor graph** | Added back entrance node, back corridor, full connectivity for Salle 001 / 010 / 036 |
| **Outdoor GPS** | New `outdoorRouteProgress.js` module; auto-start on route; blue user marker; Outdoor GPS Tracking panel |
| **Timetable** | Excel file loaded at startup; course titles map to rooms; removed hardcoded course aliases from `rooms.js` |
| **Indoor AR progress** | `indoorRouteProgress.js` + Align AR Route + camera-based node progress + turn instructions |
| **Entrances** | Single source of truth in `entrances.js`; anchors/graph/markers derived via `entranceUtils.js` |
| **PER21 layout** | Measured sketch layout (`per21Layout.js`); side-entrance lift/stair cores at front entrance line, ground level |
| **Scene calibration** | Replaced old AR-only panel; per-group scales; localStorage persistence |
| **UI** | Show/Hide all widgets; draggable outdoor GPS and indoor AR panels |
| **Routing** | Full cross-building `campusRoute.js`; PER21↔PER22 indoor bridge |
| **README** | Documented features, flows, limitations, architecture |

---

## Limitations

### General
- **Prototype, not production app** — intended for demos and research, not daily use by all students without further work.
- **Simplified 3D model** — building geometry, corridors, and room positions are approximate (~132 m × 38 m PER21 sketch), not a surveyed BIM model.
- **No automated tests or CI** — routing and timetable parsing are manually verified.
- **English-only voice** (`en-US`) on a bilingual campus; French/German course titles work in text if in the Excel file.

### GPS (outdoor)
- **Hardcoded GPS origin** at PER21 main entrance — must be **calibrated on site** or the blue marker and progress will be wrong.
- **Flat-earth conversion** — no rotation correction vs campus model orientation (+15° building rotation in data).
- **Accuracy ± several metres** — 6 m node threshold hides some error but routes can feel early/late.
- **Desktop browsers** — often no real GPS; testing requires a phone outdoors over **HTTPS**.
- **Indoors / under roofs** — GPS unreliable; use indoor AR after entering the building.
- GPS moves a **map marker only** — the 3D orbit camera is never driven by GPS.

### Timetable
- **Static Excel snapshot** — not live sync with HEIA-FR timetable server.
- **Partial room coverage** — courses scheduled in rooms not modeled (A120, E130, etc.) appear as unmapped.
- **Parser regex** — only understands `(PER N, Room/Salle XXX)` in schedule strings.
- **Ambiguous commands** — one course name mapped to two rooms (e.g. two time slots) picks the first match.

### Indoor map routing
- **PER21 only** has broad room coverage; PER17 (3 rooms) and PER22 (2 POIs) are sparse.
- **PER21 floors 3–4** have corridor/stair nodes but few or no room destinations.
- Indoor routes are drawn **above** building shells for visibility, not on the real floor plan inside the mesh.
- **Stairs in the graph** are straight lines between nodes — not step-by-step geometry.

### AR (WebXR)
- **Manual align required** — no WebXR hit-test, QR markers, or persistent AR anchors in the building.
- **One-shot alignment** — stand at entrance, face corridor, tap Align; any model error accumulates along the path.
- **Green line ≠ real stairs** — route follows graph coordinates, not scanned stair geometry; straight segments through stair nodes will not match each physical step.
- **Outdoor AR route** uses heavy scale compression (`arScale` 0.05) — prototype overlay, not georeferenced to GPS.
- **Indoor AR scale** uses graph metres — only as accurate as the indoor graph + your align quality.
- **Device support** — primarily Android Chrome + ARCore; iOS WebXR support varies.
- **No AR outdoors + indoors handoff automation** — user must manually Start AR and Align at the entrance.

### Navigation logic
- **“Anchors” are map coordinates**, not Apple/Google AR geo-anchors or VPS.
- **PER21↔PER22 outdoor graph** has no direct outdoor link — passage is indoor-only by design.
- **Voice/text parser** can mis-hear or mis-match similar names; no confirmation dialog before routing.
- Errors often use browser **`alert()`** — not polished in-app error UI.

### Code / maintenance
- `src/llm/commandParser.js` and `src/ar/arCalibration.js` are **unused** legacy files.
- Room numbering in code (`*140`, `*130`, `*230`) reflects the current model, not necessarily all official campus signage.

### What would be needed for “production quality”
1. On-site GPS + per-entrance AR calibration (or QR markers at entrances).
2. Accurate room registry aligned with timetable and real signage.
3. Live or easy-to-refresh timetable integration.
4. WebXR hit-test or marker-based anchoring for indoor AR.
5. Expanded PER17/PER22 indoor graphs.
6. Demo mode hiding calibration/debug panels.

---

## Setup

### Prerequisites
- Node.js 16+, npm
- WebGL browser
- **GPS:** HTTPS + location permission + phone recommended
- **AR:** HTTPS + Android Chrome + ARCore

### Install & run

```bash
npm install
npm run dev
```

### Production build

```bash
npm run build
```

Output: `docs/` for GitHub Pages.

---

## Project Structure

```
src/
├── main.js                         # Entry, routing, AR loop, GPS auto-start
├── timetable_en_24-05-2026_23-52-48.xlsx
├── ar/
│   ├── arSession.js                # WebXR session
│   ├── arRouteRenderer.js          # Outdoor AR route (scaled)
│   ├── arRouteAdapter.js           # Anchor-relative coords
│   └── indoorRouteProgress.js      # Indoor AR align + progress
├── data/
│   ├── graph.js                    # Outdoor campus graph
│   ├── pedestrianPaths.js          # Grey visual paths
│   ├── campusRoute.js              # (in navigation/)
│   ├── entrances.js                # Entrance positions (source of truth)
│   ├── outdoorGpsOrigin.js         # GPS origin
│   ├── timetableLoader.js          # Excel parser
│   ├── per21Layout.js              # PER21 measured layout
│   └── per17IndoorGraph.js         # PER17 3-room graph
├── navigation/
│   ├── campusRoute.js
│   ├── outdoorRouteProgress.js     # GPS tracking
│   ├── routeRenderer.js            # Blue outdoor routes
│   └── indoorRouteRenderer.js      # Green indoor routes
└── ui/
    ├── controls.js                 # Route + voice + timetable status
    ├── outdoorTrackingPanel.js
    ├── arRouteProgressPanel.js
    ├── calibrationPanel.js
    └── widgets.js                  # Drag + Show/Hide
```

---

## Architecture Notes

### Coordinate system
- **X / Z:** horizontal plane (metres)
- **Y:** height
- Entrances, graphs, GPS share the same map space

### Position sources by context

| Context | Source | Camera moved? | Threshold |
|---------|--------|---------------|-----------|
| Desktop map | Orbit controls | User drag | — |
| Outdoor progress | GPS → X/Z | No | ~6 m |
| Indoor AR progress | WebXR camera | Phone AR (automatic) | ~1.5 m |

### PER17 routing (outdoor)
- Mensa → east path (`z = -20`) → PER17 main entrance → front lane (`z = -40`)
- Back entrance reachable via front/back lane only when route requires it

### PER21 vertical circulation (visual)
- Lift/stair shafts at **side entrance X positions**, **front facade Z**, starting at **ground level (y = 0)**

---

## Updating the Timetable

1. Export new course programme Excel from HEIA-FR timetable
2. Place in `src/` and update import in `src/data/timetableLoader.js`:
   ```js
   import timetableAssetUrl from '../your-new-file.xlsx?url';
   ```
3. `npm run build`
4. Check Route Navigation panel for mapped / unmapped counts
5. Add room overrides in `TIMETABLE_ROOM_OVERRIDES` in `timetableLoader.js` if needed

---

## Dependencies

- [Three.js](https://threejs.org/) ^0.160
- [Vite](https://vitejs.dev/) ^5
- [SheetJS (xlsx)](https://sheetjs.com/) ^0.18

---

## License

Prototype for academic / campus navigation research at HEIA-FR Pérolles.
