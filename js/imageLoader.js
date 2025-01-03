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
                console.log(`Loaded image: ${name}`);
                resolve(img);
            };
            img.onerror = (error) => {
                console.error(`Failed to load image: ${src}`, error);
                reject(new Error(`Failed to load image: ${src}`));
            };
            img.src = src;
            console.log(`Attempting to load image: ${name} from ${src}`);
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