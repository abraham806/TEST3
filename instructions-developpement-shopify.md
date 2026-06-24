# Guide d'Architecture Dynamique et de Personnalisation Shopify

Ce document sert de référence technique obligatoire pour tous les développements personnalisés, sections, snippets et modèles de page (templates) au sein de cette boutique Shopify.

La philosophie centrale de l'architecture de cette boutique est **l'autonomie complète du marchand**. Le contenu codé en dur (hardcoded), les styles statiques ou les dimensions rigides sont strictement interdits. Chaque composant visuel et textuel doit être entièrement personnalisable directement depuis l'Éditeur de thème natif de Shopify (`schema`).

---

## 1. Principes Fondamentaux

1. **Aucun texte en dur :** Chaque titre, paragraphe, libellé de bouton, lien ou source d'image doit être extrait de manière dynamique à partir des paramètres (`settings`) ou des blocs (`blocks`).
2. **Style Dynamique (Variables CSS) :** Ne pas écrire de valeurs CSS statiques pour les couleurs, les espacements (padding/margin), les polices ou les dimensions. Utilisez des styles en ligne mappant dynamiquement les variables du schéma ou injectez du CSS personnalisé en utilisant le moteur de variables Liquid de Shopify.
3. **Responsive et Ajustable :** Les dimensions, les espacements, les alignements et les ajustements de mise en page doivent comporter des contrôles de schéma natifs (par exemple, des curseurs `range` pour les espacements, des bascules bureau/mobile).
4. **Architecture Basée sur les Blocs :** Pour les composants structurés (grilles, galeries, listes de fonctionnalités), utilisez des blocs de schéma répétitifs afin de permettre l'ajout, la suppression et le réordonnancement des éléments sans effort.

---

## 2. Structure Obligatoire du Schéma (`{% schema %}`)

Lors de la création ou de la modification de sections, le bloc Liquid `{% schema %}` doit explicitement couvrir les catégories de contrôle suivantes :

### A. Typographie & Contenu Textuel
Utilisez toujours des types de texte appropriés (`text`, `textarea`, `richtext`, `inline_richtext`) pour permettre une édition intuitive :
```json
{
  "type": "inline_richtext",
  "id": "heading",
  "label": "Texte du titre",
  "default": "Collection Vedette"
}
```

### B. Personnalisation des Couleurs
N'utilisez jamais de valeurs hexadécimales brutes dans vos fichiers de style. Liez les couleurs aux options du schéma en utilisant les types `color` ou `color_background` :
```json
{
  "type": "color",
  "id": "color_bg",
  "label": "Couleur de fond de la section",
  "default": "#ffffff"
}
```

### C. Dimensions & Espacements de Mise en Page
Utilisez des composants `range` (curseurs) pour permettre un ajustement fluide des hauteurs, largeurs et marges structurelles, à la fois pour les versions bureau (desktop) et mobile :
```json
{
  "type": "range",
  "id": "padding_top",
  "min": 0,
  "max": 100,
  "step": 4,
  "unit": "px",
  "label": "Espacement supérieur",
  "default": 36
}
```

---

## 3. Modèle d'Implémentation de Référence

### Structure Globale d'une Section Liquid
```liquid
{%- style -%}
  .custom-section-{{ section.id }} {
    background-color: {{ section.settings.color_bg }};
    color: {{ section.settings.color_text }};
    padding-top: {{ section.settings.padding_top_mobile }}px;
    padding-bottom: {{ section.settings.padding_bottom_mobile }}px;
  }

  @media screen and (min-width: 750px) {
    .custom-section-{{ section.id }} {
      padding-top: {{ section.settings.padding_top_desktop }}px;
      padding-bottom: {{ section.settings.padding_bottom_desktop }}px;
    }
  }
{%- endstyle -%}

<div class="custom-section-{{ section.id }} critical-layout-wrapper">
  <div class="page-width">
    {%- if section.settings.heading != blank -%}
      <h2 class="section-heading" style="font-size: {{ section.settings.heading_size }}px;">
        {{ section.settings.heading }}
      </h2>
    {%- endif -%}
    
    <div class="dynamic-content-grid">
      {%- for block in section.blocks -%}
        <div class="grid-item item-{{ block.id }}" {{ block.shopify_attributes }}>
          <!-- Contenu du bloc ici -->
        </div>
      {%- endfor %}
    </div>
  </div>
</div>
```

---

## 4. Liste de Vérification Qualité avant Déploiement
Avant de soumettre ou de valider une modification de code, vérifiez que :
- [ ] Aucune valeur hexadécimale brute (ex: #000000) n'est écrite en dur dans le CSS.
- [ ] Chaque chaîne de texte est entièrement modifiable via les paramètres du thème.
- [ ] Le composant est parfaitement fluide sur mobile et bureau sans coupure ni débordement de texte.
- [ ] La mise en page réagit correctement aux changements effectués en temps réel dans l'Éditeur de thème Shopify.