# RECIPES DATABASE — IdleKing

## Purpose

This document defines crafting recipes, food recipes, story catalyst recipes, and upgrade economy rules for IdleKing.

This is a V1 source of truth.

Scope:
- Prologue
- Chapter I
- Chapter II

Future chapters will extend this database.

---

# 1. Recipe Philosophy

Recipes define:

- deterministic progression
- item economic value
- crafting identity
- building utility
- story progression gates
- economy balancing

Recipes are derived from resource values.

Core formula:

```txt
item_value = sum(resource_value * quantity)
```

Derived formulas:

```txt
market_sell = floor(item_value * 0.75)
market_buy = ceil(item_value * 1.5)
recycle = floor(item_value * 0.5)
```

These are placeholder coefficients.

---

# 2. Recipe Types

Canonical recipe families:

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
- artifact crafting

---

# 3. Forge Craft Philosophy

---

## Generic Equipment

Always craftable once unlocked.

Purpose:
baseline progression

Examples:
- Rusted Sword
- Broken Axe
- Traveler gear

---

## Boss-Themed Equipment

Acquisition:

```txt
direct boss drop
OR
craft unlock after boss defeat
```

Boss crafting uses boss materials.

Examples:
- Funeral Blade
- Ashen Spear
- Frostfang Dagger
- Arathas Staff
- Frozen Crown

---

## Ultra Rare Future Recipes

Reserved for future chapters.

Characteristics:
- multiple rare materials
- cross-era ingredients
- boss materials
- high forge requirements

Not MVP.

---

# 4. Forge Weapon Recipes

---

## Rusted Sword

Type:
forge_weapon

Unlock:
Forge Level 1

Ingredients:

```txt
3x Iron Ore
2x Old Wood
```

Estimated value:

```txt
3x2 + 2x2 = 10 ECU
```

---

## Broken Axe

Type:
forge_weapon

Unlock:
Forge Level 1

Ingredients:

```txt
4x Iron Ore
1x Old Wood
```

Estimated value:

```txt
10 ECU
```

---

## Funeral Blade

Type:
forge_weapon

Unlock:
Chapter I boss progression

Ingredients:

```txt
4x Iron Ore
2x Ashwood
3x Shadow Residue
1x Fallen Rain Pearl
```

Theme:
Funèbre / shadow / water corruption

---

## Ashen Spear

Type:
forge_weapon

Unlock:
Ombre du Dragon defeated

Ingredients:

```txt
5x Iron Ore
3x Ashwood
3x Spectral Dust
1x Dragon Ash Core
```

Theme:
dragon ash / ruin

---

## Frostfang Dagger

Type:
forge_weapon

Unlock:
Chapter II progression

Ingredients:

```txt
4x Cold Iron
2x Sapphire
2x Frozen Echo
1x Frost Amalgam Core
```

Theme:
frost assassin

---

## Arathas Staff

Type:
forge_weapon

Unlock:
Archimage defeated

Ingredients:

```txt
3x Silver Ore
2x Sapphire
4x Frozen Echo
1x Archmage Sigil
```

Theme:
arcane frost

---

# 5. Forge Armor Recipes

---

## Spectral Hood

Type:
forge_armor

Unlock:
Chapter I

Ingredients:

```txt
3x Ashwood
4x Spectral Dust
```

---

## Mourning Cape

Type:
forge_armor

Unlock:
Chapter I

Ingredients:

```txt
2x Ashwood
5x Spectral Dust
```

---

## Frozen Crown

Type:
forge_armor

Unlock:
Allaeva defeated

Ingredients:

```txt
2x Pale Diamond
3x Cold Iron
4x Frozen Echo
1x Frozen Queen Tear
```

Theme:
royal frost legendary

---

# 6. Forge Accessories

---

## Gravekeeper Ring

Type:
forge_accessory

Unlock:
Chapter I

Ingredients:

```txt
2x Quartz
3x Spectral Dust
```

---

## Queen’s Tear Necklace

Type:
forge_accessory

Unlock:
Allaeva defeated

Ingredients:

```txt
1x Pale Diamond
2x Sapphire
1x Frozen Queen Tear
```

Theme:
royal legendary accessory

---

## Icebound Grimoire

Type:
forge_accessory / offhand

Unlock:
Chapter II

Ingredients:

```txt
2x Sapphire
3x Frozen Echo
1x Archmage Sigil
```

Theme:
frost corruption caster

---

# 7. Kitchen Recipes

---

## Hearty Stew

Type:
kitchen_food

Ingredients:

```txt
2x Tough Meat
1x Tomato
1x Carrot
```

Effect:
temporary HP + attack

---

## Fresh Salad

Type:
kitchen_food

Ingredients:

```txt
1x Tomato
1x Carrot
```

Effect:
temporary movement + energy recovery

---

## Frozen Fish Soup

Type:
kitchen_food

Unlock:
Chapter II

Ingredients:

```txt
2x Frozen Fish
1x Frostroot
```

Effect:
frost resistance + sustain

---

## Frostroot Broth

Type:
kitchen_food

Unlock:
Chapter II

Ingredients:

```txt
2x Frostroot
1x Tough Meat
```

Effect:
survivability / resistance

---

# 8. Story Catalyst Recipes

---

## Kaléidoscope — Era Glaciaire Unlock

Type:
story_catalyst

Unlock:
end Chapter I

Requirements:

```txt
World Level minimum required
```

Ingredients:

```txt
1x Dragon Ash Core
2x Quartz
5x Spectral Dust
```

Purpose:
unlock Era Glaciaire access

---

## Kaléidoscope — Era Déluge Unlock

Type:
story_catalyst

Unlock:
end Chapter II

Requirements:

```txt
World Level minimum required
```

Ingredients:

```txt
1x Frozen Queen Tear
2x Pale Diamond
6x Frozen Echo
```

Purpose:
unlock Era Déluge access

---

# 9. Upgrade Economy

Upgrades are recipe-like progression sinks.

---

## Formula

Placeholder:

```txt
upgrade_cost = item_value percentage + material cost
```

Example:

```txt
+1 = 20%
+2 = 35%
+3 = 50%
+4 = 70%
+5 = 100%
```

Future scaling:
rarity multiplier

---

## Material Types

Upgrade may consume:

```txt
ore
gem
forge_special
ecu
```

Examples:

```txt
Copper
Iron
Silver
Quartz
Sapphire
Precious Stones
```

---

## Boss Equipment Upgrades

Boss gear may require:

```txt
boss materials
forge_special
higher ECU
```

---

# 10. Future Systems

Deferred:

---

## Enchant Recipes

Future:
element / modifier enhancement

---

## Evolve Recipes

Future:
rarity progression

---

## Fusion Recipes

Future:
equipment merging

---

## Artifact Recipes

Future:
late-game progression

---

## Cross-Era Recipes

Future:
rare hybrid recipes requiring multiple eras

---

# 11. Open Questions

Later balancing:

- exact coefficients
- exact forge level gates
- exact market margins
- exact upgrade formulas
- exact food buff durations
- exact drop unlock conditions
- exact ultra rare recipe design