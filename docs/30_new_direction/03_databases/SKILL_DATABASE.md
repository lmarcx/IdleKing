# SKILLS DATABASE — IdleKing (V2)

## Status

Foundation V2 — MVP Scope

This document defines the active skill database for:

```txt
Prologue
Chapter I — Era Funèbre
Chapter II — Era Glaciaire
```

---

# 1. Core Rules

## Skill Carrier

```txt
1 Ring = 1 Active Skill
```

The player has:

```txt
5 Ring Slots
```

Therefore:

```txt
5 Active Skills Maximum
```

---

## Duplicate Rule

The player cannot equip two rings with the same Skill ID.

Example forbidden:

```txt
SK-002 Flame Burst
SK-002 Flame Burst
```

---

# 2. Resource Model

## HP

Used for:

```txt
Survival
Incoming damage
Future HP-cost mechanics
```

---

## Mana

Used for:

```txt
Active Skills
Summons
Defensive Skills
Utility Skills
```

All MVP Skills consume Mana.

---

## Stamina

Used for:

```txt
Sprint
Dash
Movement defense
```

Stamina is separate from Mana so that mobility does not directly compete with skill usage.

---

# 3. Skill Scaling

Skills do not have independent levels in the MVP.

Skill power is derived from the ring:

```txt
Ring Rarity
Ring Item Level
Ring Upgrade Level
Ring Affixes
Future Power Stones
```

---

# 4. Skill Categories

```txt
Attack
Movement
Defense
Utility
Summon
```

---

# 5. Elements

MVP Elements:

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

MVP Rule:

```txt
1 Skill = 1 Element
```

Future:

```txt
Power Stones may enable multi-element behavior.
```

---

# 6. Skill Data Model

```ts
type SkillCategory =
  | "attack"
  | "movement"
  | "defense"
  | "utility"
  | "summon";

type SkillElement =
  | "neutral"
  | "fire"
  | "water"
  | "ice"
  | "wind"
  | "electricity"
  | "ground"
  | "light"
  | "dark";

type SkillTargeting =
  | "free_aim"
  | "ground_target"
  | "cone"
  | "line"
  | "aoe"
  | "self_cast"
  | "enemy_cast"
  | "auto_target";

type Skill = {
  id: string;
  name: string;
  category: SkillCategory;
  element: SkillElement;
  targeting: SkillTargeting;
  manaCost: number;
  cooldownSeconds: number;
  basePower: number;
  description: string;
};
```

---

# 7. MVP Skill List

---

## SK-001 — Shadow Slash

Category:

```txt
Attack
```

Element:

```txt
Dark
```

Targeting:

```txt
Cone
```

Mana Cost:

```txt
20
```

Cooldown:

```txt
4s
```

Description:

```txt
Quick shadow-infused melee arc in front of the player.
```

---

## SK-002 — Flame Burst

Category:

```txt
Attack
```

Element:

```txt
Fire
```

Targeting:

```txt
Ground Target
```

Mana Cost:

```txt
35
```

Cooldown:

```txt
6s
```

Description:

```txt
Explosive burst of fire at the target area.
```

---

## SK-003 — Frost Lance

Category:

```txt
Attack
```

Element:

```txt
Ice
```

Targeting:

```txt
Line
```

Mana Cost:

```txt
30
```

Cooldown:

```txt
5s
```

Description:

```txt
Launches a piercing ice projectile.
```

---

## SK-004 — Arcane Bolt

Category:

```txt
Attack
```

Element:

```txt
Neutral
```

Targeting:

```txt
Free Aim
```

Mana Cost:

```txt
15
```

Cooldown:

```txt
3s
```

Description:

```txt
Fast magical projectile.
```

---

## SK-005 — Water Surge

Category:

```txt
Attack
```

Element:

```txt
Water
```

Targeting:

```txt
Line
```

Mana Cost:

```txt
35
```

Cooldown:

```txt
6s
```

Description:

```txt
Wave of water damaging enemies in front.
```

---

## SK-006 — Shadow Step

Category:

```txt
Movement
```

Element:

```txt
Dark
```

Targeting:

```txt
Free Aim
```

Mana Cost:

```txt
30
```

Cooldown:

```txt
8s
```

Description:

```txt
Short-range teleport toward target direction.
```

---

## SK-007 — Wind Leap

Category:

```txt
Movement
```

Element:

```txt
Wind
```

Targeting:

```txt
Free Aim
```

Mana Cost:

```txt
25
```

Cooldown:

```txt
7s
```

Description:

```txt
Quick leap toward target direction.
```

---

## SK-008 — Frost Dash

Category:

```txt
Movement
```

Element:

```txt
Ice
```

Targeting:

```txt
Free Aim
```

Mana Cost:

```txt
25
```

Cooldown:

```txt
7s
```

Description:

```txt
Magical dash leaving frozen traces behind.
```

Note:

```txt
This is a Skill and consumes Mana.
The basic Dash remains a movement action and consumes Stamina.
```

---

## SK-009 — Ice Barrier

Category:

```txt
Defense
```

Element:

```txt
Ice
```

Targeting:

```txt
Self Cast
```

Mana Cost:

```txt
45
```

Cooldown:

```txt
15s
```

Description:

```txt
Creates a temporary protective ice shield.
```

---

## SK-010 — Light Ward

Category:

```txt
Defense
```

Element:

```txt
Light
```

Targeting:

```txt
Self Cast
```

Mana Cost:

```txt
50
```

Cooldown:

```txt
18s
```

Description:

```txt
Protective aura reducing incoming damage.
```

---

## SK-011 — Guard Pulse

Category:

```txt
Defense
```

Element:

```txt
Ground
```

Targeting:

```txt
AoE
```

Mana Cost:

```txt
40
```

Cooldown:

```txt
14s
```

Description:

```txt
Creates a defensive shockwave around the player.
```

---

## SK-012 — War Cry

Category:

```txt
Utility
```

Element:

```txt
Neutral
```

Targeting:

```txt
Self Cast
```

Mana Cost:

```txt
35
```

Cooldown:

```txt
20s
```

Description:

```txt
Temporarily increases offensive power.
```

---

## SK-013 — Focus Field

Category:

```txt
Utility
```

Element:

```txt
Light
```

Targeting:

```txt
AoE
```

Mana Cost:

```txt
40
```

Cooldown:

```txt
18s
```

Description:

```txt
Creates a field improving Mana regeneration.
```

---

## SK-014 — Soul Mark

Category:

```txt
Utility
```

Element:

```txt
Dark
```

Targeting:

```txt
Enemy Cast
```

Mana Cost:

```txt
30
```

Cooldown:

```txt
12s
```

Description:

```txt
Marks a target, increasing damage taken.
```

---

## SK-015 — Spectral Hound

Category:

```txt
Summon
```

Element:

```txt
Dark
```

Targeting:

```txt
Self Cast
```

Mana Cost:

```txt
60
```

Cooldown:

```txt
30s
```

Description:

```txt
Summons a temporary spectral hound.
```

---

## SK-016 — Frozen Wisp

Category:

```txt
Summon
```

Element:

```txt
Ice
```

Targeting:

```txt
Self Cast
```

Mana Cost:

```txt
55
```

Cooldown:

```txt
25s
```

Description:

```txt
Summons a temporary frost spirit.
```

---

# 8. Future Systems

Reserved:

```txt
Passive Skills
Ultimate Skills
Skill Trees
Advanced Power Stones
Multi-element Skills
Skill Fusion
Legendary Skill Effects
Mythic Skill Effects
Divine Skill Effects
Ancient Skill Effects
```
