# ✨ Idle King — Skills System (v2)

---

# 🧭 Vision

Les Skills constituent l'un des piliers centraux du gameplay d'IdleKing.

Le gameplay repose sur :

```txt
Weapons
Skills
Movement
Builds
Positioning
```

Les Skills doivent permettre :

```txt
Gameplay nerveux
Profondeur stratégique
Synergies de builds
Modularité
Extensibilité long terme
```

---

# ⚔️ Philosophie Gameplay

Le système vise un gameplay :

```txt
Hades-like
Hack & Slash rapide
Skill-based
```

avec :

```txt
Mobilité importante
Patterns à esquiver
Fenêtres de burst
Choix de build significatifs
```

---

# 💍 Philosophie Fondamentale

Dans IdleKing :

```txt
Weapon = Combat Actions

Ring = Active Skill
```

Les armes définissent :

```txt
Attaques de base
Portée
Vitesse
Style de combat
```

Les anneaux définissent :

```txt
Compétences actives
```

Le build du joueur est donc principalement défini par :

```txt
Weapon Loadout
+
5 Equipped Rings
```

---

# 🎯 Skill Slots

Le joueur possède :

```txt
5 Ring Slots
```

Chaque anneau possède :

```txt
1 compétence active
```

Donc :

```txt
5 Active Skills Maximum
```

---

# 🚫 Duplicate Restriction

Le joueur ne peut pas équiper :

```txt
Deux anneaux
portant la même compétence
```

Exemple :

```txt
Flame Burst
Flame Burst
```

Interdit.

---

# 🟩 Passifs

Pas de système de passifs dédié dans le MVP.

Les bonus passifs proviennent de :

```txt
Equipment
Affixes
Set Bonuses
Future Artifacts
```

Les Passive Skills pourront être introduites plus tard.

---

# 🔋 Ressources

---

## 🟦 Energy

Toutes les compétences utilisent :

```txt
Energy
```

Le MVP ne possède pas :

```txt
Mana
Rage
Focus
Life Cost
```

---

## 🟨 Cooldowns

Toutes les compétences utilisent :

```txt
Cooldowns
```

---

## 🟪 Charges

Le système doit supporter :

```txt
Charges
```

mais leur utilisation reste optionnelle pour le MVP.

---

# 🏃 Mouvement

Le gameplay de base inclut :

```txt
Déplacement Libre
Sprint
Dash
```

---

## ⚡ Sprint

```txt
Augmente la vitesse
Consomme de l'énergie
```

---

## 💨 Dash

Utilisé pour :

```txt
Esquive
Repositionnement
Évitement des patterns
```

---

## 🔮 Évolutions Futures

Le système doit supporter :

```txt
IFrames
Dash offensifs
Dash modifiés par équipement
Dash modifiés par Power Stones
```

---

# 🧱 Catégories de Skills

Le système MVP supporte :

```txt
Attack
Movement
Defense
Utility
Summon
```

---

## Attack

Exemples :

```txt
Shadow Slash
Flame Burst
Frost Lance
Arcane Bolt
Water Surge
```

---

## Movement

Exemples :

```txt
Shadow Step
Wind Leap
Frost Dash
```

---

## Defense

Exemples :

```txt
Ice Barrier
Guard Pulse
Light Ward
```

---

## Utility

Exemples :

```txt
War Cry
Focus Field
Soul Mark
```

---

## Summon

Exemples :

```txt
Spectral Hound
Frozen Wisp
```

---

# 🎯 Targeting

Le système doit supporter :

```txt
Free Aim
Ground Target
Cone
Line
AoE
Self Cast
Enemy Cast
Auto Target
```

---

# 🧠 Philosophie de ciblage

Certaines compétences doivent récompenser :

```txt
Précision
Positionnement
Timing
```

---

# 🌈 Éléments

Éléments MVP :

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

## Règle MVP

```txt
1 Skill
=
1 Élément Maximum
```

---

## Futur

Les Power Stones pourront permettre :

```txt
Multi Elements
Conversions Élémentaires
Effets Hybrides
```

---

# 🔥 Status Effects

---

## Burn

```txt
Damage Over Time
```

---

## Freeze

```txt
Slow
```

---

## Shock

```txt
Damage Amplification
```

---

## Bleed

```txt
Weaken
```

---

## Future Status

```txt
Stun
Silence
Root
Fear
```

---

# 🧠 Synergies

Le système doit permettre des synergies entre :

```txt
Skills
Equipment
Status Effects
Affixes
```

Exemples :

```txt
Burn + Crit
Freeze + Burst
Shock + AoE
Bleed + Fast Attacks
```

---

# 📈 Progression des Skills

Les compétences ne possèdent pas de niveau indépendant.

Leur puissance dépend de :

```txt
Ring Item Level
Ring Rarity
Ring Upgrade Level
Ring Affixes
```

Donc :

```txt
Upgrade Ring
=
Upgrade Skill
```

---

# 💎 Power Stones

Statut :

```txt
Future System
```

---

## Principe

Les Power Stones sont insérées dans les anneaux.

Elles modifient la compétence associée.

---

## MVP

Non implémenté.

Le système doit simplement être anticipé.

---

## Exemples Futurs

```txt
Projectile Supplémentaire
Réduction Cooldown
Augmentation AoE
Élément Secondaire
Invocation Supplémentaire
```

---

# ⚙️ Architecture Technique

Les compétences ne doivent jamais être codées comme :

```txt
Scripts rigides uniques
```

Le système doit être :

```txt
Modulaire
Composable
Extensible
Data Driven
```

---

# 🧩 Modules Potentiels

```txt
Cast
Projectile
Movement
Damage
Heal
Shield
Buff
Debuff
Summon
AoE
Status Application
Resource Interaction
```

---

# 🔮 Extensibilité

Le système doit facilement permettre :

```txt
Nouveaux comportements
Nouveaux statuts
Nouvelles ressources
Nouveaux ciblages
Nouveaux modules
Nouvelles synergies
```

---

# 📌 Philosophie Finale

Le système de compétences doit permettre :

```txt
Gameplay nerveux
Expression du skill joueur
Theorycraft
Diversité des builds
Évolution long terme
```

Les Skills fonctionnent en synergie avec :

```txt
Weapons
Movement
Equipment
Affixes
Status Effects
Combat Mechanics
```

pour former le cœur du gameplay d'IdleKing.

```
```
