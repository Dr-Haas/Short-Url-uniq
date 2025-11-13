const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

const TOKENS_FILE = path.join('/tmp', 'tokens.json');

// Fonction pour lire les tokens depuis le fichier
function readTokens() {
  try {
    if (fs.existsSync(TOKENS_FILE)) {
      const data = fs.readFileSync(TOKENS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Erreur lors de la lecture des tokens:', error);
  }
  return {};
}

// Fonction pour écrire les tokens dans le fichier
function writeTokens(tokens) {
  try {
    fs.writeFileSync(TOKENS_FILE, JSON.stringify(tokens, null, 2), 'utf8');
  } catch (error) {
    console.error('Erreur lors de l\'écriture des tokens:', error);
  }
}

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Gérer les requêtes OPTIONS (preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  // Extraire le token de l'URL
  const pathParts = event.path.split('/');
  const token = pathParts[pathParts.length - 1];

  // POST : Créer un nouveau lien unique
  if (event.httpMethod === 'POST') {
    try {
      const { target } = JSON.parse(event.body);

      if (!target || typeof target !== 'string') {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'URL cible requise' }),
        };
      }

      // Valider que c'est une URL valide
      try {
        new URL(target);
      } catch {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'URL invalide' }),
        };
      }

      // Générer un token unique
      const newToken = randomUUID();

      // Lire les tokens existants
      const tokens = readTokens();

      // Stocker le nouveau token
      tokens[newToken] = {
        target,
        views: 0,
        maxViews: 5,
        createdAt: new Date().toISOString(),
      };

      // Écrire les tokens
      writeTokens(tokens);

      // Construire l'URL complète du lien unique
      const baseUrl = event.headers.host || 'sello.dikio.fr';
      const protocol = event.headers['x-forwarded-proto'] || 'https';
      const oneTimeUrl = `${protocol}://${baseUrl}/.netlify/functions/one-time/${newToken}`;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          url: oneTimeUrl,
          token: newToken,
        }),
      };
    } catch (error) {
      console.error('Erreur lors de la création du lien:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Erreur lors de la création du lien' }),
      };
    }
  }

  // GET : Rediriger vers l'URL cible
  if (event.httpMethod === 'GET') {
    if (!token || token === 'one-time') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Token manquant' }),
      };
    }

    // Lire les tokens
    const tokens = readTokens();

    // Vérifier si le token existe
    if (!tokens[token]) {
      return {
        statusCode: 404,
        headers: { ...headers, 'Content-Type': 'text/html' },
        body: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <title>Lien expiré</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; text-align: center; padding: 50px; }
              h1 { color: #666; }
            </style>
          </head>
          <body>
            <h1>⏳ Lien expiré ou déjà utilisé</h1>
            <p>Ce lien unique a déjà été utilisé ou n'existe plus.</p>
          </body>
          </html>
        `,
      };
    }

    // Migration des anciens tokens (compatibilité)
    if (tokens[token].used && tokens[token].views === undefined) {
      tokens[token].views = tokens[token].maxViews || 5;
      tokens[token].maxViews = 5;
    }

    // Vérifier si le token a atteint le nombre maximum de vues
    if ((tokens[token].views || 0) >= (tokens[token].maxViews || 5)) {
      return {
        statusCode: 410,
        headers: { ...headers, 'Content-Type': 'text/html' },
        body: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <title>Lien déjà utilisé</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; text-align: center; padding: 50px; }
              h1 { color: #666; }
            </style>
          </head>
          <body>
            <h1>⏳ Lien expiré ou déjà utilisé</h1>
            <p>Ce lien unique a déjà été utilisé.</p>
          </body>
          </html>
        `,
      };
    }

    // Incrémenter le compteur de vues
    tokens[token].views = (tokens[token].views || 0) + 1;
    if (tokens[token].views === tokens[token].maxViews) {
      tokens[token].usedAt = new Date().toISOString();
    }
    writeTokens(tokens);

    // Rediriger vers l'URL cible
    return {
      statusCode: 302,
      headers: {
        Location: tokens[token].target,
      },
      body: '',
    };
  }

  // Méthode non supportée
  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({ error: 'Méthode non autorisée' }),
  };
};

