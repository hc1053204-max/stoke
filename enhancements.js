(() => {
  'use strict';

  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const updateMotionMode = () => {
    root.classList.toggle('reduced-motion', reduceMotion.matches);
  };

  updateMotionMode();
  if (typeof reduceMotion.addEventListener === 'function') {
    reduceMotion.addEventListener('change', updateMotionMode);
  } else if (typeof reduceMotion.addListener === 'function') {
    reduceMotion.addListener(updateMotionMode);
  }

  const ensureToast = () => {
    let toast = document.getElementById('toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast';
      toast.className = 'toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      toast.setAttribute('aria-atomic', 'true');
      document.body.appendChild(toast);
    }
    return toast;
  };

  const showToastCompat = (msg) => {
    const toast = ensureToast();
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
      toast.classList.remove('show');
    }, 1800);
  };

  if (typeof window.notify === 'function') {
    const originalNotify = window.notify.bind(window);
    window.notify = (msg) => {
      showToastCompat(msg);
      return originalNotify(msg);
    };
  }

  document.addEventListener('DOMContentLoaded', () => {
    const toast = ensureToast();
    toast.setAttribute('aria-live', 'polite');
    toast.setAttribute('aria-atomic', 'true');
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      toast.style.transition = 'none';
    }
  });

  const saveState = () => {
    try {
      if (window.localStorage && window.localStorage.getItem) {
        const state = window.localStorage.getItem('front-office-tpbl-optimized-v1');
        if (state) {
          window.localStorage.setItem('front-office-tpbl-optimized-v1', state);
        }
      }
    } catch (error) {
      // ignore localStorage protection issues in private mode / restricted contexts
    }
  };

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      saveState();
    }
  });

  window.__stokeOptimize = {
    ensureToast,
    showToastCompat,
    saveState,
  };
})();
