# JARVIS — interface vocale

Interface web immersive pour un agent vocal ElevenLabs : un orbe 3D vivant qui réagit à la voix.

> Statut : **étape 2** — l'orbe seul, piloté par des volumes simulés (labo de test).
> L'intégration ElevenLabs, les sous-titres, la protection par mot de passe et le déploiement arrivent aux étapes suivantes.

## Lancer en local

```bash
cd jarvis
npm install
npm run dev
```

Ouvrir http://localhost:3000.

## Labo de l'orbe (étape 2)

- Boutons **Repos / Écoute / Réflexion / Parole** : forcer un état visuel.
- **Voix simulée automatique** : génère une enveloppe de voix réaliste (syllabes, mots, pauses) pour la personne qui parle dans l'état courant.
- En mode manuel, les curseurs règlent le volume micro (Écoute) et le volume agent (Parole).
- Toucher l'orbe passe à l'état suivant.
- Le compteur FPS en haut à droite sert à vérifier la fluidité sur téléphone.

## Architecture

```
src/
  app/                    routes Next.js (App Router)
  components/orb/         scène WebGL : orbe, halo, étoiles, bloom
    shaders.ts            GLSL (bruit simplex, fresnel, tourbillon, halo HUD)
    Orb.tsx               boucle de rendu : lissage des volumes + transitions d'état
    OrbCanvas.tsx         Canvas R3F, dpr limité, qualité selon l'appareil
    OrbStage.tsx          import client-only (pas de SSR pour WebGL)
  components/lab/         banc de test de l'étape 2
  hooks/                  reduced-motion, niveau de l'appareil, volumes simulés
  lib/orb/                types, thèmes de couleur, paramètres par état
```

- L'orbe lit une `VolumeSource` (`getInputVolume` / `getOutputVolume`) à chaque image — exactement l'interface du hook `useConversation` d'ElevenLabs, donc le simulateur et le SDK sont interchangeables.
- Les volumes sont lissés (attaque rapide, relâchement lent) et les paramètres de chaque état sont interpolés : aucune saccade lors des changements.
- Les thèmes de couleur sont isolés dans `lib/orb/themes.ts` pour en ajouter facilement.

## Performance et accessibilité

- `dpr` max 1.5 sur mobile, 2 sur ordinateur.
- Sur petit écran / tactile / peu de cœurs CPU : shader simplifié (1 octave de bruit, pas de recalcul des normales), géométrie plus légère, moins d'étoiles, pas de MSAA.
- `prefers-reduced-motion` : animation ralentie, déformations et pulsations atténuées, transitions d'interface coupées.
