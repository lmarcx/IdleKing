# 📚 IdleKing — Documentation Index (v2)

> **Point d'entrée unique de la documentation du projet.** Toute lecture (humaine ou IA)
> commence ici. Ce fichier ne définit aucun système : il **organise**, **classe** et **arbitre**.
>
> 📖 **Lore / Script** (canon narratif) → [`STORY_CHAPTERS.md`](STORY_CHAPTERS.md) · [`SCRIPTS.md`](SCRIPTS.md) · [`CHARACTER_DATABASE.md`](CHARACTER_DATABASE.md)
> 🧊 **Design Freeze MVP** → [`DESIGN_FREEZE_V1.md`](DESIGN_FREEZE_V1.md)
> 🎨 **Art Bibles** → [`art/`](art/) (8 documents — voir §5)
> 🗃️ **Modèle métier** → [`DATA_MODEL.md`](DATA_MODEL.md)
> 🛠️ **Ordre d'implémentation** → [`IMPLEMENTATION_BIBLE.md`](IMPLEMENTATION_BIBLE.md)
> 🗺️ **Roadmap** → [`MVP_ROADMAP.md`](MVP_ROADMAP.md)
> 🔍 **Audit d'architecture** → [`DOC_ARCHITECTURE_AUDIT.md`](DOC_ARCHITECTURE_AUDIT.md)
> 🗄️ **Legacy (NON CANON)** → [`../_legacy/`](../_legacy/README.md) — ignorer pour toute implémentation.

---

## 0. Hiérarchie documentaire officielle (SOURCE OF TRUTH)

Validée par décision d'auteur **D-A03**. Chaque niveau a un **domaine de décision** exclusif.

```txt
LORE / SCRIPT
        │   décide : cosmologie · personnages · noms · peuples · événements narratifs
        ▼
DESIGN_FREEZE_V1
        │   décide : scope · gameplay · progression · systèmes · contenu MVP
        ▼
ART_BIBLES
        │   décide : direction artistique · personnages (visuel) · boss · environnements · UI
        ▼
GAME DESIGN DOCS   (concepts : COMBAT, STATS, WEAPONS, SKILLS, ITEMS, FORGE, WORLD…)
        ▼
DATA_MODEL          (objets métier · save model)
        ▼
IMPLEMENTATION_BIBLE
        │   décide : COMMENT implémenter — JAMAIS quoi implémenter
        ▼
DATABASES           (*_DATABASE.md = spec canon de contenu → registres runtime)
        ▼
ASSETS
        ▼
CODE
```

### Règles d'arbitrage (résolution de conflit)

En cas de divergence entre deux documents, appliquer dans l'ordre :

0. **Domaines séparés.** Le **Lore/Script** tranche sur l'identité/lore/noms ; le **Design
   Freeze** tranche sur les systèmes/scope/contenu MVP. Ils ne s'opposent pas : ils gouvernent
   des objets différents.
1. **Un document n'a jamais autorité sur un niveau supérieur.** Une Art Bible ne peut pas
   contredire le Freeze (ex. « Fusion » dans l'UI = invalide, Freeze §9). L'Implementation
   Bible ne décide jamais *quoi*, seulement *comment*.
2. **`[DB]` > `(concept)`** — une base canonique prime sur un document de vision.
3. **`V2` > `V1`** — la version la plus récente supersède l'ancienne.
   `EFFECT_SETS_AND_RESONANCE_SYSTEM_V2` **>** `EFFECT_SETS` · `ENEMIES_DATABASE_V2` **>** `ENEMIES`.
4. **`RECIPES_DATABASE` > `RECIPES`** (DB prime sur le stub).
5. **`(review)` / `(proposal)` = non normatif** — `BUILDS_VIGILANCE` (balance) et
   `UI_AND_ASSETS_PROPOSAL` (intégration) ne sont jamais des specs de design.
6. **`docs/_legacy/` = NON CANON** — ignorer entièrement (ancienne direction Idle/auto-combat).

### Légende des types

| Tag | Signification |
|-----|---------------|
| `[DB]` | **Document canonique** — source of truth des données. |
| `(art)` | **Art Bible** — direction artistique (niveau ART_BIBLES). |
| `(concept)` | Vision / philosophie système. Contexte, pas données finales. |
| `(narratif)` | Lore, script, cosmologie. |
| `(stub)` | Placeholder / notes temporaires. |
| `(review)` / `(proposal)` | Audit ou proposition — **non normatif**. |

### Scope MVP

```txt
Prologue · Chapter I — Era Funèbre · Chapter II — Era Glaciaire
```

Exception : `CHARACTER_DATABASE.md` couvre **l'ensemble du projet** (voir Canon Rules §1.1).

---

## 1. Canon Rules (règles transverses)

Priment sur toute interprétation locale.

### 1.1 CHARACTER_DATABASE — portée projet
`CHARACTER_DATABASE` = registre canonique des personnages du **projet entier** (MVP + chapitres futurs). Fait autorité sur identité, rôles et apparitions.

### 1.2 Equipment Sets ≠ Effect Sets
`EQUIPMENT_SETS` = équipement physique / stat bias / identité visuelle. `EFFECT_SETS(_V2)` = système passif lié à la Résonance. Deux couches indépendantes.

### 1.3 Time Gate = Building
Le **Time Gate** est un **bâtiment** (ex-« World Gate », Freeze D-15). Ni item, ni artifact, ni skill.

### 1.4 Kaleidoscope = Special World Item
Le **Kaléidoscope** est un **Special World Item** (≠ Equipment / Artifact / Skill / Effect Set, Freeze D-12).

### 1.5 Billy = Grand Loup (D-A01)
Billy est un **Grand Loup**, compagnon du Roi, loyauté incarnée, apparence noble après purification. Toute référence à Billy comme « simple chien » est **legacy/obsolète**.

### 1.6 Seigneur de la Pluie : Déchu (MVP) ≠ Corrompu (futur) — deux personnages (D-A02 / D-A04)
**Le Déchu et le Corrompu sont deux personnages distincts** (D-A04) :
- **Déchu** = frère légitime exilé, **jumeau** de Noah → **BOSS MVP CANON** (Gouffre Royal, Ch II — `DESIGN_FREEZE §14`).
- **Corrompu** = **Noah** après transformation en Commandant → **future content, hors MVP**. Forme Commandant = **modèle entièrement différent** (jumeaux ⇒ apparence initiale proche seulement).

### 1.7 Toponymes canoniques (D-A05 / D-A06)
- **Caverne aux Chants** = donjon de l'Amalgame du Givre (Ch II). Remplace toute variante (« Caverne aux Reflets »).
- **Source du Givre** = climax d'Allaeva (Ch II). « Eye of the Storm / Œil de la Tempête » = **réservé à un futur contenu**, plus un synonyme.

---

## 2. Onboarding d'un nouvel agent IA (Claude / Codex / GPT)

### 2.1 Lecture minimale (toujours, avant toute tâche)

```txt
1. DOCUMENTATION_INDEX.md   (ce fichier — hiérarchie & règles)
2. DESIGN_FREEZE_V1.md      (systèmes & scope MVP, décisions D-xx)
3. DATA_MODEL.md            (objets métier & save model)
4. IMPLEMENTATION_BIBLE.md  (ordre d'exécution — comment, pas quoi)
```

### 2.2 Si la tâche touche le LORE ou l'IDENTITÉ
```txt
+ STORY_CHAPTERS.md → CHARACTER_DATABASE.md   (avant toute décision narrative)
```

### 2.3 Si la tâche touche la PRODUCTION ARTISTIQUE
```txt
+ art/ART_BIBLE.md            (vision, ton, palette, règle d'or)
+ la bible spécialisée :  CHARACTER_BIBLE | BOSS_BIBLE | ENVIRONMENT_BIBLE | UI_BIBLE
+ art/ASSET_PRODUCTION_BIBLE.md  (formats, tailles, pipeline)
+ art/PROMPT_BIBLE.md            (templates de génération)
+ art/ART_BACKLOG_BIBLE.md       (ordre de production / sprints)
```

### 2.4 Si la tâche touche le CONTENU / DONNÉES
```txt
+ les *_DATABASE.md concernés (canon [DB]) puis les concepts associés (§6/§7)
```

### 2.5 Règles d'or pour l'agent
- Appliquer la hiérarchie §0 et les Canon Rules §1.
- **Ne jamais** se référer à `docs/_legacy/` (non canon, contredit le Freeze).
- En cas de valeur chiffrée manquante : `DEFERRED (balancing)` (Freeze §21), placeholder centralisé.
- Voir aussi [`../contrib/AGENT_RULES.md`](../contrib/AGENT_RULES.md) (discipline serveur/tests).

---

## 3. Domain Map & arborescence

```txt
00 · Lore & Narrative          05 · Enemies & Bosses
01 · World & Progression       06 · Content & Level Design
02 · Combat Core               07 · Balance & Review
03 · Itemization & Equipment   08 · Art & Production   ← branche art/
04 · Economy & Crafting        09 · Integration (UI/Assets, mockups)
```

```txt
docs/
├── 30_new_direction/                    ✅ CANON
│   ├── DOCUMENTATION_INDEX.md           (ce fichier)
│   ├── DOC_ARCHITECTURE_AUDIT.md        (audit — non normatif)
│   ├── DESIGN_FREEZE_V1.md              🧊 systèmes & scope MVP
│   ├── DATA_MODEL.md · IMPLEMENTATION_BIBLE.md · MVP_ROADMAP.md
│   ├── 00 Lore : STORY_CHAPTERS · SCRIPTS · CHARACTER_DATABASE [DB]
│   ├── 01 Méta : WORLD · PROGRESSION · BUILDINGS · MINIGAMES
│   ├── 02 Combat : COMBAT · STATS · WEAPONS · SKILLS · SKILL_DATABASE [DB]
│   ├── 03 Items : ITEMS · ITEMS_DATABASE [DB] · EQUIPMENTS · EQUIPMENT_GENERATION_DATABASE [DB]
│   │             EQUIPMENT_SETS · EFFECT_SETS (v1) · EFFECT_SETS_AND_RESONANCE_SYSTEM_V2
│   ├── 04 Éco : RESSOURCES · CURRENCIES · FORGE · RECIPES (stub) · RECIPES_DATABASE [DB] · LOOT_TABLES_DATABASE [DB]
│   ├── 05 Mobs : ENEMIES (v1) · ENEMIES_DATABASE_V2 [DB] · BOSS · BOSS_DATABASE [DB]
│   ├── 06 Contenu : LEVELDESIGN · DUNGEON_DATABASE [DB] · QUEST_DATABASE [DB]
│   ├── 07 Review : BUILDS_VIGILANCE (non normatif)
│   ├── 09 Intégration : UI_AND_ASSETS_PROPOSAL (proposal) · mockups/
│   └── art/                             🎨 08 Art & Production
│       ├── ART_BIBLE · CHARACTER_BIBLE · BOSS_BIBLE · ENVIRONMENT_BIBLE
│       ├── UI_BIBLE · ASSET_PRODUCTION_BIBLE · PROMPT_BIBLE · ART_BACKLOG_BIBLE
│
├── contrib/AGENT_RULES.md               (règles agent/Codex)
└── _legacy/                             🗄️ NON CANON (archivé)
```

---

## 4. Reading Paths (humain)

### 🎨 Game Designer
1. `STORY_CHAPTERS` → `CHARACTER_DATABASE` → `SCRIPTS` — *univers*
2. `COMBAT` → `STATS` → `WEAPONS` → `SKILLS` — *boucle*
3. `ITEMS` → `EQUIPMENTS` → `EQUIPMENT_SETS` → `EFFECT_SETS_AND_RESONANCE_SYSTEM_V2` — *build*
4. `RESSOURCES` → `CURRENCIES` → `FORGE` — *économie*
5. `ENEMIES` → `BOSS` → `LEVELDESIGN` — *contenu*
6. `PROGRESSION` → `BUILDINGS` → `MINIGAMES` — *méta*

### 🛠️ Développeur Gameplay
1. `STATS` → `COMBAT`
2. `SKILL_DATABASE` + `SKILLS` → `WEAPONS`
3. `EQUIPMENT_GENERATION_DATABASE` → `ITEMS_DATABASE` → `EQUIPMENT_SETS` / `EFFECT_SETS_…_V2`
4. `LOOT_TABLES_DATABASE` → `RECIPES_DATABASE` → `RECIPES` (stub) → `FORGE`
5. `ENEMIES_DATABASE_V2` → `BOSS_DATABASE` → `DUNGEON_DATABASE` → `QUEST_DATABASE`
6. `WORLD` → `PROGRESSION` → `BUILDINGS` → `MINIGAMES`

### 🖌️ Artiste / Production
1. `art/ART_BIBLE` (vision)
2. `art/CHARACTER_BIBLE` · `art/BOSS_BIBLE` · `art/ENVIRONMENT_BIBLE` · `art/UI_BIBLE` (selon cible)
3. `art/ASSET_PRODUCTION_BIBLE` (formats) → `art/PROMPT_BIBLE` (génération)
4. `art/ART_BACKLOG_BIBLE` (ordre / sprints)
5. Contexte canon : `CHARACTER_DATABASE`, `BOSS_DATABASE`, `DESIGN_FREEZE §14` (roster)

---

## 5. Art Bibles (branche `art/`)

Niveau **ART_BIBLES** de la hiérarchie §0. Chaîne d'autorité interne :
`ART_BIBLE → (CHARACTER|BOSS|ENVIRONMENT|UI)_BIBLE → ASSET_PRODUCTION_BIBLE → PROMPT_BIBLE → ASSETS`.

| Document | Rôle précis | Dépend de |
|----------|-------------|-----------|
| [`art/ART_BIBLE.md`](art/ART_BIBLE.md) | Vision, ton, palette, piliers émotionnels, **règle d'or**. Autorité art racine. | LORE, DESIGN_FREEZE |
| [`art/CHARACTER_BIBLE.md`](art/CHARACTER_BIBLE.md) | Direction visuelle & émotionnelle des personnages (peuples, Roi, Billy, Tobo, NPC). | `CHARACTER_DATABASE` (identité/CHR-id), ART_BIBLE |
| [`art/BOSS_BIBLE.md`](art/BOSS_BIBLE.md) | Direction visuelle des boss, échelle, philosophie « tragédie ». | `BOSS_DATABASE`, `DESIGN_FREEZE §14` (roster 6), ART_BIBLE |
| [`art/ENVIRONMENT_BIBLE.md`](art/ENVIRONMENT_BIBLE.md) | Direction visuelle des zones, landmarks, atmosphères d'Ère. | `WORLD`, `DUNGEON_DATABASE`, `STORY_CHAPTERS` |
| [`art/UI_BIBLE.md`](art/UI_BIBLE.md) | Vision UI/UX, HUD, dialogue, règle du cyan, menus. | `DESIGN_FREEZE` (Forge §9 !), ART_BIBLE |
| [`art/ASSET_PRODUCTION_BIBLE.md`](art/ASSET_PRODUCTION_BIBLE.md) | **Autorité technique assets** : formats, tailles, animations, naming, pipeline. | toutes les bibles ci-dessus |
| [`art/PROMPT_BIBLE.md`](art/PROMPT_BIBLE.md) | Templates de prompts de génération + negative prompts. | ASSET_PRODUCTION_BIBLE |
| [`art/ART_BACKLOG_BIBLE.md`](art/ART_BACKLOG_BIBLE.md) | Ordre réel de production (Priorités S→F, Sprints 1-4). | roster `DESIGN_FREEZE §14`, ART_BIBLE |

> **Frontière de responsabilité** : l'identité d'un personnage (rôle, ère, apparitions) =
> `CHARACTER_DATABASE` (canon) ; sa direction *visuelle* = `CHARACTER_BIBLE`. De même,
> `UI_BIBLE` = vision UI ; [`UI_AND_ASSETS_PROPOSAL`](UI_AND_ASSETS_PROPOSAL.md) = **intégration
> code/composants/mockups** (non normatif) ; `ASSET_PRODUCTION_BIBLE` = formats. Cross-référencer,
> ne pas dupliquer.

---

## 6. Canonical Databases (source of truth)

| Document | Domaine | Couvre | Dépend de |
|----------|---------|--------|-----------|
| `ITEMS_DATABASE.md` | Items | Itemisation, raretés, bases | `RESSOURCES.md` |
| `SKILL_DATABASE.md` | Skills | Liste SK-xxx, data model | `SKILLS.md` |
| `RINGS_SKILLS_MAP.md` | Skills | Mapping rings nommés → SK-0xx | `SKILL_DATABASE.md` |
| `RESOURCES_DATABASE.md` | Économie | Registre canon des ressources (id, value, sources, uses) | `RESSOURCES.md` |
| `EQUIPMENT_GENERATION_DATABASE.md` | Équipement | Règles de génération (loot/forge/affixes) | `ITEMS_DATABASE`, `SKILL_DATABASE`, `EQUIPMENT_SETS` |
| `RECIPES_DATABASE.md` | Craft | Recettes forge / kitchen / catalyseurs | `RESOURCES_DATABASE`, `ITEMS_DATABASE` |
| `LOOT_TABLES_DATABASE.md` | Loot | Tables de loot, drops | `ENEMIES_DATABASE_V2`, `BOSS_DATABASE`, `ITEMS_DATABASE` |
| `ENEMIES_DATABASE_V2.md` | Ennemis | Familles, variants, élites | `ENEMIES.md` (concept) |
| `BOSS_DATABASE.md` | Boss | Roster (6 MVP), récompenses | `BOSS.md` (concept), `DESIGN_FREEZE §14` |
| `DUNGEON_DATABASE.md` | Contenu | Instances jouables | `LEVELDESIGN`, `ENEMIES_DATABASE_V2` |
| `QUEST_DATABASE.md` | Contenu | Quêtes MVP | `STORY_CHAPTERS`, `CHARACTER_DATABASE` |
| `CHARACTER_DATABASE.md` | Narratif | **Registre projet** des personnages | `STORY_CHAPTERS`, `SCRIPTS` |

> `EQUIPMENT_GENERATION_DATABASE` est **mi-règles mi-données** : canonique pour la génération,
> n'inventorie pas les items (→ `ITEMS_DATABASE`).
> `RESOURCES_DATABASE.md` (ex-livrable P0 Freeze §10/§20) **existe désormais** : source of truth
> de `resource_value`. Vérifier que `RECIPES_DATABASE` le référence (et non l'ancien nom cassé).

---

## 7. Concept Documents & Cross-References

| Document | Domaine | DB / système associé |
|----------|---------|----------------------|
| `COMBAT` · `STATS` · `WEAPONS` | Combat | — / — / familles d'armes |
| `SKILLS` | Combat | `SKILL_DATABASE` |
| `ITEMS` · `EQUIPMENTS` | Items | `ITEMS_DATABASE` / `EQUIPMENT_GENERATION_DATABASE` |
| `EQUIPMENT_SETS` | Équipement | équipement physique / stat bias |
| `EFFECT_SETS` (v1 — superseded) / `EFFECT_SETS_AND_RESONANCE_SYSTEM_V2` | Résonance | autorité Effect Sets = V2 |
| `RESSOURCES` · `CURRENCIES` · `FORGE` | Économie | `RECIPES_DATABASE`, `LOOT_TABLES_DATABASE` |
| `WORLD` · `PROGRESSION` · `BUILDINGS` · `MINIGAMES` | Méta | `BUILDINGS` contient **Time Gate** |
| `LEVELDESIGN` | Contenu | `DUNGEON_DATABASE` |

```txt
RESSOURCES ──► RECIPES_DATABASE ──► FORGE          STORY_CHAPTERS ──► QUEST_DATABASE ──► DUNGEON_DATABASE
        └────► LOOT_TABLES_DATABASE ◄── ENEMIES_DATABASE_V2 / BOSS_DATABASE         └──► CHARACTER_DATABASE
ITEMS_DATABASE ──► EQUIPMENT_GENERATION_DATABASE ◄── SKILL_DATABASE ──► (EQUIPMENT_SETS · EFFECT_SETS_…_V2)

ART :  ART_BIBLE ──► CHARACTER/BOSS/ENVIRONMENT/UI_BIBLE ──► ASSET_PRODUCTION_BIBLE ──► PROMPT_BIBLE
            ▲                 │
       CHARACTER_DATABASE ────┘ (identité)   BOSS_DATABASE ──► BOSS_BIBLE (roster 6)
```

---

## 8. Document Status Table

| Document | Type | Version | Statut |
|----------|------|---------|--------|
| `STORY_CHAPTERS` · `SCRIPTS` | narratif | — | Active (canon lore) |
| `CHARACTER_DATABASE` | [DB] | V2 | Active (portée projet) |
| `DESIGN_FREEZE_V1` | freeze | V1 | **LOCKED (autorité MVP)** |
| `DATA_MODEL` · `IMPLEMENTATION_BIBLE` | spec | V1 | Active (dérivés du Freeze) |
| `MVP_ROADMAP` | roadmap | V1 | Active |
| `ITEMS_DATABASE` · `SKILL_DATABASE` · `EQUIPMENT_GENERATION_DATABASE` | [DB] | V2 | Active |
| `RECIPES_DATABASE` · `LOOT_TABLES_DATABASE` · `ENEMIES_DATABASE_V2` | [DB] | V2 | Active |
| `BOSS_DATABASE` · `DUNGEON_DATABASE` · `QUEST_DATABASE` · `RINGS_SKILLS_MAP` | [DB] | V1/V2 | Active |
| `COMBAT` · `STATS` · `WEAPONS` · `SKILLS` · `ITEMS` · `EQUIPMENTS` | concept | V1/V2 | Active |
| `EQUIPMENT_SETS` · `EFFECT_SETS_AND_RESONANCE_SYSTEM_V2` | concept | V1/V2 | Active |
| `EFFECT_SETS` (v1) · `ENEMIES` (v1) | concept | V1 | **Superseded by V2** |
| `RESSOURCES` · `CURRENCIES` · `FORGE` · `WORLD` · `PROGRESSION` · `BUILDINGS` · `MINIGAMES` · `LEVELDESIGN` · `BOSS` | concept | V1/V2 | Active |
| `RECIPES` | stub | Phase 8A | Placeholder |
| `BUILDS_VIGILANCE` | review | — | Non normatif |
| `art/ART_BIBLE` · `CHARACTER_BIBLE` · `BOSS_BIBLE` · `ENVIRONMENT_BIBLE` | (art) | V1 | Active |
| `art/UI_BIBLE` · `ASSET_PRODUCTION_BIBLE` · `PROMPT_BIBLE` · `ART_BACKLOG_BIBLE` | (art) | V1 | Active |
| `UI_AND_ASSETS_PROPOSAL` + `mockups/` | proposal | V1 | Active (non normatif) |
| `DOC_ARCHITECTURE_AUDIT` | audit | — | Non normatif |
| `../_legacy/*` | legacy | — | **NON CANON — archivé** |

---

## 9. Known Issues (hygiène documentaire)

**Résolu :**
- ✅ Branche `art/` intégrée à l'index (hiérarchie §0, §5).
- ✅ Legacy (Idle/auto-combat) archivé dans `docs/_legacy/` avec bandeau NON CANON.
- ✅ **D-A01** : Billy = Grand Loup (aligné ART_BIBLE, CHARACTER_BIBLE, PROMPT_BIBLE, STORY_CHAPTERS).
- ✅ **D-A02** : MVP = Seigneur de la Pluie *Déchu* ; Corrompu = future (aligné BOSS_BIBLE, ART_BACKLOG, STORY_CHAPTERS, CHARACTER_DATABASE).
- ✅ « Fusion » retirée de l'UI Forge (`art/UI_BIBLE`), conforme Freeze §9.
- ✅ Portraits unifiés à **1024×1024** (master de production).
- ✅ Livrables P0 (Freeze §20) présents : `RESOURCES_DATABASE.md` + `RINGS_SKILLS_MAP.md` (réf. `RECIPES_DATABASE` → `RESOURCES_DATABASE` OK).
- ✅ **D-A04** : Déchu (frère exilé, MVP boss) ≠ Corrompu (Noah Commandant, futur) = personnages distincts. Flags de contradiction levés (`CHARACTER_DATABASE`, `art/BOSS_BIBLE`).
- ✅ **D-A05** : « Caverne aux Chants » canonique partout (Freeze, DUNGEON, QUEST, ENEMIES_V2, UI_PROPOSAL).
- ✅ **D-A06** : « Source du Givre » canonique (Ch II) ; « Eye of the Storm » réservé futur (`STORY_CHAPTERS` aligné).

**Restant (arbitrage humain / passe ultérieure) :**
- ⚠️ **Variantes de noms** : Archimage (d'Arathas / Corrompu) ; Allaeva (Reine de Glace) ; Amalgame du Givre absent de `CHARACTER_DATABASE`.
- ⚠️ **Lore dupliqué** `STORY_CHAPTERS` ↔ `SCRIPTS` — risque de divergence.

---

*Index v2 — point d'entrée canonique. Mettre à jour §8 (Status Table) à chaque ajout/changement de version.*
*Audit complet : [`DOC_ARCHITECTURE_AUDIT.md`](DOC_ARCHITECTURE_AUDIT.md).*
