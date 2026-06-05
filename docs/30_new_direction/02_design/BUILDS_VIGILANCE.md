# Verdict global

## Ce qui est très fort

Tes sets ont :

✅ identité fantasy forte
✅ gameplay distinct
✅ vraie envie de collection/buildcraft
✅ bons archétypes ARPG
✅ synergies naturelles avec Equipment Sets
✅ triggers lisibles
✅ fantasy “Roi déchu / mythique” cohérente

Ça, c’est excellent.

---

# Les vrais problèmes

Je vais être volontairement sévère.

---

# 1. THUNDERKNIGHT EST BROKEN

Le plus gros problème.

Effets :

```txt
Vuln
+ SPEED
reset cooldown complet
+ crit damage
lightning stun burst
```

Le problème :

tu as mis **mobilité + burst + CDR-like + control + vuln scaling** dans le même set.

Ça donne :

```txt
Voltigeur + Thunderknight
=
monster absolu
```

Pourquoi ?

Voltigeur donne :

```txt
CDR
stamina
speed
mobility
```

Thunder :

```txt
speed
reset CDs
crit burst
stun
vuln
```

Résultat :

```txt
spam skills
quasi perma dash
reset explosifs
kite infini
burst énorme
```

=> build méta instant.

---

## Fix recommandé

Le reset cooldown total :

```txt
REMOVE
```

ou remplacer par :

```txt
reset 1 random skill
```

ou :

```txt
reduce cooldowns by X%
```

Sinon impossible à équilibrer.

---

# 2. MOTHERSTONE RESSURECTION EST TRÈS DANGEREUX

Revive :

```txt
30% HP
5min30
```

En solo PvE :

OK-ish.

Mais plus tard :

```txt
PvP
Boss Rush
Endgame
```

=> énorme problème.

Cas :

```txt
boss fight 8 minutes
```

Motherstone donne :

```txt
free extra life
```

Combiné avec :

```txt
tank build
shield
heal
```

= mur ambulant.

---

## Fix recommandé

Version plus saine :

Option A :

```txt
usable once per run
```

Option B :

```txt
revive disables all healing for X sec
```

Option C :

```txt
revive gives debuff after proc
```

Sinon auto-pick tank.

---

# 3. LORDFLAME A UNE SURCHARGE DE FAILSAFE

Actuellement :

```txt
33% HP → fire orbit
20% HP → shield
```

Donc offensif + survie.

Combiné avec :

```txt
Motherstone
```

ça donne :

```txt
shield
armor
revive
defensive fallback stacking
```

Un set burst ne devrait pas offrir autant de survivability passive.

---

## Fix recommandé

Lordflame doit rester glass.

Je garderais :

```txt
33% HP orbit
```

Mais je retirerais :

```txt
20% HP shield
```

Et remplacerais par :

```txt
burn spread
crit chain
ignite explosion
```

---

# 4. KINGFROST EST TROP DISPERSÉ

Il veut être :

```txt
tank
debuff
mobility
control
damage
```

Problème :

pas d’identité ultra claire.

Effets :

```txt
debuff power
DEF
freeze
damage bonus
dash trail
```

C’est un peu :

```txt
un peu de tout
```

Comparé à Thunder qui a une fantasy claire.

---

## Fix recommandé

Choisir :

### tank/control

OU

### frost assassin mobility

Pas les deux.

Je pousserais :

```txt
tank/control
```

Donc :

remove :

```txt
flat damage bonus
```

replace :

```txt
freeze synergy
damage reduction
slow aura
```

---

# 5. CROSS-SET BROKEN COMBINATIONS

Ton système autorise mix libre.

Très cool.

Mais voici les bombes.

---

## Combo 1

Thunder + Voltigeur

Déjà vu.

Broken.

---

## Combo 2

Motherstone + Pleureur

```txt
tank
regen
shield
revive
reflect
resist
```

=> immortal wall.

---

## Combo 3

Lordflame + Maraudeur

```txt
crit
crit dmg
burn
explosion
burst
```

Probablement OK.
Glass cannon fantasy cohérente.

---

## Combo 4

Thunder + Maraudeur

```txt
crit dmg
speed
vuln
burst
reset
```

Broken si reset reste.

---

## Combo 5

Kingfrost + Flageleur

```txt
freeze
debuff
mana
control
```

Très cool.
Bonne fantasy.

---

# 6. TOO MANY PASSIVE AUTOPROCS

Tu as beaucoup de :

```txt
when HP low
on crit
on attack
on dash
on death
```

Si on multiplie :

```txt
9 effects selected
```

ça devient :

```txt
proc simulator
```

Le joueur ne comprend plus.

---

## Fix recommandé

Règle design :

max :

```txt
1 major reactive proc per set
```

Sinon bruit cognitif.

---

# 7. MISSING COUNTERPLAY

Un bon set doit avoir une vraie faiblesse.

Actuellement :

Thunder weakness :

```txt
tank/support
```

Mais en pratique :

Thunder donne déjà :

```txt
mobility
burst
control
vuln
speed
```

donc faiblesse peu réelle.

---

# 8. POWER CREEP RISK

Ces sets sont très "mythic ARPG".

Cool.

Mais si dès le départ :

```txt
revive
CD reset
full shield
explosions
```

qu’est-ce qu’on met plus tard ?

---

## Reco

MVP :

version 60% puissance

Later :

unlock upgraded variants.

---

# Recommended balancing summary

## Lordflame

GOOD

Fix :

```txt
remove defensive shield
```

---

## Kingfrost

GOOD IDEA

Fix :

```txt
focus identity
remove generic damage buff
```

---

## Thunderknight

COOLEST fantasy

BUT broken.

Fix urgently :

```txt
remove full cooldown reset
```

---

## Motherstone

GOOD fantasy

Fix :

```txt
revive nerf / once per run / downside
```

---

# Design score

Fantasy:

```txt
9.5/10
```

Balance currently:

```txt
6/10
```

Long-term architecture:

```txt
9/10
```

Buildcraft potential:

```txt
10/10
```

---
