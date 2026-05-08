# Idle King — Combat System (v1)

## 1. Vision

Le combat d’Idle King est un système **hack & slash Hades-like**, nerveux, lisible et orienté build.

Il repose sur quatre piliers :

```txt
1. Positioning
2. Timing
3. Build
4. Execution
```

Le joueur doit ressentir une vraie progression de puissance, sans que le combat devienne passif.

---

## 2. Philosophie

Le combat doit être :

```txt
rapide
manuel
juicy
lisible
punitif si sous-stuff
maîtrisable avec du skill
```

Le skill du joueur peut compenser un léger retard de stats.

Mais une différence importante de niveau, d’équipement ou de build doit rester décisive.

Exemple :

```txt
joueur lvl 20 > joueur lvl 1
joueur lvl 50 > joueur lvl 20
```

---

## 3. Gameplay de base

Le joueur dispose de :

```txt
déplacement libre
attaque de base manuelle
clic maintenu pour attaque continue
dash
sprint
5 skills actifs
```

Il n’y a pas d’attaque automatique.

Chaque action offensive ou défensive doit être déclenchée par le joueur.

---

## 4. Ressources de combat

Le système utilise trois ressources principales :

```txt
HP
Mana
Stamina
```

### HP

```txt
survie du joueur
mort à 0
```

### Mana

```txt
utilisation de certains skills
gestion du burst
limitation de certaines capacités puissantes
```

### Stamina

```txt
sprint
mobilité prolongée
gestion du positionnement
```

---

## 5. Mouvement

Le mouvement est central dans le combat.

Le joueur doit pouvoir :

```txt
se repositionner
esquiver
kite
engager
désengager
traverser une arène
éviter les télégraphes
```

---

## 6. Sprint

Le sprint :

```txt
augmente la vitesse de déplacement
consomme de la stamina
est maintenu par input joueur
```

Il sert à :

```txt
explorer plus vite
fuir une zone dangereuse
se repositionner
optimiser un combat
```

---

## 7. Dash

Le dash est une esquive courte et réactive.

Il sert à :

```txt
éviter un pattern
sortir d’une zone
traverser un danger
repositionner le joueur
```

Le système doit permettre plus tard :

```txt
iframe
dash offensif
dash modifié par effet
dash modifié par artifact
dash modifié par équipement
```

---

## 8. Attaque de base

L’attaque de base est :

```txt
manuelle
gratuite
basée sur l’arme équipée
influencée par attack speed
```

Le joueur peut maintenir l’input pour attaquer en continu.

---

## 9. Armes

Les armes déterminent le pattern d’attaque de base.

Exemples :

```txt
épée → cône face au joueur
dague → coup rapide en pic
hache → petite zone autour du joueur
pistolet → projectile vers curseur
arc → projectile chargé
bâton → zone ciblée
```

Les skills restent indépendants des armes.

---

## 10. Skills

Le joueur peut équiper :

```txt
5 skills actifs
```

Les skills peuvent utiliser :

```txt
cooldown
mana
charges
```

Types supportés :

```txt
projectile
aoe
directionnel
buff
debuff
heal
shield
aura
channel
mark
zone control
summon léger
```

---

## 11. Build

Le build du joueur repose sur :

```txt
arme
skills
équipements
equipment sets
effect sets
stats avancées
rings
artifact
```

Le combat doit pouvoir supporter des builds :

```txt
tank
glass cannon
crit
burn
heal
debuff
speed
distance
corps-à-corps
équilibré
```

---

## 12. Stats

Les stats influencent directement le combat.

### Stats principales

```txt
HP
ATK
DEF
POWER
SPEED
```

### Stats avancées

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

## 13. Scaling

Le scaling des ennemis et boss dépend principalement du :

```txt
WorldLevel
```

Un monde de niveau supérieur contient des créatures plus puissantes.

Le joueur doit progresser via :

```txt
level
équipements
skills
build
forge
```

pour affronter ces créatures.

---

## 14. Difficulté

Le combat est :

```txt
permissif au début
progressivement punitif
très punitif si le joueur est sous-stuff
```

Un joueur sous-équipé peut réussir un combat difficile uniquement s’il évite parfaitement les patterns.

---

## 15. Status Effects

Le système supporte :

```txt
burn
freeze
shock
bleed
stun
silence
```

### Burn

```txt
damage over time
```

### Freeze

```txt
slow
```

### Shock

```txt
vulnerability
```

### Bleed

```txt
weaken
```

### Stun

```txt
contrôle temporaire
```

### Silence

```txt
empêche certaines actions / casts
```

---

## 16. Ennemis

Les mobs sont :

```txt
nombreux
faibles individuellement
dangereux en groupe
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

Le danger vient souvent des compositions :

```txt
tank + healer
ranged + shielder
stunter + melee
```

---

## 17. Boss

Les boss sont des combats uniques combinant :

```txt
patterns
phases
mécaniques
arène
télégraphes
reward profile
```

Ils sont :

```txt
skill-based
+
stat-based
```

Le boss doit rester lisible, mais peut devenir très punitif.

---

## 18. Télégraphes

Les télégraphes sont essentiels.

Codes couleurs :

```txt
orange → dégâts
rouge → dégâts mortels / one-shot
jaune → stun
bleu → debuff
vert → zone safe / heal léger
```

Ils doivent toujours être lisibles.

La difficulté peut augmenter via :

```txt
radius
vitesse
intervalle
densité
enchaînement
```

---

## 19. Mort

Quand le joueur meurt :

```txt
le combat / run se termine
```

Le joueur peut :

```txt
relancer le contenu
retourner au Kingdom
```

Il conserve ce qu’il a obtenu avant sa mort selon les règles du level.

---

## 20. Feedback combat

Le combat doit être juicy :

```txt
damage numbers
crit plus impactants
particles
screenshake
hit flash
effets visuels lisibles
```

Le feedback doit aider à comprendre :

```txt
hit confirmé
crit
danger
mort
débuff
status
récompense
```

---

## 21. Architecture technique

Le combat ne doit pas être couplé au rendu Pixi.

Il faut séparer :

```txt
combat-core
combat-runtime
combat-visuals
```

### Combat Core

```txt
calculs purs
damage
resources
status
cooldowns
scaling
death
```

### Combat Runtime

```txt
état courant du combat
positions
timers
entities
casts
hits
projectiles
```

### Combat Visuals

```txt
Pixi
particles
animations
damage numbers
telegraphs
screenshake
```

---

## 22. Principe fondamental

Le système de combat doit être :

```txt
modulaire
testable
extensible
découplé du rendu
```

Un changement de skill, boss, arme ou ennemi ne doit pas nécessiter de modifier tout le stage Pixi.

---

## 23. Liens avec les autres documents

```txt
SKILLS.md → skills actifs, ciblage, cooldowns
WEAPONS.md → patterns d’armes
EQUIPMENTS.md → stats, raretés, passifs
ENEMIES.md → mobs, patterns, scaling
BOSS.md → phases, mécaniques, rewards
LEVELDESIGN.md → objectifs, instances, récompenses
```

---

## 24. Conclusion

Le combat d’Idle King repose sur un équilibre :

```txt
progression RPG
+
maîtrise action
+
build stratégique
```

Le joueur doit avoir envie de :

```txt
améliorer son équipement
tester des skills
changer de build
apprendre les boss
optimiser son gameplay
```

C’est ce système qui doit porter le cœur du jeu.
