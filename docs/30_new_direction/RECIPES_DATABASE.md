# RECIPES DATABASE — IdleKing (V2)

## Purpose

This document defines the canonical crafting ecosystem of IdleKing.

It covers:
- forge recipes
- kitchen recipes
- story catalysts
- upgrade economy
- boss material usage
- item economic value foundations

Scope:
- Prologue
- Chapter I — Era Funèbre
- Chapter II — Era Glaciaire

---

# 1. Crafting Philosophy

Crafting is a core progression pillar.

Players are expected to:
- farm enemies
- replay dungeons
- replay bosses
- gather resources
- mine
- farm
- trade
- recycle gear

Crafting is intentionally:
- grind-oriented
- replay-oriented
- economy-driven

---

# 2. Recipe Categories

Canonical recipe types:

```txt
forge_weapon
forge_armor
forge_accessory
kitchen_food
story_catalyst
upgrade_material
```

Future:
- enchant
- evolve
- fusion
- relic crafting

---

# 3. Economic Formula

## Resource Value

Defined in:

```txt
RESOURCES_DATABASE.md
```

---

## Item Value Formula

Canonical placeholder:

```txt
item_value =
sum(resource_value × quantity)
```

---

## Derived Economy

```txt
market_sell = floor(item_value × 0.75)
market_buy = ceil(item_value × 1.5)
recycle = floor(item_value × 0.5)
```

Placeholder only.

---

# 4. Multi-Rarity Crafting

Every craftable equipment may roll:

```txt
Common
Uncommon
Rare
Epic
Legendary
```

---

## Important Rule

Recipes craft:
- a base item
- with a generated rarity roll

Example:

```txt
Craft → Rusted Sword
Result → Legendary Rusted Sword
```

---

## Rarity Probabilities

Placeholder philosophy:

```txt
Common     → very frequent
Uncommon   → frequent
Rare       → uncommon
Epic       → rare
Legendary  → extremely rare
```

Bosses and higher difficulties may improve odds.

---

# 5. Forge Philosophy

---

## Generic Equipment

Always available once unlocked.

Examples:
- Rusted Sword
- Bone Knife
- Hunter Bow

---

## Boss-Themed Equipment

Acquisition:

```txt
rare direct drop
OR
recipe unlock after boss defeat
```

Boss materials are mandatory.

---

## Future Ultra Rare Recipes

Reserved for:
- cross-era gear
- hybrid materials
- endgame crafting

Not MVP.

---

# 6. Weapon Recipes

---

# 6.1 Sword Recipes

---

## Rusted Sword

Unlock:
Forge Level 1

Ingredients:

```txt
30x Iron Ore
15x Old Wood
```

Possible rarities:
Common → Legendary

---

## Funeral Blade

Unlock:
Seigneur de la Pluie Déchu defeated

Ingredients:

```txt
45x Iron Ore
25x Ashwood
18x Shadow Residue
2x Fallen Rain Pearl
```

Theme:
Funèbre shadow corruption

---

## Royal Saber

Unlock:
Kingdom progression

Ingredients:

```txt
60x Iron Ore
20x Silver Ore
12x Quartz
```

Theme:
royal balanced sword

---

## Frostbound Longsword

Unlock:
Chapter II progression

Ingredients:

```txt
55x Cold Iron
20x Sapphire
18x Frozen Echo
2x Frost Amalgam Core
```

Theme:
glacial warfare

---

# 6.2 Axe Recipes

---

## Broken Axe

Unlock:
Forge Level 1

Ingredients:

```txt
40x Iron Ore
10x Old Wood
```

---

## Ashen Axe

Unlock:
Ombre du Dragon defeated

Ingredients:

```txt
65x Iron Ore
25x Ashwood
22x Spectral Dust
3x Dragon Ash Core
```

Theme:
dragon ash execution

---

## Frostsplitter

Unlock:
Chapter II progression

Ingredients:

```txt
60x Cold Iron
25x Frozen Echo
10x Sapphire
```

Theme:
glacial execution

---

# 6.3 Dagger Recipes

---

## Bone Knife

Unlock:
Forge Level 1

Ingredients:

```txt
15x Iron Ore
10x Tough Meat
5x Old Wood
```

---

## Frostfang Dagger

Unlock:
Amalgame du Givre defeated

Ingredients:

```txt
40x Cold Iron
15x Sapphire
15x Frozen Echo
2x Frost Amalgam Core
```

Theme:
frost assassin

---

## Spectral Shiv

Unlock:
Chapter I progression

Ingredients:

```txt
30x Iron Ore
20x Spectral Dust
10x Shadow Residue
```

Theme:
spectral corruption

---

# 6.4 Greatsword Recipes

---

## Tomb Greatsword

Unlock:
Chapter I progression

Ingredients:

```txt
70x Iron Ore
35x Ashwood
20x Spectral Dust
```

---

## Dragonbone Greatsword

Unlock:
Ombre du Dragon defeated

Ingredients:

```txt
90x Iron Ore
45x Ashwood
25x Spectral Dust
5x Dragon Ash Core
```

Theme:
dragon remains

---

# 6.5 Spear Recipes

---

## Ashen Spear

Unlock:
Ombre du Dragon defeated

Ingredients:

```txt
50x Iron Ore
30x Ashwood
20x Spectral Dust
3x Dragon Ash Core
```

---

## Frostpiercer

Unlock:
Chapter II progression

Ingredients:

```txt
55x Cold Iron
20x Sapphire
18x Frozen Echo
```

---

# 6.6 Bow Recipes

---

## Hunter Bow

Unlock:
Forge Level 1

Ingredients:

```txt
20x Old Wood
10x Tough Meat
```

---

## Funeral Longbow

Unlock:
Chapter I progression

Ingredients:

```txt
40x Ashwood
15x Spectral Dust
10x Shadow Residue
```

---

## White Frost Bow

Unlock:
Chapter II progression

Ingredients:

```txt
45x Frostpine
18x Frozen Echo
12x Sapphire
```

---

# 6.7 Pistol Recipes

---

## Rusted Pistol

Unlock:
Forge Level 5

Ingredients:

```txt
35x Iron Ore
20x Silver Ore
10x Quartz
```

---

## Frostfire Pistol

Unlock:
Chapter II progression

Ingredients:

```txt
55x Cold Iron
25x Sapphire
15x Frozen Echo
```

Theme:
frost combustion

---

# 6.8 Staff Recipes

---

## Arathas Staff

Unlock:
Archimage defeated

Ingredients:

```txt
35x Silver Ore
25x Sapphire
22x Frozen Echo
3x Archmage Sigil
```

---

## Frostcaller Staff

Unlock:
Chapter II progression

Ingredients:

```txt
40x Frostpine
20x Sapphire
18x Frozen Echo
```

---

# 7. Offhand Recipes

---

# 7.1 Shield Recipes

---

## Rusted Shield

Ingredients:

```txt
35x Iron Ore
15x Old Wood
```

---

## Dragon Ash Shield

Unlock:
Ombre du Dragon defeated

Ingredients:

```txt
65x Iron Ore
30x Ashwood
5x Dragon Ash Core
```

---

## Frozen Royal Shield

Unlock:
Allaeva defeated

Ingredients:

```txt
70x Cold Iron
25x Sapphire
3x Frozen Queen Tear
```

---

# 7.2 Grimoire Recipes

---

## Icebound Grimoire

Unlock:
Chapter II progression

Ingredients:

```txt
25x Sapphire
20x Frozen Echo
2x Archmage Sigil
```

---

## Hollow Scripture

Unlock:
Chapter I progression

Ingredients:

```txt
18x Spectral Dust
15x Shadow Residue
```

---

# 8. Armor Recipes

Each set contains:

```txt
helmet
chest
cape
gloves
belt
boots
```

Armor pieces share similar recipe structures.

---

# 8.1 Maraudeur Set

Theme:
survival / scavenger

Example piece recipe:

```txt
25x Old Wood
20x Tough Meat
10x Iron Ore
```

---

# 8.2 Vagabond Set

Theme:
mobility / exploration

Example piece recipe:

```txt
18x Old Wood
15x Tough Meat
12x Quartz
```

---

# 8.3 Pleureur Set

Theme:
spectral sustain

Example piece recipe:

```txt
35x Ashwood
25x Spectral Dust
15x Shadow Residue
```

---

# 8.4 Flageleur Set

Theme:
execution / aggression

Example piece recipe:

```txt
40x Iron Ore
22x Spectral Dust
15x Shadow Residue
```

---

# 8.5 Gardien des Cendres Set

Theme:
dragon ash defense

Example piece recipe:

```txt
45x Iron Ore
30x Ashwood
5x Dragon Ash Core
```

---

# 8.6 Docteur Set

Theme:
academy support

Example piece recipe:

```txt
30x Silver Ore
18x Sapphire
15x Frozen Echo
```

---

# 8.7 Voltigeur Set

Theme:
frost mobility

Example piece recipe:

```txt
35x Cold Iron
20x Frozen Echo
18x Sapphire
```

---

# 8.8 Reine Blanche Set

Theme:
legendary frost royalty

Example piece recipe:

```txt
50x Cold Iron
25x Sapphire
3x Frozen Queen Tear
```

---

# 9. Jewelry Recipes

---

# 9.1 Ring Recipes

---

## Royal Beam Ring

Ingredients:

```txt
10x Quartz
8x Silver Ore
5x Spectral Dust
```

Effect:
beam width increase

---

## King Aura Ring

Ingredients:

```txt
12x Quartz
10x Sapphire
5x Frozen Echo
```

Effect:
aura radius increase

---

## War Cry Ring

Ingredients:

```txt
15x Iron Ore
8x Tough Meat
```

Effect:
buff duration increase

---

## Frost Ritual Ring

Ingredients:

```txt
10x Sapphire
8x Frozen Echo
```

Effect:
frost buildup

---

# 9.2 Necklace Recipes

---

## Queen’s Tear Necklace

Unlock:
Allaeva defeated

Ingredients:

```txt
20x Sapphire
10x Pale Diamond
2x Frozen Queen Tear
```

---

## Ashen Relic Necklace

Unlock:
Ombre du Dragon defeated

Ingredients:

```txt
25x Ashwood
15x Spectral Dust
2x Dragon Ash Core
```

---

# 10. Kitchen Recipes

---

## Hearty Stew

Ingredients:

```txt
8x Tough Meat
4x Tomato
4x Carrot
```

Effect:
HP + ATK

---

## Fresh Salad

Ingredients:

```txt
5x Tomato
5x Carrot
```

Effect:
movement + energy

---

## Frozen Fish Soup

Unlock:
Chapter II progression

Ingredients:

```txt
8x Frozen Fish
5x Frostroot
```

Effect:
frost resistance

---

## Frostroot Broth

Unlock:
Chapter II progression

Ingredients:

```txt
10x Frostroot
6x Tough Meat
```

Effect:
survivability

---

# 11. Story Catalyst Recipes

---

## Kaléidoscope — Era Glaciaire Unlock

Unlock:
End Chapter I

Requirements:

```txt
minimum WLVL required
```

Ingredients:

```txt
1x Dragon Ash Core
15x Quartz
25x Spectral Dust
```

Purpose:
unlock Era Glaciaire

---

## Kaléidoscope — Era Déluge Unlock

Unlock:
End Chapter II

Requirements:

```txt
minimum WLVL required
```

Ingredients:

```txt
1x Frozen Queen Tear
10x Pale Diamond
35x Frozen Echo
```

Purpose:
unlock Era Déluge

---

# 12. Upgrade Economy

---

## Formula

Placeholder:

```txt
upgrade_cost =
item_value percentage
+ material costs
```

---

## Example Scaling

```txt
+1 = 20%
+2 = 35%
+3 = 50%
+4 = 70%
+5 = 100%
```

---

## Upgrade Materials

Possible materials:

```txt
ore
gem
forge_special
ecu
boss materials
```

---

## Forge Special Usage

Examples:

```txt
Precious Stone Common
Precious Stone Rare
Precious Stone Epic
Precious Stone Legendary
```

Obtained through:
- recycle
- rare boss drops

---

# 13. Future Systems

Reserved:
- enchant
- evolve
- fusion
- set bonuses
- cross-era recipes
- artifact crafting
- mythic/divine/ancient crafting

---

# 14. Open Questions

Future balancing:
- rarity probabilities
- recipe scaling
- upgrade scaling
- boss drop rates
- market balancing
- endgame sinks
- legendary frequency
- future rarity economy