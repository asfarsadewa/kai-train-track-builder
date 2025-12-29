# Kai's Train Track Builder

A 2.5D isometric train track builder game built with React, TypeScript, and Canvas 2D.

Build your own railway, paint the terrain, and watch your train chug along the tracks!

## Features

### Track Building
- **8 track types**: Straight, curves, switches, crossings, stations, signals, bridges, and tunnels
- **Auto-connect**: Tracks automatically rotate to connect with neighbors
- **Elevation support**: Build tracks on raised terrain with smooth visual slopes

### Terrain Editing
- **Raise/Lower terrain**: Create hills and valleys
- **8 terrain types**: Grass, water, sand, rock, forest, farm, village, and flowers
- **Visual decorations**: Each terrain type has unique visuals (trees, houses, crops, etc.)

### Train Simulation
- **Smooth movement**: Train follows tracks with bezier curve interpolation
- **Path finding**: Automatically finds the best route through your track network
- **Interactive elements**: Toggle switches and signals to control the train's path

### Polish
- **Sound effects**: UI clicks, track placement, and train chug sounds
- **Background music**: Original soundtrack plays while the train runs
- **Save/Load**: Save your layouts to browser storage
- **Undo/Redo**: Full history support (Ctrl+Z / Ctrl+Y)
- **Camera controls**: Pan and zoom to navigate your world

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Controls

### Mouse
| Action | Control |
|--------|---------|
| Use tool | Left click |
| Pan camera | Right click drag / Middle mouse drag |
| Zoom | Scroll wheel |

### Keyboard
| Action | Key |
|--------|-----|
| Pan camera | Arrow keys |
| Zoom in/out | + / - |
| Reset camera | 0 |
| Rotate track | R |
| Play/Pause train | Space |
| Undo | Ctrl+Z |
| Redo | Ctrl+Y or Ctrl+Shift+Z |
| Help | ? |

## Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Canvas 2D** - Rendering
- **Web Audio API** - Sound effects

## Project Structure

```
src/
├── components/     # React components (GameCanvas, Toolbar, Palettes)
├── context/        # Game state management (GameContext)
├── rendering/      # Canvas rendering (isometric, terrain, tracks, train)
├── logic/          # Game logic (connections, pathfinding, movement)
├── audio/          # Sound manager
├── types/          # TypeScript interfaces
├── constants/      # Grid sizes, colors, track definitions
└── utils/          # Utilities
```

## Screenshots

*Coming soon*

## License

MIT
