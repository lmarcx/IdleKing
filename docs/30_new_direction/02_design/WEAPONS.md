# ⚔️ Idle King — Weapons System (v2)

## 1. Vision

Les armes définissent le gameplay de base du joueur.

Elles déterminent :

- les attaques liées au clic gauche
- les attaques liées au clic droit
- la portée
- la cadence
- le style de combat
- le rôle offensif / défensif / support

Les armes sont indépendantes des skills.

Principe :

```txt
armes = gameplay de base
skills = capacités actives
equipment = stats / passifs / build
artifact = modificateur gameplay des armes
````

---

## 2. Philosophie

Les armes doivent offrir des identités fortes et immédiatement reconnaissables.

Le joueur doit sentir une vraie différence entre :

```txt
épée
dague
arc
grimoire
espadon
etc.
```

L’objectif :

```txt
changer d’arme = changer le gameplay de base
```

sans casser :

```txt
skills
combat system
equipment system
```

---

## 3. Catégories d’armes

Deux familles existent.

### Armes à une main

Utilisent un seul slot réel.

```txt
weapon
ou
offhand
```

Liste :

```txt
épée
hache
dague
bouclier
grimoire
pistolet
```

---

### Armes à deux mains

Occupent :

```txt
weapon
+
offhand
```

Liste :

```txt
espadon
lance
arc
bâton
```

---

## 4. Système d’input

---

### Armes à une main

Le comportement dépend du slot.

Règle :

```txt
main weapon = clic gauche
offhand = clic droit
```

Une même arme peut donc avoir deux comportements différents.

Exemple :

```txt
épée main hand = attaque offensive
épée offhand = parade défensive
```

---

### Armes à deux mains

Une arme deux mains occupe les deux slots.

```txt
weapon = équipé
offhand = verrouillé
```

Elle possède donc deux patterns intégrés :

```txt
clic gauche = pattern primaire
clic droit = pattern secondaire
```

---

## 5. Résonance

Même lorsqu’une arme deux mains est équipée :

```txt
offhand compte toujours
```

pour :

```txt
Effect Resonance
```

Le joueur conserve donc :

```txt
9 slots de résonance actifs
```

---

# 6. Armes à une main

---

## Épée

### Main weapon / clic gauche

```txt
tranche en cône face au joueur
```

Style :

```txt
polyvalent
corps-à-corps
équilibré
```

---

### Offhand / clic droit

```txt
parade
réduction dégâts
```

Évolution future :

```txt
parade parfaite
contre-attaque
timing gameplay
```

---

## Hache

### Main weapon / clic gauche

```txt
lancer de hache vers le curseur
```

Style :

```txt
agressif
mid-range
pression
```

---

### Offhand / clic droit

```txt
attaque circulaire autour du joueur
```

Style :

```txt
nettoyage de groupe
zone proche
```

---

## Dague

### Main weapon / clic gauche

```txt
coup rapide face au joueur
```

Style :

```txt
burst
cadence rapide
mobilité
```

---

### Offhand / clic droit

```txt
téléportation derrière l’ennemi
```

Style :

```txt
assassin
positionnement
engage
```

---

## Bouclier

### Main weapon / clic gauche

```txt
ruée vers le curseur
```

Style :

```txt
engage
tank
contrôle position
```

---

### Offhand / clic droit

```txt
parade
réduction dégâts
```

Évolution future :

```txt
perfect block
contre
taunt interactions
```

---

## Grimoire

### Main weapon / clic gauche

```txt
invoque des sbires
maximum 3
consomme mana
```

Style :

```txt
support
invocation
gestion ressources
```

---

### Offhand / clic droit

Sur cible ennemie :

```txt
debuff
```

Sur cible alliée :

```txt
buff
```

Style :

```txt
support
contrôle
utility
```

---

## Pistolet

### Main weapon / clic gauche

```txt
attaque corps-à-corps
peut stun
```

Style :

```txt
hybride
pression proche
```

---

### Offhand / clic droit

```txt
tir vers le curseur
```

Style :

```txt
distance
précision
```

---

# 7. Armes à deux mains

---

## Espadon

### Clic gauche

```txt
coup large face au joueur
```

Style :

```txt
zone
impact
corps-à-corps lourd
```

---

### Clic droit

```txt
tourbillon
le joueur tranche les ennemis traversés
```

Style :

```txt
clear
pression
melee mobile
```

---

## Lance

### Clic gauche

```txt
attaque linéaire longue
style dague longue portée
```

Style :

```txt
spacing
precision melee
```

---

### Clic droit

```txt
ruée qui empale les ennemis
```

Style :

```txt
engage
burst
contrôle ligne
```

---

## Arc

### Clic gauche

```txt
tir simple vers curseur
```

Maintien :

```txt
charge
```

La charge augmente :

```txt
portée
dégâts
```

---

### Clic droit

```txt
tir triple en cône
```

Maintien :

```txt
charge
```

Style :

```txt
distance
burst
clear
```

---

## Bâton

### Clic gauche

```txt
dégâts dans un radius autour du clic
```

Style :

```txt
mage
zone control
```

---

### Clic droit

```txt
zone protectrice autour du joueur
réduction dégâts alliés
```

Style :

```txt
support
défense
contrôle terrain
```

---

# 8. Charge mechanics

Certaines armes supportent le clic maintenu.

Exemples :

```txt
arc
potentiellement futures armes
```

La charge peut modifier :

```txt
dégâts
portée
zone
vitesse projectile
effets secondaires
```

---

# 9. Relation avec les stats

Les armes peuvent utiliser :

```txt
ATK
SPEED
crit chance
crit damage
mana
stamina
healing power
buff power
debuff power
```

Exemples :

```txt
ATK → dégâts
SPEED → cadence
Healing Power → bâton / grimoire
Buff Power → buffs support
Debuff Power → debuffs
Mana → invocations / utility
```

---

# 10. Relation avec les skills

Les skills sont indépendantes des armes.

Exemple :

```txt
Royal Beam fonctionne avec toutes les armes
```

Donc :

```txt
arme = gameplay de base
skill = gameplay actif complémentaire
```

---

# 11. Relation avec artifacts

L’artifact modifie le gameplay des armes.

Exemples futurs :

```txt
épée → parade parfaite contre automatiquement
hache → lancer rebondit
dague → tp laisse clone
arc → tir chargé traverse
bâton → zone protectrice soigne
```

---

# 12. Architecture recommandée

```txt
weapons/
  types.ts
  registry.ts
  input-resolver.ts
  patterns.ts
  targeting.ts
  coefficients.ts
  charge.ts
  artifact-modifiers.ts
```

---

# 13. Modèle conceptuel

```ts
type WeaponHandedness = "one_handed" | "two_handed";

type WeaponDef = {
  id: string;
  name: string;
  handedness: WeaponHandedness;

  mainHandPattern?: WeaponPatternDef;
  offHandPattern?: WeaponPatternDef;

  primaryPattern?: WeaponPatternDef;
  secondaryPattern?: WeaponPatternDef;
};
```

---

# 14. Résolution runtime

```txt
clic gauche =
  arme une main équipée en weapon
  OU
  pattern primaire d’une arme deux mains

clic droit =
  arme une main équipée en offhand
  OU
  pattern secondaire d’une arme deux mains
```

---

# 15. Principe fondamental

Une arme ne doit jamais être codée directement dans le stage Pixi.

Architecture :

```txt
WeaponDef
+
WeaponPattern
+
WeaponRuntime
+
WeaponVisual
```

Objectif :

```txt
changer une arme
sans casser combat / skills / equipment
```


