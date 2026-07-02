# Level Editor V0

## Access

- From the game UI: open `/game/settings`, then click `Level Editor`.
- Direct editor route: `/editor`.
- Test map route: `/game/custom-map/test_map_01`.
- Map list route: `/game/custom-map`.

Run the web app with:

```bash
npm --workspace @idleking/web run dev
```

## What Improved

- Settings now exposes a visible `Level Editor` entry.
- The editor has clearer steps: Topographie, Textures, Nature, Batiments, PNJ, Objets, Ennemis, Collisions / Triggers.
- The palette is filtered by the active step.
- Brush, eraser, and select tools are available.
- Dead cells are visually distinct and blocked for object placement.
- Placed entities can be selected, edited, and deleted.
- Local save/load messages and object counters are visible.
- The Pixi test scene renders tiles, blocked cells, spawn, objects, buildings, NPCs, enemies, collisions, triggers, and a debug panel.

## Create an Asset

Open `/editor`, use the right panel `Asset Creator`, then add primitive parts:

- `rect`
- `circle`
- `triangle`
- `line`
- `polygon`

The shape list shows every part in layer order. Select a part to edit x, y, width, height, radius, rotation, fill, stroke, stroke width, opacity, and layer. Parts can be duplicated, deleted, moved forward, or moved backward.

`Save Asset` adds the asset to the editor's local library and persists it in browser local storage. `Export` downloads the asset JSON. Versioned sample assets live in:

```text
packages/game-core/content/assets/custom/*.asset.json
```

## Create a Map

Use the top step bar:

1. Topographie: brush dead or playable cells.
2. Textures: paint playable cells with grass, dirt, sand, water, rock, ice, lava, or stone.
3. Nature: place natural assets.
4. Batiments: place buildings with default collision and interaction.
5. PNJ: place NPC markers.
6. Objets: place interactive or decorative objects.
7. Ennemis: place enemies with basic stats.
8. Collisions / Triggers: place manual collision boxes or trigger zones.

Use `Brush` to paint or place, `Eraser` to clear the current layer, and `Select` to inspect placed markers. `Save Map` stores the current draft in browser local storage. `Load Map` restores it. `Export JSON` downloads a `.map.json` file.

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

The loader and validation utilities are in:

```text
packages/game-core/level-editor/map-loader.ts
```

The Pixi preview route `/game/custom-map/test_map_01` loads `TEST_MAP_01`, renders map tiles, overlays dead cells and collisions, draws geometric assets, displays the player spawn, and shows a debug panel with map counts.

## Known Limits

- Browser save writes to local storage; committed JSON files still need to be added to the repo manually after export.
- The V0 scene is a readable preview with simple movement, not full gameplay.
- NPC, enemy, trigger, puzzle, and building interactions are represented in JSON but not fully wired to the existing gameplay systems yet.
- The editor still lacks undo/redo, drag handles, multi-select, and direct file-system writes.

## Next Improvements

- Add import from uploaded `.map.json` and `.asset.json` files.
- Add drag placement, resize handles, undo/redo, and richer entity property forms.
- Connect map NPCs, enemies, triggers, and rewards to existing story/combat systems.
- Add file-backed save commands or a small local authoring API for development mode.
