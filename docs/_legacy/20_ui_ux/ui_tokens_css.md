> ⚠️ **NON CANON — ARCHIVED DOCUMENT — DO NOT USE FOR IMPLEMENTATION**
>
> Archivé le 2026-06-04. Document issu de l'ancienne direction (Idle RPG / auto-combat),
> conservé pour l'historique et la traçabilité uniquement. Le canon vit dans
> `docs/30_new_direction/` — voir `DOCUMENTATION_INDEX.md`.

---
# UI TOKENS CSS — V1

But:
Centraliser couleurs, ombres, textures, radii et styles “signature”.

Usage:
- Variables CSS sous `:root`
- Classes utilitaires pour panels / boutons
- Compatible Tailwind (via `@layer base`)

---

## 1) Variables (source of truth)

### Couleurs
- Background: --ik-bg-0/1/2
- Metal: --ik-metal-0/1
- Gold: --ik-gold
- XP_GLOBAL: --ik-xp (vert)
- WXP: --ik-wxp (bleu)
- Danger: --ik-danger / --ik-danger-2

### Glows
- --ik-glow-xp
- --ik-glow-wxp
- --ik-glow-gold
- --ik-glow-cyan (Boto)

### Radii
- --ik-r-lg, --ik-r-xl

### Shadows
- --ik-shadow-panel
- --ik-shadow-press

---

## 2) Textures

Fantasy panels:
- `--ik-noise-opacity` = 0.06 (6%)
- overlay via pseudo-element `::before`

Boto:
- scanlines via `background-image: repeating-linear-gradient(...)`
- opacity très faible

---

## 3) Classes utilitaires (V1)

Fantasy:
- `.ik-relic-panel`
- `.ik-relic-panel--gold`
- `.ik-relic-panel--xp`
- `.ik-relic-panel--wxp`
- `.ik-runic-header`
- `.ik-runic-button` (+ variants)
- `.ik-medallion`

Boto:
- `.ik-holo-panel`
- `.ik-holo-button`

---

## 4) Intégration (Next/React)

Importer `ui-tokens.css` une fois:
- `src/app/globals.css` (Next app router) ou équivalent.

Puis utiliser les classes sur tes composants.