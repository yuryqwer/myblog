function setGiscusTheme(mode) {
    var giscusFrame = document.querySelector('iframe.giscus-frame');
    if (!giscusFrame) return;
    var giscusTheme = mode === 'dark' ? 'dark_high_contrast' : 'fro';
    giscusFrame.contentWindow.postMessage({
        giscus: { setConfig: { theme: giscusTheme } }
    }, 'https://giscus.app');
}

document.addEventListener('DOMContentLoaded', function() {
    var toggleBtn = document.getElementById('dark-mode-toggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', function() {
            var currentMode = localStorage.getItem('theme-storage') || 'light';
            setGiscusTheme(currentMode);
        });
    }
});