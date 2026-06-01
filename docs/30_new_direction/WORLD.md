# 🌍 Idle King — World System (v1)

## 1. Vision

Le World représente la progression macro du joueur.

Il structure :

```txt
WorldLevel
WXP
World Energy
World HP
unlocks
accès aux activités
progression du Kingdom
````

Le World est unique pour chaque joueur.

```txt
1 joueur = 1 World
```

---

## 2. World Level

Le niveau maximum du World est :

```txt
WorldLevel max = 50
```

WorldLevel est l’un des marqueurs majeurs de progression.

Il permet de débloquer :

```txt
buildings
recettes
modes de jeu
quêtes
contenus futurs
```

---

## 3. WXP

WXP signifie :

```txt
World XP
```

C’est l’expérience utilisée pour faire progresser le World.

---

## 4. Source de WXP

Le WXP provient uniquement du :

```txt
Temple
```

Le Temple convertit :

```txt
XP_GLOBAL → WXP
```

---

## 5. Level Up World

Le passage de niveau du World est :

```txt
manuel
```

Il s’effectue au :

```txt
Forum
```

Condition :

```txt
WXP suffisant
```

Lors d’un World Level Up :

```txt
World Energy est refill
World HP est refill
nouveaux unlocks éventuels
```

---

## 6. World Energy

World Energy est une ressource macro du World.

Elle sert à lancer certaines activités.

---

## 7. Activités utilisant World Energy

World Energy peut être consommée par :

```txt
Mine
Farm
Kitchen
Duel
autres modes futurs
```

---

## 8. Blocage

Si World Energy est vide :

```txt
les activités qui en dépendent ne peuvent pas être lancées
```

---

## 9. Regen World Energy

World Energy possède :

```txt
regen passive
temps réel
offline
```

La valeur maximale et la régénération scalent avec :

```txt
WorldLevel
```

via une formule simple.

---

## 10. World HP

World HP est une ressource macro future.

Elle est réservée pour :

```txt
systèmes futurs
modes de jeu futurs
fonctionnalités avancées
```

Elle n’est pas centrale au MVP.

---

## 11. Regen World HP

World HP possède aussi :

```txt
regen passive
temps réel
offline
```

Comme World Energy, elle est refill lors d’un World Level Up.

---

## 12. Scaling

World Energy et World HP utilisent une formule simple basée sur :

```txt
WorldLevel
```

À définir précisément dans l’équilibrage.

Exemple conceptuel :

```txt
maxWorldEnergy = baseEnergy + WorldLevel × energyPerLevel
worldEnergyRegen = baseRegen + WorldLevel × regenPerLevel
```

---

## 13. Unlocks

WorldLevel peut débloquer :

```txt
buildings
building upgrades
recipes
modes de jeu
quests
future systems
```

Les règles exactes seront définies dans :

```txt
PROGRESSION.md
STORY_CHAPTERS.md
RECIPES.md
BUILDINGS.md
```

---

## 14. Relation avec les bâtiments

### Temple

```txt
produit WXP via conversion XP_GLOBAL
```

### Forum

```txt
permet le Level Up World manuel
affiche l’état du World
```

### Mine / Farm / Kitchen

```txt
consomment World Energy pour lancer des runs
```

### Time Gate

```txt
certains modes consomment World Energy
```

---

## 15. Relation avec les mini-jeux

Chaque mini-jeu possède ses ressources de run :

```txt
Run HP
Run Energy
Run Timer éventuel
```

Mais le lancement d’une run consomme :

```txt
World Energy
```

---

## 16. Architecture recommandée

```txt
world/
  types.ts
  state.ts
  wxp.ts
  level-up.ts
  world-energy.ts
  world-hp.ts
  regen.ts
  unlocks.ts
```

---

## 17. Modèle conceptuel

```ts
type WorldState = {
  level: number;
  wxp: number;

  energy: {
    current: number;
    max: number;
    lastRegenAt: number;
  };

  hp: {
    current: number;
    max: number;
    lastRegenAt: number;
  };

  unlockedBuildingIds: string[];
  unlockedRecipeIds: string[];
  unlockedModeIds: string[];
  unlockedQuestIds: string[];
};
```

---

## 18. Principes fondamentaux

Le World System doit être :

```txt
simple
lisible
scalable
extensible
```

Il doit servir de colonne vertébrale à la progression macro sans complexifier inutilement le MVP.

