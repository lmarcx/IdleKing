# Déploiement — IdleKing

Jeu **Next.js 15** (App Router, 100 % client-side) dans un monorepo npm workspaces.
Hébergeur : **Vercel** (tier Hobby gratuit). CI : **GitHub Actions** (garde-fou qualité).

## Architecture du déploiement

```
push / PR ──> GitHub Actions (.github/workflows/ci.yml)   [garde-fou : typecheck + build]
         └──> Vercel (intégration Git)                     [build + déploiement auto]
                ├─ push sur main   ->  déploiement Production
                └─ PR / autre push ->  déploiement Preview (URL unique par PR)
```

Le package `@idleking/game-core` est compilé en `dist/` (non commité). Il est donc
rebuildé avant `next build`, à la fois :
- en CI : step « Build game-core » ;
- sur Vercel : via `buildCommand` dans [`apps/web/vercel.json`](apps/web/vercel.json).

## Mise en place Vercel (une seule fois, manuel)

1. Crée un compte sur https://vercel.com (connecte-toi avec GitHub).
2. **Add New… → Project** → importe le repo `lmarcx/IdleKing`.
3. Dans la config du projet, règle :
   - **Root Directory** = `apps/web` ← important (le monorepo).
     Vercel détecte tout seul le lockfile à la racine et installe les workspaces.
   - **Framework Preset** = Next.js (auto-détecté).
   - **Build Command** : laisse vide → Vercel lit `apps/web/vercel.json`
     (qui builde game-core puis lance `next build`).
4. **Environment Variables** → ajoute pour *Production* et *Preview* :
   - `NEXT_PUBLIC_DEV_MODE` = `false`
5. **Deploy**. Vercel donne une URL `https://idleking-xxx.vercel.app`.

Ensuite, chaque `git push` redéploie automatiquement (Production sur `main`,
Preview sur les autres branches/PR). Rien d'autre à faire.

## Tester le build en local (identique à la CI)

```bash
npm ci
npm run build --workspace=@idleking/game-core   # compile game-core -> dist/
npm run typecheck                               # game-core + web
npm run build --workspace=@idleking/web         # next build
```

## Notes

- Les assets (`apps/web/public/assets`, ~27 Mo) sont référencés en chemins absolus
  `/assets/...`. Vercel sert à la racine du domaine → ils fonctionnent sans modif.
  (C'est aussi pourquoi GitHub Pages, servi sous `/IdleKing/`, n'a pas été retenu.)
- Deux routes sont dynamiques (`/game/story/levels/[levelId]`,
  `/game/worlds/duel/[duelId]`) → rendues à la demande par Vercel. Un export
  statique pur nécessiterait `generateStaticParams` ; inutile ici.
