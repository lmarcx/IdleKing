# 📦 Idle King — Item System (v2)

## 1. Vision

Le système d’items d’Idle King doit être :

```txt
simple à comprendre
riche à long terme
scalable
modulaire
testable
````

Il doit supporter :

```txt
équipements
ressources
consommables
objets spéciaux
progression
loot
craft
forge
économie future
```

Les currencies sont un système séparé.

```txt
Items ≠ Currencies
```

---

## 2. Différence entre Items et Currencies

### Items

Les items sont des objets stockés dans l’inventaire.

Ils peuvent :

```txt
être lootés
être craftés
être stackables
être déplacés
être vendus
être stockés en banque
être consommés
être équipés
```

Les items utilisent :

```txt
inventory UI
stack logic
bank storage
```

---

### Currencies

Les currencies ne sont pas des items.

Elles sont stockées dans un wallet dédié.

Elles utilisent un affichage spécifique.

Exemples :

```txt
Écu
Duel Token
Boss Token
Guild Token
Abyss Shard
Event Currency
```

Les currencies utilisent :

```txt
wallet UI
counters
market exchange
mode rewards
economy systems
```

---

## 3. Grandes catégories d’items

Le système repose sur :

```txt
Equipment
Resources
Consumables
Special Items
```

---

# 4. Equipment

Les équipements représentent les items équipables.

---

## Equipment Slots

```txt
helmet
chest
cape
gloves
belt
boots
weapon
offhand
necklace
ring_1
ring_2
ring_3
ring_4
ring_5
artifact
```

---

## Slot Rules

### Standard Equipment

```txt
helmet
chest
cape
gloves
belt
boots
necklace
```

1 slot chacun.

---

### Weapon / Offhand

#### Arme une main

```txt
weapon = clic gauche
offhand = clic droit
```

#### Arme deux mains

```txt
weapon + offhand occupés
```

Le slot offhand reste compté pour :

```txt
Effect Resonance
```

---

### Rings

Le joueur peut équiper :

```txt
5 rings
```

Tous actifs simultanément.

Vision future :

```txt
modificateurs avancés de skills
```

---

### Artifact

Le joueur peut équiper :

```txt
1 artifact
```

Rôle :

```txt
modifier le gameplay des armes
```

---

# 5. Resources

Les ressources sont des items servant de matières premières.

Utilisation :

```txt
Forge
Kitchen
Buildings
Market
Future progression systems
```

---

## Resource Types

Types initiaux :

```txt
wood
ore
gem
meat
vegetable
monster
boss
```

Le système doit permettre l’ajout de nouveaux types.

---

## Resource Rules

Chaque ressource possède :

```txt
type fixe
rareté fixe
stack size fixe
tradability
```

Pas de :

```txt
quality roll
random rarity
```

---

## Resource Rarity

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
max rarity = Mythic
```

---

## Stack

Toutes les ressources :

```txt
stackables
max stack = 999
```

Exemple :

```txt
1350 Iron
=
999 + 351
```

---

# 6. Consumables

Les consommables sont des items consommés à l’usage.

---

## Familles

### Potions

```txt
heal potion
mana potion
stamina potion
buff potion
cleanse potion
```

---

### Food

```txt
plats
buffs temporaires
restoration
combat bonuses
```

---

### Future

```txt
scrolls
utility consumables
special combat consumables
```

---

## Usage

Utilisables :

```txt
en combat
hors combat
```

---

## Stack

Consommables :

```txt
stackables
max stack = 999
```

---

# 7. Special Items

Catégorie ouverte.

Vision :

```txt
story items
quest items
keys
unlock tokens
progression artifacts
future unique systems
```

---

## Stack

Selon définition :

```txt
stackable ou non
max stack = 999 si stackable
```

---

# 8. Equipment Sets

Les équipements peuvent appartenir à un :

```txt
Equipment Set
```

Exemples :

```txt
Maraudeur
Pleureur
Voltigeur
Docteur
Flageleur
```

Ils définissent :

```txt
orientation statistique
```

---

# 9. Effect Resonance

Slots comptés :

```txt
helmet
chest
cape
gloves
belt
boots
weapon
offhand
necklace
```

Non comptés :

```txt
rings
artifact
```

---

# 10. Rarity System

Toutes les catégories d’items peuvent utiliser le système de rareté.

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

Mais certaines catégories peuvent limiter le spectre.

Exemple :

```txt
resources MVP max = Mythic
```

---

# 11. Item Level (ilvl)

Tous les items n’ont PAS un ilvl.

L’ilvl concerne principalement :

```txt
equipment
certain future special items
```

Pas :

```txt
basic resources
currencies
most consumables
```

---

## Rôle de l’ilvl

Influence :

```txt
stats basiques
stats avancées
POWER
drop progression
recommended content
```

---

# 12. Determinism (MVP)

Pour le MVP :

```txt
stats fixes
```

Un item donné possède toujours les mêmes stats.

---

## Future

Plus tard :

```txt
quality system
random stat ranges
affixes
perfect rolls
```

---

# 13. Equip Restrictions

Le joueur peut équiper :

```txt
n’importe quelle arme
n’importe quel équipement
```

Pas de classes.

---

# 14. Inventory

Inventory :

```txt
infinite slots
```

Mais les items stackables utilisent :

```txt
max stack = 999
```

Donc :

```txt
inventory management sans hard slot cap
```

---

# 15. Tradability

MVP :

```txt
all items tradable
all resources tradable
```

Future :

```txt
binding systems possible
```

---

# 16. Durability

Aucune durabilité.

```txt
pas de casse
pas d’usure
pas de réparation
```

---

# 17. Architecture recommandée

```txt
items/
  types.ts
  equipment.ts
  resources.ts
  consumables.ts
  special.ts
  rarity.ts
  ilvl.ts
  scaling.ts

currencies/
  wallet.ts
  registry.ts
  exchange.ts
```

---

# 18. Modèles conceptuels

```ts
type ItemCategory =
  | "equipment"
  | "resource"
  | "consumable"
  | "special";

type EquipmentSlot =
  | "helmet"
  | "chest"
  | "cape"
  | "gloves"
  | "belt"
  | "boots"
  | "weapon"
  | "offhand"
  | "necklace"
  | "ring"
  | "artifact";

type ItemDef = {
  id: string;
  name: string;
  category: ItemCategory;
  rarity: ItemRarity;
  stackable: boolean;
  maxStack?: number;
};

type CurrencyDef = {
  id: string;
  name: string;
  tradable: boolean;
};
```

---

# 19. Principe fondamental

Les items sont des définitions data-driven.

Jamais des comportements hardcodés.

Objectif :

```txt
ajouter 500 items
sans refactor le core
```
