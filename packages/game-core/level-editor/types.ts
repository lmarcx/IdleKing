export type GeometryShape = "rect" | "circle" | "triangle" | "line" | "polygon";

export type AssetCategory =
  | "textures"
  | "nature"
  | "buildings"
  | "characters"
  | "enemies"
  | "objects"
  | "puzzle"
  | "collisions"
  | "triggers";

export type PrimitivePart = Readonly<{
  id: string;
  shape: GeometryShape;
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  points?: readonly Readonly<{ x: number; y: number }>[];
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
  rotation: number;
  layer: number;
}>;

export type CollisionShape = Readonly<{
  type: "box" | "circle" | "none";
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
}>;

export type InteractionKind = "open_menu" | "enter_map" | "talk" | "inspect" | "trigger_event" | "dialogue" | "shop" | "quest" | "heal";

export type AssetInteraction = Readonly<{
  type: InteractionKind;
  target?: string;
  label?: string;
}>;

// System-routing interaction: which concrete game system/screen an entity opens, as opposed to
// AssetInteraction's narrative/UX "flavor". Data-driven so a Pixi stage never needs bespoke code
// per building — it just resolves proximity + reads interactionType/interactionTargetId.
export type InteractionType =
  | "open_building_modal"
  | "open_time_gate"
  | "open_market"
  | "open_bank"
  | "open_forge"
  | "start_dialogue"
  | "start_level"
  | "custom_trigger";

export type InteractionDefinition = Readonly<{
  interactionType: InteractionType;
  interactionTargetId: string;
  promptLabel: string;
  radius: number;
}>;

export type GeometricAsset = Readonly<{
  id: string;
  name: string;
  category: AssetCategory;
  style: "minimal-geometric";
  parts: readonly PrimitivePart[];
  defaultCollision: CollisionShape | null;
  defaultInteraction: AssetInteraction | null;
  tags: readonly string[];
}>;

export type GroundTextureId = "grass" | "dirt" | "sand" | "water" | "rock" | "ice" | "lava" | "stone" | "void";

export type GroundTexture = Readonly<{
  id: GroundTextureId;
  name: string;
  fill: string;
  stroke: string;
  walkable: boolean;
  movementModifier?: number;
  damage?: number;
}>;

export type TopographyCellState = "playable" | "dead" | "boundary" | "void";

export type TopographyCell = Readonly<{
  x: number;
  y: number;
  state: TopographyCellState;
}>;

export type MapTile = Readonly<{
  x: number;
  y: number;
  textureId: GroundTextureId;
  walkable: boolean;
  movementModifier?: number;
  damage?: number;
}>;

export type MapObject = Readonly<{
  id: string;
  assetId: string;
  kind: "nature" | "object" | "puzzle" | "decoration";
  x: number;
  y: number;
  rotation: number;
  interaction?: AssetInteraction | null;
  systemInteraction?: InteractionDefinition | null;
}>;

export type BuildingFunction =
  | "house"
  | "market"
  | "bank"
  | "temple"
  | "forge"
  | "quest_location"
  | "dungeon_entrance";

export type MapBuilding = Readonly<{
  id: string;
  assetId: string;
  function: BuildingFunction;
  x: number;
  y: number;
  collision: CollisionShape | null;
  interaction?: AssetInteraction | null;
  systemInteraction?: InteractionDefinition | null;
}>;

export type NpcBehavior = "idle" | "patrol" | "merchant" | "quest_giver" | "dialogue_only";
export type NpcInteractionKind = "dialogue" | "shop" | "quest" | "heal" | "inspect";

export type MapNpc = Readonly<{
  id: string;
  assetId: string;
  name: string;
  type: string;
  behavior: NpcBehavior;
  interaction: NpcInteractionKind;
  systemInteraction?: InteractionDefinition | null;
  x: number;
  y: number;
}>;

export type EnemyBehavior = "idle" | "patrol" | "chase" | "guard_area" | "ranged" | "boss";

export type MapEnemy = Readonly<{
  id: string;
  assetId: string;
  enemyId: string;
  name: string;
  stats: Readonly<{
    hp: number;
    attack: number;
    defense: number;
    speed: number;
  }>;
  behavior: EnemyBehavior;
  aggroRadius: number;
  loot?: readonly string[];
  deathEvent?: string;
  x: number;
  y: number;
}>;

export type MapCollision = Readonly<{
  id: string;
  type: "box";
  x: number;
  y: number;
  width: number;
  height: number;
}>;

export type MapTrigger = Readonly<{
  id: string;
  type: "enter_map" | "inspect" | "event" | "dialogue";
  x: number;
  y: number;
  width: number;
  height: number;
  target?: string;
}>;

export type MapPuzzleLink = Readonly<{
  id: string;
  sourceId: string;
  action: "opens" | "unlocks" | "activates";
  targetId: string;
  condition?: string;
}>;

export type MapSpawn = Readonly<{
  id: string;
  x: number;
  y: number;
}>;

export type PlayableMap = Readonly<{
  id: string;
  name: string;
  version: number;
  world: string;
  mode: "story" | "debug" | "sandbox";
  chapter: string;
  grid: Readonly<{
    width: number;
    height: number;
    cellSize: number;
  }>;
  topography: Readonly<{
    cells: readonly TopographyCell[];
  }>;
  tiles: readonly MapTile[];
  objects: readonly MapObject[];
  buildings: readonly MapBuilding[];
  npcs: readonly MapNpc[];
  enemies: readonly MapEnemy[];
  collisions: readonly MapCollision[];
  triggers: readonly MapTrigger[];
  puzzles: readonly MapPuzzleLink[];
  spawns: readonly MapSpawn[];
  metadata: Readonly<{
    createdWith: "AWorldDreamtLevelEditor";
    style: "minimal-geometric";
  }>;
}>;

export type MapManifestEntry = Readonly<{
  id: string;
  name: string;
  path: string;
  world: string;
  mode: string;
  chapter: string;
  entry: boolean;
}>;

export type MapManifest = Readonly<{
  maps: readonly MapManifestEntry[];
}>;

export type AssetRegistry = Readonly<{
  assets: readonly GeometricAsset[];
  textures: readonly GroundTexture[];
}>;
