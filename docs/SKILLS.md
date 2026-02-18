# ⚔️ SKILL SYSTEM — Idle King

## Design Philosophy

Les skills ne doivent PAS :
- Casser l’auto combat
- Créer du micro management

Elles doivent :
- Introduire de la profondeur
- Ajouter des pics de burst
- Créer des fenêtres stratégiques

---

## Skill Model

Chaque skill possède :

- Stamina cost
- Cooldown
- Damage multiplier
- Optional effect

Exemple :

```ts
type Skill = {
  id: string
  staminaCost: number
  cooldown: number
  damageMultiplier: number
  effect?: SkillEffect
}
```

## Types de Skills (MVP)

- Direct Damage

- DOT

- Buff temporaire

- Stamina regen

- Crit boost

## Long Term

- Skill trees

- World-synergy skills

- Legendary unique effects