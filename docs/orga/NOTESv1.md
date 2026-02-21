# 🎮 Idle King — Vision & Structure (Harmonisée MVP)

---

## Inspirations

* Paperclips → Idle progression & scaling exponentiel
* Tap Titans → progression automatique + reset (Renaissance)
* Harvest Moon → Farm/Mine production loop
* Tales of Wind → contenus instanciés
* Blade & Soul – The Tower → endgame scalable content

---

# 🧱 Core Architecture (MVP Offline)

## Boucle principale

1. Villageois → Production automatique (Farm / Mine / Temple)
2. Temple → produit XP_GLOBAL
3. XP_GLOBAL → allocation vers :

   * Player XP
   * World WXP (banque)
4. Forum → RankUp World
5. WorldLevel ↑ → débloque Age → débloque contenu
6. Ressources → Kitchen / Forge → Power ↑
7. Power ↑ → progression Story / Donjons (phase suivante)

---

# 🏛 Royaume (Buildings)

## Forum (Bâtiment Central)

* Gestion villageois
* RankUp World (manuel)
* Passage d’Age (plus tard)
* Gestion stamina (repos)
* Recrutement villageois (coût progressif)
* Gestion presets d’allocation (plus tard)

---

## Corne d’Abondance

* Source manuelle de ressources
* 1 ressource par click
* Faible rendement
* Early game uniquement

---

## Ferme (Production)

* Production automatique via allocation villageois
* 1 ressource/min/villager
* Ressources débloquées par Age
* Consomme stamina

---

## Mine (Production)

* Identique à Ferme
* Ressources minières uniquement
* Age gated

---

## Temple (Production XP)

* Produit XP_GLOBAL
* Allocation villageois
* Consomme stamina
* Scaling via Age

---

## Kitchen (Manuel)

* Craft manuel
* Consomme ressources
* Consomme % stamina villageois
* Produit consommables

---

## Forge (Manuel)

* Craft équipement
* Upgrade équipement
* Recycle équipement → ressources mine
* ilvl basé sur WorldLevel

---

# 🧙 Personnage

* Equipements
* Stats
* POWER = combinaison stats base + equip
* PlayerLevel bonus = stats BASE uniquement

---

# 🌍 Mondes

## Histoire principale

* 5 Ages
* 4 chapitres par Age
* Débloque buildings & systèmes

---

## Donjons (phase suivante)

* 5 runs/jour
* Récompenses répétables
* Loot + ressources

---

## Expéditions (phase suivante)

* 7 salles
* 1 run/semaine par niveau
* Leaderboard speedrun possible

---

# 🔁 Renaissance & Rang (Phase 2)

* Reset complet sauf Kingamas
* Bonus de compte
* Déblocage Rangs
* Titres : Duc → Divinité
* 4 Rangs par Titre

---

# 🏆 Leaderboards MVP Offline

* WorldLevel
* POWER
* Kingamas

---

# 🔥 Ce qu’on NE fait PAS en MVP Offline

* PvP
* Alliances
* AvA
* Hub Social
* Cieux
* Abysses
* Multi leaderboards online

---

# 🎯 Ajustements nécessaires

## Temple

Ajouter système de repos pour éviter soft-lock stamina.

## Villageois

Recrutement via Forum uniquement
Coût progressif
Cap lié au WorldLevel

---

# 🧠 Conclusion stratégique

Ton jeu a une vraie profondeur MMO-lite.

Mais ton moteur actuel est déjà cohérent si on :

* centralise villageois dans Forum
* garde production automatique via allocation
* garde Kitchen/Forge manuels
* garde XP_GLOBAL universel

---

Si tu veux, je peux maintenant :

* 🔍 Te faire un **plan de production par sprint réaliste**
* 🏗 Ou te proposer la **structure UI layout complète cohérente MVP**
* ⚖️ Ou analyser ton système Renaissance pour éviter les erreurs futures

Tu veux qu’on aille dans quelle direction ?
