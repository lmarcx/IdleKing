# 📚 IdleKing — Documentation Index (v3)

> **Point d'entrée unique de la documentation.** Toute lecture (humaine ou IA) commence ici.
> Ce fichier **organise**, **classe**, **arbitre** et **relie** tous les documents. Il ne
> définit aucun système.
>
> 🎨 **Branche artistique** → [`art/ART_INDEX.md`](art/ART_INDEX.md) (sous-index dédié).
> 🔍 **Audit d'architecture** → [`DOC_ARCHITECTURE_AUDIT.md`](DOC_ARCHITECTURE_AUDIT.md).
> 🗄️ **Legacy (NON CANON)** → [`../_legacy/`](../_legacy/README.md) — ignorer pour toute implémentation.
> 🤖 **Règles agent / Codex** → [`../contrib/AGENT_RULES.md`](../contrib/AGENT_RULES.md).

---

## 0. Hiérarchie documentaire officielle (SOURCE OF TRUTH)

Validée par décision d'auteur **D-A03**. Chaque niveau a un **domaine de décision** exclusif.

```txt
LORE / SCRIPT          décide : cosmologie · personnages · noms · peuples · événements narratifs
        ▼
DESIGN_FREEZE_V1       décide : scope · gameplay · progression · systèmes · contenu MVP
        ▼
ART_BIBLES             décide : direction artistique · personnages (visuel) · boss · environnements · UI
        ▼
GAME DESIGN DOCS       concepts : COMBAT, STATS, WEAPONS, SKILLS, ITEMS, FORGE, WORLD…
        ▼
DATA_MODEL             objets métier · save model
        ▼
IMPLEMENTATION_BIBLE   décide : COMMENT implémenter — JAMAIS quoi implémenter
        ▼
DATABASES              *_DATABASE.md = spec canon de contenu → registres runtime
        ▼
ASSETS  ▼  CODE
```

### Règles d'arbitrage (résolution de conflit)

0. **Domaines séparés.** Le **Lore/Script** tranche sur identité/lore/noms ; le **Design
   Freeze** tranche sur systèmes/scope/contenu MVP. Ils gouvernent des objets différents.
1. **Aucune autorité vers le haut.** Une Art Bible ne contredit jamais le Freeze ;
   l'Implementation Bible décide *comment*, jamais *quoi*.
2. **`[DB]` > `(concept)`** · **`V2` > `V1`** · **`RECIPES_DATABASE` > `RECIPES` (stub)**.
3. **`(review)` / `(proposal)` = non normatif** (`BUILDS_VIGILANCE`, `UI_AND_ASSETS_PROPOSAL`).
4. **`../_legacy/` = NON CANON** — ignorer entièrement.

### Légende des types

| Tag | Signification |
|-----|---------------|
| `[DB]` | Document **canonique** — source of truth des données. |
| `(canon)` | Document maître (Freeze, Data Model, Implementation, Roadmap). |
| `(art)` | Art Bible (voir [`art/ART_INDEX.md`](art/ART_INDEX.md)). |
| `(concept)` | Vision / philosophie système. |
| `(narratif)` | Lore, script, cosmologie. |
| `(stub)` | Placeholder temporaire. |
| `(review)` / `(proposal)` | Non normatif. |
| `(data)` | Export tabulaire (CSV/XLSX) accompagnant une DB. |

### Scope MVP

```txt
Prologue · Chapter I — Era Funèbre · Chapter II — Era Glaciaire
```
Exception : `CHARACTER_DATABASE` couvre **tout le projet** (Canon Rule §1.1).

---

## 1. Canon Rules (transverses — priment sur toute interprétation locale)

- **1.1 `CHARACTER_DATABASE` = portée projet** (MVP + chapitres futurs). Autorité sur identité/rôles/apparitions.
- **1.2 Equipment Sets ≠ Effect Sets.** Équipement physique/stat bias vs système passif lié à la Résonance.
- **1.3 Time Gate = bâtiment** (ex-« World Gate », Freeze D-15). Ni item, ni artifact, ni skill.
- **1.4 Kaléidoscope = Special World Item** (≠ Equipment/Artifact/Skill/Effect Set, Freeze D-12).
- **1.5 Billy = Grand Loup (D-A01).** Compagnon du Roi, noble après purification. « Simple chien » = legacy.
- **1.6 Seigneur de la Pluie : Déchu (MVP) ≠ Corrompu (futur) — deux personnages (D-A02/D-A04).**
  - **Déchu** = frère légitime exilé, jumeau de Noah → **BOSS MVP** (Gouffre Royal, Ch II).
  - **Corrompu** = **Noah** après transformation en Commandant → **futur** ; modèle entièrement différent.
- **1.7 Toponymes canon (D-A05/D-A06).** **Caverne aux Chants** (donjon Amalgame du Givre, remplace « Reflets ») ; **Source du Givre** (climax Allaeva ; « Eye of the Storm » = futur, pas un synonyme).

---

## 2. Onboarding agent IA (Claude / Codex / GPT)

### 2.1 Lecture minimale (toujours, avant toute tâche)
```txt
1. DOCUMENTATION_INDEX.md            (ce fichier)
2. 00_canon/DESIGN_FREEZE_V1.md      (systèmes & scope, décisions D-xx)
3. 00_canon/DATA_MODEL.md            (objets métier & save model)
4. 00_canon/IMPLEMENTATION_BIBLE.md  (ordre d'exécution)
```
### 2.2 Tâche LORE / IDENTITÉ → `01_lore/STORY_CHAPTERS.md` → `01_lore/CHARACTER_DATABASE.md`
### 2.3 Tâche ART → [`art/ART_INDEX.md`](art/ART_INDEX.md) (puis la bible spécialisée)
### 2.4 Tâche CONTENU / DONNÉES → les `03_databases/*_DATABASE.md` + concepts `02_design/`

### 2.5 Règles d'or
- Appliquer la hiérarchie §0 et les Canon Rules §1.
- **Ne jamais** se référer à `../_legacy/` (non canon).
- Valeur chiffrée manquante → `DEFERRED (balancing)` (Freeze §21), placeholder centralisé.
- Discipline serveur/tests → [`../contrib/AGENT_RULES.md`](../contrib/AGENT_RULES.md).

---

## 3. Arborescence

```txt
docs/30_new_direction/
├── DOCUMENTATION_INDEX.md          ← ce fichier (point d'entrée)
├── DOC_ARCHITECTURE_AUDIT.md       ← audit (non normatif)
├── 00_canon/        Freeze · Data Model · Implementation · Roadmap
├── 01_lore/         Story · Scripts · Character Database
├── 02_design/       concepts gameplay (combat, items, éco, méta, contenu)
├── 03_databases/    *_DATABASE [DB] + exports CSV/XLSX
├── 04_integration/  UI/Assets proposal + mockups HTML
└── art/             Art Bibles + ART_INDEX + concepts/ + production/
```

---

## 4. Carte des documents (tous liés)

### 📕 00_canon — Documents maîtres
| Document | Type | Rôle |
|---|---|---|
| [`DESIGN_FREEZE_V1.md`](00_canon/DESIGN_FREEZE_V1.md) | (canon) | **Autorité MVP** : systèmes, scope, décisions D-01→D-17. |
| [`DATA_MODEL.md`](00_canon/DATA_MODEL.md) | (canon) | Objets métier, save model. Dérivé du Freeze. |
| [`IMPLEMENTATION_BIBLE.md`](00_canon/IMPLEMENTATION_BIBLE.md) | (canon) | Ordre d'exécution (comment, pas quoi). |
| [`MVP_ROADMAP.md`](00_canon/MVP_ROADMAP.md) | (canon) | Jalons & exit criteria. |

### 📖 01_lore — Canon narratif (niveau 0)
| Document | Type | Rôle |
|---|---|---|
| [`STORY_CHAPTERS.md`](01_lore/STORY_CHAPTERS.md) | (narratif) | Chapitres + cosmologie (Créa/Naan/Amal). **Source canon du lore.** |
| [`SCRIPTS.md`](01_lore/SCRIPTS.md) | (narratif) | Script narratif détaillé. |
| [`CHARACTER_DATABASE.md`](01_lore/CHARACTER_DATABASE.md) | [DB] | Registre **projet** des personnages (CHR-ids). |

### ⚙️ 02_design — Concepts gameplay
| Document | Domaine | DB associée |
|---|---|---|
| [`COMBAT.md`](02_design/COMBAT.md) · [`STATS.md`](02_design/STATS.md) · [`WEAPONS.md`](02_design/WEAPONS.md) | Combat | — |
| [`SKILLS.md`](02_design/SKILLS.md) | Combat | [`SKILL_DATABASE`](03_databases/SKILL_DATABASE.md) |
| [`ITEMS.md`](02_design/ITEMS.md) · [`EQUIPMENTS.md`](02_design/EQUIPMENTS.md) | Items | [`ITEMS_DATABASE`](03_databases/ITEMS_DATABASE.md) · [`EQUIPMENT_GENERATION_DATABASE`](03_databases/EQUIPMENT_GENERATION_DATABASE.md) |
| [`EQUIPMENT_SETS.md`](02_design/EQUIPMENT_SETS.md) | Équipement | équipement physique / stat bias |
| [`EFFECT_SETS.md`](02_design/EFFECT_SETS.md) *(v1 — superseded)* · [`EFFECT_SETS_AND_RESONANCE_SYSTEM_V2.md`](02_design/EFFECT_SETS_AND_RESONANCE_SYSTEM_V2.md) | Résonance | autorité = V2 |
| [`RESSOURCES.md`](02_design/RESSOURCES.md) · [`CURRENCIES.md`](02_design/CURRENCIES.md) · [`FORGE.md`](02_design/FORGE.md) | Économie | [`RECIPES_DATABASE`](03_databases/RECIPES_DATABASE.md) · [`LOOT_TABLES_DATABASE`](03_databases/LOOT_TABLES_DATABASE.md) |
| [`RECIPES.md`](02_design/RECIPES.md) | Économie | (stub) → [`RECIPES_DATABASE`](03_databases/RECIPES_DATABASE.md) |
| [`WORLD.md`](02_design/WORLD.md) · [`PROGRESSION.md`](02_design/PROGRESSION.md) · [`BUILDINGS.md`](02_design/BUILDINGS.md) · [`MINIGAMES.md`](02_design/MINIGAMES.md) | Méta | `BUILDINGS` contient **Time Gate** |
| [`LEVELDESIGN.md`](02_design/LEVELDESIGN.md) | Contenu | [`DUNGEON_DATABASE`](03_databases/DUNGEON_DATABASE.md) |
| [`ENEMIES.md`](02_design/ENEMIES.md) *(v1)* · [`BOSS.md`](02_design/BOSS.md) | Mobs | [`ENEMIES_DATABASE_V2`](03_databases/ENEMIES_DATABASE_V2.md) · [`BOSS_DATABASE`](03_databases/BOSS_DATABASE.md) |
| [`BUILDS_VIGILANCE.md`](02_design/BUILDS_VIGILANCE.md) | Balance | **(review — non normatif)** |

### 🗃️ 03_databases — Canon de contenu [DB]
| Document | Couvre | Dépend de |
|---|---|---|
| [`ITEMS_DATABASE.md`](03_databases/ITEMS_DATABASE.md) | Items, raretés, bases | `RESSOURCES` |
| [`SKILL_DATABASE.md`](03_databases/SKILL_DATABASE.md) | Skills SK-xxx | `SKILLS` |
| [`RINGS_SKILLS_MAP.md`](03_databases/RINGS_SKILLS_MAP.md) | Rings nommés → SK-0xx | `SKILL_DATABASE` |
| [`RESOURCES_DATABASE.md`](03_databases/RESOURCES_DATABASE.md) | Registre ressources (value, sources, uses) | `RESSOURCES` |
| [`EQUIPMENT_GENERATION_DATABASE.md`](03_databases/EQUIPMENT_GENERATION_DATABASE.md) | Règles de génération | `ITEMS_DATABASE`, `SKILL_DATABASE`, `EQUIPMENT_SETS` |
| [`RECIPES_DATABASE.md`](03_databases/RECIPES_DATABASE.md) | Recettes forge/kitchen | `RESOURCES_DATABASE`, `ITEMS_DATABASE` |
| [`LOOT_TABLES_DATABASE.md`](03_databases/LOOT_TABLES_DATABASE.md) | Tables de loot | `ENEMIES_DATABASE_V2`, `BOSS_DATABASE`, `ITEMS_DATABASE` |
| [`ENEMIES_DATABASE_V2.md`](03_databases/ENEMIES_DATABASE_V2.md) | Familles/variants/élites | `ENEMIES` |
| [`BOSS_DATABASE.md`](03_databases/BOSS_DATABASE.md) | Roster 6 boss MVP | `BOSS`, `DESIGN_FREEZE §14` |
| [`DUNGEON_DATABASE.md`](03_databases/DUNGEON_DATABASE.md) | Instances jouables | `LEVELDESIGN`, `ENEMIES_DATABASE_V2` |
| [`QUEST_DATABASE.md`](03_databases/QUEST_DATABASE.md) | Quêtes MVP | `STORY_CHAPTERS`, `CHARACTER_DATABASE` |
| Exports `(data)` | [`ITEMS .csv`](03_databases/IdleKing_ITEMS_DATABASE_V2.csv) · [`.xlsx`](03_databases/IdleKing_ITEMS_DATABASE_V2.xlsx) · [`RECIPES .csv`](03_databases/IdleKing_RECIPES_DATABASE_V2.csv) · [`.xlsx`](03_databases/IdleKing_RECIPES_DATABASE_V2.xlsx) | tabulaires |

### 🖼️ 04_integration — UI / Assets (non normatif)
| Document | Rôle |
|---|---|
| [`UI_AND_ASSETS_PROPOSAL.md`](04_integration/UI_AND_ASSETS_PROPOSAL.md) | Mapping composants `apps/web` ↔ écrans ↔ état (intégration code). |
| [`mockups/index.html`](04_integration/mockups/index.html) | Galerie de maquettes HTML autonomes. |

### 🎨 art — Direction artistique
→ Sous-index complet : **[`art/ART_INDEX.md`](art/ART_INDEX.md)** (8 bibles + `concepts/` + `production/`).

---

## 5. Reading Paths (humain)

**Game Designer** : `01_lore/STORY_CHAPTERS` → `01_lore/CHARACTER_DATABASE` → `02_design/COMBAT` → `STATS` → `WEAPONS` → `SKILLS` → `ITEMS` → `EQUIPMENT_SETS` → `EFFECT_SETS_…_V2` → éco → contenu → méta.

**Développeur** : `02_design/STATS` → `COMBAT` → `03_databases/SKILL_DATABASE` → `EQUIPMENT_GENERATION_DATABASE` → `ITEMS_DATABASE` → `LOOT_TABLES_DATABASE` → `RECIPES_DATABASE` → `ENEMIES_DATABASE_V2` → `BOSS_DATABASE` → `DUNGEON_DATABASE` → `QUEST_DATABASE`.

**Artiste** : [`art/ART_INDEX.md`](art/ART_INDEX.md) (ordre interne défini là-bas).

---

## 6. Cross-References (graphe condensé)

```txt
RESSOURCES ─► RESOURCES_DATABASE ─► RECIPES_DATABASE ─► FORGE
        └─► LOOT_TABLES_DATABASE ◄─ ENEMIES_DATABASE_V2 / BOSS_DATABASE
ITEMS_DATABASE ─► EQUIPMENT_GENERATION_DATABASE ◄─ SKILL_DATABASE ─► (EQUIPMENT_SETS · EFFECT_SETS_…_V2)
STORY_CHAPTERS ─► QUEST_DATABASE ─► DUNGEON_DATABASE ;  STORY_CHAPTERS ─► CHARACTER_DATABASE
ART_BIBLE ─► CHARACTER/BOSS/ENVIRONMENT/UI_BIBLE ─► ASSET_PRODUCTION_BIBLE ─► PROMPT_BIBLE   (cf. ART_INDEX)
```

---

## 7. Maintenance de l'index (pour rester fluide & fiable)

> **Règle : tout ajout/déplacement/renommage d'un document met à jour cet index dans le même commit.**

- **Ajout d'un doc** → le ranger dans le bon dossier (`00_canon`/`01_lore`/`02_design`/`03_databases`/`04_integration`/`art`) **et** l'ajouter à la Carte §4 avec un lien + un rôle.
- **Nouvelle DB** → §4 (03_databases) + graphe §6.
- **Nouveau doc art** → mettre à jour [`art/ART_INDEX.md`](art/ART_INDEX.md) (pas ici ; cet index pointe seulement vers ART_INDEX).
- **Changement de version** (Vx→Vy) → marquer l'ancien *superseded* dans §8.
- **Déplacement de fichier** → `git mv` (préserver l'historique) + réparer les liens §4.
- **Décision d'auteur (D-Axx)** → l'ajouter en Canon Rule §1 si transverse, et résoudre les flags en §8.

---

## 8. Document Status & Known Issues

**Statuts notables :** `EFFECT_SETS` (v1) & `ENEMIES` (v1) = **superseded by V2** · `RECIPES` = stub · `BUILDS_VIGILANCE` & `UI_AND_ASSETS_PROPOSAL` = non normatifs · `../_legacy/*` = **NON CANON**.

**Résolu :**
- ✅ Réorganisation en 6 dossiers domaine ; tous les docs liés à l'index ; `art/ART_INDEX.md` créé.
- ✅ Legacy archivé (`../_legacy/`, bandeau NON CANON).
- ✅ D-A01 Billy = Grand Loup · D-A02/D-A04 Déchu (MVP) ≠ Corrompu (futur), personnages distincts.
- ✅ « Fusion » retirée de l'UI Forge · portraits unifiés 1024×1024.
- ✅ D-A05 « Caverne aux Chants » · D-A06 « Source du Givre » harmonisés partout.
- ✅ Livrables P0 présents : `RESOURCES_DATABASE` + `RINGS_SKILLS_MAP`.

**Restant (arbitrage / passe ultérieure) :**
- ⚠️ Variantes de noms : Archimage (d'Arathas / Corrompu) ; Allaeva (Reine de Glace) ; Amalgame du Givre absent de `CHARACTER_DATABASE`.
- ⚠️ Lore dupliqué `STORY_CHAPTERS` ↔ `SCRIPTS` — cross-référencer.

---

*Index v3 — point d'entrée canonique. Maintenir §4 (Carte) et §8 (Status) à chaque évolution.*
*Audit complet : [`DOC_ARCHITECTURE_AUDIT.md`](DOC_ARCHITECTURE_AUDIT.md) · Branche art : [`art/ART_INDEX.md`](art/ART_INDEX.md).*
