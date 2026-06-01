# 🧩 Idle King — Equipment Sets (v1)

## 1. Vision

Les Equipment Sets définissent l’identité statistique d’un build.

Ils ne sont pas à confondre avec les Effect Sets.

```txt
Equipment Set = stats avancées / orientation build
Effect Set = effets passifs / mécaniques spéciales
````

Un Equipment Set doit rester facilement extensible afin d’ajouter de nouveaux styles de build plus tard.

---

## 0. MVP Status (LOCKED — DESIGN_FREEZE_V1 §7, D-06)

**4 sets actifs au MVP** (équilibrés) :

| Set | Disponibilité | Rôle | Base bias | Stats avancées |
|---|---|---|---|---|
| Vagabond | Prologue | Mobilité / exploration | SPEED / Stamina | move speed, stamina regen, dash |
| Pleureur | Début Ch I | Tank / mitigation | HP / DEF | DEF, HP regen, (reflect futur) |
| Maraudeur | Début Ch II | Burst / crit | ATK / SPEED | crit chance, crit damage |
| Docteur | Ch II | Support / heal / mana | Mana / HP | healing power, buff power, mana regen, CDR |

**4 sets PLACEHOLDER** (non finalisés, retravaillés aux chapitres suivants, hors balancing MVP) :

```txt
Flageleur · Gardien des Cendres · Voltigeur · Reine Blanche
```

> Les fiches détaillées ci-dessous font foi pour le rôle mécanique de **Pleureur, Maraudeur, Docteur**.
> **Vagabond** (mobilité) est un set actif MVP. **Flageleur** et **Voltigeur** restent documentés mais en statut **placeholder**.

---

## 2. Principe général

Chaque item peut appartenir à un Equipment Set.

Le set influence principalement :

```txt
stats basiques favorisées
stats avancées disponibles
orientation du build
paliers d’upgrade
```

---

## 3. Stats basiques

Tous les sets peuvent donner des stats basiques :

```txt
HP
ATK
DEF
SPEED
```

Cependant, chaque set possède une orientation différente dans sa croissance.

Exemple :

```txt
Maraudeur → ATK / SPEED
Pleureur → HP / DEF
Voltigeur → SPEED / stamina
```

---

## 4. Stats avancées

Les stats avancées sont le vrai marqueur d’identité du set.

Elles définissent :

```txt
burst
debuff
mobilité
tank
heal
support
```

---

## 5. Sets initiaux

---

# Set du Maraudeur

## Rôle

```txt
burst
crit
dégâts rapides
```

## Fantasy

Set agressif orienté élimination rapide des cibles.

## Stats basiques

Toutes les stats basiques peuvent être présentes :

```txt
HP
ATK
DEF
SPEED
```

Orientation recommandée :

```txt
ATK
SPEED
```

## Stats avancées

```txt
crit chance
crit damage
```

## Forces

```txt
gros dégâts
burst
bon scaling offensif
```

## Faiblesses

```txt
tank
control
support
sustain
```

## Synergies possibles

```txt
build crit
build glass cannon
armes rapides
skills burst
Effect Sets offensifs
```

---

# Set du Flageleur

## Rôle

```txt
support debuff
contrôle indirect
affaiblissement cible
```

## Fantasy

Set orienté affliction, malédiction et réduction de puissance ennemie.

## Stats basiques

Toutes les stats basiques peuvent être présentes :

```txt
HP
ATK
DEF
SPEED
```

Orientation recommandée :

```txt
mana
survie correcte
```

## Stats avancées

```txt
debuff power
mana
mana regen
```

## Forces

```txt
affaiblit les ennemis
renforce les builds debuff
utile en combat long
utile contre boss
```

## Faiblesses

```txt
tank
dps direct
burst
```

## Synergies possibles

```txt
skills debuff
grimoire
shock
bleed
freeze
build contrôle
```

---

# Set du Voltigeur

## Rôle

```txt
mobilité
tempo
cooldown
repositionnement
```

## Fantasy

Set rapide, nerveux, conçu pour esquiver, engager et désengager.

## Stats basiques

Toutes les stats basiques peuvent être présentes :

```txt
HP
ATK
DEF
SPEED
```

Orientation recommandée :

```txt
SPEED
```

## Stats avancées

```txt
cooldown reduction
speed
stamina
stamina regen
```

## Forces

```txt
mobilité élevée
skills plus fréquentes
meilleur repositionnement
meilleure survie par esquive
```

## Faiblesses

```txt
dps brut
tank
support
```

## Synergies possibles

```txt
dash
sprint
build speed
skills à cooldown
armes mobiles
gameplay hit and run
```

---

# Set du Pleureur

## Rôle

```txt
tank
survie
mitigation
retour de dégâts
```

## Fantasy

Set défensif, lourd, orienté endurance et résistance.

## Stats basiques

Toutes les stats basiques peuvent être présentes :

```txt
HP
ATK
DEF
SPEED
```

Orientation recommandée :

```txt
HP
DEF
```

## Stats avancées

```txt
HP regen
DEF
resist
reflect
```

## Notes

Certaines stats sont prévues pour plus tard :

```txt
resist → réduction effets de contrôle
reflect → renvoi de dégâts
```

## Forces

```txt
survie élevée
résistance aux erreurs
utile contre groupes
utile contre boss punitifs
```

## Faiblesses

```txt
dps
support
mobilité
```

## Synergies possibles

```txt
bouclier
skills défensives
Stoneguard
build tank
cleanse
damage reduction
```

---

# Set du Docteur

## Rôle

```txt
support heal
buff
sustain
```

## Fantasy

Set orienté soin, protection et maintien du groupe ou du joueur.

## Stats basiques

Toutes les stats basiques peuvent être présentes :

```txt
HP
ATK
DEF
SPEED
```

Orientation recommandée :

```txt
mana
survie
```

## Stats avancées

```txt
healing power
buff power
cooldown reduction
mana
mana regen
```

## Forces

```txt
soin
buffs
sustain
support long combat
réduction downtime
```

## Faiblesses

```txt
burst
dps direct
tank pur
```

## Synergies possibles

```txt
heal
shield
bâton
grimoire
skills support
build mana-heavy
```

---

## 6. Architecture recommandée

Chaque Equipment Set doit être défini sous forme de fiche data.

```ts
type EquipmentSetDef = {
  id: string;
  name: string;
  role: string;
  fantasy: string;
  baseStatBias: StatId[];
  advancedStats: AdvancedStatId[];
  strengths: string[];
  weaknesses: string[];
  synergies: string[];
};
```

---

## 7. Extensibilité

Le système doit permettre d’ajouter facilement :

```txt
nouveaux sets
nouvelles stats avancées
nouvelles synergies
nouveaux rôles
nouvelles faiblesses
```

Un nouveau set ne doit pas nécessiter de modifier le combat core.

```

Je note juste un point à clarifier plus tard : **HP regen, resist et reflect** ne sont pas encore dans `STATS.md`. Il faudra soit les ajouter en “stats futures prévues”, soit les intégrer officiellement dès maintenant.
```
