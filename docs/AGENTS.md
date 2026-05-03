# 🤖 AGENT SYSTEM — Idle King

## Vision

Les Agents représentent des entités autonomes dans le monde :
- Armées
- Défense du monde
- Workers (futur)
- Boss AI patterns

Ils doivent être :

- Déterministes
- Seed-based
- Sans dépendance UI
- Simulables offline

---

## Types d'Agents

### 1️⃣ Combat Agents
- Player (auto-attack)
- Boss
- Mobs
- Future summons

### 2️⃣ World Agents (Futur)
- Défense automatique
- Armée contre invasions
- Production passive

---

## Règles Fondamentales

- Aucun agent ne dépend d’un state global mutable.
- Toute décision doit pouvoir être rejouée via seed.
- Les agents sont purement fonctionnels (simulation first).

---

## Roadmap Agent

- [ ] Ajouter AI patterns boss avancés
- [ ] Ajouter invasion system
- [ ] Ajouter défense du monde

# Codex usage rules

## Token and server discipline

- Do not launch a dev server by default.
- Prefer static checks first:
  - npm run typecheck
  - npm test
  - npm run build
- Browser verification is optional and must only be used when the task specifically requires visual or runtime validation.
- Before starting a server, check whether one is already running.
- Never use random fallback ports silently.
- If a server is started, record:
  - command
  - port
  - PID if visible
  - whether it was stopped
- Stop temporary servers after verification.

## Preferred workflow

1. Inspect only the relevant files.
2. Make the smallest coherent change.
3. Run targeted tests first.
4. Run full build only when needed.
5. Summarize modified files, tests, risks, and next steps.

## Avoid

- Re-reading the whole repository.
- Running browser tests for pure logic changes.
- Starting multiple dev servers.
- Keeping servers alive after task completion.