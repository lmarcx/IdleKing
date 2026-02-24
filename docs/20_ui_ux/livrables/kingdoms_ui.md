# 👑 1️⃣ KINGDOM — LIVRABLES OFFICIELS

## 📁 Fichiers à livrer

### A. Background Kingdom

Nom :

```
kingdom_background_v1.png
```

Format :

* PNG
* 2048x2048 (square master)
* sRGB
* 72dpi

Pourquoi 2048 ?
→ Downscale propre vers mobile
→ Future-proof desktop

---

### B. Brouillard Overlay

Nom :

```
kingdom_fog_mask_v1.png
```

Format :

* PNG
* 2048x2048
* Fond noir
* Zones transparentes

---

### C. Bâtiments séparés (chaque lvl1)

Exemple :

```
building_temple_lvl1.png
building_farm_lvl1.png
building_mine_lvl1.png
building_forum_lvl1.png
```

Format :

* PNG
* Fond transparent
* 512x512 max
* Centré
* Ombre incluse légère

---

### D. Version Vector (optionnel mais recommandé)

```
building_temple_lvl1.svg
```

Pourquoi ?
→ Animations futures
→ Scalabilité

---

# 🎨 PROMPTS IA — KINGDOM

## 🎨 Background (Midjourney / SD)

```id="prompt_k_bg"
Dark fantasy minimal stylized kingdom, night permanent, 3/4 perspective, small emerging fortress, subtle fog on ground, deep blue-black sky without stars, elegant dark tone, mobile game background, clean shapes, low detail, cinematic lighting, no characters, no UI
```

Paramètres recommandés :

* Aspect ratio 1:1
* Stylize faible (pas trop artistique)
* No photorealism

---

## 🏗 Bâtiments lvl1

Temple :

```id="prompt_temple"
Minimal dark fantasy small temple, simple geometric shapes, stone structure, subtle bronze accent, night lighting, clean stylized mobile game asset, isolated on transparent background
```

Mine :

```id="prompt_mine"
Minimal dark fantasy mine entrance, stone and wood, simple shape, low detail, night lighting, mobile game asset, isolated
```

Farm :

```id="prompt_farm"
Minimal dark fantasy farm structure, small fields, very stylized, low detail, night environment lighting, mobile game asset isolated
```

Forum :

```id="prompt_forum"
Minimal dark fantasy forum building, stone platform with columns, simple geometry, clean shapes, night lighting, isolated asset
```

⚠️ Important :
Toujours demander :
“isolated asset, centered, no background”

---

# 🧩 Figma Make — Prompt Kingdom Screen

```id="figma_kingdom"
Create a mobile-first game UI screen for a dark fantasy idle RPG. 
Layout:
- Top header with player level and currency
- Main illustrated background area (kingdom night theme)
- Separate building assets positioned in 3/4 perspective
- Persistent bottom interaction bar
Style:
- Dark cosmic royal theme
- Minimal stylized buildings
- Deep blue-black palette
- Gold accents only for upgrade buttons
- No bright colors
- Clean spacing
```

---

# 🌌 2️⃣ ADVENTURES SCREEN

## 📁 Fichiers

```
adventures_background_v1.png (2048x2048)
node_expedition.png (256x256)
node_dungeon.png
node_boss.png
```

---

## 🎨 Prompt Background

```id="prompt_adv_bg"
Dark cosmic map minimal stylized, night void background, subtle star field, faint cosmic dust, elegant minimal composition, mobile game background, no characters
```

---

## 🎯 Nodes

Expedition Node :

```id="prompt_node_exp"
Minimal glowing purple circular portal node, dark fantasy style, simple shape, soft glow, isolated asset
```

Dungeon Node :

```id="prompt_node_dungeon"
Minimal dark steel circular node, subtle glow, clean shape, isolated
```

Boss Node :

```id="prompt_node_boss"
Minimal red abyssal circular node, intense but controlled glow, dark fantasy style, isolated
```

---

# 🌠 3️⃣ SKILL TREE — CONSTELLATION

## 📁 Fichiers

```
skilltree_background_v1.png (2048x2048)
skill_node_locked.png (128x128)
skill_node_unlocked.png
skill_node_active.png
```

---

## 🎨 Prompt Background

```id="prompt_skill_bg"
Dark cosmic void background, deep black with subtle star field, minimal constellation lines faintly visible, elegant and clean, mobile game style
```

---

## 🎯 Skill Node

Locked :

```id="prompt_skill_locked"
Minimal circular node, dark grey with thin border, clean shape, no glow, isolated
```

Unlocked :

```id="prompt_skill_unlocked"
Minimal circular node glowing soft purple, subtle cosmic effect, isolated asset
```

Active :

```id="prompt_skill_active"
Minimal circular node bright white star glow, elegant, controlled glow, isolated asset
```

---

# ⚔ 4️⃣ COMBAT UI HEAVY — LAYOUT

Pas encore assets IA.
Ici on fait surtout Figma.

## 🧩 Figma Make Prompt

```id="figma_combat"
Create a mobile game combat UI screen for a dark fantasy idle RPG.
Layout:
- Top boss health bar large
- Center area for boss illustration
- Player stats panel subtle
- Bottom skill bar with 4 skill slots
Style:
- Heavy UI
- Dark theme
- Deep blacks and steel greys
- Gold for important buttons
- Purple reserved for cosmic bosses
- Clean spacing and readable typography
```

---

# 📦 STRUCTURE DOSSIERS RECOMMANDÉE

```
/assets
   /kingdom
   /adventures
   /skilltree
   /combat
/design
   idleking_designsystem.fig
```

---

# 🎯 WORKFLOW RECOMMANDÉ

1. Génère IA
2. Sélectionne meilleure variation
3. Repaint léger Photoshop
4. Exporte PNG master
5. Intègre dans Figma
6. Ajuste contraste mobile

---

# 🚨 RÈGLE IMPORTANTE

Tout asset IA doit être :

* Simplifié
* Nettoyé
* Moins détaillé
* Moins saturé

Mobile-first = lisibilité > beauté.


