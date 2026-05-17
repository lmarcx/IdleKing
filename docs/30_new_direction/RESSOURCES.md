# 🪨 Idle King — Resources System (v1)

## 1. Vision

Les ressources sont une catégorie d’items utilisée pour :

```txt
craft
upgrade
building construction
building upgrade
recipes
market exchange
future progression systems
````

Les ressources ne doivent pas être confondues avec les monnaies.

```txt
Resource ≠ Currency
```

Exemple :

```txt
Gold = ressource de type minerai
Écu = currency principale
```

---

## 2. Place dans le système d’items

Les grandes catégories d’items sont :

```txt
equipment
resources
consumables
special items
```

Les currencies sont un système séparé.

```txt
currencies
```

---

## 3. Types de ressources

Chaque ressource possède un type fixe.

Types initiaux :

```txt
bois
minerai
gemme
viande
vegetable
monstre
boss
```

Le système doit permettre d’ajouter de nouveaux types plus tard.

---

## 4. Rareté des ressources

Chaque ressource possède une rareté fixe.

Raretés possibles :

```txt
Common
Uncommon
Rare
Epic
Legendary
Mythic
Divine
Ancient
```

Pour le MVP :

```txt
rareté maximale des ressources = Mythic
```

Les raretés :

```txt
Divine
Ancient
```

seront réservées à des ressources spécifiques futures.

---

## 5. Rareté fixe

La rareté d’une ressource ne varie pas.

Exemples :

```txt
Fer = minerai Common
Ardoise = gemme Epic
Ananas = vegetable Legendary
Aiguille de l’Épouvanteur = boss Mythic
```

Une ressource ne possède pas de roll de qualité.

---

## 6. Stack

Toutes les ressources sont stackables.

Taille maximale d’un stack :

```txt
999
```

Exemple :

```txt
1350 Fer = 2 stacks
999 Fer
351 Fer
```

Cette règle permet :

```txt
inventory management
bank utility
économie lisible
```

---

## 7. Sources de ressources

Les ressources peuvent provenir de :

```txt
Mine
Farm
mob drops
boss drops
story rewards
quest rewards
Market
vendors
future modes
```

La Kitchen ne génère pas des ressources.

Elle transforme des ressources en consommables.

Exemple :

```txt
viande → plat
vegetable → plat
```

---

## 8. Usage des ressources

Les ressources sont utilisées pour :

```txt
Forge craft
Forge upgrade
Forge evolve
Forge fusion
building construction
building upgrades
Kitchen recipes
Market exchange
future guild systems
future progression systems
```

---

## 9. Relation avec la Forge

La Forge consomme principalement :

```txt
minerais
gemmes
ressources de monstres
ressources de boss
```

Exemples :

```txt
minerai → craft / upgrade
gemme → enchant / evolve
ressource de boss → evolve / high tier craft
```

Les détails seront définis dans :

```txt
RECIPES.md
```

---

## 10. Relation avec la Mine

La Mine produit principalement :

```txt
minerais
gemmes
```

Elle est donc une source majeure pour :

```txt
Forge
building upgrades
Market
```

---

## 11. Relation avec la Farm

La Farm produit principalement :

```txt
vegetables
viandes éventuelles selon design futur
ingrédients
```

Elle est donc une source majeure pour :

```txt
Kitchen
Market
```

---

## 12. Relation avec les mobs

Les mobs peuvent drop :

```txt
ressources de monstre
```

Exemples futurs :

```txt
os
griffes
crocs
venin
tissu
carapace
```

Ces ressources servent principalement à :

```txt
craft
upgrade
recipes spécifiques
```

---

## 13. Relation avec les boss

Les boss peuvent drop :

```txt
ressources de boss
```

Exemples :

```txt
Aiguille de l’Épouvanteur
cœur de boss
fragment royal
essence ancienne
```

Ces ressources sont plus rares et peuvent servir à :

```txt
evolve
craft rare
unlock recipes
building upgrades high tier
```

---

## 14. Currencies séparées

Les monnaies ne sont pas des ressources.

Exemples de currencies :

```txt
Écu
Duel Token
Boss Token
Guild Token
Abyss Shard
event currencies
```

Les currencies doivent être documentées dans :

```txt
CURRENCIES.md
```

---

## 15. Market exchange

Le Market peut permettre :

```txt
vente de ressources contre Écus
achat de ressources contre Écus
currency exchange
special vendors
```

Exemple :

```txt
Fer → Écus
Écus → gemmes
Duel Token → rewards Duel
```

---

## 16. Tradability

Toutes les ressources sont tradables.

Les restrictions futures seront définies plus tard si nécessaire.

---

## 17. Pas de qualité

Les ressources ne possèdent pas de qualité.

```txt
pas de quality roll
pas de perfect roll
pas de variation interne
```

Une ressource est définie par :

```txt
id
name
type
rarity
stack size
sources
uses
```

---

## 18. Architecture recommandée

```txt
resources/
  types.ts
  registry.ts
  rarity.ts
  stack.ts
  sources.ts
  usage.ts

currencies/
  types.ts
  registry.ts
  wallet.ts
```

---

## 19. Modèle conceptuel

```ts
type ResourceType =
  | "wood"
  | "ore"
  | "gem"
  | "meat"
  | "vegetable"
  | "monster"
  | "boss";

type ResourceDef = {
  id: string;
  name: string;
  type: ResourceType;
  rarity: ItemRarity;
  maxStack: 999;
  tradable: boolean;
};
```

---

## 20. Exemples initiaux

```txt
Fer
type: minerai
rarity: Common

Ardoise
type: gemme
rarity: Epic

Ananas
type: vegetable
rarity: Legendary

Aiguille de l’Épouvanteur
type: boss
rarity: Mythic
```

---

## 21. Documents liés

```txt
ITEMS.md
FORGE.md
RECIPES.md
BUILDINGS.md
MINIGAMES.md
MARKET.md
BANK.md
CURRENCIES.md
```

---

## 22. Principe fondamental

Les ressources sont des items stackables utilisés comme matières premières.

Elles doivent rester :

```txt
simples
lisibles
fixes
stackables
tradables
extensibles
```

Objectif :

```txt
ajouter une nouvelle ressource
sans modifier Forge / Kitchen / Market / Bank
```


