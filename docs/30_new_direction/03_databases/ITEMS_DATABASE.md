# ITEMS DATABASE — IdleKing (V2)

## Purpose

This document defines the canonical itemization structure for IdleKing.

This is the primary source of truth for:

- equipment progression
- rarity scaling
- build identity
- crafting
- economy balancing
- loot generation
- future enchant/evolve/fusion systems

Scope:
- Prologue
- Chapter I — Era Funèbre
- Chapter II — Era Glaciaire

Future chapters will expand this database.

---

# 1. Itemization Philosophy

IdleKing uses a:

```txt
free-form build action RPG system
```

The player is not bound to classes.

Build identity is determined through:
- weapon combinations
- offhand combinations
- armor sets
- rings
- rarity
- upgrades
- future enchant systems

The system favors:
- horizontal progression
- replayability
- build experimentation
- long-term farming

---

# 2. Canon Rarity Model

MVP rarity scope:

```txt
Common
Uncommon
Rare
Epic
Legendary
```

Future rarities:

```txt
Mythic
Divine
Ancient
```

---

## Important Rule

Every equipment base may exist in every rarity tier.

Example:

```txt
Rusted Sword Common
Rusted Sword Epic
Rusted Sword Legendary
```

Rarity does NOT define chapter progression.

Progression scales mainly through:
- item level
- ilvl
- upgrades
- recipes
- build synergy

---

# 3. Equipment Slots

## Weapons

```txt
main_hand
off_hand
```

---

## Armor

```txt
helmet
chest
cape
gloves
belt
boots
```

---

## Jewelry

```txt
5x rings
1x necklace
```

---

## Special

```txt
artifact
```

Reserved for:
- Kaléidoscope
- Era relics
- Soul fragments
- future systems

---

# 4. Weapon Families

---

# 4.1 Sword

Balanced melee weapon.

Identity:
- versatility
- combo chaining
- hybrid builds

Possible combinations:
- Sword + Sword
- Sword + Axe
- Sword + Dagger
- Sword + Shield

---

## Weapon Bases

### Rusted Sword

Theme:
ruined kingdom

Gameplay:
balanced early weapon

---

### Funeral Blade

Theme:
funerary corruption

Gameplay:
shadow-oriented melee

---

### Royal Saber

Theme:
old royalty

Gameplay:
precision / balance

---

### Frostbound Longsword

Theme:
glacial warfare

Gameplay:
frost melee

---

### Hollowfang Blade

Theme:
spectral corruption

Gameplay:
aggressive sustain

---

# 4.2 Axe

Heavy burst melee.

Identity:
- stagger
- burst
- slower attacks

Possible combinations:
- Axe + Axe
- Axe + Sword
- Axe + Dagger
- Axe + Shield

---

## Weapon Bases

### Broken Axe

Theme:
survival

Gameplay:
heavy early burst

---

### Ashen Axe

Theme:
dragon ash

Gameplay:
fire remnants

---

### Frostsplitter

Theme:
ice execution

Gameplay:
high stagger

---

### Royal Executioner Axe

Theme:
kingdom punishment

Gameplay:
slow massive hits

---

### Tomb Cleaver

Theme:
grave executioner

Gameplay:
bleed / execution

---

# 4.3 Dagger

Fast melee weapon.

Identity:
- mobility
- crit
- utility

Possible combinations:
- Dagger + Dagger
- Sword + Dagger
- Axe + Dagger

---

## Weapon Bases

### Bone Knife

Theme:
survival

Gameplay:
fast strikes

---

### Frostfang Dagger

Theme:
glacial assassin

Gameplay:
mobility burst

---

### Spectral Shiv

Theme:
spectral corruption

Gameplay:
DoT / sustain

---

### Mourning Fang

Theme:
funeral rites

Gameplay:
precision crit

---

### Assassin Fang

Theme:
rogue hunter

Gameplay:
mobility crit

---

# 4.4 Greatsword

Massive AoE melee.

Identity:
- cleave
- heavy recovery
- crowd control

---

## Weapon Bases

### Tomb Greatsword

Theme:
ancient graves

Gameplay:
AoE cleave

---

### Dragonbone Greatsword

Theme:
dragon remains

Gameplay:
heavy stagger

---

### Glacier Splitter

Theme:
frozen execution

Gameplay:
ice cleave

---

# 4.5 Spear

Precision reach weapon.

Identity:
- spacing
- poke
- safe melee

---

## Weapon Bases

### Ashen Spear

Theme:
dragon ash

Gameplay:
range melee

---

### Frostpiercer

Theme:
glacial hunter

Gameplay:
precision frost

---

### Royal Halberd

Theme:
royal guard

Gameplay:
balanced reach

---

# 4.6 Bow

Ranged sustained DPS.

Identity:
- precision
- mobility
- sustained pressure

---

## Weapon Bases

### Hunter Bow

Theme:
survival hunter

Gameplay:
basic ranged

---

### Funeral Longbow

Theme:
spectral hunt

Gameplay:
shadow arrows

---

### White Frost Bow

Theme:
glacial elite

Gameplay:
frost pressure

---

# 4.7 Pistol

Burst ranged weapon.

Identity:
- mobility
- aggressive ranged burst

---

## Weapon Bases

### Rusted Pistol

Theme:
ruined technology

Gameplay:
quick shots

---

### Frostfire Pistol

Theme:
frozen combustion

Gameplay:
burst hybrid

---

### Royal Duelist Pistol

Theme:
elite duelist

Gameplay:
mobility burst

---

# 4.8 Staff

Magic control weapon.

Identity:
- scaling
- utility
- control

---

## Weapon Bases

### Arathas Staff

Theme:
academy magic

Gameplay:
arcane frost

---

### Frostcaller Staff

Theme:
ritual frost

Gameplay:
AoE control

---

### White Ritual Staff

Theme:
royal ritualism

Gameplay:
support scaling

---

# 5. Offhand Families

---

# 5.1 Sword Offhands

### Short Sword
### Funeral Sideblade
### Hollowfang Sideblade

---

# 5.2 Axe Offhands

### Hand Axe
### Frost Hatchet
### Ashen Splitter

---

# 5.3 Dagger Offhands

### Spectral Dagger
### Assassin Fang
### Ice Shiv

---

# 5.4 Shields

Tank utility.

---

## Shield Bases

### Rusted Shield

Theme:
ruined kingdom

Gameplay:
basic defense

---

### Dragon Ash Shield

Theme:
dragon remnants

Gameplay:
anti-shadow defense

---

### Frozen Royal Shield

Theme:
Allaeva royalty

Gameplay:
frost aura defense

---

# 5.5 Grimoires

Caster offhand.

---

## Grimoire Bases

### Icebound Grimoire

Theme:
frozen corruption

Gameplay:
frost curse

---

### Hollow Scripture

Theme:
spectral rituals

Gameplay:
shadow sustain

---

### White Archive

Theme:
royal academy

Gameplay:
arcane utility

---

# 6. Armor Sets

> **Identités de set : `EQUIPMENT_SETS.md` est la source of truth (DESIGN_FREEZE_V1 §7, D-06).**
> MVP actifs : **Vagabond, Pleureur, Maraudeur, Docteur**. Placeholder : **Flageleur, Gardien des Cendres,
> Voltigeur, Reine Blanche**. Les lignes « Identity » ci-dessous sont indicatives et cèdent à
> EQUIPMENT_SETS en cas de conflit (ex. Maraudeur = burst/crit, Pleureur = tank/DEF).

---

# 6.1 Kingdom / Prologue

---

## Maraudeur Set

Identity:
- balanced
- survival
- adaptability

Theme:
survivor / scavenger

### Pieces

```txt
Maraudeur Hood
Maraudeur Coat
Maraudeur Cape
Maraudeur Gloves
Maraudeur Belt
Maraudeur Boots
```

---

## Vagabond Set

Identity:
- mobility
- stamina
- exploration

Theme:
wanderer / exile

### Pieces

```txt
Vagabond Hood
Vagabond Jacket
Vagabond Cloak
Vagabond Gloves
Vagabond Belt
Vagabond Boots
```

---

# 6.2 Era Funèbre

---

## Pleureur Set

Identity:
- sustain
- spectral scaling
- shadow affinity

Theme:
mourning / spectres

### Pieces

```txt
Pleureur Hood
Pleureur Robe
Pleureur Cape
Pleureur Gloves
Pleureur Belt
Pleureur Boots
```

---

## Flageleur Set

Identity:
- aggression
- execution
- risk/reward

Theme:
punishment / torment

### Pieces

```txt
Flageleur Mask
Flageleur Armor
Flageleur Mantle
Flageleur Gloves
Flageleur Belt
Flageleur Boots
```

---

## Gardien des Cendres Set

Identity:
- defense
- dragon resistance
- anti-shadow

Theme:
ash guardians

### Pieces

```txt
Ash Guardian Helm
Ash Guardian Armor
Ash Guardian Cape
Ash Guardian Gloves
Ash Guardian Belt
Ash Guardian Boots
```

---

# 6.3 Era Glaciaire

---

## Docteur Set

Identity:
- support
- arcane scaling
- utility

Theme:
academy / medicine

### Pieces

```txt
Docteur Hood
Docteur Coat
Docteur Mantle
Docteur Gloves
Docteur Belt
Docteur Boots
```

---

## Voltigeur Set

Identity:
- mobility
- burst
- frost precision

Theme:
elite glacial hunters

### Pieces

```txt
Voltigeur Hood
Voltigeur Armor
Voltigeur Cape
Voltigeur Gloves
Voltigeur Belt
Voltigeur Boots
```

---

## Reine Blanche Set

Identity:
- legendary frost
- aura scaling
- royal corruption

Theme:
Allaeva

### Pieces

```txt
Frozen Crown
White Queen Dress
White Queen Mantle
White Queen Gloves
White Queen Belt
White Queen Boots
```

---

# 7. Jewelry

---

# 7.1 Rings

Players may equip:

```txt
5 rings
```

One ring slot per equipped skill.

---

## Ring Philosophy

Rings specialize builds.

Examples:
- cooldown reduction
- aura radius
- beam width
- sustain
- crit chance
- mobility
- elemental scaling

---

## Example Rings

### Royal Beam Ring

Effect:
beam width increase

---

### King Aura Ring

Effect:
aura radius increase

---

### War Cry Ring

Effect:
buff duration increase

---

### Frost Ritual Ring

Effect:
frost buildup

---

### Spectral Ring

Effect:
shadow sustain

---

# 7.2 Necklaces

Players may equip:

```txt
1 necklace
```

---

## Necklace Philosophy

Necklaces provide:
- broader stat identity
- scaling
- defensive utility

---

## Example Necklaces

### Queen’s Tear Necklace

Theme:
Allaeva

Gameplay:
frost aura scaling

---

### Ashen Relic Necklace

Theme:
dragon ash

Gameplay:
anti-shadow utility

---

### Hollow Prayer Necklace

Theme:
spectral rites

Gameplay:
sustain scaling

---

# 8. Artifacts

> **LOCKED — DESIGN_FREEZE_V1 §16 (D-11/D-12) :** le slot **artifact est INERTE au MVP** (aucun effet ;
> modificateur d'arme = backlog). Le **Kaléidoscope n'est PAS un artifact** : c'est un **Special World Item**
> qui débloque les pleins pouvoirs à la **Time Gate**. Le déblocage des Ères se fait via les **Fragments du Temps**
> (lootés sur boss de fin de chapitre). Voir `RESOURCES_DATABASE.md` §6.

Reserved for (futur) :
- Era relics
- soul fragments
- future systems

MVP artifacts remain limited (slot inert).

---

## Example Artifacts

### Kaléidoscope Fragment

Purpose:
Era travel

---

### Dragon Ash Relic

Purpose:
future progression

---

### Frozen Era Catalyst

Purpose:
Era unlock

---

# 9. Multi-Rarity Scaling

Every equipment may roll:

```txt
Common
Uncommon
Rare
Epic
Legendary
```

Example:

```txt
Legendary Rusted Sword
Rare Funeral Blade
Epic Frostfang Dagger
```

---

# 10. Item Scaling Formula

Placeholder formula:

```txt
final_power =
base_item_identity
× rarity_multiplier
× ilvl
× upgrade_level
```

---

# 11. Passive Effects

MVP supports:
- light utility effects
- light gameplay modifiers

Examples:
- dash increase
- beam width
- aura radius
- stamina regen
- frost resistance
- crit chance

Large gameplay-changing effects are future scope.

---

# 12. Crafting Philosophy

Crafting is central to progression.

Players:
- gather resources
- replay dungeons
- farm enemies
- replay bosses
- upgrade equipment
- recycle equipment

Recipe costs are intentionally high.

---

# 13. Boss Gear Philosophy

Boss gear acquisition:

```txt
rare direct drop
OR
boss-unlocked recipes
```

Boss materials are central to crafting progression.

---

## Example Boss Materials

```txt
Dragon Ash Core
Frozen Queen Tear
Archmage Sigil
Dark Amalgam Core
Frost Amalgam Core
```

---

# 14. Future Systems

Reserved:
- enchant
- evolve
- fusion
- set bonuses
- relic crafting
- cross-era crafting
- advanced passives
- Mythic rarity
- Divine rarity
- Ancient rarity

---

# 15. Open Questions

Future balancing:
- rarity probabilities
- dual wield penalties
- stamina scaling
- attack speed scaling
- passive caps
- set bonuses
- drop rates
- recipe balancing
- market economy
- enchant balance
- evolve balance
- fusion balance
- endgame build diversity