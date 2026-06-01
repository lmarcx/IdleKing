# 🛠️ IMPLEMENTATION BIBLE — IdleKing (MVP)

## Status

```txt
LOCKED — dérivé de DESIGN_FREEZE_V1.md
```

Ce document traduit le **Design Freeze** en **ordre d'exécution concret**. Il ne redesign rien,
n'ajoute aucun système, et reste strictement dans le **scope MVP** (Prologue · Chapter I — Era
Funèbre · Chapter II — Era Glaciaire).

> **Hiérarchie d'autorité**
> `DESIGN_FREEZE_V1.md` (quoi / règles) **>** `IMPLEMENTATION_BIBLE.md` (comment / ordre) **>** code.
> En cas de doute sur une règle de gameplay : le Freeze tranche. En cas de doute sur l'ordre de
> construction : ce document tranche.

> **Brownfield** — le moteur existe déjà partiellement dans `packages/game-core/`
> (`power/`, `loot/`, `progression/`, `world/`, `building/`, `story/`, `quests/`, `economy/`,
> `player/`, `items/`, `resources/`, `combat/bosses`). **Étendre l'existant, ne pas re-forker.**
> Le rendu (PixiJS) et l'UI vivent dans `apps/web/`. `expedition/` et `story/scripts/ch03` existent
> mais sont **hors MVP** : ne pas les étendre.

---

# IMPLEMENTATION PHILOSOPHY

1. **Le Freeze est loi.** Aucune décision de gameplay n'est prise dans le code. Si une donnée manque,
   elle est *DEFERRED balancing* (cf. Freeze §21) et vit dans un fichier de **config**, jamais en
   nombre magique au milieu de la logique.
2. **Data-driven d'abord.** Tout contenu (skills, items, recettes, ressources, ennemis, bosses,
   donjons, sets) est une **donnée de registre** qui reflète 1:1 les `*_DATABASE.md`. La logique ne
   contient pas de contenu en dur.
3. **Core découplé du rendu.** Séparation stricte (cf. `COMBAT.md`) :
   `combat-core` (calculs purs) → `combat-runtime` (état/timers/entités) → `combat-visuals` (Pixi).
   Core+runtime dans `game-core`, visuals dans `apps/web`. **Aucun import Pixi dans `game-core`.**
4. **Déterministe & testable.** Fonctions pures, **RNG seedable** injectée (jamais `Math.random` en
   dur). Chaque système livré avec des tests headless (`__tests__/`).
5. **Discipline de scope.** Tout ce qui est en §19 du Freeze (OUT) est **interdit** : pas de Mythic+,
   passives, ultimates, Power Stones, evolve/enchant/fusion, modes (Duel/Boss Rush/Abyss/Expeditions…),
   PvP, seasons, smart loot, named/unique items, World HP central.
6. **Tranches verticales.** Chaque phase produit une **slice jouable/vérifiable** avec une *Definition
   of Done* mesurable, pas une couche horizontale inerte.
7. **Registres validés au boot.** Au démarrage, valider que chaque référence croisée existe
   (resource ids, skill ids, boss ids, recipe ids). **Échec bruyant** si une donnée manque (évite les
   boss/ressources fantômes).
8. **Étendre, pas dupliquer.** Brancher sur les modules `game-core` existants. Un nouveau système ne
   doit pas obliger à refactorer le combat core (cf. principes des docs système).
9. **Placeholders assumés.** Les valeurs *DEFERRED* (basePower, courbes, %), partent de placeholders
   centralisés et tunables ; elles ne bloquent pas l'implémentation des règles.

---

# SYSTEM DEPENDENCY MAP

```txt
                         ┌─────────────────────────┐
   FOUNDATION            │  Stats model (HP/ATK/DEF │
                         │  /SPEED + advanced/POWER)│
                         │  Currencies (Écu, Token) │
                         └────────────┬─────────────┘
                                      │
                          ┌───────────▼───────────┐
   PHASE 1                │      Combat Core       │
                          │ resources HP/Mana/Stam │
                          │ dash=stamina, damage   │
                          │ formula, status, death │
                          └───┬───────────────┬────┘
                              │               │
              ┌───────────────▼──┐         ┌──▼────────────────┐
   PHASE 2/4  │  Equipment/Items │         │  Weapons + Skills │
              │ slots, rarity,   │◄────────┤ patterns, 16 SK,  │
              │ affixes, upgrade │  rings  │ rings=skill (P4)  │
              └───────┬──────────┘         └───────────────────┘
                      │
              ┌───────▼──────────┐     ┌─────────────────────┐
   PHASE 3/5  │       Loot       │────►│  Resources registry │
              │ tables, recycle  │ ids │  + Mine/Farm output  │
              └───────┬──────────┘     └──────────┬──────────┘
                      │                            │
              ┌───────▼────────────────────────────▼──────┐
   PHASE 6    │                  Forge                     │
              │ craft (roll/Forge), upgrade, recycle,      │
              │ weapon ladder Fg1-10, boss recipes         │
              └───────────────────┬───────────────────────┘
                                  │
              ┌───────────────────▼───────────────────────┐
   PHASE 7    │            Story Progression               │
              │ chapters→dungeons→bosses→unlocks, P.level, │
              │ World level (WXP/Temple/Forum), quests     │
              └───────────────────┬───────────────────────┘
                                  │
              ┌───────────────────▼───────────────────────┐
   PHASE 8    │   Time Gate (ex-World Gate)                │
              │ Kaléidoscope + Fragment du Temps → Ères     │
              └───────────────────┬───────────────────────┘
                                  │
              ┌───────────────────▼───────────────────────┐
   PHASE 9/10 │   Resonance (9 slots) → Effect Sets (5)    │
              │ floor(total/9), effets simplifiés          │
              └───────────────────┬───────────────────────┘
                                  │
   PHASE 11   │  Content Pass : peupler toutes les DB      │
   PHASE 12   │  Polish : juice, UX, balancing, save/load  │
```

**Règle de lecture des dépendances :** une phase peut **stubber** une dépendance d'une phase
ultérieure (ex. P1 combat utilise une attaque d'arme basique et un ennemi placeholder avant P4/P11),
mais ne doit **jamais** dupliquer la logique définitive de cette phase.

---

# IMPLEMENTATION PHASES

## PHASE 1 — Core Combat

**Objectif** — Boucle de combat manuelle jouable : déplacement libre, attaque de base, sprint, **dash
(coût Stamina)**, ressources HP/Mana/Stamina, structure de Damage Formula, status effects, mitigation
DEF à rendement décroissant, mort → checkpoint. Slice 60 fps.

**Systèmes concernés** — `STATS.md`, `COMBAT.md`.
Code : `game-core/power/*` (existant : `combatScore`, `crit`, `statHelpers` → réutiliser), nouveau
`game-core/combat/core` (calculs purs) + `game-core/combat/runtime` (état) ; `apps/web` combat-visuals
(Pixi : telegraphs, damage numbers).

**Dépendances** — Stats model (foundation). Stubs : un pattern d'arme basique, un ennemi placeholder
(`combat/bosses.placeholder.ts` existe).

**Risques** — Couplage Pixi ↔ logique (interdit) ; **dash = Stamina** (D-04, ne pas suivre l'ancienne
note cooldown de STATS) ; courbe DEF placeholder ; sémantique status (Freeze=slow, Bleed=weaken,
Shock=+10%, Burn=DoT) ; crit cap 100% / crit dmg 200% / CDR cap 50%.

**Definition of Done** — Le joueur se déplace, sprint et dash consomment de la Stamina, attaque de
base fonctionnelle, dégâts entrants/sortants via la Damage Formula, au moins 1 status appliqué, mort →
respawn checkpoint sans perte des récompenses sécurisées. `combat-core` testé **headless (sans Pixi)**.

---

## PHASE 2 — Equipment

**Objectif** — Modèle d'item + flux de génération `base → ilvl → rarity → affixes → stats → upgrade`.
Slots, raretés **Common→Legendary**, **affixes 0/0/1/1/2**, upgrade caps **+6/+9/+12**, équiper →
stats injectées dans le combat. Equipment Sets (4 actifs) en stat-bias.

**Systèmes concernés** — `ITEMS_DATABASE.md`, `EQUIPMENT_GENERATION_DATABASE.md`, `EQUIPMENT_SETS.md`.
Code : `game-core/items/*` (existant), `game-core/power/itemScore` (existant), `game-core/player/inventory`
(existant), nouveau `game-core/equipment/generation`.

**Dépendances** — P1 (stats agrégées dans le combat).

**Risques** — **Affixes = 0/0/1/1/2** (D-05 ; pas 3/4) ; **cap 2** ; upgrade inclut **Rare** (+6) ;
**artifact slot inerte** (D-11) ; identité de set = `EQUIPMENT_SETS.md` (D-06), 4 actifs seulement
(Vagabond/Pleureur/Maraudeur/Docteur), 4 placeholder non équilibrés.

**Definition of Done** — Générer un item de n'importe quelle rareté avec le **bon nombre d'affixes** ;
équiper → delta de stats visible en combat ; upgrade jusqu'au cap par rareté ; les 4 sets actifs
appliquent leur bias. Tests : nombre d'affixes par rareté, caps d'upgrade.

---

## PHASE 3 — Loot

**Objectif** — Génération de loot **100% aléatoire (pas de smart loot)** : roll d'équipement boss
**50/25/15/8/2**, drops de matériaux par ennemi, récompenses donjon/coffre, **recycle = ECU + Precious
Stone**.

**Systèmes concernés** — `LOOT_TABLES_DATABASE.md`, `EQUIPMENT_GENERATION_DATABASE.md` (roll de rareté).
Code : `game-core/loot/*` (existant : `lootTables`), `game-core/economy/*`.

**Dépendances** — P2 (génération d'item), P5 (ids de ressources — stub registry possible), P1 (ennemis).

**Risques** — **Pas de smart loot** ; **recycle = ECU + Precious Stone** (D-07, pas de retour
matériaux) ; les ids de ressources droppées doivent matcher `RESOURCES_DATABASE.md` (Iron Ore, Sapphire…).

**Definition of Done** — Tuer un ennemi → drop conforme à sa table ; boss → roll d'équipement pondéré ;
recycle → ECU + chance de Precious Stone ; RNG seedée → tests déterministes.

---

## PHASE 4 — Skills

**Objectif** — 16 skills `SK-001→SK-016` data-driven ; **1 ring = 1 skill**, 5 slots, **pas de
doublon** ; **ring-scaling pur** (aucun niveau de skill, aucun skill point) ; mana cost + cooldown ;
targeting + éléments ; mapping des rings nommés.

**Systèmes concernés** — `SKILL_DATABASE.md`, `RINGS_SKILLS_MAP.md`, intégration `COMBAT.md`,
génération de rings (`EQUIPMENT_GENERATION_DATABASE.md`).
Code : nouveau `game-core/skills`, branchement `combat/runtime` (cast), `equipment/generation` (rings).

**Dépendances** — P1 (hooks de cast, Mana), P2 (item ring), P3 (rings droppables).

**Risques** — **Aucun niveau de skill / skill point** (D-02) ; **1 ring = 1 skill, pas de doublon**
(contrainte verrouillée) ; la puissance vient du ring (rarity/ilvl/upgrade/affixes) ; summon skills
(SK-015/016) lourds ; 8 modes de targeting → garder simple.

**Definition of Done** — Équiper 5 rings → 5 skills castables ; mana/cooldown respectés ; doublon
bloqué ; rarité/upgrade du ring scale la skill ; les 5 rings nommés mappent leur `SK-0xx`
(cf. `RINGS_SKILLS_MAP.md`). Tests : duplicate guard, scaling par ring.

---

## PHASE 5 — Resources

**Objectif** — Registre de ressources depuis `RESOURCES_DATABASE.md` (id, type, rarity, value), stacks
**999**, sorties Mine/Farm, currencies (**Écu**, **Boss Token**), formule `item_value` calculable.

**Systèmes concernés** — `RESOURCES_DATABASE.md`, `RESSOURCES.md`, `CURRENCIES.md`, Mine/Farm
(`MINIGAMES.md`/`BUILDINGS.md`).
Code : `game-core/resources/*` (existant), `game-core/economy/*`, `game-core/world/*` (Mine/Farm).

**Dépendances** — Alimente P3 (ids de loot) et P6 (inputs de craft).

**Risques** — Réconciliation des noms (**Iron Scrap ≡ Iron Ore**, **Sapphire Fragment ≡ Sapphire**) ;
`value` = placeholders (DEFERRED) ; chaque ressource a **au moins un usage OU une valeur de vente**.

**Definition of Done** — Le registre charge et **valide** (échec si id inconnu) ; Mine/Farm produisent
des ressources enregistrées ; `item_value = sum(resource_value × qty)` calcule ; toute ressource a une
valeur de vente Market. Tests : intégrité du registre, calcul d'item_value.

---

## PHASE 6 — Forge

**Objectif** — Craft avec **rareté = roll pondéré influencé par le niveau de Forge** ; upgrade
(+6/+9/+12) ; recycle (ECU + Precious Stone) ; **déblocage des armes par échelle Forge Level 1-10** ;
recettes thématiques gatées par boss.

**Systèmes concernés** — `FORGE.md`, `RECIPES_DATABASE.md`, `EQUIPMENT_GENERATION_DATABASE.md`.
Code : `game-core/building/forgeBuilding` (existant), `game-core/economy/upgradePurchase` (existant),
nouveau `game-core/forge/{craft,recycle}`.

**Dépendances** — P2 (génération d'item), P5 (ressources), P3 (recycle → Precious Stone).

**Risques** — **Craft rarity = roll pondéré par Forge** (D-09, pas de roll pur ni de rareté fixe) ;
**échelle d'armes Fg1-10** (D-08) ; **Evolve/Enchant/Fusion OUT** (ne pas implémenter).

**Definition of Done** — Craft consomme des ressources → item avec rareté pondérée par Forge ; upgrade
jusqu'au cap ; recycle → ECU + stone ; un type d'arme n'est craftable qu'au bon Forge Level ; recettes
boss gatées. Tests : gating par Forge Level, distribution de rareté pondérée.

---

## PHASE 7 — Story Progression

**Objectif** — Story linéaire (chapitres → donjons → bosses → unlocks) ; **Player Level auto (sans
skill point)** ; World Level (WXP via Temple, level-up manuel au Forum) ; quêtes ; gating **Story +
WorldLevel uniquement**.

**Systèmes concernés** — `STORY_CHAPTERS.md`, `DUNGEON_DATABASE.md`, `QUEST_DATABASE.md`,
`BOSS_DATABASE.md`, `PROGRESSION.md`, `WORLD.md`.
Code : `game-core/story/*` (existant), `game-core/quests/*` (existant), `game-core/progression/*`
(existant), `game-core/world/*` (existant).

**Dépendances** — P1 (combats de donjon/boss), P3 (récompenses de donjon), P5 (ressources).

**Risques** — **Level up n'octroie PAS de skill point** (D-02) ; gating uniquement Story+WorldLevel
(jamais PlayerLevel/POWER/équipement obligatoire) ; **scripts Ch III existants = OUT**, ne pas les
brancher ; roster **6 bosses** incl. **Seigneur de la Pluie Déchu = boss du Gouffre Royal** et
**Allaeva 2 phases**.

**Definition of Done** — Parcours jouable Prologue → Ch I → Ch II ; les 6 bosses sont combattables
selon le roster ; quêtes débloquent le contenu ; World level-up manuel au Forum via WXP du Temple.
Tests : gates de progression, WXP→World level.

---

## PHASE 8 — Time Gate

**Objectif** — Bâtiment **Time Gate** (ex-World Gate) ; **Kaléidoscope** (Special World Item) ;
**Fragment du Temps** (clé d'Ère lootée sur boss de fin de chapitre) ; transitions d'Ère.

**Systèmes concernés** — `BUILDINGS.md` (Time Gate), special items, era unlock.
Code : `game-core/building/*` (registry), `game-core/world/*`.

**Dépendances** — P7 (boss de fin de chapitre droppe le Fragment), P5 (special items).

**Risques** — **Time Gate = bâtiment** (D-15), pas un item ; **Kaléidoscope ≠ artifact** (D-12) ;
**Fragment du Temps** = nom unifié (D-13) ; artifact slot reste inerte.

**Definition of Done** — Boss de fin de chapitre → Fragment du Temps ; consommer à la Time Gate →
déblocage de l'Ère suivante ; Kaléidoscope obtenu une fois via la story. Tests : flux de déblocage d'Ère.

---

## PHASE 9 — Resonance

**Objectif** — Calcul de Résonance depuis les **9 slots** (helmet, chest, cape, gloves, belt, boots,
weapon, offhand, necklace ; **rings et artifact exclus**) ; valeurs `Common0…Legendary4` ;
`Effect Slots = floor(total / 9)`.

**Systèmes concernés** — `EFFECT_SETS_AND_RESONANCE_SYSTEM_V2.md` (math).
Code : nouveau `game-core/resonance`.

**Dépendances** — P2 (raretés des slots équipés).

**Risques** — **Rings + Artifact ne génèrent PAS de Résonance** ; formule `floor(total/9)`.

**Definition of Done** — Résonance calculée depuis les 9 slots ; nombre d'Effect Slots correct.
Tests sur exemples du doc : 9 Uncommon = 1 slot ; 9 Epic = 3 slots.

---

## PHASE 10 — Effect Sets

**Objectif** — 5 Effect Sets **simplifiés** (Shadow Veil, Lordflame, Motherstone, Kingfrost,
Rainmaker) ; acquisition **narrative** ; équipement dans les Effect Slots ; effets **simples**
(stats / status), **aucun proc sur-mesure**.

**Systèmes concernés** — `EFFECT_SETS_AND_RESONANCE_SYSTEM_V2.md` (simplifié, D-01).
Code : `game-core/resonance/effects`.

**Dépendances** — P9 (slots), P7 (acquisition narrative), P1 (application en combat).

**Risques** — **Simplifié uniquement** (pas de Shadow Clone / Ice Nova / Tidal Wave / explosions) ;
acquisition = récompense de boss/NPC/événement ; **Rainmaker source = Seigneur de la Pluie Déchu**.

**Definition of Done** — Acquérir un Effect Set via la story ; le placer dans un Effect Slot ; son
effet simple s'applique en combat. Tests : gain par event, application de l'effet.

---

## PHASE 11 — Content Pass

**Objectif** — Peupler **tout** le contenu MVP depuis les DB : Prologue + 10 donjons, familles
d'ennemis/variants/élites, **6 bosses**, recettes, items, sets, effect sets ; câbler les loot tables ;
playthrough end-to-end.

**Systèmes concernés** — toutes les `*_DATABASE.md` + `RESOURCES_DATABASE.md` + `RINGS_SKILLS_MAP.md`.
Code : registres/données dans `game-core` + validation au boot.

**Dépendances** — P1→P10.

**Risques** — Les données doivent matcher les registres (échec bruyant sinon) ; **graphe de ressources
fermé** (drops ↔ recettes) ; **pas de contenu Ch III** ; boss fantôme résolu (Seigneur in Gouffre Royal).

**Definition of Done** — MVP jouable de bout en bout (Prologue → fin Ch II) ; tout le contenu chargé et
**validé** ; zéro erreur de donnée manquante ; chaque ressource droppée a un usage/valeur.

---

## PHASE 12 — Polish

**Objectif** — Juice (damage numbers, crit impactant, screenshake, hit flash, **code couleur des
telegraphs**), UX, **passe de balancing** (remplir les valeurs DEFERRED §21), perf 60 fps, save/load,
no soft-lock.

**Systèmes concernés** — combat-visuals (`apps/web`), UI, config de balancing.

**Dépendances** — toutes.

**Risques** — **Balancing uniquement** ici (remplir les placeholders) ; **n'ajouter aucun système** ;
telegraphs : orange=dégâts, rouge=mortel, jaune=stun, bleu=debuff, vert=safe/heal.

**Definition of Done** — Feedback combat juicy + telegraphs lisibles ; valeurs DEFERRED renseignées
dans la config ; 60 fps stable ; save/load fiable ; aucun soft-lock (stamina/mana regen). MVP
ship-ready.

---

# CRITICAL IMPLEMENTATION RULES

Règles du Design Freeze à **ne jamais casser** (réf. décisions D-xx) :

```txt
RESSOURCES DE COMBAT
- HP = survie · Mana = skills · Stamina = sprint + DASH (D-04)

SKILLS / RINGS
- 5 rings = 5 skills · 1 ring = 1 skill · pas de doublon de Skill ID
- Ring-scaling pur : AUCUN niveau de skill, AUCUN skill point (D-02)
- Rings nommés = porteurs de skill via RINGS_SKILLS_MAP (D-03)

ITEMISATION
- Raretés MVP : Common → Legendary UNIQUEMENT (pas de Mythic/Divine/Ancient)
- Affixes : 0/0/1/1/2 — cap 2 (D-05)
- Upgrade caps : +6 (C/U/Rare) / +9 (Epic) / +12 (Legendary) (D-14)
- Artifact slot INERTE au MVP (D-11)

LOOT / FORGE / ÉCONOMIE
- Pas de smart loot : loot 100% aléatoire
- Recycle = ECU + Precious Stone, AUCUN retour de matériaux (D-07)
- Craft = roll de rareté pondéré par le niveau de Forge (D-09)
- Armes débloquées par échelle Forge Level 1-10 (D-08)
- Evolve / Enchant / Fusion = HORS MVP

SETS / RESONANCE / EFFECT SETS
- Equipment Sets : 4 actifs équilibrés (Vagabond/Pleureur/Maraudeur/Docteur), 4 placeholder (D-06)
- Resonance : 9 slots, RINGS + ARTIFACT EXCLUS, floor(total/9)
- Effect Sets : 5, SIMPLIFIÉS, aucun proc sur-mesure, acquisition narrative (D-01)

SPECIAL / PROGRESSION / CONTENU
- Kaléidoscope = Special World Item (≠ Equipment/Artifact/Skill/Effect Set) (D-12)
- Fragment du Temps = clé d'Ère unifiée, loot boss fin de chapitre (D-13)
- Time Gate = bâtiment (ex-World Gate) (D-15)
- Gating story = Story + WorldLevel uniquement (jamais PlayerLevel/POWER/équipement obligatoire)
- Roster MVP = 6 bosses · Seigneur de la Pluie Déchu = boss du Gouffre Royal (D-10/D-16) · Allaeva 2 phases (D-17)

ARCHITECTURE
- game-core = AUCUN import Pixi (core/runtime/visuals séparés)
- Data-driven : pas de contenu en dur dans la logique
- RNG seedable injectée · registres validés au boot (échec bruyant)

HORS MVP (interdits) — §19 du Freeze
- Mythic+, passives, ultimates, Power Stones, modes (Duel/Boss Rush/Abyss/Expeditions…),
  currencies avancées, PvP, seasons, ascension, named/unique items, World HP central, contenu Ch III+
```

---

# RECOMMENDED CODEX EXECUTION ORDER

Ordre idéal des prompts Codex — petits, vérifiables, avec DoD. Chaque prompt = un commit testable.

```txt
FONDATIONS
01. Stats model : implémenter base (HP/ATK/DEF/SPEED), advanced, derived, POWER
    dans game-core/power + tests (cap crit 100%, crit dmg 200%, CDR 50%, courbe DEF placeholder).
02. RNG seedable + util de validation de registre (échec bruyant). Tests.

PHASE 1 — COMBAT
03. combat-core (pur) : Damage Formula structurée + status effects (Burn/Freeze/Shock/Bleed/Stun/Silence)
    avec sémantique du Freeze. Tests headless.
04. combat-runtime : ressources HP/Mana/Stamina, sprint, DASH=Stamina, attaque de base, mort→checkpoint.
05. apps/web combat-visuals (Pixi) : rendu slice + telegraphs basiques. (Aucune logique de combat ici.)

PHASE 2 — EQUIPMENT
06. Item model + slots + raretés (C→L) ; flux base→ilvl→rarity→affixes→stats.
07. Affixes 0/0/1/1/2 (cap 2) + pools par slot (placeholder values). Tests du nombre d'affixes.
08. Upgrade caps +6/+9/+12 (Rare inclus) ; équiper → agrégation stats en combat. Tests caps.
09. Equipment Sets : 4 actifs en stat-bias (EQUIPMENT_SETS source of truth) ; 4 placeholder inertes.

PHASE 3 — LOOT
10. Loot generation 100% random + roll équipement boss 50/25/15/8/2. Tests seedés.
11. Drops de matériaux par ennemi (ids RESOURCES_DATABASE) + récompenses donjon/coffre.
12. Recycle = ECU + Precious Stone (D-07). Tests.

PHASE 4 — SKILLS
13. Skill registry SK-001..016 (data-driven) + cast (mana/cooldown) dans combat-runtime.
14. Rings = skill : 5 slots, duplicate guard, ring-scaling pur ; mapping rings nommés (RINGS_SKILLS_MAP).
    Tests : doublon bloqué, scaling par rareté/upgrade du ring.

PHASE 5 — RESOURCES
15. Resource registry depuis RESOURCES_DATABASE (id/type/rarity/value, stack 999) + validation boot.
16. Mine/Farm → sorties de ressources enregistrées ; Currencies (Écu, Boss Token) ; item_value. Tests.

PHASE 6 — FORGE
17. Craft : rareté = roll pondéré par Forge Level (D-09) ; consommation ressources. Tests distribution.
18. Déblocage armes par échelle Forge Level 1-10 (D-08) + recettes boss gatées. Tests gating.
19. Upgrade + Recycle branchés sur la Forge (réutiliser economy/upgradePurchase). Tests.

PHASE 7 — STORY PROGRESSION
20. Player Level auto (SANS skill point) + World Level (WXP Temple → level-up manuel Forum). Tests.
21. Story linéaire : chapitres→donjons→bosses→unlocks ; quêtes ; gating Story+WorldLevel. 
22. Roster 6 bosses (Seigneur→Gouffre Royal, Allaeva 2 phases). Branchement combats. Tests gates.

PHASE 8 — TIME GATE
23. Time Gate (bâtiment) + Fragment du Temps (loot boss fin de chapitre) → déblocage d'Ère.
    Kaléidoscope (special item, obtenu une fois). Tests flux d'Ère.

PHASE 9 — RESONANCE
24. Resonance : 9 slots (rings/artifact exclus), valeurs C0..L4, floor(total/9). Tests des exemples.

PHASE 10 — EFFECT SETS
25. 5 Effect Sets simplifiés (effets stats/status, pas de procs) + acquisition narrative + slotting.
    Tests : gain par event, application en combat.

PHASE 11 — CONTENT PASS
26. Charger TOUT le contenu MVP depuis les DB (donjons, ennemis, bosses, items, recettes, sets,
    effect sets) + validation croisée au boot (graphe ressources fermé). 
27. Playthrough end-to-end Prologue→fin Ch II (test d'intégration).

PHASE 12 — POLISH
28. Juice combat + telegraphs (code couleur) + UX.
29. Passe de balancing : remplir les valeurs DEFERRED §21 dans la config (aucun nouveau système).
30. Save/load + garde-fous no soft-lock (regen stamina/mana) + perf 60 fps.
```

> **Règle d'or Codex** : un prompt = une slice avec DoD + tests. Si un prompt nécessite une valeur non
> figée, utiliser un **placeholder centralisé** (config) et marquer *DEFERRED §21*, ne jamais inventer
> une règle de design.

---

*IMPLEMENTATION_BIBLE — subordonné à DESIGN_FREEZE_V1.md. Périmètre : Prologue · Chapter I — Era
Funèbre · Chapter II — Era Glaciaire.*
