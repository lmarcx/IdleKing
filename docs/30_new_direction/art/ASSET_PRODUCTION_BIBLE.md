# 🛠️ IDLEKING — ASSET_PRODUCTION_BIBLE_V1

Status : DRAFT V1

Autorité :

SCRIPT
↓
ART_BIBLE
↓
CHARACTER_BIBLE
↓
BOSS_BIBLE
↓
ENVIRONMENT_BIBLE
↓
UI_BIBLE
↓
ASSET_PRODUCTION_BIBLE
↓
PROMPTS
↓
ASSETS

---

# Purpose

Ce document définit :

* les formats
* les tailles
* les conventions
* les pipelines

utilisés pour tous les assets du projet.

L'objectif est de garantir :

* cohérence
* réutilisabilité
* rapidité de production

---

# Production Philosophy

## Rule #1

Gameplay avant détail.

---

## Rule #2

Lisibilité avant réalisme.

---

## Rule #3

Silhouette avant texture.

---

## Rule #4

Animation avant quantité de pixels.

---

## Rule #5

La cohérence est plus importante que la qualité individuelle d'un asset.

---

# Sprite Standards

## Personnages

Format cible :

64x64

Style :

Pixel Art HD

Référence :

Death's Door

Objectif :

Reconnaissable instantanément.

---

## Boss

Format variable.

Les boss ne sont pas limités à 64x64.

Exemples :

### Allaeva

64x96

### Archimage

96x128

### Amalgame

256x256+

### Ombre du Dragon

512x512+

---

# Directional Animations

## Standard

8 directions

Obligatoire pour :

* joueur
* PNJ majeurs
* ennemis majeurs

---

# Animation Sets

## Joueur

* idle
* walk
* run
* attack
* skill
* hurt
* death
* interact

---

## PNJ

* idle
* walk
* interaction

---

## Boss

* idle
* move
* attack
* special
* phase
* defeat

---

# Animation Philosophy

Priorité :

Quantité de feedback.

Pas quantité de détails.

Objectif :

Gameplay lisible.

---

# Portrait Production

## Dialogue Portraits

Résolution :

1024x1024

Fond :

Transparent

Style :

Illustration stylisée

Références :

* Hades
* Death's Door

---

## Variantes

MVP :

1 portrait principal

Version future :

* neutre
* colère
* tristesse
* surprise

---

# Narrative Illustrations

## Format

1920x1080

## Usage

* ouverture chapitre
* fin chapitre
* scènes majeures

## Style

Illustration fixe

Légère animation optionnelle.

---

# Environment Production

## Philosophy

Mix :

Tiles modulaires
+
Landmarks uniques

---

## Tilesets

Utilisation :

* sols
* murs
* routes
* falaises

Réutilisables.

---

## Landmarks

Création unique.

Exemples :

* Mausolée
* Académie
* Time Gate
* Temple
* Kaléidoscope

---

# Props

## Style

Semi stylisé

Entre réalisme et stylisation.

---

## Catégories

### Nature

* arbres
* rochers
* racines
* glace

### Civilisation

* bancs
* colonnes
* statues
* torches

### Royaume

* forge
* banque
* forum
* temple

---

# VFX Philosophy

## Objectif

Lisibilité maximale.

---

## Priorités

1. Compréhension gameplay
2. Feedback impact
3. Ambiance

---

## Catégories

### Combat

* impacts
* coups critiques
* dégâts

### Skills

* projectiles
* zones
* buffs

### Monde

* poussière
* neige
* brouillard
* cendres

### Cosmique

* Fleuve
* Kaléidoscope
* Tobo
* Créa

---

# Loot Presentation

## Format

Petit modèle visuel.

Pas simple icône.

---

## Affichage

Objet flottant légèrement.

Glow discret.

---

# Equipment Philosophy

MVP :

Équipements non visibles.

Les objets existent :

* dans les statistiques
* dans l'inventaire
* dans les illustrations

Pas sur les sprites gameplay.

---

# UI Assets

## Matériaux

* verre sombre
* métal noir
* or ancien

---

## Couleurs

Primaire :

Or ancien

Secondaire :

Violet profond

Exception :

Cyan cosmique

---

# Asset Naming Convention

## Characters

char_[nom]_[type]

Exemple :

char_oldking_player

char_allaeva_boss

---

## Enemies

enemy_[nom]

Exemple :

enemy_shadow

enemy_specter

---

## Bosses

boss_[nom]

Exemple :

boss_amalgam_darkness

boss_allaeva

---

## Props

prop_[nom]

Exemple :

prop_statue_broken

prop_dead_tree

---

## VFX

vfx_[categorie]_[nom]

Exemple :

vfx_skill_fireball

vfx_hit_critical

---

# IA Production Pipeline

## Génération

GPT Image

Source principale.

---

## Workflow

1. Bible
2. Concept
3. Validation
4. Production
5. Intégration

---

## Interdiction

Ne jamais générer un asset directement sans référence aux bibles.

---

# MVP Priority List

Production dans cet ordre :

1. Vieux Roi

2. Billy

3. Tobo

4. Amalgame

5. Ombre du Dragon

6. Archimage

7. Allaeva

8. Kingdom

9. Terres Désolées

10. Ère Funèbre

11. Ère Glaciaire

12. HUD

13. Dialogues

14. Menus

15. Props

16. VFX

---

# Final Rule

Chaque asset produit doit répondre à trois questions :

Est-il lisible ?

Est-il cohérent avec le Monde Rêvé ?

Est-il immédiatement reconnaissable en jeu ?

Si une réponse est non,

l'asset doit être rejeté.
