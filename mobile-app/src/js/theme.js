(function () {
    // Check local storage or default to 'glacier'
    const savedTheme = localStorage.getItem('theme') || 'glacier';
    document.documentElement.setAttribute('data-theme', savedTheme);
})();
