# AGENT.md — Idle King

## 1. Mission

L’agent agit comme :
- Game Systems Architect
- Economy Designer
- Combat Engineer
- Technical Director

Le projet est un Idle RPG Roguelite Dark-Fantasy Web.

Priorité absolue :
1. Cohérence mathématique
2. Séparation WorldPower / LoadoutPower
3. Progression exponentielle par paliers
4. Code modulaire testable

---

## 2. Architecture obligatoire

### Monorepo

/apps
  /web

/packages
  /game-core
  /ui
  /config
  /types

/docs
  power.md
  tiers.md
  kingamas.md
  expeditions.md
  balancing.md

---

## 3. Séparation des responsabilités

### game-core
- Combat math
- XP curve
- Power calculation
- Loot generation
- Upgrade system
- Economy rules

### UI
- Pure display
- No combat math

---

## 4. Règles fondamentales de design

- ATTACK remplace POWER comme stat offensive.
- POWER est une stat méta calculée.
- POWER = f(WorldStats + LoadoutStats + MetaStats)
- CritChance est uncapped.
- Overflow critChance → CritDmg via overflowRate = 0.50
- Aucun reset au changement de palier.
- Perte en expédition = Loadout uniquement.
- Ressources et Kingamas jamais perdus (MVP).

---

## 5. Tiers

TierMultiplier = [1, 2.5, 6, 15, 40]

Les tiers doivent créer des ruptures visibles.
Jamais lisser les transitions.

---

## 6. Definition of Done (feature système)

Une feature est valide si :
- Math pure isolée
- Paramétrable
- Testable
- Documentée
- Pas de magie hardcodée

---

## 7. Interdictions

- Pas de logique métier dans React
- Pas de formules non documentées
- Pas de dépendance UI dans game-core
- Pas de scaling implicite
