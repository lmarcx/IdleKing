# 📚 IdleKing — Documentation Index

> **Point d'entrée unique de la documentation du projet.**
> Toute lecture (humaine ou IA) commence ici.
>
> Ce fichier ne définit aucun système : il **organise**, **classe** et **arbitre** les documents existants.
>
> 🧊 **Document maître du MVP : [`DESIGN_FREEZE_V1.md`](DESIGN_FREEZE_V1.md)** — fait autorité sur tout (règle de priorité 0).
> 🛠️ **Ordre d'implémentation : [`IMPLEMENTATION_BIBLE.md`](IMPLEMENTATION_BIBLE.md)** — traduit le Freeze en phases/prompts d'exécution (subordonné au Freeze).

---

## 0. How To Use This Index

### Légende des types

| Tag | Signification |
|-----|---------------|
| `[DB]` | **Document canonique** — source of truth. Fait autorité sur les données. |
| `(concept)` | Document de vision / philosophie système. Contexte, pas données finales. |
| `(narratif)` | Lore, script, cosmologie. |
| `(stub)` | Placeholder / notes d'implémentation temporaires. |
| `(review)` | Audit / critique de balance. **Non normatif.** |

### Règles de priorité (résolution de conflit)

En cas de divergence entre deux documents, appliquer dans l'ordre :

0. **`DESIGN_FREEZE_V1.md` > tout** — le Design Freeze fait autorité sur tous les documents pour le périmètre MVP (Prologue, Ch I, Ch II). `IMPLEMENTATION_BIBLE.md` traduit ce Freeze en ordre d'exécution (et lui reste subordonné).
1. **`[DB]` > `(concept)`** — une base de données canonique prime toujours sur un document de vision.
2. **`V2` > `V1`** — la version la plus récente supersède l'ancienne.
   - `EFFECT_SETS_AND_RESONANCE_SYSTEM_V2.md` **>** `EFFECT_SETS.md`
   - `ENEMIES_DATABASE_V2.md` **>** `ENEMIES.md`
3. **`RECIPES_DATABASE.md` > `RECIPES.md`** — la DB prime sur le stub d'implémentation.
4. **`(review)` = non normatif** — `BUILDS_VIGILANCE.md` est une opinion de balance, jamais une spec.

### Scope MVP

Le MVP documenté couvre :

```txt
Prologue
Chapter I  — Era Funèbre
Chapter II — Era Glaciaire
```

Exception : `CHARACTER_DATABASE.md` couvre **l'ensemble du projet** (voir Canon Rules).

---

## 1. Canon Rules (règles transverses)

Ces règles s'appliquent à toute la documentation et priment sur toute interprétation locale.

### 1.1 CHARACTER_DATABASE — portée projet (hors MVP)

`CHARACTER_DATABASE.md` est le **registre canonique des personnages du projet entier**, pas seulement du MVP.

```txt
CHARACTER_DATABASE = MVP + futurs chapitres documentés
```

Il fait autorité sur l'identité, les rôles et les apparitions de tout personnage, quel que soit le chapitre.

### 1.2 Equipment Sets ≠ Effect Sets

Ces deux systèmes sont **distincts** et ne doivent jamais être confondus.

| Système | Document | Nature |
|---------|----------|--------|
| **Equipment Sets** | `EQUIPMENT_SETS.md` | Équipement **physique** : stat bias, orientation de build, identité visuelle des pièces portées. |
| **Effect Sets** | `EFFECT_SETS.md` + `EFFECT_SETS_AND_RESONANCE_SYSTEM_V2.md` | Système **passif** lié à la **Résonance** : effets / mécaniques de gameplay débloqués via les slots de Résonance. |

```txt
Equipment Set = équipement physique / stat bias / identité visuelle
Effect Set     = système passif lié à la Résonance
```

Un item peut appartenir à un Equipment Set **et** alimenter la Résonance qui débloque des Effect Sets : ce sont deux couches indépendantes.

### 1.3 Time Gate = Building

Le **Time Gate** est un **bâtiment** du Kingdom (voir `BUILDINGS.md`) — l'ancien « World Gate »
**renommé** (DESIGN_FREEZE_V1 §13, D-15). C'est le point d'accès aux Ères/modes et le lieu d'usage
du Kaléidoscope + Fragments du Temps.

```txt
Time Gate = Building   (ex-World Gate)
```

Il n'est ni un item, ni un artifact, ni une mécanique de skill.

### 1.4 Kaleidoscope = Special World Item

Le **Kaléidoscope** est un **Special World Item** (objet de monde spécial lié à la progression d'Ère).

```txt
Kaleidoscope = Special World Item
```

Le Kaléidoscope **n'est PAS** :

```txt
✗ Equipment
✗ Artifact
✗ Skill
✗ Effect Set
```

Il ne suit donc pas les règles de génération d'équipement, ni les règles d'artifact, ni celles des skills/effets.

---

## 2. Reading Paths

### 🎨 2.1 Game Designer (du « pourquoi » vers les données)

1. `STORY_CHAPTERS.md` → `SCRIPTS.md` → `WORLD.md` — *univers & macro*
2. `COMBAT.md` → `STATS.md` → `WEAPONS.md` → `SKILLS.md` — *boucle de jeu*
3. `ITEMS.md` → `EQUIPMENTS.md` → `EQUIPMENT_SETS.md` → `EFFECT_SETS_AND_RESONANCE_SYSTEM_V2.md` — *build identity*
4. `RESSOURCES.md` → `CURRENCIES.md` → `FORGE.md` — *économie*
5. `ENEMIES.md` → `BOSS.md` → `LEVELDESIGN.md` — *contenu*
6. `PROGRESSION.md` → `BUILDINGS.md` → `MINIGAMES.md` — *méta / Kingdom*
7. `BUILDS_VIGILANCE.md` — *regard critique, en dernier*

### 🛠️ 2.2 Développeur Gameplay (du contrat de données vers le système)

1. `STATS.md` → `COMBAT.md` — *modèle de base*
2. `SKILL_DATABASE.md` + `SKILLS.md` → `WEAPONS.md`
3. `EQUIPMENT_GENERATION_DATABASE.md` → `ITEMS_DATABASE.md` → `EQUIPMENT_SETS.md` / `EFFECT_SETS_AND_RESONANCE_SYSTEM_V2.md`
4. `LOOT_TABLES_DATABASE.md` → `RECIPES_DATABASE.md` → `RECIPES.md` (stub) → `FORGE.md`
5. `ENEMIES_DATABASE_V2.md` → `BOSS_DATABASE.md`
6. `DUNGEON_DATABASE.md` → `QUEST_DATABASE.md` → `CHARACTER_DATABASE.md`
7. `WORLD.md` → `PROGRESSION.md` → `BUILDINGS.md` → `MINIGAMES.md`

### 🤖 2.3 IA (Claude / Codex / GPT) — ordre déterministe orienté autorité

1. **`DOCUMENTATION_INDEX.md`** (ce fichier) puis **`DESIGN_FREEZE_V1.md`** (document maître MVP) puis **`IMPLEMENTATION_BIBLE.md`** (ordre d'exécution) — toujours en premier.
2. **Toutes les bases canoniques `[DB]` d'abord :**
   `ITEMS_DATABASE` → `RESOURCES_DATABASE` → `SKILL_DATABASE` → `RINGS_SKILLS_MAP` → `EQUIPMENT_GENERATION_DATABASE` → `RECIPES_DATABASE` → `LOOT_TABLES_DATABASE` → `ENEMIES_DATABASE_V2` → `BOSS_DATABASE` → `DUNGEON_DATABASE` → `QUEST_DATABASE` → `CHARACTER_DATABASE`
3. **Puis les concepts comme contexte :**
   `STATS` → `COMBAT` → `WEAPONS` → `SKILLS` → `ITEMS` → `EQUIPMENTS` → `EQUIPMENT_SETS` → `EFFECT_SETS_AND_RESONANCE_SYSTEM_V2` → `RESSOURCES` → `CURRENCIES` → `FORGE` → `WORLD` → `PROGRESSION` → `BUILDINGS` → `MINIGAMES` → `LEVELDESIGN`
4. **Lore en dernier :** `STORY_CHAPTERS` → `SCRIPTS`
5. **Appliquer les règles de priorité de la section 0** pour tout conflit, et respecter les **Canon Rules (section 1)**.

---

## 3. Domain Map

```txt
00 · Narrative & World Lore
01 · World & Progression (Meta)
02 · Combat Core
03 · Itemization & Equipment
04 · Economy & Crafting
05 · Enemies & Bosses
06 · Content & Level Design
07 · Balance & Review
```

### Arbre documentaire

```
docs / 30_new_direction
│
├── 00 · NARRATIVE & WORLD LORE
│   ├── SCRIPTS.md ............................ (narratif)
│   ├── STORY_CHAPTERS.md ..................... (narratif + cosmologie)
│   └── CHARACTER_DATABASE.md ................. [DB] (portée projet)
│
├── 01 · WORLD & PROGRESSION (META)
│   ├── WORLD.md .............................. (concept)
│   ├── PROGRESSION.md ........................ (concept)
│   ├── BUILDINGS.md .......................... (concept)  ← Time Gate, Forge, etc.
│   └── MINIGAMES.md .......................... (concept)
│
├── 02 · COMBAT CORE
│   ├── COMBAT.md ............................. (concept)
│   ├── STATS.md ............................. (concept)
│   ├── WEAPONS.md ........................... (concept)
│   ├── SKILLS.md ............................ (concept)
│   └── SKILL_DATABASE.md .................... [DB]
│
├── 03 · ITEMIZATION & EQUIPMENT
│   ├── ITEMS.md ............................. (concept)
│   ├── ITEMS_DATABASE.md .................... [DB]
│   ├── EQUIPMENTS.md ........................ (concept)
│   ├── EQUIPMENT_GENERATION_DATABASE.md ..... [DB / règles]
│   ├── EQUIPMENT_SETS.md .................... (concept)  ← équipement physique
│   ├── EFFECT_SETS.md ....................... (concept v1) ← passif / Résonance
│   └── EFFECT_SETS_AND_RESONANCE_SYSTEM_V2.md (concept v2) ← supersède v1
│
├── 04 · ECONOMY & CRAFTING
│   ├── RESSOURCES.md ........................ (concept)
│   ├── CURRENCIES.md ........................ (concept)
│   ├── FORGE.md ............................. (concept)
│   ├── RECIPES.md ........................... (stub)
│   ├── RECIPES_DATABASE.md .................. [DB]
│   └── LOOT_TABLES_DATABASE.md .............. [DB]
│
├── 05 · ENEMIES & BOSSES
│   ├── ENEMIES.md .......................... (concept v1)
│   ├── ENEMIES_DATABASE_V2.md .............. [DB v2] ← supersède v1
│   ├── BOSS.md ............................. (concept)
│   └── BOSS_DATABASE.md .................... [DB]
│
├── 06 · CONTENT & LEVEL DESIGN
│   ├── LEVELDESIGN.md ...................... (concept)
│   ├── DUNGEON_DATABASE.md ................. [DB]
│   └── QUEST_DATABASE.md ................... [DB]
│
└── 07 · BALANCE & REVIEW
    └── BUILDS_VIGILANCE.md ................. (review — non normatif)
```

---

## 4. Canonical Databases (source of truth)

| Document | Domaine | Couvre | Dépend de |
|----------|---------|--------|-----------|
| `ITEMS_DATABASE.md` | Items | Itemisation, raretés, bases d'items | `RESSOURCES.md` |
| `SKILL_DATABASE.md` | Skills | Liste des skills (SK-xxx), data model | `SKILLS.md` |
| `EQUIPMENT_GENERATION_DATABASE.md` | Équipement | Règles de génération (loot/forge/affixes) | `ITEMS_DATABASE.md`, `SKILL_DATABASE.md`, `EQUIPMENT_SETS.md` |
| `RECIPES_DATABASE.md` | Craft | Recettes forge / kitchen / catalyseurs | `RESSOURCES.md`, `ITEMS_DATABASE.md` |
| `LOOT_TABLES_DATABASE.md` | Loot | Tables de loot, drops, farming | `ENEMIES_DATABASE_V2.md`, `BOSS_DATABASE.md`, `ITEMS_DATABASE.md` |
| `ENEMIES_DATABASE_V2.md` | Ennemis | Familles, variants, élites | `ENEMIES.md` (concept) |
| `BOSS_DATABASE.md` | Boss | Roster, taxonomie, récompenses | `BOSS.md` (concept) |
| `DUNGEON_DATABASE.md` | Contenu | Instances jouables (World Dream) | `LEVELDESIGN.md`, `ENEMIES_DATABASE_V2.md` |
| `QUEST_DATABASE.md` | Contenu | Quêtes MVP, objectifs, récompenses | `STORY_CHAPTERS.md`, `CHARACTER_DATABASE.md` |
| `CHARACTER_DATABASE.md` | Narratif | **Registre projet** des personnages (MVP + futur) | `STORY_CHAPTERS.md`, `SCRIPTS.md` |

> `EQUIPMENT_GENERATION_DATABASE.md` est **mi-règles mi-données** : canonique pour la **génération**, mais n'inventorie pas les items (→ `ITEMS_DATABASE.md`).

---

## 5. Concept Documents

| Document | Domaine | Paire DB / système associé |
|----------|---------|----------------------------|
| `COMBAT.md` | Combat | — |
| `STATS.md` | Combat | — |
| `WEAPONS.md` | Combat | — |
| `SKILLS.md` | Combat | `SKILL_DATABASE.md` |
| `ITEMS.md` | Items | `ITEMS_DATABASE.md` |
| `EQUIPMENTS.md` | Équipement | `EQUIPMENT_GENERATION_DATABASE.md` |
| `EQUIPMENT_SETS.md` | Équipement | équipement physique / stat bias |
| `EFFECT_SETS.md` | Résonance | **v1 — superseded** par V2 |
| `EFFECT_SETS_AND_RESONANCE_SYSTEM_V2.md` | Résonance | système passif (autorité Effect Sets) |
| `RESSOURCES.md` | Économie | `RECIPES_DATABASE.md`, `LOOT_TABLES_DATABASE.md` |
| `CURRENCIES.md` | Économie | — |
| `FORGE.md` | Économie | `RECIPES_DATABASE.md` |
| `WORLD.md` | Méta | `PROGRESSION.md` |
| `PROGRESSION.md` | Méta | `WORLD.md` |
| `BUILDINGS.md` | Méta | contient **Time Gate**, Forge, etc. |
| `MINIGAMES.md` | Méta | Mine / Farm / Kitchen |
| `LEVELDESIGN.md` | Contenu | `DUNGEON_DATABASE.md` |

---

## 6. Narrative & Special Docs

| Document | Type | Note |
|----------|------|------|
| `STORY_CHAPTERS.md` | (narratif) | Chapitres + cosmologie (Créa / Naan / Amal). **Source canon du lore.** |
| `SCRIPTS.md` | (narratif) | Script narratif détaillé. Référence le même lore — éviter la divergence. |
| `RECIPES.md` | (stub) | Placeholder « Forge Phase 8A ». **Subordonné à `RECIPES_DATABASE.md`.** |
| `BUILDS_VIGILANCE.md` | (review) | Audit de balance. **Non normatif** — ne jamais traiter comme spec. |

---

## 7. Cross-References & Dependency Graph

```txt
RESSOURCES ──────────────► RECIPES_DATABASE ──► FORGE
        │                        ▲
        └──► LOOT_TABLES_DATABASE┘
                   ▲
ENEMIES_DATABASE_V2┤
BOSS_DATABASE ─────┘

ITEMS_DATABASE ──► EQUIPMENT_GENERATION_DATABASE ◄── SKILL_DATABASE
                              │
                              ├──► EQUIPMENT_SETS  (équipement physique)
                              └──► EFFECT_SETS_AND_RESONANCE_SYSTEM_V2 (passif / Résonance)

STORY_CHAPTERS ──► QUEST_DATABASE ──► DUNGEON_DATABASE
        │                  ▲
        └──► CHARACTER_DATABASE
```

---

## 8. Document Status Table

| Document | Type | Version | Statut | Domaine |
|----------|------|---------|--------|---------|
| `ITEMS_DATABASE.md` | DB | V2 | Active | Items |
| `SKILL_DATABASE.md` | DB | V2 | Active | Skills |
| `EQUIPMENT_GENERATION_DATABASE.md` | DB/règles | V2 | Active | Équipement |
| `RECIPES_DATABASE.md` | DB | V2 | Active | Craft |
| `LOOT_TABLES_DATABASE.md` | DB | V2 | Active | Loot |
| `ENEMIES_DATABASE_V2.md` | DB | V2 | Active | Ennemis |
| `BOSS_DATABASE.md` | DB | V1 | Active | Boss |
| `DUNGEON_DATABASE.md` | DB | V2 | Active | Contenu |
| `QUEST_DATABASE.md` | DB | V2 | Active | Contenu |
| `CHARACTER_DATABASE.md` | DB | V2 | Active (portée projet) | Narratif |
| `COMBAT.md` | concept | V1 | Active | Combat |
| `STATS.md` | concept | V1 | Active | Combat |
| `WEAPONS.md` | concept | V2 | Active | Combat |
| `SKILLS.md` | concept | V2 | Active | Combat |
| `ITEMS.md` | concept | V2 | Active | Items |
| `EQUIPMENTS.md` | concept | V1 | Active | Équipement |
| `EQUIPMENT_SETS.md` | concept | V1 | Active | Équipement |
| `EFFECT_SETS.md` | concept | V1 | **Superseded by V2** | Résonance |
| `EFFECT_SETS_AND_RESONANCE_SYSTEM_V2.md` | concept | V2 | Active | Résonance |
| `RESSOURCES.md` | concept | V1 | Active | Économie |
| `CURRENCIES.md` | concept | V1 | Active | Économie |
| `FORGE.md` | concept | V1 | Active | Économie |
| `RECIPES.md` | stub | Phase 8A | Placeholder | Économie |
| `WORLD.md` | concept | V1 | Active | Méta |
| `PROGRESSION.md` | concept | V1 | Active | Méta |
| `BUILDINGS.md` | concept | V1 | Active | Méta |
| `MINIGAMES.md` | concept | V1 | Active | Méta |
| `LEVELDESIGN.md` | concept | V2 | Active | Contenu |
| `ENEMIES.md` | concept | V1 | **Superseded by V2 (data)** | Ennemis |
| `BOSS.md` | concept | V1 | Active | Boss |
| `STORY_CHAPTERS.md` | narratif | — | Active (canon lore) | Narratif |
| `SCRIPTS.md` | narratif | — | Active | Narratif |
| `BUILDS_VIGILANCE.md` | review | — | Non normatif | Balance |

---

## 9. Known Issues (hygiène documentaire)

- ✅ **Renommages appliqués :** `ENNEMIES`→`ENEMIES`, `ENEMIES_DATABSE_V2`→`ENEMIES_DATABASE_V2`, `EFFETC_SETS`→`EFFECT_SETS`, `…_&_…`→`…_AND_…`.
- ⚠️ **Référence cassée :** `RECIPES_DATABASE.md` cite `RESOURCES_DATABASE.md` (inexistant). La ressource canon est `RESSOURCES.md` → à réconcilier.
- ⚠️ **Doublons à arbitrer :** `EFFECT_SETS.md` (v1) vs `EFFECT_SETS_AND_RESONANCE_SYSTEM_V2.md` (v2) ; `RECIPES.md` (stub) vs `RECIPES_DATABASE.md` ; lore dupliqué `STORY_CHAPTERS.md` ↔ `SCRIPTS.md`.
- ⚠️ **Doublon inter-dossiers possible :** `30_new_direction/RESSOURCES.md` vs `10_game_design/ressources.md` — vérifier obsolescence.

---

*Index généré comme point d'entrée canonique. Mettre à jour la section 8 (Document Status Table) à chaque ajout ou changement de version.*
