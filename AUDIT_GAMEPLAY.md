# Audit gameplay, assets et level design — IdleKing

Date : 2026-10-06 · Branche : `dev` (a46af89)
Périmètre : boucle de jeu réelle (ce que le joueur vit, hors Cornucopia/DEV_MODE), comparée au scope MVP verrouillé (`DESIGN_FREEZE_V1`, `MVP_ROADMAP`, `LEVELDESIGN`, `DUNGEON_DATABASE`, `ENEMIES_DATABASE_V2`).
Complète [`AUDIT.md`](AUDIT.md) (mai 2026, architecture) ; ici on ne regarde pas le code pour lui-même mais **ce qu'il produit en jeu**.

> **Suivi (2026-10-07)** : les P0 #1–#6, les Sprints A/B/C, les assets et le nettoyage legacy sont implémentés sur `dev` (commits `b06a68f` → `f6ae0a6`). Ce document décrit l'état **avant** ces corrections ; les liens de code peuvent pointer vers des fichiers supprimés depuis.

---

## Verdict

Les **systèmes** sont là et testés (combat-core, rings → 16 skills, forge, résonance, effect sets, time gate, registres validés au boot, éditeur de maps, IA ennemie pure). Le **contenu** et le **branchement** ne le sont pas : en dehors du Prologue, le joueur traverse 7 donjons identiques, sans boss, sans ennemi spécifique, sans loot canon, et la chaîne de déblocage du Royaume est cassée hors DEV_MODE.

En clair, le projet est à **M1–M2 côté expérience joueur** alors que le code core est proche de M6. Le test `mvpPlaythroughPhase11` passe parce qu'il appelle `completeDungeon()` directement et force `worldLevel: 5` ([content/index.ts:514](packages/game-core/content/index.ts:510)). Il ne prouve donc pas que le jeu est jouable de bout en bout.

---

## P0 — Bloquants pour un vrai playthrough

| # | Problème | Où | Effet joueur |
|---|---|---|---|
| 1 | **Aucun bâtiment ne se débloque hors DEV_MODE.** Forum/Temple/Farm/Mine/Kitchen/Forge démarrent `locked` ; `applyUnlocks` n'est appelé que par `completeChapterAction` (legacy, jamais appelé par le web) et par la Cornucopia. `completeDungeon` produit des flags mais ne débloque aucun bâtiment. | [game/state.ts:111](packages/game-core/game/state.ts:112), [game/actions.ts:30](packages/game-core/game/actions.ts:30) | Après le Prologue : pas de Forge, pas de Mine/Farm, pas de Temple, pas de Forum. |
| 2 | **Le gate du Chapitre II (WorldLevel 5) est inatteignable.** Il faut 5 309 WXP. Le WXP ne s'obtient que via le Temple (bloqué, cf. #1) à partir de `XP_GLOBAL`, dont la seule source canonique est le duel Épouvantail (20/run). La production passive du Temple (`templeProductionPerMin`) n'est branchée nulle part. | [progressionMvp.ts:110](packages/game-core/story/progressionMvp.ts:115), [building/temple.ts:78](packages/game-core/building/temple.ts:78) | Soft-lock à la fin du Ch I, même en DEV_MODE (~265 duels). |
| 3 | **Les donjons ne sont pas rejouables.** Si `completedDungeonIds` contient le donjon, l'explorer affiche directement le panneau « déjà validé » avec `STORY_LEVEL_PLACEHOLDER_REWARDS` (XP_GLOBAL/STONE/WOOD legacy) et bloque l'input. Les `replayRewards` du registre ne sont jamais versés. | [story-level-explorer.tsx:298](apps/web/components/game/story-exploration/story-level-explorer.tsx:273) | Pas de farm. Or toute l'économie (craft > loot) repose sur le replay (Freeze §12). |
| 4 | **Les 6 boss de donjon (hors Prologue) n'existent pas en jeu.** `createInitialEnemies` ne crée un boss que pour `prologue_wastelands` ; les autres spawnent 7 « grunts ». Sans script de niveau, `hasBossBeat = false`, donc `bossDefeated = true` : le donjon se valide en touchant 3 POI, sans combattre. | [story-level-combat.ts:128](apps/web/components/game/story-exploration/story-level-combat.ts:131), [story-level-explorer.tsx:323](apps/web/components/game/story-exploration/story-level-explorer.tsx:293) | Ombre du Dragon, Allaeva, etc. se « battent » en marchant jusqu'à 3 points. Kaléidoscope et Fragments du Temps tombent sans combat. |
| 5 | **Le loot du jeu réel n'est pas le loot canon.** Le runtime web roule sa propre table (`MEAT/WOOD/STONE` legacy) pour tous les ennemis, boss compris. `ENEMY_LOOT_TABLES`, `rollEnemyMaterialDrops`, `rollBossEquipmentRarity` et `rollDungeonChestRewards` (game-core) ne sont appelés par aucun écran. | [story-level-combat.ts:67](apps/web/components/game/story-exploration/story-level-combat.ts:67), [loot/mvp.ts:91](packages/game-core/loot/mvp.ts:91) | Aucun drop de `iron_ore`, `shadow_residue`, ni aucun drop d'équipement. Les recettes de Forge restent inalimentées. |
| 6 | **Un nouveau joueur n'a qu'une skill et aucun moyen d'en obtenir d'autres.** Le loadout = rings équipés. On démarre avec le seul ring de départ (`MVP_STARTER_RING`, Arcane Bolt SK-004, [equipment/index.ts:88](packages/game-core/equipment/index.ts:88)) ; les boss ne droppent pas d'équipement (#5) et la Forge est bloquée (#1), donc les 4 autres slots restent vides. | [character/combat-loadout.ts:32](packages/game-core/character/combat-loadout.ts:32) | Le pilier « 5 rings = 5 skills » est invisible hors Cornucopia. |

> Ces six points font partie d'une même chaîne : **déblocage → ressources → craft → build → donjon suivant**. Aucun maillon n'est branché côté joueur. Il faut les traiter ensemble, idéalement avec un test de playthrough qui passe par les mêmes actions que l'UI, sans forcer le state.

---

## 1. Gameplay

### 1.1 Combat — bonne base, peu de variété

**Points forts**
- Combat-core headless, formule de dégâts centralisée, stamina pour sprint (12/s) et dash (20, CD 0,75 s), conforme à D-04.
- 16 skills `SK-001..016` ont un profil runtime ([skills/storyRuntime.ts](packages/game-core/skills/storyRuntime.ts)), summons inclus.
- Mort → respawn checkpoint avec récompenses sécurisées, implémenté.
- IA ennemie pure (`idle/chasing/attacking/leashed/dead`) dans [level-editor/enemy-ai.ts](packages/game-core/level-editor/enemy-ai.ts), prête à remplacer celle du web.

**Faiblesses**
- **Les armes ne changent pas le gameplay.** Clic gauche = mêlée, clic droit = projectile, en dur et quelle que soit l'arme ([pixi-exploration-stage.tsx:1237](apps/web/components/game/story-exploration/pixi-exploration-stage.tsx:1237)). Freeze §5 : « les armes définissent clic G / clic D ». Les 10 familles débloquées par Forge Level 1→10 ne se distinguent que par leurs stats. Tout l'arbre de progression de la Forge perd donc son intérêt.
- **Les ennemis n'ont qu'une attaque : le contact.** Pas de télégraphe ennemi, pas de projectile ennemi, pas de pattern. Le boss du Prologue est un grunt plus gros (520 PV, 16 dégâts au contact).
- **Les phases de boss ne sont que des métadonnées.** `phases: 2` pour Ombre du Dragon, Archimage, Seigneur, Allaeva ([progressionMvp.ts:163](packages/game-core/story/progressionMvp.ts:146)), mais aucune logique de phase n'existe pour ces boss.
- **Le meilleur boss du projet est hors canon.** L'Épouvantail ressuscité du Duel ([duel-boss-prototype.ts](apps/web/components/game/duel/duel-boss-prototype.ts)) a windup, colonnes, pluie avec warning, mêlée et distance. C'est le **gabarit** à généraliser en `BossPatternDefinition` data-driven pour les 6 boss MVP.
- [combat/bosses.ts](packages/game-core/combat/bosses.ts) contient 8+ boss legacy (« Émissaire du Brasier »…) hors roster, utilisés seulement par `expedition/` (OUT). C'est du bruit : à archiver.
- Les télégraphes sont en niveaux de gris (pivot minimaliste). Le Freeze et la Roadmap P13 exigent un code couleur (orange/rouge/jaune/bleu/vert). À trancher : soit le doc s'aligne sur un langage de formes (épaisseur, pointillés, remplissage), soit on garde une teinte d'accent pour le danger.

### 1.2 Build et itémisation

- **Equipment Sets inaccessibles.** `setId` n'est assigné que par la Cornucopia ([cornucopiaDevActions.ts:150](packages/game-core/building/cornucopiaDevActions.ts:150)). Aucune recette ni aucun drop ne produit une pièce Vagabond/Pleureur/Maraudeur/Docteur.
- **Pas de recette pour gants, ceinture, bottes.** Les recettes couvrent arme, casque, plastron, cape, ring, collier et artifact ([forge/recipes.ts:121](packages/game-core/building/forge/recipes.ts:121)). Résultat : un build « arme + 6 armures » (critère MVP) est impossible hors loot, et le loot n'est pas branché.
- **Artifact craftable** (`BASIC_ARTIFACT`, `relic`) alors qu'il est OUT/inerte (D-11). Le joueur dépense des ressources pour un objet sans effet.
- **Le skill d'un ring crafté est tiré au hasard** (`resolveGeneratedRingSkillId` sur seed). Avec 16 skills, 5 slots et un garde anti-doublon, le joueur ne peut pas viser un build. Question de design : recettes de ring par catégorie (Attack/Movement/…) ou par élément ?
- Ressources « mortes » côté craft : `old_wood` est requis par `BASIC_ARMOR`, `BASIC_CAPE` et des armes, mais sa source déclarée (`mine_gathering`, `farm_gathering`) n'est produite par aucun mini-jeu. La validation « graphe fermé » ne contrôle que des **chaînes déclaratives** (`sources: [...]`), pas les producteurs réels.

### 1.3 Économie et progression

- **Deux vocabulaires de ressources coexistent dans la boucle joueur :**
  - legacy `WOOD/STONE/GOLD/IRON/WATER` : coûts de construction ([buildCosts.ts](packages/game-core/building/buildCosts.ts)), drops ennemis web, Market, récompenses du Duel ;
  - canon `iron_ore/quartz/old_wood…` : recettes de Forge, Mine, Farm, récompenses de donjon.

  Conséquence : `GOLD` (exigé par Forum, Kitchen, Market, Bank, Time Gate) **n'a aucune source MVP**. Le Market ne vend pas de GOLD, seul `expedition/` (OUT) en donne.
- **La Player XP ne monte quasiment pas.** Seul le duel Épouvantail en donne (30). `completeDungeon` ne donne pas d'XP. Le Player Level (≤50, +stats auto) est donc figé à 1.
- **Récompenses de donjon faibles et plates.** Donjons narratifs : 25 ECU au premier clear, 5 en replay. Boss : 1 core + 1 Boss Token. Rien ne pousse à refaire un donjon, même si le replay marchait (#3).
- **Le Boss Token n'a aucun usage branché** (currency MVP « usage générique »). À relier au Market ou à des recettes boss.

### 1.4 Systèmes legacy encore dans la boucle

- `story/chapters.ts` (20 chapitres, unlocks TAVERN/LABORATORY/FORTRESS/ROYAL_CASTLE) et `story/levels.ts` (`ch01-lv01`… jusqu'à `ch04`) sont encore routables via `/game/story/levels/[levelId]` ([page.tsx:44](apps/web/app/game/story/levels/[levelId]/page.tsx:44)) et donnent `XP_GLOBAL 100 / STONE / WOOD`. C'est une seconde progression parallèle, hors scope MVP. Elle est aussi la **seule** source réelle d'XP_GLOBAL, ce qui la rend dangereuse à supprimer sans remplacement.
- `story/scripts/ch01.ts` et `ch02.ts` contiennent des placeholders (« À écrire : … »).

---

## 2. Level design

### 2.1 Ce qui existe

| Donjon (code) | Doc | Map | Ennemis | Boss | Script |
|---|---|---|---|---|---|
| `prologue_wastelands` | Dungeon 0 | canonique (non branchée) + legacy | 5 Ombres | Amalgame (grunt géant) | 8 beats |
| `funeral_mausoleum` | Dungeon 1 | **générique** | 7 grunts | — | aucun |
| `ashen_peak` | Dungeon 4 | **générique** | 7 grunts | **absent** | aucun |
| `frozen_river` | Dungeon 2 (Ch I !) | **générique** | 7 grunts | — | aucun |
| `reflection_cavern` | Dungeon 7 | **générique** | 7 grunts | **absent** | aucun |
| `royal_abyss` | Dungeon 9 | **générique** | 7 grunts | **absent** | aucun |
| `arathas_academy` | Dungeon 8 | **générique** | 7 grunts | **absent** | aucun |
| `frost_source` | Dungeon 10 | **générique** | 7 grunts | **absent** | aucun |

« Générique » : même carte 2400×1600 vide, mêmes 7 points de spawn codés en dur, 3 POI « Point d'intérêt N » aux mêmes coordonnées ([story-level-explorer.tsx:83](apps/web/components/game/story-exploration/story-level-explorer.tsx:83)).

### 2.2 Écarts avec `DUNGEON_DATABASE` / Freeze

- **3 donjons manquent :** *Vestige du Temps* (D3, teasing Kaléidoscope/Waqt), *Camp de la Retraite Silencieuse* (D5), *Tour de la Chute Blanche* (D6). La Roadmap P12 parle de « Prologue + 10 donjons » ; le code en a 8.
- **Rive Figée est au Ch II dans le code, au Ch I dans la doc.** Or elle porte l'unlock narratif de **Motherstone**, que le Freeze §8 place au Ch I. Le joueur reçoit donc un Effect Set « Ch I » au Ch II.
- `royal_abyss.era = "era_funebre"` alors que le donjon est au Ch II Glaciaire ([progressionMvp.ts:294](packages/game-core/story/progressionMvp.ts:279)). `prologue_wastelands.era` vaut aussi `era_funebre` au lieu de `prologue`.
- **L'ordre Ch II est inversé :** le code fait Gouffre Royal → Académie, la doc fait Académie (D8) → Gouffre (D9, « tease Era Déluge »). Le teasing narratif de fin de chapitre tombe donc au mauvais moment.
- « Caverne aux Reflets » (code) vs « Caverne aux Chants » (Freeze/doc).
- Le Mausolée doit débloquer le **Temple** (doc), et Rive Figée doit faire rejoindre **Tobo**. Aucun de ces unlocks n'est câblé (lien avec P0 #1).

### 2.3 Le Prologue — seul niveau scénarisé, mais sans rythme

- **Les beats ne sont pas ordonnés.** On peut lire « Billy rejoint le roi » avant d'avoir trouvé le chien ; `handlePoiInteract` accepte n'importe quel POI dans n'importe quel ordre.
- **Les beats sont cosmétiques.** Le beat `shadows` (« les Ombres jaillissent ») ne fait rien apparaître : les 5 Ombres et le boss sont posés dès le départ. Le beat `amalgam` n'est qu'une bulle de dialogue placée à l'endroit du boss.
- **Le boss est à côté du spawn.** Spawn en (1200, 800), Amalgame en (1980, 760) : ~780 px, aggro 400 px. Rien n'empêche de foncer sur le boss en premier, ce qui casse la mise en scène « ruines → chien → sacrifice → ombres → boss ».
- **Pas de géométrie.** La map canonique ([prologue_wastelands.ts](packages/game-core/content/story/maps/prologue_wastelands.ts)) a `topography`, `collisions`, `objects` et `triggers` vides. Pas de colonnes brisées (pourtant dans le texte), pas de couloir, pas d'arène de boss. Elle a aussi `world: "kingdom"` alors que le niveau est le Prologue.

**Recommandation Prologue (exemple de structure) :**
1. Zone d'arrivée étroite, ruines (collisions) → beat `ruins` en trigger d'entrée de zone.
2. Le chien en cul-de-sac latéral → `find_dog` + `feed` (interaction F), qui **déverrouille** la suite.
3. `shadows` = vague déclenchée (spawn group) dans une zone fermée jusqu'au clear.
4. Arène du boss fermée derrière le joueur → `amalgam` au trigger d'entrée.
5. Post-boss : `drop_of_darkness` → `billy_joins` → sortie vers le Royaume (`kingdom_found`).

### 2.4 Outillage (éditeur, PlayableMap)

Le pipeline éditeur → export → promotion est solide (registre canonique, `STORY_CANONICAL_RUNTIME_READY_DUNGEON_IDS`, `VictoryCondition`, `ScenarioScript` récents). Pour couvrir `LEVELDESIGN.md`, il manque au modèle `PlayableMap` :

- **zones/salles et portes verrouillables** (multi-salles, retour arrière, objectifs par salle persistants) ;
- **groupes de spawn / vagues** liés à un trigger (le beat `spawn_wave` n'a rien sur quoi s'appuyer) ;
- **checkpoints internes** de run ;
- **coffres liés à une table de loot** (`chest_simple_01` existe comme forme, sans contenu) ;
- **référence à un archétype d'ennemi** : chaque placement porte ses propres stats (`stats: {hp, attack…}` dupliquées 5 fois dans le Prologue). Il faut un registre `ENEMY_ARCHETYPES` (familles d'`ENEMIES_DATABASE_V2` : Spectres, Âmes Perdues, Squelettes, Dragonoïdes, Spectres du Froid, Mages Gelés…, avec leurs variantes et élites) et des placements qui ne gardent qu'`archetypeId` + overrides. **Aucune de ces familles n'existe dans le code.**

### 2.5 Royaume (hub)

Layout clair ([content/kingdom/kingdom-stage.ts](packages/game-core/content/kingdom/kingdom-stage.ts)), 10 bâtiments, spawn central, collisions définies. RAS côté level design. Le problème est la progression (P0 #1) : hors DEV_MODE, le hub montre surtout des bâtiments « Verrouillé ».

---

## 3. Assets

### 3.1 Direction artistique — deux bibles contradictoires

- Le runtime a pivoté vers **B&W minimaliste dessiné en code** (merge `new-minimalist-design`, primitives géométriques, SVG N&B, aucune PNG chargée).
- `docs/30_new_direction/art/` (`ART_BIBLE`, `ART_BACKLOG_BIBLE`, `PROMPT_BIBLE`, `CHARACTER_BIBLE`…) décrit toujours une production **Dark Fantasy illustrée** : sprite sheets, portraits, illustrations narratives, concepts PNG générés (Vieux Roi, Billy, Tobo).

**À trancher explicitement** dans un `ART_DIRECTION_DECISION` (ou un D-xx du Freeze) : les concepts PNG servent-ils de référence de silhouette pour la version géométrique, ou sont-ils abandonnés ? Tant que ce n'est pas écrit, le backlog art (« Priority S : sprite gameplay Vieux Roi ») pointe vers un pipeline qui n'existe pas.

### 3.2 Inventaire runtime

| Famille | État |
|---|---|
| Personnages (Roi, Billy, Tobo, Boto, PNJ) | Roi dessiné en code ; Billy/Tobo **absents en jeu** (Billy n'existe qu'en texte de beat). PNJ = `villager_simple_01` placeholder. |
| Ennemis | **1 seule forme** : `enemy_shard_01` (losange + trait) pour Ombres, grunts et boss, avec un simple scale pour le boss. Aucune silhouette par famille. |
| Boss | 0 visuel dédié sur les 6 boss MVP. |
| Décor éditeur | 6 assets (maison, arbre, rocher, villageois, ennemi, coffre) + 9 textures de sol. Insuffisant pour 8 biomes (Funèbre : tombes, colonnes, os ; Glaciaire : glace, sapins gelés, ruines d'académie). |
| Icônes ressources | 35 SVG, **tous pour les ids legacy**. Les **28 ressources canon** (`iron_ore`, `shadow_residue`, `dark_amalgam_core`…) n'ont **aucune icône** et tombent sur `resource.svg` ([lib/resource-assets.ts](apps/web/lib/resource-assets.ts)). Ce sont justement celles que le joueur loote et crafte. |
| Slots d'équipement | 11 SVG OK. `fake-equipment.ts` est toujours importé par `character-view.tsx`. |
| Zones story | `story-zone-data.ts` mappe des chapitres **legacy** (Tundra Oubliée, Empire Nébuleux, Temps des Dieux) ; rien pour Prologue / Era Funèbre / Era Glaciaire. |
| Textures sol | Teintées (herbe verte, lave rouge, eau bleue) : à vérifier vis-à-vis du pivot N&B. |

### 3.3 Hygiène fichiers

- `*.png.png` (double extension) sur 7 concepts ; `ChatGPT Image 5 juin 2026, 01_13_32.png` (espaces, nom non canonique).
- ~20 Mo de PNG de concept versionnés dans git sans LFS.

---

## 4. Plan d'action recommandé

Ordre pensé pour obtenir le plus vite **un Ch I réellement jouable sans DEV_MODE**, puis l'étendre.

**Sprint A — Débloquer la boucle (P0)**
1. Ajouter `buildingUnlocks` (et `companionJoins`) à `StoryDungeonDefinition` et les appliquer dans `completeDungeon`. Exemple : Prologue → Forum/Farm/Mine ; Mausolée → Temple ; Rive Figée → Tobo ; Pic des Cendres → Forge/Kitchen (à arbitrer).
2. Convertir `buildCosts` en ressources canon et retirer GOLD/WATER du chemin critique.
3. Donner de l'XP joueur et de l'XP_GLOBAL dans `firstClearRewards` / `replayRewards`, et/ou brancher la production du Temple sur le tick. Recalibrer `STORY_MIN_WORLD_LEVEL.chapter_ii_glaciaire`.
4. Autoriser le replay dans l'explorer : `completeDungeon` gère déjà first-clear vs replay, il faut juste ne plus court-circuiter l'UI.
5. Remplacer `GRUNT_LOOT_TABLE` par `rollEnemyMaterialDrops` + `ENEMY_LOOT_TABLES`, et ajouter le roll d'équipement boss.
6. Réécrire le test de playthrough pour qu'il passe par les mêmes actions que l'UI, **sans forcer `worldLevel`**.

**Sprint B — Contenu combat**
7. Registre `ENEMY_ARCHETYPES` (familles du DB V2) + placement par `archetypeId`.
8. Généraliser le boss Épouvantail en `BossPatternDefinition` (phases, windup, specials) et l'appliquer aux 6 boss MVP, en commençant par l'Ombre du Dragon (2 phases).
9. Profils d'attaque par famille d'arme (au moins Épée, Dague, Hache, Arc pour le Ch I).

**Sprint C — Level design**
10. Étendre `PlayableMap` : zones, portes, vagues, checkpoints, coffres → table de loot.
11. Refaire le Prologue avec l'enchaînement du §2.3, puis le basculer sur le runtime canonique (`STORY_CANONICAL_RUNTIME_READY_DUNGEON_IDS`).
12. Créer les maps Ch I (Mausolée, Rive Figée, Vestige du Temps, Pic des Cendres) et remettre l'ordre et les eras conformes à la doc.

**En parallèle — Assets**
13. Trancher la direction artistique (§3.1) et mettre à jour `art/`.
14. 28 icônes canon (même style que les SVG existants) et les visuels de zones Prologue/Funèbre/Glaciaire.
15. Une silhouette géométrique par famille d'ennemi, une par boss, Billy et Tobo en jeu.
16. Pack décor par biome pour l'éditeur (≈10 assets chacun).

**Nettoyage** (après le Sprint A, une fois les sources de remplacement en place) : retirer `story/chapters.ts`, `story/levels.ts`, `storyLevelActions`, `combat/bosses.ts` legacy, `BASIC_ARTIFACT`, `fake-equipment.ts`, les zones story legacy.
