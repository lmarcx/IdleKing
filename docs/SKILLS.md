# SKILL.md — Idle Dark Kingdom

## SKILL 1 — Combat Engine Builder

Input:
- Stats attacker/defender
- Skill data
- Config constants

Output:
- computeDamage()
- computeCrit()
- CombatScore()
- Tests unitaires

---

## SKILL 2 — Power System Generator

Input:
- WorldStats
- LoadoutStats
- Tier

Output:
- WorldPower
- LoadoutPower
- TotalPower

Respect:
- uncapped crit
- overflowRate = 0.50
- Tier multipliers

---

## SKILL 3 — Loot Generator

Input:
- ilvl
- tier
- rarity
- biome

Output:
- deterministic item
- 1 element per item
- ItemPower computed

---

## SKILL 4 — Upgrade Engine

Input:
- item
- upgradeLevel

Output:
- new stats
- kingamaCost
- new ItemPower

---

## SKILL 5 — Economy Balancer

Input:
- resource generation
- kingama sinks

Output:
- conversion ratios
- inflation prevention
- scaling curves

---

## SKILL 6 — Tier Progression Validator

Input:
- worldLevel
- playerPower

Output:
- recommended boss HP
- recommended ilvl
- breakpoints
