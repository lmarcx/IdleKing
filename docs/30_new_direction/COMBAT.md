Parfait. Là on a assez pour poser une **vraie direction de combat**.

Tu as raison : il faut ajouter `EQUIPMENTS.md`, parce que les équipements ne seront pas juste “+stats” à terme. Ils deviennent un pilier du build au même niveau que les skills.

Voici la synthèse propre.

---

# Direction validée — Combat Core

## Philosophie

Le combat est un **hack & slash Hades-like** :

```txt
déplacement libre
attaques manuelles
skills actifs
positionnement important
patterns à esquiver
feedback juicy
build stratégique
```

Mais ce n’est pas un pur jeu d’adresse : il y a un **stats check minimal**.

Principe :

```txt
Le skill peut compenser un léger retard de stats.
Mais une grosse différence de niveau/build doit rester décisive.
```

Donc :

```txt
joueur mal équipé + très bon skill = peut gagner difficilement
joueur très sous-stuff = se fait one shot
joueur bien stuff = combat plus confortable
```

---

# Modèle recommandé

## Documents à produire

```txt
COMBAT.md
SKILLS.md
ENEMIES.md
BOSS.md
EQUIPMENTS.md
BUILDINGS.md
```

`BUILDINGS.md` devra relier :

```txt
Mine → ressources équipement
Forge → craft / upgrade / recycle
Marché → achat / vente / économie
```

`EQUIPMENTS.md` devra relier :

```txt
stats
passifs
effets sur skills
raretés
ilvl
sets
forge
loot
```

---

# Combat

## Inputs

```txt
- déplacement libre
- attaque de base manuelle
- clic maintenu = attaque continue
- pas d’auto-attaque
- skills activés par le joueur
- visée libre pour les skills compatibles
```

## Attaque de base

```txt
- gratuite
- sans mana
- cadence basée sur Speed
- déclenchée uniquement par action joueur
```

## Ressources

Pour l’instant :

```txt
HP
Mana
```

Pas de stamina combat pour éviter de surcharger.

---

# Skills

Les skills sont un pilier du build.

```txt
- équipables
- interchangeables
- limités à 5 slots
- cooldowns
- certains avec coût en mana
```

Types de skills à supporter :

```txt
buff
debuff
projectile
auto-target
melee
aoe visée
directionnel
```

Le système doit rester ouvert pour ajouter de nouveaux types.

---

# Ennemis

Pour le MVP :

```txt
mobs avec patterns simples
```

Types prévus :

```txt
melee
ranged
caster
invocateur
shielder
healer
stunter
```

Chaque mob doit avoir son propre pattern simple, pas forcément une IA complexe.

---

# Boss

Les boss sont des **combats uniques avec mécaniques**.

Ils peuvent avoir :

```txt
phases
patterns
attaques télégraphiées
soak mechanics
invulnérabilité
one-shot mechanics
stun mechanics
invocations
mécaniques uniques
```

Principe :

```txt
Boss = skill-based + stat-based
```

Un joueur bien équipé encaisse mieux et tue plus vite.
Un joueur sous-stuff peut gagner seulement s’il maîtrise parfaitement le combat.

---

# Scaling

Très important : le scaling des ennemis dépend du **WorldLevel**.

```txt
WorldLevel ↑
→ ennemis plus forts
→ boss plus forts
→ niveau de menace supérieur
```

Le joueur ne scale pas automatiquement les ennemis avec son PlayerLevel.
C’est au joueur de progresser via :

```txt
équipement
skills
player level
build
```

pour battre les créatures du monde.

---

# Mort

```txt
mort = fin du run
```

Le joueur peut :

```txt
- relancer le donjon
- retourner au Kingdom
```

---

# Feedback

Style assez juicy :

```txt
damage numbers
crit plus impactants
screenshake
particles
hit flash
```

---

# Architecture logique recommandée

À terme, on devrait viser :

```txt
combat/
  types.ts
  damage.ts
  resources.ts
  hit-resolution.ts
  death.ts
  scaling.ts

skills/
  types.ts
  registry.ts
  targeting.ts
  cooldowns.ts
  costs.ts
  effects.ts

enemies/
  types.ts
  registry.ts
  patterns.ts
  scaling.ts

bosses/
  types.ts
  registry.ts
  phases.ts
  mechanics.ts
  patterns.ts

equipments/
  types.ts
  registry.ts
  stats.ts
  passives.ts
  skill-modifiers.ts
  rarity.ts
```

---

# Point clé à garder

Le cœur du jeu n’est pas seulement :

```txt
combat
```

C’est :

```txt
combat + build
```

Et le build est composé de :

```txt
équipement + skills + progression joueur
```

Le combat doit donc être pensé pour recevoir des effets externes :

```txt
+10% dégâts projectile
Royal Beam devient plus large
Fireball applique burn
Dash réduit le prochain dégât
Crits régénèrent 2 mana
Skill X coûte moins cher avec tel item
```

C’est exactement pour ça que `EQUIPMENTS.md` devient indispensable.


