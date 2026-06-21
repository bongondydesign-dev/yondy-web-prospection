# Yondy Web Prospection 🚀

Une application web sur mesure (CRM) conçue pour la gestion des prospects et la génération automatique de messages d'approche pertinents via intelligence artificielle (Gemini).

## Fonctionnalités Principales

- **Dashboard Analytique** : Suivez votre chiffre d'affaires, le taux de conversion de vos prospects, et visualisez la croissance mois par mois.
- **Gestion des Prospects (Suivi)** : Suivi en temps réel du statut de chaque client (À contacter, Contacté, Rendez-vous pris, Client, etc.).
- **Générateur de Messages IA** : Saisissez un extrait de texte ou une description, et l'IA (Google Gemini) se charge de comprendre votre cible et de générer un message d'accroche optimal.
- **Sécurité et Authentification** : Vos données sont sécurisées via Firebase Auth. Connexion disponible via Google ou Email/Mot de passe.

## Technologies Utilisées

- **Frontend** : React.js, TypeScript, Vite.js
- **Styling** : Tailwind CSS (v4)
- **Base de données** : Firebase Firestore
- **Authentification** : Firebase Auth
- **Intelligence Artificielle** : Google Gemini API (`@google/genai`)
- **Déploiement** : GitHub Pages (Automatisé avec GitHub Actions)

## Prérequis pour le développement local

1. Avoir [Node.js](https://nodejs.org/) installé.
2. Cloner ce dépôt.
3. Installer les dépendances :
   ```bash
   npm install
   ```

## Configuration Firebase & Gemini

L'application communique directement avec Firebase (base de données) et l'API Gemini.

1. Allez sur [Google AI Studio](https://aistudio.google.com/) et créez une clé API.
2. Éditez le fichier `src/gemini.ts` pour y insérer la clé d'API. (En production, préférez restreindre cette clé depuis Google Cloud Console).
3. Le projet Firebase est déjà configuré dans `src/firebase.ts`. Si vous voulez lier votre propre Firebase, mettez à jour la configuration.

## Démarrage (Local)

Pour lancer l'application en mode développement (sur le port 3003) :
```bash
npm run dev
```

## Déploiement

Ce projet inclut un fichier Workflow (`.github/workflows/deploy.yml`) qui re-déploie automatiquement l'application sur **GitHub Pages** à chaque fois qu'un commit est envoyé sur la branche `main`.

```bash
git add .
git commit -m "feat: votre message"
git push origin main
```
L'application sera visible publiquement sur l'URL de votre dépôt GitHub Pages.
