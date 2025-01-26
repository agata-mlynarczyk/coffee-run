// Get the mute button element
const muteButton = document.getElementById('muteButton');

// Update button icon based on mute state
function updateMuteButtonIcon(isMuted) {
    muteButton.textContent = isMuted ? '🔇' : '🔊';
}

// Add click event listener to mute button
muteButton.addEventListener('click', () => {
    const isMuted = window.audioManager.toggleMute();
    updateMuteButtonIcon(isMuted);
});