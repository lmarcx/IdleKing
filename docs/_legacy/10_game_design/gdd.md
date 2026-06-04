> ⚠️ **NON CANON — ARCHIVED DOCUMENT — DO NOT USE FOR IMPLEMENTATION**
>
> Archivé le 2026-06-04. Document issu de l'ancienne direction (Idle RPG / auto-combat),
> conservé pour l'historique et la traçabilité uniquement. Le canon vit dans
> `docs/30_new_direction/` — voir `DOCUMENTATION_INDEX.md`.

---
# ✅ gdd.md — v2 (Scope clarifié + “phase suivante” propre)

# 👑 Idle King — Game Design Document (v2)

## 🎮 Genre

Idle RPG / Progression exponentielle contrôlée
Dark fantasy pixel 2D

Inspirations :

* Paperclips (Farm / Scaling / World building)
* Tales of Wind (Contenu instancié + progression) 

---

## 🟢 MVP Scope (Offline)

* Player max level : 50
* World max level : 50
* 5 Ages / 20 chapitres (4 par Age)
* Buildings : Forum, Farm, Mine, Temple, Kitchen (+ Forge si validé MVP)
* Donjons : contenu leveling répétable
* Leaderboards : structure offline (WorldLevel / POWER / Kingamas)

> Expéditions, biomes, et “10 expéditions” deviennent **Phase suivante** (ou fin MVP si tu gardes le scope large).

---

## 🔵 Core Loops

### Loop 1 — Progression (MVP)

Story → Donjons → Ressources → Buildings → XP_GLOBAL → WorldLevel → Age unlock

### Loop 2 — Craft & Power (MVP)

Ressources → Kitchen/Forge → Equip → POWER → Donjons/Story plus rapides

### Loop 3 — Risk (Phase suivante)

Expédition → Risk loadout → Boss → Kingamas → Leaderboard

---

## 🟣 Systems (déjà fondés côté core)

* POWER engine (déterministe)
* Loot deterministic
* Boss phases
* Risked items
* Kingamas wallet
* Leaderboards structures 

---

## 📈 Progression

* Player Level = secondaire endgame
* World Level = **structure** de progression
* Buildings = moteur de meta progression

Cible :

* Lvl 50 ≈ 15h actif
* World 50 ≈ dépend stratégie buildings 

---

## 🟡 Post MVP

* Expéditions full + biomes
* Cieux / Abysses / raretés avancées
* Enchantements / runes / familiers / éveil
* MMO layer (PvP, alliances, AvA, saisons)
