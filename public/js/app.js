// ES Modules - app.js

// Fonctions utilitaires
export const getApiBaseUrl = () => {
  // Si on est en développement local, utiliser l'URL locale
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:8888/.netlify/functions/one-time';
  }
  // Sinon, utiliser l'URL de production
  return '/.netlify/functions/one-time';
};

// Fonction pour afficher une erreur
export const showError = (message, elements) => {
  const { result, resultTitle, resultUrl } = elements;
  result.classList.add('error');
  result.classList.add('show');
  resultTitle.textContent = '⚠️ Erreur';
  resultUrl.textContent = message;
};

// Fonction pour afficher le succès
export const showSuccess = (url, elements) => {
  const { result, resultTitle, resultUrl } = elements;
  result.classList.remove('error');
  result.classList.add('show');
  resultTitle.textContent = '✅ Lien généré avec succès !';
  resultUrl.textContent = url;
};

// Fonction pour afficher le toast de copie
export const showCopyToast = (toastElement) => {
  toastElement.classList.add('show');
  setTimeout(() => {
    toastElement.classList.remove('show');
  }, 2000);
};

// Fonction pour copier dans le presse-papiers
export const copyToClipboard = async (text, copyBtn, toastElement) => {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      
      // Animation sur le bouton
      copyBtn.classList.add('copied');
      const originalText = copyBtn.textContent;
      copyBtn.textContent = '✓ Copié !';
      
      setTimeout(() => {
        copyBtn.classList.remove('copied');
        copyBtn.textContent = originalText;
      }, 2000);
      
      // Afficher le toast
      showCopyToast(toastElement);
    } else {
      // Fallback pour les navigateurs sans support de Clipboard API
      fallbackCopy(text, copyBtn, toastElement);
    }
  } catch (error) {
    console.error('Erreur lors de la copie:', error);
    fallbackCopy(text, copyBtn, toastElement);
  }
};

// Fonction de fallback pour copier
const fallbackCopy = (text, copyBtn, toastElement) => {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.opacity = '0';
  textArea.style.left = '-9999px';
  document.body.appendChild(textArea);
  textArea.select();
  textArea.setSelectionRange(0, 99999); // Pour mobile
  
  try {
    const successful = document.execCommand('copy');
    if (successful) {
      copyBtn.classList.add('copied');
      const originalText = copyBtn.textContent;
      copyBtn.textContent = '✓ Copié !';
      
      setTimeout(() => {
        copyBtn.classList.remove('copied');
        copyBtn.textContent = originalText;
      }, 2000);
      
      showCopyToast(toastElement);
    } else {
      alert('Impossible de copier. Veuillez copier manuellement.');
    }
  } catch (err) {
    console.error('Erreur fallback copy:', err);
    alert('Impossible de copier. Veuillez copier manuellement.');
  }
  
  document.body.removeChild(textArea);
};

// Fonction principale pour créer le lien
export const createLink = async (targetUrl, elements) => {
  const { submitBtn, loading, result } = elements;
  
  // Désactiver le bouton et afficher le loading
  submitBtn.disabled = true;
  loading.classList.add('show');
  result.classList.remove('show');

  try {
    const response = await fetch(getApiBaseUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ target: targetUrl }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Erreur lors de la création du lien');
    }

    // Afficher le résultat
    showSuccess(data.url, elements);
    
    return data.url;
  } catch (error) {
    showError(error.message || 'Erreur lors de la création du lien', elements);
    throw error;
  } finally {
    submitBtn.disabled = false;
    loading.classList.remove('show');
  }
};

// Initialisation de l'application
const initApp = () => {
  // Récupérer les éléments DOM
  const form = document.getElementById('linkForm');
  const targetUrlInput = document.getElementById('targetUrl');
  const submitBtn = document.getElementById('submitBtn');
  const loading = document.getElementById('loading');
  const result = document.getElementById('result');
  const resultTitle = document.getElementById('resultTitle');
  const resultUrl = document.getElementById('resultUrl');
  const copyBtn = document.getElementById('copyBtn');
  const copyToast = document.getElementById('copyToast');

  const elements = {
    submitBtn,
    loading,
    result,
    resultTitle,
    resultUrl,
    copyBtn,
  };

  // Gérer la soumission du formulaire
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const targetUrl = targetUrlInput.value.trim();
    
    if (!targetUrl) {
      showError('Veuillez entrer une URL valide', elements);
      return;
    }

    try {
      await createLink(targetUrl, elements);
      // Réinitialiser le formulaire
      targetUrlInput.value = '';
    } catch (error) {
      // L'erreur est déjà gérée dans createLink
      console.error('Erreur:', error);
    }
  });

  // Gérer le clic sur le bouton copier
  copyBtn.addEventListener('click', () => {
    const urlToCopy = resultUrl.textContent;
    if (urlToCopy && !result.classList.contains('error')) {
      copyToClipboard(urlToCopy, copyBtn, copyToast);
    }
  });
};

// Démarrer l'application quand le DOM est prêt
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

