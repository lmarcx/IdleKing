# 📄 `MINIGAMES.md` — v1

````md
# 🎮 Idle King — Mini-Games System (v1)

## 1. Vision

Les mini-jeux sont des contenus actifs liés aux bâtiments du Kingdom.

Ils remplacent la production passive de ressources.

Ils doivent être :

- rejouables
- courts
- lisibles
- récompensants
- extensibles
- liés à la progression du World

---

## 2. Mini-jeux initiaux

Les mini-jeux initiaux sont :

```txt
Mine
Farm
Kitchen
````

---

## 3. Coût de lancement

Chaque run de mini-jeu coûte de la World Energy.

```txt
Mine run → World Energy
Farm run → World Energy
Kitchen run → World Energy + ingrédients
```

Le coût est fixe par activité au départ.

Il pourra être modifié plus tard par :

```txt
difficulté
modificateurs de mode
niveau de bâtiment
events
buffs
```

---

## 4. World Energy

Si le joueur n’a pas assez de World Energy :

```txt
impossible de lancer la run
```

Les donjons de la Story ne consomment pas de World Energy.

---

## 5. Ressources de run

Chaque mini-jeu peut posséder ses propres ressources internes :

```txt
Run HP
Run Energy
Run Timer
Success Points
```

Ces ressources sont propres à la run et sont reset à chaque lancement.

---

## 6. Normalisation

Les mini-jeux utilisent une version normalisée du joueur.

Objectif :

```txt
éviter qu’un build endgame trivialise les mini-jeux
```

Les attaques et skills peuvent être utilisés dans certains mini-jeux, mais avec des règles propres à la run.

---

## 7. Rewards

Les récompenses peuvent être visibles pendant la run.

Mais elles ne sont validées que si la run est réussie.

```txt
récompenses collectées pendant run
→ affichées en fin de run
→ ajoutées à l’inventaire seulement si succès
```

---

## 8. Échec

En cas d’échec :

```txt
coûts de lancement perdus
ressources collectées perdues
aucune récompense validée
```

---

## 9. Abandon

L’abandon volontaire compte comme un échec.

```txt
abandon = échec
```

---

# 10. Mine Mini-Game

## Rôle

La Mine permet d’obtenir :

```txt
minerais
gemmes
ressources liées à la Forge
```

---

## Concept

Le mini-jeu Mine est inspiré d’un démineur / exploration de cases.

Le joueur descend une mine composée de :

```txt
100 étages
```

Il commence à :

```txt
étage 0
```

---

## Run resources

Chaque run possède :

```txt
Run HP
Run Energy
```

---

## Carte

Chaque étage est une carte carrée composée de cases.

Types principaux :

```txt
cases de sol
cases de roche
```

---

## Cases de sol

Le joueur peut creuser une case de sol.

Elle peut contenir :

```txt
ressource
rien
ennemi
passage vers étage inférieur
```

---

## Cases de roche

Le joueur peut briser une case de roche.

Elle peut contenir :

```txt
minerai
gemme
rien
ennemi
```

---

## Révélation

Creuser une case révèle des informations sur les cases adjacentes.

Objectif :

```txt
permettre au joueur de déduire les risques
```

---

## Effets

```txt
ressource → ajout au butin temporaire
rien → aucun gain
ennemi → perte de Run HP
passage → déplacement vers un étage inférieur aléatoire
```

---

## Fin de run

La run échoue si :

```txt
Run HP = 0
Run Energy = 0
abandon
```

La run réussit selon les règles à définir plus précisément :

```txt
objectif atteint
sortie validée
profondeur cible atteinte
```

---

## Upgrade Mine

Améliorer la Mine augmente :

```txt
gains moyens
chance de ressources rares
performance globale des runs
```

---

# 11. Farm Mini-Game

## Rôle

La Farm permet d’obtenir :

```txt
vegetables
ingrédients
ressources liées à la Kitchen
```

---

## Concept

Le mini-jeu Farm est inspiré de Fruit Ninja.

Des fruits apparaissent sur une map fixe.

Le joueur doit les trancher avec :

```txt
attaques
skills
```

---

## Normalisation

Les attaques et skills utilisés dans la Farm sont normalisés.

Ils ne dépendent pas directement du build complet du joueur.

---

## Run resources

Chaque run possède :

```txt
Run HP
Run Energy
Run Timer
```

Durée de base :

```txt
1 minute
```

---

## Actions

Attaquer ou utiliser une skill consomme :

```txt
Run Energy
```

---

## Fruits

Toucher un fruit ajoute des ressources au butin temporaire.

---

## Bombes

Certaines apparitions sont des bombes.

Si le joueur frappe une bombe :

```txt
perte de Run HP
```

---

## Fruits dorés

Des fruits à aura dorée peuvent apparaître.

Si le joueur touche un fruit doré :

```txt
ressources bonus
léger gain de timer
```

---

## Fin de run

La run échoue si :

```txt
Run HP = 0
Run Energy = 0
abandon
```

La run réussit si :

```txt
timer terminé sans échec
```

---

## Upgrade Farm

Améliorer la Farm augmente :

```txt
gains moyens
chance de ressources rares
performance globale des runs
```

---

# 12. Kitchen Mini-Game

## Rôle

La Kitchen permet de transformer des ressources en consommables.

Exemples :

```txt
viande → plat
vegetables → plat
ingrédients → food buff
```

---

## Concept

Le mini-jeu Kitchen repose sur :

```txt
mémoire
réflexes
précision
tri de ressources
```

---

## Lancement

Le joueur sélectionne une recette.

Chaque run coûte :

```txt
World Energy
ingrédients de la recette
```

Le coût dépend de :

```txt
rareté de la recette
```

---

## Run resources

Chaque run possède :

```txt
Success Points
```

Les Success Points représentent la qualité potentielle du plat.

---

## Personnage

Pendant la run :

```txt
le personnage est figé au centre de l’écran
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
le joueur doit le reproduire
```

Une erreur entraîne :

```txt
perte modérée de Success Points
```

Une réussite de 3 touches consécutives entraîne :

```txt
gain léger de Success Points
```

---

## Ressources projetées

Pendant la run :

```txt
des icônes de ressources apparaissent au loin
elles grossissent jusqu’à atteindre l’écran
```

Le joueur doit :

```txt
cliquer les mauvaises ressources
laisser passer les bonnes ressources
```

---

## Règles de ressources projetées

```txt
mauvaise ressource cliquée → aucun malus
mauvaise ressource non cliquée → perte légère de Success Points
bonne ressource cliquée → aucun gain
bonne ressource laissée → gain léger de Success Points
```

---

## Qualité du plat

La qualité dépend des Success Points restants à la fin.

```txt
100 → qualité 100
1   → qualité 1
0   → échec
```

Il n’y a pas de seuil minimum.

---

## Échec Kitchen

Si les Success Points tombent à 0 :

```txt
échec
ingrédients perdus
World Energy perdue
aucun plat obtenu
```

---

## Réussite Kitchen

Si les Success Points sont supérieurs à 0 :

```txt
plat obtenu
qualité = Success Points restants
```

---

## Effet de la qualité

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

# 13. Difficulté

Mine, Farm et certains modes du Time Gate pourront supporter plusieurs niveaux de difficulté.

La difficulté pourra influencer :

```txt
World Energy cost
rewards
risques
rareté des ressources
modificateurs de run
```

Pour le MVP, la difficulté peut rester simple.

---

# 14. Architecture recommandée

```txt
minigames/
  types.ts
  runtime.ts
  rewards.ts
  failure.ts
  difficulty.ts

minigames/mine/
  mine-types.ts
  mine-run.ts
  mine-board.ts
  mine-reveal.ts
  mine-rewards.ts

minigames/farm/
  farm-types.ts
  farm-run.ts
  farm-spawns.ts
  farm-actions.ts
  farm-rewards.ts

minigames/kitchen/
  kitchen-types.ts
  kitchen-run.ts
  kitchen-patterns.ts
  kitchen-success.ts
  kitchen-rewards.ts
```

---

# 15. Modèle conceptuel

```ts
type MiniGameKind =
  | "mine"
  | "farm"
  | "kitchen";

type MiniGameRunState = {
  id: string;
  kind: MiniGameKind;
  worldEnergyCost: number;
  status: "running" | "success" | "failed" | "abandoned";
  temporaryRewards: RewardDef[];
};

type MiniGameResult = {
  status: "success" | "failed";
  rewards: RewardDef[];
  consumedCosts: ResourceCost[];
};
```

---

# 16. Principe fondamental

Un mini-jeu doit être traité comme une vraie run instanciée.

Il ne doit pas être une simple interaction de modal.

Chaque mini-jeu doit avoir :

```txt
coût d’entrée
état de run
conditions de réussite
conditions d’échec
récompenses temporaires
validation finale
```

Objectif :

```txt
ajouter un nouveau mini-jeu sans modifier tout le système Buildings
```


