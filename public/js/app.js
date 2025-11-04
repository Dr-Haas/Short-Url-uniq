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
  const qrCodeContainer = document.getElementById('qrCodeContainer');
  result.classList.add('error');
  result.classList.add('show');
  resultTitle.textContent = '⚠️ Erreur';
  resultUrl.textContent = message;
  // Masquer le QR code en cas d'erreur
  if (qrCodeContainer) {
    qrCodeContainer.style.display = 'none';
  }
};

// Fonction pour afficher le succès
export const showSuccess = (url, elements) => {
  const { result, resultTitle, resultUrl } = elements;
  result.classList.remove('error');
  result.classList.add('show');
  resultTitle.textContent = '✅ Lien généré avec succès !';
  resultUrl.textContent = url;
  
  // Générer le QR code
  generateQRCode(url);
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

// Fonction pour générer le QR code
const generateQRCode = (url) => {
  const qrCodeContainer = document.getElementById('qrCodeContainer');
  const qrcodeDiv = document.getElementById('qrcode');
  
  if (!qrCodeContainer || !qrcodeDiv) return;
  
  // Vider le contenu précédent
  qrcodeDiv.innerHTML = '';
  
  // Attendre que la bibliothèque soit chargée (si elle n'est pas encore disponible)
  const tryGenerateQR = () => {
    if (typeof QRCode !== 'undefined') {
      try {
        new QRCode(qrcodeDiv, {
          text: url,
          width: 200,
          height: 200,
          colorDark: '#000000',
          colorLight: '#ffffff',
          correctLevel: QRCode.CorrectLevel.H
        });
        qrCodeContainer.style.display = 'block';
      } catch (error) {
        console.error('Erreur lors de la génération du QR code:', error);
      }
    } else {
      // Réessayer après un court délai si la bibliothèque n'est pas encore chargée
      setTimeout(tryGenerateQR, 100);
    }
  };
  
  tryGenerateQR();
};

// Fonction pour afficher un QR code depuis l'historique
export const showQRCodeFromHistory = (url) => {
  const result = document.getElementById('result');
  const resultTitle = document.getElementById('resultTitle');
  const resultUrl = document.getElementById('resultUrl');
  
  result.classList.remove('error');
  result.classList.add('show');
  resultTitle.textContent = '🔗 Lien depuis l\'historique';
  resultUrl.textContent = url;
  
  generateQRCode(url);
  
  // Scroll vers le résultat
  result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
};

// Gestion de l'historique avec localStorage
const STORAGE_KEY = 'short-code-uniq-history';
const MAX_HISTORY_ITEMS = 50;

// Sauvegarder un lien dans l'historique
export const saveToHistory = (url, targetUrl) => {
  try {
    let history = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    
    // Ajouter le nouveau lien en début de liste
    history.unshift({
      url,
      targetUrl,
      createdAt: new Date().toISOString()
    });
    
    // Limiter à MAX_HISTORY_ITEMS éléments
    if (history.length > MAX_HISTORY_ITEMS) {
      history = history.slice(0, MAX_HISTORY_ITEMS);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    renderHistory();
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de l\'historique:', error);
  }
};

// Récupérer l'historique
export const getHistory = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique:', error);
    return [];
  }
};

// Effacer l'historique
export const clearHistory = () => {
  if (confirm('Êtes-vous sûr de vouloir effacer tout l\'historique ?')) {
    localStorage.removeItem(STORAGE_KEY);
    renderHistory();
  }
};

// Afficher l'historique
export const renderHistory = () => {
  const historyList = document.getElementById('historyList');
  const history = getHistory();
  
  if (!historyList) return;
  
  if (history.length === 0) {
    historyList.innerHTML = '<div class="history-empty">Aucun lien dans l\'historique</div>';
    return;
  }
  
  historyList.innerHTML = history.map((item, index) => {
    const date = new Date(item.createdAt);
    const formattedDate = date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    return `
      <div class="history-item">
        <div class="history-item-url">${item.url}</div>
        <div class="history-item-date">${formattedDate}</div>
        <div class="history-item-actions">
          <button class="history-btn copy" data-url="${item.url}" data-action="copy">Copier</button>
          <button class="history-btn qr" data-url="${item.url}" data-action="qr">QR Code</button>
        </div>
      </div>
    `;
  }).join('');
  
  // Ajouter les event listeners
  historyList.querySelectorAll('.history-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const url = btn.getAttribute('data-url');
      const action = btn.getAttribute('data-action');
      
      if (action === 'copy') {
        const copyBtn = document.getElementById('copyBtn');
        const copyToast = document.getElementById('copyToast');
        copyToClipboard(url, copyBtn, copyToast);
      } else if (action === 'qr') {
        showQRCodeFromHistory(url);
      }
    });
  });
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
    
    // Sauvegarder dans l'historique
    saveToHistory(data.url, targetUrl);
    
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
  const clearHistoryBtn = document.getElementById('clearHistoryBtn');

  const elements = {
    submitBtn,
    loading,
    result,
    resultTitle,
    resultUrl,
    copyBtn,
  };

  // Afficher l'historique au chargement
  renderHistory();

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

  // Gérer le bouton effacer l'historique
  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener('click', clearHistory);
  }
};

// Démarrer l'application quand le DOM est prêt
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

