# 🏰 Idle King — Buildings System (v1)

## 1. Vision

Les bâtiments du Kingdom sont des systèmes de gameplay.

Ils ne servent pas principalement à produire passivement des ressources.

Ils donnent accès à :

```txt
craft
mini-jeux
progression
économie
stockage
modes de jeu
informations royaume
buffs
future features online
````

Le Kingdom est donc :

```txt
hub central
+
meta progression layer
+
accès aux systèmes principaux
```

---

## 2. Philosophie

Chaque bâtiment doit avoir :

```txt
rôle clair
interface dédiée
mécanique propre
progression d’amélioration
liens avec d’autres systèmes
```

Un bâtiment ne doit pas être une simple card statique.

---

## 3. Liste canonique des bâtiments

### MVP / Core

```txt
Forge
Mine
Farm
Kitchen
Temple
Market
Forum
World Gate
Bank
```

### Dev only

```txt
Cornucopia
```

### Future / Online

```txt
Headquarters
```

---

## 4. États des bâtiments

Un bâtiment peut être :

```txt
locked
unlocked
built
upgradeable
maxed
```

### Locked

```txt
non disponible
condition Story / progression non remplie
```

### Unlocked

```txt
disponible à la construction
mais pas encore construit
```

### Built

```txt
construit
utilisable
```

### Upgradeable

```txt
peut être amélioré
ressources suffisantes ou conditions remplies
```

### Maxed

```txt
niveau maximum atteint
```

---

## 5. Construction

La construction est :

```txt
instantanée
```

Elle coûte :

```txt
ressources
monnaies
éventuels objets spéciaux
```

Les coûts exacts seront définis dans :

```txt
PROGRESSION.md
RECIPES.md
```

---

## 6. Unlock logic

Les bâtiments sont débloqués via :

```txt
Story
quêtes
WorldLevel
conditions spécifiques
```

Pour le MVP :

```txt
les bâtiments peuvent être tous débloqués par défaut
mais doivent être construits / améliorés
```

---

# 7. World HP / World Energy

## Principe

Le World possède ses propres ressources macro :

```txt
World HP
World Energy
```

Elles sont distinctes de :

```txt
HP joueur
Mana joueur
Stamina joueur
HP mini-jeu
Energy mini-jeu
```

---

## World Energy

World Energy sert à lancer certaines activités :

```txt
runs de mini-jeux
certains bâtiments
certains modes futurs
```

Chaque run de mini-jeu peut coûter :

```txt
World Energy
```

---

## Scaling

World Energy dépend de :

```txt
WorldLevel
```

World Energy possède :

```txt
regen passive
capacité maximale
```

---

## World HP

World HP est une ressource macro future.

Elle pourra servir à :

```txt
certains bâtiments
certains modes de jeu
certaines mécaniques de progression
```

Elle doit rester utilisée avec parcimonie pour éviter la surcharge.

---

## Level Up World

Lorsque le World gagne un niveau :

```txt
World HP reset / refill
World Energy reset / refill
```

---

# 8. Interaction avec les bâtiments

Pattern commun :

```txt
approcher du bâtiment
Press F
ouvrir une modale dédiée
utiliser les actions disponibles
lancer un mini-jeu si applicable
retour au Kingdom après run
```

Chaque bâtiment peut avoir :

```txt
tabs
actions
mini-jeu
shop
upgrade panel
status panel
```

---

# 9. Forge

## Rôle

La Forge est le bâtiment de progression des équipements.

Elle permet :

```txt
craft
upgrade
evolve
enchant
fusion
recycle
```

---

## Upgrade Forge

Améliorer la Forge permet :

```txt
débloquer de nouvelles recettes
débloquer de nouveaux types d’armes
améliorer le niveau des recettes existantes
améliorer la qualité des recettes existantes
augmenter la chance d’obtenir une meilleure qualité d’équipement
```

---

## Déblocage des armes par niveau

```txt
Forge Level 1  → Épée
Forge Level 2  → Dague
Forge Level 3  → Hache
Forge Level 4  → Espadon
Forge Level 5  → Pistolet
Forge Level 6  → Arc
Forge Level 7  → Bouclier
Forge Level 8  → Lance
Forge Level 9  → Grimoire
Forge Level 10 → Bâton
```

---

## Coûts

L’amélioration de la Forge coûte :

```txt
ressources de base
ressources rares
monnaies
```

Les recettes exactes seront définies dans :

```txt
RECIPES.md
```

---

# 10. Mine

## Rôle

La Mine permet d’obtenir :

```txt
minerais
pierres précieuses
ressources de Forge
```

Elle est principalement liée à :

```txt
Forge
Recipes
Equipment progression
```

---

## Fonctionnement

La Mine donne accès à un mini-jeu dédié.

Le mini-jeu est une sorte de :

```txt
démineur / exploration de cases
```

---

## Upgrade Mine

Améliorer la Mine augmente :

```txt
gains moyens
chance de ressources rares
performance des runs
```

---

## Mini-jeu Mine

Le joueur descend dans une mine composée de :

```txt
100 étages
```

Il commence à :

```txt
étage 0
```

Chaque run possède :

```txt
Energy de run
HP de run
```

Le lancement d’une run coûte :

```txt
World Energy
```

---

## Cases

Chaque étage est une carte carrée composée de cases.

Types de cases :

```txt
sol
roche
```

---

## Cases de sol

Le joueur peut creuser les cases de sol.

Elles peuvent contenir :

```txt
ressources
rien
ennemi
passage vers étage inférieur
```

---

## Cases de roche

Le joueur peut briser les roches.

Elles peuvent contenir :

```txt
minerais
pierres précieuses
rien
ennemi
```

---

## Révélation

Creuser une case révèle des informations sur :

```txt
cases adjacentes
```

---

## Effets des cases

```txt
ressource → collecte
rien → aucun gain
ennemi → dégâts sur HP de run
passage → déplacement vers étage inférieur aléatoire
```

---

## Fin de run

La run se termine si :

```txt
Energy de run = 0
HP de run = 0
abandon volontaire
```

Le joueur retourne au Kingdom avec :

```txt
butin collecté
```

---

# 11. Farm

## Rôle

La Farm permet d’obtenir :

```txt
ressources agricoles
ingrédients
ressources de Kitchen
```

---

## Fonctionnement

La Farm donne accès à un mini-jeu de type :

```txt
Fruit Ninja
```

---

## Upgrade Farm

Améliorer la Farm augmente :

```txt
gains moyens
chance de ressources rares
performance des runs
```

---

## Mini-jeu Farm

Chaque run possède :

```txt
Energy de run
HP de run
timer
```

Le lancement d’une run coûte :

```txt
World Energy
```

---

## Gameplay

Des fruits apparaissent sur une map fixe.

Le joueur doit les trancher avec :

```txt
attaques
skills
```

Chaque action consomme :

```txt
Energy de run
```

---

## Bombes

Certaines apparitions sont des bombes.

Si le joueur frappe une bombe :

```txt
perte de HP de run
```

---

## Timer

Une run dure :

```txt
1 minute
```

Des fruits à aura dorée peuvent apparaître.

Si le joueur touche un fruit doré :

```txt
ressources bonus
gain léger de timer
```

---

## Fin de run

La run se termine si :

```txt
timer = 0
Energy de run = 0
HP de run = 0
abandon volontaire
```

Le joueur conserve :

```txt
ressources collectées
```

---

# 12. Kitchen

## Rôle

La Kitchen permet de craft :

```txt
plats
consommables food
buffs temporaires
```

---

## Fonctionnement

Le joueur choisit :

```txt
recette
```

Puis lance :

```txt
mini-jeu associé
```

Chaque run coûte :

```txt
ingrédients de la recette
```

Si le joueur échoue :

```txt
les ingrédients sont perdus
aucun plat obtenu
```

---

## Mini-jeu Kitchen

Le mini-jeu repose sur :

```txt
réflexes
mémoire
précision
```

Le personnage est :

```txt
figé au centre de l’écran
```

---

## Manches

Le nombre de manches dépend de :

```txt
rareté de la recette
```

---

## Pattern de touches

À chaque manche :

```txt
un pattern est affiché
le joueur doit reproduire le pattern
```

Une erreur réduit :

```txt
points de succès
```

---

## Ressources projetées

Pendant le mini-jeu :

```txt
icônes de ressources apparaissent au loin
elles grossissent jusqu’à atteindre l’écran
```

Le joueur doit :

```txt
cliquer les mauvaises ressources
laisser passer les bonnes ressources
```

---

## Règles

```txt
mauvaise ressource cliquée → aucun malus
mauvaise ressource non cliquée → perte légère de succès
bonne ressource cliquée → aucun gain
bonne ressource laissée → gain léger de succès
erreur de pattern → perte modérée de succès
3 touches réussies consécutives → gain léger de succès
```

---

## Succès et qualité

La qualité du plat dépend des points de succès restants.

```txt
100 points → qualité 100
1 point   → qualité 1
0 point   → échec
```

Pas de seuil minimum.

---

## Impact qualité

La qualité influence :

```txt
puissance du buff
valeur de vente
```

La qualité n’influence pas :

```txt
durée du buff
```

---

## Upgrade Kitchen

Améliorer la Kitchen permet :

```txt
débloquer de nouvelles recettes
réduire la difficulté des recettes inférieures
```

---

# 13. Temple

## Rôle MVP

Le Temple permet de convertir :

```txt
XP_GLOBAL
```

en :

```txt
WXP
XP joueur
```

---

## Conversion

Le joueur doit pouvoir choisir :

```txt
montant converti
destination
```

Objectif :

```txt
utilisation simple
rapide
claire
```

---

## Vision future

Le Temple pourra permettre :

```txt
buffs globaux temporaires
ascension
progression spirituelle
systèmes V2 / DLC
```

---

## Upgrade Temple

Chaque niveau du Temple débloque :

```txt
un buff temporaire sélectionnable
```

Les détails seront définis plus tard.

---

# 14. Market

## Rôle

Le Market est le bâtiment économique.

Il permet :

```txt
achat
vente
special vendors
currency exchange
```

---

## Vision future

Plus tard, il pourra supporter :

```txt
online market
player trading
auction systems
```

---

# 15. Forum

## Rôle

Le Forum donne une vision globale du royaume.

Il affiche :

```txt
état du joueur
état du World
état de l’histoire
informations importantes
progression générale
```

---

## Vision future

Le Forum pourra accueillir :

```txt
quêtes
NPC hub
story summaries
conseils
events
```

---

# 16. World Gate

## Rôle

Le World Gate est le point d’entrée vers les modes de jeu.

Il donne accès à :

```txt
Story
Duel
Expeditions
Boss Rush
Abyss
Sky
Land Conquest
Spatial Conquest
AvA
```

---

# 17. Bank

## Rôle

La Bank stocke :

```txt
équipements
ressources basiques
ressources rares
ressources mobs
ressources boss
```

---

## Vision future

La Bank peut devenir :

```txt
resource vault
equipment vault
economy backbone
market dependency
guild storage dependency
```

---

# 18. Headquarters

## Statut

Headquarters est un bâtiment futur.

Il servira à :

```txt
guildes
GvG
alliances
features online
```

À détailler plus tard.

---

# 19. Cornucopia

## Statut

Cornucopia est :

```txt
dev only
```

Elle sert à :

```txt
tests
debug ressources
itérations rapides
```

Elle ne doit pas être considérée comme un bâtiment de progression final.

---

# 20. Pas de production passive

Règle importante :

```txt
les bâtiments ne génèrent pas passivement des ressources
```

Exception possible :

```txt
Temple buffs temporaires
World Energy regen
World HP regen éventuelle
```

---

# 21. Architecture recommandée

```txt
buildings/
  types.ts
  registry.ts
  unlocks.ts
  construction.ts
  upgrades.ts
  interactions.ts
  building-actions.ts
  building-ui.ts

world/
  world-resources.ts
  world-energy.ts
  world-hp.ts

minigames/
  mine/
  farm/
  kitchen/
```

---

# 22. Modèle conceptuel

```ts
type BuildingStatus =
  | "locked"
  | "unlocked"
  | "built"
  | "upgradeable"
  | "maxed";

type BuildingDef = {
  id: string;
  name: string;
  role: string;
  unlockConditions: UnlockCondition[];
  buildCost: ResourceCost[];
  maxLevel: number;
  actions: BuildingActionDef[];
};

type BuildingActionDef = {
  id: string;
  label: string;
  kind:
    | "open_modal"
    | "start_minigame"
    | "craft"
    | "convert"
    | "shop"
    | "storage"
    | "world_modes";
};
```

---

# 23. Documents liés

```txt
MINIGAMES.md
FORGE.md
ITEMS.md
RECIPES.md
STATS.md
WORLD.md
PROGRESSION.md
STORY.md
MARKET.md
BANK.md
```

---

# 24. Principe fondamental

Les bâtiments doivent être pensés comme :

```txt
des portes d’accès à des systèmes
```

et non comme :

```txt
des panneaux isolés
```

Chaque bâtiment doit rester :

```txt
data-driven
modulaire
améliorable
extensible
```

Objectif :

```txt
ajouter un bâtiment ou une mécanique
sans refactor le Kingdom entier
```


