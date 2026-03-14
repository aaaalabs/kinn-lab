// Auth guard — redirects to /api/gate if no lab_auth cookie
(function () {
  if (!document.cookie.includes('lab_auth=')) {
    window.location.replace('/api/gate?dest=' + encodeURIComponent(window.location.pathname));
  }
})();
