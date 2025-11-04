# short-code-uniq by resonanc-e

🔗 Générateur de liens à usage unique (one-time redirect) hébergé sur Netlify

## 📋 Description

Ce projet permet de créer des liens uniques qui ne peuvent être utilisés qu'une seule fois. Une fois le lien cliqué, il redirige vers l'URL cible et devient immédiatement invalide.

## 🛠️ Technologies

- **Frontend** : HTML/CSS/JavaScript vanilla
- **Backend** : Netlify Functions (serverless)
- **Stockage** : Fichier temporaire `/tmp/tokens.json` (filesystem éphémère de Netlify)

## 📁 Structure du projet

```
short-code-uniq/
├── netlify/
│   └── functions/
│       └── one-time.js      # Fonction serverless (POST pour créer, GET pour rediriger)
├── public/
│   └── index.html           # Interface utilisateur
├── netlify.toml             # Configuration Netlify
├── package.json             # Informations du projet
└── README.md                # Ce fichier
```

## 🚀 Déploiement

### Prérequis

- Compte Netlify
- Netlify CLI installé : `npm install -g netlify-cli`

### Étapes de déploiement

1. **Initialiser le projet Netlify** :
```bash
netlify init
```

2. **Déployer en production** :
```bash
netlify deploy --prod
```

Ou pour tester en local avant le déploiement :
```bash
netlify dev
```

## 🎯 Fonctionnalités

### Interface utilisateur

- ✅ Champ de saisie pour entrer une URL cible
- ✅ Bouton pour créer le lien unique
- ✅ Affichage du lien généré avec possibilité de copier
- ✅ Messages d'état (succès, erreur)
- ✅ Design minimaliste et responsive

### API / Netlify Function

- **POST** `/.netlify/functions/one-time` : Crée un nouveau lien unique
  - Body : `{ "target": "https://example.com" }`
  - Réponse : `{ "url": "...", "token": "..." }`

- **GET** `/.netlify/functions/one-time/:token` : Redirige vers l'URL cible
  - Redirection 302 si le token est valide et non utilisé
  - Message d'erreur si le token est expiré ou déjà utilisé

## 💡 Usage

1. Ouvrez l'interface web
2. Entrez l'URL cible
3. Cliquez sur "Créer le lien unique"
4. Copiez le lien généré et partagez-le
5. Le lien ne fonctionnera qu'une seule fois

## 📝 Notes

- Les tokens sont stockés dans `/tmp/tokens.json` (filesystem éphémère de Netlify)
- Les tokens ne persistent pas entre les redémarrages du serveur
- Aucune base de données externe requise

## 📄 Licence

MIT
