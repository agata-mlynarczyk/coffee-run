class AudioManager {
    constructor() {
        this.sounds = {};
        this.backgroundMusic = null;
        this.isMuted = false;
        this.loadSounds();
    }

    loadSounds() {
        // Background music
        this.backgroundMusic = new Audio('assets/audio/music/background.mp3');
        this.backgroundMusic.loop = true;
        this.backgroundMusic.volume = 0.5;

        // Sound effects
        this.sounds = {
            jump: new Audio('assets/audio/sfx/jump.mp3'),
            collect: new Audio('assets/audio/sfx/collect.mp3'),
            gameOver: new Audio('assets/audio/sfx/game_over.mp3')
        };

        // Set volumes for sound effects
        Object.values(this.sounds).forEach(sound => {
            sound.volume = 0.7;
        });
    }

    playBackgroundMusic() {
        if (!this.isMuted && this.backgroundMusic) {
            // Some browsers require user interaction before playing audio
            this.backgroundMusic.play().catch(error => {
                console.warn('Could not play background music:', error);
            });
        }
    }

    stopBackgroundMusic() {
        if (this.backgroundMusic) {
            this.backgroundMusic.pause();
            this.backgroundMusic.currentTime = 0;
        }
    }

    playSound(name) {
        if (this.isMuted || !this.sounds[name]) return;

        // Clone the audio to allow overlapping sounds
        const sound = this.sounds[name].cloneNode();
        sound.play().catch(error => {
            console.warn(`Could not play ${name} sound:`, error);
        });
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.isMuted) {
            this.stopBackgroundMusic();
        } else {
            this.playBackgroundMusic();
        }
        return this.isMuted;
    }

    setMasterVolume(volume) {
        volume = Math.max(0, Math.min(1, volume));
        if (this.backgroundMusic) {
            this.backgroundMusic.volume = volume * 0.5;
        }
        Object.values(this.sounds).forEach(sound => {
            sound.volume = volume * 0.7;
        });
    }
}