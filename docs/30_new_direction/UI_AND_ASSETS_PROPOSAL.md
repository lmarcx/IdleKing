# 🎨 IdleKing — Interfaces & Assets Proposal (v1)

## Status

```txt
PROPOSAL — concept / production reference (non normatif)
```

Ce document propose une **direction d'interfaces et d'assets** pour le MVP, dérivée des
system designs de `docs/30_new_direction/`. Il est **subordonné** à `DESIGN_FREEZE_V1.md`
(autorité 0) et s'aligne sur les jalons de `MVP_ROADMAP.md`.

> **Règle de lecture**
> - ✅ = existe déjà dans `apps/web` (à réutiliser).
> - ♻️ = existe mais à **refondre / aligner** sur le Freeze.
> - 🔨 = **à créer** (absent du code aujourd'hui).
> - Mapping milestones : voir `MVP_ROADMAP.md` (M1 → M7).

**Scope** : Prologue · Chapter I — Era Funèbre · Chapter II — Era Glaciaire.

---

## 0. Corrections canon intégrées

Deux clarifications de design qui priment sur les versions antérieures de ce document :

```txt
C-01  Boto → Tobo.
      Tobo est un MAIN NPC (quêtes, dialogues, unlocks, dons d'items).
      ❌ On supprime l'interface plein écran dédiée ("console Boto").
      ✅ On conserve UNIQUEMENT le style cosmic comme SKIN de sa boîte de dialogue,
         pour le différencier visuellement des autres NPC.

C-02  Terres Désolées (Prologue) se situe DANS l'Ère Funèbre.
      L'Ère Funèbre caractérise le Chapitre I ET englobe le Prologue.
      → 2 thèmes d'Ère au MVP (pas 3) : Funèbre (Prologue + Ch I) et Glaciaire (Ch II).
```

---

## 1. Direction artistique

Le code porte déjà une identité — **« Dark Fantasy + Cosmic »** (`apps/web/styles/ui-tokens.css`).
On la **formalise** plutôt que d'en créer une nouvelle.

### 1.1 Trois couches visuelles

| Couche | Rôle narratif | Palette (tokens existants) | Usage UI |
|---|---|---|---|
| **Royaume / Fantasy** | Le Kingdom reconstruit, le réel | `--ik-bg-0/1/2` (ardoise) + `--ik-gold #c6a85b` | Bâtiments, Forge, inventaire, character (`ik-relic-panel`, `ik-game-panel`) |
| **Onirique / Cosmic** | Monde-rêve, Time Gate, visions, **dialogue Tobo** | `--ik-cyan #00e7ff` + `--ik-violet #8a5cff` | Time Gate, transitions d'Ère, mémoires/visions, **skin dialogue Tobo** (`ik-holo-panel`) |
| **Énergies** | Feedback de progression | XP vert `#1aff7a`, WXP bleu `#2da8ff`, danger rouge | Barres, popups, jauges World |

### 1.2 Teinte par Ère (MVP)

On garde la même structure de panneaux ; seul l'**accent secondaire** change.

```txt
Ère Funèbre   (Prologue Terres Désolées + Chapitre I)
  → cendre + braise : gold chaud, rouge sourd, brume grise, ciel éclipsé (orange → noir)

Ère Glaciaire (Chapitre II)
  → cyan glacé + blanc bleuté ; le cyan "cosmic" devient ici diégétique (glace ↔ rêve)
```

### 1.3 Tokens à ajouter — télégraphes combat

Définis dans `COMBAT.md` §18 mais pas encore en CSS :

```txt
--ik-tele-damage  orange   (dégâts)
--ik-tele-lethal  rouge    (one-shot / mortel)
--ik-tele-stun    jaune    (contrôle)
--ik-tele-debuff  bleu     (debuff)
--ik-tele-safe    vert     (zone safe / heal)
```

### 1.4 Typographie (conservée)

```txt
Titres   → font-ik-title (serif)
Menus    → font-ik-menu  (uppercase, letterspacing)
Tobo/term→ font-ik-boto / mono (skin dialogue Tobo uniquement)
Corps    → font-ik-body
```

---

## 2. Système de dialogue NPC (précision C-01)

Pattern unique, **deux skins** :

| Skin | Pour | Style | Base code |
|---|---|---|---|
| **Fantasy** (gold) | NPC humains : Erix, Gugus, Chevalier, Aemon, Archimage, Noah, Allaeva, Billy | `ik-relic-panel--gold`, encadré serif | 🔨 à créer (variante de la boîte de dialogue) |
| **Cosmic** (cyan/violet) | **Tobo uniquement** | scanlines + glow cyan, `font-ik-boto` | ♻️ dérivé de `terminal-dialogue.tsx` / tokens `ik-boto-*` |

**Tobo (Main NPC)** — fonctions à supporter dans la boîte de dialogue (pas de plein écran) :

```txt
- lignes de dialogue (avancement story / lore)
- donner / mettre à jour des quêtes
- annoncer des unlocks (bâtiments, recettes, Ère)
- remettre des items (récompenses narratives, items spéciaux)
- choix de réponse simples (choice bar)
```

> ♻️ **Dette à nettoyer** : retirer la console plein écran (`app/game/boto/page.tsx`,
> `ik-boto-console` / `ik-boto-unit`) ; recycler **seulement** le skin visuel (couleurs,
> scanlines, glow) dans la boîte de dialogue Tobo. Renommer `boto/` → `tobo/`.

---

## 3. Propositions d'interfaces

Classées par pilier, avec état (✅/♻️/🔨) et jalon.

### A. Combat & Exploration — M1, M4
- ♻️ **Combat HUD** (`combat-hud.tsx`, `exploration-hud.tsx`) aligné Freeze :
  - 3 jauges **HP / Mana / Stamina** (Stamina visible : dash + sprint la consomment, D-04).
  - **Skill bar 5 slots** (`skill-bar.tsx`) : cooldown radial + coût Mana + élément/catégorie.
  - Indicateur **dash** (charges/cooldown) distinct de la Stamina.
  - Couche **télégraphes** code couleur (Pixi, `skills-visuals.ts`) + juice (damage numbers, crit, screenshake) — livrable Polish (P13).
- 🔨 **Écran fin de run / mort** : « retour Kingdom / relancer » + récap loot sécurisé (checkpoint).

### B. Kingdom Hub — M5
- ✅ `kingdom-hub-stage.tsx` (Pixi, déplacement + interaction) + `kingdom-overlay.tsx`.
- ♻️ **Pattern unifié** « approcher → Press F → modale dédiée » (BUILDINGS.md §8) ;
  modale-cadre générique (`ik-kingdom-modal`) déclinée par bâtiment (tabs / actions / mini-jeu / shop / upgrade / status).
- 🔨 **Time Gate** (ex-World Gate, D-15) — **absent du code** : écran cosmic, sélection d'Ère,
  slot **Kaléidoscope**, consommation **Fragment du Temps**.

### C. Build & Itemisation — M2, M6
- ✅ **Character / Equipment doll** (`equipment-doll.tsx`, `equipment-slot.tsx`, `equipment-tooltip.tsx`).
  - ♻️ Slots Freeze : `main_hand, off_hand, helmet, chest, cape, gloves, belt, boots, 5×ring, necklace, artifact (inerte/grisé)`.
- ♻️ **Skills / Rings** (`skills-view.tsx`) : modèle **ring-scaling** (1 ring = 1 skill, garde anti-doublon) ; retirer skill level / skill points (D-02).
- 🔨 **Panneau Résonance / Effect Sets** — **absent** : `Total Résonance` sur 9 slots →
  `Effect Slots = floor(/9)` + slotting des 5 Effect Sets (M6).
- ♻️ **Forge** : onglets **Craft · Upgrade · Recycle** uniquement (Evolve/Enchant/Fusion OUT) ;
  craft = roll de rareté **pondéré par Forge Level** ; afficher le gating d'armes Forge Level 1-10.
- ✅ **Inventaire / Bank / Market** (`inventory-view.tsx`, `bank/`, `market/`) à compléter
  (tri rareté/slot, valeurs de vente Écu).

### D. Narratif — M4, M5
- ♻️ **Boîte de dialogue Tobo** (skin cosmic) — voir §2 ; supprimer la console plein écran.
- 🔨 **Boîte de dialogue NPC** (skin fantasy/gold) pour Erix, Gugus, Chevalier, Aemon…
- 🔨 **Visions / Mémoires** plein écran (couche violette) pour les flashbacks du Vieux Roi.
- ♻️ **Carte / sélection Story** (`story-zone-*.tsx`) recâblée sur le gating **Story Quest + WorldLevel**.

### E. Mini-jeux — M3 (Mine), puis Farm / Kitchen
- ✅ panels : `mine-mini-game-panel.tsx`, `farm-mini-game-panel.tsx`, `kitchen-mini-game-panel.tsx`.
- 🔨 boucles UI spécifiques :
  - **Mine** : démineur 100 étages, HP/Energy de run, révélation adjacente, butin.
  - **Farm** : Fruit Ninja, timer 1 min, bombes, fruits dorés (bonus + gain timer).
  - **Kitchen** : pattern de touches par manche + ressources projetées (cliquer mauvaises / laisser bonnes) + jauge de succès → qualité.

### F. Méta / chrome global
- ✅ `left-nav.tsx`, `right-hud.tsx`, `resource-panel.tsx`, `progression-panel.tsx`.
- 🔨 **Bandeau World** permanent : World Energy + regen, WorldLevel / WXP, level-up manuel (Forum).
- ♻️ **Offline summary** (`offline-summary-modal.tsx`) branché sur la regen World Energy offline.

---

## 4. Assets principaux

Existant : beaucoup de **placeholders SVG** (resources, equipment-slots, story-zones) + quelques
**PNG** (bâtiments kingdom, exploration tiles, `player_king.png` statique).

### 4.1 Priorité P0 — débloque les milestones de jeu
| Asset | Détail | Pour |
|---|---|---|
| **Sprite/anim Vieux Roi** | idle, marche, attaque base, dash, hit, mort | Combat M1 |
| **Tilesets d'arène** | Funèbre (cendre) + Glaciaire (givre) : sol / mur / obstacles | Donjons/exploration |
| **Sprites ennemis MVP** | Shadows (Guerre), Dragonoïdes, créatures givre/aquatiques | Combat (ENEMIES_DATABASE_V2) |
| **6 boss** | Amalgame des Ténèbres, Ombre du Dragon, Amalgame du Givre, Archimage, Seigneur de la Pluie, Allaeva (2 phases) | M4→M7 |
| **VFX skills (16)** | par élément : Neutral/Fire/Water/Ice/Wind/Electricity/Ground/Light/Dark | Skills M4 |
| **Télégraphes** | formes réutilisables (cercle, cône, ligne, zone) × 5 couleurs | Polish |

### 4.2 Priorité P1 — build & économie lisibles
| Asset | Détail |
|---|---|
| **Icônes équipement** | par slot × famille d'arme (8 armes + offhands Shield/Grimoire) + armures des 4 sets actifs (Vagabond / Pleureur / Maraudeur / Docteur) + cadres de rareté (5) |
| **Icônes ressources finales** | remplacent les SVG génériques, alignées `RESOURCES_DATABASE` (minerais, bois, légumes/viandes, matériaux thématiques, cores de boss) |
| **Icônes skills / rings** | 16 `SK-0xx` + 5 rings nommés |
| **Effect Sets** | 5 emblèmes (Shadow Veil, Lordflame, Motherstone, Kingfrost, Rainmaker) + icône Résonance |
| **Items spéciaux** | Kaléidoscope, Fragment du Temps, Goutte de Ténèbres |

### 4.3 Priorité P2 — hub & narratif
| Asset | Détail |
|---|---|
| **Bâtiments Kingdom** | upgrade des PNG + états (locked/built/maxed) + **Time Gate** (manquant) + Market/Bank/Forge détaillés |
| **Portraits NPC** | Tobo (skin cosmic), Billy, Erix, Gugus, Chevalier, Aemon, Archimage, Noah, Allaeva |
| **Backgrounds d'Ère** | Funèbre : Terres Désolées, Mausolée, Pic des Cendres · Glaciaire : Caverne aux Reflets, Académie d'Arathas, Gouffre Royal, Source du Givre |
| **Skin onirique Time Gate** | cadre + transition d'Ère (couche cyan/violet) |
| **Assets mini-jeux** | Mine (sol/roche/minerai/ennemi/passage), Farm (fruits + bombes + doré), Kitchen (patterns + ingrédients) |

---

## 5. Séquençage recommandé (miroir roadmap)

```txt
M1  Combat HUD + sprite Roi + 1 tileset + 1 ennemi
M2-M3  doll / forge / inventaire + icônes rareté + assets Mine
M4-M5  boss + VFX skills + dialogues (Tobo cosmic + NPC fantasy)
M6  Time Gate + panneau Résonance / Effect Sets
M7  polish VFX / télégraphes / juice
```

---

## 6. Correspondance écran ↔ composant ↔ état

| Interface | Composant existant | État |
|---|---|---|
| Combat HUD | `components/game/combat/combat-hud.tsx`, `story-exploration/exploration-hud.tsx` | ♻️ |
| Skill bar | `story-exploration/skill-bar.tsx` | ♻️ |
| Arène (rendu) | `story-exploration/pixi-exploration-stage.tsx`, `duel/duel-arena-stage.tsx` | ✅ |
| Kingdom hub | `kingdom/kingdom-hub-stage.tsx`, `kingdom/kingdom-overlay.tsx` | ✅ |
| Modale bâtiment | `ik-kingdom-modal` (ui-tokens) | ♻️ |
| Time Gate | — | 🔨 |
| Character / doll | `character/equipment-doll.tsx`, `equipment-slot.tsx`, `equipment-tooltip.tsx` | ✅/♻️ |
| Skills / Rings | `skills/skills-view.tsx` | ♻️ |
| Résonance / Effect Sets | — | 🔨 |
| Forge | (bâtiment, via modale) | ♻️/🔨 |
| Inventaire | `inventory/inventory-view.tsx` | ✅ |
| Bank / Market | `kingdom/bank/page.tsx`, `kingdom/market/page.tsx` | ✅ |
| Dialogue Tobo (cosmic) | `boto/terminal-dialogue.tsx`, tokens `ik-boto-*` | ♻️ (renommer → tobo) |
| Dialogue NPC (fantasy) | — | 🔨 |
| Carte Story | `story/story-zone-*.tsx` | ♻️ |
| Mini-jeux | `kingdom/{mine,farm,kitchen}-mini-game-panel.tsx` | 🔨 |
| Bandeau World | `resource-panel.tsx`, `progression-panel.tsx` | 🔨 |

---

## 7. Manques critiques (à créer en priorité)

```txt
1. Time Gate            — aucun écran (bloque le déblocage d'Ère, M6)
2. Résonance / Effect   — aucune visualisation (bloque la couche 4 du build, M6)
3. Dialogue NPC fantasy — seul le skin cosmic Tobo existe
4. Sprites/anim combat  — player_king.png statique, pas d'ennemis/boss animés
```

---

## 8. Maquettes visuelles

Maquettes HTML **autonomes** (ouvrables via `file://` ou le panneau preview), construites sur la
palette de `apps/web/styles/ui-tokens.css`. Validation de direction — **pas du code de production**.

**Galerie** → [`mockups/index.html`](mockups/index.html)

| Maquette | Fichier | Écran | Jalon / état |
|---|---|---|---|
| Combat HUD | [`mockups/combat-hud.html`](mockups/combat-hud.html) | HP/Mana/Stamina, 5 skills, dash, télégraphes, boss bar | M1 · ♻️ |
| Time Gate | [`mockups/time-gate.html`](mockups/time-gate.html) | sélection d'Ère, Kaléidoscope, Fragment du Temps | M6 · 🔨 |
| Résonance & Effect Sets | [`mockups/resonance-effect-sets.html`](mockups/resonance-effect-sets.html) | 9 slots → Effect Slots, slotting 5 sets | M6 · 🔨 |
| Dialogue Tobo vs NPC | [`mockups/dialogue-tobo-vs-npc.html`](mockups/dialogue-tobo-vs-npc.html) | un pattern, deux skins (C-01) | M4-M5 |
| Forge | [`mockups/forge.html`](mockups/forge.html) | Craft/Upgrade/Recycle, échelle d'armes, roll rareté | M3 |
| Assets Style Guide | [`mockups/assets-style-guide.html`](mockups/assets-style-guide.html) | cadres rareté, teintes d'Ère, télégraphes, icônes | référence |

> Le fichier partagé `mockups/_shared.css` réplique les tokens (`--ik-*`, raretés, télégraphes)
> pour que chaque maquette s'ouvre sans dépendance. Les composants cibles vivent dans
> `apps/web/components/game/`.

---

*UI_AND_ASSETS_PROPOSAL — subordonné à DESIGN_FREEZE_V1.md & MVP_ROADMAP.md.
Périmètre : Prologue · Chapter I — Era Funèbre · Chapter II — Era Glaciaire.*
