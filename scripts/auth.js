(function() {
    const token = localStorage.getItem('authToken');
    const isLoginPage = window.location.pathname.endsWith('login.html');

    if (!token && !isLoginPage) {
        window.location.href = 'login.html';
    }
})();