# 🔍 IdleKing — Rapport d'Audit de l'Architecture Documentaire

> **Statut : AUDIT (non normatif).** Ce document **n'applique aucun changement** aux bibles
> ni aux specs. Il diagnostique l'architecture documentaire et propose une hiérarchie + un
> nouvel index, à valider avant exécution.
>
> Date : 2026-06-04 · Branche : `mvp2-implementation` · Périmètre audité : `docs/`

---

## 0. Synthèse exécutive

L'architecture documentaire est **globalement saine au cœur** (le trio
`DESIGN_FREEZE_V1` / `IMPLEMENTATION_BIBLE` / `DATA_MODEL` est remarquablement cohérent et
verrouillé), mais souffre de **trois problèmes structurels** :

1. **Deux générations de docs coexistent sans frontière** — la doc canonique vit dans
   `docs/30_new_direction/`, mais d'anciens dossiers (`00_overview`, `10_game_design`,
   `20_ui_ux`) et des fichiers racine (`AGENTS.md`, `SKILLS.md`) décrivent une **vision
   périmée** (idle / auto-combat / Boto) qui **contredit frontalement** le nouveau design.
2. **La chaîne d'autorité (SOURCE OF TRUTH) n'est pas unifiée** — les bibles artistiques
   déclarent `SCRIPT > DESIGN FREEZE`, alors que `DOCUMENTATION_INDEX` déclare
   `DESIGN_FREEZE > tout`. Deux règles d'arbitrage incompatibles coexistent.
3. **Le nouvel ensemble artistique (`art/`) n'est pas intégré** à `DOCUMENTATION_INDEX`, et
   chevauche `UI_AND_ASSETS_PROPOSAL` + `CHARACTER_DATABASE` (responsabilités ambiguës).

Aucune **dépendance circulaire de données** détectée. En revanche, une **boucle d'autorité
ambiguë** existe (les bibles art se placent *au-dessus* de l'IMPLEMENTATION, qui ne reconnaît
que le FREEZE — cf. §5).

Le reste du rapport classe chaque constat et chaque recommandation en
**🔴 Critique / 🟡 Recommandée / 🟢 Optionnelle**.

---

## 1. Cartographie de l'existant

### 1.1 Arborescence actuelle (résumée)

```txt
docs/
├── AGENTS.md                ⚠️ mélange "Agent System" (obsolète) + "Codex usage rules" (utile)
├── SKILLS.md                ⚠️ ancien système (auto-combat, skills = Stamina)
├── CHECKPOINTS2804.md       (journal daté)
│
├── 00_overview/             ⚠️ LEGACY — checklists & notes pré-new-direction
│   ├── CHECKPOINT / GLOBAL / NOTESv0 / NOTESv1 / ORGA / RESUME
│
├── 10_game_design/          ⚠️ LEGACY — GDD "idle RPG / 5 Ages / Paperclips"
│   ├── gdd / balancing / buildings / crit / donjons / economy / equipments
│   ├── expansion-content / expeditions / kingamas / leaderboards / renaissance
│   ├── ressources / tiers / xp
│
├── 20_ui_ux/                ⚠️ LEGACY — styleguide "Boto", "ascension héroïque"
│   ├── CG / interfaces / ui_components / ui_layout / ui_styleguide_v1
│   ├── ui_tokens_css / ui_implementation_checklist_v1
│   ├── livrables/kingdoms_ui · screens/boto_screen
│
└── 30_new_direction/        ✅ CANON ACTUEL
    ├── DOCUMENTATION_INDEX.md      (point d'entrée — n'inclut PAS art/)
    ├── DESIGN_FREEZE_V1.md         (autorité MVP)
    ├── IMPLEMENTATION_BIBLE.md     (ordre d'exécution)
    ├── DATA_MODEL.md               (modèle métier)
    ├── MVP_ROADMAP.md
    ├── UI_AND_ASSETS_PROPOSAL.md   ⚠️ chevauche art/UI + art/ASSET_PRODUCTION
    ├── <concepts>  (COMBAT, STATS, WEAPONS, SKILLS, ITEMS, FORGE, WORLD, …)
    ├── <*_DATABASE> (ITEMS, SKILL, EQUIPMENT_GEN, RECIPES, LOOT, ENEMIES_V2,
    │                 BOSS, DUNGEON, QUEST, CHARACTER, RESOURCES?, …)
    ├── STORY_CHAPTERS.md · SCRIPTS.md   (lore canon)
    └── art/                         🆕 NON tracké encore, absent de l'INDEX
        ├── ART_BIBLE · CHARACTER_BIBLE · BOSS_BIBLE · ENVIRONMENT_BIBLE
        ├── UI_BIBLE · ASSET_PRODUCTION_BIBLE · PROMPT_BIBLE · ART_BACKLOG_BIBLE
```

> Note git : les 8 ART_*.md ont été **déplacées** de `30_new_direction/` vers
> `30_new_direction/art/` (status `D` sur les anciens chemins + `art/` non suivi). Bon
> réflexe d'organisation, mais **non répercuté dans `DOCUMENTATION_INDEX`**.

### 1.2 Le cœur canonique est sain

`DESIGN_FREEZE_V1` ↔ `IMPLEMENTATION_BIBLE` ↔ `DATA_MODEL` sont **mutuellement cohérents** :
mêmes décisions D-01→D-17, même scope (Prologue + Ch I + Ch II), mêmes règles (affixes
0/0/1/1/2, dash=Stamina, ring-scaling pur, 6 boss, Time Gate=bâtiment, recycle ECU+Precious
Stone, etc.). **Aucune contradiction interne détectée dans ce trio.** C'est la fondation
solide sur laquelle reconstruire le reste.

---

## 2. Doublons

| # | Sévérité | Doublon | Détail |
|---|---|---|---|
| D-1 | 🟡 | **`UI_AND_ASSETS_PROPOSAL` ↔ `art/UI_BIBLE` + `art/ASSET_PRODUCTION_BIBLE` + `art/ART_BACKLOG_BIBLE`** | Trois docs traitent UI + production d'assets + priorités. Le PROPOSAL est *code-aware* (composants `apps/web`, mockups, 6 boss, télégraphes) ; les bibles sont *vision-level*. Aucun ne référence l'autre. Frontière à définir (§5). |
| D-2 | 🟡 | **`art/CHARACTER_BIBLE` ↔ `CHARACTER_DATABASE`** | Les deux listent les personnages (Roi, Billy, Tobo, Erix, Gugus, Chevalier, Aemon, Maximus, Décimus, Allaeva, Archimage, Waqt). DB = registre canon (CHR-ids, rôles, ères, apparitions) ; BIBLE = direction visuelle/émotionnelle. La BIBLE **n'utilise pas les CHR-ids** → liaison manuelle fragile. |
| D-3 | 🟢 | **Lore dupliqué `STORY_CHAPTERS` ↔ `SCRIPTS`** | Déjà signalé dans l'INDEX §9. Risque de divergence narrative. |
| D-4 | 🟢 | **`EFFECT_SETS` (v1) ↔ `EFFECT_SETS_AND_RESONANCE_SYSTEM_V2`** ; **`RECIPES` (stub) ↔ `RECIPES_DATABASE`** | Déjà arbitrés par l'INDEX (règle V2>V1, DB>stub) ; reste à marquer *superseded* dans les fichiers. |
| D-5 | 🟢 | **`30_new_direction/RESSOURCES.md` ↔ `10_game_design/ressources.md`** | Doublon inter-générations (cf. §4). |

---

## 3. Incohérences (contradictions de contenu)

| # | Sévérité | Incohérence | Sources |
|---|---|---|---|
| I-1 | 🔴 | **Auto-combat vs combat manuel.** « Player (auto-attack) » et un *Agent System* (armées, défense du monde, production passive). Contredit `DESIGN_FREEZE §2` (« combat 100 % manuel, pas d'auto-attaque ») et le scope OUT (§19). | `docs/AGENTS.md` |
| I-2 | 🔴 | **Skills = Stamina vs Mana.** « Chaque skill possède un Stamina cost » + philosophie auto-combat. Contredit `FREEZE §3` (« toutes les skills consomment de la Mana »). | `docs/SKILLS.md` |
| I-3 | 🔴 | **Forge : onglet « Fusion ».** Priorités Forge listées « craft / upgrade / **fusion** / recyclage ». Contredit `FREEZE §9` (onglets MVP = Craft · Upgrade · Recycle ; **Fusion = OUT backlog**). | `art/UI_BIBLE` §Forge |
| I-4 | 🔴 | **Identité de « Seigneur de la Pluie » (Noah) divergente** (cf. §3.1) — *quel* variant est le boss MVP et dans *quelle* ère. Bloque la production art (BOSS_BIBLE expose 2 versions sans tag MVP/futur clair). | `FREEZE §14` vs `CHARACTER_DATABASE` vs `STORY_CHAPTERS` vs `art/BOSS_BIBLE` |
| I-5 | 🟡 | **Dimension des portraits de dialogue : 512×512 vs 1024×1024.** | 512 : `CHARACTER_BIBLE`, `UI_BIBLE` · 1024 : `ASSET_PRODUCTION_BIBLE`, `PROMPT_BIBLE` |
| I-6 | 🟡 | **Toponymes du donjon Glaciaire.** « Caverne aux **Reflets** » vs « Caverne aux **Chants** / Singing Cavern ». Et climax Allaeva : « **Source du Givre** » vs « **Eye of the Storm** ». | Reflets/Source : `FREEZE §14`, `UI_PROPOSAL` · Chants/Eye : `STORY_CHAPTERS`, `ENVIRONMENT_BIBLE` |
| I-7 | 🟡 | **Billy : « simple chien » vs « grand loup ».** ART_BIBLE le décrit comme un chien (« ne doit jamais être perçu comme un simple chien ») ; CHARACTER_BIBLE et PROMPT_BIBLE = « grand loup / Large wolf companion ». | `ART_BIBLE §6` vs `CHARACTER_BIBLE`, `PROMPT_BIBLE` |
| I-8 | 🟡 | **Roster art incomplet : 4/6 boss.** ART_BACKLOG (Priority A) ne planifie qu'Amalgame des Ténèbres, Ombre du Dragon, Allaeva, Archimage. **Manquent Amalgame du Givre et Seigneur de la Pluie Déchu** (roster Freeze = 6). | `art/ART_BACKLOG_BIBLE` vs `FREEZE §14` |
| I-9 | 🟢 | **Variantes de noms** : « Archimage » / « Archimage d'Arathas » / « Archimage Corrompu » ; « Allaeva » / « Allaeva, Reine de Glace ». Amalgame du Givre **absent** de `CHARACTER_DATABASE`. | transverse |
| I-10 | 🟢 | **« Ère de la Calcination »** donnée comme origine des Terres Désolées, alors que le modèle MVP retient **2 thèmes d'Ère** (Funèbre + Glaciaire, cf. `UI_PROPOSAL` C-02). Calcination *est* une ère canon (`STORY_CHAPTERS` #6) mais hors MVP jouable → vérifier l'intention. | `ENVIRONMENT_BIBLE` vs `STORY_CHAPTERS` |

### 3.1 Détail I-4 — le nœud « Seigneur de la Pluie / Noah »

| Document | Ce qu'il affirme |
|---|---|
| `DESIGN_FREEZE §14` (D-10) | **Seigneur de la Pluie *Déchu*** = boss du **Gouffre Royal**, en **Ch II / Era Glaciaire** (1–2 phases). |
| `CHARACTER_DATABASE` | Noah *Déchu* = **boss Era *Funèbre*** (CHR-007) ; Noah Era *Glaciaire* = **Commander** « Seigneur de la Pluie *Corrompu* » (CHR-011, pas un boss MVP). |
| `STORY_CHAPTERS` (Ch II) | Boss listés = « Archmage, **Corrupted** Lord of Rain » (= *Corrompu*, pas *Déchu*). |
| `art/BOSS_BIBLE` | Décrit **les deux** : *Déchu* (humanoïde 1.2-1.4, MVP) **et** *Corrompu* (échelle 4-5, « catastrophe ») sans marquer le second comme futur (contrairement à Waqt, tagué « FUTURE REFERENCE »). |

➡️ **Conflit canon pré-existant** (antérieur aux bibles art, mais que la production art rend
bloquant). À trancher au niveau Lore + Freeze **avant** de produire l'asset boss du Gouffre
Royal. C'est une **décision de design** (réservée à l'auteur), pas une correction mécanique.

---

## 4. Documents obsolètes

| # | Sévérité | Document(s) | Raison |
|---|---|---|---|
| O-1 | 🔴→archivage | `docs/10_game_design/*` (gdd, balancing, donjons, expeditions, kingamas, leaderboards, renaissance, tiers, xp, …) | Décrit un **idle RPG** (« 5 Ages / 20 chapitres », inspirations Paperclips / Tales of Wind, leaderboards/kingamas). Vision remplacée par l'ARPG manuel du new direction. |
| O-2 | 🔴→archivage | `docs/20_ui_ux/*` (ui_styleguide_v1, interfaces, boto_screen, …) | Direction « Boto » + « Ascension royale héroïque » — or ART_BIBLE impose explicitement un ton **non héroïque** et `Boto → Tobo` (C-01). |
| O-3 | 🟡→archivage | `docs/00_overview/*` (NOTESv0/v1, RESUME, GLOBAL, ORGA, CHECKPOINT) | Notes/checklists de phase antérieure ; valeur historique seulement. |
| O-4 | 🟡→split | `docs/AGENTS.md` | Partie « Agent System » obsolète (I-1). Partie « Codex usage rules » **utile** → à conserver/renommer. |
| O-5 | 🟡→archivage | `docs/SKILLS.md` | Système de skills périmé (I-2). Le canon est `SKILL_DATABASE` + `SKILLS.md` (dans 30_new_direction). |

> ⚠️ **Risque de confusion d'agent IA** : un Claude/Codex/GPT qui *grep* « auto-combat » ou
> « skill stamina cost » tombera sur les docs legacy et pourra implémenter à contre-sens du
> Freeze. C'est l'argument #1 pour l'archivage explicite (§8).

---

## 5. Documents mal placés · responsabilités ambiguës · « cycles »

### 5.1 Mal placés

- 🟡 `docs/AGENTS.md`, `docs/SKILLS.md`, `docs/CHECKPOINTS2804.md` à la **racine** de `docs/`
  alors que tout le canon est sous `30_new_direction/`. La racine devrait ne porter qu'un
  pointeur (README) vers l'index canonique.
- 🟢 `art/` créé mais hors `DOCUMENTATION_INDEX` (cf. §3 D-1 / §7).

### 5.2 Responsabilités ambiguës

| Sujet | Qui devrait être SOURCE OF TRUTH | Conflit actuel |
|---|---|---|
| **Personnages** (identité, rôle, ère) | `CHARACTER_DATABASE` (canon) | `CHARACTER_BIBLE` redéfinit en parallèle sans CHR-id. |
| **UI / écrans** | partage : **vision** = `UI_BIBLE` ; **intégration code/composants** = `UI_AND_ASSETS_PROPOSAL` | Aucun lien entre les deux ; le PROPOSAL est plus aligné au Freeze (ex. il bannit « Fusion », l'UI_BIBLE la liste). |
| **Production d'assets / priorités** | `ASSET_PRODUCTION_BIBLE` (formats) + `ART_BACKLOG_BIBLE` (ordre) | Le PROPOSAL §4 propose AUSSI des priorités P0/P1/P2 d'assets → 2 backlogs concurrents. |
| **Toponymes / lieux** | aucun document dédié | Noms dispersés (Freeze, Story, Environment) → I-6. |

### 5.3 Boucle d'autorité (≈ dépendance circulaire de gouvernance)

Pas de cycle dans les *dépendances de données*. Mais une **incohérence d'ordre d'autorité** :

```txt
art/UI_BIBLE      déclare :  … > UI_BIBLE > IMPLEMENTATION      (art AU-DESSUS de l'implémentation)
IMPLEMENTATION_BIBLE déclare : DESIGN_FREEZE > IMPLEMENTATION > code   (ne reconnaît QUE le Freeze)
art/ART_BIBLE     déclare :  SCRIPT > DESIGN FREEZE > ART > ASSETS  (SCRIPT au-dessus du Freeze)
DOCUMENTATION_INDEX déclare : DESIGN_FREEZE > tout                  (Freeze au sommet)
```

➡️ Trois sommets différents revendiqués (SCRIPT / FREEZE / chaîne art). **Il faut une seule
hiérarchie officielle** (§6) où chaque document connaît sa place sans se contredire.

---

## 6. SOURCE OF TRUTH — hiérarchie officielle proposée

Le conflit « SCRIPT vs FREEZE » se résout en distinguant **deux domaines d'autorité** qui ne
se recouvrent pas, puis en chaînant le reste. (Aligné sur l'intention exprimée dans la
demande, avec la nuance de domaine qui supprime la contradiction.)

```txt
┌──────────────────────────────────────────────────────────────────────┐
│  NIVEAU 0 — CANON NARRATIF   (autorité sur : identité, lore, noms,     │
│  STORY_CHAPTERS · SCRIPTS     cosmologie, "qui/quoi/pourquoi")          │
│  CHARACTER_DATABASE                                                     │
└───────────────┬──────────────────────────────────────────────────────┘
                │  (l'identité narrative ne peut être contredite par un
                │   doc inférieur ; mais le narratif ne définit PAS les
                │   systèmes ni le scope MVP)
                ▼
┌──────────────────────────────────────────────────────────────────────┐
│  NIVEAU 1 — DESIGN FREEZE V1  (autorité sur : SYSTÈMES & SCOPE MVP,    │
│                                 règles verrouillées D-01→D-17)         │
└───────────────┬──────────────────────────────────────────────────────┘
                ▼
┌──────────────────────────────────────────────────────────────────────┐
│  NIVEAU 2 — GAME DESIGN                                                 │
│    • Concept docs (COMBAT, STATS, WEAPONS, SKILLS, ITEMS, FORGE, …)     │
│    • *_DATABASE (canon de CONTENU : [DB] > concept)                     │
└───────────────┬──────────────────────────────────────────────────────┘
                ▼
┌──────────────────────────────────────────────────────────────────────┐
│  NIVEAU 3 — ART BIBLES                                                  │
│    ART_BIBLE → CHARACTER/BOSS/ENVIRONMENT/UI → ASSET_PRODUCTION → PROMPT│
│    (autorité sur : direction visuelle. Ne redéfinit aucun système.)    │
└───────────────┬──────────────────────────────────────────────────────┘
                ▼
┌──────────────────────────────────────────────────────────────────────┐
│  NIVEAU 4 — DATA MODEL        (objets métier, save model)              │
└───────────────┬──────────────────────────────────────────────────────┘
                ▼
┌──────────────────────────────────────────────────────────────────────┐
│  NIVEAU 5 — IMPLEMENTATION BIBLE + UI/ASSETS INTEGRATION                │
│    IMPLEMENTATION_BIBLE (ordre d'exécution) · UI_AND_ASSETS_PROPOSAL    │
│    (mapping composants/mockups) · MVP_ROADMAP (jalons)                  │
└───────────────┬──────────────────────────────────────────────────────┘
                ▼
┌──────────────────────────────────────────────────────────────────────┐
│  NIVEAU 6 — REGISTRES RUNTIME (data-driven dans game-core)             │
│             ↓                                                          │
│  NIVEAU 7 — ASSETS / CODE                                              │
└──────────────────────────────────────────────────────────────────────┘
```

**Règles d'arbitrage à graver (remplacent les règles divergentes actuelles) :**

1. **Domaine narratif vs domaine systèmes** : sur l'identité/le lore/les noms → Niveau 0
   tranche. Sur les mécaniques/le scope MVP → Niveau 1 (Freeze) tranche. Ils ne s'opposent
   pas car ils gouvernent des objets différents.
2. **Un document n'a JAMAIS autorité sur un niveau supérieur.** Les bibles art (N3) ne
   peuvent pas contredire le Freeze (N1) — donc « Fusion » dans UI_BIBLE est invalide (I-3).
3. **`[DB]` > `(concept)`**, **`V2` > `V1`** (conservé de l'INDEX actuel).
4. **Art (N3) et Implémentation (N5) ne se dominent pas** : l'art spécifie le *visuel*,
   l'implémentation l'*ordre de build* ; tous deux subordonnés à N0/N1/N2/N4. (Supprime la
   boucle §5.3 ; la ligne « UI_BIBLE > IMPLEMENTATION » des bibles art doit être retirée.)

> ⚠️ Cette hiérarchie **diffère de la règle 0 actuelle** de `DOCUMENTATION_INDEX`
> (« DESIGN_FREEZE > tout ») : elle place le **canon narratif au-dessus du Freeze pour le
> seul domaine identité/lore**. C'est une décision à valider — mais c'est la seule lecture
> qui réconcilie l'INDEX, les bibles art, et l'exemple fourni dans la demande.

---

## 7. Cohérence FREEZE ↔ IMPLEMENTATION ↔ DATA_MODEL ↔ INDEX ↔ ART_*

| Axe | Verdict |
|---|---|
| FREEZE ↔ IMPLEMENTATION ↔ DATA_MODEL | ✅ **Cohérent** (D-01→D-17 répercutés à l'identique, scope identique). |
| FREEZE ↔ DOCUMENTATION_INDEX | 🟡 Cohérent sur le fond, mais l'INDEX **ne couvre pas `art/`** ni le RESOURCES_DATABASE attendu, et sa **règle 0** entre en tension avec les bibles art (§6). |
| FREEZE ↔ ART_* (systèmes) | 🔴 1 contradiction (I-3 Fusion) · 🔴 1 nœud canon (I-4) · 🟡 roster incomplet (I-8). Le reste des bibles **respecte** le Freeze (cyan réservé Tobo/Time Gate/Kaléidoscope/Fleuve ; équipement non visible MVP ; HUD HP/Mana/Stamina ; Time Gate ; Kaléidoscope special item). |
| ART_* ↔ LORE | 🟡 I-6 (toponymes), I-7 (Billy), I-10 (Calcination) · sinon **fidèle** (Tobo = relique de Créa, boss = tragédies, monde-rêve mourant, Waqt faux dieu). |
| ART_* ↔ DATA_MODEL | ✅ Pas de contradiction (l'art ne touche pas au save model ; « équipement non visible » est compatible avec `EquipmentInstance`). |

**Aucune règle artistique ne contredit le lore de fond** (cosmologie Créa/Naan/Amal, River of
Life, Rêves, Waqt, Shadows). Les frictions art↔lore sont des **détails de nommage/identité**
(I-6/I-7/I-10), pas des contradictions de fond.

---

## 8. Arborescence cible proposée

Réorganisation **non destructive** : on **archive** (on ne supprime pas) le legacy, on
**numérote** la branche art, on **promeut** un README racine.

```txt
docs/
├── README.md                       🆕 pointeur unique → 30_new_direction/DOCUMENTATION_INDEX.md
│
├── 30_new_direction/               (renommer plus tard en "canon/" si souhaité)
│   ├── DOCUMENTATION_INDEX.md      ⭐ régénéré (inclut art/ + niveaux d'autorité)
│   ├── DOC_ARCHITECTURE_AUDIT.md   (ce fichier)
│   │
│   ├── 00_canon/                   (option) FREEZE · DATA_MODEL · IMPLEMENTATION · ROADMAP
│   ├── 01_lore/                    STORY_CHAPTERS · SCRIPTS · CHARACTER_DATABASE
│   ├── 02_design/                  concepts (COMBAT, STATS, WEAPONS, …)
│   ├── 03_databases/               *_DATABASE (+ RESOURCES_DATABASE à créer)
│   ├── 04_art/                     les 8 bibles (ex-"art/")
│   └── 05_integration/             UI_AND_ASSETS_PROPOSAL + mockups/
│
├── contrib/
│   └── AGENT_RULES.md              🆕 extrait des "Codex usage rules" d'AGENTS.md
│
└── _legacy/                        🆕 archivé, bandeau "NON CANON — référence historique"
    ├── 00_overview/  10_game_design/  20_ui_ux/
    ├── AGENTS.md (partie Agent System)  ·  SKILLS.md  ·  CHECKPOINTS2804.md
```

> La sous-numérotation interne de `30_new_direction/` (00_canon…05_integration) est
> **optionnelle** (🟢) : elle clarifie mais impose de réparer tous les liens relatifs. À
> faire en une passe dédiée, pas dans l'urgence.

---

## 9. DOCUMENTATION_INDEX — nouvelle version (DRAFT proposé, non appliqué)

Ci-dessous le **squelette** du nouvel index demandé (point 7). À valider avant d'écraser
`DOCUMENTATION_INDEX.md`. Les sections existantes (Canon Rules, Reading Paths DB, Status
Table) sont **conservées** ; on **ajoute** : niveaux d'autorité unifiés, bloc `04_art`,
dépendances art, et une priorité de lecture IA mise à jour.

```markdown
# 📚 IdleKing — Documentation Index (v2)

## Autorité (SOURCE OF TRUTH) — voir DOC_ARCHITECTURE_AUDIT §6
N0 Canon narratif : STORY_CHAPTERS · SCRIPTS · CHARACTER_DATABASE   (identité/lore/noms)
N1 DESIGN_FREEZE_V1                                                 (systèmes & scope MVP)
N2 Game Design : concepts + *_DATABASE ([DB] > concept, V2 > V1)
N3 Art Bibles  : ART_BIBLE → CHARACTER/BOSS/ENVIRONMENT/UI → ASSET_PRODUCTION → PROMPT
N4 DATA_MODEL
N5 IMPLEMENTATION_BIBLE · UI_AND_ASSETS_PROPOSAL · MVP_ROADMAP
N6 Registres runtime (game-core)   →   N7 Assets / Code

Règles : (1) domaine narratif vs systèmes ; (2) jamais d'autorité vers le haut ;
(3) [DB]>concept, V2>V1 ; (4) Art et Implémentation ne se dominent pas.

## 04 · ART & PRODUCTION  (🆕)
| Document | Rôle | Dépend de |
|---|---|---|
| ART_BIBLE | Vision, palette, ton, règle d'or | STORY_CHAPTERS, DESIGN_FREEZE |
| CHARACTER_BIBLE | Direction visuelle des personnages | CHARACTER_DATABASE (CHR-ids), ART_BIBLE |
| BOSS_BIBLE | Direction visuelle des boss | BOSS_DATABASE, FREEZE §14, ART_BIBLE |
| ENVIRONMENT_BIBLE | Direction visuelle des zones | WORLD/DUNGEON, STORY_CHAPTERS |
| UI_BIBLE | Vision UI/UX | FREEZE (§9 forge!), ART_BIBLE |
| ASSET_PRODUCTION_BIBLE | Formats/tailles/pipeline (autorité technique assets) | toutes bibles |
| PROMPT_BIBLE | Templates de prompts de génération | ASSET_PRODUCTION_BIBLE |
| ART_BACKLOG_BIBLE | Ordre de production (sprints) | roster FREEZE §14 (6 boss), ART_BIBLE |

## Priorité de lecture IA (Claude / Codex / GPT) — v2
1. DOCUMENTATION_INDEX → DESIGN_FREEZE_V1 → DATA_MODEL → IMPLEMENTATION_BIBLE → MVP_ROADMAP
2. Lore (N0) : STORY_CHAPTERS → CHARACTER_DATABASE   (avant toute prod d'identité/art)
3. *_DATABASE [DB], puis concepts (N2)
4. Si tâche ART : ART_BIBLE → (CHARACTER|BOSS|ENVIRONMENT|UI)_BIBLE → ASSET_PRODUCTION → PROMPT
5. Appliquer §6 (autorité) + Canon Rules ; ignorer docs/_legacy/ (non canon)
```

> ✋ **Non appliqué** : sur ta validation, je régénère le fichier complet
> `DOCUMENTATION_INDEX.md` (en conservant ses sections 1/4/5/8 actuelles) avec ces ajouts.

---

## 10. Recommandations classées

### 🔴 Critiques (à traiter avant de poursuivre la production)

| # | Action | Réf |
|---|---|---|
| C-1 | **Trancher le nœud « Seigneur de la Pluie » (Déchu vs Corrompu, ère, boss MVP)** au niveau Lore+Freeze, puis aligner CHARACTER_DATABASE / STORY_CHAPTERS / BOSS_BIBLE. *(Décision d'auteur — je ne tranche pas seul.)* | I-4 |
| C-2 | **Corriger UI_BIBLE §Forge** : retirer « Fusion », garder Craft · Upgrade · Recycle. | I-3 |
| C-3 | **Neutraliser les docs legacy contradictoires** (auto-combat / skills=Stamina) : déplacer vers `docs/_legacy/` avec bandeau « NON CANON », pour qu'aucun agent IA ne s'y réfère. | I-1, I-2, O-1→O-5 |
| C-4 | **Unifier la règle d'autorité** (§6) dans DOCUMENTATION_INDEX, et **retirer la ligne « UI_BIBLE > IMPLEMENTATION »** des bibles art (boucle §5.3). | §5.3, §6 |

### 🟡 Recommandées

| # | Action | Réf |
|---|---|---|
| R-1 | **Régénérer DOCUMENTATION_INDEX** (inclure `art/`, niveaux d'autorité, priorité de lecture IA v2). | §9, D-1 |
| R-2 | **Définir la frontière UI/Assets** : UI_BIBLE = vision ; UI_AND_ASSETS_PROPOSAL = intégration code/mockups ; ASSET_PRODUCTION + ART_BACKLOG = formats & ordre. Cross-link les 4. | D-1, §5.2 |
| R-3 | **Lier CHARACTER_BIBLE à CHARACTER_DATABASE par CHR-id** ; DB = autorité identité, BIBLE = autorité visuelle. | D-2, §5.2 |
| R-4 | **Trancher la dimension portrait** (recommandé : master **1024×1024** en production via ASSET_PRODUCTION_BIBLE, affichage 512 = downscale) et propager. | I-5 |
| R-5 | **Créer un registre de toponymes canoniques** (Caverne aux Reflets/Chants, Source du Givre/Eye of the Storm, etc.) — idéalement dans WORLD.md ou DUNGEON_DATABASE. | I-6 |
| R-6 | **Trancher Billy** (loup ou chien) et harmoniser ART_BIBLE ↔ CHARACTER_BIBLE ↔ PROMPT_BIBLE. *(Décision d'auteur.)* | I-7 |
| R-7 | **Compléter ART_BACKLOG** : ajouter Amalgame du Givre + Seigneur de la Pluie au roster de production (6 boss). | I-8 |
| R-8 | **Splitter AGENTS.md** : « Codex usage rules » → `docs/contrib/AGENT_RULES.md` ; archiver « Agent System ». | O-4 |

### 🟢 Optionnelles

| # | Action | Réf |
|---|---|---|
| G-1 | Sous-numéroter `30_new_direction/` (00_canon…05_integration) en une passe dédiée (réparer les liens). | §8 |
| G-2 | Harmoniser les variantes de noms (Archimage d'Arathas/Corrompu, Allaeva Reine de Glace) via un glossaire ; ajouter Amalgame du Givre à CHARACTER_DATABASE si traité comme entité. | I-9 |
| G-3 | Clarifier l'intention « Ère de la Calcination » pour les Terres Désolées (vestige d'une ère passée vs thème MVP). | I-10 |
| G-4 | Marquer physiquement *superseded* dans EFFECT_SETS v1 / ENEMIES v1 / RECIPES stub. | D-4 |
| G-5 | Clôturer la dette connue de l'INDEX §9 : créer `RESOURCES_DATABASE.md` (P0 Freeze §20) + réparer la réf cassée `RESOURCES_DATABASE` dans RECIPES_DATABASE. | INDEX §9 |
| G-6 | Fusionner ou cross-référencer STORY_CHAPTERS ↔ SCRIPTS pour éviter la divergence narrative. | D-3 |

---

## 11. Prochaines étapes suggérées

1. Tu valides **§6 (hiérarchie d'autorité)** — c'est le pivot de tout le reste.
2. Tu tranches les **2 décisions d'auteur** : I-4 (Seigneur de la Pluie) et I-7 (Billy).
3. Sur accord, j'exécute en lot **non destructif** : C-2, C-3, C-4, R-1 (régénération index),
   R-8, puis les R/G restantes.

*Aucun fichier de design n'a été modifié par cet audit. Ce rapport est le seul artefact créé.*
```
