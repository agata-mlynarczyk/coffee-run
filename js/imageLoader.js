class ImageLoader {
    constructor() {
        this.images = {};
        this.loadedImages = 0;
        this.totalImages = 0;
    }

    loadImage(name, src) {
        this.totalImages++;
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.images[name] = img;
                this.loadedImages++;
                resolve(img);
            };
            img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
            img.src = src;
        });
    }

    getImage(name) {
        return this.images[name];
    }

    async loadAllImages() {
        try {
            await Promise.all([
                this.loadImage('paperclip', 'assets/images/collectibles/paperclip.png'),
                // Add more images here as we get them
            ]);
            return true;
        } catch (error) {
            console.error('Error loading images:', error);
            return false;
        }
    }
}

// Create a global instance
window.imageLoader = new ImageLoader();