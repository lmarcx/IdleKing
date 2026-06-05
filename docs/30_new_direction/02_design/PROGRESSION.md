## 1. Mode progression

Ce que j’appelais “mode progression”, c’est simplement :

```txt
Duel débloqué à tel moment
Boss Rush débloqué plus tard
Abysses débloquées endgame
difficultés de mode débloquées progressivement
récompenses de mode qui évoluent
```

Donc oui, dans ton cas :

```txt
modes débloqués par Story + WorldLevel
difficultés / rewards gérés au cas par cas
```

## 2. Soft cap / hard cap

Un **hard cap**, c’est une limite fixe.

Exemple :

```txt
Player Level max 50
World Level max 50
```

Un **soft cap**, c’est quand on peut continuer, mais avec rendement réduit.

Exemple :

```txt
après 50% cooldown reduction, chaque point compte moins
```

Dans ton système actuel, on note surtout des **hard caps MVP**, puis ascension/seasons plus tard.

Je te rédige maintenant le document propre.

# 📄 `PROGRESSION.md` — v1

````md
# 📈 Idle King — Progression System (v1)

## 1. Vision

La progression d’Idle King repose sur plusieurs couches interconnectées.

```txt
Player Progression
World Progression
Story Progression
Building Progression
Equipment Progression
Skill Progression
Resource Progression
Currency Progression
Mode Unlocks
````

Chaque couche doit soutenir les autres sans créer une progression confuse.

Objectif :

```txt
donner au joueur une montée en puissance constante
tout en gardant des objectifs clairs
```

---

## 2. Piliers de progression

Le joueur progresse via :

```txt
niveau du personnage
niveau du World
avancée Story
bâtiments
équipement
skills
ressources
currencies
déblocage de modes
```

Ces systèmes sont connectés mais doivent rester séparés techniquement.

---

# 3. Player Progression

## Max Level

```txt
Player Level max = 50
```

---

## XP Sources

Le joueur gagne de l’XP via :

```txt
mobs
boss
fin de contenu
quêtes
runs de modes de jeu
events
```

---

## Level Up

Le level up joueur est :

```txt
automatique
```

Lorsqu’un joueur gagne un niveau :

```txt
stats basiques augmentent
```

> Le level up n'octroie PLUS de skill point (DESIGN_FREEZE_V1 §3, D-02 — ring-scaling pur).

Stats basiques concernées :

```txt
HP
ATK
DEF
SPEED
```

---

## Skill Points

> ❌ SUPPRIMÉ du MVP (DESIGN_FREEZE_V1 §3, D-02). Les skills n'ont pas de niveau propre :
> leur puissance vient du ring (ring-scaling pur). Aucun skill point n'existe au MVP.

---

# 4. World Progression

## Max Level

```txt
World Level max = 50
```

---

## WXP

Le World utilise :

```txt
WXP
```

WXP signifie :

```txt
World XP
```

---

## Source de WXP

Le WXP provient uniquement du :

```txt
Temple
```

Le Temple convertit :

```txt
XP_GLOBAL → WXP
```

---

## World Level Up

Le World Level Up est :

```txt
manuel
```

Il s’effectue au :

```txt
Forum
```

Condition :

```txt
WXP suffisant
```

---

## Effets du World Level Up

Lorsqu’un World gagne un niveau :

```txt
World HP augmente
World Energy augmente
World HP refill
World Energy refill
unlocks possibles
```

Des stats ou bonus supplémentaires pourront être ajoutés plus tard.

---

## World Unlocks

WorldLevel peut contribuer au déblocage de :

```txt
bâtiments
upgrades de bâtiments
recettes
modes de jeu
quêtes
contenus futurs
```

Souvent en combinaison avec :

```txt
avancée Story
```

---

# 5. Story Progression

## Structure

La Story est :

```txt
linéaire
```

Elle progresse via :

```txt
chapitres
donjons
quêtes
boss
scripts
unlocks
```

---

## Ce que la Story débloque

La Story peut débloquer :

```txt
chapitres
donjons
bâtiments
quêtes
boss
modes de jeu
recettes
systèmes
```

---

## Replay

Les donjons de Story sont :

```txt
rejouables à l’infini
```

Mais :

```txt
récompenses de quête uniques
scripts de quête retirés en replay
gameplay et loot répétables
```

---

## Gating

Un joueur peut être bloqué par :

```txt
Story Quest
WorldLevel
```

Il ne doit pas être bloqué directement par :

```txt
PlayerLevel obligatoire
POWER obligatoire
équipement obligatoire
```

Cependant, la difficulté peut naturellement nécessiter un meilleur build.

---

# 6. Building Progression

## Building Levels

Chaque bâtiment possède :

```txt
un niveau
```

Pour le MVP :

```txt
tous les bâtiments partagent le même max level
```

Le max exact sera défini pendant l’équilibrage.

---

## Unlock Pattern

Un bâtiment suit cette progression :

```txt
Story unlock
→ construction avec coût
→ upgrade avec coût
```

---

## Construction

La construction est :

```txt
instantanée
```

Elle coûte :

```txt
ressources
currencies
éventuels items spéciaux
```

---

## Upgrade

Les upgrades de bâtiments coûtent :

```txt
ressources
currencies
ressources rares
```

Le coût d’upgrade suit une logique :

```txt
exponentielle
```

---

## WorldLevel Requirement

Un bâtiment ne peut pas être amélioré au-delà du WorldLevel.

Règle :

```txt
BuildingLevel <= WorldLevel
```

Exemple :

```txt
WorldLevel 4
→ bâtiment max upgrade possible : level 4
```

---

## Rôle des upgrades

Chaque bâtiment possède ses propres effets d’upgrade.

Exemples :

```txt
Forge → recettes / qualité / types d’armes
Mine → gains / ressources rares
Farm → gains / ressources rares
Kitchen → recettes / difficulté réduite
Temple → buffs temporaires
Market → offres / échanges
Bank → stockage / confort / services futurs
```

---

# 7. Equipment Progression

## Philosophie

La progression équipement est principalement :

```txt
verticale
```

Mais possède une couche horizontale grâce à :

```txt
Equipment Sets
Effect Sets
buildcraft
weapon choices
artifacts
rings
```

---

## Axes de progression équipement

Un équipement progresse via :

```txt
ilvl
rareté
upgrade level
evolve
quality future
equipment set
effect resonance
```

---

## Power Ceiling

Chaque système possède un plafond de puissance.

Exemple équipement :

```txt
full stuff Ancient
+ ilvl max
+ qualité max
+ rang max
+ niveau max
= plafond de puissance équipement
```

Les plafonds exacts seront définis en balancing.

---

# 8. Skill Progression

## Ring-scaling pur (LOCKED — DESIGN_FREEZE_V1 §3, D-02)

Les skills **n'ont AUCUN niveau indépendant** et **aucun skill point**.

La puissance d'une skill dérive **uniquement du ring qui la porte** :

```txt
Ring Rarity
Ring iLvl
Ring Upgrade Level
Ring Affixes
```

Donc :

```txt
Upgrade Ring = Upgrade Skill
```

---

## Reset / Respec

Changer de skill = **changer de ring** équipé. Pas de respec de niveau (il n'y a pas de niveau de skill).

---

## Future Extensions (backlog)

Plus tard, les skills pourront recevoir :

```txt
passive stats
Power Stones (modificateurs via rings)
systèmes avancés
```

---

# 9. Ring Progression

Les rings sont un **système core MVP** (DESIGN_FREEZE_V1 §4, D-03).

```txt
5 slots = 5 skills actifs
1 ring = 1 skill (skillId)
interdit : 2 rings avec la même Skill ID
```

Un ring progresse via :

```txt
rarity
ilvl
upgrade level
affixes
```

Améliorer un ring = améliorer la skill qu'il porte. (Mapping rings nommés → skills : `RINGS_SKILLS_MAP.md`.)

---

# 10. Resource Progression

Les ressources progressent selon :

```txt
WorldLevel
Story chapter
mode difficulty
boss tier
resource rarity
```

Les ressources servent à :

```txt
craft
upgrade
building construction
building upgrade
Kitchen recipes
Market exchange
future systems
```

---

# 11. Currency Progression

## Écu

L’Écu reste utile pendant :

```txt
early game
mid game
late game
```

Il sert à :

```txt
achats
craft
upgrades
services
échanges
```

---

## Endgame Currencies

Les monnaies spécialisées apparaissent davantage en endgame.

Exemples :

```txt
Boss Token
Duel Token
Abyss Shard
Guild Token
War Token
Slayer Token
```

Elles servent à :

```txt
récompenses spécifiques
vendors spécialisés
modes dédiés
progression avancée
```

---

# 12. Mode Unlocks

Les modes de jeu sont débloqués via :

```txt
Story
WorldLevel
quêtes
conditions spécifiques
```

Exemples :

```txt
Duel
Expeditions
Boss Rush
Abyss
Sky
Land Conquest
Spatial Conquest
AvA
```

Chaque mode pourra définir ses propres règles :

```txt
coût World Energy
difficulté
récompenses
échec
classements
currencies
```

---

# 13. Difficulty Progression

La difficulté augmente via :

```txt
WorldLevel scaling
mode difficulty
boss mechanics
resource gating
enemy stats
endgame content
```

Le WorldLevel influence principalement :

```txt
stats des ennemis
stats des boss
qualité / tier des ressources accessibles
```

Il ne modifie pas automatiquement :

```txt
patterns
mécaniques
comportements
```

---

# 14. Failure Rules

Les règles d’échec dépendent du mode.

Il n’existe pas une règle unique pour tout le jeu.

Exemples :

```txt
Story dungeon → conserve loot selon règles du level
Mini-game → échec = perte coûts + gains temporaires
Duel → rewards définis par mode
Boss Rush → règles spécifiques
```

Chaque mode devra documenter :

```txt
coûts
pertes
récompenses
retry
abandon
```

---

# 15. POWER

POWER est un score dérivé.

Il sert à :

```txt
affichage UI
comparaison de builds
recommandation de contenu
leaderboards
feeling progression
```

Il ne doit pas être utilisé comme gating strict.

Exemple :

```txt
recommended POWER
```

mais pas :

```txt
POWER insuffisant → accès interdit
```

---

# 16. Caps

Pour le MVP, plusieurs hard caps existent :

```txt
Player Level max = 50
World Level max = 50
```

> Pas de "Skill Level" (ring-scaling pur, D-02). Le plafond de puissance des skills passe par le ring (rarity/upgrade).

Les autres plafonds seront définis selon les systèmes.

Exemples :

```txt
item rarity max
upgrade max
building max
quality max
effect resonance max
```

---

# 17. Endgame Vision

Le endgame doit encourager :

```txt
build optimization
collection
chrono boss
competitive modes
PvP
GvG
guild play
seasonal content
economy mastery
```

---

# 18. Resets / Prestige

## Seasons

Prévu plus tard :

```txt
season resets
reward passes
temporary bosses
event ladders
```

---

## Ascension

Prévu plus tard :

```txt
reset personnage
bonus permanents de compte
progression long terme
```

À détailler dans une future version.

---

# 19. MVP Scope

Le MVP progression inclut :

```txt
Player XP
Player Level
World XP
World Level
Story Unlocks
Building Unlocks
Equipment Progression (incl. rings = skills)
```

À reporter plus tard :

```txt
seasons
ascension
advanced skill systems
online progression
full market economy
endgame currencies avancées
```

---

# 20. Architecture recommandée

```txt
progression/
  player-level.ts
  player-xp.ts
  skill-points.ts
  world-level.ts
  world-xp.ts
  story-unlocks.ts
  building-progression.ts
  mode-unlocks.ts
  progression-gates.ts
  caps.ts
```

---

# 21. Modèle conceptuel

```ts
type ProgressionState = {
  player: {
    level: number;
    xp: number;
  };

  world: {
    level: number;
    wxp: number;
  };

  story: {
    activeQuestIds: string[];
    completedQuestIds: string[];
    unlockedChapterIds: string[];
    unlockedDungeonIds: string[];
  };

  buildings: Record<string, {
    status: BuildingStatus;
    level: number;
  }>;
};
```

---

# 22. Principe fondamental

La progression doit être :

```txt
claire
motivante
interconnectée
non bloquante inutilement
scalable
extensible
```

Le joueur doit toujours comprendre :

```txt
ce qu’il peut améliorer
pourquoi il est bloqué
comment progresser
quelle récompense il vise
```


