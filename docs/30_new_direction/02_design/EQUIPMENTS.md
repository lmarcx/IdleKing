# ⚔️ Idle King — Equipment System (v1)

---

# 🧭 Vision

Le système d’équipement constitue l’un des piliers majeurs du gameplay de *Idle King*.

Le build d’un joueur repose sur la combinaison de :

```txt
- équipements
- patterns d’armes
- skills équipés
- sets d’équipement
- effect sets
- progression Forge
```

Le système doit permettre :

```txt
- progression verticale
- theorycraft avancé
- spécialisation gameplay
- personnalisation des builds
- extensibilité long terme
```

---

# 🧱 Architecture générale

Le système est séparé en plusieurs couches distinctes :

```txt
Equipment Set
≠
Effect Set
≠
Weapon Pattern
```

---

# 🟦 Equipment Set

Les Equipment Sets définissent principalement :

```txt
- les stats avancées disponibles
- l’identité statistique du build
- les bonus de palier
```

Exemples :

```txt
Bastion → tank / défense
Prédateur → critique / vitesse
Érudit → mana / buff
```

---

# 🟪 Effect Set

Les Effect Sets définissent :

```txt
- les effets passifs
- les modifications gameplay
- les interactions avancées
```

Exemples :

```txt
Fireflame
Frostbind
Thunderstep
Stoneguard
```

---

# 🟥 Weapon Pattern

Les Weapon Patterns définissent :

```txt
- la mécanique d’attaque de base
- les patterns offensifs
- le gameplay fondamental de l’arme
```

Chaque arme possède son propre comportement.

---

# 🧱 Slots d’équipement

## 🟩 Slots principaux (Effect Resonance)

Ces 9 slots participent au système de résonance :

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

---

## 🟨 Slots secondaires

Ces slots ne participent pas à la résonance :

```txt
rings (x5)
artifact (x1)
```

### Rôle

```txt
rings → modificateurs de skills
artifact → modificateur gameplay / arme
```

---

# ⚔️ Armes

---

## 🗡️ Armes à une main

```txt
épée
dague
hache
grimoire
bouclier
pistolet
```

---

## 🪓 Armes à deux mains

```txt
espadon
lance
arc
bâton
```

---

## 🧱 Règle des armes à deux mains

Lorsqu’une arme deux mains est équipée :

```txt
weapon = arme principale
offhand = verrouillé / occupé
```

Le slot offhand compte malgré tout dans la résonance.

---

# ⚔️ Weapon Patterns

---

## 🗡️ Épée

```txt
- attaque en cône face au joueur
- portée moyenne
- gameplay polyvalent
```

---

## 🗡️ Dague

```txt
- attaque rapide
- portée courte
- gameplay agressif mobile
```

---

## 🪓 Hache

```txt
- attaque circulaire proche
- petite zone autour du joueur
- gameplay zone / pression
```

---

## 📖 Grimoire

### Clic gauche

```txt
allié / soi-même → heal
ennemi → réduction défense
```

### Clic droit

```txt
allié → augmentation dégâts
ennemi → réduction dégâts
```

Gameplay support/debuff.

---

## 🛡️ Bouclier

```txt
- attaque courte en ligne
- pousse le joueur vers l’avant
- gameplay engage / défense
```

---

## 🔫 Pistolet

```txt
- projectile vers curseur
- gameplay distance / précision
```

---

## ⚔️ Espadon

```txt
- attaque large en cône
- portée supérieure à l’épée
- gameplay lourd / zone
```

---

## spear Lance

```txt
- attaque linéaire
- grande portée
- cadence moyenne
- gameplay spacing
```

---

## 🏹 Arc

```txt
- projectile directionnel
- charge possible via clic maintenu
- portée et dégâts augmentés
```

---

## 🪄 Bâton

### Clic gauche

```txt
- dégâts en zone autour du curseur
```

### Clic droit

```txt
- zone protectrice autour du joueur
- réduction dégâts alliés
```

Gameplay mage/support.

---

# 📈 Stats

---

## 🟩 Stats principales

```txt
HP
ATK
DEF
POWER
SPEED
```

---

## 🟦 Stats avancées

```txt
crit chance
crit damage
mana
mana regen
stamina
stamina regen
attack speed
move speed
cooldown reduction
healing power
buff power
debuff power
```

---

## 🔮 Extensibilité

Le système doit permettre l’ajout futur de nouvelles stats.

---

# 🟣 Raretés

```txt
Common      (gris)
Uncommon    (marron)
Rare        (jaune)
Epic        (violet)
Legendary   (orange)
Mythic      (bleu-violet)
Divine      (rose clair)
Ancient     (blanc doré)
```

---

# 📈 Effets des raretés

Les raretés influencent :

```txt
- puissance des stats
- nombre d’effets disponibles
- puissance des effets
```

Ancient ajoute également :

```txt
- visuel unique
```

---

# 🧠 Effect Resonance

## 🎯 Principe

Les 9 slots principaux génèrent un score de résonance selon leur rareté.

Ce score détermine :

```txt
combien d’effets passifs le joueur peut équiper
```

---

## 📊 Valeur de résonance

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

## 🧮 Calcul

```txt
EffectSlots = floor(totalResonance / 9)
```

---

## 📌 Exemples

```txt
9 Common      = 0 effets
9 Uncommon    = 1 effet
9 Epic        = 3 effets
9 Legendary   = 4 effets
9 Mythic      = 5 effets
9 Divine      = 7 effets
9 Ancient     = 9 effets
```

Exemple hybride :

```txt
5 Ancient + 4 Legendary
= 61 resonance
= 6 effets disponibles
```

---

# 🧪 Effect Sets

Les Effect Sets sont des ensembles d’effets passifs sélectionnables.

Exemples validés :

```txt
Fireflame
Frostbind
Thunderstep
Stoneguard
```

---

## 🔥 Exemple — Fireflame

```txt
1. Crits appliquent brûlure
2. Flammes orbitent autour du joueur
3. Bonus dégâts sur cible brûlée
4. Bouclier brûlant défensif
5. Crits provoquent explosion massive
```

---

# 🧱 Progression des items

Chaque item possède :

```txt
- ilvl fixe
- rareté
- niveau d’upgrade
- stats principales
- stats avancées
```

---

# 📈 Item Level (ilvl)

Le ilvl définit :

```txt
- puissance globale de base
- coefficient statistique
```

Exemple :

```txt
ilvl10 < ilvl40
```

indépendamment de la rareté.

---

# 🔨 Upgrade

Les upgrades augmentent :

```txt
- stats de base à chaque niveau
- stats avancées aux paliers
```

---

## 📊 Paliers par rareté

### Common / Uncommon

```txt
+3
+6
```

### Epic

```txt
+3
+6
+9
```

### Legendary

```txt
+3
+6
+9
+12
```

### Mythic

```txt
+3
+6
+9
+12
+15
```

### Divine

```txt
+3
+6
+9
+12
+15
+18
```

### Ancient

```txt
+3
+6
+9
+12
+15
+18
+21
```

---

# 🧱 Forge Systems

---

## 🔨 Craft

Créer un item via recette.

---

## ⬆️ Upgrade

Augmenter le niveau de l’item.

---

## 🌟 Evolve

Augmenter la rareté.

---

## ✨ Enchant

Modifier l’Effect Set / affinité.

---

## ♻️ Recycle

Détruire un item contre ressources.

---

## 🔺 Fusion

Sacrifier 3 items pour générer un nouvel item.

Peut :

```txt
- changer le type
- augmenter la rareté
- reset le niveau
```

---

# 🧠 Build Philosophy

Le système doit permettre :

```txt
build crit
build DOT
build tank
build mobilité
build support
build ranged
build melee
build glass cannon
```

Les builds peuvent modifier profondément le gameplay.

---

# 🔁 Acquisition des équipements

Les équipements peuvent provenir de :

```txt
- craft Forge
- loot mobs
- loot boss
- récompenses quête
- marchands
- fusion
```

---

# 🏪 Marché

Pour l’instant :

```txt
achat PNJ
vente PNJ
```

Pas de trading joueur au MVP.

---

# 📌 Philosophie finale

Le système d’équipement d’Idle King repose sur :

```txt
progression
personnalisation
theorycraft
synergie gameplay
```

L’objectif final est que le joueur :

```txt
- cherche des pièces Ancient optimales
- expérimente plusieurs builds
- combine skills et équipements
- optimise ses sets et ses effets
```
