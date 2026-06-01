# RESOURCES DATABASE — IdleKing (MVP)

## Status

```txt
LOCKED (structure) · DEFERRED (resource_value à calibrer)
```

Source of truth **canonique** des ressources pour :

```txt
Prologue · Chapter I — Era Funèbre · Chapter II — Era Glaciaire
```

Ce fichier comble le livrable **P0** du `DESIGN_FREEZE_V1.md` (§10). Il fournit la donnée
`resource_value` requise par la formule économique :

```txt
item_value = sum(resource_value × quantity)
```

> Currencies (Écu, Boss Token…) ≠ Resources. Special Items (Kaléidoscope, Fragment du Temps) ≠ Resources (voir §6).

---

# 1. Modèle

```ts
type ResourceType =
  | "wood" | "ore" | "gem" | "meat" | "vegetable" | "monster" | "boss";

type ResourceDef = {
  id: string;            // snake_case canonique
  name: string;          // nom d'affichage canonique
  type: ResourceType;
  rarity: ItemRarity;    // fixe, pas de quality roll
  value: number;         // resource_value (placeholder, DEFERRED balancing)
  sources: string[];
  uses: string[];        // au moins 1 usage OU "market_sell"
  maxStack: 999;
  tradable: true;
};
```

## Barème `value` de référence (placeholder, DEFERRED)

```txt
Common 5 · Uncommon 15 · Rare 50 · Epic 150 · Legendary 500
Boss Core (Epic) 250 · Boss Core (Legendary) 800
```

---

# 2. Réconciliation des noms (LOCKED)

Les drops et les recettes utilisaient des vocabulaires divergents. **Noms canoniques** :

```txt
Iron Scrap        → Iron Ore        (id: iron_ore)
Sapphire Fragment → Sapphire        (id: sapphire)
```

Les variantes élite **« Rare X » / « Large X »** (ex. Rare Spectral Dust, Large Spectral Dust,
Rare Frozen Fish…) ne sont **pas** des ressources distinctes : ce sont des **variantes de rareté
supérieure** de la ressource de base, octroyées par les ennemis Élite. Elles partagent le même `id`
de base avec une `rarity` relevée d'un cran (mécanique de drop, pas une nouvelle entrée de registre).

`Fallen Rain Pearl` → **DEPRECATED** (Funeral Blade re-gatée en Funèbre, cf. Freeze §17). Non utilisée au MVP.

---

# 3. Registre — Ressources de base (Mine / Farm)

| id | name | type | rarity | value | sources | uses |
|---|---|---|---|---|---|---|
| `iron_ore` | Iron Ore | ore | Common | 5 | Mine ; Squelettes (Iron Scrap≡Iron Ore) | forge weapons/armor/upgrade |
| `cold_iron` | Cold Iron | ore | Uncommon | 15 | Mine (Era Glaciaire) | forge frost weapons/armor |
| `silver_ore` | Silver Ore | ore | Uncommon | 15 | Mine ; Champion Funéraire, Apprenti Gelé | forge accessory/staff/pistol |
| `quartz` | Quartz | gem | Common | 5 | Mine | forge accessory/rings, upgrade |
| `sapphire` | Sapphire | gem | Rare | 50 | Mine ; élites Glaciaire (Sapphire Fragment≡Sapphire) | forge frost gear/rings/staff |
| `pale_diamond` | Pale Diamond | gem | Epic | 150 | Mine (rare) | forge légendaire frost (necklace, catalyseur) |
| `old_wood` | Old Wood | wood | Common | 5 | Mine/Farm (gathering) | forge early weapons/armor/shield |
| `ashwood` | Ashwood | wood | Uncommon | 15 | Dragonoïdes Corrompus (drop) ; Farm | forge Funèbre weapons/armor |
| `frostpine` | Frostpine | wood | Uncommon | 15 | Gathering (Era Glaciaire) | forge frost bow/staff |
| `frostroot` | Frostroot | vegetable | Uncommon | 15 | Farm (Era Glaciaire) | kitchen (frost resist / survie) |
| `tomato` | Tomato | vegetable | Common | 5 | Farm | kitchen |
| `carrot` | Carrot | vegetable | Common | 5 | Farm | kitchen |
| `tough_meat` | Tough Meat | meat | Common | 5 | Farm ; Squelettes | kitchen ; forge (bone knife, rings) |
| `frozen_fish` | Frozen Fish | meat | Uncommon | 15 | Sirènes / Créatures Marines Gelées | kitchen (frost soup) |

---

# 4. Registre — Matériaux de monstres

| id | name | type | rarity | value | sources | uses |
|---|---|---|---|---|---|---|
| `shadow_residue` | Shadow Residue | monster | Common | 5 | Ombres de Guerre (Prologue), Spectres/Âmes (Funèbre) | forge Funèbre (Funeral Blade, Spectral Shiv, sets) |
| `spectral_dust` | Spectral Dust | monster | Uncommon | 15 | Spectres des Ténèbres (Funèbre) | forge Funèbre weapons/armor, catalyseur |
| `bone_fragment` | Bone Fragment | monster | Common | 5 | Squelettes Funéraires | forge (Bone Knife) ; market_sell |
| `dragon_scale_fragment` | Dragon Scale Fragment | monster | Rare | 50 | Dragonoïdes / Gardien des Cendres | forge Funèbre defense ; market_sell |
| `frozen_echo` | Frozen Echo | monster | Uncommon | 15 | Spectres du Froid, Mages Gelés (Glaciaire) | forge frost weapons/armor/rings |
| `pearlescent_scale` | Pearlescent Scale | monster | Rare | 50 | Sirènes ; Seigneur de la Pluie Déchu | forge frost/marine ; market_sell |
| `cold_shell_fragment` | Cold Shell Fragment | monster | Uncommon | 15 | Créatures Marines Gelées | market_sell (recette future) |
| `archival_fragment` | Archival Fragment | monster | Rare | 50 | Mages Gelés, Aberrations d'Arathas | forge arcane (Arathas) ; market_sell |
| `experimental_tissue` | Experimental Tissue | monster | Rare | 50 | Aberrations d'Arathas | market_sell (recette future) |

> Les ressources marquées « market_sell (recette future) » respectent la règle du Freeze
> (au moins un usage **ou** une valeur de vente). Leur intégration en recette est un arbitrage post-MVP.

---

# 5. Registre — Matériaux de boss (cores)

| id | name | type | rarity | value | source (boss) | uses |
|---|---|---|---|---|---|---|
| `dark_amalgam_core` | Dark Amalgam Core | boss | Epic | 250 | Amalgame des Ténèbres (Prologue) | forge Funeral Blade ; catalyseur Era Glaciaire |
| `dragon_ash_core` | Dragon Ash Core | boss | Epic | 250 | Ombre du Dragon (Ch I) | forge dragon gear ; catalyseur |
| `frost_amalgam_core` | Frost Amalgam Core | boss | Epic | 250 | Amalgame du Givre (Ch II) | forge frost weapons |
| `archmage_sigil` | Archmage Sigil | boss | Epic | 250 | Archimage Corrompu (Ch II) | forge Arathas Staff, Icebound Grimoire |
| `frozen_queen_tear` | Frozen Queen Tear | boss | Legendary | 800 | Allaeva (Ch II) | forge Reine Blanche gear ; catalyseur Era Déluge |

> **Seigneur de la Pluie Déchu** (boss du Gouffre Royal, Ch II) : drop = `pearlescent_scale` (Rare) + Boss Token.
> Pas de core unique requis au MVP (Funeral Blade re-gatée hors de ce boss).

---

# 6. Special Items (hors registre ressources — référence)

Ne sont **pas** des ressources (catégorie Special Item) :

```txt
Kaléidoscope       — Special World Item ; pouvoirs à la Time Gate (obtenu une fois, story)
Fragment du Temps  — clé de déblocage d'Ère ; loot des boss de fin de chapitre ;
                     consommé à la Time Gate (fusionne ex-"Era Progression Item" + "Kaléidoscope Component")
```

Voir `DESIGN_FREEZE_V1.md` §16.

---

# 7. Couverture (vérification du graphe craft)

- ✅ Tous les **inputs de recette** de `RECIPES_DATABASE.md` ont désormais une `id` + une **source**.
- ✅ Tous les **drops** de `LOOT_TABLES_DATABASE` / `ENEMIES_DATABASE_V2` ont une **id canonique** + un **usage ou une valeur de vente**.
- ⏳ `value` = placeholders ; calibrage en passe de balancing (Freeze §21).

---

# 8. Open (balancing)

```txt
- resource_value définitifs par ressource
- quantités/taux de drop (mob/boss/Mine/Farm)
- intégration en recette des ressources actuellement "market_sell"
- sources de gathering du bois (old_wood, frostpine) à fixer (Mine vs Farm vs node)
```
