# 3D Campus Navigation — Pérolles

This is my prototype for navigating around the Pérolles campus with a 3D map, outdoor GPS tracking, indoor routing, voice commands, timetable search, and WebXR AR.

The idea is simple: the user chooses where they are and where they want to go, for example a classroom or a course. The app calculates a route on the campus map. Outside, it can follow the user with GPS. Inside, the route can be shown in AR after the user aligns it at an entrance.

**Live deployment:**  
https://andrei-ctrl.github.io/3d-Campus-nav/

**YouTube videos:**  
- Video 1: PASTE_YOUTUBE_LINK_1_HERE  
- Video 2: PASTE_YOUTUBE_LINK_2_HERE  
- Video 3: PASTE_YOUTUBE_LINK_3_HERE  

---

## What the project does

The project combines several parts:

- a 3D model of the Pérolles campus
- outdoor pathfinding between buildings
- indoor pathfinding inside buildings
- GPS progress tracking outside
- AR route progress inside buildings
- voice and text commands
- timetable-based search for courses
- room labels and route visualization

The main buildings used in the project are:

- PER21
- PER22
- PER17
- Mensa

The app is built with **Three.js**, **Vite**, **WebXR**, browser **Geolocation API**, and **SheetJS/xlsx** for the timetable file.

---

## Main navigation idea

There are two different navigation modes.

### Outside

Outside, the app uses GPS.

The phone gives latitude and longitude. The app converts this into local campus coordinates and compares the user position with the next point of the outdoor route.

So outside the logic is:


GPS position that converts to campus X/Z coordinates, compares with next outdoor route node and updates progress.


### Inside

Inside, GPS is not reliable, so the app uses WebXR camera movement.

The user stands at a known entrance, points the phone in the corridor direction, and taps **Align AR Route**. Then the green route is fixed in the AR world. When the user walks in reality, WebXR updates the camera position automatically.

So inside the logic is:


WebXR camera position that compares with next indoor route node, updates instruction, advances along the route.


The camera is not moved manually. The phone movement moves it through WebXR.

---

## Routing

The project uses graph-based routing.

Each building, entrance, corridor, classroom, stair, or important point can be a node. The connections between them are graph edges. The app uses Dijkstra to find the shortest path.

The route planner can combine:

- indoor graph
- outdoor graph
- indoor bridge between PER21 and PER22
- entrance nodes
- classroom nodes

---

## Voice and text commands

The user can either select a destination manually, type a command, or use the voice button.

Examples:

```text
Take me to G230
Go to Auditorium Joseph Deiss
Navigate to PER21
I am at Mensa, go to PER17
```

The command parser is rule-based. It normalizes the text and tries to match rooms, buildings, course names, and aliases.

Even though there is an `llm` folder in the project, the current command parsing is not using a large language model because the project turned to be more time consuming than I expected. However in the future I would suggest adding LLM agent to parse newly uploaded files with timetables, map them with existing nodes and graphs, and for better voice recognition commands. 

---

## Timetable search

The app loads an Excel timetable file and extracts course names, course codes, and room locations.

This means the user can search by course name, not only by room number.

For example, if a course is scheduled in `PER 21, Room G230`, the app can map this course to the destination `PER21_G230`.

Some courses are still unmapped because:

- the room is not modeled yet
- the timetable row has no clear room
- the parser does not understand the schedule format
- the room exists in real life but not in the 3D graph yet

---

## AR mode

The AR part is made with WebXR.

The main idea is that the route is placed in the real world, not attached to the screen. When the user walks, the camera pose changes automatically.

For indoor AR, the user must:

1. calculate a route first
2. start AR
3. stand at the selected entrance
4. point the phone along the corridor
5. tap **Align AR Route**
6. follow the green route

---

## Outdoor GPS progress

Outdoor progress starts when the route has an outdoor part.

The app watches the GPS position with:

```js
navigator.geolocation.watchPosition(...)
```

Then it displays (only in debug mode):

- distance to the next route point
- remaining distance
- GPS accuracy
- current progress state
- estimated user marker

The GPS threshold is intentionally larger than indoor AR because GPS can easily be several meters wrong.

---

## Indoor AR progress

Indoor progress is based on the WebXR camera position.

The route is made from green cylinder segments instead of only a normal Three.js line, because line width is not reliable on mobile browsers.

The progress system checks the distance between the camera and the next route node. When the user is close enough, it advances to the next instruction.

Possible instructions are simple:

- continue along the green route
- turn left
- turn right
- take stairs or elevator
- you have arrived

Align position is available also in debug mode from the menu on top. 
---

## What is implemented

### Campus and buildings

- PER21, PER22, PER17, and Mensa are present
- roads and pedestrian paths are shown
- entrances are represented as navigation anchors
- labels can be shown or hidden
- widgets can be dragged and minimized

### Navigation

- outdoor graph routing
- indoor graph routing
- cross-building routing
- PER21 to PER22 indoor bridge logic
- blue outdoor route
- green indoor route

### GPS

- GPS tracking outside
- blue user marker
- distance and accuracy display
- automatic handoff message when the user reaches an entrance

### AR

- WebXR AR session
- indoor route alignment
- camera-based indoor progress
- AR instruction panel

### Timetable and commands

- Excel timetable loading
- course-to-room mapping
- text commands
- voice commands with the Web Speech API

---

## Limitations

This project is still a prototype, so there are important limitations.

The 3D campus model is approximate. It is not a scanned model with lidar and it is not perfectly aligned with the real building.

GPS outside is also approximate. It can be wrong by several meters, especially near buildings or under roofs.

Indoor AR needs manual alignment. The user has to stand at the entrance and point the phone in the correct direction. If the alignment is bad, the route will also be shifted.


Also, iPhone browser AR support is limited. The best target is Android Chrome with ARCore which I was using for demostration. 

---

## Setup

Install dependencies:

```bash
npm install
```

Run locally:

```bash
npm run dev
```

Build for deployment:

```bash
npm run build
```

The build output is in:

```text
docs/
```

This is used for GitHub Pages.

---

## Project structure

```text
src/
├── main.js
├── ar/
│   ├── arSession.js
│   ├── arRouteRenderer.js
│   ├── arRouteAdapter.js
│   └── indoorRouteProgress.js
├── data/
│   ├── graph.js
│   ├── pedestrianPaths.js
│   ├── entrances.js
│   ├── outdoorGpsOrigin.js
│   ├── timetableLoader.js
│   ├── per21Layout.js
│   ├── per21IndoorGraph.js
│   ├── per22IndoorGraph.js
│   └── per17IndoorGraph.js
├── navigation/
│   ├── campusRoute.js
│   ├── outdoorRouteProgress.js
│   ├── routeRenderer.js
│   └── indoorRouteRenderer.js
├── scene/
│   ├── createIndoorMarkers.js
│   ├── createPer21IndoorStructure.js
│   ├── createPer22IndoorStructure.js
│   └── createPer17IndoorStructure.js
└── ui/
    ├── controls.js
    ├── outdoorTrackingPanel.js
    ├── arRouteProgressPanel.js
    ├── calibrationPanel.js
    └── widgets.js
```

---

## Important technical notes

The project coordinate system is:

```text
X / Z = horizontal campus plane
Y = height
```

Position source depends on the context:

| Context | Position source | What moves |
|---|---|---|
| Desktop map | Orbit controls | User moves the view manually |
| Outdoor progress | GPS | User marker moves |
| Indoor AR | WebXR camera pose | Camera moves from real phone movement |

The route itself should stay fixed in the world.

---

## Updating the timetable

To update the timetable:

1. export a new Excel file from the timetable system. I downloaded it from here https://www.unifr.ch/timetable/en/ 
2. put it inside `src/`
3. update the import in `src/data/timetableLoader.js`
4. run the build again
5. check how many courses are mapped and unmapped

Example:

```js
import timetableAssetUrl from '.../src/timetable_en_24-05-2026_23-52-48.xlsx';
```

---

## Dependencies

- Three.js
- Vite
- SheetJS / xlsx
- WebXR
- browser Geolocation API
- Web Speech API

---

## What could be improved later

The most important improvements would be:

1. better measured indoor layout
2. QR code or marker-based AR alignment
3. better GPS origin and map rotation correction
4. live timetable update
5. LLM agent

---

## License / context

This project was made as an academic prototype for Foundation of Spatial Computing and Applications in AR/VR at the University of Fribourg.
