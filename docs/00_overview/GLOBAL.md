## 0) Socle repo & tooling

* [ ] Monorepo stable (packages séparés : `game-core`, `ui`, `server` si besoin)
* [ ] Build/CI (lint, typecheck, tests node)
* [ ] Convention versions + changelog
* [ ] Seed data + fixtures (recettes, chapitres, buildings)

---

## 1) Game Core (moteur)

### State & tick

* [x] GameState + immutabilité
* [x] Tick 1/min
* [x] Registry buildings + logs/debug
* [x] Ressources typées + helpers (add/spend/has)

### Progression

* [x] XP_GLOBAL (monnaie universelle)
* [x] Allocation XP_GLOBAL → PlayerXP / WorldWXP
* [x] WXP banked + rank up manuel
* [ ] Player level effets (bonus base stats) raccordés à combat (si pas encore fait)
* [ ] “Sinks” XP_GLOBAL futurs : skills/buildings ranks/kingamas

### Villageois & stamina

* [x] Stamina individuelle + drain par production
* [ ] Regen via bâtiment/service (Forum ou autre)
* [ ] Outils de gestion : assignation fine / presets / rotations (plus tard)

### Contenu & systèmes

* [x] Chapitres/unlocks linéaires MVP
* [x] Forum skeleton + rank up world
* [x] Farm/Mine production (Age-gated + tests)
* [ ] Kitchen (craft manuel)
* [ ] Forge (craft/upgrade/recycle) + inventaire
* [ ] Donjons (plus tard) : runs, stamina/energy, loot tables
* [ ] Quêtes répétables (plus tard) : objectifs, rewards

### Tests

* [x] Tests core (tick, allocation, forum rank up)
* [ ] Coverage des actions craft/forge/kitchen
* [ ] Tests “no soft-lock” stamina + regen

---

## 2) UI/UX (front)

### App shell

* [ ] Routing (home, game, settings)
* [ ] Layout responsive (desktop-first ok)
* [ ] Accessibilité minimum (focus, aria)

### Écrans MVP

* [ ] **Game HUD** : ressources, XP_GLOBAL, player/world level, WXP bank
* [ ] **Villageois panel** : liste, stamina, assignations (par bâtiment/ressource)
* [ ] **Buildings screen** :

  * [ ] Forum (rank up world, plus tard rank up age)
  * [ ] Farm/Mine allocations (UI simple)
  * [ ] Temple allocation XP_GLOBAL
* [ ] **Story screen** : chapitre courant, boutons “continuer” (click narrative)
* [ ] **Kitchen screen** : liste recettes, choix villager, craft
* [ ] **Forge screen** : craft item, upgrade, recycle + inventaire
* [ ] **Debug panel** (dev only) : tick +60min, give resources, set world level

### UX important

* [ ] Tooltips (coûts, stamina drain, why disabled)
* [ ] Preview “production/min” par bâtiment
* [ ] Gestion erreurs : toasts (pas assez ressources, villager épuisé, etc.)

---

## 3) Database & persistence

### Choix structure (MVP)

* [ ] Identifier le storage : local-only d’abord ou cloud (Supabase) ?

  * **MVP rapide** : localStorage + export/import JSON
  * **MVP online** : Supabase + table `saves`

### Modèle de données conseillé

* [ ] `users` (auth)
* [ ] `saves` :

  * [ ] `user_id`
  * [ ] `slot`
  * [ ] `state_json` (GameState sérialisé)
  * [ ] `updated_at`
  * [ ] `version` (migration)
* [ ] (Optionnel) `events` (audit / analytics / anti-cheat léger)

### Migrations & versioning

* [ ] Versionner `GameState` (`schemaVersion`)
* [ ] Migrations de saves (upgrade/downgrade safe)
* [ ] RLS/policies si Supabase

---

## 4) Backend / API (si online)

* [ ] Endpoints :

  * [ ] `GET /save` (load)
  * [ ] `POST /save` (save)
  * [ ] `POST /tick` (si tick server-side, optionnel)
* [ ] Auth (session)
* [ ] Rate limit / anti-spam (simple)
* [ ] Validation server (zod) si on ne fait pas confiance au client

> Important : tu peux garder **tout le gameplay côté client** en MVP, et ne faire que sauvegarde/load.

---

## 5) Économie & équilibrage (MVP)

* [ ] Coûts construction (Forum, Farm, Mine, Kitchen, Temple…)
* [ ] Courbes (XP player, WXP world) validées en temps de jeu
* [ ] Boucle ressource :

  * [ ] farm/mine → kitchen/forge → power/progression
* [ ] Soft-lock prevention (stamina, ressources, progression)
* [ ] “First 15 minutes” fun & lisible

---

## 6) Contenu (narration)

* [ ] Chapitre 1 complet (script, dialogues, tutoriel Forum)
* [ ] Chapitres 2–4 en placeholder mais jouables
* [ ] Déclencheurs (unlock buildings, objectifs simples)
* [ ] Système scripts/registry stable (déjà en place)

---

## 7) Release / Ops

* [ ] Telemetry légère (errors, save failures)
* [ ] Crash-safe save (write atomic)
* [ ] Profiling perf (ticks massifs)
* [ ] Build prod + déploiement (Vercel/Netlify + Supabase si besoin)

---

### Priorité MVP “jouable”

Si tu veux un ordre ultra efficace :

1. UI HUD + allocations + tick (farm/mine/temple)
2. Save/load (localStorage puis DB)
3. Kitchen craft manuel
4. Forge + inventaire (craft/upgrade/recycle)
5. Forum UI rank up world + costs
6. Regen stamina (via Forum) pour éviter soft-lock
