(function(){
  function showToast(message, type = ''){
    const layer = document.getElementById('toast-layer');
    if (!layer) return;
    const node = document.createElement('div');
    node.className = `toast ${type}`.trim();
    node.textContent = message;
    layer.appendChild(node);
    setTimeout(() => node.remove(), type === 'error' ? 4200 : 2600);
  }
  function showError(message){ showToast(message || 'Ошибка', 'error'); }
  window.APP_TOAST = { showToast, showError };
  window.showToast = showToast;
  window.showError = showError;
})();
