> ⚠️ **NON CANON — ARCHIVED DOCUMENT — DO NOT USE FOR IMPLEMENTATION**
>
> Archivé le 2026-06-04. Document issu de l'ancienne direction (Idle RPG / auto-combat),
> conservé pour l'historique et la traçabilité uniquement. Le canon vit dans
> `docs/30_new_direction/` — voir `DOCUMENTATION_INDEX.md`.

---
# UI STYLEGUIDE V1 — Idle King

Version: MVP
Direction artistique:
- Monde: Dark Fantasy reliquaire métallique
- Boto: Cosmic holographique humanoïde
- Ton: Ascension royale héroïque
- Univers: Rift cosmique corrompant le monde

---

# 1. PRINCIPES FONDATEURS

1. Lisibilité > Décoration
2. Identité forte mais sobre
3. Dualité visuelle volontaire:
   - Royaume = ancien, métal, runes
   - Boto = extérieur, néon, cosmique

---

# 2. PALETTE OFFICIELLE

## Fond global
#0D1117
#141A22
#1B222C

## Métal
#2C323C
#3A424F

## Or royal
#C6A85B

## XP_GLOBAL (Énergie universelle)
#1AFF7A
Hover: #0ED760
Glow: rgba(26,255,122,0.4)

## WXP (Énergie du monde)
#2DA8FF
Hover: #0F8CFF
Glow: rgba(45,168,255,0.35)

## Danger
#7B1E1E
#B83232

---

# 3. TEXTURE

Tous les panels fantasy utilisent:
- Overlay noise 4–8% opacity
- Grain fin
- Aucun pattern visible

Fond global:
- vignette légère (optionnelle)

Boto:
- scanlines 2–5%
- micro bruit numérique
- glow néon

---

# 4. TYPOGRAPHIE

Titres:
- Serif fantasy lisible
- uppercase partiel
- letter-spacing léger

Corps:
- Sans-serif moderne
- Tabular numbers activé

---

# 5. PANELS

## Fantasy Panel (RelicPanel)
- fond: #141A22
- bordure: #3A424F
- coins légèrement décorés
- shadow interne subtile

## Holographic Panel (HoloPanel)
- fond noir pur
- bordure cyan néon
- glow externe léger

---

# 6. BOUTONS

## RunicButton (fantasy)
- plaque métallique
- relief subtil
- hover glow or ou énergie
- disabled = fissure + opacité 60%

## HoloButton (Boto)
- outline néon
- hover fill 15%
- glow cyan

---

# 7. ÉTATS VISUELS

Locked:
- désaturation
- chaînes overlay

Built:
- bordure dorée

Active:
- aura légère verte

Rank Up disponible:
- pulse bleu

---

# 8. MÉDAILLONS PROGRESSION

Player:
- anneau vert XP
- niveau centré

World:
- anneau bleu WXP
- rune centrale
- pulse si seuil atteint