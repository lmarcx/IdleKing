# 🌌 EFFECT SETS & RESONANCE SYSTEM — IdleKing (V2)

---

# 🧭 Vision

Le système de Résonance constitue le principal système de progression passive du personnage.

Il remplace volontairement :

```txt
Talent Trees
Passive Trees
Mastery Trees
Ascendancies
```

présents dans de nombreux ARPG.

Le système repose sur :

```txt
Résonance
↓
Effect Slots
↓
Effect Sets
↓
Personnalisation du Build
```

---

# ⚖️ Philosophie

Le joueur ne choisit pas une classe.

Le joueur construit son personnage à travers :

```txt
Weapons
Skills (Rings)
Equipment
Effect Sets
```

Les Effect Sets représentent :

```txt
Pouvoirs hérités
Récompenses narratives
Progression passive
```

---

# 🧱 Architecture du Build

## Layer 1 — Weapons

Détermine :

```txt
Combat Actions
Range
Attack Pattern
Combat Rhythm
```

---

## Layer 2 — Skills

Détermine :

```txt
5 Active Skills
```

via :

```txt
5 Rings
```

---

## Layer 3 — Effect Sets

Détermine :

```txt
Passive Effects
Build Identity
Long Term Progression
```

via :

```txt
Resonance
```

---

# 🧠 Effect Resonance

## Principe

Les 9 slots principaux génèrent un score de Résonance.

Ce score détermine :

```txt
Combien d'effets passifs
le joueur peut équiper.
```

---

# 🧱 Slots Principaux

Les slots participant à la Résonance sont :

```txt
Helmet
Chest
Cape
Gloves
Belt
Boots
Weapon
Offhand
Necklace
```

---

# 🟨 Slots Secondaires

Les slots suivants ne génèrent PAS de Résonance :

```txt
Ring 1
Ring 2
Ring 3
Ring 4
Ring 5

Artifact
```

---

# 📊 Valeurs de Résonance

```txt
Common      = 0
Uncommon    = 1
Rare        = 2
Epic        = 3
Legendary   = 4

Mythic      = 5
Divine      = 7
Ancient     = 9
```

---

# 🧮 Calcul

```txt
Effect Slots =
floor(Total Resonance / 9)
```

---

# 📌 Exemples

```txt
9 Uncommon
=
9 Resonance
=
1 Effect Slot
```

```txt
9 Epic
=
27 Resonance
=
3 Effect Slots
```

```txt
5 Ancient
+
4 Legendary
=
61 Resonance
=
6 Effect Slots
```

---

# 🎯 Utilisation des Effect Slots

Chaque Effect Slot permet d'équiper :

```txt
1 effet passif
```

Le joueur peut :

```txt
Se spécialiser
```

ou

```txt
Mixer plusieurs Effect Sets
```

---

## Exemple

```txt
Fireflame I
Fireflame II
Fireflame III
```

ou

```txt
Fireflame I
Fireflame II

Motherstone I
```

ou

```txt
Shadow Veil I
Rainmaker I
Kingfrost I
```

---

# 📖 Acquisition des Effect Sets

Les Effect Sets sont des récompenses narratives.

Ils ne sont pas obtenus comme du loot classique.

---

## Sources

```txt
Bosses
NPCs Importants
Story Events
Main Quests
```

---

# Canon Rule

Chaque Effect Set doit être lié à :

```txt
Un Boss
ou
Un NPC Important
ou
Un Événement Narratif Majeur
```

---

# 🔥 MVP EFFECT SETS

> **LOCKED — DESIGN_FREEZE_V1 §8 (D-01) : Effect Sets SIMPLIFIÉS pour le MVP.**
> Au MVP, les paliers se limitent à des **effets simples et chiffrables** (bonus de stats /
> application de status basique). **Aucun proc sur-mesure** (Shadow Clone, Ice Nova, Tidal Wave,
> explosions, orbitales…). Les paliers spectaculaires d'origine (typiquement IV-V) sont **reportés en V2**.
> Les paliers ci-dessous décrivent l'intention thématique ; leur version MVP est l'effet simple correspondant
> (valeurs = DEFERRED balancing). Acquisition = récompense narrative (boss / NPC / événement).
> Rainmaker : source = **Seigneur de la Pluie Déchu** (boss du Gouffre Royal, Ch II).

---

# Shadow Veil

## Déblocage

```txt
Rencontre de l'Amalgame des Ténèbres
```

## Thématique

```txt
Dark
Stealth
Assassination
Mobility
```

## Disponibilité

```txt
Prologue
```

## Progression

### I

```txt
Bonus Crit Chance
```

### II

```txt
Bonus Backstab Damage
```

### III

```txt
Stealth after Elite Kill
```

### IV

```txt
Dark Projectiles on Crit
```

### V

```txt
Shadow Clone Apparition
```

---

# Lordflame

## Déblocage

```txt
Défaite de l'Ombre du Dragon
```

## Thématique

```txt
Fire
Burn
Explosions
Critical Strikes
```

## Disponibilité

```txt
Chapter I
```

## Progression

### I

```txt
Critical Hits apply Burn
```

### II

```txt
Burn Damage Increased
```

### III

```txt
Small Fire Orbitals
```

### IV

```txt
Bonus Damage vs Burning Targets
```

### V

```txt
Burning Enemies Explode on Death
```

---

# Motherstone

## Déblocage

```txt
Découverte du Fleuve de la Vie
```

## Thématique

```txt
Ground
Defense
Protection
Sustain
```

## Disponibilité

```txt
Chapter I
```

## Progression

### I

```txt
Bonus Defense
```

### II

```txt
Bonus HP
```

### III

```txt
Ground Pulse when Hit
```

### IV

```txt
Damage Reduction while Stationary
```

### V

```txt
Protective Stone Barrier
```

---

# Kingfrost

## Déblocage

```txt
Défaite de l'Archimage
```

## Thématique

```txt
Ice
Control
Freeze
```

## Disponibilité

```txt
Chapter II
```

## Progression

### I

```txt
Hits apply Frost
```

### II

```txt
Frost Duration Increased
```

### III

```txt
Slow Effectiveness Increased
```

### IV

```txt
Bonus Damage against Frozen Targets
```

### V

```txt
Ice Nova on Elite Kill
```

---

# Rainmaker

## Déblocage

```txt
Défaite du Seigneur de la Pluie Déchu
```

## Thématique

```txt
Water
Flow
Mana
Adaptation
```

## Disponibilité

```txt
Chapter II
```

## Progression

### I

```txt
Water Skills apply Drench
```

### II

```txt
Drench Duration Increased
```

### III

```txt
Bonus Mana Regeneration
```

### IV

```txt
Bonus Damage against Drenched Targets
```

### V

```txt
Tidal Wave Proc
```

---

# 📚 Future Effect Sets

Réservés pour les chapitres futurs :

```txt
Thunderknight
Lightbringer
Bloodhunter
Arcane Echo
Voidcaller
Chronoweaver
Dreamwalker
Soulforge
```

---

# 📌 Final Philosophy

Le système de Résonance doit permettre :

```txt
Build Diversity
Theorycraft
Long Term Progression
Narrative Rewards
Player Identity
```

La boucle de progression devient :

```txt
Story
↓
Boss
↓
Effect Set
↓
Build Evolution
```

et constitue l'un des piliers fondamentaux du gameplay d'IdleKing.
