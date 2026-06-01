# DUNGEON DATABASE — IdleKing (V2)

## Purpose

This document defines the playable structure of the World Dream.

A Dungeon is not necessarily a traditional dungeon.

In IdleKing:

```txt
Dungeon = Playable Story Instance
```

A Dungeon may contain:

- exploration
- dialogues
- cinematics
- combat
- events
- puzzles
- bosses
- checkpoints
- rewards

---

# 1. Dungeon Philosophy

The player progresses through:

```txt
Era
↓
Location
↓
Dungeon
↓
Boss
↓
Story Progression
```

The Time Gate uses:

```txt
Era
↓
Location
```

instead of:

```txt
Chapter
↓
Mission
```

This reinforces the concept of traveling through the different temporal layers of the Dream World.

---

# 2. Dungeon Types

## Narrative Dungeon

Purpose:

```txt
Story
Characters
Lore
Exploration
```

Boss:

Optional

---

## Adventure Dungeon

Purpose:

```txt
Exploration
Combat
Resources
```

Boss:

Optional

---

## Boss Dungeon

Purpose:

```txt
Major encounter
Chapter progression
```

Boss:

Required

---

## Hybrid Dungeon

Purpose:

```txt
Story
Exploration
Boss
```

Most story dungeons belong here.

---

# 3. Checkpoint System

Checkpoint saves:

```txt
Loot
Resources
ECU
XP
```

The player never loses already secured rewards.

---

## Checkpoint Effects

```txt
Respawn
Save Rewards
Refill Potions (future)
```

---

# 4. Prologue

---

# Era

## None (Introduction)

---

# Dungeon 0

## Terres Désolées

Type:

```txt
Hybrid Dungeon
```

Purpose:

```txt
Introduction
Awakening
Tutorial
```

Key Characters:

```txt
Billy
```

Narrative Beats:

```txt
Awakening
Dream Fragments
Desolation
Meeting Billy
The Thirsty Dog
Blood Offering
Shadow Attack
```

Enemy Families:

```txt
Ombres de Guerre
```

Boss:

```txt
Amalgame des Ténèbres
```

Dungeon Reward:

```txt
Darkness Drop
Boss Token
```

Unlock:

```txt
Kingdom
Era Funèbre
```

---

# 5. Era Funèbre

---

# Location

## Kingdom

Hub Location

Not a Dungeon.

---

# Dungeon 1

## Le Mausolée

Type:

```txt
Narrative Dungeon
```

Purpose:

```txt
Introduce Erix
Introduce Gugus
Introduce Chevalier
Introduce Aemon
```

Key Characters:

```txt
Erix
Gugus
Chevalier
Aemon
```

Enemy Families:

```txt
None
```

Boss:

```txt
None
```

Reward:

```txt
Temple Unlock
```

---

# Dungeon 2

## Rive Figée du Fleuve de Vie

Type:

```txt
Narrative Dungeon
```

Purpose:

```txt
Discover Fleuve de Vie
Meet Tobo
```

Key Characters:

```txt
Tobo
```

Enemy Families:

```txt
Spectres des Ténèbres
```

Boss:

```txt
None
```

Reward:

```txt
Tobo joins Kingdom
```

---

# Dungeon 3

## Vestige du Temps

Type:

```txt
Adventure Dungeon
```

Purpose:

```txt
Temporal Lore
Waqt Teasing
Kaléidoscope Teasing
```

Enemy Families:

```txt
Spectres des Ténèbres
Âmes Perdues
```

Elite Pool:

```txt
Spectre du Fleuve Noir
```

Boss:

```txt
None (MVP)
```

Future:

```txt
Mini Boss
```

Reward:

```txt
Temporal Resources
```

---

# Dungeon 4

## Pic des Cendres

Type:

```txt
Boss Dungeon
```

Purpose:

```txt
Final Dungeon of Era Funèbre
```

Enemy Families:

```txt
Dragonoïdes Corrompus
Squelettes Funéraires
Spectres des Ténèbres
```

Elite Pool:

```txt
Gardien des Cendres
Champion Funéraire
```

Boss:

```txt
Ombre du Dragon
```

Reward:

```txt
Dragon Ash Core
Fragment du Temps
```

Unlock:

```txt
Era Glaciaire
```

---

# 6. Era Glaciaire

---

# Location

## Kingdom

Hub Location

Not a Dungeon.

---

# Dungeon 5

## Camp de la Retraite Silencieuse

Type:

```txt
Narrative Dungeon
```

Purpose:

```txt
Introduction to Glaciation
Survivor Lore
```

Enemy Families:

```txt
Spectres du Froid
```

Boss:

```txt
None
```

Reward:

```txt
Glaciation Lore
```

---

# Dungeon 6

## Tour de la Chute Blanche

Type:

```txt
Adventure Dungeon
```

Purpose:

```txt
Observe the Fall
Discover Ancient Records
```

Enemy Families:

```txt
Mages Gelés
Spectres du Froid
```

Elite Pool:

```txt
Professeur d'Arathas
```

Boss:

```txt
None
```

Reward:

```txt
Academic Resources
```

---

# Dungeon 7

## Caverne aux Reflets

Type:

```txt
Hybrid Dungeon
```

Purpose:

```txt
Find Billy
Discover Spectres Source
```

Narrative Beats:

```txt
Billy Frozen
Blood Restoration
Spectre Swarm
Amalgame Formation
```

Enemy Families:

```txt
Spectres du Froid
Sirènes des Reflets
```

Boss:

```txt
Amalgame du Givre
```

Narrative Event:

```txt
Allaeva steals the Frost Drop
```

Reward:

```txt
Frost Amalgam Core
Boss Token
```

---

# Dungeon 8

## Académie d'Arathas

Type:

```txt
Boss Dungeon
```

Purpose:

```txt
Archimage Story Arc
```

Enemy Families:

```txt
Mages Gelés
Aberrations d'Arathas
```

Elite Pool:

```txt
Professeur d'Arathas
Prototype Alpha
```

Boss:

```txt
Archimage Corrompu
```

Narrative Beats:

```txt
Archimage Defeat
Allaeva Intervention
Mercy Kill
```

Reward:

```txt
Archmage Sigil
Boss Token
```

---

# Dungeon 9

## Gouffre Royal

Type:

```txt
Boss Dungeon
```

Purpose:

```txt
Tease Era Déluge
Explore Ancient Waters
```

Enemy Families:

```txt
Sirènes
Créatures Marines Gelées
```

Elite Pool:

```txt
Sirène Cryogénique
Léviathan Juvénile Gelé
```

Boss:

```txt
Seigneur de la Pluie Déchu
```

Narrative Beats:

```txt
Noah's original identity
Era Déluge tease
```

Reward:

```txt
Marine Resources
Pearlescent Scale
Boss Token
```

---

# Dungeon 10

## Source du Givre

Type:

```txt
Boss Dungeon
```

Purpose:

```txt
Final Dungeon of Era Glaciaire
```

Narrative Context:

```txt
Kingdom Assault
Death of Maximus
Noah Disappears
Allaeva Captures the Old King
```

Environment:

```txt
Frozen Prison
Manifestation of Allaeva's Mind
```

Enemy Families:

```txt
None
```

Boss:

```txt
Allaeva, Reine de Glace
```

Narrative Beats:

```txt
Allaeva's Madness
Confusion with Archimage
Hatred of Noah
Final Request
Moment of Lucidity
Death
```

Reward:

```txt
Frozen Queen Tear
Fragment du Temps
Boss Token
```

Unlock:

```txt
Era Déluge
```

---

# 7. Time Gate Structure

## Era Funèbre

```txt
Le Mausolée
Rive Figée du Fleuve de Vie
Vestige du Temps
Pic des Cendres
```

---

## Era Glaciaire

```txt
Camp de la Retraite Silencieuse
Tour de la Chute Blanche
Caverne aux Reflets
Académie d'Arathas
Gouffre Royal
Source du Givre
```

---

# 8. Dungeon Completion Rewards

Completion grants:

```txt
XP
ECU
Resources
Loot
```

Additional rewards:

```txt
Boss Materials
Era Materials
```

if applicable.

---

# 9. Future Dungeon Categories

Reserved for:

```txt
Era Déluge
Era Affection
Era Affliction
Era Corruption
Era Calcination
Era Isolation
```

---

# 10. Future Features

Reserved:

```txt
Events
Secrets
Puzzle Rooms
World Events
Random Encounters
Expeditions
Raid Dungeons
Boss Rush Dungeons
```

---

# 11. Open Questions

Future iteration:

- Dungeon lengths
- Checkpoint frequency
- Secret rooms
- Puzzle mechanics
- World events
- Optional bosses
- Hidden NPC encounters
- Era-specific modifiers