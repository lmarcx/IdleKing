# UI COMPONENTS — V1 (MVP)

But:
Définir les composants “signature” et les patterns réutilisables pour que toute l’UI ait une identité RPG cohérente, tout en restant lisible (MVP).

Scope:
- Fantasy (Royaume / systèmes)
- Boto (Cosmic Holo)
- Layout 3 colonnes constant

Non-scope (V1):
- Animations lourdes / particules complexes
- Custom icons finales (placeholder ok)
- Responsive complet (HUD collapsible plus tard)

---

# 1) Design Tokens (référence)

Source de vérité: `ui_styleguide_v1.md`

- XP_GLOBAL = vert
- WXP = bleu
- Or royal = accent noble
- Texture = noise léger sur panels fantasy
- Boto = néon holo, scanlines légères

---

# 2) Structure principale

## 2.1 `GameLayout`

Responsabilité:
- Rendre le layout constant (LeftNav / MainWindow / RightHud)
- Afficher le header global (sigil + titre + zone)
- Fournir slots pour contenu central

Props (suggestion):
- `activeTab: GameTabId`
- `onNavigate(tab: GameTabId): void`
- `header?: { title: string; subtitle?: string; sigil?: ReactNode }`

Slots:
- `left`: LeftNav
- `main`: MainWindow (screen content)
- `right`: RightHud

Règles V1:
- Ne jamais faire disparaître RightHud sur desktop
- MainWindow = max 3 panels majeurs visibles simultanément

---

## 2.2 `LeftNav`

Responsabilité:
- Navigation principale (grimoire métal)
- État actif + badges

Data:
`NavItem { id, label, icon, href, badge? }`

Composants:
- `NavSectionTitle` (optionnel)
- `NavItemButton` (fantasy style)
- `NavBadge` (sceau / point)

Règles:
- Active = plaque dorée + glow discret
- Disabled/WIP (Skills) = label “WIP” + opacité

---

## 2.3 `RightHud`

Responsabilité:
- HUD toujours visible: Progression / Villageois / Ressources
- Scroll interne uniquement sur “Ressources” si besoin

Sections V1:
- `ProgressPanel`
- `VillagersPanel`
- `ResourcesPanel`

---

# 3) Composants Signature — Fantasy

## 3.1 `RelicPanel`

But:
Panel “reliquaire” métal + noise (signature dark fantasy).

Slots:
- `header` (optionnel)
- `body`
- `footer` (actions)

Variants:
- `default`
- `accentGold` (Forum / actions nobles)
- `accentGreen` (Temple / XP_GLOBAL)
- `accentBlue` (World/WXP)

Règles:
- Le noise est subtil (4–8%)
- Les bordures restent sobres (MVP lisible)

---

## 3.2 `RunicHeader`

But:
Header d’écran (zone/title/subtitle) qui transforme un écran “web” en écran “RPG menu”.

Props:
- `title`
- `subtitle?`
- `sigil?` (icône décorative)
- `rightActions?` (ex: toggle active, bouton primaire)

Règle:
- Chaque écran central commence par un RunicHeader.

---

## 3.3 `RunicButton`

But:
Bouton “plaque” métal, relief discret.

Variants:
- `primary` (or royal)
- `secondary` (acier)
- `danger` (rouge)
- `ghost` (minimal)

States:
- `disabledReason?: string` (UI affiche un tooltip ou un texte sous bouton)

Règle:
- Toute action impossible doit exposer une raison lisible (pas juste disabled).

---

## 3.4 `MedallionStat`

But:
Médaille circulaire de progression (Player / World).

Props:
- `label` (Player / World)
- `level: number`
- `value: number`
- `max: number`
- `color: 'green' | 'blue'`
- `hint?: string` (ex: "WXP bank")

Rendu:
- Anneau progress
- Level centré
- Small label

Règles:
- Player = vert (XP_GLOBAL/XP)
- World = bleu (WXP)
- Pulse (léger) seulement si “action disponible” (ex: rank up possible)

---

## 3.5 `ResourceRow`

But:
Afficher une ressource dans le HUD.

Props:
- `icon`
- `name`
- `qty`
- `delta?` (optionnel, offline summary)

Règles:
- Quantités alignées à droite
- Delta discret (vert) / (rouge si perte)

---

## 3.6 `StaminaBar`

But:
Barre stamina globale (HUD) et stamina individuelle (Forum list).

Variants:
- `global`
- `villager`

Règles:
- <30% = teinte danger (sans agresser l’œil)
- Toujours afficher la valeur numérique au hover ou en label secondaire.

---

# 4) Composants Signature — Boto (Cosmic)

## 4.1 `HoloPanel`

But:
Panel holo (néon, transparent) réservé à Boto.

Variants:
- `default`
- `warning` (glitch léger, pas rouge fantasy)
- `success` (pulse cyan)

Règles:
- Pas de métal, pas de runes, pas de noise fantasy
- Scanlines très subtiles (2–5%)

---

## 4.2 `BotoPortraitHumanoid`

But:
Afficher le robot humanoïde stylisé (illustration/placeholder).

Props:
- `mood: 'neutral' | 'happy' | 'serious' | 'alert'` (V1: optionnel)

Règles:
- Silhouette humanoïde, masque lisse, yeux néon
- Effet hologramme (gradient + opacité + glow)

---

## 4.3 `DialogueWindow`

But:
Zone texte de dialogue Boto.

Props:
- `messages: { speaker: 'BOTO' | 'PLAYER'; text: string }[]`
- `maxHeight` (scroll)

Règles:
- Texte très lisible
- Speaker marqué par un tag néon

---

## 4.4 `DialogueChoices`

But:
1 à 4 choix max, boutons holo.

Props:
- `choices: { id; label; locked?: boolean; reason?: string }[]`
- `onChoose(id)`

Règles:
- Locked = désactivé + reason visible
- Toujours 1 option neutre (ex: “Plus tard.”)

---

# 5) Écrans MVP — mapping vers composants

## 5.1 Start Screen
- Hors scope GameLayout
- Utilise: `RelicPanel`, `RunicButton`

## 5.2 Boto Screen
- `RunicHeader` (titre "Boto")
- `HoloPanel` + `BotoPortraitHumanoid` + `DialogueWindow` + `DialogueChoices`

## 5.3 Kingdom Overview
- `RunicHeader`
- Grid de `BuildingCard` (spécifique)
- Chaque card = `RelicPanel` variant (locked/unlocked/built/active)

## 5.4 Forum
- `RunicHeader`
- 3 panels:
  - `RelicPanel accentBlue` (Rank Up World)
  - `RelicPanel` (Recruit)
  - `RelicPanel` (Rest + list)

## 5.5 Farm/Mine/Temple (Allocation)
- `RunicHeader`
- `RelicPanel` pour table
- `RunicButton` actions
- `ProductionPreview` (spécifique)

## 5.6 Kitchen / Forge
- `RunicHeader`
- `RelicPanel` + listes (RecipeCard / ItemCard)
- `RunicButton`

---

# 6) Modals / Feedback

## 6.1 `OfflineSummaryModal`
- `RelicPanel` + list top gains + stamina spent
- Bouton “OK”

## 6.2 `ConfirmModal`
- Pour clear save / new game

## 6.3 `ToastRPG`
- success / error / info
- Style fantasy (or/vert/bleu) selon contexte

Règle:
- Toutes les actions importantes doivent déclencher un feedback (toast).