# 🎮 Idle King — Level Design (v2)



## 🧭 Vision

Les niveaux jouables dans *Idle King* sont des **contenus instanciés modulaires**, principalement des **donjons**, qui constituent le cœur du gameplay PvE.

Ils doivent être :

* **rejouables**
* **structurés**
* **extensibles**
* **compatibles multi-modes**



## 🧩 Architecture globale

### 🟦 Modes (Worlds)

```ts
type WorldMode =
  | "story"
  | "duel"
  | "expedition"
  | "boss_rush"
  | "abyss"
  | "sky"
  | "land_conquest"
  | "spatial_conquest"
  | "ava";
```



### 🟨 Types de contenu jouable

```ts
type PlayableContentKind =
  | "dungeon"
  | "arena"
  | "open_map"
  | "boss_encounter"
  | "pvp_instance"
  | "scripted_event";
```



### 🟥 Types d’encounters

```ts
type EncounterKind =
  | "mob"
  | "elite"
  | "boss"
  | "player"
  | "npc";
```



## 🏰 Donjons

### 🧭 Définition

Un donjon est un **contenu instancié** composé de :

* une ou plusieurs salles
* des objectifs successifs
* des encounters (mobs / boss)
* des événements



## 🧱 Structure interne d’un donjon

### 🏗 Types de structure possibles

Un donjon peut être :

```txt
- une seule salle
- plusieurs salles successives
- plusieurs salles avec retour arrière
- plusieurs étages
- un mix selon le design
```



### 🚪 Transition entre salles

Le passage entre salles peut se faire via :

```txt
- porte physique
- changement d’instance
- élément interactif
```

Le joueur peut :

```txt
- revenir en arrière
- rester dans la même instance (si design ouvert)
```



### 🎯 Objectifs par salle

* Chaque salle peut avoir **son propre objectif**
* Les objectifs sont **persistants pendant la run**

#### Règle importante :

```txt
Si le joueur revient dans une salle déjà complétée :
→ l’objectif reste validé
→ il ne peut pas être refait
```



## 🚫 Checkpoints

* Aucun checkpoint réutilisable par le joueur
* Mais des checkpoints internes pour :

```txt
- suivre la progression dans la run
- structurer les étapes du donjon
```



## 📜 Scripts narratifs

### 🔄 Déclencheurs autorisés

```txt
- entrée dans une salle
- approche d’un POI
- début d’un boss
- mort d’un boss
- interaction objet / PNJ
- fin d’un dialogue spécifique
- validation d’un objectif
- retour au Kingdom après contenu
```

---

### ❌ Déclencheurs interdits

```txt
- entrée globale du donjon (car lancé depuis un hub)
```



### 🔁 Comportement en replay

Si le donjon est déjà complété :

```txt
- suppression des objectifs
- suppression des scripts narratifs
- conservation du gameplay pur (combat / exploration)
```



## 🧠 Encounters

### 🧍 Mobs

Les mobs peuvent être :

```txt
- placés à la main
- liés à une salle
- générés par vagues
```



### 💀 Boss

Les boss sont :

* présents dans Story (donjons)
* présents dans Duel (offline)

#### Positionnement :

```txt
- généralement à la fin
- mais peuvent être :
  - au milieu
  - multiples
  - optionnels
  - cachés
```



## 🧩 Énigmes

Les énigmes sont volontairement simples et basées sur :

```txt
- interrupteurs
- activation d’objets
- utilisation de ressources temporaires
```



## 🧱 Système de level

Un level doit pouvoir contenir :

```txt
- exploration libre
- mobs
- boss
- objectifs
- POI
- PNJ/dialogues
- timer
- vagues d’ennemis
- zones verrouillées
- événements scriptés
- énigmes simples
- éléments interactifs
- sortie volontaire
- échec possible
- récompense finale
```



## 🎯 Objectifs

```txt
- tuer tous les ennemis
- battre un boss
- survivre X minutes
- collecter / ramener ressources
- activer un objet
- protéger une cible
- escorter une cible
- résoudre un événement
- explorer X % de la map
```

➡️ Extensible à volonté.



## ⚔️ Duel

### 🎯 Rôle actuel

```txt
- test de boss
- combat offline contre boss
```

### 🔮 Vision future

```txt
- PvP 1v1 online
- mode hybride (IA / boss / joueur)
```



## 🧱 Récompenses

### 🔁 Récompenses répétables

```txt
- XP joueur
- XP globale
- ressources
- équipements
- consommables
- monnaie spéciale
```



### 🟡 Récompenses uniques

```txt
- déblocage bâtiment
- déblocage chapitre
- script narratif
```

(+ cosmétique et titres plus tard)



## 💀 Mort & sortie

### 💀 Mort

```txt
- le joueur conserve tout son loot
- choix :
  - recommencer
  - retourner au Kingdom
```



### 🚪 Sortie volontaire

```txt
- conserve tout ce qu’il a obtenu
- ne reçoit pas la récompense finale
```



## 🔁 Rejouabilité

Tous les contenus sont rejouables :

```txt
- Story
- Donjons
- Boss
- Duel offline
```

➡️ Sans limite pour le MVP.



## 🧱 Extensibilité

Le système doit permettre d’ajouter facilement :

```txt
- nouveaux types de salles
- nouveaux objectifs
- nouveaux scripts
- nouveaux encounters
- nouvelles mécaniques
- nouveaux modes de jeu
```



## 🔗 Liens

* `STORY_CHAPTERS.md`
* `COMBAT.md`
* `ENEMIES.md`
* `BOSS.md`
* `SKILLS.md`
* `BUILDINGS.md`



## 📌 Principe fondamental

> Un donjon est une **suite d’espaces gameplay persistants dans une run**, où la progression est linéaire mais navigable, et où la narration dépend de l’état du joueur.