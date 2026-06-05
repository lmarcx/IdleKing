> ⚠️ **NON CANON — ARCHIVED DOCUMENT — DO NOT USE FOR IMPLEMENTATION**
>
> Archivé le 2026-06-04. Document issu de l'ancienne direction (Idle RPG / auto-combat),
> conservé pour l'historique et la traçabilité uniquement. Le canon vit dans
> `docs/30_new_direction/` — voir `DOCUMENTATION_INDEX.md`.

---
# 📈 XP SYSTEM — Idle King

Version : V1 (MVP)
Max Level : 50
World Max Level : 50
Ages : 5
Chapitres : 20 (4 par Age)

---

# 🟢 PLAYER XP

## Courbe

XP_to_next(L) = round( 60 * L^2.15 + 15 * 1.07^L )

L = level actuel (1 → 49)

XP total approximatif lvl 1 → 50 ≈ 100 000 XP

Objectifs temps :

- Level 10 ≈ 1h
- Level 25 ≈ 6h
- Level 50 ≈ 15h

---

## Bonus Level (secondaire endgame)

BaseStatsMultiplier(L) = 1 + (L-1) * 0.008

Level 50 → +39.2% stats BASE uniquement

Ne s'applique PAS aux :
- Equipements
- Buff buildings
- Bonus tier

---

# 🟡 SOURCES XP

Répartition cible :

- Histoire principale : 50%
- Donjons : 30%
- Quêtes répétables : 20%

---

## Histoire

20 chapitres
XP constante forte par chapitre

XP par chapitre = 2 500

Total histoire ≈ 50 000 XP

Récompense non répétable.

---

## Donjons

5 runs / jour
Durée moyenne : 3 minutes

XP par run = 2 500

En 12 runs ≈ 30 000 XP

---

## Quêtes répétables

20 quêtes / jour
400 XP par quête

≈ 8 000 XP / jour

---

# 🔵 WORLD XP (WXP)

## Conversion XP → WXP

WXP = floor(XP_gained * 0.10)

---

## Temple Production

TempleLevel max MVP = 5
1 niveau par Age

TempleRateWXP(min) = 10 * TempleLevel * (1 + 0.05 * (Age-1))

Ex :
Temple lvl 1 Age 1 → 10 WXP/min
Temple lvl 5 Age 5 → scaling progressif

---

## World XP Courbe

WXP_to_next(W) = round( 140 * W^2.2 * AgeCoeff(W) )

AgeCoeff :

Age 1 (W1–10) : 1.00
Age 2 (11–20) : 1.15
Age 3 (21–30) : 1.35
Age 4 (31–40) : 1.60
Age 5 (41–50) : 1.90

---

# 🟣 WORLD LEVEL EFFECTS

WorldLevel impacte :

- Difficulté globale
- ilvl max loot
- Multiplicateur rewards
- Déblocage contenu

---

## Loot Scaling

ilvlMax = 20 * WorldLevel

Cap système loot = 1000

---

## Reward Multiplier

RewardMult = 1 + 0.03 * (WorldLevel-1)

World 50 → x2.47 rewards

---

# 🔴 AGE SYSTEM

5 Ages
4 Chapitres par Age

AgeRankUp nécessite :

- WorldLevel requis
- Buildings requirements spécifiques

WorldLevelUp = uniquement WXP
