# Level Editor V0

## Launch

- Editor route: `/editor`
- Test map route: `/game/custom-map/test_map_01`
- Map list route: `/game/custom-map`

Run the web app with:

```bash
npm --workspace @idleking/web run dev
```

## Create an Asset

Open `/editor`, use the right panel `Asset Creator`, then add primitive parts:

- `rect`
- `circle`
- `triangle`
- `line`
- `polygon`

Each part exposes position, size, rotation, fill, stroke, stroke width, opacity, and layer order. Presets provide the first reusable shapes for doors, windows, roofs, walls, columns, trees, rocks, grass, flowers, signs, chests, NPCs, and enemies.

`Save Asset` stores the asset in browser local storage for the V0 session. `Export` downloads the asset JSON. Versioned sample assets live in:

```text
packages/game-core/content/assets/custom/*.asset.json
```

## Create a Map

The editor uses the top step bar:

1. Topography: click cells to cycle playable, dead, boundary, and void.
2. Tiles: choose a ground texture and click cells.
3. Environment: place nature assets from the registry.
4. Buildings: place building assets with default collision and interaction.
5. Characters: place NPCs.
6. Objects: place interactive or decorative objects.
7. Enemies: place enemy definitions with basic stats.
8. Collisions: place manual collision boxes.

`Save Map` stores the draft in browser local storage. `Load Map` restores it. `Export JSON` downloads a `.map.json` file.

Versioned sample maps live in:

```text
packages/game-core/content/maps/custom/*.map.json
packages/game-core/content/maps/map.manifest.json
```

## Runtime Loading

The TypeScript map format is defined in:

```text
packages/game-core/level-editor/types.ts
```

The first loader and validation utilities are in:

```text
packages/game-core/level-editor/map-loader.ts
```

The web Pixi scene at `/game/custom-map/test_map_01` loads `TEST_MAP_01`, creates tiles, renders geometric assets, applies blocked cells/manual collisions, draws triggers, and spawns a simple controllable player.

## Known Limits

- Browser save writes to local storage; committed JSON files still need to be added to the repo manually after export.
- The V0 scene uses simple geometric rendering and movement only.
- NPC, enemy, trigger, puzzle, and building interactions are represented in JSON but not fully wired to the existing gameplay systems yet.
- The editor supports placement and export, but not drag-select, undo/redo, multi-select, or direct file-system writes.

## Next Improvements

- Add import from uploaded `.map.json` and `.asset.json` files.
- Add drag placement, resize handles, undo/redo, and entity property editing.
- Connect map NPCs, enemies, triggers, and rewards to existing story/combat systems.
- Add file-backed save commands or a small local authoring API for development mode.
- Add collision visualization toggles and pathing previews.
