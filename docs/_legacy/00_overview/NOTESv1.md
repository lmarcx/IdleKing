> ⚠️ **NON CANON — ARCHIVED DOCUMENT — DO NOT USE FOR IMPLEMENTATION**
>
> Archivé le 2026-06-04. Document issu de l'ancienne direction (Idle RPG / auto-combat),
> conservé pour l'historique et la traçabilité uniquement. Le canon vit dans
> `docs/30_new_direction/` — voir `DOCUMENTATION_INDEX.md`.

---
Voici une **adaptation harmonisée** de tes 3 fichiers, en gardant ta vision mais en supprimant les contradictions (MVP offline vs “online only”, boucles, ordre de prod, unlocks, et périmètre). Je me base sur ton checkpoint actuel et ton GDD  , ainsi que l’orga de phases .

---

## Ce que j’ai corrigé / aligné (sans changer ta vision)

* **MVP = offline** : donc *pas de “production passive online only”* → on parle d’un **tick offline** (1/min) + **stockage local** (persistence plus tard).
* **Séparation claire des contenus** :

  * **Histoire/Chapitres** = progression & unlocks (Ages/buildings).
  * **Donjons** = contenu leveling “répétable” (phase MVP).
  * **Expéditions** = endgame risk + leaderboard (phase suivante / post-MVP si tu veux, ou fin de MVP si scope OK).
* **XP_GLOBAL** au centre (comme ton checkpoint) : Temple produit XP_GLOBAL → allocation PlayerXP + WorldWXP → Forum = seul endroit pour RankUp World (déjà dans ton checkpoint). 
* **Stamina anti soft-lock** : ajout d’une **règle MVP minimale** (regen faible + repos via Forum) sans inventer un gros système.

---

# ✅ NOTESv1.md — v2 (Harmonisée + cohérente avec le checkpoint)

# 🎮 Idle King — Vision & Structure (MVP Harmonisé)

## Inspirations

* Paperclips → Idle progression & scaling exponentiel
* Tap Titans → progression automatique + reset (Renaissance)
* Harvest Moon → Farm/Mine production loop
* Tales of Wind → contenus instanciés
* Blade & Soul (Tower) → endgame scalable content

---

## 🧱 Core Architecture (MVP Offline)

### Boucle principale (MVP)

1. **Villageois** → production via allocations (Farm / Mine / Temple)
2. **Temple** → produit **XP_GLOBAL**
3. **XP_GLOBAL** → allocation vers :

   * **PlayerXP**
   * **WorldWXP (banque)**
4. **Forum** → **RankUp World** (manuel, dépense WorldWXP)
5. **WorldLevel** ↑ → débloque **Age** → débloque **contenu & ressources & buildings**
6. **Ressources** → Kitchen / Forge → **POWER** ↑
7. **POWER** ↑ → progression **Story / Donjons** (MVP) → puis Expéditions (post-MVP ou fin MVP selon scope)

---

## 🏛 Royaume (Buildings)

### Forum (Central)

* Gestion villageois (allocation / repos / recrutement)
* **RankUp World (manuel)** via WorldWXP
* Repos / récupération stamina (anti soft-lock MVP)
* Recrutement (coût progressif)
* Cap villageois lié au WorldLevel

### Corne d’Abondance (optionnel MVP)

* Source **manuelle** de ressources (1 ressource / click)
* Rendement faible, early game

### Ferme (passif tick 1/min)

* Production automatique selon allocation
* 1 ressource/min/villager (base)
* Ressources débloquées par Age
* Consomme stamina

### Mine (passif tick 1/min)

* Identique Ferme
* Ressources minières
* Age gated
* Consomme stamina

### Temple (passif tick 1/min)

* Produit **XP_GLOBAL**
* Allocation villageois
* Consomme stamina
* Scaling via Age / WorldLevel

### Kitchen (manuel)

* Craft manuel (consommables)
* Consomme ressources
* Consomme % stamina villageois
* Produit consommables (buffs / récup)

### Forge (manuel)

* Craft équipement
* Upgrade équipement
* Recycle équipement → **ressources mine** (MVP)
* ilvl basé sur WorldLevel

---

## 🧙 Personnage

* Equipements + Stats
* POWER = stats base + équipements (+ bonus building plus tard si besoin)
* PlayerLevel bonus = **stats base** uniquement (source secondaire de puissance endgame)

---

## 🌍 Progression

### Histoire principale (MVP)

* **5 Ages**
* **4 chapitres par Age** → 20 chapitres
* Débloque buildings & systèmes

### Donjons (MVP)

* Contenu leveling répétable
* Récompenses : XP + ressources + (loot léger si tu veux)

### Expéditions (Post-MVP / Phase suivante)

* 7 salles (Encounter/Choice…)
* Risk loadout
* Leaderboard speedrun / score

---

## 🔁 Renaissance & Rangs (Phase 2+)

* Reset complet sauf Kingamas
* Bonus de compte
* Titres : Duc → Divinité (4 rangs/titre)

---

## 🏆 Leaderboards (offline structure)

* WorldLevel
* POWER
* Kingamas

---

## ✅ Règles MVP anti soft-lock stamina

* Regen minimale (faible) **ou**
* Action “Repos” via Forum (prioritaire)
* Objectif : éviter qu’un joueur “bloque” la production trop tôt








