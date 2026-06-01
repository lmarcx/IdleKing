# 👑 IdleKing

> **Action RPG / Hack'n Slash** mêlant combat nerveux *Hades-like*, itemisation profonde,
> craft, et progression d'un royaume à travers des Ères brisées d'un monde rêvé.

IdleKing suit un **vieux roi mystérieux** errant dans un monde-rêve fracturé. Sans souvenirs
clairs de son passé, il traverse des royaumes en ruine et des civilisations gelées pour
restaurer l'équilibre du **Fleuve de Vie** et libérer les âmes prisonnières du rêve.

---

## 🎯 Périmètre MVP

Le MVP en cours de développement couvre :

```txt
Prologue
Chapter I  — Era Funèbre
Chapter II — Era Glaciaire
```

Piliers de jeu : **combat manuel skill-based**, **weapons + 5 rings/skills**, **craft > loot**,
**Equipment Sets**, **Effect Sets / Résonance**, reconstruction du **Kingdom** (bâtiments & mini-jeux).

---

## 📚 Documentation

👉 **Point d'entrée unique : [`docs/30_new_direction/DOCUMENTATION_INDEX.md`](docs/30_new_direction/DOCUMENTATION_INDEX.md)**

L'index classe chaque document (canonique `[DB]` vs concept), définit les **règles de priorité
en cas de conflit**, les **Canon Rules**, et propose des **parcours de lecture** dédiés
(Game Designer / Développeur Gameplay / IA).

### Organisation des dossiers

| Dossier | Contenu |
|---------|---------|
| [`docs/00_overview`](docs/00_overview) | Vue d'ensemble, checklists, notes globales, organisation projet |
| [`docs/10_game_design`](docs/10_game_design) | GDD historique & game design (direction initiale) |
| [`docs/20_ui_ux`](docs/20_ui_ux) | UI/UX : styleguide, tokens, composants, layouts, interfaces |
| [`docs/30_new_direction`](docs/30_new_direction) | **Direction actuelle** — systèmes & bases de données canoniques |

### Documents canoniques (source of truth)

Items & équipement · [ITEMS_DATABASE](docs/30_new_direction/ITEMS_DATABASE.md) ·
[EQUIPMENT_GENERATION_DATABASE](docs/30_new_direction/EQUIPMENT_GENERATION_DATABASE.md) ·
[SKILL_DATABASE](docs/30_new_direction/SKILL_DATABASE.md)

Économie & loot · [RECIPES_DATABASE](docs/30_new_direction/RECIPES_DATABASE.md) ·
[LOOT_TABLES_DATABASE](docs/30_new_direction/LOOT_TABLES_DATABASE.md)

Contenu & PNJ · [ENEMIES_DATABASE_V2](docs/30_new_direction/ENEMIES_DATABASE_V2.md) ·
[BOSS_DATABASE](docs/30_new_direction/BOSS_DATABASE.md) ·
[DUNGEON_DATABASE](docs/30_new_direction/DUNGEON_DATABASE.md) ·
[QUEST_DATABASE](docs/30_new_direction/QUEST_DATABASE.md) ·
[CHARACTER_DATABASE](docs/30_new_direction/CHARACTER_DATABASE.md)

### Documents système clés

[COMBAT](docs/30_new_direction/COMBAT.md) ·
[STATS](docs/30_new_direction/STATS.md) ·
[WEAPONS](docs/30_new_direction/WEAPONS.md) ·
[SKILLS](docs/30_new_direction/SKILLS.md) ·
[EQUIPMENT_SETS](docs/30_new_direction/EQUIPMENT_SETS.md) ·
[EFFECT_SETS_AND_RESONANCE_SYSTEM_V2](docs/30_new_direction/EFFECT_SETS_AND_RESONANCE_SYSTEM_V2.md) ·
[FORGE](docs/30_new_direction/FORGE.md) ·
[RESSOURCES](docs/30_new_direction/RESSOURCES.md) ·
[CURRENCIES](docs/30_new_direction/CURRENCIES.md) ·
[WORLD](docs/30_new_direction/WORLD.md) ·
[PROGRESSION](docs/30_new_direction/PROGRESSION.md) ·
[BUILDINGS](docs/30_new_direction/BUILDINGS.md) ·
[MINIGAMES](docs/30_new_direction/MINIGAMES.md) ·
[LEVELDESIGN](docs/30_new_direction/LEVELDESIGN.md)

### Lore & narration

[STORY_CHAPTERS](docs/30_new_direction/STORY_CHAPTERS.md) ·
[SCRIPTS](docs/30_new_direction/SCRIPTS.md)

---

## 🛠️ Stack technique

- **App** : [Next.js 15](https://nextjs.org/) · React 19 · TypeScript
- **Rendu jeu** : [PixiJS 8](https://pixijs.com/)
- **État** : [Zustand](https://github.com/pmndrs/zustand)
- **UI** : Tailwind CSS · Framer Motion · lucide-react · sonner
- **Moteur de jeu** : package interne `@idleking/game-core` (data-driven)
- **Monorepo** : npm workspaces

---

## 🗂️ Structure du repo

```txt
IdleKing/
├── apps/
│   └── web/            # Application Next.js (front + rendu PixiJS)
├── packages/
│   ├── game-core/      # Moteur de jeu (power, loot, progression, equipment, market, bank…)
│   ├── types/          # Types partagés
│   ├── ui-system/      # Système de composants UI
│   └── config/         # Configuration partagée
├── docs/               # Documentation projet (voir section Documentation)
├── AUDIT.md            # Audit technique / checklist d'implémentation
└── package.json        # Workspaces racine
```

---

## 🚀 Démarrage

> Prérequis : **Node.js 20+** et **npm**.

```bash
# Installer les dépendances (monorepo)
npm install

# Lancer l'app web en développement
npm run dev --workspace @idleking/web

# Build de tous les workspaces
npm run build

# Vérification de types
npm run typecheck

# Tests (si présents)
npm test
```

L'application web démarre par défaut sur <http://localhost:3000>.

---

## 📌 État du projet

Projet **privé en développement actif** (MVP). Le suivi d'implémentation détaillé
(moteur, UI, systèmes) est maintenu dans **[`AUDIT.md`](AUDIT.md)**.

La direction de design en vigueur est celle du dossier
**[`docs/30_new_direction`](docs/30_new_direction)** — les dossiers `10_game_design`
et antérieurs sont conservés comme historique.

---

*Pour toute contribution ou prise en main : commencer par le
[DOCUMENTATION_INDEX](docs/30_new_direction/DOCUMENTATION_INDEX.md).*
