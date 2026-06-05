# RINGS → SKILLS MAP — IdleKing (MVP)

## Status

```txt
LOCKED
```

Livrable **P0** du `DESIGN_FREEZE_V1.md` (§4). Câble les **rings nommés** sur les **Skill IDs**
canoniques de `SKILL_DATABASE.md`, conformément à la décision **D-03** (rings = porteurs de skill ;
leurs anciens « effets » deviennent des **affixes/modificateurs**).

---

# 1. Règles (LOCKED)

```txt
1 Ring = 1 Active Skill (skillId obligatoire)
5 Ring Slots = 5 skills actifs max
Interdit : 2 rings portant la même Skill ID
Ring-scaling pur : la puissance de la skill vient du ring (rarity, ilvl, upgrade, affixes)
```

Un ring porte : `skillId`, `skillCategory`, `skillElement` (hérités du skill) **+** ses affixes.

---

# 2. Rings nommés → Skill ID (LOCKED)

| Ring nommé | Skill ID | Skill | Élément | Ancien « effet » → devient affixe |
|---|---|---|---|---|
| **Royal Beam Ring** | `SK-004` | Arcane Bolt | Neutral | beam width → `+projectile/beam width` |
| **King Aura Ring** | `SK-013` | Focus Field | Light | aura radius → `+AoE radius` |
| **War Cry Ring** | `SK-012` | War Cry | Neutral | buff duration → `+buff duration` |
| **Frost Ritual Ring** | `SK-003` | Frost Lance | Ice | frost buildup → `+freeze buildup` |
| **Spectral Ring** | `SK-015` | Spectral Hound | Dark | shadow sustain → `+sustain (lifesteal)` |

> Les « effets » résiduels sont des **affixes/modificateurs** appliqués sur le ring, pas des skills.
> Leurs valeurs = **DEFERRED (balancing)**.

---

# 3. Rings génériques (LOCKED)

- Un ring **non nommé** (loot/craft) peut porter **n'importe lequel** des 16 skills `SK-001 → SK-016`.
- La Skill ID est fixée à la génération de l'item (cf. `EQUIPMENT_GENERATION_DATABASE.md`).
- Les rings **ne génèrent pas de Résonance** (cf. Freeze §8).

---

# 4. Skill IDs de référence (SKILL_DATABASE.md)

```txt
SK-001 Shadow Slash (Dark, Cone)      SK-009 Ice Barrier (Ice, Self)
SK-002 Flame Burst (Fire, Ground)     SK-010 Light Ward (Light, Self)
SK-003 Frost Lance (Ice, Line)        SK-011 Guard Pulse (Ground, AoE)
SK-004 Arcane Bolt (Neutral, FreeAim) SK-012 War Cry (Neutral, Self)
SK-005 Water Surge (Water, Line)      SK-013 Focus Field (Light, AoE)
SK-006 Shadow Step (Dark, Move)       SK-014 Soul Mark (Dark, Enemy)
SK-007 Wind Leap (Wind, Move)         SK-015 Spectral Hound (Dark, Summon)
SK-008 Frost Dash (Ice, Move)         SK-016 Frozen Wisp (Ice, Summon)
```

---

# 5. Open (balancing)

```txt
- valeurs des affixes résiduels (beam width, aura radius, buff duration, freeze buildup, sustain)
- pools d'affixes spécifiques aux rings
- distribution des skillId sur les rings génériques (drop/craft)
```
