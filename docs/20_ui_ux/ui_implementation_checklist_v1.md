# UI IMPLEMENTATION CHECKLIST — V1 (MVP)

Objectif:
Transformer l’UI actuelle “dashboard” en UI “RPG reliquaire” + Boto “cosmic holo”, sans exploser le scope.

Priorité:
Lisibilité MVP > décorations.

---

# Phase 0 — Préparation (fondations)

[ ] Créer `ui/` (ou `components/ui/`) pour les composants signature
[ ] Définir les tokens CSS (couleurs + radii + shadows + typography) selon `ui_styleguide_v1.md`
[ ] Ajouter support “tabular nums” global (pour quantités)
[ ] Ajouter une utilitaire `cn()` si pas déjà présent
[ ] Définir une couche “texture noise” (1 asset PNG/SVG ou CSS noise) + overlay commun

Critères d’acceptation:
- Les couleurs XP/WXP/or sont centralisées
- La texture peut être appliquée à un panel via 1 classe

---

# Phase 1 — Composants Signature Fantasy

[ ] `RelicPanel` (avec header/body/footer, overlay noise)
[ ] `RunicHeader` (title/subtitle/sigil/rightActions)
[ ] `RunicButton` (primary/secondary/danger/ghost + disabledReason)
[ ] `MedallionStat` (anneau progress simple + label + lvl)
[ ] `ResourceRow` (icône + label + qty alignée droite)
[ ] `StaminaBar` (global + villager)

Critères d’acceptation:
- Remplacer au moins 30% des “cards” existantes par `RelicPanel`
- Tous les boutons d’action passent par `RunicButton`
- HUD affiche 2 Medallions propres (Player/World)

---

# Phase 2 — Right HUD refonte (impact fort)

[ ] Refaire `RightHud` en 3 sections:
    - Progress (2 medallions)
    - Villagers (stamina globale + counts)
    - Resources (liste scroll + catégories)
[ ] Ajouter “WXP bank -> prochain rank” en progress bar (dans World medallion ou sous-ligne)
[ ] Afficher XP_GLOBAL en vert (row dédiée)

Critères d’acceptation:
- HUD lisible en 2 secondes
- XP_GLOBAL vert + WXP bleu immédiatement identifiables

---

# Phase 3 — LeftNav grimoire (identité)

[ ] Refaire `LeftNav`:
    - état actif plaque dorée
    - badges (sceau/point)
    - Skills WIP visible
[ ] Ajouter un petit “Sigil Royal” en haut (World Level ou Age)

Critères d’acceptation:
- Navigation “jeu”, pas web
- Onglet actif évident sans être criard

---

# Phase 4 — Boto Cosmic Holo (contraste narratif)

[ ] `HoloPanel` (scanlines + glow)
[ ] `BotoPortraitHumanoid` (placeholder stylisé holo)
[ ] `DialogueWindow` (messages)
[ ] `DialogueChoices` (1–4 holo buttons)
[ ] Mettre `/game/boto` en style 100% holo (pas de metal/runes/noise fantasy)

Critères d’acceptation:
- Boto est visuellement dans “un autre monde”
- Choix lisibles, 1 option neutre toujours

---

# Phase 5 — Écrans clés (Royaume & Forum d’abord)

[ ] `/game/kingdom` grid building cards:
    - states locked/unlocked/built/active
    - actions via RunicButton
[ ] `/game/kingdom/forum`:
    - panel Rank Up World (accentBlue)
    - Recruit (costs)
    - Rest + villager list (stamina bars)
[ ] `/game/kingdom/temple`:
    - identité XP_GLOBAL (accentGreen + orbe simple)

Critères d’acceptation:
- Forum et Temple “vendent” le jeu (wow simple)
- Disabled reasons affichées pour RankUp/Build/Recrut

---

# Phase 6 — Feedback & Modals (MVP polish)

[ ] `ToastRPG` (success/error/info)
[ ] `OfflineSummaryModal` (top gains + stamina)
[ ] `ConfirmModal` (clear save/new game)

Critères d’acceptation:
- Chaque action importante = toast
- Offline summary agréable et “jeu”

---

# Définition of Done (V1 UI)

- Layout 3 colonnes stable
- Identité dark fantasy sur tous les écrans (hors Boto)
- Boto cosmic holo humanoïde (contraste clair)
- XP_GLOBAL vert, WXP bleu partout
- Texture subtile sur panels fantasy
- Actions impossibles = disabled + reason