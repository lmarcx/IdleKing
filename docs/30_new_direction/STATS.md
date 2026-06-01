# 📈 Idle King — Stats System (v1)

## 1. Vision

Le système de stats d’Idle King doit offrir à la fois :

- une lecture simple pour le joueur
- une vraie profondeur RPG
- des possibilités de buildcraft
- une extensibilité long terme

Il repose sur trois couches :

```txt
stats basiques
stats avancées
stats dérivées
````

---

## 2. Stats basiques

Les stats basiques sont les stats principales du personnage.

```txt
HP
ATK
DEF
SPEED
```

---

## 3. Stats avancées

Les stats avancées permettent de spécialiser les builds.

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

## 4. Stats dérivées

Les stats dérivées sont calculées automatiquement depuis les stats basiques et avancées.

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

## 5. POWER

POWER est un score global dérivé.

Il ne modifie pas directement les dégâts ou les mécaniques de combat.

Il sert à :

```txt
recommandation de contenu
comparaison de builds
leaderboards
feeling de progression
affichage UI
```

POWER est calculé depuis :

```txt
HP
ATK
DEF
SPEED
crit chance
crit damage
mana
stamina
stats avancées
```

La formule exacte sera équilibrée plus tard.

---

## 6. HP

HP représente la survie du joueur.

```txt
HP = 0 → mort
```

HP est influencé par :

```txt
niveau joueur
équipement
sets d’équipement
effets passifs
```

---

## 7. ATK

ATK représente la puissance offensive principale.

Elle influence :

```txt
attaques de base
skills offensives
certaines mécaniques d’armes
certains effets passifs
```

---

## 8. DEF

DEF représente la résistance générale aux dégâts.

Elle utilise une courbe de mitigation.

On évite la réduction plate :

```txt
100 dégâts - 50 DEF = 50 dégâts
```

On privilégie :

```txt
réduction progressive avec rendement décroissant
```

Objectif :

```txt
DEF reste utile à haut niveau
sans rendre le joueur invincible
```

---

## 9. SPEED

SPEED est une stat primaire unique.

Elle influence :

```txt
attack speed
move speed
dash cooldown
```

Côté joueur, seule la stat `SPEED` est affichée.

Côté système, elle est transformée en plusieurs valeurs dérivées avec des coefficients différents :

```txt
attackSpeed = SPEED × coefficient
moveSpeed = SPEED × coefficient
dashCooldownReduction = SPEED × coefficient
```

Objectif :

```txt
SPEED doit être forte
mais ne doit pas devenir une god-stat
```

---

## 10. Crit

### Crit Chance

```txt
cap = 100%
```

### Crit Damage

```txt
valeur par défaut = 200%
```

Exemple :

```txt
100 dégâts → 200 dégâts en critique
```

---

## 11. Mana

Mana est utilisée par certaines skills.

Fonctionnement :

```txt
pool global
regen passive
regen en combat
regen hors combat
```

Les builds orientés mana doivent être viables.

Mana est influencée par :

```txt
équipements
sets d’équipement
effets passifs
stats avancées
```

---

## 12. Stamina

Stamina est liée à la mobilité.

Elle sert au :

```txt
sprint
dash
```

Fonctionnement :

```txt
regen passive
léger délai après consommation
```

Le dash consomme de la Stamina (DESIGN_FREEZE_V1 §2 — Stamina = sprint + dash).

---

## 13. Dash

Le dash consomme de la **Stamina** (DESIGN_FREEZE_V1 §2). Il peut aussi posséder un court cooldown.

Le cooldown éventuel du dash est réduit par :

```txt
SPEED
```

Le système doit pouvoir permettre plus tard :

```txt
dash avec charges
dash avec coût stamina
dash offensif
dash modifié par artifact
dash modifié par équipement
```

---

## 14. Cooldown Reduction

Cooldown Reduction influence les skills.

```txt
cap = 50%
```

Elle ne remplace pas la réduction du dash liée à SPEED.

---

## 15. Healing Power

Healing Power influence :

```txt
self heal
ally heal
```

Elle peut être utilisée par :

```txt
skills
armes support
effets passifs
sets d’équipement
```

---

## 16. Buff Power

Buff Power influence :

```txt
intensité des buffs
durée des buffs
```

Exemples :

```txt
augmentation dégâts
réduction dégâts
move speed bonus
protection de zone
```

---

## 17. Debuff Power

Debuff Power influence :

```txt
intensité des debuffs
durée des debuffs
```

Exemples :

```txt
slow %
weaken %
silence duration
shock vulnerability
burn potency
```

---

## 18. Status Effects

### Burn

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
utile sur trash mobs
utile sur boss
sans être broken
```

---

### Freeze

Effet :

```txt
slow
```

Scaling :

```txt
Debuff Power
```

---

### Shock

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

### Bleed

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

### Stun

Effet :

```txt
contrôle temporaire
```

---

### Silence

Effet :

```txt
empêche certains casts / actions
```

---

## 19. Damage Formula

La formule de dégâts doit suivre une structure claire :

```txt
BaseDamage
× WeaponCoefficient
× SkillCoefficient
× OffensiveModifiers
× Crit
× TargetMitigation
× StatusModifiers
```

Exemple conceptuel :

```txt
ATK
→ arme
→ skill
→ critique
→ vulnérabilité cible
→ mitigation DEF
→ dégâts finaux
```

---

## 20. Stat scaling des ennemis

Les ennemis et boss scalent principalement avec :

```txt
WorldLevel
```

Le WorldLevel influence :

```txt
HP ennemis
damage ennemis
stats globales ennemies
```

Il ne modifie pas automatiquement :

```txt
patterns
mécaniques
comportements
```

---

## 21. Stats affichées au joueur

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
damage mitigation
```

---

## 22. Extensibilité future

Le système doit permettre d’ajouter plus tard :

```txt
armor penetration
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

---

## 23. PvP

### Duel PvP

Le Duel PvP utilisera une couche d’équilibrage séparée.

Objectif :

```txt
éviter que les formules PvE cassent le PvP
```

---

### Autres modes PvP

Les modes suivants pourront utiliser des systèmes de loadout ou de stats dédiés :

```txt
Land Conquest
Spatial Conquest
AvA
```

---

## 24. Architecture recommandée

```txt
stats/
  base.ts
  advanced.ts
  derived.ts
  formulas.ts
  mitigation.ts
  status.ts
  enemy-scaling.ts
  pvp-balance.ts
```

---

## 25. Principe fondamental

Les stats doivent être :

```txt
lisibles
profondes
scalables
testables
extensibles
```

Elles doivent soutenir :

```txt
combat
equipment
skills
weapons
bosses
enemy scaling
PvP futur
```
