# LOOT TABLES DATABASE — IdleKing (V2)

## Purpose

This document defines the canonical loot ecosystem of IdleKing.

It determines:

- resource acquisition
- boss rewards
- replayability
- crafting progression
- economy balancing
- World Gate farming

Scope:

- Prologue
- Chapter I — Era Funèbre
- Chapter II — Era Glaciaire

---

# 1. Loot Philosophy

IdleKing is a:

Craft > Loot RPG

Enemies primarily provide:

- resources
- crafting materials
- progression materials

Equipment is primarily obtained through:

- crafting
- boss drops
- special rewards

This prevents inventory pollution and reinforces the Kingdom gameplay loop.

---

# 2. Rarity Tables

## Equipment Rarities

Available during MVP:

```txt
Common
Uncommon
Rare
Epic
Legendary
```

---

## Base Equipment Roll Chances

Standard Boss Equipment Roll:

```txt
Common      50%
Uncommon    25%
Rare        15%
Epic         8%
Legendary    2%
```

Subject to balancing.

---

## World Gate Modifier

World Gate increases quality.

Example:

```txt
Common      ↓
Uncommon    ↑
Rare        ↑
Epic        ↑
Legendary   ↑
```

Final values determined later.

---

# 3. Standard Enemy Loot Tables

---

# Prologue

---

## Ombre Errante

Guaranteed:

```txt
1x Shadow Residue
```

Bonus:

```txt
10% Shadow Residue
```

---

## Ombre Archer

Guaranteed:

```txt
1x Shadow Residue
```

Bonus:

```txt
10% Shadow Residue
```

---

## Ombre Brisée

Guaranteed:

```txt
1x Shadow Residue
```

Bonus:

```txt
15% Shadow Residue
```

---

# Era Funèbre

---

## Spectre Vagabond

Guaranteed:

```txt
1x Spectral Dust
```

Bonus:

```txt
10% Spectral Dust
```

---

## Spectre Hurleur

Guaranteed:

```txt
1x Spectral Dust
```

Bonus:

```txt
10% Shadow Residue
```

---

## Spectre Veilleur

Guaranteed:

```txt
1x Spectral Dust
```

Bonus:

```txt
15% Spectral Dust
```

---

## Âme Égarée

Guaranteed:

```txt
1x Spectral Dust
```

Bonus:

```txt
5% Shadow Residue
```

---

## Âme Tourmentée

Guaranteed:

```txt
1x Shadow Residue
```

Bonus:

```txt
5% Spectral Dust
```

---

## Squelette Guerrier

Guaranteed:

```txt
1x Bone Fragment
```

Bonus:

```txt
10% Iron Scrap
```

---

## Squelette Archer

Guaranteed:

```txt
1x Bone Fragment
```

Bonus:

```txt
5% Iron Scrap
```

---

## Dragonoïde Déchu

Guaranteed:

```txt
1x Ashwood
```

Bonus:

```txt
5% Dragon Scale Fragment
```

---

## Dragonoïde Fanatique

Guaranteed:

```txt
1x Ashwood
```

Bonus:

```txt
10% Dragon Scale Fragment
```

---

# Era Glaciaire

---

## Spectre Gelé

Guaranteed:

```txt
1x Frozen Echo
```

Bonus:

```txt
10% Frozen Echo
```

---

## Spectre Cristallisé

Guaranteed:

```txt
1x Frozen Echo
```

Bonus:

```txt
15% Frozen Echo
```

---

## Spectre Blizzard

Guaranteed:

```txt
1x Frozen Echo
```

Bonus:

```txt
10% Sapphire Fragment
```

---

## Apprenti Gelé

Guaranteed:

```txt
1x Frozen Echo
```

Bonus:

```txt
5% Silver Ore
```

---

## Archiviste Gelé

Guaranteed:

```txt
1x Frozen Echo
```

Bonus:

```txt
5% Archival Fragment
```

---

## Sirène Errante

Guaranteed:

```txt
1x Frozen Fish
```

Bonus:

```txt
5% Pearlescent Scale
```

---

## Sirène des Reflets

Guaranteed:

```txt
1x Pearlescent Scale
```

Bonus:

```txt
5% Frozen Echo
```

---

## Sirène des Chants

Guaranteed:

```txt
1x Pearlescent Scale
```

Bonus:

```txt
5% Frozen Fish
```

---

## Poisson-Abyssal Gelé

Guaranteed:

```txt
1x Frozen Fish
```

Bonus:

```txt
5% Frozen Fish
```

---

## Crabe de Givre

Guaranteed:

```txt
1x Cold Shell Fragment
```

Bonus:

```txt
10% Frozen Fish
```

---

## Sujet A-01

Guaranteed:

```txt
1x Experimental Tissue
```

Bonus:

```txt
10% Frozen Echo
```

---

## Sujet A-07

Guaranteed:

```txt
1x Experimental Tissue
```

Bonus:

```txt
5% Archival Fragment
```

---

# 4. Elite Loot Tables

Elite enemies gain:

```txt
+1 guaranteed resource
+ increased rare material chance
+ ECU bonus
```

---

## Spectre du Fleuve Noir

Guaranteed:

```txt
2x Spectral Dust
```

Bonus:

```txt
20% Shadow Residue
5% Rare Spectral Dust
```

---

## Champion Funéraire

Guaranteed:

```txt
2x Bone Fragment
```

Bonus:

```txt
15% Silver Ore
```

---

## Gardien des Cendres

Guaranteed:

```txt
2x Dragon Scale Fragment
```

Bonus:

```txt
10% Dragon Ash Fragment
```

---

## Spectre du Blizzard Blanc

Guaranteed:

```txt
2x Frozen Echo
```

Bonus:

```txt
15% Sapphire
```

---

## Professeur d'Arathas

Guaranteed:

```txt
2x Archival Fragment
```

Bonus:

```txt
10% Sapphire
```

---

## Sirène Cryogénique

Guaranteed:

```txt
2x Pearlescent Scale
```

Bonus:

```txt
10% Sapphire
```

---

## Léviathan Juvénile Gelé

Guaranteed:

```txt
2x Cold Shell Fragment
```

Bonus:

```txt
10% Rare Frozen Fish
```

---

## Prototype Alpha

Guaranteed:

```txt
2x Experimental Tissue
```

Bonus:

```txt
15% Archival Fragment
```

---

# 5. Major Boss Loot Tables

---

## Amalgame des Ténèbres

Guaranteed:

```txt
Dark Amalgam Core
Boss Token
```

Bonus:

```txt
25% Rare Crafting Cache
10% Equipment Roll
```

---

## Ombre du Dragon

Guaranteed:

```txt
Dragon Ash Core
Boss Token
Era Progression Item (first clear)
```

Bonus:

```txt
35% Rare Crafting Cache
10% Equipment Roll
2% Legendary Equipment Roll
```

---

## Amalgame du Givre

Guaranteed:

```txt
Frost Amalgam Core
Boss Token
```

Bonus:

```txt
35% Rare Crafting Cache
10% Equipment Roll
```

---

## Archimage Corrompu

Guaranteed:

```txt
Archmage Sigil
Boss Token
```

Bonus:

```txt
35% Rare Crafting Cache
10% Equipment Roll
```

---

## Allaeva

Guaranteed:

```txt
Frozen Queen Tear
Boss Token
Era Progression Item (first clear)
```

Bonus:

```txt
50% Rare Crafting Cache
15% Equipment Roll
3% Legendary Equipment Roll
```

---

# 6. Dungeon Completion Rewards

Granted after dungeon completion.

Rewards:

```txt
ECU
XP
Resources
```

Scaling based on:

```txt
Dungeon Level
Era
Difficulty
```

---

# 7. Dungeon Chest Rewards

Dungeon chest grants:

```txt
resources
ECU
rare materials
equipment roll chance
```

No guaranteed equipment.

---

# 8. Era Progression Rewards

---

## End Chapter I

Guaranteed:

```txt
Dragon Ash Core
Kaléidoscope Component
```

Unlock:

```txt
Era Glaciaire
```

---

## End Chapter II

Guaranteed:

```txt
Frozen Queen Tear
Kaléidoscope Component
```

Unlock:

```txt
Era Déluge
```

---

# 9. World Gate Modifiers

World Gate does NOT replace loot tables.

It modifies them.

Possible modifiers:

```txt
+ Resource Quantity
+ ECU
+ Equipment Roll Chance
+ Rarity Roll Quality
```

Future balancing.

---

# 10. Future Mode Modifiers

Reserved:

```txt
Duel
Boss Rush
Raid
Expedition
Endless
Seasonal
```

Each mode modifies existing tables.

No separate boss tables required.

---

# 11. Recycle Tables

Equipment recycling returns:

```txt
base resources
+
forge_special chance
```

---

## Common

```txt
50% material recovery
```

---

## Uncommon

```txt
55% material recovery
```

---

## Rare

```txt
60% material recovery
```

---

## Epic

```txt
65% material recovery
```

---

## Legendary

```txt
70% material recovery
```

---

# 12. Forge Special Tables

Possible outputs:

```txt
Precious Stone Common
Precious Stone Uncommon
Precious Stone Rare
Precious Stone Epic
Precious Stone Legendary
```

Source:

```txt
recycling
boss bonuses
future systems
```

---

# 13. Open Balancing Questions

Future iteration:

- resource quantities
- rarity percentages
- World Gate modifiers
- ECU scaling
- recycle efficiency
- equipment drop frequency
- legendary frequency
- future mode rewards