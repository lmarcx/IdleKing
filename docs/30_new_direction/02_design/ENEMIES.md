# 👹 Idle King — Enemy System (v1)

> ⚠️ **Concept v1.** Les données canoniques (familles, variants, élites, boss, drops) sont dans
> `ENEMIES_DATABASE_V2.md` (source of truth). Ce document reste le doc de vision/philosophie.

---

# 🧭 Vision

Les ennemis d’Idle King sont conçus comme :

```txt id="jlwm7n"
nombreux
rapides
modulaires
spécialisés
```

Le système vise un gameplay proche :

```txt id="ig1msl"
Diablo
ARPG
Hades-like
```

avec :

```txt id="ffmbde"
pression constante
positionnement
gestion des groupes
patterns lisibles
```

---

# ⚔️ Philosophie Gameplay

Les mobs sont généralement :

```txt id="hcx5fh"
nombreux
faibles individuellement
```

Mais :

```txt id="kll1v2"
dangereux en groupe
dangereux si sous-stuff
```

---

# 🧠 Danger

Les ennemis standards peuvent tuer le joueur si :

```txt id="d1jlwm"
- mauvais build
- mauvais positioning
- WorldLevel trop élevé
```

Le danger provient principalement :

```txt id="p0a1u4"
des synergies de groupes
```

et non seulement des individus.

---

# 🧱 Types d’ennemis

Le MVP supporte :

```txt id="lq5svf"
melee
ranged
caster
invocateur
shielder
healer
stunter
```

---

# 🧠 Philosophie des rôles

Chaque type possède :

```txt id="d90obd"
- un rôle clair
- un pattern identifiable
- une réponse gameplay attendue
```

---

# ⚔️ Melee

```txt id="kt5uzv"
- chase joueur
- pression proche
- attaque directe
```

---

# 🏹 Ranged

```txt id="77mfao"
- distance keep
- projectiles
- pression à distance
```

---

# 🪄 Caster

```txt id="nzk0o3"
- sorts
- zones
- debuffs
```

---

# 👹 Invocateur

```txt id="3g8vzw"
- invocation de mobs
- pression indirecte
```

---

# 🛡️ Shielder

```txt id="5hjlwm"
- shield ally
- protection groupe
```

---

# 💚 Healer

```txt id="1w9uh5"
- heal ally
- sustain groupe
```

---

# 💫 Stunter

```txt id="96rkwm"
- contrôle
- interruption
- pression gameplay
```

---

# 🧠 Patterns

Le système doit supporter :

```txt id="ljlwm9"
chase
kite
distance keep
dash
telegraph
projectile
flee
protect ally
shield ally
heal ally
```

---

# ⚠️ Télégraphes

Le gameplay utilise :

```txt id="9tws7j"
attaques instantanées
+
attaques télégraphiées
```

---

# 🎯 Philosophie des télégraphes

Les télégraphes doivent être :

```txt id="mjlwm8"
très visibles
lisibles
compréhensibles
```

Le joueur doit sentir :

```txt id="4x1wjm"
qu’il a la possibilité d’esquiver
```

---

# 🏃 Mobilité ennemie

Le MVP reste volontairement simple.

Les ennemis peuvent utiliser :

```txt id="vjlwm7"
dash
déplacement simple
distance keep
```

Pas de système de mobilité complexe pour le MVP.

---

# 🛡️ Défenses ennemies

Le système doit supporter :

```txt id="wjlwm3"
shield
armor
invulnerability
```

---

# 🧪 Status Effects

Tous les ennemis peuvent recevoir :

```txt id="jlwm2p"
burn
freeze
shock
bleed
stun
silence
```

---

# 🔮 Extensibilité future

Le système doit permettre plus tard :

```txt id="jlwm6f"
résistances
immunités
purges
adaptations
```

---

# 📈 Scaling

Les ennemis scalent uniquement via :

```txt id="xjlwm1"
WorldLevel
```

---

# 📊 Le scaling influence :

```txt id="ljlwm5"
HP
damage
stats globales
```

---

# ❌ Le scaling n’influence PAS :

```txt id="vjlwm2"
patterns
mécaniques
comportements
```

---

# 💎 Loot

Les ennemis utilisent :

```txt id="0jlwm4"
loot tables
drops aléatoires
```

---

# 📦 Les récompenses possibles

```txt id="pjlwm7"
ressources
équipements
consommables
craft materials
monnaies
```

---

# 🔁 Respawn

---

## 🟩 Mobs fixes

Les mobs fixes peuvent :

```txt id="qjlwm5"
respawn
```

---

## 🟦 Mobs de vagues

Les mobs de vagues :

```txt id="zjlwm1"
apparaissent une seule fois par instance
```

---

# 🧠 Composition des groupes

Le danger principal doit venir des synergies.

Exemples :

```txt id="mjlwm0"
tank + healer
ranged + shielder
stunter + melee
```

---

# ⚖️ Philosophie de difficulté

Les mobs individuels restent plutôt :

```txt id="xjlwm9"
permissifs
```

Mais leurs combinaisons peuvent devenir dangereuses.

---

# 🧱 Architecture Technique

# ⚠️ Principe Fondamental

Les ennemis ne doivent PAS être codés comme :

```txt id="rjlwm4"
scripts monolithiques uniques
```

Le système doit être :

```txt id="cjlwm8"
modulaire
composable
extensible
```

---

# 🧩 Architecture recommandée

Un ennemi est une combinaison de modules.

Exemple :

```txt id="4jlwm3"
movement module
attack module
target module
status module
support module
death module
```

---

# 🧱 Modules potentiels

```txt id="bjlwm7"
movement
dash
projectile
melee attack
aoe
telegraph
heal ally
shield ally
summon
flee
status apply
death effect
```

---

# 🔮 Extensibilité

Le système doit permettre facilement :

```txt id="qjlwm2"
nouveaux patterns
nouveaux comportements
nouveaux modules
nouveaux status
nouveaux types de mobs
```

---

# 📌 Philosophie Finale

Le système d’ennemis repose sur :

```txt id="7jlwm1"
lisibilité
modularité
pression gameplay
synergies de groupe
```

Le joueur doit :

```txt id="ljlwm3"
identifier les menaces
prioriser les cibles
gérer son positionnement
utiliser correctement ses skills
```

et non seulement tanker les dégâts.
