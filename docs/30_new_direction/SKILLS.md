# ✨ Idle King — Skills System (v2)

---

# 🧭 Vision

Les Skills constituent l’un des piliers centraux du gameplay d’IdleKing.

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

# 💍 Principe Fondamental

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
Rythme
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
1 Active Skill
```

Donc :

```txt
5 Active Skills Maximum
```

---

# 🚫 Duplicate Restriction

Le joueur ne peut pas équiper :

```txt
2 Rings
portant la même compétence
```

Exemple interdit :

```txt
Flame Burst
Flame Burst
```

---

# 🔋 Ressources

## ❤️ HP

Utilisé pour :

```txt
Survie
Dégâts reçus
Future HP-cost mechanics
```

---

## 🟦 Mana

Utilisée pour :

```txt
Skills
Summons
Utility Skills
Defense Skills
```

Toutes les compétences actives consomment de la Mana dans le MVP.

---

## 🟨 Stamina

Utilisée pour :

```txt
Sprint
Dash
Future dodge / movement mechanics
```

La Stamina ne doit pas concurrencer directement les Skills.

Elle sert à préserver la mobilité défensive du joueur.

---

## 🟪 Cooldowns

Toutes les Skills utilisent :

```txt
Cooldown
```

---

## 🟣 Charges

Le système doit supporter les charges, mais elles restent optionnelles dans le MVP.

Exemples futurs :

```txt
2 charges de Dash modifié
3 charges de projectile
Recharge progressive
```

---

# 🏃 Mouvement

Le gameplay de base inclut :

```txt
Déplacement libre
Sprint
Dash
```

---

## ⚡ Sprint

```txt
Augmente la vitesse de déplacement
Consomme de la Stamina
```

---

## 💨 Dash

Utilisé pour :

```txt
Esquive
Repositionnement
Évitement de patterns
```

Le Dash consomme de la Stamina.

---

## 🔮 Évolutions Futures

Le système doit supporter :

```txt
IFrames
Dash offensifs
Dash modifiés par équipement
Dash modifiés par Power Stones
Dash modifiés par passifs futurs
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

Compétences offensives.

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

Compétences de mobilité consommant de la Mana, distinctes du Dash de base.

Exemples :

```txt
Shadow Step
Wind Leap
Frost Dash
```

---

## Defense

Compétences défensives.

Exemples :

```txt
Ice Barrier
Guard Pulse
Light Ward
```

---

## Utility

Compétences de soutien.

Exemples :

```txt
War Cry
Focus Field
Soul Mark
```

---

## Summon

Compétences d’invocation.

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

Règle MVP :

```txt
1 Skill = 1 Élément
```

Les Power Stones pourront permettre plus tard :

```txt
Multi Elements
Conversions Élémentaires
Effets Hybrides
```

---

# 🔥 Status Effects

## Burn

```txt
Damage Over Time
```

## Freeze

```txt
Slow
```

## Shock

```txt
Damage Amplification
```

## Bleed

```txt
Weaken
```

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
Power Stones
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

Leur puissance dépend de l’anneau qui les porte :

```txt
Ring Item Level
Ring Rarity
Ring Upgrade Level
Ring Affixes
Future Power Stones
```

Donc :

```txt
Upgrade Ring = Upgrade Skill
```

---

# 💎 Power Stones

Statut :

```txt
Future System
```

Les Power Stones sont insérées dans les anneaux.

Elles modifient la compétence associée.

MVP :

```txt
Non implémenté
```

Exemples futurs :

```txt
Projectile supplémentaire
Réduction cooldown
Augmentation AoE
Élément secondaire
Invocation supplémentaire
Conversion élémentaire
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
Mana Cost
Cooldown
Charges
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
Mana
Stamina
```

pour former le cœur du gameplay d’IdleKing.
