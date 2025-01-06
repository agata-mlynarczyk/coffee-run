class ResourceLoader {
    constructor() {
        this.resources = {
            images: {},
            audio: {}
        };
        this.loadingProgress = 0;
        this.totalResources = 0;
        this.loadedResources = 0;
        this.onProgress = null;
        this.imageList = [
            // Collectibles
            { name: 'coffee', src: 'assets/images/collectibles/coffee.png' },
            { name: 'paperclip', src: 'assets/images/collectibles/paperclip.png' },
            { name: 'stapler', src: 'assets/images/collectibles/stapler.png' },
            { name: 'notebook', src: 'assets/images/collectibles/notebook.png' },
            // Obstacles
            { name: 'cabinet', src: 'assets/images/obstacles/cabinet.png' },
            { name: 'chair', src: 'assets/images/obstacles/chair.png' },
            { name: 'monitor', src: 'assets/images/obstacles/monitor.png' },
            { name: 'printer', src: 'assets/images/obstacles/printer.png' }
        ];
        this.audioList = [
            { name: 'background', src: 'assets/audio/music/background.mp3', type: 'music' },
            { name: 'jump', src: 'assets/audio/sfx/jump.mp3', type: 'sfx' },
            { name: 'collect', src: 'assets/audio/sfx/collect.mp3', type: 'sfx' },
            { name: 'game_over', src: 'assets/audio/sfx/game_over.mp3', type: 'sfx' }
        ];
    }

    setProgressCallback(callback) {
        this.onProgress = callback;
    }

    updateProgress() {
        this.loadedResources = Math.min(this.loadedResources + 1, this.totalResources);
        this.loadingProgress = Math.min((this.loadedResources / this.totalResources) * 100, 100);
        if (this.onProgress) {
            this.onProgress(this.loadingProgress);
        }
    }

    async loadWithTimeout(promise, timeout = 5000) {
        let timeoutId;
        const timeoutPromise = new Promise((_, reject) => {
            timeoutId = setTimeout(() => {
                reject(new Error('Loading timed out'));
            }, timeout);
        });

        try {
            const result = await Promise.race([promise, timeoutPromise]);
            clearTimeout(timeoutId);
            return result;
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }

    async loadWithRetry(loadFn, retries = 2, timeout = 5000) {
        for (let i = 0; i <= retries; i++) {
            try {
                return await this.loadWithTimeout(loadFn(), timeout);
            } catch (error) {
                if (i === retries) throw error;
                console.warn(`Retry ${i + 1}/${retries} after error:`, error);
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    }

    createFallbackImage(name) {
        const canvas = document.createElement('canvas');
        canvas.width = 50;
        canvas.height = 50;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#' + Math.floor(Math.random()*16777215).toString(16);
        ctx.fillRect(0, 0, 50, 50);
        const fallbackImage = new Image();
        fallbackImage.src = canvas.toDataURL();
        this.resources.images[name] = fallbackImage;
        
        // Clean up
        canvas.remove();
        return fallbackImage;
    }

    async loadImage(name, src) {
        const loadSingleImage = () => new Promise((resolve, reject) => {
            const img = new Image();
            const cleanup = () => {
                img.onload = null;
                img.onerror = null;
            };

            img.onload = () => {
                cleanup();
                this.resources.images[name] = img;
                this.updateProgress();
                resolve(img);
            };

            img.onerror = () => {
                cleanup();
                reject(new Error(`Failed to load image: ${src}`));
            };

            img.src = src;
        });

        try {
            await this.loadWithRetry(() => loadSingleImage());
        } catch (error) {
            console.warn(`Failed to load image ${name} after retries:`, error);
            this.createFallbackImage(name);
            this.updateProgress();
        }
    }

    createSilentAudio() {
        const audio = new Audio();
        audio.volume = 0;
        return audio;
    }

    async loadAudio(name, src, type) {
        const loadSingleAudio = () => new Promise((resolve, reject) => {
            const audio = new Audio();
            const cleanup = () => {
                audio.oncanplaythrough = null;
                audio.onerror = null;
            };

            audio.oncanplaythrough = () => {
                cleanup();
                this.resources.audio[name] = audio;
                this.updateProgress();
                resolve(audio);
            };

            audio.onerror = () => {
                cleanup();
                reject(new Error(`Failed to load audio: ${src}`));
            };

            audio.src = src;
            audio.load();
        });

        try {
            await this.loadWithRetry(() => loadSingleAudio(), 2, 10000); // Longer timeout for audio
        } catch (error) {
            console.warn(`Failed to load audio ${name} after retries:`, error);
            // Create silent audio as fallback
            this.resources.audio[name] = this.createSilentAudio();
            this.updateProgress();
        }
    }

    async loadAll() {
        this.totalResources = this.imageList.length + this.audioList.length;
        this.loadedResources = 0;
        this.loadingProgress = 0;

        const imagePromises = this.imageList.map(img => 
            this.loadImage(img.name, img.src)
        );

        const audioPromises = this.audioList.map(audio => 
            this.loadAudio(audio.name, audio.src, audio.type)
        );

        await Promise.all([...imagePromises, ...audioPromises]);
        
        return {
            success: this.loadedResources === this.totalResources,
            totalLoaded: this.loadedResources,
            totalResources: this.totalResources
        };
    }

    getImage(name) {
        return this.resources.images[name];
    }

    getAudio(name) {
        return this.resources.audio[name];
    }

    // Create a dummy resource for testing
    createDummyResource(type, name) {
        if (type === 'image') {
            const canvas = document.createElement('canvas');
            canvas.width = 50;
            canvas.height = 50;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#' + Math.floor(Math.random()*16777215).toString(16);
            ctx.fillRect(0, 0, 50, 50);
            const img = new Image();
            img.src = canvas.toDataURL();
            this.resources.images[name] = img;
        } else if (type === 'audio') {
            const audio = new Audio();
            this.resources.audio[name] = audio;
        }
    }
}

// Create global instance when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.resourceLoader = new ResourceLoader();
});