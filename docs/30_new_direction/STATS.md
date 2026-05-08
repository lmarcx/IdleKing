# 📈 Idle King — Stats System (v1)

---

## 🧭 Vision

Le système de stats d’Idle King doit offrir :

```txt
lisibilité côté joueur
profondeur RPG
buildcraft
extensibilité long terme
```

Architecture :

```txt
stats basiques
+
stats avancées
+
stats dérivées
```

Le système doit fonctionner avec :

```txt
combat
skills
equipment
forge
enemy scaling
boss mechanics
future PvP
```

---

# 🧱 Catégories de stats

---

## 🟩 Stats basiques

Les stats principales du joueur :

```txt
HP
ATK
DEF
SPEED
```

---

## 🟦 Stats avancées

Les stats spécialisées :

```txt
crit chance
crit damage
mana
mana regen
stamina
stamina regen
cooldown reduction
healing power
buff power
debuff power
```

---

## 🟪 Stats dérivées

Calculées automatiquement :

```txt
POWER
attack speed
move speed
dash cooldown
effective HP
DPS estimé
healing output
damage mitigation
```

---

# POWER

## Définition

POWER est :

```txt
un score global dérivé
```

Ce n’est PAS une stat directement utilisée dans les calculs de dégâts.

---

## Utilisation

POWER sert à :

```txt
recommandation de contenu
feeling progression
comparaison de builds
leaderboards
UI progression
```

---

## Calcul

POWER est calculé depuis :

```txt
HP
ATK
DEF
SPEED
crit
mana
stamina
advanced stats
```

Formule exacte à équilibrer plus tard.

---

# SPEED

## Définition

SPEED est une stat primaire unique.

Elle influence :

```txt
attack speed
move speed
dash cooldown
```

---

## Philosophie

Côté joueur :

```txt
on affiche une seule stat lisible
```

Côté système :

```txt
plusieurs coefficients dérivés
```

Exemple conceptuel :

```txt
attackSpeed = SPEED * coeff
moveSpeed = SPEED * coeff
dashCDReduction = SPEED * coeff
```

---

# HP

HP représente :

```txt
survie du joueur
```

À :

```txt
0 HP
```

le joueur meurt.

---

# ATK

ATK représente :

```txt
puissance offensive principale
```

Influence :

```txt
attaque de base
skills offensives
certaines mécaniques
```

---

# DEF

DEF utilise une courbe de mitigation.

Pas de réduction plate.

---

## Philosophie

Éviter :

```txt
100 damage - 50 DEF
```

Utiliser :

```txt
courbe scalable
```

Exemple :

```txt
plus DEF augmente
plus mitigation augmente
avec rendement décroissant
```

---

# Crit

## Crit Chance

Cap :

```txt
100%
```

---

## Crit Damage

Valeur par défaut :

```txt
200%
```

Donc :

```txt
100 damage crit = 200 damage
```

---

# Mana

Mana est utilisée par certaines skills.

---

## Fonctionnement

```txt
pool global
regen passive
regen combat
regen hors combat
```

---

## Philosophie

Les builds mana-heavy doivent être viables.

---

# Stamina

Stamina est liée à la mobilité.

---

## Utilisation

```txt
sprint
```

---

## Regen

Fonctionnement :

```txt
regen passive
léger délai après consommation
```

---

# Dash

Dash utilise :

```txt
cooldown
```

Le cooldown est influencé par :

```txt
SPEED
```

---

# Cooldown Reduction

Cap :

```txt
50%
```

---

# Healing Power

Influence :

```txt
self heal
ally heal
```

---

# Buff Power

Influence :

```txt
intensité des buffs
durée des buffs
```

---

# Debuff Power

Influence :

```txt
intensité des debuffs
durée des debuffs
```

Exemples :

```txt
slow %
weaken %
silence duration
shock vuln
burn potency
```

---

# Status Effects

---

## Burn

Effet :

```txt
damage over time
```

Scaling :

```txt
base skill coefficient
+
% HP max target
avec caps configurables
```

Objectif :

```txt
utile sur trash
utile sur boss
sans être broken
```

---

## Freeze

Effet :

```txt
slow
```

Scaling :

```txt
Debuff Power
```

---

## Shock

Effet :

```txt
vulnerability
```

Valeur de base :

```txt
+10% damage taken
```

Scaling possible via Debuff Power.

---

## Bleed

Effet :

```txt
weaken
```

Valeur de base :

```txt
-10% damage dealt
```

Scaling possible via Debuff Power.

---

## Stun

Effet :

```txt
contrôle temporaire
```

---

## Silence

Effet :

```txt
empêche certains casts/actions
```

---

# Damage Formula

Architecture recommandée :

```txt
BaseDamage
× WeaponCoefficient
× SkillCoefficient
× OffensiveModifiers
× Crit
× TargetMitigation
× StatusModifiers
```

---

## Exemple conceptuel

```txt
ATK
→ arme
→ skill
→ crit
→ vuln target
→ mitigation DEF
→ damage final
```

---

# Stats affichées joueur

Le front doit pouvoir afficher :

```txt
HP
ATK
DEF
SPEED
POWER
crit chance
crit damage
mana
mana regen
stamina
stamina regen
cooldown reduction
healing power
buff power
debuff power
DPS estimé
effective HP
mitigation
```

---

# Extensibilité future

Le système doit permettre :

```txt
armor pen
lifesteal
thorns
block
evasion
tenacity
elemental damage
elemental resist
mana shield
heal received
shield power
summon power
```

et d’autres.

---

# PvP

## Duel PvP

Le PvP Duel utilise :

```txt
balance layer séparée
```

pour éviter les problèmes PvE.

---

## Other PvP Modes

Autres modes :

```txt
Land Conquest
Spatial Conquest
AvA
```

pourront utiliser :

```txt
loadouts spécifiques
stat systems dédiés
```

---

# Architecture recommandée

```txt
stats/
  base.ts
  advanced.ts
  derived.ts
  formulas.ts
  mitigation.ts
  status.ts
  pvp-balance.ts
```

---

# Philosophie finale

Le système doit être :

```txt
lisible
profond
scalable
testable
extensible
```

et supporter toute la vision long terme du jeu.
