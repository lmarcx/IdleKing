# ⚙️ EQUIPMENT GENERATION DATABASE — IdleKing (V2)

## Status

Foundation V2 — MVP Scope

This document defines how equipment is generated during:

* Prologue
* Chapter I — Era Funèbre
* Chapter II — Era Glaciaire

This system governs:

```txt
Loot
Boss Rewards
Crafting
Forge
Dungeon Rewards
Quest Rewards
```

---

# 🧭 Design Philosophy

Equipment must provide:

```txt
Build Diversity
Progression
Loot Excitement
Crafting Value
Replayability
```

Equipment generation should be:

```txt
Predictable enough to understand
Random enough to remain exciting
```

---

# 🧱 Item Generation Flow

Every generated item follows:

```txt
Item Base
↓
Item Level
↓
Rarity
↓
Affixes
↓
Final Stats
↓
Upgrade Potential
```

---

# ⚔️ Item Base

The base item determines:

```txt
Equipment Slot
Base Stats
Allowed Affixes
Weapon Type
```

Examples:

```txt
Rusted Sword
Iron Axe
Frozen Ring
Knight Shield
Apprentice Grimoire
```

---

# 📈 Item Level

Item Level (iLvl) determines:

```txt
Base Stat Values
Crafting Value
Upgrade Scaling
```

---

## MVP Rule

Items scale according to:

```txt
Dungeon Level
Boss Level
Player Progression
```

---

# 🌈 Rarity System

MVP Rarities:

```txt
Common
Uncommon
Rare
Epic
Legendary
```

Future:

```txt
Mythic
Divine
Ancient
```

---

# 🏷️ Affix System

## Structure

Generated items may contain:

```txt
Prefix
+
Suffix
```

Maximum MVP:

```txt
1 Prefix
1 Suffix
```

---

## Examples

Prefixes:

```txt
Savage
Frozen
Royal
Ancient
Swift
```

Suffixes:

```txt
of Fury
of Frost
of Wisdom
of Protection
of Precision
```

Example Result:

```txt
Savage Iron Sword of Fury
```

---

# 📊 Affixes by Rarity (LOCKED — DESIGN_FREEZE_V1 §6, D-05)

```txt
Common     → 0 affixe
Uncommon   → 0 affixe
Rare       → 1 affixe
Epic       → 1 affixe
Legendary  → 2 affixes (1 préfixe + 1 suffixe)
```

Cap MVP = **2 affixes** (cohérent avec « 1 Prefix + 1 Suffix »).
Plages de valeurs + pools par slot = DEFERRED (balancing).

---

# 📈 Core Stats

## Primary Stats

```txt
HP
Mana
Stamina
Attack
Defense
```

---

## Advanced Stats

```txt
Crit Chance
Crit Damage
Attack Speed
Move Speed
Mana Regen
Stamina Regen
Cooldown Reduction
```

---

# 🎯 Affix Pools

## Offensive

Examples:

```txt
Attack
Crit Chance
Crit Damage
Attack Speed
```

---

## Defensive

Examples:

```txt
HP
Defense
```

---

## Resource

Examples:

```txt
Mana
Mana Regen
Stamina
Stamina Regen
```

---

## Utility

Examples:

```txt
Move Speed
Cooldown Reduction
```

---

# 💍 Rings

Rings follow the same generation rules as every other item.

Additional properties:

```txt
Skill ID
Skill Category
Skill Element
```

---

## Ring Formula

```txt
Ring
=
Skill
+
Rarity
+
Affixes
+
Upgrade Level
```

---

## Example

```txt
Frozen Ring of Precision

Skill:
Frost Lance

Rarity:
Rare

Affixes:
+Crit Chance
+Mana
```

---

# 🔨 Upgrade System

Upgrades are performed through:

```txt
Forge
```

---

## Upgrade Effects

Each level increases:

```txt
Base Stats
```

---

## Milestones

Milestones grant additional stat increases.

---

### Common / Uncommon

```txt
+3
+6
```

---

### Rare

```txt
+3
+6
```

---

### Epic

```txt
+3
+6
+9
```

---

### Legendary

```txt
+3
+6
+9
+12
```

---

### Mythic

```txt
+3
+6
+9
+12
+15
```

---

### Divine

```txt
+3
+6
+9
+12
+15
+18
```

---

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

# ♻️ Salvage System

Items may be dismantled.

Result:

```txt
Item Destroyed
↓
Forge Special Obtained
```

---

## Salvage Rule

```txt
Permanent
Irreversible
```

The item is permanently destroyed.

---

# 🏗️ Crafted Equipment

Crafted items use:

```txt
Recipes
Resources
Forge
```

---

## Craft Result

Crafted items still generate:

```txt
Item Level
Rarity
Affixes
```

They follow the same generation rules as dropped items.

---

# 🎁 Loot Sources

Equipment may come from:

```txt
Enemies
Bosses
Dungeon Completion
Quest Rewards
Crafting
```

---

# 👑 Boss Rewards

Bosses may drop:

```txt
Generated Gear
Boss Materials
Boss Tokens
Fragment du Temps
```

---

## MVP Rule

No smart loot.

Loot is:

```txt
100% Random
```

---

# 🧩 Equipment Sets

Equipment Sets are handled separately through:

```txt
EQUIPMENT_SETS.md
```

Sets may provide:

```txt
2-Piece Bonuses
4-Piece Bonuses
Future 6-Piece Bonuses
```

---

# 🔮 Future Systems

Reserved for:

```txt
Named Items
Unique Items
Smart Loot
Power Stones
Skill Affixes
Corrupted Gear
Mythic Gear
Divine Gear
Ancient Gear
Legendary Unique Effects
```

---

# 📌 Final Philosophy

Equipment should create:

```txt
Meaningful Choices
Interesting Loot Drops
Build Diversity
Long-Term Progression
```

The system must remain:

```txt
Modular
Scalable
Data Driven
Easy to Expand
```

for all future chapters and game modes.
