(function() {
    const token = localStorage.getItem('authToken');
    const path = window.location.pathname;
    const isPublicPage = path.endsWith('login.html') || path.endsWith('cadastro.html') || path.endsWith('index.html');

    if (!token && !isPublicPage) {
        window.location.href = 'login.html';
    } else if (token && isPublicPage && path.endsWith('login.html')) {
        window.location.href = 'home.html';
    }
})();