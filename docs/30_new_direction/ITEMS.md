# 📦 Idle King — Item System (v1)

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
consommables
objets spéciaux
progression
loot
craft
forge
économie future
```

Le système doit être conçu pour permettre l’ajout de nouveaux types d’items sans refactor massif.

---

## 2. Grandes catégories

Le système d’items repose sur trois familles :

```txt
Equipment
Consumables
Special Items
```

---

# 3. Equipment

Les équipements représentent les items équipables par le joueur.

---

## Equipment Slots

Slots disponibles :

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

Gestion selon le type d’arme.

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

Tous les rings sont actifs simultanément.

Vision future :

```txt
rings = modificateurs avancés de skills
```

Rôle endgame / buildcraft.

---

### Artifact

Le joueur peut équiper :

```txt
1 artifact
```

Rôle :

```txt
modifie le gameplay des armes
```

Exemples futurs :

```txt
parry perfect
axe rebound
dagger shadow clone
charged pierce
protective heal zone
```

---

# 4. Consumables

Les consommables représentent des items consommés à l’usage.

---

## Familles initiales

### Potions

Exemples :

```txt
heal potion
mana potion
stamina potion
buff potion
cleanse potion
```

---

### Food / Meals

Exemples :

```txt
plats
buffs temporaires
restoration
bonus combat
```

---

## Usage

Les consommables peuvent être utilisés :

```txt
en combat
hors combat
n’importe quand
```

---

## Stack

Les consommables sont :

```txt
stackables
```

---

# 5. Special Items

Les objets spéciaux représentent une catégorie ouverte.

Vision :

```txt
story items
quest items
keys
boss trophies
unlock tokens
special currencies
progression artifacts
future systems
```

Ils seront détaillés plus tard avec :

```txt
PROGRESSION.md
STORY.md
ECONOMY.md
```

---

## Stack

Les objets spéciaux peuvent être :

```txt
stackables
```

selon leur type.

---

# 6. Rarity System

Toutes les catégories d’items utilisent le même système de rareté.

Raretés :

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

---

## Impact de la rareté

La rareté influence :

```txt
puissance
nombre de paliers d’upgrade
potentiel build
resonance contribution
visuel
valeur économique
```

À définir plus précisément plus tard selon catégorie.

---

# 7. Item Level (ilvl)

Chaque item possède un :

```txt
Item Level
```

---

## Rôle

L’ilvl influence :

```txt
stats basiques
stats avancées
POWER
drop progression
recommandation contenu
```

---

## Philosophie

Exemple :

```txt
épée ilvl 10 common
épée ilvl 40 common
```

Même rareté.

Mais :

```txt
ilvl 40 > bien plus puissante
```

---

## Scaling

Les stats utilisent des coefficients basés sur :

```txt
ilvl
rareté
upgrade level
equipment set
```

---

# 8. Item Determinism (MVP)

Pour le MVP :

```txt
stats fixes
```

Un même item possède toujours les mêmes stats.

Exemple :

```txt
Iron Sword ilvl 10 rare
toujours mêmes stats
```

---

# 9. Future Quality System

Plus tard :

```txt
quality system
random stat rolls
affixes
ranges
item perfection
```

Exemple :

```txt
Iron Sword
82% quality
97% quality
perfect roll
```

Ce système n’est PAS MVP.

---

# 10. Equipment Sets

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

Ces sets définissent :

```txt
orientation statistique
```

---

# 11. Effect Resonance

Les équipements contribuent à :

```txt
Effect Resonance
```

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

# 12. Durability

Aucune durabilité.

```txt
pas de réparation
pas de casse
pas d’usure
```

---

# 13. Equip Restrictions

Le joueur peut équiper :

```txt
n’importe quelle arme
n’importe quel équipement
```

Pas de système de classe.

Vision :

```txt
build freedom
```

---

# 14. Inventory

Inventory :

```txt
infinite
```

Pas de limite d’espace.

Vision :

```txt
confort joueur
pas de friction inutile
```

---

# 15. Binding

Le système de binding sera défini plus tard.

Possibilités futures :

```txt
account bound
character bound
tradable
market
auction systems
```

---

# 16. Architecture recommandée

```txt
items/
  types.ts
  registry.ts
  rarity.ts
  scaling.ts
  ilvl.ts
  equipment.ts
  consumables.ts
  special.ts
  quality.ts
```

---

# 17. Modèles conceptuels

```ts
type ItemCategory =
  | "equipment"
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
  ilvl: number;
  stackable: boolean;
};
```

---

# 18. Principe fondamental

Un item est une définition data.

Jamais une logique hardcodée.

Architecture :

```txt
ItemDef
+
ScalingRules
+
RarityRules
+
OptionalSystems
```

Objectif :

```txt
ajouter 500 items
sans refactor le core
```

