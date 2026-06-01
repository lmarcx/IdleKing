# 🧊 DESIGN FREEZE V1 — IdleKing (MVP)

## Status

```txt
LOCKED — MVP Design Freeze V1
```

Ce document fige les **règles de design du MVP**. Il fait autorité sur tous les autres
documents en cas de conflit. Les documents existants devront être alignés sur ce freeze
(voir §20 — Corrections documentaires requises).

> **Règle de lecture**
> - **LOCKED** = règle figée, non négociable pour le MVP.
> - **DEFERRED (balancing)** = la règle/structure est figée, mais les **valeurs chiffrées**
>   seront calibrées pendant la passe d'équilibrage (un freeze gèle les systèmes, pas les nombres).
> - **OUT (backlog)** = explicitement hors MVP.

## Scope MVP

```txt
Prologue
Chapter I  — Era Funèbre
Chapter II — Era Glaciaire
```

Tout ce qui n'est pas listé ici est **hors MVP** (voir §19).

---

# 1. Core Pillars (LOCKED)

```txt
Combat manuel skill-based (Hades-like)
Build = Weapons + 5 Rings (skills) + Equipment Sets + Resonance (Effect Sets)
Craft > Loot RPG
Progression : Player Level + World Level + Story linéaire
Hub : Kingdom (bâtiments + mini-jeux)
```

Ressources de combat :

```txt
HP      = survie (mort à 0)
Mana    = skills
Stamina = sprint + dash
```

---

# 2. Combat & Resources (LOCKED)

- Combat **100 % manuel** : pas d'auto-attaque. Déplacement libre, attaque de base (clic), sprint, dash, 5 skills actifs.
- **Dash = consomme de la Stamina** *(décision verrouillée — corrige STATS.md §12-13 qui le mettait en cooldown sans coût)*.
- Sprint = consomme de la Stamina (maintien).
- Le cooldown du dash peut exister mais le **coût ressource du dash est la Stamina** (pas une god-stat SPEED).

## Status Effects — sémantique canonique (LOCKED)

Source of truth = `STATS.md` (aligné avec `COMBAT.md`) :

```txt
Burn    = Damage over Time
Freeze  = Slow
Shock   = Vulnerability (+10% dégâts subis, base)
Bleed   = Weaken (-10% dégâts infligés, base)
Stun    = contrôle temporaire
Silence = empêche certains casts/actions
```

Scaling via **Debuff Power**. Valeurs précises **DEFERRED (balancing)**.

## Damage Formula (structure LOCKED, coefficients DEFERRED)

```txt
BaseDamage × WeaponCoefficient × SkillCoefficient × OffensiveModifiers × Crit × TargetMitigation × StatusModifiers
```

- Crit Chance cap = **100%** · Crit Damage défaut = **200%** · Cooldown Reduction cap = **50%**.
- DEF = **courbe de mitigation à rendement décroissant** (pas de réduction plate). Formule **DEFERRED**.

---

# 3. Skills (LOCKED)

- **1 Ring = 1 Active Skill** · **5 Ring Slots** · **5 skills actifs max**.
- Impossible d'équiper deux rings portant la **même Skill ID**.
- **Toutes les skills consomment de la Mana.**
- **Ring-scaling pur** *(décision verrouillée)* : les skills **n'ont AUCUN niveau indépendant**.
  La puissance dérive **uniquement du ring** :

```txt
Ring Rarity + Ring iLvl + Ring Upgrade Level + Ring Affixes
```

> ❌ **Supprimé du MVP** : « Skill Level max = 10 » et les **skill points** (PROGRESSION.md §3/§8).
> Le level up joueur n'octroie **plus** de skill point.

- Catégories : `Attack · Movement · Defense · Utility · Summon`.
- 1 Skill = 1 Élément. Éléments MVP : `Neutral, Fire, Water, Ice, Wind, Electricity, Ground, Light, Dark`.
- Roster MVP = **16 skills** `SK-001 → SK-016` (cf. `SKILL_DATABASE.md`). `basePower` par skill = **DEFERRED**.
- **OUT (backlog)** : passive skills, ultimates, Power Stones, multi-élément, skill trees.

---

# 4. Rings (LOCKED)

- Un ring est généré comme tout item **+** porte : `Skill ID`, `Skill Category`, `Skill Element`.
- **Rings nommés convertis en porteurs de skill** *(décision verrouillée)* :
  `Royal Beam Ring`, `King Aura Ring`, `War Cry Ring`, `Frost Ritual Ring`, `Spectral Ring`
  reçoivent chacun un `skillId` mappé sur un `SK-0xx`. Leurs anciens « effets »
  (beam width, aura radius, frost buildup, sustain…) deviennent des **affixes / modificateurs**, pas des skills.
- Les rings sont un **système core MVP** (pas endgame).

> ❌ Corrige PROGRESSION.md §9 (« rings = endgame/theorycraft ») : **faux pour le MVP**.

**Table Ring → Skill** à produire comme livrable P0 (cf. §20).

---

# 5. Weapons (LOCKED)

- Armes **indépendantes des skills**. Elles définissent les attaques clic gauche / clic droit.
- Une main : `weapon` (clic gauche) / `offhand` (clic droit). Deux mains : occupe les 2 slots (patterns primaire/secondaire).
- Même avec une arme 2 mains, l'`offhand` **compte pour la Résonance** (9 slots actifs).
- Familles : `Sword, Axe, Dagger, Greatsword, Spear, Bow, Pistol, Staff` + offhands (`Shield, Grimoire`, side-weapons).
- **Échelle de déblocage par Forge Level — 1 type d'arme par niveau** *(décision verrouillée)* :

```txt
Fg1 Épée · Fg2 Dague · Fg3 Hache · Fg4 Espadon · Fg5 Pistolet
Fg6 Arc · Fg7 Bouclier · Fg8 Lance · Fg9 Grimoire · Fg10 Bâton
```

  Le **Forge Level gate les types d'armes** (cf. FORGE.md §5 / BUILDINGS.md §9 / RECIPES.md stub).
  Améliorer la Forge sert **aussi** à la qualité et aux recettes avancées.

> ❌ Corrige **RECIPES_DATABASE** qui débloquait Hache / Dague / Arc dès Forge Level 1 :
> ces unlocks doivent suivre l'échelle ci-dessus.

- Armes **thématiques de boss** : débloquées par **défaite du boss** **EN PLUS** du type d'arme correspondant débloqué via le Forge Level.
- **Artifact = OUT du MVP** (voir §16). Les listes de build de COMBAT/WEAPONS retirent l'artifact pour le MVP.

---

# 6. Itemization (LOCKED)

## Slots

```txt
main_hand, off_hand
helmet, chest, cape, gloves, belt, boots
5x ring, 1x necklace
artifact (slot présent mais INERTE au MVP)
```

## Raretés MVP

```txt
Common · Uncommon · Rare · Epic · Legendary
```

`Mythic / Divine / Ancient` = **OUT (backlog)**.

## Affixes par rareté (LOCKED — nouvelle table)

```txt
Common    → 0 affixe
Uncommon  → 0 affixe
Rare      → 1 affixe
Epic      → 1 affixe
Legendary → 2 affixes (1 préfixe + 1 suffixe)
```

> ❌ Remplace la table contradictoire d'EQUIPMENT_GENERATION (Epic 3 / Legendary 4).
> Cap **MVP = 2 affixes**. Plages de valeurs des affixes + pools par slot = **DEFERRED (balancing)**.

## Item scaling

Structure conservée, multiplicateurs **DEFERRED** :

```txt
final_power = base_item_identity × rarity_multiplier × ilvl × upgrade_level
```

- **Pas de smart loot** au MVP (loot 100 % aléatoire).

---

# 7. Equipment Sets (LOCKED — réduit pour le MVP)

**4 sets actifs au MVP** (source of truth = `EQUIPMENT_SETS.md`, à aligner) :

| Set | Disponibilité | Rôle | Base bias | Stats avancées |
|---|---|---|---|---|
| **Vagabond** | Prologue | Mobilité / exploration | SPEED / Stamina | move speed, stamina regen, dash |
| **Pleureur** | Début Chapitre I | Tank / mitigation | HP / DEF | DEF, HP regen, (reflect futur) |
| **Maraudeur** | Début Chapitre II | Burst / crit | ATK / SPEED | crit chance, crit damage |
| **Docteur** | Chapitre II | Support / heal / mana | Mana / HP | healing power, buff power, mana regen, CDR |

**4 sets en PLACEHOLDER** (gardés, **non finalisés**, retravaillés aux prochains chapitres) :

```txt
Flageleur · Gardien des Cendres · Voltigeur · Reine Blanche
```

- Les pièces/recettes de ces sets peuvent exister, mais leur **identité et leurs bonus ne sont pas figés** et sont **hors scope de balancing MVP**.
- Bonus de set (2/4 pièces) : structure **DEFERRED** ; seuls les **4 sets actifs** sont équilibrés au MVP.

> ❌ Résout la contradiction ITEMS_DATABASE vs EQUIPMENT_SETS : on retient le rôle mécanique d'EQUIPMENT_SETS et on met à jour la ligne « Identity » d'ITEMS_DATABASE pour les 4 sets actifs.

---

# 8. Effect Sets & Resonance (LOCKED — simplifié)

Système **conservé au MVP mais simplifié** *(décision verrouillée)*.

## Résonance (math LOCKED)

- 9 slots génèrent la Résonance : `helmet, chest, cape, gloves, belt, boots, weapon, offhand, necklace`.
- **Rings et Artifact ne génèrent PAS de Résonance.**
- Valeurs : `Common 0 · Uncommon 1 · Rare 2 · Epic 3 · Legendary 4` (`Mythic 5 · Divine 7 · Ancient 9` = futur).
- `Effect Slots = floor(Total Resonance / 9)`.

## Effect Sets MVP (5, simplifiés)

Les 5 Effect Sets sont conservés avec leur **thème et leur source narrative**, mais leurs paliers
sont **réduits à des effets simples et chiffrables** (bonus de stats / application de status basique).
**Aucun proc sur-mesure** au MVP (pas de Shadow Clone, Ice Nova, Tidal Wave, explosions, orbitales).

| Effect Set | Source | Dispo | Thème (effets simplifiés : stats / status basiques) |
|---|---|---|---|
| **Shadow Veil** | Amalgame des Ténèbres | Prologue | crit chance, dégâts Dark, sustain léger |
| **Lordflame** | Ombre du Dragon | Ch I | application Burn, bonus dégâts vs cibles Burn |
| **Motherstone** | Découverte du Fleuve de Vie | Ch I | DEF, HP, damage reduction |
| **Kingfrost** | Archimage | Ch II | application Freeze, bonus dégâts vs cibles gelées |
| **Rainmaker** | Seigneur de la Pluie Déchu | Ch II | mana regen, application Drench, bonus vs cibles Drench |

> Les effets « spectaculaires » d'origine (paliers IV-V) repassent en **V2 (backlog)**.
> Valeurs exactes des paliers = **DEFERRED (balancing)**.
> Acquisition = **récompense narrative** (boss / NPC / événement), pas du loot classique.

- **OUT (backlog)** : Effect Sets futurs (Thunderknight, Lightbringer, etc.).

---

# 9. Forge (LOCKED)

Onglets MVP : **Craft · Upgrade · Recycle**. (`Evolve · Enchant · Fusion` = **OUT backlog**.)

## Craft — rareté par roll pondéré influencé par la Forge (LOCKED)

- Le craft produit une **rareté tirée sur une table pondérée**, dont les poids sont **améliorés par le niveau de Forge** (et/ou matériaux rares).
- Table de base de référence (DEFERRED, à calibrer — point de départ = table boss) :

```txt
Common 50% · Uncommon 25% · Rare 15% · Epic 8% · Legendary 2%
```

- Le niveau de Forge **décale les poids vers le haut** (moins de Common, plus de Rare+). Courbe exacte = **DEFERRED**.

## Upgrade (LOCKED)

- 100 % de réussite, aucun échec. Coût en ressources/monnaies. iLvl inchangé, item non régénéré.
- **Caps par rareté** *(décision verrouillée)* :

```txt
Common / Uncommon / Rare → +6   (paliers stats avancées à +3, +6)
Epic                     → +9   (paliers à +3, +6, +9)
Legendary                → +12  (paliers à +3, +6, +9, +12)
```

> ❌ Corrige l'oubli de **Rare** dans FORGE.md §7 et l'inclut explicitement.
> Courbe de coût au-delà de +5 = **DEFERRED (balancing)**.

## Recycle (LOCKED)

- **Sortie = ECU + Precious Stone** *(décision verrouillée — modèle stub Phase 8A)* :

```txt
Recycle → 50% de la valeur de l'item en ECU
        + 20% (placeholder) de chance d'obtenir une Precious Stone de même rareté
        → item détruit définitivement
        → AUCUN retour de matériaux de recette
```

> ❌ Remplace le modèle « 50-70% matériaux » de LOOT_TABLES §11. La source canonique du recycle est ce freeze.
> Pourcentages exacts = **DEFERRED**.

---

# 10. Economy & Resources (LOCKED rules / DEFERRED data)

- **Currencies ≠ Resources ≠ Items.** Currency core = **Écu**. Currency MVP supplémentaire = **Boss Token** (usage générique).
  Toutes les autres currencies (Duel/Abyss/Sky/Guild/War/Slayer Token) = **OUT (backlog)**.
- Ressources : stackables (max **999**), rareté fixe, **pas de quality roll**, tradables.

## Reconciliation du graphe de ressources (LOCKED — rules)

Le craft (`RECIPES_DATABASE`) et les drops (`LOOT_TABLES`/`ENEMIES_DATABASE_V2`) utilisaient des
vocabulaires divergents. **Réconciliation canonique** :

```txt
Iron Scrap (drop)      ≡ Iron Ore (recette)        → nom canonique : Iron Ore
Sapphire Fragment      ≡ Sapphire                   → nom canonique : Sapphire
```

- **Sources de ressources de base** (à inscrire dans le registre) :

```txt
Mine  → minerais (Iron Ore, Cold Iron, Silver Ore) + gemmes (Quartz, Sapphire, Pale Diamond)
Farm  → légumes (Tomato, Carrot) + viande (Tough Meat)
Bois  → Old Wood / Ashwood / Frostpine / Frostroot (Ashwood drop confirmé sur Dragonoïdes ; sources des autres à fixer)
Mobs  → matériaux thématiques (Shadow Residue, Spectral Dust, Frozen Echo, etc.)
Boss  → cores (Dark Amalgam Core, Dragon Ash Core, Frost Amalgam Core, Archmage Sigil, Frozen Queen Tear)
```

- **Drops actuellement sans usage** (Bone Fragment, Dragon Scale Fragment, Pearlescent Scale,
  Cold Shell Fragment, Experimental Tissue, Archival Fragment) : chaque ressource MVP doit avoir
  **au moins un usage** (recette) **ou** une **valeur de vente Market**. Arbitrage = livrable P0.

## Livrable P0 bloquant : `RESOURCES_DATABASE.md`

Le fichier **n'existe pas** alors qu'il est la source of truth de `resource_value`
(formule `item_value = sum(resource_value × quantity)`). Il **doit être créé** :

```txt
id · name (canonique) · type · rarity · resource_value · sources · uses · maxStack(999) · tradable
```

Tant qu'il n'existe pas, **toute l'économie reste non calculable** → P0.

---

# 11. Loot (LOCKED)

- Philosophie **Craft > Loot** : les ennemis donnent surtout des **ressources**, l'équipement vient surtout du **craft** et des **boss**.
- **Pas de smart loot** : loot 100 % aléatoire.
- **Roll d'équipement boss** (base, DEFERRED pour calibrage) :

```txt
Common 50% · Uncommon 25% · Rare 15% · Epic 8% · Legendary 2%
```

- Recycle / Forge Special : cf. §9.
- **OUT (backlog)** : named items, unique items, corrupted gear, modes de loot (Duel/Boss Rush/Raid…).

---

# 12. Progression (LOCKED)

```txt
Player Level max = 50   (level up automatique : +stats basiques)   [plus de skill points]
World Level max  = 50   (WXP via Temple ; level up manuel au Forum/Forum→Temple)
Skills           = PAS de niveau (ring-scaling pur)
Story            = linéaire (chapitres → donjons → boss → unlocks)
```

- Gating story : **Story Quest** + **WorldLevel** uniquement. Jamais bloqué directement par PlayerLevel/POWER/équipement obligatoires.
- **POWER** = score dérivé d'affichage/recommandation, **jamais** un gate strict.
- Donjons de story **rejouables à l'infini** (récompenses de quête uniques retirées en replay).
- Courbes XP / WXP, coûts de bâtiments, progression de Forge = **DEFERRED (balancing)**.
- **OUT (backlog)** : seasons, ascension, prestige, online/guild progression, PvP.

---

# 13. World & Buildings (LOCKED)

- **World Energy** : ressource macro, consommée pour lancer les runs (Mine/Farm/Kitchen). Regen passive temps réel + offline. Refill au World Level Up.
- **World HP** : ressource macro **future** (présente mais non centrale au MVP).
- Bâtiments **ne produisent PAS passivement** de ressources (exceptions : buffs Temple, regen World Energy).
- Bâtiments MVP : `Forge · Mine · Farm · Kitchen · Temple · Market · Forum · Time Gate · Bank` (+ `Cornucopia` dev only).

## Time Gate (LOCKED — renommage)

- **« World Gate » est renommée « Time Gate »** *(décision verrouillée)* — un **seul** bâtiment.
- La Time Gate est le point d'accès aux **Ères** et aux **modes**, et l'endroit où l'on utilise le **Kaléidoscope** et les **Fragments du Temps** (voir §16).

> ❌ La Canon Rule de DOCUMENTATION_INDEX « Time Gate = Building » est donc **correcte** ; il faut renommer World Gate → Time Gate dans BUILDINGS.md, WORLD.md, LOOT_TABLES, DUNGEON.

---

# 14. Bosses (LOCKED — roster & placements MVP)

| Boss | Type | Chapitre / Donjon | Phases |
|---|---|---|---|
| **Amalgame des Ténèbres** | Story | Prologue / Terres Désolées | 1 |
| **Ombre du Dragon** | Story | Ch I / Pic des Cendres (climax Ch I) | 2 |
| **Amalgame du Givre** | Story Mid | Ch II / Caverne aux Reflets | 1 |
| **Archimage Corrompu** | Mid | Ch II / Académie d'Arathas | 2 |
| **Seigneur de la Pluie Déchu** | Mid | **Ch II / Gouffre Royal** *(nouvelle place)* | 1–2 |
| **Allaeva, Reine de Glace** | Story | Ch II / Source du Givre (climax Ch II) | **2** |

- **Seigneur de la Pluie Déchu devient le boss du Gouffre Royal (Dungeon 9)** *(décision verrouillée)* — résout le boss fantôme. Il faut lui créer une **loot table** + une **entrée enemies** (« aquatic / rain materials »).
- **Allaeva = 2 phases** *(décision verrouillée)* → corrige ENEMIES_DATABASE_V2 (qui disait 1).
- Pas d'enrage au MVP. Checkpoints avant boss (pas de perte des récompenses sécurisées).

---

# 15. Dungeons (LOCKED)

Structure conforme à `DUNGEON_DATABASE.md`, avec **une modification** :

```txt
Dungeon 9 — Gouffre Royal (Era Glaciaire)
  Type  : Boss Dungeon (était Adventure / "Boss: None")
  Boss  : Seigneur de la Pluie Déchu   ← AJOUT
```

Donjons & bosses jouables MVP = **6 bosses** (Prologue + Ch I + Ch II).

---

# 16. Special Items & Era Unlock (LOCKED)

- **Kaléidoscope = Special World Item** *(décision verrouillée)*. **N'est PAS** : Equipment · Artifact · Skill · Effect Set.
  Obtenu une fois via la story ; débloque les **pleins pouvoirs à la Time Gate**.
- **Fragment du Temps** = nom canonique unique *(décision verrouillée)*, **fusionne** les anciens
  « Era Progression Item » et « Kaléidoscope Component ». Looté sur les **boss de fin de chapitre**,
  consommé à la **Time Gate** pour débloquer l'**Ère suivante** (et, plus tard, des modes).
- **Artifact** : slot présent mais **INERTE au MVP** (aucun effet). Modificateur d'arme = **OUT (backlog)**.

> ❌ Unifie le nommage : « Era Progression Item », « Kaléidoscope Component », « Kaléidoscope catalyst material » → **Fragment du Temps**.

---

# 17. Weapon/Recipe Gating — corrections ciblées (LOCKED)

- **Funeral Blade re-gatée sur un boss Ch I** *(décision verrouillée)* :
  unlock = **Amalgame des Ténèbres** (Prologue, thème ombre/Funèbre), matériaux **Funèbre**
  (ex. Spectral Dust + Shadow Residue + Dark Amalgam Core). **« Fallen Rain Pearl » supprimé** de cette recette.
- Armes thématiques de boss (cohérence ENEMIES_DATABASE_V2 ↔ RECIPES_DATABASE) :

```txt
Ombre du Dragon   → Ashen Axe, Ashen Spear, Dragonbone Greatsword, Dragon Ash Shield
Amalgame du Givre → Frostfang Dagger, Frostbound Longsword
Archimage Corrompu→ Arathas Staff, Icebound Grimoire
Allaeva           → Frozen Royal Shield, Queen's Tear Necklace, (Reine Blanche = placeholder set)
```

> Aligner RECIPES_DATABASE : les unlocks « Chapter II progression » de Frostbound Longsword / Icebound Grimoire
> deviennent des unlocks **boss** explicites (cohérents avec ENEMIES_DATABASE_V2).

---

# 18. Build System Summary (LOCKED)

```txt
Layer 1 — Weapons        : combat actions (clic G / clic D), débloquées dès Forge Lv1
Layer 2 — Skills (Rings) : 5 rings = 5 skills SK-0xx, ring-scaling pur
Layer 3 — Equipment Sets : 4 sets actifs (Vagabond/Pleureur/Maraudeur/Docteur) — stat bias
Layer 4 — Resonance      : Effect Sets simplifiés via 9 slots (floor(resonance/9))
Ressources               : HP (survie) · Mana (skills) · Stamina (sprint+dash)
```

---

# 19. OUT OF MVP (backlog explicite — LOCKED)

```txt
Raretés Mythic / Divine / Ancient
Passive skills · Ultimates · Power Stones · Skill trees · Multi-élément
Forge : Evolve · Enchant · Fusion
Effect Sets paliers spectaculaires (IV-V "procs") + Effect Sets futurs
Artifact actif (modificateur d'arme)
Smart loot · Named/Unique/Corrupted items
Modes : Duel · Boss Rush · Abyss · Sky · Land/Spatial Conquest · AvA · Expeditions · Raids
Currencies : Duel/Abyss/Sky/Guild/War/Slayer Token · premium
PvP & couche d'équilibrage PvP · World HP comme système central
Seasons · Ascension · Prestige · Online/Guild · Market joueur/auction
4 sets placeholder : Flageleur · Gardien des Cendres · Voltigeur · Reine Blanche (identité non figée)
```

---

# 20. Corrections documentaires requises (post-freeze)

Tâches d'alignement (ne changent aucune décision, appliquent ce freeze) :

| Priorité | Doc | Action |
|---|---|---|
| **P0** | *(nouveau)* `RESOURCES_DATABASE.md` | Créer le registre (ids, valeurs, sources, usages) + réconciliation des noms (§10). |
| **P0** | *(nouveau)* `RINGS_SKILLS_MAP` | Table Ring nommé → `SK-0xx` (§4). |
| **P0** | `RECIPES_DATABASE.md` | Funeral Blade re-gatée (§17) ; unlocks boss explicites ; **aligner les unlocks d'armes de base sur l'échelle Forge Level (§5)** ; retirer réf. `RESOURCES_DATABASE` cassée → pointer le nouveau fichier. |
| P1 | `STATS.md` | Dash = Stamina (§2). |
| P1 | `PROGRESSION.md` | Retirer Skill Level 10 + skill points ; corriger §9 rings (core, pas endgame). |
| P1 | `EQUIPMENT_GENERATION_DATABASE.md` | Table d'affixes 0/0/1/1/2 (§6) ; retirer la table 3/4. |
| P1 | `FORGE.md` | Inclure Rare dans les caps d'upgrade. (Conserver l'échelle armes par Forge Level — elle devient canonique.) |
| P1 | `EQUIPMENT_SETS.md` / `ITEMS_DATABASE.md` | 4 sets actifs + 4 placeholder ; aligner les identités (§7). |
| P1 | `EFFECT_SETS_AND_RESONANCE_SYSTEM_V2.md` | Simplifier les paliers (§8) ; Rainmaker source = Seigneur de la Pluie Déchu (Ch II). |
| P1 | `ENEMIES_DATABASE_V2.md` | Allaeva = 2 phases ; ajouter Seigneur de la Pluie Déchu (Gouffre Royal). |
| P1 | `DUNGEON_DATABASE.md` | Dungeon 9 Gouffre Royal → Boss Dungeon (Seigneur de la Pluie Déchu). |
| P1 | `BUILDINGS.md` `WORLD.md` `LOOT_TABLES_DATABASE.md` | Renommer World Gate → Time Gate ; unifier « Fragment du Temps ». |
| P2 | Tous | Réparer réfs cassées (STORY.md, MARKET.md, BANK.md) ; marquer V1 *superseded* (EFFECT_SETS, ENEMIES) ; sortir les tags « Phase 8x/9x » des docs de design. |

---

# 21. Paramètres laissés au balancing (DEFERRED — non bloquants pour le freeze)

```txt
basePower des 16 skills · taille pool Mana · regen Mana/Stamina
coefficients arme/skill (Damage Formula) · courbe de mitigation DEF · formule POWER
plages de valeurs des affixes · pools d'affixes par slot
poids exacts du roll de rareté au craft + influence Forge Level
% recycle (ECU, Precious Stone) · courbe de coût d'upgrade au-delà de +5
courbes XP (Player) / WXP (World) · coûts & max levels des bâtiments · progression Forge Level
valeurs des paliers d'Effect Sets · valeurs de status (Burn/Freeze/Shock/Bleed)
quantités/taux de drop des ressources
```

---

# 22. Decision Log (traçabilité des choix verrouillés)

```txt
D-01 Résonance / Effect Sets : GARDÉS mais SIMPLIFIÉS (effets chiffrables, pas de procs)
D-02 Skills : RING-SCALING PUR (suppression Skill Level 10 + skill points)
D-03 Rings nommés : CONVERTIS en porteurs de skill (skillId ; effets → affixes)
D-04 Dash : consomme STAMINA
D-05 Affixes : 0/0/1/1/2 (cap 2, préfixe+suffixe au Legendary)
D-06 Equipment Sets : 4 ACTIFS (Vagabond, Pleureur, Maraudeur, Docteur) + 4 placeholder
D-07 Recycle : ECU + Precious Stone (pas de retour matériaux)
D-08 Armes de base : ÉCHELLE par Forge Level (1 type/niveau, Fg1 Épée → Fg10 Bâton)
D-09 Craft : rareté par ROLL PONDÉRÉ influencé par la Forge
D-10 Seigneur de la Pluie Déchu : BOSS du Gouffre Royal (Ch II)
D-11 Artifact : HORS MVP (slot inerte)
D-12 Kaléidoscope : Special World Item (≠ artifact/equip/skill/effect set) ; pouvoirs à la Time Gate
D-13 Fragment du Temps : nom canonique unique (era unlock) ; fusionne Era Progression Item + Kaléidoscope Component
D-14 Upgrade : caps +6 / +9 / +12 par rareté (Rare inclus)
D-15 World Gate → renommée TIME GATE (un seul bâtiment)
D-16 Funeral Blade : re-gatée sur boss Ch I (Amalgame des Ténèbres), matériaux Funèbre
D-17 Allaeva : 2 phases
```

---

*DESIGN_FREEZE_V1 — fait autorité sur les documents existants pour le périmètre MVP*
*(Prologue · Chapter I — Era Funèbre · Chapter II — Era Glaciaire).*
