# 💀 Idle King — Boss System (v1)

---

## 🧭 Vision

Les boss sont des entités spéciales de combat pouvant servir à la fois de :

```txt
- test de maîtrise combat
- check de build / stats
- moment narratif
- source majeure de loot
```

Ils doivent être construits comme des entités **réutilisables**, capables d’être intégrées dans plusieurs modes de jeu.

---

## 🧱 Principe fondamental

Un boss n’est pas attaché définitivement à un seul contenu.

```txt
BossDef = gameplay du boss
RewardProfile = récompenses selon contexte
ScriptProfile = scripts selon contexte
DifficultyProfile = scaling selon contexte
```

Exemple :

```txt
resurrected_scarecrow
  → Story Dungeon
  → Duel Offline
  → Boss Rush
```

---

## 🧩 Réutilisation par mode

Un même boss peut être utilisé dans :

```txt
- Story / Donjons
- Duel Offline
- Boss Rush
- Expéditions
- Events
- contenus endgame
```

Chaque mode peut modifier :

```txt
- rewards
- difficulté
- scripts actifs
- règles de victoire
- timer
- score
```

---

## 🧠 Boss = Enemy spécial

Architecture recommandée :

```txt
Boss = Enemy spécial
+
Phase system
+
Pattern system
+
Mechanic system
+
Arena system
+
Reward profile externe
```

---

## ⚔️ Patterns

Chaque boss doit pouvoir posséder plusieurs patterns.

Les patterns sont sélectionnés :

```txt
- aléatoirement
- selon la phase
- selon les HP restants
```

---

## 📉 Phases

Tous les boss n’ont pas forcément des phases complexes.

Mais le système doit permettre :

```txt
- plusieurs phases
- changement de patterns
- changement de rythme
- mécaniques différentes
```

Les phases sont principalement liées :

```txt
HP restant du boss
```

Exemple :

```txt
Phase 1 : 100% → 70%
Phase 2 : 70% → 35%
Phase 3 : 35% → 0%
```

---

## 🧩 Mécaniques de boss

Le système doit permettre une liste extensible de mécaniques.

Mécaniques prévues :

```txt
- attaques télégraphiées
- soak mechanics
- invulnérabilité
- one-shot mechanics
- stun mechanics
- invocations / adds
- bouclier à casser
- adds à tuer
- zones safe
- zones dangereuses
- zones mortelles
- interruption de cast
- debuff à cleanse
- mini puzzle d’arène
```

---

## 🏟️ Arènes

Les boss fights se déroulent dans des arènes fixes.

Une arène peut contenir :

```txt
- obstacles
- zones dangereuses
- zones mortelles
- zones safe
- éléments interactifs
- mini puzzle
```

Pas de changement d’arène prévu pour l’instant.

---

## 🎨 Télégraphes

Les télégraphes doivent toujours être lisibles.

La difficulté peut augmenter via :

```txt
- radius
- vitesse de hit
- intervalle entre télégraphes
- densité des attaques
```

---

## 🌈 Codes couleurs

```txt
orange → dégâts
rouge → dégâts mortels / one-shot
jaune → stun
bleu → debuff
vert → zone safe / heal léger / survie mécanique
```

---

## ⚖️ Difficulté

Les boss doivent être :

```txt
permissifs au début
puis progressivement punitifs
```

Les boss majeurs et contenus endgame peuvent être très exigeants.

---

## ☠️ One-shot mechanics

Les mécaniques OS doivent être :

```txt
- rares
- réservées aux boss majeurs
- réservées aux contenus difficiles / endgame
- toujours lisibles et évitables
```

Un OS peut être causé par :

```txt
- échec de mécanique
- mauvaise position
- absence dans une zone safe
- interruption ratée
```

---

## 📜 Scripts

Il faut distinguer deux types de scripts.

### Scripts de quête

```txt
- liés à la progression narrative
- joués une seule fois
- retirés en replay
```

### Scripts de boss

```txt
- liés à l’identité du boss
- peuvent rester en replay
- peuvent être joués dans plusieurs modes
```

Exemple :

```txt
phrase d’introduction du boss
cri de phase
phrase de mort
```

---

## 🎁 Récompenses

Les récompenses ne sont pas définies directement par le boss seul.

Elles dépendent du contexte :

```txt
mode
difficulté
quête
replay
event
```

---

## 🧱 Reward Profiles

Un boss peut être associé à plusieurs profils de récompenses.

Exemple :

```txt
resurrected_scarecrow.story_dungeon
  - XP
  - ressources
  - équipements

resurrected_scarecrow.duel_offline
  - ressources
  - équipements
  - monnaie spéciale

resurrected_scarecrow.boss_rush
  - score
  - monnaie spéciale
  - loot spécifique
```

---

## 💎 Drops possibles

Les boss peuvent donner :

```txt
- ressources rares
- ressources nombreuses
- équipements rares
- monnaie spéciale
- unlocks
- cosmetics plus tard
- titles plus tard
```

---

## 🔁 Rejouabilité

En replay :

```txt
- même loot table possible
- scripts de quête retirés
- scripts de boss conservés
- difficulté définie par le mode
- récompenses définies par le mode
```

---

## ⚔️ Duel Offline

En Duel Offline, un boss est :

```txt
- gameplay identique à sa version de base
- sans récompense de quête
- avec rewards propres au mode Duel
- modulable en difficulté
```

Le mode Duel peut servir à :

```txt
- tester les boss
- farmer certaines récompenses
- préparer le futur PvP
```

---

## 💀 Boss Rush

Le Boss Rush est un mode futur basé sur :

```txt
- enchaînement de boss
- timer
- classement
- difficulté croissante
- récompenses spécifiques
```

---

## 📈 Scaling

Le scaling d’un boss est défini par :

```txt
- WorldLevel
- mode de jeu
- difficulté choisie
```

Mais le boss conserve :

```txt
- son identité
- ses patterns
- ses mécaniques
```

---

## 🧱 Architecture recommandée

```txt
bosses/
  types.ts
  registry.ts
  phases.ts
  patterns.ts
  mechanics.ts
  arenas.ts
  scripts.ts
```

Récompenses séparées :

```txt
rewards/
  boss-reward-profiles.ts
```

Difficultés séparées :

```txt
difficulty/
  boss-difficulty-profiles.ts
```

---

## 📌 Philosophie finale

Un boss doit être pensé comme :

```txt
une entité gameplay réutilisable
```

et non comme :

```txt
un contenu figé dans un seul donjon
```

Le même boss peut être réutilisé, renforcé, modulé ou recontextualisé selon les besoins du jeu.
