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
        this.loadedResources++;
        this.loadingProgress = (this.loadedResources / this.totalResources) * 100;
        if (this.onProgress) {
            this.onProgress(this.loadingProgress);
        }
    }

    async loadImage(name, src) {
        try {
            const img = new Image();
            await new Promise((resolve, reject) => {
                img.onload = () => {
                    this.resources.images[name] = img;
                    this.updateProgress();
                    resolve();
                };
                img.onerror = () => {
                    console.warn(`Failed to load image: ${src}`);
                    // Create a colored rectangle as fallback
                    const canvas = document.createElement('canvas');
                    canvas.width = 50;
                    canvas.height = 50;
                    const ctx = canvas.getContext('2d');
                    ctx.fillStyle = '#' + Math.floor(Math.random()*16777215).toString(16);
                    ctx.fillRect(0, 0, 50, 50);
                    const fallbackImage = new Image();
                    fallbackImage.src = canvas.toDataURL();
                    this.resources.images[name] = fallbackImage;
                    this.updateProgress();
                    resolve();
                };
                img.src = src;
            });
        } catch (error) {
            console.error(`Error loading image ${name}:`, error);
            this.updateProgress();
        }
    }

    async loadAudio(name, src, type) {
        try {
            const audio = new Audio();
            await new Promise((resolve, reject) => {
                audio.oncanplaythrough = () => {
                    this.resources.audio[name] = audio;
                    this.updateProgress();
                    resolve();
                };
                audio.onerror = () => {
                    console.warn(`Failed to load audio: ${src}`);
                    this.updateProgress();
                    resolve();
                };
                audio.src = src;
                audio.load();
            });
        } catch (error) {
            console.error(`Error loading audio ${name}:`, error);
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

// Create a global instance
window.resourceLoader = new ResourceLoader();