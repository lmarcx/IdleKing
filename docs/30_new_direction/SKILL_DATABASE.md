# SKILLS DATABASE — IdleKing (V2)

## Status

Foundation V2 — MVP Scope

This document defines the skill system used during:

* Prologue
* Chapter I
* Chapter II

Future chapters may introduce:

* Passive Skills
* Ultimate Skills
* Advanced Power Stones
* Multi-element Skills
* Skill Trees

---

# 1. Skill Philosophy

IdleKing does not use traditional classes.

The player's combat style is determined by:

```txt
Weapons
+
Rings
+
Equipment
```

Weapons define:

```txt
Basic Attacks
Combat Feel
Combat Rhythm
```

Rings define:

```txt
Active Skills
```

A player's build is therefore determined by the combination of:

```txt
Weapon Loadout
+
5 Equipped Rings
```

---

# 2. Ring Skill System

## Core Rule

```txt
1 Ring = 1 Active Skill
```

---

## Skill Slots

Players may equip:

```txt
5 Rings
```

Therefore:

```txt
5 Active Skills Maximum
```

---

## Duplicate Restriction

Players cannot equip:

```txt
2 identical skills
```

Example:

```txt
Flame Burst
Flame Burst
```

Not allowed.

---

# 3. Skill Acquisition

Skills are obtained through Ring acquisition.

Sources:

```txt
Loot
Boss Rewards
Dungeon Rewards
Quest Rewards
```

Future:

```txt
Merchants
Crafting
Events
```

---

# 4. Skill Categories

## Attack

Direct offensive abilities.

Examples:

```txt
Flame Burst
Frost Lance
Arcane Bolt
```

---

## Movement

Mobility abilities.

Examples:

```txt
Shadow Step
Wind Leap
```

---

## Defense

Protection abilities.

Examples:

```txt
Ice Barrier
Light Ward
```

---

## Utility

Support abilities.

Examples:

```txt
War Cry
Focus Field
Soul Mark
```

---

## Summon

Temporary creature abilities.

Examples:

```txt
Spectral Hound
Frozen Wisp
```

---

# 5. Elements

Current MVP Elements:

```txt
Neutral
Fire
Water
Ice
Wind
Electricity
Ground
Light
Dark
```

---

## MVP Rule

```txt
1 Skill
=
1 Element Maximum
```

Future Power Stones may allow:

```txt
Multi Element Skills
```

---

# 6. Skill Scaling

Skills scale through Ring progression.

There is no independent skill leveling.

Power comes from:

```txt
Item Level
Rarity
Upgrade Level
Affixes
Power Stones
```

---

# 7. Power Stones

Status:

Future System

---

## Purpose

Modify existing skills.

Power Stones are socketed into Rings.

---

## MVP Rules

Reserved.

No implementation required.

---

## Future Examples

```txt
Additional Projectile
Element Conversion
Cooldown Reduction
Larger Area
Longer Duration
Additional Summon
```

---

# 8. Skill Data Structure

Each skill contains:

```txt
Skill ID
Name
Category
Element
Cooldown
Resource Cost
Base Power
Scaling Type
Description
```

---

# 9. MVP Skill List

## SK-001

### Shadow Slash

Category:

```txt
Attack
```

Element:

```txt
Dark
```

Description:

```txt
Quick shadow-infused melee strike.
```

Cooldown:

```txt
4s
```

---

## SK-002

### Flame Burst

Category:

```txt
Attack
```

Element:

```txt
Fire
```

Description:

```txt
Explosive burst of fire around target area.
```

Cooldown:

```txt
6s
```

---

## SK-003

### Frost Lance

Category:

```txt
Attack
```

Element:

```txt
Ice
```

Description:

```txt
Launches a piercing ice projectile.
```

Cooldown:

```txt
5s
```

---

## SK-004

### Arcane Bolt

Category:

```txt
Attack
```

Element:

```txt
Neutral
```

Description:

```txt
Fast magical projectile.
```

Cooldown:

```txt
3s
```

---

## SK-005

### Water Surge

Category:

```txt
Attack
```

Element:

```txt
Water
```

Description:

```txt
Wave of water damaging enemies in front.
```

Cooldown:

```txt
6s
```

---

## SK-006

### Shadow Step

Category:

```txt
Movement
```

Element:

```txt
Dark
```

Description:

```txt
Short range teleport.
```

Cooldown:

```txt
8s
```

---

## SK-007

### Wind Leap

Category:

```txt
Movement
```

Element:

```txt
Wind
```

Description:

```txt
Quick leap toward target direction.
```

Cooldown:

```txt
7s
```

---

## SK-008

### Frost Dash

Category:

```txt
Movement
```

Element:

```txt
Ice
```

Description:

```txt
Dash forward leaving frozen traces.
```

Cooldown:

```txt
7s
```

---

## SK-009

### Ice Barrier

Category:

```txt
Defense
```

Element:

```txt
Ice
```

Description:

```txt
Temporary protective shield.
```

Cooldown:

```txt
15s
```

---

## SK-010

### Light Ward

Category:

```txt
Defense
```

Element:

```txt
Light
```

Description:

```txt
Protective aura reducing incoming damage.
```

Cooldown:

```txt
18s
```

---

## SK-011

### Guard Pulse

Category:

```txt
Defense
```

Element:

```txt
Ground
```

Description:

```txt
Creates a defensive shockwave.
```

Cooldown:

```txt
14s
```

---

## SK-012

### War Cry

Category:

```txt
Utility
```

Element:

```txt
Neutral
```

Description:

```txt
Increases offensive power temporarily.
```

Cooldown:

```txt
20s
```

---

## SK-013

### Focus Field

Category:

```txt
Utility
```

Element:

```txt
Light
```

Description:

```txt
Improves resource regeneration.
```

Cooldown:

```txt
18s
```

---

## SK-014

### Soul Mark

Category:

```txt
Utility
```

Element:

```txt
Dark
```

Description:

```txt
Marks a target, increasing damage taken.
```

Cooldown:

```txt
12s
```

---

## SK-015

### Spectral Hound

Category:

```txt
Summon
```

Element:

```txt
Dark
```

Description:

```txt
Summons a spectral hound.
```

Cooldown:

```txt
30s
```

---

## SK-016

### Frozen Wisp

Category:

```txt
Summon
```

Element:

```txt
Ice
```

Description:

```txt
Summons a frost spirit.
```

Cooldown:

```txt
25s
```

---

# 10. Future Systems

Reserved:

```txt
Passive Skills
Ultimate Skills
Multi Element Skills
Advanced Power Stones
Skill Fusion
Legendary Skill Effects
Mythic Skill Effects
Divine Skill Effects
Ancient Skill Effects
```
