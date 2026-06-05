> ⚠️ **NON CANON — ARCHIVED DOCUMENT — DO NOT USE FOR IMPLEMENTATION**
>
> Archivé le 2026-06-04. Document issu de l'ancienne direction (Idle RPG / auto-combat),
> conservé pour l'historique et la traçabilité uniquement. Le canon vit dans
> `docs/30_new_direction/` — voir `DOCUMENTATION_INDEX.md`.

---
# ✅ CHECKPOINT.md — v2 (mise à jour “état réel” + prochaine étape claire)

# 👑 Idle King — Checkpoint Technique & Game Design (v2)

*Status: Core engine + couche progression en cours (UI en cours côté NextJS)*

---

## 1️⃣ Vision (inchangée)

Idle / Clicker RPG dark-fantasy, progression exponentielle contrôlée, déterminisme par seed. 

---

## 2️⃣ Architecture actuelle

Core modulaire (simulation pure), export UI ensuite. 

---

## 3️⃣ Ce qui est déjà fait (confirmé)

Fondations : tick 1/min, buildings registry, villageois stamina, allocations, XP_GLOBAL, WorldWXP bank + rank up manuel via Forum, story chapters + unlock buildings (Forum/Farm/Mine/Kitchen, Temple chap 2), applyUnlocks synchro, tests. 

---

## 4️⃣ Périmètre MVP “actuel” (cohérent)

### MVP = Progression Layer + Donjons + Buildings + Craft basique

* XP curves (Player + World)
* Donjons leveling répétables
* Buildings passifs (tick offline) + actions manuelles (Kitchen/Forge)
* Story 20 chapitres / 5 Ages
* Leaderboards structure offline (WorldLevel/POWER/Kingamas)

> Expéditions “risk + boss + leaderboard chrono” = **Phase suivante**, sauf si tu assumes un MVP large.

---

## 5️⃣ Prochain bloc de dev recommandé (concret)

1. **XP curve + LevelUp** (player/world) + rewards de niveau
2. **Donjons MVP** (ennemis scaling worldLevel, reward XP + ressources)
3. **Forge** (craft/upgrade/recycle) + inventaire minimal
4. **Kitchen** (recipes + cookDish)
5. Balancing global (power budget)
6. Persistence (local d’abord), backend plus tard 

---

## 6️⃣ Règle anti soft-lock stamina (à poser maintenant)

* Repos (Forum) + regen minimale
* Kitchen peut produire consommables de récupération (plus tard)