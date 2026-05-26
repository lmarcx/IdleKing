# ITEMS DATABASE — IdleKing

## Purpose

This document defines the item philosophy, categories, equipment structure, acquisition rules, and MVP item scope for IdleKing.

This is a V1 source of truth.

Balancing values remain placeholder until:
- RESOURCES_DATABASE
- RECIPES_DATABASE
- ENEMIES_DATABASE
- BOSS_DATABASE balancing pass

---

# 1. Item Philosophy

Items are a major progression pillar.

They support:

- combat progression
- build identity
- crafting loops
- exploration rewards
- dungeon rewards
- economy loops
- story progression
- replayability

Itemization must feel rewarding but understandable.

MVP prioritizes clarity over excessive complexity.

---

# 2. Item Categories

## 2.1 Equipment

Combat gear.

Purpose:
- stat progression
- build customization
- combat identity

Subcategories:
- weapons
- armor
- accessories
- offhand
- artifacts (future)

---

## 2.2 Consumables

Single-use items.

Purpose:
- sustain
- temporary buffs
- utility
- narrative interactions

---

## 2.3 Resources

Crafting materials.

Defined in:
RESOURCES_DATABASE.md

---

## 2.4 Quest Items

Narrative progression items.

Rules:
- non sellable
- non recyclable
- non bankable
- non craftable
- narrative locked

---

## 2.5 Special Items

Narrative / progression relics.

Examples:
- Gouttes
- Kaléidoscope fragments
- Era catalysts
- story relics

Rules:
special handling only

---

# 3. Equipment System

---

# 3.1 Equipment Slots

Canonical slots:

- Helmet
- Chest
- Cape
- Gloves
- Belt
- Boots
- Weapon
- Offhand
- Necklace
- Ring 1
- Ring 2
- Artifact (future)

---

# 3.2 Equipment Core Data Model

Equipment contains:

- id
- name
- slot
- rarity
- ilvl
- itemLevel
- baseStats
- stats
- upgradeLevel

Future-ready fields:
- setTag
- elementTag
- enchantSlots

Not MVP:
- affixes
- sockets

---

# 3.3 Rarity Ladder

Canonical rarity progression:

- Common
- Uncommon
- Rare
- Epic
- Legendary
- Mythic
- Divine
- Ancient

MVP scope:

Common → Legendary

Future:
Mythic / Divine / Ancient

---

# 4. Weapon Families

---

## Sword

Role:
balanced melee weapon

Identity:
- reliable
- flexible
- generalist

---

## Dagger

Role:
aggressive precision melee

Identity:
- speed
- crit
- mobility

---

## Axe

Role:
burst melee

Identity:
- heavy strikes
- slower attacks
- raw damage

---

## Greatsword

Role:
heavy AoE melee

Identity:
- stagger
- cleave
- high commitment

---

## Spear

Role:
reach / control

Identity:
- spacing
- thrust combat
- safer melee

---

## Bow

Role:
ranged sustained DPS

Identity:
- distance pressure
- precision
- consistency

---

## Pistol

Role:
burst ranged precision

Identity:
- shorter ranged burst
- timing
- quick punishment

---

## Staff

Role:
elemental casting weapon

Identity:
- magic scaling
- ranged spellcasting
- AoE potential

---

## Grimoire

Role:
dark caster / utility

Identity:
- corruption
- DoT
- summon potential
- utility

---

## Shield

Role:
defensive offhand

Identity:
- mitigation
- counters
- survivability

---

# 5. Element Tags

MVP canonical elements:

- Neutral
- Shadow
- Frost
- Water
- Fire
- Electricity
- Ground
- Light

Purpose:
future interactions:
- elemental gear identity
- resistances
- boss mechanics
- enchant systems

MVP:
mostly thematic metadata

---

# 6. Acquisition Philosophy

Hybrid progression model.

---

## 6.1 Trash Enemies

Drop:
materials only

Purpose:
resource economy

No direct gear drops.

---

## 6.2 Bosses

May drop:
- materials
- direct equipment (low chance)
- themed gear pools

Purpose:
high dopamine reward spikes

---

## 6.3 Forge

Primary deterministic progression path.

Purpose:
player agency
build targeting

---

## 6.4 Market

Support acquisition path.

Purpose:
economy smoothing

---

## 6.5 Story Rewards

May grant:
- gear
- special items
- progression relics

---

# 7. Equipment Sets (MVP)

Initial MVP thematic sets.

Balancing TBD.

---

## Maraudeur

Identity:
frontline physical aggressor

Theme:
brutality / offense

Likely stats:
- attack
- hp
- crit

---

## Flageleur

Identity:
punisher / risk-reward fighter

Theme:
pain / retaliation

Likely stats:
- attack
- lifesteal
- crit
- aggression scaling

---

## Voltigeur

Identity:
agile skirmisher

Theme:
mobility / speed

Likely stats:
- attack speed
- dodge
- crit
- movement

---

## Pleureur

Identity:
shadow / corruption caster

Theme:
sorrow / darkness

Likely stats:
- power
- shadow scaling
- mana/energy
- DoT support

---

## Docteur

Identity:
utility / sustain specialist

Theme:
medicine / resilience

Likely stats:
- healing
- survivability
- utility
- regeneration

---

# 8. MVP Equipment Pools

---

# 8.1 General Early Gear

Common / Uncommon

Examples:
- Rusted Sword
- Broken Axe
- Traveler Hood
- Worn Gloves
- Reinforced Boots
- Tarnished Ring
- Old Necklace

---

# 8.2 Chapter I Gear

Rare / Epic unlock potential

Themes:
- funeral
- ash
- spectral
- ruined royalty

Examples:
- Funeral Blade
- Ashen Spear
- Spectral Hood
- Mourning Cape
- Gravekeeper Ring

---

# 8.3 Chapter II Gear

Epic / Legendary unlock potential

Themes:
- frost
- arcane
- glacial nobility
- ancient academy

Examples:
- Frostfang Dagger
- Arathas Staff
- Frozen Crown
- Icebound Gloves
- Queen’s Ring

---

# 9. Boss Themed Pools

---

## Amalgame des Ténèbres

Theme:
shadow corruption

Possible element:
Shadow

Possible drops:
- corrupted cloth gear
- shadow melee gear
- cursed accessories

---

## Seigneur de la Pluie Déchu

Theme:
water / fallen nobility

Possible element:
Water

Possible drops:
- water-themed armor
- ceremonial weapons
- aquatic accessories

---

## Ombre du Dragon

Theme:
ash / fire / ruin

Possible elements:
Fire / Ground

Possible drops:
- dragon-themed weapons
- ember armor
- scorched accessories

---

## Amalgame du Givre

Theme:
frost corruption

Possible elements:
Frost / Shadow

Possible drops:
- cursed frost gear
- frozen accessories

---

## Archimage

Theme:
arcane frost

Possible elements:
Frost / Light

Possible drops:
- mage weapons
- academy gear
- arcane jewelry

---

## Allaeva

Theme:
royal frost

Possible elements:
Frost / Light

Possible drops:
- queen-themed armor
- elegant weapons
- frost royal accessories

---

# 10. Consumables

---

## Healing

Purpose:
restore HP

Examples:
- Minor Healing Potion
- Greater Healing Potion

---

## Energy

Purpose:
restore combat energy

Examples:
- Energy Draught
- Focus Elixir

---

## Buff Foods

Purpose:
temporary bonuses

Examples:
- Stew
- Salad
- roasted meals
- future recipes

---

## Utility Consumables

Purpose:
temporary utility

Examples:
- resistance potions
- movement boosts
- XP boosts

---

## Story Consumables

Rare narrative-only items.

Special use cases.

---

# 11. Accessories Rules

---

## Rings

MVP:
simple stat gear

No skill modifier systems yet.

---

## Necklace

General stat support slot.

---

## Artifact

Reserved for future progression systems.

Not MVP.

---

# 12. Quest Items

Rules:
- non sellable
- non recyclable
- non bankable
- story controlled

Examples:
- sealed keys
- ritual objects
- chapter progression relics

---

# 13. Special Items

Narrative progression relics.

Examples:
- Goutte des Ténèbres
- stolen frost goutte
- Kaléidoscope catalysts
- temporal fragments
- era progression relics

---

# 14. Future Systems

Deferred intentionally:

- named handcrafted uniques
- affix systems
- sockets
- advanced enchantments
- set bonuses
- artifact progression
- mythic/divine/ancient itemization
- legendary identity loot

---

# 15. Open Questions

Later refinement:
- exact stat formulas
- exact drop pools
- direct boss gear rates
- enchant design
- artifact system
- set bonus system