// Utility function to normalize paths across different platforms
function normalizePath(path) {
    // Always use forward slashes for web URLs
    return path.replace(/\\/g, '/');
}

// Utility function to check browser compatibility
function checkBrowserCompatibility() {
    const issues = [];
    
    // Check Canvas support
    const canvas = document.createElement('canvas');
    const hasCanvas = !!(canvas.getContext && canvas.getContext('2d'));
    if (!hasCanvas) {
        issues.push('Canvas is not supported in your browser');
    }
    
    // Check Audio support
    const audio = document.createElement('audio');
    const hasAudio = !!(audio.canPlayType && audio.canPlayType('audio/mpeg;').replace(/no/, ''));
    if (!hasAudio) {
        issues.push('Audio is not supported in your browser');
    }
    
    // Check requestAnimationFrame support
    const hasRAF = !!(window.requestAnimationFrame);
    if (!hasRAF) {
        issues.push('Animation frame support is missing');
    }
    
    return {
        isCompatible: issues.length === 0,
        issues: issues
    };
}

window.gameUtils = {
    normalizePath,
    checkBrowserCompatibility
};