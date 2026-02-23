# UI Base (MVP Offline)

Version: V1 (MVP)
Plateforme: Web (desktop-first, responsive ensuite)
Mode: Offline (localStorage)
Multijoueur MVP: Leaderboards **locaux** uniquement (records device)

---

## 1) Objectifs UI (MVP)

* Donner une **structure claire et stable** (layout constant)
* Rendre la boucle gameplay lisible :

  * Ressources / Villageois / Stamina
  * Production (Farm/Mine/Temple)
  * Dépenses (Build / Craft / Upgrade / Recycle)
  * Progression (Chapitres, XP_GLOBAL, World WXP bank + rank up via Forum)
* Supporter l’onboarding via **Boto** (robot + dialogues)
* Permettre :

  * Nouvelle partie
  * Charger partie
  * Save auto + offline progression + résumé au retour

---

## 2) Navigation globale

### 2.1 Écrans “Hors partie”

* **Start Screen**

  * Bouton: “Nouvelle partie”
  * Bouton: “Charger partie”
  * Bouton: “Effacer sauvegarde” (optionnel, caché derrière confirm)
* **Load Flow**

  * Si save existe → charger
  * Sinon → message “Aucune sauvegarde”

### 2.2 Écrans “En partie”

Layout constant :

* **Menu gauche** (navigation principale)
* **Fenêtre principale centrale** (contenu actif)
* **Panneau droit** (ressources + indicateurs rapides)
* (Optionnel) **Barre haute** (titre du contenu + boutons rapide)

Menus (MVP) :

1. **Boto**
2. **Personnage**
3. **Inventaire**
4. **Mondes**
5. **Royaume**
6. **Compétences** (stub MVP)
7. **Paramètres**

---

## 3) Layout principal “In-Game”

### 3.1 Colonne gauche — Menu principal

* Icône + label
* État actif (highlight)
* Badges optionnels (ex: “!” si action importante)

Entrées :

* Boto
* Personnage
* Inventaire
* Mondes
* Royaume
* Compétences (MVP: “WIP”)
* Paramètres

### 3.2 Fenêtre centrale — “Main Window”

Affiche le contenu du menu sélectionné.
Au début du jeu, c’est **Boto** (robot + dialogues).

### 3.3 Colonne droite — Panneau Ressources (HUD)

Contenu MVP :

* Bloc “Ressources” (scroll)

  * chaque ressource : icône, nom, quantité
* Bloc “Progression”

  * Player Level + Player XP (option)
  * World Level + World WXP bank
  * XP_GLOBAL (ressource)
* Bloc “Villageois”

  * Total villageois
  * Stamina totale (somme)
  * “Fatigués” (nb stamina=0)
* Bouton debug (dev only): “+60 min” (plus tard)

Comportement :

* Toujours visible
* Peut être réduit (collapse) sur petit écran

---

## 4) Écran Boto (Robot / Dialogue)

### 4.1 Rôle

* Onboarding & narration
* Tutoriel “pas à pas”
* Guide UI (expliquer où cliquer)
* Déclencher des actions scénarisées (déblocages, objectifs)

### 4.2 Composition

* Zone robot (portrait / animation)
* Zone texte (bulles)
* Choix de dialogues (1 à 4 options)
* Historique court (scroll)

### 4.3 États Boto (MVP)

* `INTRO` : introduction + demande de nom (plus tard)
* `GUIDE_UI` : “ouvre Royaume”, “construis Ferme”, etc.
* `IDLE` : dialogues génériques
* `QUEST_HINT` (stub) : “tu devrais faire X”

### 4.4 Interaction

* Le joueur choisit une option parmi celles disponibles
* Le choix peut :

  * afficher une réponse
  * déclencher un objectif
  * ouvrir automatiquement un menu (option)
  * “highlight” un bouton/zone UI (plus tard)

---

## 5) Personnage (MVP)

### 5.1 Objectif

* Voir les stats principales
* Équiper des items (si inventaire items MVP)
* Voir POWER (si calcul disponible)

### 5.2 Sections

* Profil (nom, avatar placeholder)
* Stats (attaque, hp, armor…)
* Equipement (slots: weapon/armor/ring/amulet)
* Boutons actions (stub):

  * “Équiper depuis inventaire”
  * “Déséquiper”

---

## 6) Inventaire (MVP)

### 6.1 Objectif

* Voir tous les items et ressources craftables
* Interactions simples par catégorie

### 6.2 Onglets

* Équipements
* Ressources
* Consommables (plats)
* Unique (stub)

### 6.3 Actions MVP

* Équipement : inspect / upgrade (via Forge) / recycle (via Forge)
* Ressources : lecture seule (MVP)
* Consommables : lecture seule (MVP, utilisation plus tard)

---

## 7) Mondes (MVP)

### 7.1 Structure

* **Le Monde Originel** = Histoire principale (MVP)
* **Mondes alternatifs** = Donjons / Expéditions / Cieux / Abysses (hors MVP)

### 7.2 Monde Originel (Histoire)

* Liste chapitres (linéaire)
* Chapitre courant:

  * texte narratif placeholder
  * bouton “Continuer / Terminer chapitre”
* À la validation d’un chapitre :

  * applyUnlocks
  * éventuels gains (plus tard)

### 7.3 Mondes alternatifs (hors MVP)

* Stub “Bientôt disponible”
* UI prévue :

  * Donjons (daily)
  * Expéditions (weekly)
  * Cieux / Abysses (endgame)

---

## 8) Royaume (MVP)

### 8.1 Objectif

* Construire et gérer les bâtiments
* Gérer villageois (allocations) + stamina (repos via Forum)
* Produire ressources / XP_GLOBAL

### 8.2 Vue principale

* Liste / grille de bâtiments (cards)

  * état: locked / unlocked / built
  * actions:

    * Build (si unlocked & pas built)
    * Activate/Deactivate (si built)
    * Open (détails bâtiment)

Bâtiments MVP :

* Forum
* Corne d’Abondance (manuel)
* Ferme
* Mine
* Temple
* Kitchen
* Forge

### 8.3 Forum (MVP)

* Rank Up World (consomme WXP bank, conditions affichées)
* Recrutement villageois (coût MEAT+GOLD progressif)
* Repos villageois (restore stamina +30, cap 100)
* Liste villageois (id + stamina)

### 8.4 Ferme / Mine / Temple (MVP)

* Toggle active
* Allocation villageois par ressource
* Preview production / minute
* Indicateur stamina drain / minute (simple)

Temple :

* Produit XP_GLOBAL (pas WXP)
* Allocation = nombre de villageois vers XP_GLOBAL

### 8.5 Kitchen (MVP)

* Liste recettes (Stew, Salad…)
* Sélection villageois
* Bouton “Cuisiner”
* Affiche coût ressources + coût stamina (%)
* Résultat : ajoute PLATE_* + drain stamina

### 8.6 Forge (MVP)

* Craft item (recettes)
* Upgrade item (consomme GOLD, stamina)
* Recycle item (rend ressources mine only)
* Inventaire list + actions par item

---

## 9) Compétences (MVP Stub)

* Écran placeholder
* Mention “Débloqué plus tard”
* Prévoir layout futur :

  * arbre
  * slots équipés (5)
  * upgrade

---

## 10) Paramètres (MVP)

* Bouton “Retour écran titre” (sans perdre save)
* Bouton “Exporter save JSON” (optionnel)
* Bouton “Importer save JSON” (optionnel)
* Bouton “Effacer sauvegarde”
* Options UI (son, etc. stub)

---

## 11) Sauvegarde & Offline Summary (MVP)

### 11.1 Save

* Autosave à chaque action importante (build/craft/upgrade/recycle/alloc/rankup)
* Autosave périodique (optionnel)

### 11.2 Load + Offline Progress

* Au chargement : simulation ticks manqués (cap 12h)
* Générer `offlineReport` :

  * minutesAway / cappedMinutes
  * resourcesGained
  * staminaSpent
  * logs (debug)

### 11.3 Offline Summary Popup (MVP)

* Modal au début si `offlineReport != null`
* Affiche :

  * “Vous étiez absent X minutes (cap Y)”
  * Gains principaux (top 5 ressources positives)
  * Stamina dépensée
  * Bouton “OK”

---

## 12) Conventions UI / UX

* Actions impossibles :

  * bouton disabled + raison claire
* Feedback :

  * toast “Réussi” / “Pas assez de ressources” / “Villageois épuisé”
* Cohérence :

  * même pattern pour Build / Craft / Upgrade
* MVP Desktop :

  * layout 3 colonnes stable
* Responsive plus tard :

  * panneau ressources collapsible

---

## 13) Hors MVP (réservé)

* PvP
* Alliances / AvA
* Hub social
* Donjons/Expéditions/Cieux/Abysses complets
* Leaderboards online
* Monetisation / Events / Pass
* Renaissance / Rangs / Titres

---

## 14) Routing / URLs (Web)

Objectifs :

* Navigable via URL (utile debug + dev)
* Un seul layout in-game, onglets via query ou segments
* Compatible Next.js (app router) ou React Router

### 14.1 Routes “hors partie”

* `/` : Start Screen
* `/game` : redirige vers `/game/boto` si save chargée, sinon vers `/`
* `/game/new` : force nouvelle partie (confirmation)
* `/game/load` : charge save (si absent → `/`)

### 14.2 Routes “en partie” (layout constant)

Format recommandé :

* `/game/:tab`

Tabs MVP :

* `/game/boto`
* `/game/character`
* `/game/inventory`
* `/game/worlds`
* `/game/kingdom`
* `/game/skills` (stub)
* `/game/settings`

Sous-routes (MVP) :

* `/game/kingdom/forum`
* `/game/kingdom/farm`
* `/game/kingdom/mine`
* `/game/kingdom/temple`
* `/game/kingdom/kitchen`
* `/game/kingdom/forge`
* `/game/worlds/original` (histoire)
* `/game/worlds/alt` (stub)

> Alternative (query) : `/game?tab=kingdom&sub=farm`
> Mais les segments sont plus lisibles pour le dev et la suite.

---

## 15) Spécification composants UI (MVP)

### 15.1 Layout

* `GameLayout`

  * slots : `LeftNav`, `MainWindow`, `RightHud`
  * props : `activeTab`, `onNavigate(tab)`
* `LeftNav`

  * items : `NavItem[] { id, label, icon, href, badge? }`
* `RightHud`

  * sections : `ResourcesPanel`, `ProgressPanel`, `VillagersPanel`

### 15.2 HUD / Panels

* `ResourcesPanel`

  * liste `ResourceRow`
  * filtre (option) : “All / Farm / Mine / Special”
  * recherche (later)
* `ResourceRow`

  * icon + name + qty
  * highlight si qty a augmenté depuis offline summary (later)
* `ProgressPanel`

  * `PlayerLevelBadge`
  * `WorldLevelBadge`
  * `WxpBankRow`
  * `XpGlobalRow`
* `VillagersPanel`

  * total
  * stamina total
  * fatigued count
  * bouton “Manage” → Forum

### 15.3 Boto

* `BotoScreen`

  * `RobotPortrait`
  * `DialogueWindow`
  * `DialogueChoices`
* `DialogueWindow`

  * messages `[ { speaker, text } ]`
* `DialogueChoices`

  * 1–4 boutons
  * disabled si non disponible

### 15.4 Royaume / Buildings

* `KingdomScreen`

  * `BuildingGrid`
  * `BuildingCard`
* `BuildingCard`

  * state : locked/unlocked/built/active
  * actions : Build / Open / Activate
* `BuildingDetailsLayout`

  * header (name, state, toggle)
  * body (controls)
  * footer (actions)

### 15.5 Forum

* `ForumScreen`

  * `WorldRankUpCard`
  * `RecruitVillagerCard`
  * `RestVillagerCard`
  * `VillagerList`
* `VillagerRow`

  * stamina bar
  * actions: Rest (button)
  * future: assign to building

### 15.6 Farm/Mine/Temple allocations

* `AllocationScreen`

  * `AllocationTable`
  * `AllocationRow`
  * `ProductionPreview`
* `AllocationRow`

  * resource label + qty/min per worker
  * input number (workers)
  * clamp indicator (max workers)
* `ProductionPreview`

  * total/min
  * stamina drain/min (simple)

### 15.7 Kitchen

* `KitchenScreen`

  * `RecipeList`
  * `RecipeCard`
  * `VillagerSelect`
  * `CookButton`
* `RecipeCard`

  * cost list
  * output list
  * stamina cost %

### 15.8 Forge

* `ForgeScreen`

  * `ForgeCraftPanel`
  * `InventoryPanel`
  * `ItemCard`
* `ItemCard`

  * name, slot, rarity, ilvl
  * actions : Upgrade / Recycle
  * inspect (later)

### 15.9 Modals / Feedback

* `OfflineSummaryModal`

  * minutesAway/capped
  * top resource gains
  * stamina spent
  * button “OK”
* `ConfirmModal`

  * “Effacer save”, “Nouvelle partie”
* `Toast`

  * success/error/info

---

## 16) Wireframes textuels (écrans MVP)

### 16.1 Start Screen (`/`)

```
[Idle King Logo]

(Primary) New Game
(Secondary) Load Game   [disabled if no save]
(Tertiary) Clear Save   [confirm modal]
```

### 16.2 Game Layout (global)

```
+--------------------------------------------------------------+
| LeftNav            | Main Window                 | Right HUD |
|--------------------|-----------------------------|-----------|
| Boto               | [Active Screen Content]     | Resources |
| Character          |                             | - STONE   |
| Inventory          |                             | - WOOD    |
| Worlds             |                             | ...       |
| Kingdom            |                             | Progress  |
| Skills (WIP)       |                             | Villagers |
| Settings           |                             |           |
+--------------------------------------------------------------+
```

### 16.3 Offline Summary Modal (au load)

```
[Modal] While you were away...
- Away: 73 min (simulated: 73 min)
- Gains:
  + WOOD +120
  + STONE +95
  + XP_GLOBAL +40
- Stamina spent: 180

[OK]
```

### 16.4 Boto (`/game/boto`)

```
[Robot Portrait]

Dialogue:
Boto: "Welcome..."
Player: "..."

Choices:
[1] "Who are you?"
[2] "Show me the Kingdom"
[3] "Let's continue"
[4] (locked) "Skip tutorial"
```

### 16.5 Worlds (`/game/worlds`)

```
Cards:
- The Original World (Story)  [Open]
- Alternate Worlds (WIP)      [Open -> stub]
```

### 16.6 Story (`/game/worlds/original`)

```
Header: Age I - Chapters

List:
- Chapter 1 [Completed / Current / Locked]
- Chapter 2 [...]
...

Main:
[Story text]
[Continue / Complete Chapter] (primary)
```

### 16.7 Kingdom overview (`/game/kingdom`)

```
Building Grid:
[Forum]    state: unlocked/built?  [Build/Open] [Active toggle]
[Farm]     ...
[Mine]     ...
[Temple]   ...
[Kitchen]  ...
[Forge]    ...
[Abundance Horn] (manual) ...
```

### 16.8 Forum (`/game/kingdom/forum`)

```
[World Rank Up]
World Level: 12
WXP Bank: 340 / 420
[Rank Up] (disabled: reason)

[Recruit Villager]
Cost: MEAT 8, GOLD 4
[Recruit]

[Rest Villager]
Select villager dropdown/list
[Rest +30 stamina]

[Villagers List]
v1  stamina ███████░░ 72
v2  stamina █████░░░░░ 55  [Rest]
...
```

### 16.9 Farm (`/game/kingdom/farm`)

```
Header: Farm (built/active toggle)

Allocation Table:
Resource   Workers   Prod/min
WOOD       [ 3 ]     3/min
STONE      [ 2 ]     2/min
WATER      [ 0 ]     0/min
MEAT       [ 0 ]     0/min

Total workers: 5 / 7
Total prod/min: 5
Stamina drain/min: 5
```

### 16.10 Mine (`/game/kingdom/mine`)

Même pattern, ressources mine.

### 16.11 Temple (`/game/kingdom/temple`)

```
Header: Temple (built/active toggle)

Allocate workers to XP_GLOBAL:
XP_GLOBAL workers [ 2 ]

XP_GLOBAL / min (preview): X
Stamina drain/min: 2
```

### 16.12 Kitchen (`/game/kingdom/kitchen`)

```
Header: Kitchen (built/active toggle)

Recipes:
[Stew]
Cost: MEAT 2, WATER 1
Output: PLATE_STEW 1
Stamina: 25%
Select villager: [v1]
[Cook]

[Salad]
Cost: WATER 1, CARROT 1, TOMATO 1
Output: PLATE_SALAD 1
Stamina: 20%
Select villager: [v2]
[Cook]
```

### 16.13 Forge (`/game/kingdom/forge`)

```
Header: Forge (built/active toggle)

Craft:
[BASIC_SWORD]
Cost: COPPER 3
Stamina: 25%
Select villager: [v1]
[Craft]

Inventory:
Item: Sword (COMMON) ilvl 240
[Upgrade] cost: GOLD X   stamina: 20%
[Recycle] -> mine resources
```

### 16.14 Inventory (`/game/inventory`)

```
Tabs: [Equipment] [Resources] [Consumables] [Unique(WIP)]

Equipment list:
- Sword COMMON ilvl 240 [Upgrade] [Recycle]

Resources list:
- WOOD 120
- STONE 95
...
```

### 16.15 Settings (`/game/settings`)

```
[Back to Title]
[Export Save JSON] (optional)
[Import Save JSON] (optional)
[Clear Save] (confirm)
```

---

## 17) Notes d’implémentation UI (MVP)

* Le layout doit être constant : seules les vues centrales changent.
* Les actions doivent renvoyer des erreurs typées (`reason`) → UI affiche une raison claire.
* Tous les boutons “Build/Craft/RankUp” doivent :

  * afficher le coût
  * se désactiver si impossible
  * proposer un feedback (toast)

