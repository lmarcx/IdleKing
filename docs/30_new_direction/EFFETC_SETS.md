# ✨ Idle King — Effect Sets (v1)

## 1. Vision

Les Effect Sets représentent les effets passifs majeurs du build.

Ils ne sont pas à confondre avec les Equipment Sets.

```txt
Equipment Set = orientation statistique
Effect Set = effets passifs / mécaniques gameplay / identité légendaire
````

Les Effect Sets doivent permettre :

```txt
theorycraft
synergies
spécialisation
fantasy forte
progression endgame
```

---

## 2. Relation avec Effect Resonance

Le joueur débloque des slots d’effets grâce à l’Effect Resonance générée par ses 9 slots principaux :

```txt
helmet
chest
cape
gloves
belt
boots
weapon
offhand
necklace
```

Les slots suivants ne comptent pas :

```txt
rings
artifact
```

---

## 3. Règle de résonance

Chaque item équipé dans les 9 slots principaux apporte une valeur selon sa rareté.

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

Calcul :

```txt
EffectSlots = floor(totalResonance / 9)
```

Exemples :

```txt
9 Common    = 0 effet
9 Uncommon  = 1 effet
9 Epic      = 3 effets
9 Legendary = 4 effets
9 Mythic    = 5 effets
9 Divine    = 7 effets
9 Ancient   = 9 effets
```

Exemple hybride :

```txt
5 Ancient + 4 Legendary
= 61 resonance
= 6 effets disponibles
```

---

## 4. Structure d’un Effect Set

Chaque Effect Set contient :

```txt
5 effets ordonnés
```

Les effets doivent généralement suivre cette logique :

```txt
1. effet d’entrée / identité
2. effet défensif ou utilitaire
3. bonus de spécialisation
4. effet de survie ou puissance forte
5. effet signature / transformation du build
```

Le joueur peut sélectionner des effets parmi plusieurs Effect Sets, selon le nombre d’Effect Slots disponibles.

---

## 5. Règle importante

Un joueur n’est pas forcé de prendre tous les effets d’un seul set.

Il peut :

```txt
prendre les 5 effets d’un même set
ou
mélanger plusieurs effets de plusieurs sets
```

Exemple :

```txt
5 Lordflame
+
2 Thunderknight
+
2 Motherstone
```

---

## 6. Extensibilité

Le système doit permettre d’ajouter facilement :

```txt
nouveaux Effect Sets
nouveaux effets
nouveaux triggers
nouveaux cooldowns internes
nouvelles synergies
nouvelles restrictions
```

---

# 7. Effect Sets initiaux

---

# 🔥 Lordflame

## Rôle

```txt
burst
damage over time
```

## Fantasy

Un ancien Roi consumé par la Flamme Originelle dans sa folle quête du pouvoir finit par brûler son monde.

## Type

```txt
dps
```

## Effets

### 1 — Flame Crit

```txt
Les coups critiques peuvent brûler la cible.
Burn = damage over time.
```

### 2 — Dying Orbit

```txt
Lorsque le joueur atteint 33% HP :
invoque des boules de feu autour du joueur.
Les boules de feu infligent des dégâts aux ennemis proches.
Durée : 30s.
```

### 3 — Burning Precision

```txt
+10% crit chance contre les cibles brûlées.
```

### 4 — Last Flame Shield

```txt
Lorsque le joueur atteint 20% HP :
invoque un bouclier protégeant le joueur.
Durée : 30s.
```

### 5 — Royal Fireburst

```txt
Les coups critiques peuvent provoquer une explosion de feu.
L’explosion inflige des dégâts burst à la cible et aux ennemis proches.
Cooldown interne : 40s.
```

## Synergies

```txt
mobilité
burst
debuff
crit
burn
```

## Faiblesses

```txt
n’ajoute pas de mobilité
n’ajoute pas de buff
n’ajoute pas de tanking durable
centré sur burst et dégâts
```

---

# ❄️ Kingfrost

## Rôle

```txt
tank
control
debuff
```

## Fantasy

Le Roi Leon II, qui avait découvert un terrible secret, fut mystérieusement gelé avec tout son palais. On dit que certaines nuits glaciales, des murmures s’élèvent encore au-delà des remparts.

## Type

```txt
control
debuff
```

## Effets

### 1 — Frozen Curse

```txt
Debuff Power +X%.
```

### 2 — Ice Armor

```txt
Le joueur obtient une armure de glace.
DEF +X%.
```

### 3 — Right Hand Frost

```txt
L’action secondaire du joueur peut geler la cible.
Action secondaire = clic droit.
Freeze = slow.
```

### 4 — Frozen Weapon

```txt
L’arme du joueur devient gelée.
Le joueur inflige X% dégâts supplémentaires.
```

### 5 — Frost Trail

```txt
Lorsque le joueur dash :
laisse une traînée de glace.
La traînée inflige des dégâts aux ennemis présents dedans.
```

## Synergies

```txt
mobilité
tank
debuff
control
```

## Faiblesses

```txt
burst
buff power
mobilité pure
```

---

# ⚡ Thunderknight

## Rôle

```txt
mobilité
debuff
burst
```

## Fantasy

À la fin de la Guerre des Trois Dragons, au sommet du plus haut château, le Roi Amon VI livra un terrible combat contre les trois Dragons. Il obtint la transcendance et parvint à éliminer deux Dragons avant de mourir d’épuisement. Certains disent l’avoir aperçu lors de terribles nuits d’orage.

## Type

```txt
mobilité
debuff
burst
```

## Effets

### 1 — Exposed Strike

```txt
Les attaques de base peuvent infliger vulnérabilité.
Vulnerability = la cible subit plus de dégâts.
Cooldown interne : 20s.
```

### 2 — Storm Speed

```txt
SPEED +X%.
```

### 3 — Storm Reset

```txt
Les coups critiques ont une chance de reset tous les cooldowns.
Cooldown interne : 55s.
```

### 4 — Dragon Slayer Precision

```txt
Crit Damage +X%.
```

### 5 — Judgement Lightning

```txt
Les coups critiques peuvent invoquer la foudre sur l’ennemi.
La foudre inflige des dégâts et stun la cible pendant 1s.
Cooldown interne : 30s.
```

## Synergies

```txt
burst
control
mobilité
crit
speed
```

## Faiblesses

```txt
control adverse
support
tank
```

---

# 🌱 Motherstone

## Rôle

```txt
tank
heal
```

## Fantasy

Des restes d’un monde calciné s’éleva une force qui parvint à refaire jaillir la vie.

## Type

```txt
heal
support
```

## Effets

### 1 — Stone Vitality

```txt
HP +15%.
DEF +15%.
```

### 2 — Mother Armor

```txt
Lorsque le joueur atteint 50% HP :
invoque une armure qui absorbe un certain montant de dégâts.
Cooldown interne : 2min.
```

### 3 — Living Wound

```txt
Les attaques de base peuvent infliger saignement.
Bleed = weaken.
Cooldown interne : 30s.
```

### 4 — Rooted Grace

```txt
Healing Power +10%.
Buff Power +10%.
```

### 5 — Mother Rebirth

```txt
Si le joueur meurt :
il revient à la vie avec 30% HP.
Cooldown interne : 5min30s.
```

## Synergies

```txt
debuff
control
tank
heal
support
```

## Faiblesses

```txt
burst
contrôle offensif
mobilité
```

---

## 8. Cooldowns internes

Certains effets utilisent des cooldowns internes indépendants des skills.

Exemples :

```txt
Lordflame explosion → 40s
Thunderknight cooldown reset → 55s
Motherstone revive → 5min30s
```

Ces cooldowns doivent être suivis séparément des cooldowns de skills.

---

## 9. Architecture recommandée

```txt
effect-sets/
  types.ts
  registry.ts
  resonance.ts
  effect-selection.ts
  triggers.ts
  internal-cooldowns.ts
  effects.ts
```

---

## 10. Modèle conceptuel

```ts
type EffectSetDef = {
  id: string;
  name: string;
  role: string[];
  fantasy: string;
  effects: EffectDef[];
  synergies: string[];
  weaknesses: string[];
};

type EffectDef = {
  id: string;
  name: string;
  rank: 1 | 2 | 3 | 4 | 5;
  trigger: EffectTriggerDef;
  effect: EffectActionDef;
  internalCooldownMs?: number;
};
```

---

## 11. Principe fondamental

Un Effect Set ne doit pas être codé comme une logique spéciale dans le combat.

Il doit être défini par :

```txt
trigger
condition
effect
cooldown interne
scaling
```

Objectif :

```txt
ajouter un nouveau set
sans modifier le combat core
```
