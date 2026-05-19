# 🔨 Idle King — Forge System (v1)

## 1. Vision

La Forge est le bâtiment principal lié à la progression des équipements.

Elle permet au joueur de transformer les ressources obtenues en puissance durable.

La Forge soutient :

```txt
craft
upgrade
evolve
enchant
fusion
recycle
````

Pour le MVP, le système doit rester simple, puis être étendu progressivement.

---

## 2. Statut de la Forge

La Forge est :

```txt
un bâtiment du Kingdom
débloqué via la Story
améliorable plus tard
```

Les règles de progression du bâtiment Forge seront définies dans :

```txt
BUILDINGS.md
PROGRESSION.md
```

---

## 3. Fonctions de la Forge

La Forge doit pouvoir proposer plusieurs onglets :

```txt
Craft
Upgrade
Evolve
Enchant
Fusion
Recycle
```

---

## 4. Craft

Le craft permet de fabriquer :

```txt
pièces d’équipement
armes
```

La Forge ne craft pas :

```txt
consommables
```

Les consommables seront gérés par d’autres bâtiments ou systèmes.

---

## 5. Recettes

Les recettes sont :

```txt
fixes
débloquées par conditions
```

Conditions possibles :

```txt
WorldLevel
quête
boss vaincu
chapitre terminé
bâtiment amélioré
```

Les recettes seront détaillées dans :

```txt
RECIPES.md
```

---

## 6. Upgrade

L’upgrade augmente le niveau d’un item.

Règles :

```txt
100% réussite
aucun échec
coût en ressources / monnaies
```

Chaque niveau d’upgrade augmente :

```txt
stats basiques
```

Certains paliers augmentent ou débloquent :

```txt
stats avancées
```

---

## 7. Paliers d’upgrade

Les paliers dépendent de la rareté.

### Common / Uncommon

```txt
+3
+6
```

### Epic

```txt
+3
+6
+9
```

### Legendary

```txt
+3
+6
+9
+12
```

### Mythic

```txt
+3
+6
+9
+12
+15
```

### Divine

```txt
+3
+6
+9
+12
+15
+18
```

### Ancient

```txt
+3
+6
+9
+12
+15
+18
+21
```

---

## 8. Evolve

Evolve augmente la rareté d’un item.

Progression :

```txt
Common
→ Uncommon
→ Rare
→ Epic
→ Legendary
→ Mythic
→ Divine
→ Ancient
```

Règles :

```txt
conserve l’ilvl
conserve le niveau d’upgrade
coûte des ressources rares de boss
```

Evolve représente une progression long terme.

---

## 9. Enchant

Enchant permet de changer :

```txt
Equipment Set
```

d’un item.

Exemple :

```txt
Casque du Maraudeur
→ enchant
→ Casque du Pleureur
```

Enchant ne change pas :

```txt
l’ilvl
la rareté
le niveau d’upgrade
le slot
```

À préciser plus tard :

```txt
coût
limitations
ressources nécessaires
conditions de déblocage
```

---

## 10. Fusion

Fusion permet de sacrifier :

```txt
3 items
```

pour obtenir :

```txt
1 nouvel item random
```

Règles :

```txt
résultat totalement random
niveau d’upgrade reset
rareté potentiellement supérieure
```

À préciser plus tard :

```txt
probabilités
pool d’items
coûts additionnels
limitations
```

---

## 11. Recycle

Recycle détruit un item et ne rembourse pas les ressources de recette.

Règles Phase 8A :

```txt
item détruit définitivement
50% de la valeur PLACEHOLDER de l'item rendue en ECU
chance PLACEHOLDER de recevoir une Precious Stone de la même rareté
```

Exemple :

```txt
Legendary item recyclé
-> ECU refund
-> chance de Precious Stone Legendary
```

Les valeurs et tables de conversion complètes seront définies dans :

```txt
RECIPES.md
```

---

## 12. Ressources Forge

Pour le MVP, les ressources restent génériques.

Les ressources précises seront définies avec :

```txt
RECIPES.md
ITEMS.md
BUILDINGS.md
```

Exemples futurs possibles :

```txt
minerais
bois
pierres
fragments rares
ressources de boss
monnaies spéciales
```

---

## 13. Relation avec les autres systèmes

La Forge est liée à :

```txt
EQUIPMENTS.md
WEAPONS.md
EQUIPMENT_SETS.md
EFFECT_SETS.md
STATS.md
RECIPES.md
BUILDINGS.md
PROGRESSION.md
```

---

## 14. MVP Scope

Pour le MVP, la Forge doit prioriser :

```txt
Craft
Upgrade
Recycle
```

Systèmes documentés mais pouvant arriver plus tard :

```txt
Evolve
Enchant
Fusion
```

---

## 15. Architecture recommandée

```txt
forge/
  types.ts
  craft.ts
  upgrade.ts
  evolve.ts
  enchant.ts
  fusion.ts
  recycle.ts
  recipes.ts
  costs.ts
```

---

## 16. Modèles conceptuels

```ts
type ForgeAction =
  | "craft"
  | "upgrade"
  | "evolve"
  | "enchant"
  | "fusion"
  | "recycle";

type CraftRecipeDef = {
  id: string;
  outputItemId: string;
  costs: ResourceCost[];
  unlockConditions: UnlockCondition[];
};

type UpgradeRuleDef = {
  rarity: ItemRarity;
  maxLevel: number;
  advancedStatBreakpoints: number[];
};
```

---

## 17. Principe fondamental

La Forge ne doit pas contenir les règles complètes des items.

Elle doit consommer des définitions externes :

```txt
items
recipes
rarities
resources
equipment sets
```

Objectif :

```txt
ajouter un item ou une recette
sans modifier la logique Forge
```

