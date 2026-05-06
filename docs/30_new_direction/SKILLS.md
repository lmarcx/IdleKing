# ✨ Idle King — Skills System (v1)

---

# 🧭 Vision

Les skills constituent l’un des piliers centraux du gameplay de *Idle King*.

Le gameplay repose sur :

```txt id="jtwjwp"
- armes
- skills
- mouvement
- build
- positioning
```

Les skills doivent permettre :

```txt id="jpnv7y"
- gameplay nerveux
- profondeur stratégique
- synergies de builds
- modularité
- extensibilité long terme
```

---

# ⚔️ Philosophie Gameplay

Le système vise un gameplay :

```txt id="r0o9kk"
Hades-like
hack & slash rapide
skill-based
```

avec :

```txt id="1y5u4h"
- spam rapide
- mobilité importante
- patterns à esquiver
- gameplay dynamique
```

---

# 🧱 Structure des skills

---

## 🎯 Slots de skills

Le joueur possède :

```txt id="dbx5ws"
5 skills actives équipables
```

Pas d’ultimate dédié.

---

## 🟩 Passifs

Les passifs proviennent principalement de :

```txt id="e9h0ly"
- effect sets
- équipements
- artifacts
- certains skills
```

---

# 🔋 Ressources

---

## 🟦 Mana

Certaines skills consomment :

```txt id="y8h7lp"
mana
```

---

## 🟨 Cooldowns

Toutes les skills utilisent :

```txt id="yv6fo1"
cooldown
```

---

## 🟪 Charges

Certaines skills peuvent utiliser :

```txt id="5e8znj"
charges
```

---

## 🔮 Extensibilité

Le système doit permettre plus tard :

```txt id="l3j0lg"
- génération mana
- consommation HP
- interaction stamina
- reset cooldown
- refund ressources
```

---

# 🏃 Mouvement

Le gameplay de base inclut :

```txt id="srd4ng"
- déplacement libre
- sprint
- dash
```

---

## ⚡ Sprint

```txt id="u4n8bf"
- augmente move speed
- consomme stamina
```

---

## 💨 Dash

Le dash sert principalement :

```txt id="1q97nf"
- esquive
- repositionnement
- évitement de patterns
```

---

## 🔮 Évolutions futures

Le système doit supporter :

```txt id="cc7ahg"
- iframe
- dash offensif
- dash modifié par équipement
- dash modifié par effects
```

---

# 🧱 Types de skills

Le système doit supporter :

```txt id="l6h8k8"
projectile
aoe
melee
directional
auto-target
buff
debuff
heal
shield
channeling
aura
mark
zone control
teleport
summon léger
```

---

# 🎯 Targeting

Les skills doivent pouvoir utiliser :

```txt id="m1c2gt"
free aim
ground target
cone
line
aoe
self cast
ally cast
enemy cast
auto target
```

---

# 🧠 Philosophie de ciblage

Certaines skills doivent demander :

```txt id="zfr7sx"
précision
positionnement
timing
```

---

# ⚔️ Relation armes ↔ skills

Les skills sont :

```txt id="79rlyw"
indépendantes des armes
```

Exemple :

```txt id="e8cys7"
Royal Beam fonctionne avec toutes les armes.
```

---

# 🧱 Builds

Le build d’un joueur repose sur :

```txt id="kofp5k"
skills équipées
+
equipment sets
+
effect sets
+
stats avancées
```

---

# 🧠 Types de builds supportés

```txt id="q0aj1w"
tank
glass cannon
balanced
crit
burn
heal
debuff
ranged
melee
speed
```

---

# 🔥 Status Effects

---

## 🔥 Burn

```txt id="h66gv9"
damage over time
```

---

## ❄️ Freeze

```txt id="4jlwmx"
slow
```

---

## ⚡ Shock

```txt id="f98l04"
vulnerability
```

---

## 🩸 Bleed

```txt id="mow5sl"
weaken
```

---

## 💫 Other Status

```txt id="o0ugnd"
stun
silence
```

---

# 🧠 Synergies

Le système doit permettre des synergies entre :

```txt id="14w8pn"
skills
effects
equipment
status
```

Exemples :

```txt id="0kjy4q"
burn + crit
burn + tank
freeze + heal
shock + burst
```

---

# 📈 Progression des skills

---

## 🟩 Skill Levels

Les skills progressent via :

```txt id="1v7m13"
skill points
```

obtenus par :

```txt id="k4jrwa"
- level up
- quêtes
```

---

## 🟦 Upgrade Structure

Pour le MVP :

```txt id="sz8e1j"
upgrade linéaire
```

Pas de branches complexes pour l’instant.

---

# 🧱 Architecture Technique

---

# ⚠️ Principe Fondamental

Les skills ne doivent PAS être codées comme :

```txt id="whw6f9"
scripts uniques rigides
```

Le système doit être :

```txt id="86bdf8"
modulaire
composable
extensible
```

---

# 🧩 Architecture modulaire recommandée

Une skill doit être construite via des composants.

Exemple :

```txt id="dkrhr0"
projectile
+
explode on impact
+
apply burn
+
spawn aoe
```

---

# 🧱 Modules potentiels

```txt id="cq13m5"
cast
projectile
movement
damage
heal
shield
buff
debuff
summon
channel
aoe
status application
resource interaction
```

---

# 🔮 Extensibilité

Le système doit permettre facilement :

```txt id="e98e4v"
- nouveaux comportements
- nouveaux status
- nouvelles ressources
- nouveaux types de targeting
- nouveaux modules
- nouvelles synergies
```

---

# 📌 Philosophie Finale

Le système de skills doit permettre :

```txt id="x6p7bo"
- gameplay nerveux
- expression du skill joueur
- theorycraft
- diversité des builds
- évolution long terme
```

Les skills sont conçues pour fonctionner avec :

```txt id="7hfd68"
weapons
movement
equipment
effect sets
combat mechanics
```

et former ensemble le cœur du gameplay d’Idle King.
