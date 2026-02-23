# 👑 Idle King — Checkpoint Technique & Game Design

*Date: 18/02/2026*
*Status: Core gameplay engine en construction (MVP structuré)*

---

# 1️⃣ Vision du Projet

**Idle King** est un Idle / Clicker RPG dark-fantasy pixel 2D orienté progression exponentielle contrôlée, avec :

* Construction de monde
* Équipements dominants
* Expéditions roguelite punitives
* Boss à phases avec patterns
* Endgame structuré autour du POWER & des KINGAMAS
* Leaderboards (Damage / Chrono / Kingamas)

Objectif MVP :

* Player max level 50
* World max level 50
* 10 Expéditions + 1 Boss Final spécial (chrono 90s invincible)
* 4 biomes
* 3 Leaderboards

---

# 2️⃣ Architecture Actuelle (Game-Core)

Le core est modulaire, orienté simulation pure (sans UI).

```
packages/game-core/
  power/
  loot/
  combat/
  expedition/
  economy/
  quests/
  player/
```

Tout est **déterministe via seed** (important pour leaderboard & anti-cheat).

---

# 3️⃣ Systèmes Implémentés

## ✅ POWER Engine

* CombatStats
* CombatScore
* Tier multipliers
* POWER = f(worldStats + loadoutStats + tier)
* Overflow critChance → critDmg (overflowRate = 0.5)
* Séparation :

  * WorldPower (fixe)
  * LoadoutPower (volatile)
  * TotalPower

---

## ✅ Loot System

* Génération déterministe par seed
* Rareté : common / rare / epic / legendary
* ilvl jusqu'à 1000
* Upgrade engine
* itemPower calculé
* Tests OK

---

## ✅ Loadout System

* Equip slots
* Loadout stats computation
* Risked items snapshot en expédition
* En cas de LOSE → items supprimés
* En cas de WIN → loadout conservé

---

## ✅ Combat Simulator

* Auto attack
* Skills avec :

  * Stamina cost
  * Cooldown
* Boss à phases
* Mode NORMAL
* Mode CHRONO (boss invincible)
* Chrono special (90s damage score)
* Tests OK

---

## ✅ Bosses (Version complète V2)

Biomes :

| Boss  | Biome                             |
| ----- | --------------------------------- |
| 1-2   | VOLCANIC                          |
| 3-4   | TUNDRA                            |
| 5-7   | COSMIC_WRECK (agressif burst)     |
| 8-9   | STORM_CITADEL                     |
| FINAL | RIFT (100% VOID Cosmic Supremacy) |

Boss Final :

* 3 phases
* Phase 3 ultra agressive
* Mode invincible en chrono

---

## ✅ Expéditions

Structure fixe 7 salles :

1 ENCOUNTER
2 CHOICE
3 ENCOUNTER
4 CHOICE
5 ENCOUNTER
6 CHOICE
7 BOSS

* Rooms générées via seed
* Choice rooms persistantes jusqu’à la fin du run
* Expédition 1–9 → chrono “temps total”
* Expédition 10 → 90s damage score
* Difficulté via coefficient par niveau

---

## ✅ Kingamas

* Wallet concept
* Conversion manuelle de ressources
* Fourchette fixe par niveau d’expédition
* LOSE → 0 kingamas
* WIN → RNG dans plage
* Leaderboard #3 futur : kingamas détenus

---

## ✅ Quests (Stubs)

* Repeatable quests
* Clear expedition
* Convert resources
* Claim reward system
* Kingamas rewards

---

# 4️⃣ Ce qui est Stable

✔ POWER math
✔ Loot determinism
✔ Upgrade engine
✔ Combat sim
✔ Chrono mode
✔ Boss system
✔ Expedition runner
✔ Risk system
✔ Kingamas economy
✔ Quest engine minimal

Le core logique est cohérent.

---

# 5️⃣ Ce qu’il Reste à Faire (MVP)

## 🎯 PRIORITÉ HAUTE

### 1️⃣ Donjons (contenu leveling)

* Séparer Donjons (leveling) des Expéditions (endgame)
* Pack d’ennemis scaling par worldLevel
* Reward progression XP + ressources

---

### 2️⃣ Système XP joueur & world

* XP curve
* Level up player
* Level up world
* Déblocage contenu par palier

---

### 3️⃣ Buildings (World progression)

* Production passive (online only)
* Buffs permanents
* Unlock Kingamas (Tier II)

---

### 4️⃣ Leaderboards Structure (Core only)

* BossDamageScore
* ExpeditionSpeedrun
* KingamasHeld

Structure pure (backend à venir plus tard).

---

### 5️⃣ Loot balancing

* Power budget scaling
* Exponentiel contrôlé
* Separation nette entre paliers

---

## 🎯 PRIORITÉ MOYENNE

### 6️⃣ Events (future)

* Défense du monde
* World HP global
* Armée

---

### 7️⃣ Meta progression

* Renaissance (hors MVP)
* Passive effects

---

### 8️⃣ PvP (post-MVP)

* Vol de Kingamas
* Matchmaking basé sur POWER

---

# 6️⃣ Prochaines Étapes Logiques

Ordre recommandé :

1. XP + Level system
2. Donjons (leveling content)
3. Buildings
4. Balancing global POWER
5. Export vers frontend (NextJS)
6. Supabase / persistence

---

# 7️⃣ État Global

Le projet n’est plus conceptuel :
Il possède un **core engine structuré et testable**.

On est maintenant dans la phase :

> 🔥 Passage de prototype mathématique → système de progression complet

---

# 8️⃣ Questions Stratégiques Ouvertes

* Scaling exact du POWER par palier
* Ratio équipement vs buildings
* Balancing Kingamas endgame
* Courbe d’inflation économique
* XP curve exponentielle contrôlée

---

---

# 📌 Résumé Court

Idle King possède :

* Combat engine
* Loot engine
* Boss engine
* Expedition system
* Economy foundation
* Quest stubs

Le prochain bloc majeur est la **progression (XP + World + Buildings)**.

---


### 21/02/2026

## ✅ Checklist — ce qui est déjà fait :

**Fondations (engine)**

* [x] Tick global **1 fois par minute**
* [x] Registry buildings + tickAllBuildings()
* [x] Villageois avec **stamina individuelle**
* [x] Allocation par ressource (Farm/Mine/Temple)
* [x] Consommation de stamina par production (12/min/villager actif)
* [x] Pas de regen passive (prévu via bâtiments/services plus tard)

**XP & progression**

* [x] `XP_GLOBAL` = ressource universelle
* [x] Allocation `XP_GLOBAL -> PlayerXP` et `XP_GLOBAL -> WorldWXP`
* [x] Conversion `XP -> WXP = floor(XP*0.10)`
* [x] Séparation World : **banque WXP** vs **rank up manuel**

  * [x] addWorldWxp()
  * [x] canRankUpWorld()
  * [x] rankUpWorldOnce()
  * [x] rankUpWorldMax() (debug/legacy)
  * [x] applyWorldWxp() conservé en legacy

**Story / unlocks**

* [x] Chapitres linéaires MVP
* [x] Unlock buildings Chap 1 : **Forum + Farm + Mine + Kitchen**
* [x] Unlock Temple Chap 2
* [x] applyUnlocks() synchronise `story.unlocked` + `buildings.*.unlocked`

**Forum**

* [x] State `buildings.forum` (unlocked/built/active)
* [x] `forumRankUpWorld()` (rank up monde explicit)
* [x] Tests Forum + correction tests chapitres

**Farm / Mine**

* [x] Resources Age-gated (la table s’enrichit par Age)
* [x] Allocation filtrée + clamp au nb villageois
* [x] Production 1/min/villager selon allocation
* [x] Tests production + clamp + gating OK

**Kitchen (design validé, code prêt à poser)**

* [x] Décision : **pas automatique**, craft manuel
* [x] Pattern proposé : recipes registry + `cookDish()` + stamina % drain + tests

---

### 🟡 Ce qu’il reste à faire (prochaines étapes)

**Forge — option 1 (ce qu’on attaque maintenant)**

* [ ] Ajouter `buildings.forge` dans `GameState` (unlocked/built/active)
* [ ] Ajouter l’unlock `FORGE` au **chapitre 4** (comme ton plan)
* [ ] Patch `applyUnlocks()` pour `FORGE`
* [ ] Implémenter `forgeActions.ts` (craft/upgrade/recycle)

  * [ ] Craft : consomme ressources mine + stamina % + crée un item
  * [ ] Upgrade : consomme ressources mine + stamina % + augmente ilvl
  * [ ] Recycle : détruit item → rend **uniquement des ressources mine** (MVP)
* [ ] Ajouter inventaire minimaliste dans `GameState`
* [ ] Tests Forge : craft / upgrade / recycle

**Kitchen**

* [ ] Ajouter les plats (ResourceId) + recipes
* [ ] Implémenter `cookDish()` (action manuelle)
* [ ] Tests Kitchen

**Forum (suite plus tard via Codex)**

* [ ] Migration : WorldLevelUp / AgeRankUp *uniquement* via Forum (requirements, coûts, buildings requis)
* [ ] Gestion avancée villageois + regen + presets d’allocation

**Stamina regen**

* [ ] Bâtiment / service de regen (probablement intégré au Forum au MVP)
* [ ] Empêcher soft-lock (regen minimale ou accès très tôt)
