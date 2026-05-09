// App Shell Logic
function switchTab(viewId) {
  // Update views
  document.querySelectorAll('.view').forEach(view => {
    view.classList.remove('active');
  });
  const targetView = document.getElementById(viewId);
  if (targetView) {
    targetView.classList.add('active');
  }

  // Update nav tabs
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.classList.remove('active');
    if (tab.dataset.target === viewId) {
      tab.classList.add('active');
    }
  });
}

// Add event listeners to nav tabs
document.querySelectorAll('.nav-tab').forEach(tab => {
  tab.addEventListener('click', function(e) {
    // Ripple effect
    const ripple = document.createElement('div');
    ripple.classList.add('ripple-obj');
    const rect = this.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = e.clientX - rect.left - size / 2 + 'px';
    ripple.style.top = e.clientY - rect.top - size / 2 + 'px';
    this.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);

    const target = this.dataset.target;
    switchTab(target);
  });
});

// Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').then(reg => {
      console.log('SW registered:', reg);
    }).catch(err => console.log('SW registration failed:', err));
  });
}
