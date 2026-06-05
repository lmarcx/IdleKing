# 🎨 IdleKing — ART INDEX

> **Sous-index de la branche artistique.** Point d'entrée de toute la production visuelle.
> Subordonné à l'index racine : [`../DOCUMENTATION_INDEX.md`](../DOCUMENTATION_INDEX.md).
>
> Niveau **ART_BIBLES** de la hiérarchie (entre `DESIGN_FREEZE` et `GAME DESIGN DOCS`).
> Les bibles art **ne contredisent jamais** le Freeze ni le Lore (voir Canon Rules de l'index).

---

## 0. Chaîne d'autorité interne

```txt
LORE / SCRIPT  ▸  DESIGN_FREEZE_V1  ▸  ART_BIBLE
        ▸  CHARACTER_BIBLE · BOSS_BIBLE · ENVIRONMENT_BIBLE · UI_BIBLE
        ▸  ASSET_PRODUCTION_BIBLE  ▸  PROMPT_BIBLE  ▸  ASSETS
ART_BACKLOG_BIBLE  pilote l'ORDRE de production (transverse).
```

Sources canon de référence (hors branche art, à respecter) :
[`DESIGN_FREEZE_V1 §14`](../00_canon/DESIGN_FREEZE_V1.md) (roster 6 boss) ·
[`CHARACTER_DATABASE`](../01_lore/CHARACTER_DATABASE.md) (identité/CHR-id) ·
[`BOSS_DATABASE`](../03_databases/BOSS_DATABASE.md) · [`STORY_CHAPTERS`](../01_lore/STORY_CHAPTERS.md).

---

## 1. Les 8 Bibles (ordre de lecture recommandé)

| # | Bible | Rôle | Lire pour |
|---|---|---|---|
| 1 | [`ART_BIBLE.md`](ART_BIBLE.md) | **Vision racine** : ton, palette, piliers émotionnels, règle d'or. | Toute tâche art. |
| 2 | [`CHARACTER_BIBLE.md`](CHARACTER_BIBLE.md) | Direction visuelle des personnages (peuples, Roi, Billy, Tobo, NPC). | Personnages / portraits. |
| 3 | [`BOSS_BIBLE.md`](BOSS_BIBLE.md) | Direction visuelle des boss, échelle, philosophie « tragédie ». | Boss. |
| 4 | [`ENVIRONMENT_BIBLE.md`](ENVIRONMENT_BIBLE.md) | Zones, landmarks, atmosphères d'Ère. | Décors / tilesets. |
| 5 | [`UI_BIBLE.md`](UI_BIBLE.md) | Vision UI/UX, HUD, dialogue, règle du cyan. | Interface. |
| 6 | [`ASSET_PRODUCTION_BIBLE.md`](ASSET_PRODUCTION_BIBLE.md) | **Autorité technique** : formats, tailles, animations, naming, pipeline. | Avant de produire. |
| 7 | [`PROMPT_BIBLE.md`](PROMPT_BIBLE.md) | Templates de prompts + negative prompts. | Génération IA. |
| 8 | [`ART_BACKLOG_BIBLE.md`](ART_BACKLOG_BIBLE.md) | Ordre réel de production (Priorités S→F, Sprints 1-4). | Planifier. |

---

## 2. Canon art à respecter (rappels transverses)

- **Billy = Grand Loup** (D-A01) — jamais un simple chien.
- **Seigneur de la Pluie** : produire le **Déchu** (boss MVP, frère exilé). Le **Corrompu** (Noah Commandant) est **futur**, **modèle entièrement différent** (D-A02/D-A04).
- **Roster boss MVP = 6** : Amalgame des Ténèbres, Ombre du Dragon, Amalgame du Givre, Archimage, Seigneur de la Pluie Déchu, Allaeva.
- **Toponymes** : **Caverne aux Chants**, **Source du Givre** (D-A05/D-A06).
- **Portraits** : master **1024×1024**. **Forge MVP** : Craft/Upgrade/Recycle (pas de Fusion).
- **Cyan** réservé : Tobo · Time Gate · Kaléidoscope · Fleuve de Vie · phénomènes Créa/Temps.

---

## 3. Productions (assets & canon visuel)

### 3.1 `concepts/` — planches de concept (validation de direction)
| Personnage | Fichiers |
|---|---|
| Old King | [`character sheet`](concepts/old_king/old_king_character_sheet_v1.png.png) · [`sprite sheet`](concepts/old_king/old_king_sprite_sheet_v1.png.png) · [`variants`](concepts/old_king/old_king_variants_v1.png.png) |
| Billy | [`character sheet`](concepts/billy/billy_character_sheet_v1.png.png) · [`variants`](concepts/billy/billy_variants_v1.png.png) |
| Tobo | [`character sheet`](concepts/tobo/tobo_character_sheet_v1.png.png) · [`variants`](concepts/tobo/tobo_variants_v1.png.png) |

### 3.2 `production/` — fiches canon d'asset (validées)
| Asset | Fiche |
|---|---|
| Old King | [`OLD_KING_CANON_V1.md`](production/old_king/OLD_KING_CANON_V1.md) |

> 🧹 **Dette de nommage** (cf. `ASSET_PRODUCTION_BIBLE` §Naming `char_[nom]_[type]`) : certains
> fichiers concepts portent une double extension `.png.png` ou un nom brut
> (`ChatGPT Image …png`). À renommer en `char_<nom>_<type>_vN.png` lors d'une passe dédiée.

---

## 4. Maintenance

> **Tout nouvel asset ou bible art met à jour CE fichier dans le même commit.**

- Nouveau concept → l'ajouter §3.1 sous le bon personnage.
- Asset promu en canon → fiche dans `production/<nom>/` + ligne §3.2.
- Nouvelle bible → ligne §1 + (si règle transverse) rappel §2.
- Respecter le **naming** de `ASSET_PRODUCTION_BIBLE` ; `git mv` pour tout renommage.

---

*ART_INDEX — subordonné à [`../DOCUMENTATION_INDEX.md`](../DOCUMENTATION_INDEX.md) et au Design Freeze.*
