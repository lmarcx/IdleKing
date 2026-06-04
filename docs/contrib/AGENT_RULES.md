# 🤖 Agent / Codex Usage Rules — IdleKing

> Règles de travail pour les agents IA (Claude / Codex / GPT) opérant sur ce dépôt.
> Extrait et conservé depuis l'ancien `AGENTS.md` (la partie « Agent System » obsolète a été
> archivée dans `docs/_legacy/AGENTS.md`). **Ces règles, elles, restent valides.**

## Token and server discipline

- Do not launch a dev server by default.
- Prefer static checks first:
  - `npm run typecheck`
  - `npm test`
  - `npm run build`
- Browser verification is optional and must only be used when the task specifically requires
  visual or runtime validation.
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

## Documentation authority (rappel)

Toute décision de design/contenu suit la hiérarchie officielle de
[`docs/30_new_direction/DOCUMENTATION_INDEX.md`](../30_new_direction/DOCUMENTATION_INDEX.md) :

```txt
LORE / SCRIPT → DESIGN_FREEZE_V1 → ART_BIBLES → GAME DESIGN DOCS
→ DATA_MODEL → IMPLEMENTATION_BIBLE → DATABASES → ASSETS → CODE
```

L'Implementation Bible décide **comment** implémenter, **jamais quoi** implémenter.
Ignorer entièrement `docs/_legacy/` (non canon).
