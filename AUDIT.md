# Audit d'architecture — IdleKing

Date : 2026-05-10
Périmètre : `apps/web/` (Next.js 15 + React 19 + Pixi 8 + Zustand) et `packages/game-core/` (~10 800 LOC TS hors tests). Les packages `packages/types/`, `packages/ui-system/` et `packages/config/` sont **vides** (dossiers présents dans le workspace npm mais aucun fichier).

L'audit est organisé en cinq sections suivant les axes que tu as listés, plus une synthèse priorisée à la fin.

---

## 1. Typage externalisé à réutiliser

### 1.1 Doublons de type entre `apps/web` et `@idleking/game-core`

Le fichier `apps/web/components/game/character/types.ts` redéfinit localement des types qui existent déjà dans `game-core` :

| Type local (apps/web) | Équivalent game-core | Différence |
|---|---|---|
| `EquipmentSlotId` | `EquipmentSlot` (`packages/game-core/items/types.ts`) | Identique au caractère près |
| `CharacterEquipmentRarity` (`"common" \| "uncommon" \| ...`) | `ItemRarity` (`"COMMON" \| "UNCOMMON" \| ...`) | Casse différente |
| `CharacterStats` (`atk`, `def`, `hp`, `power`) | `ResolvedEquipmentStats` (`attack`, `defense`, `hp`, `power`) | Noms d'attribut différents |
| `CharacterEquipment` | `EquipmentItem` | Structure très proche |

Conséquence concrète dans `character-view.tsx` : deux dictionnaires de conversion `CHARACTER_TO_CORE_RARITY` / `CORE_TO_CHARACTER_RARITY`, et deux fonctions `toCharacterEquipment` / `getCharacterRarity` qui font des allers-retours `EquipmentItem ↔ CharacterEquipment` à chaque rendu. Tout cela disparaît si on supprime `apps/web/components/game/character/types.ts` et qu'on consomme directement les types de `game-core` (en harmonisant les noms `attack/defense` au passage).

### 1.2 Trois variantes de "stats de personnage"

- `ResolvedEquipmentStats` dans `packages/game-core/items/types.ts`
- `CharacterCombatStats` dans `packages/game-core/character/combat-loadout.ts`
- `CharacterStats` dans `apps/web/components/game/character/types.ts`

Les trois portent les mêmes champs (`hp`, `attack/atk`, `defense/def`, `power`). Un seul type partagé suffit.

### 1.3 Quatre systèmes de "slot d'équipement" coexistent

- `EquipmentSlot` (lowercase, 11 valeurs) — `packages/game-core/items/types.ts` ✅ utilisé par le jeu actuel.
- `EquipmentSlotId` — `apps/web/components/game/character/types.ts` (doublon du précédent).
- `LegacyItemSlot` (`"WEAPON" | "ARMOR" | "CAPE" | "AMULET" | "RING"`) — `packages/game-core/items/types.ts`. Plus utilisé que pour `LEGACY_ITEM_SLOT_MAP` dans `normalizeEquipmentSlot`.
- `ItemSlot` (uppercase, 10 valeurs : `"HELM" | "CHEST" | "LEGS" | ...`) — `packages/game-core/loot/budget.ts`. C'est le système des modules `loot/`, `player/`, `economy/upgradePurchase`, `expedition/` (voir §4).

C'est le résidu d'une refonte non terminée : un slot ressemblant à WoW (HELM/CHEST/LEGS/SHOULDERS) a été remplacé par un slot diablo-like (helmet/chest/...). Les deux modèles cohabitent dans le code.

### 1.4 Deux types `Inventory` incompatibles dans game-core

- `packages/game-core/items/inventory.ts` : `Inventory = { items: Item[] }` ← utilisé par `GameState.inventory`, donc par toute l'app live.
- `packages/game-core/player/types.ts` : `Inventory = { items: Record<string, GeneratedItem> }` ← utilisé seulement par les modules legacy `player/` / `loot/` / `expedition/`.

Le nom `addItem` / `removeItem` est défini dans les deux fichiers avec des signatures différentes. C'est un piège pour qui ouvre l'auto-import.

### 1.5 Alias inutiles `combat.SkillId` dans le web

Quatre fichiers (`duel-arena-stage`, `pixi-exploration-stage`, `skill-bar`, `skills-visuals`) répètent :
```ts
type SkillId = combat.SkillId;
type SkillSlot = combat.SkillSlot;
type SkillCooldownState = combat.SkillCooldownState;
```
On peut juste importer ces types nommément depuis `@idleking/game-core` et supprimer les alias.

### 1.6 Le package `packages/types/` est vide

Le workspace npm le déclare mais le dossier ne contient aucun fichier. Idem `packages/ui-system/` et `packages/config/`. Soit on les supprime, soit on les remplit. Ce serait l'endroit idéal pour héberger les types partagés mentionnés ci-dessus si tu veux les sortir de `game-core`.

### 1.7 `as any` éparpillés dans game-core (15 occurrences)

Concentrés dans `building/farmBuilding.ts`, `building/mineBuilding.ts`, `game/actions.ts`, `expedition/runner.ts`. La plupart sont des contournements qui disparaîtraient avec un type `ResourceId` correctement propagé (les 3 dans farmBuilding/mineBuilding sont sur la même ligne `(rid as any)` à cause de `Object.entries`).

---

## 2. Composants UI à factoriser

### 2.1 Pages kingdom quasi-jumelles : `farm/page.tsx` ≈ `mine/page.tsx`

Les deux fichiers font ~76 lignes et sont identiques à ~95 % près : seuls le titre, l'action `setFarmAllocation`/`setMineAllocation`, la fonction `farmResourcesAvailable`/`mineResourcesAvailable` et l'objet `state.buildings.farm`/`state.buildings.mine` changent.

→ Refactor : un seul composant `<AllocationEditor />` paramétré par `{ title, building: "farm" | "mine" }`. Avec une fonction `getResourcesByAge(building, worldLevel)` côté game-core (voir §4.4), on n'a plus que ~30 lignes de page chacun.

### 2.2 Logique de tooltip dupliquée

`apps/web/components/game/inventory/inventory-view.tsx` (lignes 35-67) et `apps/web/components/game/character/equipment-tooltip.tsx` (lignes 11-43) définissent toutes deux :
- une constante `TOOLTIP_GAP` / `VIEWPORT_MARGIN`
- un `clamp` local (encore lui)
- une fonction `getTooltipPosition` / `getPosition` au pixel près identique
- un état `TooltipPosition`

→ Refactor : un hook `useAnchoredTooltipPosition(anchorRect)` ou un composant `<Tooltip anchor={...}>` dans `components/ui/`.

### 2.3 Fallback d'icône ressource dupliqué dans 3 composants

```ts
function handleResourceIconError(event) {
  const image = event.currentTarget;
  if (image.src.endsWith(RESOURCE_FALLBACK_ASSET)) return;
  image.src = RESOURCE_FALLBACK_ASSET;
}
```
Recopié à l'identique dans `resource-panel.tsx`, `resource-focus-dropdown.tsx`, `resource-gain-popup.tsx` (et logique inline dans `inventory-view.tsx`).

→ Refactor : un mini-composant `<ResourceIcon resourceId={id} className={...} />` dans `apps/web/components/ui/` qui encapsule l'`<img>`, le path, et l'onError. Économise ~50 LOC et garantit un comportement uniforme.

### 2.4 Le moteur Pixi est cloné entre Duel et Story Exploration

`components/game/story-exploration/pixi-exploration-stage.tsx` (1825 LOC) et `components/game/duel/duel-arena-stage.tsx` (1396 LOC) partagent :
- `KEY_DIRECTIONS`, `SKILL_SLOT_BY_KEY`, `SKILL_SLOT_BY_CODE` (à l'identique)
- Constantes `PLAYER_SIZE`, `PLAYER_SPEED`, `MELEE_ATTACK_COOLDOWN_MS`, `MELEE_RANGE`, `RANGED_ATTACK_COOLDOWN_MS`, `MELEE_ATTACK_HALF_ANGLE_RADIANS` (mêmes valeurs)
- Types `ActiveMeleeAttack`, `PlayerProjectile`/`ActiveProjectile`, `ActiveMouseAction`, `LocalSkillsState`
- Logique de mouvement clavier + souris
- Système de cooldowns de skills et `VisualActiveSkillEffect`

→ Refactor (gros chantier mais à très haute valeur) : extraire un hook/factory `usePixiCombatStage({ enemies, onPlayerHit, onPlayerWin, ... })` dans `apps/web/lib/pixi-combat/` qui gère la couche commune (input, mouvement, collisions, skills). Les fichiers spécifiques ne portent plus que la logique unique au mode (boss patterns côté duel, POIs côté exploration). Cible réaliste : tomber sous 800 LOC chacun.

Idem `kingdom-hub-stage.tsx` (2028 LOC) : il duplique `KEY_DIRECTIONS` et son propre `clamp` et porte deux responsabilités à la fois (rendu Pixi + logique de bâtiments).

### 2.5 Pattern `Card+CardHeader+CardTitle+CardContent`

Réécrit littéralement à l'identique dans presque toutes les pages kingdom (`farm`, `mine`, `forge`, `temple`, `forum`, `kitchen`, `progression-panel`, `right-sidebar`, etc.) avec exactement la même structure. Une factorisation `<TitledCard title="...">{...}</TitledCard>` réduit le bruit. Bénéfice mineur mais facile.

### 2.6 Composants présents mais non rendus

- `apps/web/components/game/worlds/world-mode-triangle.tsx` (89 LOC) et son enfant `world-mode-node.tsx` (40 LOC) — exportés, jamais importés ailleurs.
- `apps/web/components/game/boto/boto-actions.tsx`, `boto-unit.tsx`, `terminal-dialogue.tsx` — aucun `import` les référence, à part eux-mêmes.
- `apps/web/components/kingdom/building-sprite.tsx` (le composant React, pas la fonction Pixi `createBuildingSprite` qui elle est utilisée).
- `apps/web/components/right-hud.tsx` — un seul ligne de re-export `RightSidebar as RightHud`, aucun import ne le consomme. Probablement vestige.

Voir §3.2 pour la liste exhaustive.

---

## 3. Code mort et fichiers placeholder

### 3.1 Modules `game-core` orphelins du point de vue du web

L'app web n'importe **rien** depuis :
- `packages/game-core/expedition/*` (8 fichiers, ~700 LOC + tests) — l'UI affiche "Coming Soon" pour les expéditions (`worlds-mode-shell.tsx`).
- `packages/game-core/player/*` (`types.ts`, `inventory.ts`, `loadout.ts`) — ce sont les anciennes structures (`Record<id, GeneratedItem>`, slots `HELM/CHEST/...`).
- `packages/game-core/loot/*` (`itemGenerator.ts`, `lootTables.ts`, `upgradeEngine.ts`, `budget.ts`, `rarity.ts`) — utilisés uniquement par `player/`, `economy/upgradePurchase.ts` et `expedition/`.
- `packages/game-core/economy/upgradePurchase.ts` — dépend du legacy `GeneratedItem`.
- `packages/game-core/combat/simulator.ts` (289 LOC) et `packages/game-core/combat/bosses.ts` (397 LOC) — n'apparaissent que dans `expedition/runner.ts` et les tests.
- `packages/game-core/combat/skills.ts` (legacy `SKILLS` `STRIKE`/`VOID_SPIKE`/`GUARD_BREAK`) — utilisé seulement par `simulator.ts`. À ne pas confondre avec `combat/skills/index.ts` qui est le système actif.

→ Décision à prendre : soit on assume que ces modules sont du WIP "expedition v2" et on les isole derrière un sous-package `@idleking/game-core/legacy` (ou un dossier `__wip__/`), soit on les supprime. En l'état, ils gonflent la taille du bundle compilé, encombrent l'auto-complétion et entretiennent la confusion sur quel `Inventory`/`ItemSlot` utiliser.

**Note importante** : `packages/game-core/index.ts` ne réexporte ni `loot`, ni `expedition`, ni `combat.simulator`, ce qui confirme leur statut "interne / non destiné à être consommé". Mais `combat/index.ts` fait `export * from "./skills.js"` ET `export * from "./skills/index.js"`, ce qui crée des collisions de noms et expose le legacy par mégarde (à corriger dans tous les cas).

### 3.2 Fichiers explicitement morts

| Fichier | LOC | Statut |
|---|---:|---|
| `packages/game-core/combat/bosses.placeholder.ts` | 151 | Aucun import nulle part (ni runtime, ni test) — à supprimer. |
| `apps/web/components/game/worlds/world-mode-triangle.tsx` | 89 | `WorldModeTriangle` jamais importé. |
| `apps/web/components/game/worlds/world-mode-node.tsx` | 40 | Utilisé seulement par le précédent. |
| `apps/web/components/game/boto/boto-unit.tsx` | 28 | `BotoUnit` jamais importé. |
| `apps/web/components/game/boto/boto-actions.tsx` | ~25 | `BotoActions` jamais importé. |
| `apps/web/components/game/boto/terminal-dialogue.tsx` | 35 | `TerminalDialogue` jamais importé. |
| `apps/web/components/right-hud.tsx` | 1 | Re-export inutile. |
| `apps/web/components/kingdom/building-sprite.tsx` | 49 | Le composant React n'est jamais référencé. |
| `apps/web/app/game/boto/page.tsx` | 5 | Redirect simple vers `/game/kingdom`. |
| `apps/web/app/game/worlds/page.tsx` | 5 | idem. |
| `apps/web/app/game/worlds/alt/page.tsx` | 5 | idem. |
| `apps/web/app/game/worlds/original/page.tsx` | 5 | idem. |

Les pages "redirect-only" peuvent être centralisées dans `next.config.js` via `redirects()` plutôt que d'occuper un fichier chacun.

### 3.3 Fixtures de dev

`apps/web/components/game/character/fake-equipment.ts` (138 LOC) génère un set d'items de dev injectés dans l'inventaire en `process.env.NODE_ENV !== "production"`. Ce n'est pas du code mort en soi, mais :
- il devrait vivre dans un dossier `__dev__/` ou `lib/dev-fixtures/`,
- il s'appuie sur les types locaux `CharacterEquipment` (cf §1.1) qu'il faudrait supprimer,
- la fonction `calculateCharacterStats` qu'il exporte n'est utilisée nulle part.

### 3.4 Packages workspace vides

`packages/types/`, `packages/ui-system/`, `packages/config/` sont déclarés dans `package.json` mais ne contiennent aucun fichier. Soit on les supprime du `workspaces`, soit on les utilise.

---

## 4. Fonctions et logique réutilisée (à factoriser)

### 4.1 `clamp` réimplémenté 9 fois

| Emplacement | Signature |
|---|---|
| `packages/game-core/equipment/generation.ts:57` | `clamp(value, min, max)` |
| `packages/game-core/combat/bosses.placeholder.ts:10` | `clamp(n, lo, hi)` (et fichier mort) |
| `packages/game-core/combat/simulator.ts:18` | `clamp(n, a, b)` |
| `packages/game-core/loot/lootTables.ts:65` | `clamp(n, a, b)` |
| `packages/game-core/loot/itemGenerator.ts:76` | `clampIlvl(ilvl)` (cas spécifique) |
| `packages/game-core/villagers/stamina.ts:6` | `clampStamina(x)` (cas spécifique) |
| `apps/web/components/game/inventory/inventory-view.tsx:44` | `clamp(value, min, max)` |
| `apps/web/components/game/duel/duel-boss-prototype.ts:62` | `export function clamp(...)` |
| `apps/web/components/game/kingdom/kingdom-hub-stage.tsx:234` | `clamp(value, min, max)` |
| `apps/web/components/game/character/equipment-tooltip.tsx:20` | `clamp(value, min, max)` |
| `apps/web/components/game/story-exploration/pixi-exploration-stage.tsx:239` | `clamp(value, min, max)` |

→ Une seule fonction dans `packages/game-core/util/math.ts` (ou `apps/web/lib/utils.ts` si on veut éviter d'élargir game-core), réexportée depuis le barrel principal.

### 4.2 `toInt` dupliqué

`apps/web/app/game/kingdom/farm/page.tsx:10` et `apps/web/app/game/kingdom/mine/page.tsx:10` ont la même fonction. À déplacer dans `apps/web/lib/utils.ts`.

### 4.3 Buildings `farm` et `mine` quasi-identiques

`packages/game-core/building/farmBuilding.ts` et `mineBuilding.ts` font ~70 LOC chacun et ne diffèrent que par :
- `state.buildings.farm` ↔ `state.buildings.mine`
- `farmResourcesAvailable` ↔ `mineResourcesAvailable`
- Le label dans les `log[]`

→ Refactor : `createAllocationBuilding({ id, getBuildingState, getAvailable, ... }): BuildingModule` factory. ~70 LOC en moins, et la suite (forge/kitchen le jour où elles produisent) en tire profit.

### 4.4 `farmResourcesAvailable` et `mineResourcesAvailable` ont la même structure

Tous les deux dans `buildingActions.ts` :
```ts
if (age === 1) return base;
if (age === 2) return [...base, ...age2];
if (age === 3) return [...base, ...age2, ...age3];
if (age === 4) return [...base, ...age2, ...age3, ...age4];
return [...base, ...age2, ...age3, ...age4, ...age5];
```
→ `function resourcesByAge(buckets: ResourceId[][]): (worldLevel: number) => ResourceId[]`.

### 4.5 `setFarmAllocation` et `setMineAllocation`

Mêmes 18 lignes, seul `state.buildings.farm`/`mine` et l'allowed set changent. Une fonction générique `setBuildingAllocation(state, building, alloc)` les remplace.

### 4.6 Les deux fonctions `forumRecruitActions` / `forumRestActions`

Les guards `if (!state.buildings.forum.unlocked) return ... FORUM_LOCKED` et `if (!state.buildings.forum.built) return ... FORUM_NOT_BUILT` sont copiés dans chaque fonction. Un helper `requireForum(state): { ok: true } | { ok: false, reason }` les unifie.

### 4.7 Le store Zustand répète 6 fois le même pattern try/result/fallback

Dans `apps/web/store/game-store.ts`, chaque méthode (`equipPlayerItem`, `unequipPlayerItem`, `unlockOrUpgradePlayerSkill`, `equipPlayerSkill`, `unequipPlayerSkill`, `respecPlayerSkills`) suit exactement :
```ts
let result: T | undefined;
let fallbackState = createInitialGameState();
set((current) => {
  fallbackState = current.state;
  result = coreFn(current.state, args);
  if (!result.ok) return {};
  return { state: result.state };
});
return result ?? coreFn(fallbackState, args);
```
→ Un helper générique :
```ts
function applyCoreAction<R extends { ok: boolean; state?: GameState }>(
  set, get,
  fn: (state: GameState) => R,
): R { ... }
```
Cela divise par ~3 la taille du store (245 → ~80 LOC) et supprime le risque de copier-coller d'un cas qui oublie `fallbackState`.

### 4.8 Pages kingdom : pattern `dispatch + toast`

Dans `forum/page.tsx`, `kitchen/page.tsx`, `forge/page.tsx`, `skills-view.tsx`, `character-view.tsx`, etc., on retrouve toujours :
```ts
const res = action(state, ...);
if (!res.ok) {
  toast.error(`X failed: ${res.reason}`);
  return;
}
dispatch(() => res.next);
toast.success("...");
```
→ Un helper `runCoreAction(action, { onSuccess, onError })` ou un hook `useCoreAction()` dans `apps/web/lib/`.

### 4.9 Les images de ressources : `<ResourceIcon>` (cf §2.3)

---

## 5. Qualité globale

### 5.1 Fichiers monolithiques

| Fichier | LOC | Commentaire |
|---|---:|---|
| `apps/web/components/game/kingdom/kingdom-hub-stage.tsx` | 2028 | Mélange Pixi + dialogues + actions de bâtiment + dialogs DOM. À découper en `kingdom-pixi-renderer.ts` (Pixi pur), `kingdom-interactions.ts` (game logic), `kingdom-dialogs.tsx` (UI React). |
| `apps/web/components/game/story-exploration/pixi-exploration-stage.tsx` | 1825 | À factoriser avec duel (cf §2.4). |
| `apps/web/components/game/duel/duel-arena-stage.tsx` | 1396 | Idem. |
| `packages/game-core/combat/bosses.ts` | 397 | Long mais c'est de la data brute, OK tel quel. |

> **Règle de pouce** : > 600 LOC pour un fichier de logique, c'est presque toujours un signe qu'il y a au moins deux responsabilités à séparer. Trois fichiers du web sont au-dessus de 1300 LOC.

### 5.2 Imports incohérents depuis `@idleking/game-core`

Le web mélange trois styles :
- `from "@idleking/game-core"` (barrel)
- `from "@idleking/game-core/items"` (sub-export)
- `from "@idleking/game-core/game/forumActions.js"` (chemin de fichier compilé, avec `.js`)

Tout ce qui existe au barrel devrait être importé depuis `@idleking/game-core`. Les chemins en `.../game/X.js` cassent dès qu'on déplace un fichier et exposent l'arborescence interne. Les `exports` du `package.json` autorisent déjà `./game/*` ; c'est ce mélange qui est le problème.

### 5.3 `combat/index.ts` réexporte deux mondes en collision

```ts
export * from "./skills.js";          // legacy SKILLS / LegacyCombatSkillDef
export * from "./skills/index.js";    // SKILL_DEFS / SkillDef (système actif)
```
TypeScript laisse passer parce que les exports ne se chevauchent pas exactement, mais c'est fragile. À nettoyer en supprimant `skills.ts` (et `simulator.ts` qui en dépend) ou en isolant le legacy.

### 5.4 Le store ne sépare pas state, actions et selectors

Tout est dans `useGameStore`. Quand le store grossira (10+ actions de plus, sélecteurs partagés), ça deviendra dur à suivre. Un découpage en slices Zustand (`createPlayerSlice`, `createBuildingsSlice`, ...) ou même la simple convention "1 fichier par groupe d'actions" aide.

### 5.5 `combat/skills/index.ts` exporte 21 noms

Pas un défaut en soi, mais c'est révélateur que la couche `combat.skills` joue le rôle d'un module à part entière — peut-être en faire un sous-package `@idleking/game-core/skills` à l'avenir.

### 5.6 `apps/web/lib/` est trop minimaliste

Il ne contient que `combat-loadout.ts`, `duel-data.ts`, `env.ts`, `resource-assets.ts`, `utils.ts`. C'est un emplacement naturel pour héberger les helpers à factoriser (`clamp`, `toInt`, `useTooltipPosition`, `useCoreAction`, `<ResourceIcon>`).

---

## 6. Synthèse priorisée

### 🟢 Quick wins (< 1 h chacun, faible risque)

1. **Supprimer le code mort identifié au §3.2** (~480 LOC retirées, zéro risque). Lancer `npm run typecheck && npm test` après.
2. **Centraliser `clamp`** dans `apps/web/lib/utils.ts` (et/ou `game-core/util/math.ts`) et supprimer les 9 copies.
3. **Centraliser `toInt`** entre les deux pages d'allocation.
4. **Créer `<ResourceIcon resourceId={...} />`** dans `apps/web/components/ui/` et remplacer les 4 sites manuels.
5. **Supprimer les alias locaux `type SkillId = combat.SkillId`** (4 fichiers) au profit d'imports nommés.
6. **Vider/supprimer les packages workspace fantômes** (`packages/types/`, `packages/ui-system/`, `packages/config/`).
7. **Nettoyer `combat/index.ts`** : ne plus réexporter `./skills.js` (legacy) tant que `simulator.ts` est encore là, le faire avec un import explicite côté `simulator.ts`.

### 🟡 Refactors moyens (½ à 1 jour chacun)

8. **Unifier les types de personnage** : supprimer `apps/web/components/game/character/types.ts` et utiliser `EquipmentItem`, `EquipmentSlot`, `ItemRarity`, `ResolvedEquipmentStats` partout. Supprime `CHARACTER_TO_CORE_RARITY` et tous les `toCharacterEquipment` de `character-view.tsx`. Bénéfice : ~100 LOC retirées et plus de double mapping.
9. **Hook `useTooltipPosition` partagé** entre `inventory-view` et `equipment-tooltip`.
10. **Helper Zustand `applyCoreAction`** pour réduire le store de 245 → ~80 LOC.
11. **Helper `runCoreAction(toast)`** pour le pattern dispatch+toast dans les pages kingdom et `skills-view`.
12. **`<AllocationEditor />`** unique pour les pages farm + mine.
13. **Factory `createAllocationBuilding(...)`** côté game-core pour fusionner `farmBuilding.ts` + `mineBuilding.ts`. Et helper `resourcesByAge(buckets)` pour les deux fonctions `*ResourcesAvailable`.
14. **Centraliser `requireForum(state)`** pour les `forumRecruitActions` / `forumRestActions`.
15. **Trier les imports `@idleking/game-core/...` vs `@idleking/game-core`** : régle simple — toujours via le barrel sauf si le symbole n'y est pas exporté.

### 🔴 Refactors lourds (à planifier sur un sprint)

16. **Décider du sort des modules legacy** : `expedition/`, `loot/`, `player/`, `combat/simulator.ts`, `combat/bosses.ts`, `combat/skills.ts` (legacy SKILLS), `economy/upgradePurchase.ts`. Trois options :
    - (a) Supprimer si l'orientation produit a tranché contre le système original.
    - (b) Isoler dans `packages/game-core/__wip__/` avec un README expliquant l'état.
    - (c) Sortir dans un package séparé `@idleking/game-core-legacy`.
    Quoi qu'il arrive : ne pas laisser deux types `Inventory` cohabiter dans un même barrel.
17. **Découper `kingdom-hub-stage.tsx` (2028 LOC)** en au moins 3 fichiers : `kingdom-pixi-renderer.ts` (rendu Pixi pur), `kingdom-interactions.ts` (npc/buildings/dialogs game-side), `kingdom-overlay-content.tsx` (UI DOM).
18. **Mutualiser le moteur Pixi de combat** entre `pixi-exploration-stage` et `duel-arena-stage` (cf §2.4). Le plus rentable mais aussi le plus risqué — à faire après avoir solidifié les tests d'intégration côté gameplay.

---

## Annexes : commandes utiles pour tracker le code mort

```bash
# Imports d'un module donné (ex: expedition)
grep -rn "from.*expedition" apps/web packages/game-core --include="*.ts" --include="*.tsx"

# Détecteur d'exports non utilisés (à installer)
npx ts-prune --project apps/web/tsconfig.json
npx ts-prune --project packages/game-core/tsconfig.json

# Recherche de duplication manuelle (si jscpd installé)
npx jscpd apps/web/components packages/game-core --ignore "**/*.test.ts"
```

`ts-prune` est probablement la meilleure suite à donner à cet audit : il listera précisément quels exports de `loot/`, `player/`, `expedition/`, `combat/simulator.ts`, etc. ne sont consommés nulle part, ce qui te permettra de décider au cas par cas.
