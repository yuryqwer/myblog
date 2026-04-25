function setCodeTheme(mode) {
    if (mode === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.removeAttribute('data-theme');
    }
}

document.addEventListener('DOMContentLoaded', function () {
    var toggleBtn = document.getElementById('dark-mode-toggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', function () {
            var currentMode = localStorage.getItem('theme-storage') || 'light';
            setCodeTheme(currentMode);
        });
    }
});

var savedTheme = localStorage.getItem("theme-storage") || "light";
setCodeTheme(savedTheme);