# 💰 Idle King — Currencies System (v1)

## 1. Vision

Les currencies représentent les monnaies du jeu.

Elles sont distinctes des ressources et des items.

```txt
Currencies ≠ Resources ≠ Items
````

Les currencies servent à :

```txt
acheter
vendre
craft
upgrade
services
quests
mode rewards
future economy systems
```

---

## 2. Différence avec les Items

### Items

Les items :

```txt
occupent l’inventaire
peuvent stacker
peuvent être déplacés
peuvent être stockés en banque
peuvent être lootés
```

---

### Resources

Les ressources sont des items spécialisés servant de matières premières.

```txt
Forge
Kitchen
Buildings
Market
```

Elles :

```txt
stackent
occupent l’inventaire
sont tradables
```

---

### Currencies

Les currencies :

```txt
ne sont pas des items
n’occupent pas l’inventaire
n’utilisent pas de stack
ne vont pas en banque
```

Elles utilisent :

```txt
wallet dédié
HUD counters
economy systems
```

---

## 3. Currency principale

La monnaie principale universelle est :

```txt
Écu
```

---

## 4. Usage de l’Écu

L’Écu sert à :

```txt
Market
vendors
basic exchanges
craft
equipment upgrades
services
quests
future economy systems
```

---

## 5. Wallet System

Les currencies utilisent un wallet dédié.

Règles :

```txt
illimité
pas de stack
pas de slots
pas de banque
```

Chaque currency est représentée par un compteur.

---

## 6. Tradability

Les currencies ne sont pas tradables comme des items.

Mais elles peuvent être utilisées comme monnaies d’échange.

Exemples :

```txt
payer un craft
acheter un item
payer un service
échanger contre autre currency
```

---

## 7. Familles de currencies

### Core

```txt
Écu
```

---

### Mode currencies

```txt
Duel Token
Boss Token
Abyss Shard
Sky Sigil
Expedition Badge
```

---

### Online currencies

```txt
Guild Token
War Token
Slayer Token
```

---

### Event currencies

```txt
Event Currency
```

---

### Future premium currencies

Non MVP.

Possibilités :

```txt
premium currency
cash shop currency
cosmetic currency
```

---

## 8. Sources

Les currencies peuvent être obtenues via :

```txt
mode rewards
quests
vendors
events
boss rewards
future online systems
story rewards
special services
```

---

## 9. Exchange System

Le Market et certains vendors peuvent permettre :

### Items → Currency

```txt
resources → Écu
equipment → Écu
consumables → Écu
```

---

### Currency → Items

```txt
Écu → items
tokens → rewards
```

---

### Currency → Currency

Selon règles spécifiques.

Exemples :

```txt
Duel Token → Écu
Boss Token → special vendor currency
event currency → event rewards
```

---

## 10. Loss Rules

Les currencies ne sont jamais perdues automatiquement.

Même en cas d’échec :

```txt
pas de perte passive
pas de perte sur mort
pas de perte sur abandon
```

Mais elles peuvent être consommées volontairement :

```txt
craft
upgrade
services
transactions
vendors
quests
```

---

## 11. HUD Display

Les currencies utilisent un affichage HUD dédié.

Exemples :

```txt
Écu visible en permanence
currencies contextuelles selon activité
wallet modal complète
```

Objectif :

```txt
lisibilité
feedback économique
accessibilité rapide
```

---

## 12. Architecture recommandée

```txt
currencies/
  types.ts
  registry.ts
  wallet.ts
  transactions.ts
  exchange.ts
  rewards.ts
  hud.ts
```

---

## 13. Modèle conceptuel

```ts
type CurrencyFamily =
  | "core"
  | "mode"
  | "online"
  | "event"
  | "premium";

type CurrencyDef = {
  id: string;
  name: string;
  family: CurrencyFamily;
  hudVisible: boolean;
};

type WalletState = {
  balances: Record<string, number>;
};
```

---

## 14. Relation avec les systèmes

Currencies interagissent avec :

```txt
Market
Forge
Buildings
Quests
Story
World Gate
Online systems
Events
Future premium systems
```

---

## 15. Principes fondamentaux

Les currencies doivent être :

```txt
simples
lisibles
sécurisées
extensibles
séparées des items
```

Objectif :

```txt
ajouter une nouvelle monnaie
sans refactor inventory / items / resources
```

