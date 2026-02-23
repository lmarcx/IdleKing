
# I. STRUCTURE VISUELLE GLOBALE

### Dualité esthétique :

| Monde              | Style                   |
| ------------------ | ----------------------- |
| Royaume & systèmes | Dark fantasy métallique |
| Boto               | Cosmic holographique    |

Cette opposition est **volontairement narrative** :

> Le monde est ancien.
> Boto est extérieur à ce monde.

---

# II. PALETTE OFFICIELLE

## 🎨 Fond

* `#0D1117` → fond principal (noir bleuté)
* `#141A22` → panels
* `#1B222C` → surélévations

---

## 👑 Métal royal

* `#2C323C` → acier sombre
* `#3A424F` → bordures
* `#C6A85B` → or royal (titres, rank up, highlights nobles)

---

## 🌿 XP_GLOBAL (énergie universelle)

Vert mystique :

* `#1AFF7A` (principal)
* `#0ED760` (hover)
* Glow : `rgba(26,255,122,0.4)`

Effet visuel :

* légère aura
* particules fines

---

## 🌊 WXP (énergie du monde)

Bleu cosmique :

* `#2DA8FF` (principal)
* `#0F8CFF` (hover)
* Glow : `rgba(45,168,255,0.35)`

Effet :

* pulse lent
* bordure interne subtile

---

## 🔥 Danger / coût impossible

* `#7B1E1E`
* `#B83232`

---

# III. TYPOGRAPHIE

### Titres

* Serif fantasy lisible (Cinzel / Playfair / custom)
* Uppercase partiel
* Letter-spacing léger

### Corps

* Sans-serif moderne (Inter / Satoshi)
* Très lisible (MVP)

### Chiffres

* Tabular nums activé
* Important pour prod/min

---

# IV. LAYOUT OFFICIEL

```plaintext
╔══════════════════════════════════════════════════════════╗
║  [SIGIL ROYAL] Idle King — Age I                        ║
╠══════════════╦══════════════════════════╦═══════════════╣
║              ║                          ║               ║
║  GRIMOIRE    ║       SCÈNE ACTIVE       ║   HUD RELIC   ║
║              ║                          ║               ║
╚══════════════╩══════════════════════════╩═══════════════╝
```

---

# V. LEFT NAV — GRIMOIRE

Style :

* Panneau acier sombre
* Ligne verticale runique très fine
* Onglet actif = plaque dorée + glow

### Actif :

* Bordure gauche dorée
* Légère lueur interne
* Icône plus lumineuse

### Non actif :

* Icône grise désaturée
* Hover = léger éclairage bleu sombre

---

# VI. HUD RELIQUAIRE (Colonne droite)

## 1️⃣ Progression

Deux médaillons circulaires :

### Player

* Anneau XP vert
* Centre : Level
* Glow léger vert

### World

* Anneau WXP bleu
* Rune centrale
* Si WXP suffisant → pulse bleu

---

## 2️⃣ Villageois

* Barre stamina totale
* Rouge sombre si < 30%
* Texte :

  * Total
  * Fatigués

---

## 3️⃣ Ressources

* Icône gravée
* Nom
* Quantité alignée à droite
* Delta en petit vert

Catégories séparées par plaque horizontale fine.

---

# VII. ROYAUME — BUILDING CARDS

Carte métallique.

### États :

| État     | Style                          |
| -------- | ------------------------------ |
| Locked   | Chaînes overlay + désaturation |
| Unlocked | Métal froid                    |
| Built    | Bordure dorée                  |
| Active   | Légère aura verte              |

---

# VIII. TEMPLE — IDENTITÉ FORTE

Le Temple doit visuellement incarner XP_GLOBAL.

* Orbe verte animée
* Halo pulsant
* Particules fines
* Texte “Universal Energy”

C’est un des points forts visuels.

---

# IX. FORGE

Plus chaud :

* Lueur orange interne
* Légère braise animée
* Rareté :

  * Common = gris
  * Rare = bleu
  * Epic = violet
  * Legendary = or
  * Ancestral (plus tard) = rouge cosmique

---

# X. BOTO — STYLE COSMIC IA

Contraste total.

## Palette Boto

* Fond noir pur
* Cyan électrique
* Violet profond
* Micro scanlines

---

## Structure

```plaintext
╔══════════════════════════════╗
║  BOTO UNIT — LINK ESTABLISHED║
╠══════════════════════════════╣
║   Hologram Core              ║
║                              ║
║   Dialogue text              ║
║                              ║
║   > Choice 1                 ║
║   > Choice 2                 ║
╚══════════════════════════════╝
```

### Effets :

* Glow cyan
* Bordures fines néon
* Animation lente de scan

### Narrativement :

Boto n’est pas “fantasy”.
Il est une IA cosmique observant ce monde.

---

# XI. SYSTÈME DE BOUTONS

## RunicButton (fantasy)

* Plaque métallique
* Relief subtil
* Hover → glow
* Disabled → fissure + cadenas

## HoloButton (Boto)

* Bordure néon
* Fond transparent
* Hover → remplissage cyan 15%

---

# XII. MICRO-INTERACTIONS MVP

* Gain ressource → pulse vert
* Rank up → onde bleue
* Build → flash doré
* Offline summary → pluie de particules vert/bleu

---

# XIII. PRIORITÉ D’IMPLÉMENTATION (MVP)

1. Palette + tokens CSS
2. Nouveau PanelFrame
3. Médaillons XP/WXP
4. Refonte boutons
5. Temple visuellement distinct
6. Boto HoloPanel

---


