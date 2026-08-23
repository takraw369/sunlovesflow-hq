(() => {
  'use strict';

  const nativeFetch = window.fetch.bind(window);

  window.fetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input?.url || '';
    const isHarnessFormSubmit = /\/api\/forms\/[^/]+\/submit(?:\?|$)/.test(url);

    if (!isHarnessFormSubmit || !window.liff) {
      return nativeFetch(input, init);
    }

    try {
      if (window.liff.ready) await window.liff.ready;
      const idToken = window.liff.isLoggedIn?.() ? window.liff.getIDToken?.() : null;
      if (!idToken) return nativeFetch(input, init);

      const headers = new Headers(init.headers || {});
      headers.set('Authorization', `Bearer ${idToken}`);
      return nativeFetch(input, { ...init, headers });
    } catch (error) {
      console.warn('Could not attach LIFF ID token', error);
      return nativeFetch(input, init);
    }
  };
})();
