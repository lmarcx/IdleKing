> ⚠️ **NON CANON — ARCHIVED DOCUMENT — DO NOT USE FOR IMPLEMENTATION**
>
> Archivé le 2026-06-04. Document issu de l'ancienne direction (Idle RPG / auto-combat),
> conservé pour l'historique et la traçabilité uniquement. Le canon vit dans
> `docs/30_new_direction/` — voir `DOCUMENTATION_INDEX.md`.

---
# ✅ Résumé pour repartir dans un autre chat

## État actuel du projet (game-core)

* Tick global **1/min** : `tickAllBuildings(state, minutes)`
* Villageois : `stamina` 0..100, drain **par production**
* Ressources : `ResourceId` complet (farm/mine + plats)
* **Temple** produit `XP_GLOBAL` (ressource universelle)
* Allocation `XP_GLOBAL` :

  * vers Player XP (applyPlayerXp)
  * vers World WXP (convertXpToWxp + addWorldWxp banked)
* **World WXP** est une **banque**, pas de level up auto
* **Forum** :

  * `forumRankUpWorld()` consomme WXP et monte `worldLevel`
  * `restVillager()` (anti soft-lock) +30 stamina (cap 100), Forum unlocked+built
  * `recruitVillager()` via Forum : coût progressif MEAT+GOLD, nouveau villager stamina 100
* Buildings :

  * `buildBuilding(state, buildingId)` avec coûts définis dans `building/buildCosts.ts`
  * Forge a maintenant `buildings.forge` (unlocked/built/active) et actions craft/upgrade/recycle
  * Kitchen est **manuel** : `cookDish()` + recettes
* Story/Unloks :

  * Chapitres linéaires MVP
  * Chap 1 : FORUM + FARM + MINE + KITCHEN
  * Chap 2 : TEMPLE
  * Chap 4 : FORGE (+ potentiellement DONJONS plus tard)
* Save/Load offline :

  * `saveGame(state)` localStorage
  * `loadGameWithReport()` => `{ state, offlineReport }`
  * Offline progress appliqué via `applyOfflineProgress()` (cap 12h)
  * Offline report inclut : minutesAway/cappedMinutes + logs + diff ressources + staminaSpent

## Prochaine étape prévue

* UI Layout (dans un autre chat) :

  * Boot : `loadGameWithReport()`
  * Popup “offline summary” si report non-null
  * HUD + Royaume (Forum/Farm/Mine/Temple/Kitchen/Forge)
  * Autosave sur changements d’état
