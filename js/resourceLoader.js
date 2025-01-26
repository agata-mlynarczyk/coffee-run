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
        const normalizedSrc = window.gameUtils.normalizePath(src);
        console.log(`Attempting to load image: ${name} (${normalizedSrc})`);
        
        const loadSingleImage = () => new Promise((resolve, reject) => {
            const img = new Image();
            const cleanup = () => {
                img.onload = null;
                img.onerror = null;
            };

            img.onload = () => {
                cleanup();
                console.log(`Successfully loaded image: ${name} (${normalizedSrc})`);
                this.resources.images[name] = img;
                this.updateProgress();
                resolve(img);
            };

            img.onerror = (error) => {
                cleanup();
                console.error(`Failed to load image: ${name} (${normalizedSrc})`, error);
                console.log('Image load error details:', {
                    name,
                    src: normalizedSrc,
                    error,
                    browserInfo: navigator.userAgent
                });
                reject(new Error(`Failed to load image: ${normalizedSrc}`));
            };

            img.src = normalizedSrc;
        });

        try {
            await this.loadWithRetry(() => loadSingleImage());
        } catch (error) {
            console.warn(`Failed to load image ${name} after retries:`, error);
            this.createFallbackImage(name);
            this.updateProgress();
        }

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
        const normalizedSrc = window.gameUtils.normalizePath(src);
        const loadSingleAudio = () => new Promise((resolve, reject) => {
            const audio = new Audio();
            let loadTimeout;
            
            const cleanup = () => {
                audio.oncanplaythrough = null;
                audio.onloadeddata = null;
                audio.onerror = null;
                if (loadTimeout) {
                    clearTimeout(loadTimeout);
                }
            };

            const successHandler = () => {
                cleanup();
                console.log(`Successfully loaded audio: ${name} (${normalizedSrc})`);
                this.resources.audio[name] = audio;
                this.updateProgress();
                resolve(audio);
            };

            // Try multiple events for better cross-browser support
            audio.oncanplaythrough = successHandler;
            audio.onloadeddata = successHandler;

            audio.onerror = (error) => {
                cleanup();
                console.error(`Failed to load audio: ${name} (${normalizedSrc})`, error);
                console.log('Audio load error details:', {
                    name,
                    src: normalizedSrc,
                    error,
                    browserInfo: navigator.userAgent,
                    audioSupport: audio.canPlayType('audio/mpeg')
                });
                reject(new Error(`Failed to load audio: ${normalizedSrc}`));
            };

            // Set a timeout to resolve anyway if the audio seems to be working
            loadTimeout = setTimeout(() => {
                if (audio.readyState >= 2) { // HAVE_CURRENT_DATA or better
                    successHandler();
                }
            }, 3000);

            console.log(`Attempting to load audio: ${name} (${normalizedSrc})`);
            audio.preload = 'auto';  // Force preloading
            audio.src = normalizedSrc;
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
// Create global instance when DOM is ready
window.resourceLoader = new ResourceLoader();