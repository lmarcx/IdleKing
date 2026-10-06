# 🎨 ART DIRECTION DECISION — B&W géométrique dessiné en code

Status : **LOCKED** — décision du 2026-10-06 (D-A10)

Autorité : ce document **prime sur toutes les autres bibles art** pour tout ce qui touche au
rendu en jeu. Les bibles existantes restent la référence pour le **ton, la narration visuelle et
l'identité** des personnages (ce qu'ils sont, ce qu'on doit ressentir), plus pour leur rendu.

---

## 1. Décision

```txt
Direction unique : noir & blanc minimaliste, formes géométriques, dessiné en code
                   (Pixi Graphics en jeu, SVG pour le DOM).
Abandonné        : production illustrée Dark Fantasy (sprite sheets, portraits peints,
                   illustrations narratives, pipeline de génération d'images).
```

- Les concepts PNG de `concepts/` (Vieux Roi, Billy, Tobo) et `production/` sont **conservés dans
  le dépôt** à titre d'archive et de référence d'intention. Ils ne sont **ni chargés par le jeu,
  ni la base d'un pipeline raster**.
- `PROMPT_BIBLE.md` et les sections « sprite / portrait / illustration » de `ART_BACKLOG_BIBLE.md`
  et `ASSET_PRODUCTION_BIBLE.md` sont **gelées** (historique).

## 2. Grammaire visuelle (en jeu)

| Élément | Règle |
|---|---|
| Palette | Rampe de gris `BW` (`black, gray0..gray4, white`) — pas de teinte chromatique porteuse de sens. |
| Joueur / alliés | Remplissage clair, contour sombre (Roi, Billy, PNJ). |
| Ennemis | **Négatif du joueur** : remplissage noir, contour blanc épais. L'identité passe par la **silhouette**. |
| Élites | Halo creux au-dessus de la tête. |
| Boss | Silhouette dédiée, contour plus épais, échelle × rayon. |
| Danger | Télégraphes : contour = empreinte finale, disque qui se remplit jusqu'à l'impact. Le « létal » est le plus clair. |
| Décor | Obstacles/portes en aplats sombres, contours clairs ; une famille de formes par biome. |
| Icônes DOM | SVG 128 px, trait `#f2f2f2` 8 px arrondi, aplats gris. |

## 3. Où vit le code

| Contenu | Fichier |
|---|---|
| Figures (Roi, compagnon, PNJ, hostile générique) | `apps/web/components/game/shared/geometric-figure.ts` |
| Silhouettes ennemis (10 familles + 6 boss) + Tobo | `apps/web/components/game/shared/geometric-enemies.ts` |
| Compagnons (Billy, Tobo) | `apps/web/components/game/shared/companions.ts` |
| Obstacles / portes de donjon | `apps/web/components/game/shared/geometric-dungeon.ts` |
| Bâtiments du Royaume | `apps/web/components/game/kingdom/geometric-buildings.ts` |
| Décor éditeur par biome | `packages/game-core/level-editor/biome-assets.ts` |
| Icônes ressources / slots | `apps/web/public/assets/{resources,equipment-slots}/*.svg` |

## 4. Ce qui reste à produire

- Visuels de télégraphes par élément (formes, pas couleurs) si le Freeze conserve un « code
  couleur » : à traduire en **langage de formes** (pointillés = contrôle, plein = dégâts…).
- Emblèmes d'Ère pour la Time Gate (aujourd'hui des icônes Lucide).
- Silhouettes dédiées des PNJ nommés (Erix, Gugus, Chevalier, Aemon, Maximus).
