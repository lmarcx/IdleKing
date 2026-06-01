# 🗃️ DATA MODEL — IdleKing (MVP)

## Status

```txt
LOCKED — dérivé de DESIGN_FREEZE_V1.md
```

Définit **tous les objets métier du MVP** (Prologue · Chapter I — Era Funèbre · Chapter II — Era
Glaciaire). Documentation technique : **modèle métier uniquement** — pas de code complet, pas de SQL,
pas d'API.

> Subordonné à `DESIGN_FREEZE_V1.md`. Les types de champs sont **conceptuels** (id, enum, ref, list,
> map, number, bool), pas une implémentation.

---

## Conventions de persistance (backbone du modèle)

Chaque entité appartient à une **catégorie de persistance** :

```txt
[DEF]     Définition statique — registre data-driven, identique pour tous les joueurs,
          versionnée avec le build. NON sauvegardée dans la save joueur.
[STATE]   État/instance par joueur — muté en jeu, SAUVEGARDÉ dans la save.
[DERIVED] Donnée calculée à la volée depuis [DEF] + [STATE] — NON sauvegardée (recalculée).
[RUN]     État éphémère d'une run de combat/donjon — vit le temps de la run ;
          un sous-ensemble est promu en [STATE] aux checkpoints.
```

Règle d'or : **on ne sauvegarde jamais une [DERIVED]**, et **on ne duplique jamais une [DEF]** dans la
save (on stocke un `ref` = id).

---

# CORE ENTITIES

---

## Player  `[STATE]` (racine de la save)

**Purpose** — Agrégat racine du joueur : progression, stats de base, équipement porté, inventaire,
ressources, monnaies, banque, et références vers les états satellites (World, Story, Buildings).

**Fields**
```txt
id: string
level: number                 // 1..50, hard cap (auto level-up)
xp: number
baseStats: { HP, ATK, DEF, SPEED }   // augmentées au level-up
equipped: {
  main_hand, off_hand, helmet, chest, cape, gloves, belt, boots,
  necklace, artifact,                 // artifact = slot présent mais INERTE (D-11)
  rings: [ref EquipmentInstance × 5]  // 5 slots, 1 ring = 1 skill
}                                       // valeurs = ref EquipmentInstance.id
inventory: list<ref EquipmentInstance>
resourceStock: map<ResourceId, quantity>     // stacks de 999
wallet: map<CurrencyId, amount>               // Écu, Boss Token (MVP)
bank: BankState
worldRef: ref WorldState
storyRef: ref StoryProgress
buildingsRef: map<BuildingId, BuildingState>
specialItems: { kaleidoscopeOwned: bool, fragmentDuTemps: number }
```
> ❌ PAS de `skillPoints`, PAS de `skillLevels` (ring-scaling pur, D-02).

**Relationships** — possède des `EquipmentInstance` (équipées ou en inventaire) ; référence
`WorldState`, `StoryProgress`, `BuildingState[]` ; détient `Resource`/`Currency` par quantité.

**Persistence** — `[STATE]` racine, sauvegardé intégralement.

---

## Equipment (EquipmentInstance)  `[STATE]`

**Purpose** — Instance concrète d'un objet équipable possédé par le joueur (armes, armures, bijoux,
rings). Généré via le flux `base → ilvl → rarity → affixes → stats → upgrade`.

**Fields**
```txt
instanceId: string
baseItemId: ref ItemBase            // catalogue statique (incl. WeaponBase)
slot: enum(main_hand, off_hand, helmet, chest, cape, gloves, belt, boots, ring, necklace, artifact)
rarity: enum(Common, Uncommon, Rare, Epic, Legendary)   // MVP : C→L uniquement
ilvl: number
affixes: list<AffixRoll>            // 0/0/1/1/2 selon rarité (D-05), cap 2
upgradeLevel: number                // cap : +6 (C/U/Rare) / +9 (Epic) / +12 (Legendary) (D-14)
setId: ref EquipmentSet | null
rolledStats: map<StatId, value>     // stats de base de l'item (figées à la génération)
// si slot == ring :
skillId: ref Skill | null           // 1 ring = 1 skill (D-03)
```

**Relationships** — appartient à un `Player` ; référence `ItemBase`, `EquipmentSet` (optionnel),
`Skill` (si ring). Alimente les `[DERIVED]` stats du joueur quand équipé. Compte pour la Résonance si
le slot fait partie des 9 (hors ring/artifact).

**Persistence** — `[STATE]`, chaque instance possédée est sauvegardée (id, base, rarity, ilvl,
affixes, upgrade, setId, skillId).

> Entités support `[DEF]` : `ItemBase` (catalogue), `Affix` (pool + plages, valeurs DEFERRED),
> `EquipmentSet` (4 actifs : Vagabond/Pleureur/Maraudeur/Docteur + 4 placeholder, D-06).

---

## Weapon (WeaponBase)  `[DEF]` + instance via Equipment

**Purpose** — Définit le gameplay de base d'une arme (patterns clic gauche/droit), indépendant des
skills. Une « arme possédée » est une `EquipmentInstance` dont le `baseItemId` est une `WeaponBase`.

**Fields (WeaponBase)**
```txt
id: string
family: enum(Sword, Axe, Dagger, Greatsword, Spear, Bow, Pistol, Staff, Shield, Grimoire)
handedness: enum(one_handed, two_handed)
mainHandPattern / offHandPattern        // armes 1 main
primaryPattern / secondaryPattern       // armes 2 mains (offhand verrouillé)
forgeLevelUnlock: number                // échelle Forge Level 1-10 (D-08)
allowedStats: list<StatId>
```

**Relationships** — base d'une `EquipmentInstance` ; déverrouillée par `Recipe` + `Forge Level` ;
indépendante des `Skill`. Si arme 2 mains, l'`off_hand` reste compté pour la Résonance.

**Persistence** — `WeaponBase` = `[DEF]` (catalogue statique). L'arme équipée = `[STATE]` via Equipment.

---

## Skill (SkillDefinition)  `[DEF]`

**Purpose** — Compétence active. 16 skills MVP `SK-001 → SK-016`. **Portée exclusivement par un ring**
(ring-scaling pur). Le joueur ne « possède » pas de skill : il possède des rings.

**Fields**
```txt
id: string                  // SK-0xx
name: string
category: enum(attack, movement, defense, utility, summon)
element: enum(neutral, fire, water, ice, wind, electricity, ground, light, dark)
targeting: enum(free_aim, ground_target, cone, line, aoe, self_cast, enemy_cast, auto_target)
manaCost: number
cooldownSeconds: number
basePower: number           // DEFERRED (balancing)
description: string
```
> ❌ PAS de niveau de skill, PAS d'XP de skill. La puissance vient du ring (rarity/ilvl/upgrade/affixes).

**Relationships** — référencé par `EquipmentInstance.skillId` (ring). Mapping des rings nommés défini
dans `RINGS_SKILLS_MAP` (`[DEF]`). Contrainte : pas deux rings équipés avec le même `skillId`.

**Persistence** — `[DEF]` (registre statique).

---

## EffectSet  `[DEF]` (définition) + `[STATE]` (déblocage/slotting)

**Purpose** — Effet passif majeur simplifié, débloqué narrativement, équipé dans les Effect Slots
issus de la Résonance. 5 sets MVP : Shadow Veil, Lordflame, Motherstone, Kingfrost, Rainmaker.

**Fields (EffectSetDefinition `[DEF]`)**
```txt
id: string
name: string
theme/element: string
source: ref Boss | ref Character | StoryEventId   // acquisition narrative
availability: enum(Prologue, ChapterI, ChapterII)
tiers: list<EffectTier>      // effets SIMPLIFIÉS (stats/status), valeurs DEFERRED, AUCUN proc (D-01)
```

**Fields (player state `[STATE]`)**
```txt
unlockedEffectSetIds: list<ref EffectSet>
slottedEffects: list<{ effectSetId, tier }>   // taille ≤ Effect Slots (Résonance)
```

**Relationships** — débloqué par un `Boss`/`Character`/événement (Rainmaker ← Seigneur de la Pluie
Déchu) ; le nombre d'effets équipables dépend de la **Résonance** (9 slots, voir Save Model).

**Persistence** — définition `[DEF]` ; déblocages + slotting `[STATE]`.

---

## Quest  `[DEF]` (définition) + `[STATE]` (progression)

**Purpose** — Quête narrative MVP pilotant la progression et les unlocks. Gating = Story + WorldLevel.

**Fields (QuestDefinition `[DEF]`)**
```txt
id: string
chapter: enum(Prologue, ChapterI, ChapterII)
objectives: list<Objective>          // justifiés narrativement
rewards: list<RewardRef>             // XP, ECU, ressources, unlocks
unlockConditions: { storyFlags, minWorldLevel }
narrativeRef: ScriptId
```

**Fields (player state `[STATE]`)**
```txt
activeQuestIds, completedQuestIds: list<ref Quest>
objectiveProgress: map<QuestId, progress>
```

**Relationships** — débloque `Dungeon`/`Building`/`Recipe`/`Boss`/autres quêtes ; consomme/octroie
`Resource`/`Currency`/`Equipment`.

**Persistence** — définition `[DEF]` ; progression `[STATE]`.

---

## Dungeon  `[DEF]`

**Purpose** — Instance jouable de la Story (World Dream). Rejouable à l'infini (récompenses de quête
uniques retirées en replay).

**Fields**
```txt
id: string
era: enum(None/Prologue, EraFunebre, EraGlaciaire)
type: enum(narrative, adventure, boss, hybrid)
location: string
enemyFamilies: list<ref Enemy.family>
elitePool: list<ref Enemy>
bossId: ref Boss | null
rewards: { completion: list<RewardRef>, chest: list<RewardRef> }
unlockConditions: { storyFlags, minWorldLevel }
replayable: bool (true)
```
> Modif MVP verrouillée : **Gouffre Royal → bossId = Seigneur de la Pluie Déchu** (D-16).

**Relationships** — contient des `Enemy` + éventuellement un `Boss` ; octroie loot via `LootTable` ;
débloqué par `Quest`/Story ; sa complétion produit des flags Story (`[STATE]`).

**Persistence** — `[DEF]` ; le joueur stocke `completedDungeonIds` + `firstClearFlags` `[STATE]`.

---

## Enemy (EnemyDefinition)  `[DEF]`

**Purpose** — Ennemi standard/élite, à la fois challenge de combat et **nœud de progression**
(génération de ressources). Les combats sont des instances `[RUN]`.

**Fields**
```txt
id: string
family: string                 // ex. Spectres des Ténèbres, Sirènes…
variant: string
role: enum(melee, ranged, caster, tank, support, assassin, illusionist, control, ...)
isElite: bool
lootTableId: ref LootTable     // drops (ids RESOURCES_DATABASE)
scaling: { driver: WorldLevel } // ne modifie pas patterns/mécaniques
```

**Relationships** — appartient à une `family` ; peuplé dans `Dungeon` ; droppe des `Resource` via
`LootTable`. Instance de combat = `[RUN]` (HP courant, position) non persistée.

**Persistence** — `[DEF]`. Aucune instance d'ennemi n'est sauvegardée.

---

## Boss (BossDefinition)  `[DEF]`

**Purpose** — Rencontre majeure/mid pilotant chapitre, économie et crafting. Roster MVP = **6 bosses**.

**Fields**
```txt
id: string
name: string
type: enum(story, mid)
family: enum(Amalgame, HumanoidDuel, Spectacle, Commandant)
chapter/dungeonId: ref Dungeon
phases: number                 // Allaeva = 2 (D-17) ; Seigneur de la Pluie Déchu = 1–2
rewardProfile: {
  firstClear: list<RewardRef>, // incl. Fragment du Temps (boss de fin de chapitre)
  replay: list<RewardRef>      // réduit, PAS de World XP
}
drops: { namedMaterial: ref Resource, bossToken: true, equipmentRollChance }
recipeUnlocks: list<ref Recipe>
narrativeRef: ScriptId
```

**Relationships** — boss d'un `Dungeon` ; débloque des `Recipe` ; droppe `Resource` (cores) +
`Fragment du Temps` (fin de chapitre) ; sa défaite produit `defeated`/`firstClear` flags `[STATE]`.

**Persistence** — `[DEF]` ; le joueur stocke `defeatedBossIds` + `firstClearFlags` (gates d'unlock).

---

## Character (CharacterDefinition)  `[DEF]` (portée projet)

**Purpose** — Registre **canonique des personnages du projet entier** (MVP + chapitres futurs
documentés). Un personnage peut apparaître comme NPC/Companion/Merchant/Commander/Boss/Story Figure.

**Fields**
```txt
id: string
name: string
roles: list<enum(NPC, Companion, Merchant, Commander, Boss, StoryFigure)>
era/timeline: string
appearances: list<{ chapter, dungeonId?, role }>
```

**Relationships** — peut être lié à un `Boss` (ex. Allaeva, Archimage) ou source d'`EffectSet` ;
référencé par `Dungeon`/`Quest`/`Script`.

**Persistence** — `[DEF]` (portée projet). Flags relationnels MVP (ex. *Tobo recruté au Kingdom*) =
`[STATE]` côté joueur si applicable.

---

## Resource (ResourceDefinition)  `[DEF]` + quantités `[STATE]`

**Purpose** — Matière première stackable (craft, upgrade, bâtiments, kitchen, market). **Rareté fixe,
pas de quality roll.**

**Fields (ResourceDefinition `[DEF]`)**
```txt
id: string                     // snake_case canonique (ex. iron_ore, sapphire)
name: string
type: enum(wood, ore, gem, meat, vegetable, monster, boss)
rarity: enum(Common..Legendary) // fixe
value: number                  // resource_value (placeholder DEFERRED)
sources: list<string>          // Mine/Farm/mobs/boss
uses: list<string>             // recette OU market_sell (≥ 1 garanti)
maxStack: 999
tradable: true
```

**Fields (joueur `[STATE]`)** — `Player.resourceStock: map<ResourceId, quantity>` + `Bank`.

**Relationships** — consommée par `Recipe`/`Building`/`Kitchen` ; droppée par `Enemy`/`Boss` via
`LootTable` ; produite par Mine/Farm. **N'est pas** une Currency, **n'est pas** un Special Item.

**Persistence** — définition `[DEF]` ; quantités possédées `[STATE]`.

> Special Items (Kaléidoscope, Fragment du Temps) ne sont **pas** des Resources (voir entités dédiées).

---

## Recipe (RecipeDefinition)  `[DEF]` + déblocage `[STATE]`

**Purpose** — Plan de fabrication Forge/Kitchen/catalyseur. Produit un item de base ; la **rareté est
un roll pondéré par le niveau de Forge** (D-09).

**Fields**
```txt
id: string
category: enum(forge_weapon, forge_armor, forge_accessory, kitchen_food, story_catalyst)
outputBaseId: ref ItemBase
ingredients: map<ResourceId, quantity>
unlockConditions: { requiredForgeLevel?, requiredBossId?, requiredChapter?, requiredQuestId? }
rarityRoll: weightedByForgeLevel       // D-09 (pas de rareté fixe ni de roll pur)
```

**Relationships** — consomme des `Resource` ; produit une `EquipmentInstance` (ou consommable
Kitchen) ; déverrouillée par `Forge Level`/`Boss`/`Quest`/`Chapter`.

**Persistence** — définition `[DEF]` ; `unlockedRecipeIds` du joueur `[STATE]`.

---

## Building (BuildingDefinition)  `[DEF]` + état `[STATE]`

**Purpose** — Système de gameplay du Kingdom (porte d'accès, pas production passive). MVP : Forge,
Mine, Farm, Kitchen, Temple, Market, Forum, **Time Gate**, Bank (+ Cornucopia dev only).

**Fields (BuildingDefinition `[DEF]`)**
```txt
id: string
role: string
unlockConditions: { storyFlags, minWorldLevel }
buildCost: list<ResourceCost>
maxLevel: number
actions: list<enum(open_modal, start_minigame, craft, convert, shop, storage, world_modes)>
```

**Fields (BuildingState `[STATE]`)**
```txt
status: enum(locked, unlocked, built, upgradeable, maxed)
level: number                 // contrainte : level ≤ WorldLevel
```

**Relationships** — débloque/héberge des systèmes (Forge→craft, Mine/Farm→Resource, Temple→WXP,
Forum→World level-up, Market→Currency exchange, Bank→storage, Time Gate→Ères). Consomme `Resource`/
`Currency` pour build/upgrade.

**Persistence** — définition `[DEF]` ; status + level par bâtiment `[STATE]`.

---

## TimeGate  `[DEF]` (bâtiment) + état `[STATE]`

**Purpose** — Bâtiment (ex-« World Gate », D-15) : point d'accès aux **Ères**/modes et lieu d'usage du
**Kaléidoscope** + **Fragments du Temps** pour débloquer l'Ère suivante.

**Fields**
```txt
// hérite de Building (BuildingDefinition + BuildingState)
accessibleModes: list<enum(Story, ... [autres modes = HORS MVP])>
// état joueur :
unlockedEras: list<enum(EraFunebre, EraGlaciaire, [EraDeluge = teaser, hors MVP jouable])>
```

**Relationships** — consomme `Fragment du Temps` (produit par les `Boss` de fin de chapitre) ; requiert
le `Kaléidoscope` ; pilote la transition d'Ère de la `StoryProgress`.

**Persistence** — `[DEF]` bâtiment ; `unlockedEras` + état du bâtiment `[STATE]`.

> ⚠️ Time Gate = **bâtiment**, jamais un item/skill/artifact.

---

## Kaleidoscope  `[STATE]` (Special World Item)

**Purpose** — **Special World Item** (≠ Equipment/Artifact/Skill/Effect Set, D-12). Obtenu **une seule
fois** via la story ; débloque les pleins pouvoirs à la **Time Gate**. Fonctionne avec les **Fragments
du Temps** (clés d'Ère).

**Fields**
```txt
// porté par Player.specialItems :
kaleidoscopeOwned: bool         // one-time
fragmentDuTemps: number         // consommable, looté sur boss de fin de chapitre
```

**Relationships** — utilisé à la `TimeGate` ; les `Fragment du Temps` proviennent des `Boss`
(`rewardProfile.firstClear`). Ne suit **aucune** règle de génération d'équipement.

**Persistence** — `[STATE]` (flag possédé + compteur de fragments).

> `Fragment du Temps` = Special Item consommable (nom canonique unique, D-13) — modélisé comme compteur
> dans `Player.specialItems`, pas comme `Resource`.

---

# ENTITY RELATIONSHIP MAP

```txt
                              ┌──────────────┐
                              │   Player     │  [STATE] racine
                              └──────┬───────┘
        equip / inventory ┌─────────┼───────────────┬───────────────┬──────────────┐
                          ▼         ▼               ▼               ▼              ▼
                 EquipmentInstance  resourceStock   wallet        BuildingState  WorldState/StoryProgress
                   │   │   │            │ (qty)       │ (amount)        │                │
        baseItemId │   │   │ skillId    │             │                │                │
                   ▼   │   ▼            ▼             ▼                ▼                ▼
              ItemBase │  Skill[DEF]  Resource[DEF]  Currency[DEF]   Building[DEF]   Quest[DEF]/Dungeon[DEF]
              /Weapon  │  (via ring)   ▲   ▲           (Écu,Token)    (Forge,Mine,    │        │
              Base[DEF]│  RINGS_SKILLS │   │                          Farm,Temple,    │        │
                   │   │  _MAP[DEF]    │   │ consumes/produces        Market,Forum,   │ unlocks│ contains
              setId│   │               │   │                          Bank,TimeGate)  ▼        ▼
                   ▼   │           Recipe[DEF]◄── unlock ── Boss[DEF] ──────────► Enemy[DEF]
            EquipmentSet[DEF]          │                     │   │                  (LootTable[DEF])
            (4 actifs)                 │ produces            │   │ drops
                                       ▼                     │   ├─► Resource (cores)
                              EquipmentInstance              │   └─► Fragment du Temps (fin chapitre)
                                                             │
   Resonance (9 slots, hors ring/artifact) ──► Effect Slots │
                          │                                 ▼
                          ▼                        TimeGate[Building] ──► unlock Era
                  EffectSet[DEF] (5) ◄── source ── Boss/Character/Event
                          ▲                                 ▲
                          └──── slotted (Player[STATE]) ────┘   Kaleidoscope + Fragment du Temps
```

**Lectures clés**
- `Player` possède des `EquipmentInstance` ; chaque ring référence un `Skill` (1:1, pas de doublon).
- `Boss` est le hub d'unlock : il débloque des `Recipe`, droppe des `Resource` (cores) + des
  `Fragment du Temps`, et est source d'`EffectSet`.
- La **Résonance** est calculée depuis 9 `EquipmentInstance` (slots) → détermine le nombre d'Effect
  Slots → limite les `EffectSet` slottés.
- `Recipe` relie `Resource` (in) → `EquipmentInstance` (out), gatée par `Forge Level`/`Boss`.
- `TimeGate` (bâtiment) consomme `Fragment du Temps` (+ `Kaléidoscope`) → débloque l'Ère suivante.

---

# SAVE GAME MODEL

## À SAUVEGARDER  `[STATE]`

```txt
PLAYER
- id, level, xp, baseStats {HP,ATK,DEF,SPEED}
- equipped (refs vers EquipmentInstance, incl. 5 rings ; artifact slot inerte)
- inventory (liste d'EquipmentInstance complètes : base, rarity, ilvl, affixes, upgradeLevel, setId, skillId)
- resourceStock : map<ResourceId, qty>
- wallet : map<CurrencyId, amount>   // Écu, Boss Token
- bank : contenu (ressources/consommables, pas d'équipement/currency)
- specialItems : { kaleidoscopeOwned, fragmentDuTemps }

WORLD
- worldLevel, wxp, worldEnergy {current,max,lastRegenAt}, worldHp {current,max,lastRegenAt}
- unlockedBuildingIds, unlockedRecipeIds, unlockedModeIds(MVP: Story), unlockedEras

STORY / QUESTS / BOSSES
- activeQuestIds, completedQuestIds, objectiveProgress
- unlockedChapterIds, unlockedDungeonIds, completedDungeonIds, firstClearFlags
- defeatedBossIds + bossFirstClearFlags

BUILDINGS
- map<BuildingId, { status, level }>   // dont Time Gate

RESONANCE / EFFECT SETS
- unlockedEffectSetIds
- slottedEffects : list<{ effectSetId, tier }>   // ≤ Effect Slots

CHECKPOINT (run en cours, optionnel)  [RUN→STATE]
- dungeonId, checkpointIndex, rewards sécurisés (loot/ressources/ECU/XP accumulés)
```

## À NE PAS SAUVEGARDER

```txt
[DEF]      Tous les registres (ItemBase, WeaponBase, Skill, EffectSetDefinition, Quest/Dungeon/
           Enemy/Boss/Character/Resource/Recipe/Building definitions, LootTable, RINGS_SKILLS_MAP).
           → versionnés avec le build, jamais dans la save.
[DERIVED]  Stats agrégées (HP/Mana/Stamina max, POWER, crit, mitigation, DPS estimé),
           Effect Slots (= floor(resonance/9)), valeurs d'effet calculées. → recalculés au chargement.
[RUN]      Instances d'ennemis, positions, timers, projectiles, HP/Mana/Stamina COURANTS pendant une
           run, RNG transitoire. → reconstruits, sauf rewards promus au checkpoint.
```

**Principe** : la save = `[STATE]` minimal + `refs` vers `[DEF]`. Au chargement, on rehydrate les
`[DERIVED]` depuis `[STATE] × [DEF]`. La RNG de génération doit être **seedable** pour reproductibilité.

---

# MVP DATA BOUNDARIES

## DANS le MVP

```txt
- Player : level (≤50), baseStats, XP ; PAS de skillPoints/skillLevels
- EquipmentInstance : raretés Common→Legendary ; affixes 0/0/1/1/2 ; upgrade +6/+9/+12 ; artifact slot INERTE
- WeaponBase : 10 types, déblocage par Forge Level 1-10
- Skill : 16 (SK-001..016), ring-scaling pur, 5 rings, pas de doublon
- EquipmentSet : 4 ACTIFS (Vagabond, Pleureur, Maraudeur, Docteur)
- EffectSet : 5 SIMPLIFIÉS (Shadow Veil, Lordflame, Motherstone, Kingfrost, Rainmaker) + Resonance (9 slots)
- Quest/Dungeon/Enemy/Boss : contenu Prologue + Ch I + Ch II ; roster 6 bosses
- Character : registre projet (apparitions MVP actives)
- Resource : registre RESOURCES_DATABASE (réconcilié) ; valeurs placeholder
- Recipe : Forge/Kitchen/catalyseur ; craft = roll pondéré par Forge
- Building : Forge, Mine, Farm, Kitchen, Temple, Market, Forum, Time Gate, Bank (+Cornucopia dev)
- Currency : Écu, Boss Token
- Special Items : Kaléidoscope (one-time) + Fragment du Temps (compteur)
- World : WorldLevel (≤50), WXP, World Energy
```

## HORS MVP (ne pas modéliser comme actif)

```txt
- Raretés Mythic / Divine / Ancient
- Skill levels / skill points / passives / ultimates / Power Stones
- Forge : Evolve / Enchant / Fusion
- Artifact actif (modificateur d'arme) — slot reste inerte
- Smart loot · Named / Unique / Corrupted items
- 4 sets placeholder (Flageleur, Gardien des Cendres, Voltigeur, Reine Blanche) : non équilibrés
- Bonus de set 2/4 pièces (DEFERRED)
- Effect Sets : paliers spectaculaires IV-V (procs) ; Effect Sets futurs (Thunderknight…)
- Modes : Duel, Boss Rush, Abyss, Sky, Expeditions, Land/Spatial Conquest, AvA
- Currencies avancées : Duel/Abyss/Sky/Guild/War/Slayer Token, premium
- World HP comme système central · PvP / couche d'équilibrage PvP
- Seasons / Ascension / Prestige · Market joueur / auction · Online / Guild
- Contenu Chapter III+ (incl. scripts ch03 déjà présents en code)
```

---

*DATA_MODEL — subordonné à DESIGN_FREEZE_V1.md. Périmètre : Prologue · Chapter I — Era Funèbre ·
Chapter II — Era Glaciaire.*
