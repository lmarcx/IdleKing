# 🗺️ MVP ROADMAP — IdleKing

## Status

```txt
LOCKED — dérivé de DESIGN_FREEZE_V1.md + IMPLEMENTATION_BIBLE.md
```

Roadmap de **production** du MVP (Prologue · Chapter I — Era Funèbre · Chapter II — Era Glaciaire).
Elle transforme le scope verrouillé en **phases livrables, prérequis, risques et portes de
validation**. Aucun redesign, aucun nouveau système.

> **Hiérarchie** : `DESIGN_FREEZE_V1` (règles) > `IMPLEMENTATION_BIBLE` (exécution) >
> `MVP_ROADMAP` (production/séquençage) > code.
> **Brownfield** : socle existant dans `packages/game-core/*` → on étend, on ne re-fork pas.
> `expedition/` et `story/scripts/ch03` = hors MVP (ne pas avancer dessus).

**Mapping phases ↔ bible** : Foundation = P0 · Combat = P1 · Equipment = P2 · Loot = P3 · Skills = P4 ·
Resources = P5 · Forge = P6 · Story = P7 · Time Gate = P8 · Resonance = P9 · Effect Sets = P10 ·
Content = P11 · Polish = P12.

**Légende validation** : ✅ = porte de validation (acceptance gate) — la phase n'est « done » que si
tous les ✅ passent, tests headless inclus.

---

# PHASES

---

## 1. Foundation

**Objectifs** — Poser le socle technique partagé : modèle de stats, RNG seedable, validation de
registres, conventions data-driven, séparation core/runtime/visuals.

**Livrables**
- Modèle de stats (`STATS.md`) : base (HP/ATK/DEF/SPEED), advanced, derived, POWER.
- RNG seedable injectable + utilitaire de validation de registre (échec bruyant au boot).
- Squelette des registres `[DEF]` (vides mais typés) + chargeur data-driven.
- Convention de persistance câblée ([DEF]/[STATE]/[DERIVED]/[RUN], cf. `DATA_MODEL.md`).

**Prérequis** — Aucun (point de départ).

**Risques** — Dérive d'architecture (logique couplée au rendu) ; nombres magiques au lieu de config ;
courbe DEF/POWER laissée implicite.

**Validation**
- ✅ Stats & POWER calculables et testés (caps : crit 100%, crit dmg 200%, CDR 50%).
- ✅ RNG seedée reproductible (même seed → même sortie).
- ✅ Un registre invalide fait échouer le boot avec message clair.

---

## 2. Combat

**Objectifs** — Boucle de combat manuelle jouable et découplée du rendu.

**Livrables**
- `combat-core` (calculs purs) : Damage Formula + status effects (sémantique Freeze).
- `combat-runtime` : HP/Mana/Stamina, sprint, **dash = Stamina**, attaque de base, mort → checkpoint.
- `combat-visuals` (`apps/web`, Pixi) : slice rendue + telegraphs basiques.

**Prérequis** — Foundation.

**Risques** — Couplage Pixi/logique (interdit) ; **dash en Stamina** (D-04, ne pas suivre l'ancienne
note cooldown) ; courbe DEF placeholder ; lisibilité des telegraphs.

**Validation**
- ✅ Déplacement + sprint + dash (coût Stamina) + attaque de base fonctionnels.
- ✅ Dégâts entrants/sortants via la Damage Formula ; ≥ 1 status appliqué.
- ✅ Mort → respawn checkpoint sans perte des récompenses sécurisées.
- ✅ `combat-core` testé **headless (zéro import Pixi)**.

---

## 3. Equipment

**Objectifs** — Génération et port d'équipement, raretés, affixes, upgrade, sets actifs.

**Livrables**
- Flux de génération `base → ilvl → rarity → affixes → stats → upgrade`.
- Affixes **0/0/1/1/2** (cap 2) ; pools par slot (valeurs placeholder).
- Upgrade caps **+6/+9/+12** (Rare inclus) ; agrégation des stats en combat.
- 4 Equipment Sets actifs (stat-bias) ; artifact slot **inerte**.

**Prérequis** — Combat (stats agrégées).

**Risques** — Affixes ≠ 0/0/1/1/2 ; oubli de Rare dans l'upgrade ; identité de set non conforme à
`EQUIPMENT_SETS.md` (D-06) ; artifact activé par erreur (D-11).

**Validation**
- ✅ Générer un item de chaque rareté avec le **bon nombre d'affixes**.
- ✅ Équiper → delta de stats visible en combat.
- ✅ Upgrade jusqu'au cap par rareté ; 4 sets actifs appliquent leur bias.

---

## 4. Loot

**Objectifs** — Distribution de loot et recyclage, 100 % aléatoire.

**Livrables**
- Loot generation **100 % random** (pas de smart loot) ; roll équipement boss **50/25/15/8/2**.
- Drops de matériaux par ennemi (ids `RESOURCES_DATABASE`) ; récompenses donjon/coffre.
- Recycle **= ECU + Precious Stone** (pas de retour matière).

**Prérequis** — Equipment (génération), ids de ressources (stub registry possible).

**Risques** — Smart loot introduit par accident ; recycle qui rend des matériaux (D-07) ; ids de
ressources non alignés sur le registre.

**Validation**
- ✅ Tuer un ennemi → drop conforme à sa table.
- ✅ Boss → roll d'équipement pondéré 50/25/15/8/2.
- ✅ Recycle → ECU + chance de Precious Stone ; tests seedés déterministes.

---

## 5. Skills

**Objectifs** — Skills actives portées par les rings, ring-scaling pur.

**Livrables**
- Registre `SK-001..016` data-driven + cast (mana/cooldown) dans le runtime.
- Rings = skill : 5 slots, **duplicate guard**, scaling par rareté/upgrade du ring.
- Mapping des 5 rings nommés (`RINGS_SKILLS_MAP`).

**Prérequis** — Combat (cast/Mana), Equipment (ring item), Loot (rings droppables).

**Risques** — Niveaux/skill points réintroduits (D-02) ; doublon de skill autorisé ; summon skills
(SK-015/016) trop lourds ; 8 targetings sur-dimensionnés.

**Validation**
- ✅ 5 rings équipés → 5 skills castables ; mana/cooldown respectés.
- ✅ Doublon de Skill ID bloqué.
- ✅ Améliorer le ring → améliore la skill ; rings nommés mappent leur `SK-0xx`.

---

## 6. Resources

**Objectifs** — Registre de ressources opérationnel et économie calculable.

**Livrables**
- Registre `RESOURCES_DATABASE` (id/type/rarity/value, stack 999) + validation boot.
- Sorties Mine/Farm → ressources enregistrées ; Currencies (Écu, Boss Token).
- `item_value = sum(resource_value × qty)` calculable ; valeur de vente Market pour chaque ressource.

**Prérequis** — Foundation (registres) ; alimente Loot et Forge.

**Risques** — Noms non réconciliés (Iron Scrap≡Iron Ore, Sapphire Fragment≡Sapphire) ; ressource sans
usage ni valeur de vente ; sources de bois non fixées.

**Validation**
- ✅ Registre charge et **valide** (échec si id inconnu).
- ✅ Mine/Farm produisent des ressources enregistrées ; `item_value` calcule.
- ✅ Chaque ressource a au moins un usage **ou** une valeur de vente.

---

## 7. Forge

**Objectifs** — Craft, upgrade et recycle complets, déblocage d'armes par Forge Level.

**Livrables**
- Craft : **rareté = roll pondéré par le niveau de Forge** (D-09).
- Déblocage des armes par **échelle Forge Level 1-10** (D-08) ; recettes boss gatées.
- Upgrade + Recycle branchés (réutiliser `economy/upgradePurchase`).

**Prérequis** — Equipment (génération), Resources, Loot (recycle → stone).

**Risques** — Rareté fixe ou roll pur au lieu du pondéré-Forge ; mauvais gating d'armes ;
implémentation accidentelle d'Evolve/Enchant/Fusion (OUT).

**Validation**
- ✅ Craft consomme des ressources → item avec rareté pondérée par Forge.
- ✅ Un type d'arme n'est craftable qu'au bon Forge Level ; recettes boss gatées.
- ✅ Upgrade jusqu'au cap ; recycle → ECU + Precious Stone.

---

## 8. Story

**Objectifs** — Progression linéaire jouable (chapitres → donjons → bosses → unlocks).

**Livrables**
- Player Level auto (**sans skill point**) ; World Level (WXP via Temple → level-up manuel au Forum).
- Story linéaire + quêtes ; gating **Story + WorldLevel** uniquement.
- Roster **6 bosses** branché (Seigneur → Gouffre Royal, Allaeva 2 phases).

**Prérequis** — Combat (combats donjon/boss), Loot (récompenses), Resources.

**Risques** — Skill points au level up (D-02) ; gating par PlayerLevel/POWER/équipement (interdit) ;
branchement des scripts Ch III (OUT) ; phases de boss erronées.

**Validation**
- ✅ Parcours jouable Prologue → Ch I → Ch II.
- ✅ Les 6 bosses combattables selon le roster ; quêtes débloquent le contenu.
- ✅ World level-up manuel au Forum via WXP du Temple.

---

## 9. Time Gate

**Objectifs** — Déblocage des Ères via le bâtiment Time Gate.

**Livrables**
- Bâtiment **Time Gate** (ex-World Gate) ; **Kaléidoscope** (special item, one-time).
- **Fragment du Temps** (loot boss de fin de chapitre) → consommé à la Time Gate → Ère suivante.

**Prérequis** — Story (boss de fin de chapitre droppe le Fragment), Resources (special items).

**Risques** — Time Gate modélisée en item (doit être bâtiment, D-15) ; Kaléidoscope traité en artifact
(D-12) ; nommage non unifié (Fragment du Temps, D-13).

**Validation**
- ✅ Boss de fin de chapitre → Fragment du Temps.
- ✅ Consommer à la Time Gate → déblocage de l'Ère suivante ; Kaléidoscope obtenu une fois.

---

## 10. Resonance

**Objectifs** — Calcul de la Résonance et des Effect Slots.

**Livrables**
- Résonance depuis les **9 slots** (rings + artifact **exclus**) ; valeurs `C0..L4`.
- `Effect Slots = floor(total / 9)`.

**Prérequis** — Equipment (raretés des slots équipés).

**Risques** — Rings/artifact comptés par erreur ; formule `floor` mal arrondie.

**Validation**
- ✅ Résonance calculée depuis les 9 slots ; nombre d'Effect Slots correct.
- ✅ Tests des exemples du doc (9 Uncommon = 1 ; 9 Epic = 3).

---

## 11. Effect Sets

**Objectifs** — 5 Effect Sets simplifiés, acquis narrativement, équipables.

**Livrables**
- 5 Effect Sets (Shadow Veil, Lordflame, Motherstone, Kingfrost, Rainmaker) à effets **simples**
  (stats/status), **aucun proc**.
- Acquisition narrative + slotting dans les Effect Slots.

**Prérequis** — Resonance (slots), Story (acquisition), Combat (application).

**Risques** — Procs spectaculaires implémentés (D-01) ; acquisition par loot au lieu de narratif ;
Rainmaker mal sourcé (= Seigneur de la Pluie Déchu).

**Validation**
- ✅ Acquérir un Effect Set via la story ; le placer dans un Effect Slot.
- ✅ Son effet simple s'applique en combat ; respect du nombre d'Effect Slots.

---

## 12. Content

**Objectifs** — Peupler tout le contenu MVP et boucler le playthrough.

**Livrables**
- Chargement de **tout** le contenu MVP depuis les DB (Prologue + 10 donjons, familles d'ennemis,
  6 bosses, recettes, items, 4 sets actifs, 5 effect sets).
- Loot tables câblées ; **graphe de ressources fermé** (drops ↔ recettes) ; validation croisée au boot.

**Prérequis** — Phases 1→11.

**Risques** — Données non alignées sur les registres (échec bruyant) ; contenu Ch III importé ; boss
fantôme non résolu (Seigneur in Gouffre Royal).

**Validation**
- ✅ MVP jouable de bout en bout (Prologue → fin Ch II).
- ✅ Zéro erreur de donnée manquante au boot ; chaque ressource droppée a un usage/valeur.

---

## 13. Polish

**Objectifs** — Juice, UX, balancing, robustesse, perf.

**Livrables**
- Juice combat (damage numbers, crit, screenshake, hit flash) + **telegraphs code couleur**.
- **Passe de balancing** : remplir les valeurs DEFERRED (§21 du Freeze) dans la config.
- Save/load fiable ; garde-fous no soft-lock (regen stamina/mana) ; 60 fps.

**Prérequis** — Toutes les phases.

**Risques** — Ajout de système pendant le polish (interdit) ; valeurs DEFERRED laissées vides ;
soft-locks de ressources ; régressions de perf.

**Validation**
- ✅ Telegraphs lisibles (orange/rouge/jaune/bleu/vert) + feedback juicy.
- ✅ Toutes les valeurs DEFERRED §21 renseignées (baseline équilibrée).
- ✅ Save/load fiable ; aucun soft-lock ; 60 fps stable.

---

# MVP MILESTONES

Jalons **démoables** (chacun = une démo vérifiable, pas une couche interne).

```txt
M1 · Premier combat jouable
    Phases : Foundation + Combat
    Démo : se déplacer, sprint/dash (Stamina), attaque de base, tuer un ennemi placeholder, mourir→checkpoint.

M2 · Premier loot
    Phases : + Equipment + Loot
    Démo : tuer un ennemi → drop de ressources ; ouvrir un item généré (rareté + affixes corrects) ; recycler → ECU + stone.

M3 · Premier craft
    Phases : + Resources + Forge
    Démo : récolter (Mine/Farm) → craft d'une arme de base (rareté pondérée par Forge) → équiper → upgrade.

M4 · Premier boss
    Phases : + Skills + Story (scaffolding) + 1 boss de contenu
    Démo : équiper des rings (skills), affronter le boss du Prologue (Amalgame des Ténèbres), checkpoints, récompenses.

M5 · Premier chapitre terminé
    Phases : + Story + Content (Prologue puis Ch I)
    Démo : compléter le Prologue de bout en bout (donjons → boss → unlock Kingdom/Era Funèbre).

M6 · Premier build complet
    Phases : + Time Gate + Resonance + Effect Sets
    Démo : un build entier — arme + 6 armures + 5 rings/skills + Résonance → Effect Slots → 1 Effect Set slotté ;
           déblocage d'Ère via Fragment du Temps à la Time Gate.

M7 · MVP complet
    Phases : + Content (intégral) + Polish
    Démo : playthrough Prologue → fin Ch II, 6 bosses, save/load, balancing baseline, 60 fps.
    → Voir MVP EXIT CRITERIA.
```

**Note de séquençage (producteur)** — Resources (P6 bible) peut démarrer **en parallèle** de
Equipment/Loot dès la fin de Foundation (dépendance faible, fournit les ids). Time Gate / Resonance /
Effect Sets sont **courtes** et dépendent surtout de Story + Equipment : elles s'enchaînent après M5.
Le chemin critique est : **Foundation → Combat → Equipment → Loot → Skills → Story → Content**.

---

# MVP EXIT CRITERIA

Le MVP est **terminé** quand **toutes** ces conditions sont vraies (mesurables) :

```txt
JOUABILITÉ
- Playthrough complet Prologue → fin Chapter II sans blocage ni soft-lock.
- Les 6 bosses sont défaitables (Allaeva 2 phases ; Seigneur de la Pluie Déchu au Gouffre Royal).
- Mort → checkpoint sans perte des récompenses sécurisées.

COMBAT & BUILD
- Dash = Stamina ; sprint = Stamina ; HP/Mana/Stamina fonctionnels.
- 5 rings = 5 skills castables ; aucun doublon de Skill ID ; ring-scaling pur (aucun skill level/point).
- Un build complet équipable : arme + 6 armures + 5 rings + necklace (+ artifact inerte).

ITEMISATION & FORGE
- Génération raretés Common→Legendary ; affixes 0/0/1/1/2 (cap 2).
- Upgrade caps +6/+9/+12 (Rare inclus) opérationnels.
- Craft = roll de rareté pondéré par Forge ; armes débloquées par Forge Level 1-10 ; recettes boss gatées.
- Recycle = ECU + Precious Stone (aucun retour matière).

ÉCONOMIE & DONNÉES
- Graphe de ressources FERMÉ : chaque input de recette a une source ; chaque drop a un usage ou une valeur de vente.
- Registres validés au boot (zéro référence cassée) ; item_value calculable.
- Currencies MVP uniquement (Écu, Boss Token).

SETS / RESONANCE / EFFECT SETS
- 4 Equipment Sets actifs appliquent leur stat-bias.
- Résonance calculée sur 9 slots (rings/artifact exclus) ; Effect Slots = floor(total/9).
- 5 Effect Sets simplifiés acquérables narrativement et slottables (aucun proc).

PROGRESSION & ÈRES
- Player Level (≤50, sans skill point) ; World Level (≤50) via WXP/Temple/Forum.
- Time Gate : Fragment du Temps → déblocage d'Ère ; Kaléidoscope obtenu une fois.

QUALITÉ & SCOPE
- Toutes les valeurs DEFERRED (§21) renseignées avec une baseline équilibrée.
- Save/load fiable ; 60 fps stable ; telegraphs au code couleur.
- Tests core headless au vert (combat, génération, loot, forge, résonance).
- AUCUN système HORS MVP actif (artifact inerte ; pas de Mythic+, passives, ultimates, Power Stones,
  evolve/enchant/fusion, modes, PvP, seasons, smart loot, contenu Ch III).
```

---

*MVP_ROADMAP — subordonné à DESIGN_FREEZE_V1.md & IMPLEMENTATION_BIBLE.md. Périmètre : Prologue ·
Chapter I — Era Funèbre · Chapter II — Era Glaciaire.*
