# JARVIS — interface vocale

Interface web immersive pour un agent vocal ElevenLabs : un orbe 3D vivant qui réagit à la voix.

Fonctionnalités : conversation vocale temps réel avec un agent ElevenLabs privé, orbe 3D réactif (Repos / Écoute / Réflexion / Parle), sous-titres, historique, indicateur d'état, messages d'erreur en français, accès protégé par mot de passe.

## Variables d'environnement

| Variable | Rôle |
| --- | --- |
| `ELEVENLABS_API_KEY` | Clé API ElevenLabs. **Serveur uniquement**, jamais envoyée au navigateur. |
| `ELEVENLABS_AGENT_ID` | ID de l'agent (`agent_...`), visible dans le tableau de bord ElevenLabs Agents. |
| `ACCESS_PASSWORD` | Mot de passe demandé à l'entrée de la page. Le changer déconnecte toutes les sessions. |

En local : copier `.env.example` vers `.env.local` et remplir les valeurs.

## Lancer en local

```bash
cd jarvis
npm install
cp .env.example .env.local   # puis remplir
npm run dev
```

Ouvrir http://localhost:3000 (le micro fonctionne sur `localhost` ou en HTTPS uniquement).

## Déploiement sur Vercel

1. Importer le dépôt GitHub dans Vercel.
2. **Root Directory : `jarvis`** (le dépôt contient aussi un thème Shopify à la racine).
3. Ajouter les 3 variables d'environnement ci-dessus (Production + Preview).
4. Déployer. Après toute modification d'une variable, relancer un déploiement (« Redeploy »).

## Fonctionnement

- `src/proxy.ts` protège toutes les pages et routes API : sans cookie de session valide → redirection vers `/login` (ou 401 pour l'API).
- Le cookie `jarvis_session` est `httpOnly`, `secure`, `sameSite=lax`, valable 30 jours ; il contient un HMAC du mot de passe (aucun état serveur).
- `POST /api/signed-url` appelle `GET /v1/convai/conversation/get-signed-url` d'ElevenLabs avec la clé côté serveur et renvoie l'URL signée ; le navigateur ouvre la conversation avec.
- `useJarvis` (hook) gère la session : demande du micro, URL signée, transcriptions, appels d'outils (état Réflexion), mode parole/écoute, erreurs.

## Labo de l'orbe (`/lab`)

- Boutons **Repos / Écoute / Réflexion / Parole** : forcer un état visuel.
- **Voix simulée automatique** : génère une enveloppe de voix réaliste (syllabes, mots, pauses) pour la personne qui parle dans l'état courant.
- En mode manuel, les curseurs règlent le volume micro (Écoute) et le volume agent (Parole).
- Toucher l'orbe passe à l'état suivant.
- Le compteur FPS en haut à droite sert à vérifier la fluidité sur téléphone.

## Architecture

```
src/
  proxy.ts                protection par mot de passe
  app/                    routes Next.js (App Router)
    api/signed-url        URL signée ElevenLabs (clé API côté serveur)
    api/login, api/logout session par cookie httpOnly
    login/                écran d'accès
    lab/                  banc de test de l'orbe
  components/jarvis/      interface : sous-titres, historique, état, contrôles
  hooks/useJarvis.ts      logique de conversation (SDK @elevenlabs/react)
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
