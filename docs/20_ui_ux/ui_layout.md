# UI LAYOUT — MVP

Version: Desktop First

---

# 1. STRUCTURE GLOBALE

Layout constant 3 colonnes:

╔══════════════════════════════════════════════════════╗
║  Sigil Royal — Idle King — Age I                    ║
╠══════════════╦═══════════════════════╦══════════════╣
║ Left Nav     ║ Main Window           ║ Right HUD    ║
╚══════════════╩═══════════════════════╩══════════════╝

---

# 2. LEFT NAV — GRIMOIRE

- Métal sombre
- Ligne verticale runique
- Onglet actif:
  - plaque dorée
  - glow interne
  - icône lumineuse

Entrées:
- Boto
- Personnage
- Inventaire
- Mondes
- Royaume
- Compétences
- Paramètres

---

# 3. MAIN WINDOW

Chaque écran contient:

- RunicHeader
  - sigil
  - titre
  - sous-titre

- Panel principal
- Panels secondaires (max 2-3 pour lisibilité)

Jamais plus de 3 zones majeures à l'écran (MVP règle).

---

# 4. RIGHT HUD

## 4.1 Progression
Deux médaillons:
- Player
- World

## 4.2 Villageois
- Total
- Barre stamina globale
- Fatigués

## 4.3 Ressources
- Liste scroll
- Catégories:
  - Récolte
  - Mine
  - Sacré

---

# 5. RÈGLES DE LISIBILITÉ

- Pas plus de 2 couleurs d’énergie visibles simultanément
- Chiffres alignés à droite
- Boutons principaux max 1 par panel
- Feedback immédiat pour toute action