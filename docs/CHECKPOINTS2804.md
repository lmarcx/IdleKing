# Checkpoint Idle King

## 1. Layout Global

- Mise en place d’un layout game plus travaillé pour les pages :
  - Boto
  - Character
  - Inventory
  - Worlds
  - Kingdom
  - Skills
  - Settings
- Création/utilisation d’un composant réutilisable de panel :
  - `apps/web/components/ui/game-panel.tsx`
- Ajout de variantes de panel :
  - `default`
  - `ornate`
  - `terminal`
  - `character`
- Ajout d’un asset de bordure 9-slice :
  - `apps/web/public/assets/ui/panel-border.png`
- Ajout d’un background global dark fantasy/cosmic :
  - `apps/web/public/assets/ui/game-background.svg` ou équivalent selon l’état actuel
- Navigation gauche :
  - le panneau navigation ne prend plus toute la hauteur
  - le panneau Progression joueur est placé sous la navigation
- Progression déplacée depuis la colonne droite vers la gauche :
  - Player Lvl
  - Player XP
  - World Lvl
  - World WXP
- Colonne droite simplifiée :
  - Villagers
  - Resources
- Le panneau Resources conserve toutes les ressources et leur ordre.

Fichiers principaux concernés :
- `apps/web/components/game/game-shell.tsx`
- `apps/web/components/game/navigation-panel.tsx`
- `apps/web/components/game/right-sidebar.tsx`
- `apps/web/components/game/resource-panel.tsx`
- `apps/web/components/game/progression-panel.tsx`
- `apps/web/components/ui/game-panel.tsx`
- `apps/web/app/globals.css`
- `apps/web/styles/ui-tokens.css`

## 2. Kingdom

- Création d’une structure de données front pour les buildings Kingdom.
- Ajout d’une grille responsive de cards buildings.
- Chaque card affiche :
  - image
  - titre
  - description courte
  - statut
  - bouton `Ouvrir`
- Ajout d’une modale building avec :
  - titre
  - image
  - description
  - statut
  - fonction principale / production
  - actions disponibles ou boutons disabled si non branchés
- Assets buildings :
  - passage par spritesheet d’abord
  - puis remplacement par images séparées nettoyées
- Assets concernés :
  - `apps/web/public/assets/kingdom/forum.png`
  - `apps/web/public/assets/kingdom/farm.png`
  - `apps/web/public/assets/kingdom/mine.png`
  - `apps/web/public/assets/kingdom/temple.png`
  - `apps/web/public/assets/kingdom/kitchen.png`
  - `apps/web/public/assets/kingdom/forge.png`
  - `apps/web/public/assets/kingdom/cornucopia.png`
- Création/utilisation de `BuildingSprite` :
  - `apps/web/components/kingdom/building-sprite.tsx`
- Cornucopia :
  - feedback animé de gain manuel ajouté si présent dans l’état actuel
  - pop `+X` avec icône ressource
  - animation via `framer-motion`
  - montant basé sur le retour réel de l’action, pas hardcodé
- Ressources :
  - ajout d’icônes dans `apps/web/public/assets/resources/`
  - mapping TypeScript `resourceId -> assetPath`
  - affichage dans le panel Resources avec fallback

Fichiers principaux concernés :
- `apps/web/app/game/kingdom/page.tsx`
- `apps/web/components/kingdom/building-card.tsx`
- `apps/web/components/kingdom/building-modal.tsx`
- `apps/web/components/kingdom/building-sprite.tsx`
- `apps/web/lib/resource-assets.ts`
- `apps/web/components/game/resource-panel.tsx`
- `apps/web/components/game/resource-gain-popup-layer.tsx`
- `apps/web/components/game/resource-gain-popup.tsx`
- `apps/web/store/game-store.ts`

## 3. Boto

- Rework visuel du menu Boto en style companion robot.
- Remplacement de l’avatar placeholder par un panneau robot :
  - Boto Unit
  - statut link established
  - signal stable
  - origin Rift Layer C
- Ajout d’un asset placeholder robot :
  - `apps/web/public/assets/boto/boto-head.svg` ou `.png`
- Dialogues transformés en style terminal Matrix :
  - fond sombre
  - texte vert terminal
  - préfixes `> BOTO` et `> ROI`
  - curseur clignotant
  - scanlines discrètes
- Boutons conservés :
  - Ouvrir le Royaume
  - Pourquoi moi ?
  - Analyser les ressources
  - Mode veille
- Style boutons adapté HUD/terminal.
- Limites actuelles :
  - pas encore de vraie logique de scripts avancés
  - interactions Boto encore simples
  - asset robot temporaire/remplaçable

Fichiers principaux concernés :
- `apps/web/app/game/boto/page.tsx`
- `apps/web/components/game/boto/boto-unit.tsx`
- `apps/web/components/game/boto/terminal-dialogue.tsx`
- `apps/web/components/game/boto/boto-actions.tsx`
- `apps/web/public/assets/boto/boto-head.svg`

## 4. Inventory

- Suppression des deux panneaux du haut :
  - Equipment
  - Resources
- Suppression du dédoublement visuel `Inventory dans Inventory`.
- Conservation d’une seule grande fenêtre Inventory.
- Ajout d’une toolbar :
  - recherche texte
  - filtre catégorie
  - tri
- Catégories :
  - Toutes
  - Equipment
  - Resources
  - Consumables
  - Unique
  - Materials si pertinent
- Tris :
  - quantité croissante/décroissante
  - valeur croissante/décroissante
  - A-Z / Z-A
- Affichage remplacé par grille compacte d’icônes :
  - slot carré
  - icône centrée
  - quantité en badge
  - hover/focus léger
- Tooltip Inventory rendu via portal `document.body` :
  - position `fixed`
  - évite les coupures par les panels
  - repositionnement selon bords viewport
  - support hover/focus
- Logique game-core ajoutée :
  - modèle `InventoryDisplayItem`
  - helper `getInventoryDisplayItems`
  - helper `filterAndSortInventoryItems`

Fichiers principaux concernés :
- `apps/web/app/game/inventory/page.tsx`
- `apps/web/components/game/inventory/inventory-toolbar.tsx`
- `apps/web/components/game/inventory/inventory-slot.tsx`
- `apps/web/components/game/inventory/inventory-item-tooltip.tsx`
- `packages/game-core/items/display.ts`
- `packages/game-core/items/index.ts`
- `packages/game-core/index.ts`

## 5. Character

- Rework page Character en trois zones :
  - gauche : Character Stats
  - centre : Equipment Doll
  - droite : Available Equipment
- Bordures internes Character plus sobres via variante dédiée :
  - `GamePanel variant="character"`
- Création/remplacement du personnage placeholder Roi :
  - `apps/web/public/assets/character/character-placeholder.svg`
- Equipment Doll :
  - personnage centré
  - suppression du halo/ellipse
  - slots rangés en 3 colonnes :
    - gauche Armor : helmet, chest, gloves, belt, boots
    - centre : personnage Roi
    - droite Accessories : weapon, offhand, necklace, ring, artifact
- Slots plus petits :
  - icône placeholder centrée
  - bordure discrète
  - hover/focus
- Fake equipment frontend uniquement :
  - au moins 10 équipements fictifs
  - un par slot
  - raretés : common, uncommon, rare, epic, legendary
  - icône, item level, value, stats, description
- Available Equipment :
  - grille compacte d’icônes
  - bordure selon rareté
  - badge/état `Équipé`
  - tooltip/popover avec bouton `Équiper` ou `Déséquiper`
- Équipement/déséquipement :
  - état local React uniquement
  - non persisté
  - ne touche pas `game-core`
- Stats calculées localement :
  - POWER
  - HP
  - ATK
  - DEF
- Règle temporaire POWER :
  - somme `power` si présent
  - sinon formule dérivée `atk * 2 + def * 1.5 + hp * 0.2`

Fichiers principaux concernés :
- `apps/web/app/game/character/page.tsx`
- `apps/web/components/game/character/character-stats-panel.tsx`
- `apps/web/components/game/character/equipment-doll.tsx`
- `apps/web/components/game/character/equipment-slot.tsx`
- `apps/web/components/game/character/available-equipment-panel.tsx`
- `apps/web/components/game/character/equipment-tooltip.tsx`
- `apps/web/components/game/character/fake-equipment.ts`
- `apps/web/public/assets/character/character-placeholder.svg`
- `apps/web/public/assets/equipment-slots/*.svg`
- `apps/web/public/assets/equipment-items/*.svg`

## 6. Worlds / Story

### Worlds

- Rework de la page Worlds.
- Remplacement des anciens panneaux :
  - Original Timeline
  - Alternative Timeline
- Nouveau menu triangle :
  - Story
  - Expeditions
  - Duel
- Style dark fantasy / cosmic :
  - lignes fines
  - glow léger
  - ambiance constellation / portail
- Assets créés :
  - `apps/web/public/assets/worlds/story.svg`
  - `apps/web/public/assets/worlds/expeditions.svg`
  - `apps/web/public/assets/worlds/duel.svg`
- Composants :
  - `apps/web/components/game/worlds/world-mode-triangle.tsx`
  - `apps/web/components/game/worlds/world-mode-node.tsx`

### Story Core

- Refactor conceptuel côté `game-core` :
  - Chapter = Zone narrative
  - Chapter contient plusieurs `StoryLevel`
  - StoryLevel contient des `StoryEvents` internes
  - les events ne sont pas exposés côté front
- `CHAPTERS` conservé.
- Anciens helpers chapters conservés.
- `StoryState` étendu :
  - `completedLevels`
  - `discoveredEvents`
  - `completedEvents`
- Ajout des types :
  - `StoryLevelKind`
  - `StoryLevelStatus`
  - `StoryEventType`
  - `StoryEventVisibility`
  - `StoryEventDef`
  - `StoryLevelDef`
- Ajout des niveaux Story :
  - Chapitre 1 : Terres Désolées
  - Chapitre 2 : Tundra Oubliée
  - Chapitre 3 : Empire Nébuleux
  - Chapitre 4 : Temps des Dieux
- Helpers ajoutés :
  - `getStoryLevelsForChapter`
  - `getStoryLevelDef`
  - `isStoryLevelCompleted`
  - `isStoryLevelAvailable`
  - `getStoryLevelStatus`
  - `completeStoryLevel`
  - `getVisibleStoryChaptersWithLevels`

Fichiers principaux concernés :
- `packages/game-core/story/types.ts`
- `packages/game-core/story/state.ts`
- `packages/game-core/story/levels.ts`
- `packages/game-core/story/index.ts`
- `packages/game-core/index.ts`

### Story Front

- Page Story / Original World implémentée :
  - `apps/web/app/game/worlds/original/page.tsx`
- Affiche uniquement :
  - zones / chapitres
  - niveaux
  - type standard/spécial
  - recommendedPower
  - statut
- N’affiche pas les `StoryEvents`.
- Anti-spoil :
  - pas de contenu interne des events
  - descriptions publiques courtes et non-spoilantes
- Action provisoire :
  - bouton `Explorer` marque actuellement un niveau comme completed via `completeStoryLevel`
  - exploration réelle non implémentée
- Imports/exports corrigés récemment :
  - `packages/game-core/story/index.ts` exporte `./levels`
  - `packages/game-core/index.ts` exporte explicitement :
    - `completeStoryLevel`
    - `getVisibleStoryChaptersWithLevels`
    - types publics nécessaires
  - la page Story importe désormais depuis :
    - `@idleking/game-core`

## 7. Points de Vigilance

- Imports `.js` vs sans extension :
  - certains fichiers `game-core` utilisent encore des imports avec `.js`
  - Next compile parfois les sources TS du workspace et peut échouer sur certains imports `.js`
  - `packages/game-core/story/levels.ts` a déjà été corrigé avec imports locaux sans extension
- Exports publics `game-core` :
  - attention aux subpaths comme `@idleking/game-core/story`
  - workaround actuel : passer par `@idleking/game-core`
  - vérifier régulièrement `packages/game-core/index.ts`
- Dist stale :
  - `packages/game-core/package.json` pointe certains exports vers `dist`
  - si `dist` n’est pas reconstruit, les exports runtime peuvent être en retard
- Tests :
  - certains tests peuvent être cassés ou à ajuster après extension de `StoryState`
  - fichier ouvert côté IDE : `packages/game-core/__tests__/cornucopia.test.ts`
- Fake data frontend :
  - Character equipment est volontairement fake/local
  - non persisté
  - pas relié au vrai inventory/core
- Story :
  - action `Explorer = completeStoryLevel` est provisoire
  - ne représente pas une vraie exploration
  - les events internes doivent rester cachés côté UI
- Assets :
  - plusieurs assets sont placeholders SVG/PNG
  - prévoir remplacement par assets finalisés
- UI :
  - bordures ornées à harmoniser
  - certaines variantes peuvent être visuellement trop chargées selon les pages

## 8. Pistes d’Amélioration

- Implémenter une vraie exploration StoryLevel :
  - entrée dans un niveau
  - progression interne
  - découverte graduelle des events
  - récompenses
- Ajouter système `StoryEvent` réel :
  - hidden / discovered / completed
  - sans spoil UI
  - intégration Boto/dialogues
- Améliorer Boto :
  - scripts de dialogue
  - réactions au contexte
  - progression narrative
  - état mémoire / relation
- Déplacer l’équipement Character vers `game-core` :
  - vrais types equipment
  - inventory réel
  - equip/unequip actions
  - stats calculées core
- Ajouter persistence :
  - équipements
  - story levels completed
  - discovered events
  - préférences UI
- Finaliser assets :
  - buildings
  - ressources
  - character
  - equipment
  - Boto
  - Worlds modes
- Harmoniser les panels :
  - ornate vs character vs terminal
  - épaisseur des bordures
  - glow
  - lisibilité
- Tests à ajouter/maintenir :
  - StoryLevel availability
  - completeStoryLevel
  - Inventory filtering/sorting
  - Cornucopia gain payload
  - resource popup amount réel
  - Character stats quand logique migrée vers core